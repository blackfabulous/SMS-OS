import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { reversePaymentById } from '@/server/repositories/payment'

export async function getFinancialDashboard(schoolId: string) {
  const [
    invoicedResult,
    collectedResult,
    outstandingResult,
    debtorResult,
    recentPayments,
    pendingCount,
    partialCount,
    paidCount,
    overdueCount,
    paymentsByMethodRaw,
  ] = await Promise.all([
    db.feeInvoice.aggregate({ where: { schoolId }, _sum: { totalAmount: true } }),
    db.feeInvoice.aggregate({ where: { schoolId }, _sum: { amountPaid: true } }),
    db.feeInvoice.aggregate({ where: { schoolId }, _sum: { balance: true } }),
    db.feeInvoice.groupBy({
      by: ['studentId'],
      where: { schoolId },
      having: { balance: { _sum: { gt: 0 } } },
    }),
    db.feePayment.findMany({
      where: { schoolId, isReversed: false },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    db.feeInvoice.count({ where: { status: 'PENDING', schoolId } }),
    db.feeInvoice.count({ where: { status: 'PARTIAL', schoolId } }),
    db.feeInvoice.count({ where: { status: 'PAID', schoolId } }),
    db.feeInvoice.count({ where: { status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: new Date() }, schoolId } }),
    db.feePayment.groupBy({
      by: ['paymentMethod'],
      where: { schoolId },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const totalInvoiced = Number(invoicedResult._sum.totalAmount ?? 0)
  const totalCollected = Number(collectedResult._sum.amountPaid ?? 0)
  const totalOutstanding = Number(outstandingResult._sum.balance ?? 0)

  const paymentsByMethod = paymentsByMethodRaw.map((g) => ({
    ...g,
    _sum: { amount: Number(g._sum.amount ?? 0) },
  }))

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recentPaymentsForTrend = await db.feePayment.findMany({
    where: { createdAt: { gte: sixMonthsAgo }, isReversed: false, schoolId },
    select: { amount: true, createdAt: true },
  })

  const monthlyTrend: Record<string, number> = {}
  for (const payment of recentPaymentsForTrend) {
    const monthKey = payment.createdAt.toISOString().slice(0, 7)
    monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + Number(payment.amount)
  }

  return {
    totalInvoiced,
    totalCollected,
    totalOutstanding,
    debtorCount: debtorResult.length,
    recentPayments,
    invoiceStatusBreakdown: {
      pending: pendingCount,
      partial: partialCount,
      paid: paidCount,
      overdue: overdueCount,
    },
    paymentsByMethod,
    monthlyCollectionTrend: monthlyTrend,
    collectionRate: totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0',
  }
}

export async function reverseFinancePayment(schoolId: string, paymentId: string) {
  const payment = await reversePaymentById(schoolId, paymentId)
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found')

  logAudit({ action: 'UPDATE', entity: 'finance', entityId: payment.id, schoolId, afterValue: payment }).catch(() => {})
  return payment
}

export function handleFinanceError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
