import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { logAudit } from '@/lib/audit'
import { allocateBeamCoverage } from '@/lib/beam'
import { applyPayment, round2 } from '@/lib/finance-calc'

/**
 * POST /api/finance/beam/apply  body: { studentId }
 * Posts an APPROVED BEAM coverage amount across a student's outstanding invoices
 * (oldest-due first) as BEAM payments. Idempotent via BeamApplication.coverageAppliedAt.
 * ADMIN/BURSAR.
 */
export async function POST(request: Request) {
  const result = await requireContext({ roles: ['ADMIN', 'BURSAR', 'SUPER_ADMIN'] })
  if ('error' in result) return result.error
  const { ctx } = result

  let body: { studentId?: string }
  try { body = await request.json() } catch { return fail('VALIDATION', 'Invalid JSON body') }
  if (!body.studentId) return fail('VALIDATION', 'studentId is required')

  // Tenant guard + load the BEAM application.
  const student = await db.student.findFirst({
    where: { id: body.studentId, schoolId: ctx.schoolId },
    select: { id: true, beamApplication: true },
  })
  if (!student) return fail('NOT_FOUND', 'Student not found')

  const beam = student.beamApplication
  if (!beam) return fail('NOT_FOUND', 'No BEAM application for this student')
  if (beam.status !== 'APPROVED') return fail('CONFLICT', `BEAM application is ${beam.status}, not APPROVED`)
  if (beam.coverageAppliedAt) return fail('CONFLICT', 'BEAM coverage has already been applied')
  if (beam.coveredAmount <= 0) return fail('VALIDATION', 'BEAM coverage amount is zero')

  const invoices = await db.feeInvoice.findMany({
    where: { studentId: student.id, balance: { gt: 0 }, status: { in: ['PENDING', 'PARTIAL'] } },
    select: { id: true, balance: true, dueDate: true, totalAmount: true, amountPaid: true },
  })

  const { allocations, totalApplied, leftover } = allocateBeamCoverage(beam.coveredAmount, invoices)

  const year = new Date().getFullYear()
  const byId = new Map(invoices.map((i) => [i.id, i]))

  await db.$transaction(async (tx) => {
    let seq = 0
    for (const a of allocations) {
      const inv = byId.get(a.invoiceId)!
      seq += 1
      const payment = await tx.feePayment.create({
        data: {
          receiptNumber: `BEAM${year}${Date.now().toString(36).toUpperCase()}${seq}`,
          studentId: student.id,
          invoiceId: a.invoiceId,
          schoolId: ctx.schoolId,
          amount: a.applied,
          paymentMethod: 'BEAM',
          currency: 'USD',
          reference: beam.socialWelfareRef || 'BEAM coverage',
        },
      })
      await tx.feeInvoice.update({
        where: { id: a.invoiceId },
        data: applyPayment({ totalAmount: inv.totalAmount, amountPaid: inv.amountPaid }, a.applied),
      })
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: a.invoiceId,
          schoolId: ctx.schoolId,
          amount: a.applied,
        },
      })
    }
    await tx.beamApplication.update({
      where: { studentId: student.id },
      data: { coverageAppliedAt: new Date(), outstandingBalance: round2(beam.coveredAmount - totalApplied) },
    })
  })

  logAudit({ action: 'CREATE', entity: 'finance.beam-apply', entityId: student.id, afterValue: { totalApplied, invoices: allocations.length } }).catch(() => {})

  try {
    return ok({ applied: allocations.length, totalApplied, leftover })
  } catch (error) {
    logger.error({ err: error }, 'Error applying BEAM coverage')
    return fail('INTERNAL', 'Failed to apply BEAM coverage')
  }
}
