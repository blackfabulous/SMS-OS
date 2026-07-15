import 'server-only'
import { db } from '@/lib/db'
import type { Currency, PaymentMethod } from '@prisma/client'
import { logAudit } from '@/lib/audit'
import { notifyStudentGuardian } from '@/lib/notifications'
import { AppError } from '@/lib/errors'
import { toBaseAmount } from '@/lib/finance-calc'
import { getSetting } from '@/lib/settings'
import type { CreatePaymentInput } from '@/lib/validations'
import {
  createPayment,
  findPayment,
  listPayments,
  reversePaymentById,
  type PaymentWithRelations,
} from '@/server/repositories/payment'

export async function createPaymentWithDefaults(
  schoolId: string,
  data: CreatePaymentInput,
  receiptNumber: string,
): Promise<PaymentWithRelations> {
  if (data.paymentMethod) {
    const allowed = (await getSetting(schoolId, 'finance.paymentMethods')) as string[]
    if (!allowed.includes(data.paymentMethod.toUpperCase())) {
      throw new AppError(
        'VALIDATION',
        `Payment method "${data.paymentMethod}" is not enabled`,
        { allowed },
      )
    }
  }

  const student = await db.student.findUnique({
    where: { id: data.studentId, schoolId },
    select: { id: true },
  })
  if (!student) {
    throw new AppError('NOT_FOUND', 'Student not found')
  }

  const amount = data.amount
  const baseAmount = toBaseAmount(amount, data.exchangeRate)

  if (data.invoiceId) {
    const invoice = await db.feeInvoice.findUnique({
      where: { id: data.invoiceId, schoolId },
    })
    if (!invoice) {
      throw new AppError('NOT_FOUND', 'Invoice not found')
    }
    if (baseAmount > invoice.balance + 0.01) {
      throw new AppError(
        'VALIDATION',
        `Payment of $${baseAmount.toFixed(2)} (base) exceeds outstanding balance of $${invoice.balance.toFixed(2)}`,
      )
    }
  }

  const payment = await createPayment(
    schoolId,
    {
      receiptNumber,
      studentId: data.studentId,
      invoiceId: data.invoiceId || null,
      parentId: data.parentId || null,
      amount,
      paymentMethod: (data.paymentMethod || 'CASH') as PaymentMethod,
      currency: (data.currency || 'USD') as Currency,
      exchangeRate: data.exchangeRate || 1,
      reference: data.reference || null,
    },
    data.invoiceId ? baseAmount : undefined,
  )

  logAudit({ action: 'CREATE', entity: 'payments', entityId: payment.id, afterValue: payment }).catch(() => {})

  void notifyStudentGuardian(schoolId, data.studentId, (studentName) => ({
    type: 'payment.received',
    studentName,
    amount,
    currency: data.currency || 'USD',
    receiptNumber: payment.receiptNumber,
  })).catch(() => {})

  return payment
}

export { findPayment, listPayments, reversePaymentById, type PaymentWithRelations }
