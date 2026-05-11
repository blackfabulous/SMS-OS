import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Total invoiced
    const invoicedResult = await db.feeInvoice.aggregate({
      _sum: { totalAmount: true },
    })
    const totalInvoiced = invoicedResult._sum.totalAmount || 0

    // Total collected (amount paid on invoices)
    const collectedResult = await db.feeInvoice.aggregate({
      _sum: { amountPaid: true },
    })
    const totalCollected = collectedResult._sum.amountPaid || 0

    // Total outstanding
    const outstandingResult = await db.feeInvoice.aggregate({
      _sum: { balance: true },
    })
    const totalOutstanding = outstandingResult._sum.balance || 0

    // Debtor count (students with outstanding balance)
    const debtorCount = await db.feeInvoice.groupBy({
      by: ['studentId'],
      having: {
        balance: { _sum: { gt: 0 } },
      },
    })

    // Recent payments
    const recentPayments = await db.feePayment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Invoice status breakdown
    const pendingCount = await db.feeInvoice.count({
      where: { status: 'PENDING' },
    })
    const partialCount = await db.feeInvoice.count({
      where: { status: 'PARTIAL' },
    })
    const paidCount = await db.feeInvoice.count({
      where: { status: 'PAID' },
    })
    const overdueCount = await db.feeInvoice.count({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
    })

    // Payment method breakdown
    const paymentsByMethod = await db.feePayment.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
      _count: true,
    })

    // Monthly collection trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const recentPaymentsForTrend = await db.feePayment.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        isReversed: false,
      },
      select: {
        amount: true,
        createdAt: true,
      },
    })

    // Group by month
    const monthlyTrend: Record<string, number> = {}
    for (const payment of recentPaymentsForTrend) {
      const monthKey = payment.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + payment.amount
    }

    return NextResponse.json({
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      debtorCount: debtorCount.length,
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
    })
  } catch (error) {
    console.error('Error fetching financial dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial dashboard' },
      { status: 500 }
    )
  }
}
