import { Smartphone, CreditCard } from 'lucide-react'
import type React from 'react'
import type { PaymentMethod } from './paynow-types'

export const ZIG_RATE = 10.83

export interface PaymentMethodOption {
  id: PaymentMethod
  label: string
  icon: React.ElementType
  description: string
  color: string
}

export const paymentMethods: PaymentMethodOption[] = [
  { id: 'ecocash', label: 'EcoCash', icon: Smartphone, description: 'Pay with Econet EcoCash', color: 'text-emerald-600' },
  { id: 'onemoney', label: 'OneMoney', icon: Smartphone, description: 'Pay with NetOne OneMoney', color: 'text-red-600' },
  { id: 'card', label: 'Bank Card', icon: CreditCard, description: 'Visa / Mastercard', color: 'text-blue-600' },
]
