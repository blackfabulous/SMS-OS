import { describe, it, expect } from 'vitest'
import { buildStatement } from '@/lib/statement'

describe('buildStatement', () => {
  it('produces a running balance with debits then credits', () => {
    const s = buildStatement(
      [
        { invoiceNumber: 'INV1', createdAt: '2025-01-10', totalAmount: 400 },
        { invoiceNumber: 'INV2', createdAt: '2025-02-10', totalAmount: 200 },
      ],
      [
        { receiptNumber: 'RCP1', createdAt: '2025-01-20', amount: 150 },
        { receiptNumber: 'RCP2', createdAt: '2025-02-15', amount: 50 },
      ],
    )
    expect(s.totalInvoiced).toBe(600)
    expect(s.totalPaid).toBe(200)
    expect(s.balance).toBe(400)
    expect(s.lines.map((l) => l.balance)).toEqual([400, 250, 450, 400])
  })

  it('converts a foreign-currency payment to base via the exchange rate', () => {
    const s = buildStatement(
      [{ invoiceNumber: 'INV1', createdAt: '2025-01-10', totalAmount: 100 }],
      [{ receiptNumber: 'RCP1', createdAt: '2025-01-11', amount: 2650, currency: 'ZWG', exchangeRate: 26.5 }],
    )
    expect(s.totalPaid).toBe(100) // 2650 / 26.5
    expect(s.balance).toBe(0)
  })

  it('excludes reversed payments', () => {
    const s = buildStatement(
      [{ invoiceNumber: 'INV1', createdAt: '2025-01-10', totalAmount: 100 }],
      [
        { receiptNumber: 'RCP1', createdAt: '2025-01-11', amount: 100, isReversed: true },
        { receiptNumber: 'RCP2', createdAt: '2025-01-12', amount: 40 },
      ],
    )
    expect(s.totalPaid).toBe(40)
    expect(s.balance).toBe(60)
    expect(s.lines).toHaveLength(2) // reversed payment omitted
  })

  it('orders a same-day invoice before its payment', () => {
    const s = buildStatement(
      [{ invoiceNumber: 'INV1', createdAt: '2025-03-01', totalAmount: 100 }],
      [{ receiptNumber: 'RCP1', createdAt: '2025-03-01', amount: 100 }],
    )
    expect(s.lines[0].debit).toBe(100)
    expect(s.lines[1].credit).toBe(100)
    expect(s.balance).toBe(0)
  })

  it('handles an empty ledger', () => {
    expect(buildStatement([], [])).toEqual({ lines: [], totalInvoiced: 0, totalPaid: 0, balance: 0 })
  })
})
