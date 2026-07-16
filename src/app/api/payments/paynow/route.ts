import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth } from '@/lib/api-auth'

// ─── Paynow Payment Gateway Integration ─────────────────────────────────────
// Production-ready structure with mock responses when env vars are not set.
// Set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY for live usage.

interface PaynowInitRequest {
  studentId: string
  studentName: string
  amount: number
  currency: 'USD' | 'ZiG'
  paymentMethod: 'ecocash' | 'onemoney' | 'card'
  phone?: string
  email?: string
  description?: string
}

interface PaynowTransaction {
  id: string
  studentId: string
  studentName: string
  amount: number
  currency: string
  paymentMethod: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'timedout'
  reference: string
  pollUrl: string | null
  redirectUrl: string | null
  phone: string | null
  email: string | null
  description: string
  createdAt: string
  updatedAt: string
}

// In-memory transaction store (in production, use database)
const transactions: Map<string, PaynowTransaction> = new Map()

const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY
const PAYNOW_RESULT_URL = process.env.PAYNOW_RESULT_URL || ''
const PAYNOW_RETURN_URL = process.env.PAYNOW_RETURN_URL || ''

function generateReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `ZIM-${timestamp}-${random}`.toUpperCase()
}

function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

// ─── POST: Initiate Paynow Payment ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const body: PaynowInitRequest = await request.json()
    const { studentId, studentName, amount, currency, paymentMethod, phone, email, description } = body

    if (!studentId || !amount || amount <= 0) {
      logAudit({ action: 'CREATE', entity: 'paynow' }).catch(() => {})
      return fail('VALIDATION', 'Student ID and a valid amount are required')
    }

    const reference = generateReference()
    const transactionId = generateTransactionId()

    // If Paynow credentials are configured, make real API call
    if (PAYNOW_INTEGRATION_ID && PAYNOW_INTEGRATION_KEY) {
      try {
        const isMobile = paymentMethod === 'ecocash' || paymentMethod === 'onemoney'

        const paynowPayload: Record<string, string> = {
          id: PAYNOW_INTEGRATION_ID,
          reference,
          amount: amount.toFixed(2),
          additionalinfo: description || `School fee payment for ${studentName}`,
          resulturl: PAYNOW_RESULT_URL,
          returnurl: PAYNOW_RETURN_URL,
          authemail: email || '',
        }

        // Mobile money specific
        if (isMobile && phone) {
          paynowPayload.phone = phone
          paynowPayload.method = paymentMethod === 'ecocash' ? 'ecocash' : 'onemoney'
        }

        const paynowUrl = isMobile
          ? 'https://www.paynow.co.zw/interface/mobile/express'
          : 'https://www.paynow.co.zw/interface/initiatetransaction'

        // Generate hash (simplified - production should use proper HMAC)
        const hashString = [
          paynowPayload.id,
          paynowPayload.reference,
          paynowPayload.amount,
          paynowPayload.additionalinfo,
          paynowPayload.resulturl,
          paynowPayload.returnurl,
          isMobile && phone ? paynowPayload.phone : '',
          PAYNOW_INTEGRATION_KEY,
        ].join('')

        paynowPayload.hash = createHash('md5').update(hashString).digest('hex').toUpperCase()

        const response = await fetch(paynowUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(paynowPayload).toString(),
        })

        const responseText = await response.text()
        const responseData = Object.fromEntries(new URLSearchParams(responseText))

        if (responseData.status === 'Ok' || responseData.status === 'Sent') {
          const transaction: PaynowTransaction = {
            id: transactionId,
            studentId,
            studentName,
            amount,
            currency,
            paymentMethod,
            status: 'pending',
            reference,
            pollUrl: responseData.pollurl || responseData.pollUrl || null,
            redirectUrl: responseData.browserurl || null,
            phone: phone || null,
            email: email || null,
            description: description || `School fee payment for ${studentName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          transactions.set(transactionId, transaction)

          logAudit({ action: 'CREATE', entity: 'paynow' }).catch(() => {})
          return ok({
            transactionId,
            reference,
            status: transaction.status,
            pollUrl: transaction.pollUrl,
            redirectUrl: transaction.redirectUrl,
            // For mobile money, include instructions
            instructions: isMobile ? `Dial *153# to confirm your ${paymentMethod} payment` : undefined,
          })
        } else {
          logAudit({ action: 'CREATE', entity: 'paynow' }).catch(() => {})
          return fail('INTERNAL', 'Paynow transaction failed', responseData.error || 'Unknown error')
        }
      } catch (error) {
        logger.error({ err: error }, 'Paynow API error')
        return fail('INTERNAL', 'Failed to communicate with Paynow')
      }
    }

    // Mock response when Paynow credentials are not configured
    const transaction: PaynowTransaction = {
      id: transactionId,
      studentId,
      studentName,
      amount,
      currency,
      paymentMethod,
      status: 'pending',
      reference,
      pollUrl: `https://www.paynow.co.zw/interface/poll/${transactionId}`,
      redirectUrl: `https://www.paynow.co.zw/payment/${transactionId}`,
      phone: phone || null,
      email: email || null,
      description: description || `School fee payment for ${studentName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    transactions.set(transactionId, transaction)

    // Simulate payment completion after a short delay (demo mode)
    setTimeout(() => {
      const txn = transactions.get(transactionId)
      if (txn && txn.status === 'pending') {
        // 80% chance of success in demo
        txn.status = Math.random() > 0.2 ? 'paid' : 'failed'
        txn.updatedAt = new Date().toISOString()
        transactions.set(transactionId, txn)
      }
    }, 5000)

    logAudit({ action: 'CREATE', entity: 'paynow' }).catch(() => {})
    return ok({
      transactionId,
      reference,
      status: 'pending',
      pollUrl: transaction.pollUrl,
      redirectUrl: transaction.redirectUrl,
      instructions: paymentMethod === 'ecocash'
        ? 'Demo Mode: Dial *153# to confirm EcoCash payment'
        : paymentMethod === 'onemoney'
          ? 'Demo Mode: Dial *111# to confirm OneMoney payment'
          : 'Demo Mode: You will be redirected to card payment page',
      demo: true,
    })
  } catch (error) {
    logger.error({ err: error }, 'Paynow initiation error')
    return fail('INTERNAL', 'Internal server error')
  }
}

// ─── GET: Check Payment Status ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get('transactionId')

  if (!transactionId) {
    return fail('VALIDATION', 'transactionId query parameter is required')
  }

  const transaction = transactions.get(transactionId)
  if (!transaction) {
    return fail('NOT_FOUND', 'Transaction not found')
  }

  // If Paynow credentials are set and pollUrl exists, poll Paynow
  if (PAYNOW_INTEGRATION_ID && PAYNOW_INTEGRATION_KEY && transaction.pollUrl) {
    try {
      const pollResponse = await fetch(transaction.pollUrl)
      const pollText = await pollResponse.text()
      const pollData = Object.fromEntries(new URLSearchParams(pollText))

      if (pollData.status === 'Paid') {
        transaction.status = 'paid'
        transaction.updatedAt = new Date().toISOString()
      } else if (pollData.status === 'Cancelled') {
        transaction.status = 'cancelled'
        transaction.updatedAt = new Date().toISOString()
      } else if (pollData.status === 'TimedOut') {
        transaction.status = 'timedout'
        transaction.updatedAt = new Date().toISOString()
      }

      transactions.set(transactionId, transaction)
    } catch {
      // If poll fails, return current local status
    }
  }

  return ok({
    transactionId: transaction.id,
    reference: transaction.reference,
    studentId: transaction.studentId,
    studentName: transaction.studentName,
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  })
}
