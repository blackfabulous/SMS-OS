// Pure fee-statement builder — no DB/IO, fully unit-testable.
// Produces a chronological ledger (debits = invoices, credits = payments) with a
// running balance, normalising foreign-currency payments to the base currency.

import { round2, toBaseAmount } from '@/lib/finance-calc'

export interface StatementInvoiceInput {
  invoiceNumber: string
  createdAt: Date | string
  totalAmount: number
}

export interface StatementPaymentInput {
  receiptNumber: string
  createdAt: Date | string
  amount: number
  currency?: string | null
  exchangeRate?: number | null
  paymentMethod?: string | null
  isReversed?: boolean
}

export interface StatementLine {
  date: string // ISO date (yyyy-mm-dd)
  ref: string
  description: string
  debit: number
  credit: number
  balance: number
}

export interface Statement {
  lines: StatementLine[]
  totalInvoiced: number
  totalPaid: number
  balance: number
}

function isoDate(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10)
}

function timeValue(d: Date | string): number {
  return new Date(d).getTime()
}

/**
 * Build a running-balance statement. Invoices are debits (their full amount);
 * non-reversed payments are credits (converted to the base currency via the
 * stored exchange rate). Events are ordered by date, then debits before credits
 * on the same day so the balance reads naturally.
 */
export function buildStatement(invoices: StatementInvoiceInput[], payments: StatementPaymentInput[]): Statement {
  type Event = { t: number; kind: 'debit' | 'credit'; line: Omit<StatementLine, 'balance'> }
  const events: Event[] = []

  for (const inv of invoices) {
    events.push({
      t: timeValue(inv.createdAt),
      kind: 'debit',
      line: { date: isoDate(inv.createdAt), ref: inv.invoiceNumber, description: `Invoice ${inv.invoiceNumber}`, debit: round2(inv.totalAmount), credit: 0 },
    })
  }
  for (const p of payments) {
    if (p.isReversed) continue
    const base = toBaseAmount(p.amount, p.exchangeRate)
    const method = p.paymentMethod ? ` (${p.paymentMethod})` : ''
    events.push({
      t: timeValue(p.createdAt),
      kind: 'credit',
      line: { date: isoDate(p.createdAt), ref: p.receiptNumber, description: `Payment ${p.receiptNumber}${method}`, debit: 0, credit: base },
    })
  }

  // Sort by time; on ties, debit before credit (invoice raised then paid).
  events.sort((a, b) => a.t - b.t || (a.kind === b.kind ? 0 : a.kind === 'debit' ? -1 : 1))

  let balance = 0
  let totalInvoiced = 0
  let totalPaid = 0
  const lines: StatementLine[] = events.map((e) => {
    balance = round2(balance + e.line.debit - e.line.credit)
    totalInvoiced = round2(totalInvoiced + e.line.debit)
    totalPaid = round2(totalPaid + e.line.credit)
    return { ...e.line, balance }
  })

  return { lines, totalInvoiced, totalPaid, balance }
}
