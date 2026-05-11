import { NextRequest, NextResponse } from 'next/server'

// ─── Paynow Payment Gateway - Status Check ───────────────────────────────────
// Checks the status of a Paynow payment transaction.
// In dev mode, returns simulated status from in-memory store.

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

// Share the same transaction store with the initiate route
// In production, this would be stored in the database
const transactions: Map<string, PaynowTransactionRecord> = new Map()

const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY

// ─── GET: Check Payment Status ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    const transactionId = searchParams.get('transactionId')

    if (!reference && !transactionId) {
      return NextResponse.json(
        { error: 'Either reference or transactionId query parameter is required' },
        { status: 400 }
      )
    }

    // Find transaction by reference or transactionId
    let transaction: PaynowTransactionRecord | undefined

    if (transactionId) {
      transaction = transactions.get(transactionId)
    }

    if (!transaction && reference) {
      transaction = Array.from(transactions.values()).find(t => t.reference === reference)
    }

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // If Paynow credentials are set and pollUrl exists, poll Paynow for live status
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

        if (transactionId) {
          transactions.set(transactionId, transaction)
        }
      } catch {
        // If poll fails, return current local status
      }
    }

    const paidAt = transaction.status === 'paid' ? transaction.updatedAt : null

    return NextResponse.json({
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      paidAt,
      studentId: transaction.studentId,
      invoiceId: transaction.invoiceId,
      paymentUrl: transaction.paymentUrl,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    })
  } catch (error) {
    console.error('Paynow status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
