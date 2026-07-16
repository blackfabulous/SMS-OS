import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth } from '@/lib/api-auth'

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

// In-memory transaction store
const transactions: Map<string, PaynowTransactionRecord> = new Map()

const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY

function generateReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `ZIM-${timestamp}-${random}`.toUpperCase()
}

function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

function computePaynowHash(fields: string[], integrationKey: string): string {
  const hashString = [...fields, integrationKey].join('')
  return createHash('md5').update(hashString).digest('hex').toUpperCase()
}

export async function POST(request: NextRequest) {
  // Authentication required — payment initiation must be by an authenticated user
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body: PaynowInitiateRequest = await request.json()
    const { invoiceId, studentId, amount, currency, returnUrl, resultUrl } = body

    if (!studentId || !amount || amount <= 0) {
      return fail('VALIDATION', 'Student ID and a valid amount are required')
    }

    // Validate amount is a finite positive number
    if (!Number.isFinite(amount)) {
      return fail('VALIDATION', 'Amount must be a valid number')
    }

    // Verify student belongs to caller's school
    const student = await db.student.findUnique({
      where: { id: studentId, schoolId: session.user.schoolId },
    })
    if (!student) {
      return fail('NOT_FOUND', 'Student not found')
    }

    if (invoiceId) {
      const invoice = await db.feeInvoice.findUnique({ where: { id: invoiceId } })
      if (!invoice) {
        return fail('NOT_FOUND', 'Invoice not found')
      }
      if (invoice.studentId !== studentId) {
        return fail('VALIDATION', 'Invoice does not belong to this student')
      }
      // Validate payment does not exceed invoice balance
      if (amount > invoice.balance + 0.01) {
        return fail('VALIDATION', `Payment of $${amount.toFixed(2)} exceeds outstanding balance of ${invoice.balance.toFixed(2)}`)
      }
    }

    const reference = generateReference()
    const transactionId = generateTransactionId()
    const zigRate = 10.83
    const paymentAmount = amount
    const displayAmount = currency === 'ZiG'
      ? `ZiG ${(paymentAmount * zigRate).toFixed(2)}`
      : `$${paymentAmount.toFixed(2)}`

    const usedReturnUrl = returnUrl || process.env.PAYNOW_RETURN_URL || ''
    const usedResultUrl = resultUrl || process.env.PAYNOW_RESULT_URL || ''

    // ─── Live Paynow flow ────────────────────────────────────────────────────
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

        // Compute a proper MD5 hash per Paynow API specification
        paynowFields.hash = computePaynowHash(
          [paynowFields.id, paynowFields.reference, paynowFields.amount, paynowFields.additionalinfo, paynowFields.resulturl, paynowFields.returnurl],
          PAYNOW_INTEGRATION_KEY
        )

        const paynowUrl = 'https://www.paynow.co.zw/interface/initiatetransaction'
        const response = await fetch(paynowUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(paynowFields).toString(),
        })

        const responseText = await response.text()
        const responseData = Object.fromEntries(new URLSearchParams(responseText))

        if (responseData.status === 'Ok' || responseData.status === 'Sent') {
          const feePayment = await db.feePayment.create({
            data: {
              studentId,
              invoiceId: invoiceId || null,
              schoolId: session.user.schoolId,
              receiptNumber: `RCT-${reference}`,
              amount: paymentAmount,
              paymentMethod: 'PAYNOW',
              currency,
              exchangeRate: currency === 'ZiG' ? zigRate : 1,
              reference,
            },
          })

          const paymentUrl = responseData.browserurl || `https://paynow.co.zw/payment/${reference}`
          const pollUrl = responseData.pollurl || responseData.pollUrl || null

          transactions.set(transactionId, {
            id: transactionId, invoiceId: invoiceId || null, studentId, amount: paymentAmount, currency,
            status: 'pending', reference, pollUrl, paymentUrl,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          })

          logAudit({ action: 'CREATE', entity: 'paynow_payment', entityId: feePayment.id }).catch(() => {})
          return ok({ success: true, transactionId, reference, paymentUrl, pollUrl, amount: displayAmount, currency, feePaymentId: feePayment.id })
        } else {
          return fail('INTERNAL', 'Paynow transaction failed', responseData.error || 'Unknown error')
        }
      } catch (error) {
        logger.error({ err: error }, 'Paynow API error')
        return fail('INTERNAL', 'Failed to communicate with Paynow')
      }
    }

    // ─── Demo / development mode (only when credentials are NOT configured) ─
    if (process.env.NODE_ENV === 'production') {
      return fail('INTERNAL', 'Paynow credentials are not configured. Set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY.')
    }

    const paymentUrl = `https://paynow.co.zw/payment/${reference}`

    const feePayment = await db.feePayment.create({
      data: {
        studentId,
        invoiceId: invoiceId || null,
        schoolId: session.user.schoolId,
        receiptNumber: `RCT-${reference}`,
        amount: paymentAmount,
        paymentMethod: 'PAYNOW',
        currency,
        exchangeRate: currency === 'ZiG' ? zigRate : 1,
        reference,
      },
    })

    transactions.set(transactionId, {
      id: transactionId, invoiceId: invoiceId || null, studentId, amount: paymentAmount, currency,
      status: 'pending', reference, pollUrl: null, paymentUrl,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    // Simulate payment completion after delay — dev mode only
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
              const newAmountPaid = invoice.amountPaid + txn.amount
              const newBalance = invoice.totalAmount - newAmountPaid
              await db.feeInvoice.update({
                where: { id: txn.invoiceId },
                data: {
                  amountPaid: newAmountPaid,
                  balance: Math.max(0, newBalance),
                  status: newBalance <= 0 ? 'PAID' : 'PARTIAL',
                },
              })
            }
          } catch {
            // Silently handle invoice update errors in demo mode
          }
        }
      }
    }, 5000)

    logAudit({ action: 'CREATE', entity: 'paynow_payment', entityId: feePayment.id }).catch(() => {})
    return ok({
      success: true,
      transactionId,
      reference,
      paymentUrl,
      pollUrl: null,
      amount: displayAmount,
      currency,
      feePaymentId: feePayment.id,
      demo: true,
    })
  } catch (error) {
    logger.error({ err: error }, 'Paynow initiation error')
    return fail('INTERNAL', 'Internal server error')
  }
}
