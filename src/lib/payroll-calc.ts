// Pure payroll calculation helpers — no DB/IO so they can be unit-tested.

// Zimbabwe PAYE tax brackets (2024). Marginal rates applied per band.
const PAYE_BRACKETS: { limit: number; rate: number }[] = [
  { limit: 300, rate: 0 },
  { limit: 1500, rate: 0.2 },
  { limit: 5000, rate: 0.25 },
  { limit: 10000, rate: 0.3 },
  { limit: 20000, rate: 0.35 },
  { limit: Infinity, rate: 0.4 },
]

const NSSA_RATE = 0.045
const NSSA_CEILING = 339

/** Calculate PAYE on a taxable income using marginal brackets. Rounded to cents. */
export function calculatePAYE(taxableIncome: number): number {
  if (!Number.isFinite(taxableIncome) || taxableIncome <= 0) return 0
  let paye = 0
  let remaining = taxableIncome
  let prevLimit = 0
  for (const bracket of PAYE_BRACKETS) {
    const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit)
    if (taxableInBracket <= 0) break
    paye += taxableInBracket * bracket.rate
    remaining -= taxableInBracket
    prevLimit = bracket.limit
  }
  return Math.round(paye * 100) / 100
}

/** Employee NSSA contribution, capped at the statutory ceiling. Rounded to cents. */
export function calculateNSSA(gross: number): number {
  if (!Number.isFinite(gross) || gross <= 0) return 0
  return Math.round(Math.min(gross * NSSA_RATE, NSSA_CEILING) * 100) / 100
}
