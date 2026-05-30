import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { getSetting } from '@/lib/settings'
import { applyLateFee, round2 } from '@/lib/finance-calc'

/**
 * GET /api/finance/late-fees
 * Preview: how many overdue invoices are eligible and the configured penalty.
 */
export async function GET() {
  const auth = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in auth) return auth.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  const penaltyPct = await getSetting(tenant.schoolId, 'finance.lateFeePenaltyPct')
  const eligible = await db.feeInvoice.count({
    where: {
      student: { schoolId: tenant.schoolId },
      status: { in: ['PENDING', 'PARTIAL'] },
      balance: { gt: 0 },
      dueDate: { lt: new Date() },
      lateFeeApplied: false,
    },
  })
  return NextResponse.json({ penaltyPct, eligible })
}

/**
 * POST /api/finance/late-fees
 * Applies the configured `finance.lateFeePenaltyPct` to every overdue, unpaid
 * invoice that has not already been penalised. Idempotent via `lateFeeApplied`.
 */
export async function POST() {
  const auth = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in auth) return auth.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  const penaltyPct = await getSetting(tenant.schoolId, 'finance.lateFeePenaltyPct')
  if (penaltyPct <= 0) {
    return NextResponse.json({ applied: 0, totalPenalty: 0, message: 'No late-fee penalty is configured.' })
  }

  const overdue = await db.feeInvoice.findMany({
    where: {
      student: { schoolId: tenant.schoolId },
      status: { in: ['PENDING', 'PARTIAL'] },
      balance: { gt: 0 },
      dueDate: { lt: new Date() },
      lateFeeApplied: false,
    },
    select: { id: true, totalAmount: true, balance: true },
  })

  if (overdue.length === 0) {
    return NextResponse.json({ applied: 0, totalPenalty: 0, message: 'No eligible overdue invoices.' })
  }

  let totalPenalty = 0
  const ops = overdue.map((inv) => {
    const newBalance = applyLateFee(inv.balance, penaltyPct)
    const penalty = round2(newBalance - inv.balance)
    totalPenalty = round2(totalPenalty + penalty)
    return db.feeInvoice.update({
      where: { id: inv.id },
      data: {
        balance: newBalance,
        totalAmount: round2(inv.totalAmount + penalty),
        lateFeeApplied: true,
      },
    })
  })

  await db.$transaction(ops)

  logAudit({
    action: 'UPDATE',
    entity: 'finance.late-fees',
    entityId: tenant.schoolId,
    afterValue: { applied: overdue.length, totalPenalty, penaltyPct },
  }).catch(() => {})

  return NextResponse.json({ applied: overdue.length, totalPenalty, penaltyPct })
}
