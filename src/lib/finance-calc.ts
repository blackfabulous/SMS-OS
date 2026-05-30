// Pure invoice-balance math — no DB/IO so it can be unit-tested.

/** Round to 2 decimal places (avoids float drift in money math). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Convert a payment amount in a foreign currency to the invoice's base currency.
 * `exchangeRate` is foreign units per 1 base unit (e.g. 26.5 ZWG per 1 USD),
 * matching the convention in `currency.ts`. A rate of 1 (or missing) is a no-op,
 * so base-currency payments are unaffected.
 */
export function toBaseAmount(amount: number, exchangeRate?: number | null): number {
  const rate = exchangeRate && exchangeRate > 0 ? exchangeRate : 1
  return round2(amount / rate)
}

/** Apply `balance * penaltyPct%` as a late fee, returning the new balance. */
export function applyLateFee(balance: number, penaltyPct: number): number {
  if (penaltyPct <= 0 || balance <= 0) return round2(balance)
  return round2(balance + (balance * penaltyPct) / 100)
}

export interface InvoiceState {
  totalAmount: number
  amountPaid: number
}

export interface InvoiceUpdate {
  amountPaid: number
  balance: number
  status: 'PENDING' | 'PARTIAL' | 'PAID'
}

/** Apply a payment of `amount` to an invoice and return the new balance/status. */
export function applyPayment(invoice: InvoiceState, amount: number): InvoiceUpdate {
  const amountPaid = invoice.amountPaid + amount
  const rawBalance = invoice.totalAmount - amountPaid
  const status: InvoiceUpdate['status'] =
    rawBalance <= 0 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'PENDING'
  return { amountPaid, balance: Math.max(0, rawBalance), status }
}

/** Reverse a payment of `amount` from an invoice and return the new balance/status. */
export function reversePayment(invoice: InvoiceState, amount: number): InvoiceUpdate {
  const amountPaid = Math.max(0, invoice.amountPaid - amount)
  const rawBalance = invoice.totalAmount - amountPaid
  const status: InvoiceUpdate['status'] =
    amountPaid <= 0 ? 'PENDING' : rawBalance > 0 ? 'PARTIAL' : 'PAID'
  return { amountPaid, balance: Math.max(0, rawBalance), status }
}
