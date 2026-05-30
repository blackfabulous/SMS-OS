import { describe, it, expect } from 'vitest'
import { applyPayment, reversePayment, toBaseAmount, applyLateFee, round2 } from '@/lib/finance-calc'

describe('applyPayment', () => {
  it('marks an invoice PAID when fully settled', () => {
    expect(applyPayment({ totalAmount: 400, amountPaid: 0 }, 400)).toEqual({
      amountPaid: 400,
      balance: 0,
      status: 'PAID',
    })
  })

  it('marks an invoice PARTIAL on a partial payment', () => {
    expect(applyPayment({ totalAmount: 400, amountPaid: 0 }, 100)).toEqual({
      amountPaid: 100,
      balance: 300,
      status: 'PARTIAL',
    })
  })

  it('accumulates onto an existing partial payment', () => {
    expect(applyPayment({ totalAmount: 400, amountPaid: 100 }, 300)).toEqual({
      amountPaid: 400,
      balance: 0,
      status: 'PAID',
    })
  })

  it('never reports a negative balance on overpayment', () => {
    const result = applyPayment({ totalAmount: 400, amountPaid: 0 }, 500)
    expect(result.balance).toBe(0)
    expect(result.status).toBe('PAID')
  })
})

describe('reversePayment', () => {
  it('returns a fully reversed invoice to PENDING', () => {
    expect(reversePayment({ totalAmount: 400, amountPaid: 400 }, 400)).toEqual({
      amountPaid: 0,
      balance: 400,
      status: 'PENDING',
    })
  })

  it('returns to PARTIAL when some payment remains', () => {
    expect(reversePayment({ totalAmount: 400, amountPaid: 400 }, 100)).toEqual({
      amountPaid: 300,
      balance: 100,
      status: 'PARTIAL',
    })
  })

  it('never drops amountPaid below zero', () => {
    const result = reversePayment({ totalAmount: 400, amountPaid: 100 }, 300)
    expect(result.amountPaid).toBe(0)
    expect(result.status).toBe('PENDING')
  })
})

describe('toBaseAmount (multi-currency)', () => {
  it('is a no-op for base currency (rate 1 / missing)', () => {
    expect(toBaseAmount(100)).toBe(100)
    expect(toBaseAmount(100, 1)).toBe(100)
    expect(toBaseAmount(100, 0)).toBe(100) // invalid rate guarded
  })

  it('converts a foreign payment to base via the rate', () => {
    // 2650 ZWG at 26.5 ZWG/USD = $100.00
    expect(toBaseAmount(2650, 26.5)).toBe(100)
  })

  it('rounds to 2dp', () => {
    expect(toBaseAmount(100, 3)).toBe(33.33)
  })

  it('settles a USD invoice correctly from a ZWG payment', () => {
    const baseAmount = toBaseAmount(2650, 26.5)
    expect(applyPayment({ totalAmount: 100, amountPaid: 0 }, baseAmount)).toEqual({
      amountPaid: 100,
      balance: 0,
      status: 'PAID',
    })
  })
})

describe('applyLateFee', () => {
  it('adds the configured percentage to the balance', () => {
    expect(applyLateFee(200, 10)).toBe(220)
  })

  it('is a no-op for zero penalty or zero balance', () => {
    expect(applyLateFee(200, 0)).toBe(200)
    expect(applyLateFee(0, 10)).toBe(0)
  })

  it('rounds to 2dp', () => {
    expect(applyLateFee(33.33, 5)).toBe(35)
  })
})

describe('round2', () => {
  it('rounds half away from zero at 2dp', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(2.675)).toBe(2.68)
  })
})
