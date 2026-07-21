import type React from 'react'

export interface SmsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRecipientGroup?: string
  availableClasses?: string[]
  availableGrades?: string[]
}

export type SmsStep = 'compose' | 'sending' | 'result'

export interface RecipientGroup {
  id: string
  label: string
  icon: React.ElementType
  count: number
  description: string
}

export interface SmsTemplate {
  id: string
  name: string
  category: string
  content: string
}

export interface DeliveryResult {
  messageId: string
  recipient: string
  status: 'Sent' | 'Delivered' | 'Failed' | 'Rejected' | 'Queued'
  cost: number
  network: string
  failureReason?: string
}

export interface SmsSendResponse {
  success: boolean
  messageId: string
  status: string
  cost: number
  totalSent: number
  totalFailed: number
  results: DeliveryResult[]
  demo?: boolean
}

export interface SmsFormState {
  step: SmsStep
  recipientGroup: string
  selectedClass: string
  selectedGrade: string
  individualPhones: string
  message: string
  selectedTemplate: string
  smsType: 'sms' | 'whatsapp'
  sending: boolean
  sendProgress: number
  sendResult: {
    totalSent: number
    totalFailed: number
    cost: number
    messageId: string
    results: DeliveryResult[]
  } | null
}
