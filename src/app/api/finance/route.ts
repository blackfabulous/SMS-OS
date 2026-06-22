import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'

export async function GET() {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult
    const invoicedResult = await db.feeInvoice.aggregate({ where: { student: { schoolId } }, _sum: { totalAmount: true } })
    const totalInvoiced = Number(invoicedResult._sum.totalAmount ?? 0)

    const collectedResult = await db.feeInvoice.aggregate({ where: { student: { schoolId } }, _sum: { amountPaid: true } })
    const totalCollected = Number(collectedResult._sum.amountPaid ?? 0)

    const outstandingResult = await db.feeInvoice.aggregate({ where: { student: { schoolId } }, _sum: { balance: true } })
    const totalOutstanding = Number(outstandingResult._sum.balance ?? 0)

    const debtorCount = await db.feeInvoice.groupBy({ by: ['studentId'], where: { student: { schoolId } }, having: { balance: { _sum: { gt: 0 } } } })

    const recentPayments = await db.feePayment.findMany({
      where: { student: { schoolId } },
      take: 10, orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const pendingCount = await db.feeInvoice.count({ where: { status: 'PENDING', student: { schoolId } } })
    const partialCount = await db.feeInvoice.count({ where: { status: 'PARTIAL', student: { schoolId } } })
    const paidCount = await db.feeInvoice.count({ where: { status: 'PAID', student: { schoolId } } })
    const overdueCount = await db.feeInvoice.count({ where: { status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: new Date() }, student: { schoolId } } })

    const paymentsByMethod = await db.feePayment.groupBy({ by: ['paymentMethod'], where: { student: { schoolId } }, _sum: { amount: true }, _count: true })

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentPaymentsForTrend = await db.feePayment.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, isReversed: false, student: { schoolId } },
      select: { amount: true, createdAt: true },
    })

    const monthlyTrend: Record<string, number> = {}
    for (const payment of recentPaymentsForTrend) {
      const monthKey = payment.createdAt.toISOString().slice(0, 7)
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + payment.amount
    }

    return NextResponse.json({
      totalInvoiced, totalCollected, totalOutstanding,
      debtorCount: debtorCount.length, recentPayments,
      invoiceStatusBreakdown: { pending: pendingCount, partial: partialCount, paid: paidCount, overdue: overdueCount },
      paymentsByMethod, monthlyCollectionTrend: monthlyTrend,
      collectionRate: totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0',
    })
  } catch (error) {
    console.error('Error fetching financial dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch financial dashboard' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id, ...updates } = body

    if (action === 'reversePayment' && id) {
      const payment = await db.feePayment.update({
        where: { id },
        data: { isReversed: true },
        include: { student: { select: { firstName: true, lastName: true } }, invoice: true },
      })

      // Reverse the invoice update
      if (payment.invoiceId && payment.invoice) {
        const newAmountPaid = payment.invoice.amountPaid - payment.amount
        const newBalance = payment.invoice.totalAmount - newAmountPaid
        let newStatus = 'PENDING'
        if (newBalance <= 0) newStatus = 'PAID'
        else if (newAmountPaid > 0) newStatus = 'PARTIAL'

        await db.feeInvoice.update({
          where: { id: payment.invoiceId },
          data: { amountPaid: Math.max(0, newAmountPaid), balance: Math.max(0, newBalance), status: newStatus },
        })
      }

      logAudit({ action: 'UPDATE', entity: 'finance', entityId: (payment as any)?.id, afterValue: payment }).catch(() => {})
      return NextResponse.json(payment)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating finance record:', error)
    return NextResponse.json({ error: 'Failed to update finance record' }, { status: 500 })
  }
}
