import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { reversePaymentById } from '@/server/repositories/payment'
import { getSetting } from '@/lib/settings'
import { applyLateFee, applyPayment, round2 } from '@/lib/finance-calc'
import { buildStatement } from '@/lib/statement'
import { allocateBeamCoverage } from '@/lib/beam'
import { notifyStudentGuardiansBatch } from '@/lib/notifications'
import type { CreateInvoiceInput } from '@/lib/validations'

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

export async function generateInvoiceNumber(schoolId: string) {
  const currentYear = new Date().getFullYear()
  const lastInvoice = await db.feeInvoice.findFirst({
    where: { schoolId, invoiceNumber: { startsWith: `INV${currentYear}` } },
    orderBy: { invoiceNumber: 'desc' },
  })
  const sequence = lastInvoice ? parseInt(lastInvoice.invoiceNumber.slice(-3)) + 1 : 1
  return `INV${currentYear}${sequence.toString().padStart(3, '0')}`
}

export async function listInvoices(
  schoolId: string,
  scope: { where: Record<string, unknown>; staff: boolean },
  filters: { status?: string; studentId?: string; termId?: string; page: number; limit: number },
) {
  const where: Record<string, unknown> = { ...scope.where }
  if (filters.status) where.status = filters.status as any
  if (scope.staff && filters.studentId) where.studentId = filters.studentId
  if (filters.termId) where.termId = filters.termId

  const [data, total] = await Promise.all([
    db.feeInvoice.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        term: { include: { academicYear: true } },
        items: true,
        payments: {
          include: { parent: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    db.feeInvoice.count({ where }),
  ])

  return { data, total, page: filters.page, totalPages: Math.ceil(total / filters.limit) }
}

export async function createInvoice(schoolId: string, data: { studentId: string; termId: string; dueDate?: string; items: { description: string; amount: number; feeType: string }[] }) {
  const student = await db.student.findUnique({
    where: { id: data.studentId, schoolId },
    select: { id: true },
  })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const invoiceNumber = await generateInvoiceNumber(schoolId)
  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0)

  const invoice = await db.feeInvoice.create({
    data: {
      invoiceNumber,
      studentId: data.studentId,
      termId: data.termId,
      schoolId,
      totalAmount: totalAmount as any,
      amountPaid: 0 as any,
      balance: totalAmount as any,
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
      status: 'PENDING' as any,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          amount: item.amount as any,
          feeType: item.feeType,
          schoolId,
        })),
      },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      items: true,
    },
  })

  logAudit({ action: 'CREATE', entity: 'invoices', entityId: invoice.id, schoolId, afterValue: invoice }).catch(() => {})
  return invoice
}

export async function updateInvoice(schoolId: string, id: string, updates: { status?: any; dueDate?: string }) {
  const existing = await db.feeInvoice.findUnique({
    where: { id, student: { schoolId } },
    select: { id: true },
  })
  if (!existing) throw new AppError('NOT_FOUND', 'Invoice not found')

  const invoice = await db.feeInvoice.update({
    where: { id },
    data: {
      status: updates.status,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      items: true,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'invoices', entityId: invoice.id, schoolId, afterValue: invoice }).catch(() => {})
  return invoice
}

export async function deleteInvoice(schoolId: string, id: string) {
  const invoice = await db.feeInvoice.findUnique({
    where: { id, student: { schoolId } },
  })
  if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found')
  if (Number(invoice.amountPaid) > 0) throw new AppError('CONFLICT', 'Cannot delete invoice with payments')

  await db.$transaction([db.invoiceItem.deleteMany({ where: { invoiceId: id } }), db.feeInvoice.delete({ where: { id } })])

  logAudit({ action: 'DELETE', entity: 'invoices', entityId: id, schoolId }).catch(() => {})
  return { message: 'Invoice deleted successfully' }
}

export async function getStudentStatement(schoolId: string, studentId: string) {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true, firstName: true, lastName: true, studentNumber: true },
  })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

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

  const statement = buildStatement(
    invoices.map((i) => ({ invoiceNumber: i.invoiceNumber, createdAt: i.createdAt, totalAmount: Number(i.totalAmount) })),
    payments.map((p) => ({
      receiptNumber: p.receiptNumber,
      createdAt: p.createdAt,
      amount: Number(p.amount),
      currency: p.currency,
      exchangeRate: p.exchangeRate ? Number(p.exchangeRate) : null,
      paymentMethod: p.paymentMethod,
      isReversed: p.isReversed,
    })),
  )

  return {
    student: { id: student.id, name: `${student.firstName} ${student.lastName}`, studentNumber: student.studentNumber },
    statement,
  }
}

export async function previewLateFees(schoolId: string) {
  const penaltyPct = await getSetting(schoolId, 'finance.lateFeePenaltyPct')
  const eligible = await db.feeInvoice.count({
    where: {
      schoolId,
      status: { in: ['PENDING', 'PARTIAL'] as any },
      balance: { gt: 0 },
      dueDate: { lt: new Date() },
      lateFeeApplied: false,
    },
  })
  return { penaltyPct, eligible }
}

export async function applyLateFees(schoolId: string) {
  const penaltyPct = await getSetting(schoolId, 'finance.lateFeePenaltyPct')
  if (penaltyPct <= 0) return { applied: 0, totalPenalty: 0, message: 'No late-fee penalty is configured.' }

  const overdue = await db.feeInvoice.findMany({
    where: {
      schoolId,
      status: { in: ['PENDING', 'PARTIAL'] as any },
      balance: { gt: 0 },
      dueDate: { lt: new Date() },
      lateFeeApplied: false,
    },
    select: { id: true, studentId: true, totalAmount: true, balance: true },
  })

  if (overdue.length === 0) return { applied: 0, totalPenalty: 0, message: 'No eligible overdue invoices.' }

  let totalPenalty = 0
  const notify: { studentId: string; balance: number }[] = []
  const ops = overdue.map((inv) => {
    const newBalance = applyLateFee(Number(inv.balance), penaltyPct)
    const penalty = round2(newBalance - Number(inv.balance))
    totalPenalty = round2(totalPenalty + penalty)
    notify.push({ studentId: inv.studentId, balance: newBalance })
    return db.feeInvoice.update({
      where: { id: inv.id },
      data: {
        balance: newBalance as any,
        totalAmount: round2(Number(inv.totalAmount) + penalty) as any,
        lateFeeApplied: true,
      },
    })
  })

  await db.$transaction(ops)

  const currency = await getSetting(schoolId, 'finance.baseCurrency')
  void notifyStudentGuardiansBatch(
    schoolId,
    notify.map((n) => ({
      studentId: n.studentId,
      eventFactory: (studentName: string) => ({ type: 'fee.overdue' as any, studentName, balance: n.balance, currency } as any),
    })),
  ).catch(() => {})

  logAudit({
    action: 'UPDATE',
    entity: 'finance.late-fees',
    entityId: schoolId,
    schoolId,
    afterValue: { applied: overdue.length, totalPenalty, penaltyPct },
  }).catch(() => {})

  return { applied: overdue.length, totalPenalty, penaltyPct }
}

export async function applyBeamCoverage(schoolId: string, studentId: string) {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true, beamApplication: true },
  })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const beam = student.beamApplication
  if (!beam) throw new AppError('NOT_FOUND', 'No BEAM application for this student')
  if (beam.status !== 'APPROVED') throw new AppError('CONFLICT', `BEAM application is ${beam.status}, not APPROVED`)
  if (beam.coverageAppliedAt) throw new AppError('CONFLICT', 'BEAM coverage has already been applied')
  if (Number(beam.coveredAmount) <= 0) throw new AppError('VALIDATION', 'BEAM coverage amount is zero')

  const invoices = await db.feeInvoice.findMany({
    where: { studentId, balance: { gt: 0 }, status: { in: ['PENDING', 'PARTIAL'] as any } },
    select: { id: true, balance: true, dueDate: true, totalAmount: true, amountPaid: true },
  })

  const { allocations, totalApplied, leftover } = allocateBeamCoverage(Number(beam.coveredAmount), invoices.map((i) => ({ id: i.id, balance: Number(i.balance), dueDate: i.dueDate })))

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
          schoolId,
          amount: a.applied as any,
          paymentMethod: 'BEAM' as any,
          currency: 'USD' as any,
          reference: beam.socialWelfareRef || 'BEAM coverage',
        },
      })
      await tx.feeInvoice.update({
        where: { id: a.invoiceId },
        data: applyPayment({ totalAmount: Number(inv.totalAmount), amountPaid: Number(inv.amountPaid) }, a.applied) as any,
      })
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: a.invoiceId,
          schoolId,
          amount: a.applied as any,
        },
      })
    }
    await tx.beamApplication.update({
      where: { studentId: student.id },
      data: { coverageAppliedAt: new Date(), outstandingBalance: round2(Number(beam.coveredAmount) - totalApplied) as any },
    })
  })

  logAudit({
    action: 'CREATE',
    entity: 'finance.beam-apply',
    entityId: student.id,
    schoolId,
    afterValue: { totalApplied, invoices: allocations.length },
  }).catch(() => {})

  return { applied: allocations.length, totalApplied, leftover }
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
