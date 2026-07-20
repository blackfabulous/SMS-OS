'use client'

import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation } from '@/hooks/use-api-query'
import { AnimatePresence } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'


import { PaynowDetails } from './paynow/paynow-details'
import { PaynowProcessing } from './paynow/paynow-processing'
import { PaynowSuccess } from './paynow/paynow-success'
import { PaynowFailed } from './paynow/paynow-failed'
import { formatDisplayAmount, validatePaymentDetails } from './paynow/paynow-utils'
import type { Currency, InitiateBody, InitiateResponse, PaynowDialogProps, PaymentMethod, PaymentStep, StatusResponse } from './paynow/paynow-types'

export function PaynowDialog({
  open,
  onOpenChange,
  students,
  defaultStudentId,
  defaultAmount,
  invoiceId,
  onPaymentSuccess,
}: PaynowDialogProps) {
  const [step, setStep] = useState<PaymentStep>('details')
  const [selectedStudent, setSelectedStudent] = useState(defaultStudentId || '')
  const [amount, setAmount] = useState(defaultAmount?.toString() || '')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ecocash')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [polling, setPolling] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [paymentStatus, setPaymentStatus] = useState<string>('pending')

  const selectedStudentData = students.find(s => s.id === selectedStudent)
  const displayAmount = formatDisplayAmount(amount, currency)
  const processedStatusRef = useRef<string | null>(null)

  const { mutate: initiatePayment, isPending: isInitiating } = useApiMutation<InitiateBody, InitiateResponse>('/api/payments/paynow/initiate', {
    onSuccess: (data) => {
      processedStatusRef.current = null
      setTransactionRef(data.reference)
      setTransactionId(data.transactionId)
      setPaymentUrl(data.paymentUrl)
      setStep('processing')
      setCountdown(30)
      setPolling(true)
    },
    onError: (err) => {
      setStep('failed')
      toast.error('Payment initiation failed', { description: err.message })
    },
  })

  const statusUrl = transactionId
    ? `/api/payments/paynow/status?transactionId=${encodeURIComponent(transactionId)}&reference=${encodeURIComponent(transactionRef || '')}`
    : ''

  const { data: statusData } = useApiQuery<StatusResponse>(
    ['paynow-status', transactionId, transactionRef],
    statusUrl,
    {
      enabled: !!transactionId && polling && step === 'processing',
      refetchInterval: polling ? 5000 : false,
      refetchIntervalInBackground: false,
    },
  )

  useEffect(() => {
    if (!statusData) return
    if (processedStatusRef.current === statusData.status) return

    const timer = setTimeout(() => {
      setPaymentStatus(statusData.status)
      processedStatusRef.current = statusData.status

      if (statusData.status === 'paid') {
        setPolling(false)
        setStep('success')
        toast.success('Payment successful!', { description: `Reference: ${statusData.reference}` })
        onPaymentSuccess?.()
      } else if (['failed', 'cancelled', 'timedout'].includes(statusData.status)) {
        setPolling(false)
        setStep('failed')
        toast.error('Payment failed', { description: 'The transaction was not completed.' })
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [statusData, onPaymentSuccess])

  useEffect(() => {
    if (step !== 'processing' || !polling || countdown <= 0) return

    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setPolling(false)
        setCountdown(30)
        toast.info('Payment status check timed out', { description: 'Please check your payment history.' })
      } else {
        setCountdown(c => c - 1)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [step, polling, countdown])

  const handleClose = () => {
    setStep('details')
    setAmount(defaultAmount?.toString() || '')
    setCurrency('USD')
    setPaymentMethod('ecocash')
    setPhone('')
    setEmail('')
    setTransactionRef('')
    setTransactionId('')
    setPaymentUrl('')
    setPolling(false)
    setCountdown(30)
    setPaymentStatus('pending')
    onOpenChange(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl)
    toast.success('Payment link copied to clipboard!')
  }

  const handleSubmit = () => {
    const validation = validatePaymentDetails(selectedStudent, amount, paymentMethod, phone)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    initiatePayment({
      studentId: selectedStudent,
      invoiceId,
      amount: parseFloat(amount),
      currency,
      returnUrl: origin,
      resultUrl: `${origin}/api/payments/paynow/status`,
    })
  }

  const canSubmit = !!selectedStudent && !!amount && parseFloat(amount) > 0 &&
    !((paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && !phone)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            Pay School Fees Online
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'details' && (
            <PaynowDetails
              students={students}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              amount={amount}
              setAmount={setAmount}
              currency={currency}
              setCurrency={setCurrency}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              isInitiating={isInitiating}
              canSubmit={canSubmit}
              onSubmit={handleSubmit}
              onClose={handleClose}
            />
          )}

          {step === 'processing' && (
            <PaynowProcessing
              paymentMethod={paymentMethod}
              displayAmount={displayAmount}
              transactionRef={transactionRef}
              paymentUrl={paymentUrl}
              paymentStatus={paymentStatus}
              polling={polling}
              countdown={countdown}
              onCopyLink={handleCopyLink}
              onBack={() => { setPolling(false); setStep('details') }}
              onClose={handleClose}
            />
          )}

          {step === 'success' && (
            <PaynowSuccess
              displayAmount={displayAmount}
              studentName={selectedStudentData?.name}
              paymentMethod={paymentMethod}
              transactionRef={transactionRef}
              onClose={handleClose}
            />
          )}

          {step === 'failed' && (
            <PaynowFailed
              onRetry={() => setStep('details')}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
