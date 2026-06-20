import { describe, it, expect } from 'vitest'
import { calculatePAYE, calculateNSSA } from '@/lib/payroll-calc'

describe('calculatePAYE (Zimbabwe 2024 brackets)', () => {
  it('returns 0 for zero or negative income', () => {
    expect(calculatePAYE(0)).toBe(0)
    expect(calculatePAYE(-500)).toBe(0)
  })

  it('applies the 0% band up to 300', () => {
    expect(calculatePAYE(300)).toBe(0)
  })

  it('applies 20% on the 300–1500 band', () => {
    // 0 on first 300, 20% on next 1200 = 240
    expect(calculatePAYE(1500)).toBe(240)
  })

  it('applies mixed brackets correctly', () => {
    // 2000: 0 on 300, 240 on 1200, 25% on 500 = 125 -> 365
    expect(calculatePAYE(2000)).toBe(365)
  })

  it('applies the top marginal rate above 20000', () => {
    // 20000: 0 + 240 + (3500*.25=875) + (5000*.3=1500) + (10000*.35=3500) = 6115
    expect(calculatePAYE(20000)).toBe(6115)
    // 21000: previous 6115 + 1000*0.4 = 6515
    expect(calculatePAYE(21000)).toBe(6515)
  })

  it('ignores non-finite input', () => {
    expect(calculatePAYE(Infinity)).toBe(0)
    expect(calculatePAYE(NaN)).toBe(0)
  })
})

describe('calculateNSSA', () => {
  it('is 4.5% below the ceiling', () => {
    expect(calculateNSSA(1000)).toBe(45)
  })

  it('caps at the statutory ceiling of 339', () => {
    expect(calculateNSSA(100000)).toBe(339)
  })

  it('returns 0 for non-positive income', () => {
    expect(calculateNSSA(0)).toBe(0)
  })
})
