/**
 * ZimSchool Pro - Multi-Currency Utilities
 * Handles USD and Zimbabwe Gold (ZiG) currency formatting and conversion
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'ZiG'

export interface ExchangeRate {
  rate: number
  lastUpdated: string
  source: string
}

export interface DualCurrencyAmount {
  usd: number
  zig: number
  rate: number
}

// ─── Default Exchange Rate ──────────────────────────────────────────────────

// Default rate: 1 USD = ~26 ZiG (approximate as of 2025)
// This will be overridden by the API rate when available
let cachedRate: ExchangeRate = {
  rate: 26.5,
  lastUpdated: new Date().toISOString(),
  source: 'default',
}

// ─── Format Functions ───────────────────────────────────────────────────────

/**
 * Format a number as USD with $ symbol
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number as Zimbabwe Gold with ZiG symbol
 */
export function formatZiG(amount: number): string {
  return new Intl.NumberFormat('en-ZW', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ZiG'
}

/**
 * Format a number in the specified currency
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  if (currency === 'ZiG') return formatZiG(amount)
  return formatUSD(amount)
}

/**
 * Format amount showing both USD and ZiG values
 */
export function formatDualCurrency(amount: number, fromCurrency: CurrencyCode = 'USD', rate?: number): string {
  const exchangeRate = rate || cachedRate.rate
  if (fromCurrency === 'USD') {
    const zigAmount = amount * exchangeRate
    return `${formatUSD(amount)} / ${formatZiG(zigAmount)}`
  }
  const usdAmount = amount / exchangeRate
  return `${formatZiG(amount)} / ${formatUSD(usdAmount)}`
}

// ─── Conversion Functions ───────────────────────────────────────────────────

/**
 * Convert between USD and ZiG
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rate?: number
): number {
  const exchangeRate = rate || cachedRate.rate

  if (from === to) return amount
  if (from === 'USD' && to === 'ZiG') return amount * exchangeRate
  if (from === 'ZiG' && to === 'USD') return amount / exchangeRate
  return amount
}

/**
 * Get dual currency breakdown for an amount
 */
export function getDualCurrencyAmount(amount: number, fromCurrency: CurrencyCode = 'USD', rate?: number): DualCurrencyAmount {
  const exchangeRate = rate || cachedRate.rate

  if (fromCurrency === 'USD') {
    return { usd: amount, zig: amount * exchangeRate, rate: exchangeRate }
  }
  return { usd: amount / exchangeRate, zig: amount, rate: exchangeRate }
}

// ─── Rate Management ────────────────────────────────────────────────────────

/**
 * Get current exchange rate
 */
export function getCurrentRate(): ExchangeRate {
  return cachedRate
}

/**
 * Update the cached exchange rate
 */
export function updateCachedRate(rate: ExchangeRate): void {
  cachedRate = rate
}

/**
 * Fetch exchange rate from API
 */
export async function fetchExchangeRate(): Promise<ExchangeRate> {
  try {
    const res = await fetch('/api/finance/exchange-rate')
    if (res.ok) {
      const data = await res.json()
      cachedRate = {
        rate: data.rate,
        lastUpdated: data.lastUpdated,
        source: data.source || 'api',
      }
      return cachedRate
    }
  } catch {
    // Return cached rate on error
  }
  return cachedRate
}

// ─── Payroll-Specific Formatting ────────────────────────────────────────────

/**
 * Format salary component in dual currency
 */
export function formatSalaryComponent(amount: number, label: string, rate?: number): {
  label: string
  usd: string
  zig: string
  dual: string
} {
  const exchangeRate = rate || cachedRate.rate
  return {
    label,
    usd: formatUSD(amount),
    zig: formatZiG(amount * exchangeRate),
    dual: `${formatUSD(amount)} / ${formatZiG(amount * exchangeRate)}`,
  }
}

/**
 * Format statutory deduction in dual currency
 */
export function formatStatutoryDeduction(amount: number, name: string, rate?: number): {
  name: string
  usd: string
  zig: string
} {
  const exchangeRate = rate || cachedRate.rate
  return {
    name,
    usd: formatUSD(amount),
    zig: formatZiG(amount * exchangeRate),
  }
}
