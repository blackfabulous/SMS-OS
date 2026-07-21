import 'server-only'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface PaynowInitiateRequest {
  invoiceId?: string
  studentId: string
  amount: number
  currency: 'USD' | 'ZiG'
  returnUrl?: string
  resultUrl?: string
}

interface PaynowTransactionRecord {
  id: string
  invoiceId: string | null
  studentId: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'timedout'
  reference: string
  pollUrl: string | null
  paymentUrl: string
  createdAt: string
  updatedAt: string
}

const transactions: Map<string, PaynowTransactionRecord> = new Map()
const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY
const ZIG_RATE = 10.83

function generateReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `ZIM-${timestamp}-${random}`.toUpperCase()
}

function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

function computePaynowHash(fields: string[], integrationKey: string): string {
  return createHash('md5').update([...fields, integrationKey].join('')).digest('hex').toUpperCase()
}

export async function initiatePaynowTransaction(schoolId: string, userId: string, body: PaynowInitiateRequest) {
  const { invoiceId, studentId, amount, currency, returnUrl, resultUrl } = body

  if (!studentId || !amount || amount <= 0) throw new AppError('VALIDATION', 'Student ID and a valid amount are required')
  if (!Number.isFinite(amount)) throw new AppError('VALIDATION', 'Amount must be a valid number')

  const student = await db.student.findUnique({ where: { id: studentId, schoolId } })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  if (invoiceId) {
    const invoice = await db.feeInvoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found')
    if (invoice.studentId !== studentId) throw new AppError('VALIDATION', 'Invoice does not belong to this student')
    if (amount > Number(invoice.balance) + 0.01) throw new AppError('VALIDATION', `Payment of $${amount.toFixed(2)} exceeds outstanding balance of ${Number(invoice.balance).toFixed(2)}`)
  }

  const reference = generateReference()
  const transactionId = generateTransactionId()
  const paymentAmount = amount
  const displayAmount = currency === 'ZiG' ? `ZiG ${(paymentAmount * ZIG_RATE).toFixed(2)}` : `$${paymentAmount.toFixed(2)}`
  const usedReturnUrl = returnUrl || process.env.PAYNOW_RETURN_URL || ''
  const usedResultUrl = resultUrl || process.env.PAYNOW_RESULT_URL || ''

  if (PAYNOW_INTEGRATION_ID && PAYNOW_INTEGRATION_KEY) {
    try {
      const paynowFields: Record<string, string> = {
        id: PAYNOW_INTEGRATION_ID,
        reference,
        amount: paymentAmount.toFixed(2),
        additionalinfo: `School fee payment - ${student.firstName} ${student.lastName}`,
        resulturl: usedResultUrl,
        returnurl: usedReturnUrl,
        authemail: '',
      }
      paynowFields.hash = computePaynowHash([paynowFields.id, paynowFields.reference, paynowFields.amount, paynowFields.additionalinfo, paynowFields.resulturl, paynowFields.returnurl], PAYNOW_INTEGRATION_KEY)

      const response = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(paynowFields).toString(),
      })
      const responseData = Object.fromEntries(new URLSearchParams(await response.text()))

      if (responseData.status === 'Ok' || responseData.status === 'Sent') {
        const feePayment = await db.feePayment.create({
          data: {
            studentId,
            invoiceId: invoiceId || null,
            schoolId,
            receiptNumber: `RCT-${reference}`,
            amount: paymentAmount as any,
            paymentMethod: 'PAYNOW' as any,
            currency: currency as any,
            exchangeRate: currency === 'ZiG' ? ZIG_RATE : 1,
            reference,
          },
        })
        const paymentUrl = responseData.browserurl || `https://paynow.co.zw/payment/${reference}`
        const pollUrl = responseData.pollurl || responseData.pollUrl || null
        transactions.set(transactionId, { id: transactionId, invoiceId: invoiceId || null, studentId, amount: paymentAmount, currency, status: 'pending', reference, pollUrl, paymentUrl, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        logAudit({ action: 'CREATE', entity: 'paynow_payment', entityId: feePayment.id, schoolId }).catch(() => {})
        return { success: true, transactionId, reference, paymentUrl, pollUrl, amount: displayAmount, currency, feePaymentId: feePayment.id }
      }
      throw new AppError('INTERNAL', 'Paynow transaction failed', responseData.error || 'Unknown error')
    } catch (error) {
      if (isAppError(error)) throw error
      throw new AppError('INTERNAL', 'Failed to communicate with Paynow')
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new AppError('INTERNAL', 'Paynow credentials are not configured. Set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY.')
  }

  const paymentUrl = `https://paynow.co.zw/payment/${reference}`
  const feePayment = await db.feePayment.create({
    data: {
      studentId,
      invoiceId: invoiceId || null,
      schoolId,
      receiptNumber: `RCT-${reference}`,
      amount: paymentAmount as any,
      paymentMethod: 'PAYNOW' as any,
      currency: currency as any,
      exchangeRate: currency === 'ZiG' ? ZIG_RATE : 1,
      reference,
    },
  })

  transactions.set(transactionId, { id: transactionId, invoiceId: invoiceId || null, studentId, amount: paymentAmount, currency, status: 'pending', reference, pollUrl: null, paymentUrl, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })

  setTimeout(async () => {
    const txn = transactions.get(transactionId)
    if (txn && txn.status === 'pending') {
      const isSuccess = Math.random() > 0.2
      txn.status = isSuccess ? 'paid' : 'failed'
      txn.updatedAt = new Date().toISOString()
      transactions.set(transactionId, txn)

      if (isSuccess && txn.invoiceId) {
        try {
          const invoice = await db.feeInvoice.findUnique({ where: { id: txn.invoiceId } })
          if (invoice) {
            const newAmountPaid = Number(invoice.amountPaid) + txn.amount
            const newBalance = Number(invoice.totalAmount) - newAmountPaid
            await db.feeInvoice.update({
              where: { id: txn.invoiceId },
              data: { amountPaid: newAmountPaid as any, balance: Math.max(0, newBalance) as any, status: newBalance <= 0 ? 'PAID' : 'PARTIAL' as any },
            })
          }
        } catch {}
      }
    }
  }, 5000)

  logAudit({ action: 'CREATE', entity: 'paynow_payment', entityId: feePayment.id, schoolId }).catch(() => {})
  return { success: true, transactionId, reference, paymentUrl, pollUrl: null, amount: displayAmount, currency, feePaymentId: feePayment.id, demo: true }
}

export function handlePaynowError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
