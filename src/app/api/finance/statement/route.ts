import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { buildStatement } from '@/lib/statement'

/**
 * GET /api/finance/statement?studentId=...
 * Returns a chronological fee statement (invoices vs payments, running balance)
 * for a student. Tenant-scoped. ADMIN/BURSAR/TEACHER.
 */
export async function GET(request: Request) {
  const result = await requireContext({ roles: ['ADMIN', 'BURSAR', 'TEACHER', 'SUPER_ADMIN'] })
  if ('error' in result) return result.error
  const { ctx } = result

  const studentId = new URL(request.url).searchParams.get('studentId')
  if (!studentId) return fail('VALIDATION', 'studentId is required')

  const student = await db.student.findFirst({
    where: { id: studentId, schoolId: ctx.schoolId },
    select: { id: true, firstName: true, lastName: true, studentNumber: true },
  })
  if (!student) return fail('NOT_FOUND', 'Student not found')

  const [invoices, payments] = await Promise.all([
    db.feeInvoice.findMany({
      where: { studentId },
      select: { invoiceNumber: true, createdAt: true, totalAmount: true },
    }),
    db.feePayment.findMany({
      where: { studentId },
      select: { receiptNumber: true, createdAt: true, amount: true, currency: true, exchangeRate: true, paymentMethod: true, isReversed: true },
    }),
  ])

  const statement = buildStatement(invoices, payments)

  try {
    return ok({
      student: { id: student.id, name: `${student.firstName} ${student.lastName}`, studentNumber: student.studentNumber },
      statement,
    })
  } catch (error) {
    logger.error({ err: error }, 'Error generating finance statement')
    return fail('INTERNAL', 'Failed to generate statement')
  }
}
