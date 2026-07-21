import { ZIG_RATE } from './paynow-constants'
import type { Currency } from './paynow-types'

export function formatDisplayAmount(amount: string, currency: Currency) {
  const value = parseFloat(amount || '0')
  if (currency === 'ZiG') {
    return `ZiG ${(value * ZIG_RATE).toLocaleString('en-ZW', { minimumFractionDigits: 2 })}`
  }
  return `$${value.toLocaleString('en-ZW', { minimumFractionDigits: 2 })}`
}

export function validatePaymentDetails(
  selectedStudent: string,
  amount: string,
  paymentMethod: string,
  phone: string
): { valid: boolean; error?: string } {
  if (!selectedStudent || !amount || parseFloat(amount) <= 0) {
    return { valid: false, error: 'Please fill in all required fields' }
  }
  if ((paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && !phone) {
    return { valid: false, error: 'Phone number is required for mobile money payments' }
  }
  return { valid: true }
}
