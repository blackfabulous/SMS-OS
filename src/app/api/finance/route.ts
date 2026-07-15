import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import type { InvoiceStatus } from '@prisma/client'

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

    const paymentsByMethodRaw = await db.feePayment.groupBy({ by: ['paymentMethod'], where: { student: { schoolId } }, _sum: { amount: true }, _count: true })
    // _sum returns Decimal — coerce to number so the JSON response stays numeric.
    const paymentsByMethod = paymentsByMethodRaw.map((g) => ({ ...g, _sum: { amount: Number(g._sum.amount ?? 0) } }))

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentPaymentsForTrend = await db.feePayment.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, isReversed: false, student: { schoolId } },
      select: { amount: true, createdAt: true },
    })

    const monthlyTrend: Record<string, number> = {}
    for (const payment of recentPaymentsForTrend) {
      const monthKey = payment.createdAt.toISOString().slice(0, 7)
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + Number(payment.amount)
    }

    return ok({
      totalInvoiced, totalCollected, totalOutstanding,
      debtorCount: debtorCount.length, recentPayments,
      invoiceStatusBreakdown: { pending: pendingCount, partial: partialCount, paid: paidCount, overdue: overdueCount },
      paymentsByMethod, monthlyCollectionTrend: monthlyTrend,
      collectionRate: totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0',
    })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching financial dashboard')
    return fail('INTERNAL', 'Failed to fetch financial dashboard')
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id, ...updates } = body

    if (action === 'reversePayment' && id) {
      const payment = await db.$transaction(async (tx: any) => {
        const p = await tx.feePayment.update({
          where: { id },
          data: { isReversed: true },
          include: { student: { select: { firstName: true, lastName: true } }, invoice: true },
        })

        if (p.invoiceId && p.invoice) {
          const allocations = await tx.paymentAllocation.findMany({
            where: { paymentId: id },
            select: { amount: true },
          })
          const allocated = allocations.reduce((sum: number, a: { amount: number }) => sum + a.amount, 0)
          await tx.paymentAllocation.deleteMany({ where: { paymentId: id } })

          const newAmountPaid = Math.max(0, p.invoice.amountPaid - allocated)
          const newBalance = Math.max(0, p.invoice.totalAmount - newAmountPaid)
          let newStatus: InvoiceStatus = 'PENDING'
          if (newBalance <= 0) newStatus = 'PAID'
          else if (newAmountPaid > 0) newStatus = 'PARTIAL'

          await tx.feeInvoice.update({
            where: { id: p.invoiceId },
            data: { amountPaid: newAmountPaid, balance: newBalance, status: newStatus },
          })
        }

        return p
      })

      logAudit({ action: 'UPDATE', entity: 'finance', entityId: (payment as any)?.id, afterValue: payment }).catch(() => {})
      return NextResponse.json(payment)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating finance record:', error)
    return NextResponse.json({ error: 'Failed to update finance record' }, { status: 500 })
  }
}
