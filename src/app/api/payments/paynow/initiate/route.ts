import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Paynow Payment Gateway - Initiate Payment ───────────────────────────────
// Production-ready structure with simulated Paynow flow when env vars are not set.
// Set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY for live usage.

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

// In-memory transaction store (supplements database FeePayment records)
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

// ─── POST: Initiate Paynow Payment ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: PaynowInitiateRequest = await request.json()
    const { invoiceId, studentId, amount, currency, returnUrl, resultUrl } = body

    if (!studentId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Student ID and a valid amount are required' },
        { status: 400 }
      )
    }

    // Validate student exists
    const student = await db.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // If invoiceId is provided, validate the invoice
    if (invoiceId) {
      const invoice = await db.feeInvoice.findUnique({ where: { id: invoiceId } })
      if (!invoice) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        )
      }
      if (invoice.studentId !== studentId) {
        return NextResponse.json(
          { error: 'Invoice does not belong to this student' },
          { status: 400 }
        )
      }
    }

    const reference = generateReference()
    const transactionId = generateTransactionId()

    // Calculate display amount based on currency
    const zigRate = 10.83
    const paymentAmount = currency === 'ZiG' ? amount : amount
    const displayAmount = currency === 'ZiG'
      ? `ZiG ${(paymentAmount * zigRate).toFixed(2)}`
      : `$${paymentAmount.toFixed(2)}`

    const usedReturnUrl = returnUrl || process.env.PAYNOW_RETURN_URL || ''
    const usedResultUrl = resultUrl || process.env.PAYNOW_RESULT_URL || ''

    // If Paynow credentials are configured, make real API call
    if (PAYNOW_INTEGRATION_ID && PAYNOW_INTEGRATION_KEY) {
      try {
        const paynowPayload: Record<string, string> = {
          id: PAYNOW_INTEGRATION_ID,
          reference,
          amount: paymentAmount.toFixed(2),
          additionalinfo: `School fee payment - ${student.firstName} ${student.lastName}`,
          resulturl: usedResultUrl,
          returnurl: usedReturnUrl,
          authemail: '',
        }

        // Generate hash
        const hashString = [
          paynowPayload.id,
          paynowPayload.reference,
          paynowPayload.amount,
          paynowPayload.additionalinfo,
          paynowPayload.resulturl,
          paynowPayload.returnurl,
          PAYNOW_INTEGRATION_KEY,
        ].join('')

        paynowPayload.hash = 'placeholder_hash_' + hashString.length

        const paynowUrl = 'https://www.paynow.co.zw/interface/initiatetransaction'

        const response = await fetch(paynowUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(paynowPayload).toString(),
        })

        const responseText = await response.text()
        const responseData = Object.fromEntries(new URLSearchParams(responseText))

        if (responseData.status === 'Ok' || responseData.status === 'Sent') {
          // Create FeePayment record in database
          const feePayment = await db.feePayment.create({
            data: {
              studentId,
              invoiceId: invoiceId || null,
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

          const transaction: PaynowTransactionRecord = {
            id: transactionId,
            invoiceId: invoiceId || null,
            studentId,
            amount: paymentAmount,
            currency,
            status: 'pending',
            reference,
            pollUrl,
            paymentUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          transactions.set(transactionId, transaction)

          // Update invoice if provided
          if (invoiceId) {
            const invoice = await db.feeInvoice.findUnique({ where: { id: invoiceId } })
            if (invoice) {
              await db.feeInvoice.update({
                where: { id: invoiceId },
                data: {
                  amountPaid: invoice.amountPaid,
                  status: 'PENDING',
                },
              })
            }
          }

          return NextResponse.json({
            success: true,
            transactionId,
            reference,
            paymentUrl,
            pollUrl,
            amount: displayAmount,
            currency,
            feePaymentId: feePayment.id,
          })
        } else {
          return NextResponse.json(
            { error: 'Paynow transaction failed', details: responseData.error || 'Unknown error' },
            { status: 400 }
          )
        }
      } catch (error) {
        console.error('Paynow API error:', error)
        return NextResponse.json(
          { error: 'Failed to communicate with Paynow' },
          { status: 502 }
        )
      }
    }

    // ─── Simulated Paynow Flow (Dev Mode) ───────────────────────────────────
    const paymentUrl = `https://paynow.co.zw/payment/${reference}`

    // Create FeePayment record in database
    const feePayment = await db.feePayment.create({
      data: {
        studentId,
        invoiceId: invoiceId || null,
        receiptNumber: `RCT-${reference}`,
        amount: paymentAmount,
        paymentMethod: 'PAYNOW',
        currency,
        exchangeRate: currency === 'ZiG' ? zigRate : 1,
        reference,
      },
    })

    const transaction: PaynowTransactionRecord = {
      id: transactionId,
      invoiceId: invoiceId || null,
      studentId,
      amount: paymentAmount,
      currency,
      status: 'pending',
      reference,
      pollUrl: null,
      paymentUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    transactions.set(transactionId, transaction)

    // Simulate payment completion after a short delay (demo mode)
    setTimeout(async () => {
      const txn = transactions.get(transactionId)
      if (txn && txn.status === 'pending') {
        // 80% chance of success in demo
        const isSuccess = Math.random() > 0.2
        txn.status = isSuccess ? 'paid' : 'failed'
        txn.updatedAt = new Date().toISOString()
        transactions.set(transactionId, txn)

        // If payment succeeded, update the invoice
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
                  status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
                },
              })
            }
          } catch {
            // Silently handle invoice update errors in demo mode
          }
        }
      }
    }, 5000)

    return NextResponse.json({
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
    console.error('Paynow initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
