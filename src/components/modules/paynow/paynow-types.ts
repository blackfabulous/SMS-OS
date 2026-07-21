export type PaymentStep = 'details' | 'processing' | 'success' | 'failed'
export type PaymentMethod = 'ecocash' | 'onemoney' | 'card'
export type Currency = 'USD' | 'ZiG'

export interface PaynowStudent {
  id: string
  name: string
  outstandingFees: number
}

export interface PaynowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: PaynowStudent[]
  defaultStudentId?: string
  defaultAmount?: number
  invoiceId?: string
  onPaymentSuccess?: () => void
}

export interface InitiateBody {
  studentId: string
  invoiceId?: string
  amount: number
  currency: Currency
  returnUrl: string
  resultUrl: string
}

export interface InitiateResponse {
  success: boolean
  transactionId: string
  reference: string
  paymentUrl: string
  pollUrl?: string | null
  amount?: string
  currency?: Currency
  feePaymentId?: string
  demo?: boolean
}

export interface StatusResponse {
  transactionId?: string
  reference: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'timedout'
  amount: number
  currency: string
  paidAt: string | null
  studentId: string
  invoiceId: string | null
  paymentUrl: string
  createdAt: string
  updatedAt: string
}
