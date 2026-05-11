'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Smartphone,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Receipt,
  Shield,
  Clock,
  ExternalLink,
  Copy,
  QrCode,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaynowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: { id: string; name: string; outstandingFees: number }[]
  defaultStudentId?: string
  defaultAmount?: number
  invoiceId?: string
  onPaymentSuccess?: () => void
}

type PaymentStep = 'details' | 'processing' | 'success' | 'failed'
type PaymentMethod = 'ecocash' | 'onemoney' | 'card'
type Currency = 'USD' | 'ZiG'

const ZIG_RATE = 10.83

// ─── Component ────────────────────────────────────────────────────────────────
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

  const displayAmount = currency === 'ZiG'
    ? `ZiG ${(parseFloat(amount || '0') * ZIG_RATE).toLocaleString('en-ZW', { minimumFractionDigits: 2 })}`
    : `$${parseFloat(amount || '0').toLocaleString('en-ZW', { minimumFractionDigits: 2 })}`

  // ─── Poll for payment status via new status API ─────────────────────────
  const pollPaymentStatus = useCallback(async (txnId: string, ref: string) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 12 // 60 seconds total

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/payments/paynow/status?transactionId=${encodeURIComponent(txnId)}&reference=${encodeURIComponent(ref)}`
        )
        const data = await response.json()

        setPaymentStatus(data.status)

        if (data.status === 'paid') {
          setStep('success')
          setPolling(false)
          toast.success('Payment successful!', { description: `Reference: ${data.reference}` })
          onPaymentSuccess?.()
          return
        }

        if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'timedout') {
          setStep('failed')
          setPolling(false)
          toast.error('Payment failed', { description: 'The transaction was not completed.' })
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          setPolling(false)
          toast.info('Payment status check timed out', { description: 'Please check your payment history.' })
        }
      } catch {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          setPolling(false)
        }
      }
    }

    poll()
  }, [onPaymentSuccess])

  // ─── Countdown timer for processing step ──────────────────────────────────
  useEffect(() => {
    if (step === 'processing' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [step, countdown])

  // ─── Reset on close ───────────────────────────────────────────────────────
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

  // ─── Copy payment link to clipboard ─────────────────────────────────────
  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl)
    toast.success('Payment link copied to clipboard!')
  }

  // ─── Submit payment via new initiate API ────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedStudent || !amount || parseFloat(amount) <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    if ((paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && !phone) {
      toast.error('Phone number is required for mobile money payments')
      return
    }

    setStep('processing')
    setCountdown(30)

    try {
      const response = await fetch('/api/payments/paynow/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          invoiceId: invoiceId || undefined,
          amount: parseFloat(amount),
          currency,
          returnUrl: typeof window !== 'undefined' ? window.location.origin : '',
          resultUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/paynow/status` : '',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTransactionRef(data.reference)
        setTransactionId(data.transactionId)
        setPaymentUrl(data.paymentUrl)

        // Start polling for status
        pollPaymentStatus(data.transactionId, data.reference)
      } else {
        setStep('failed')
        toast.error('Payment initiation failed', { description: data.error || 'Unknown error' })
      }
    } catch {
      setStep('failed')
      toast.error('Payment failed', { description: 'Could not connect to payment gateway' })
    }
  }

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType; description: string; color: string }[] = [
    { id: 'ecocash', label: 'EcoCash', icon: Smartphone, description: 'Pay with Econet EcoCash', color: 'text-emerald-600' },
    { id: 'onemoney', label: 'OneMoney', icon: Smartphone, description: 'Pay with NetOne OneMoney', color: 'text-red-600' },
    { id: 'card', label: 'Bank Card', icon: CreditCard, description: 'Visa / Mastercard', color: 'text-blue-600' },
  ]

  // ─── QR Code SVG placeholder ──────────────────────────────────────────────
  const QRCodePlaceholder = () => (
    <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20">
      <div className="text-center">
        <QrCode className="h-10 w-10 text-emerald-400 mx-auto mb-1" />
        <p className="text-[9px] text-emerald-600 font-medium">SCAN TO PAY</p>
      </div>
    </div>
  )

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
          {/* ─── Step: Details ──────────────────────────────────────────────── */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {/* Student Selection */}
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — Outstanding: ${s.outstandingFees.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={v => setCurrency(v as Currency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="ZiG">ZiG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount Preview */}
              {parseFloat(amount) > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">You are paying</p>
                  <p className="text-2xl font-bold text-emerald-600">{displayAmount}</p>
                  {selectedStudentData && <p className="text-xs text-muted-foreground mt-1">For: {selectedStudentData.name}</p>}
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)} className="space-y-2">
                  {paymentMethods.map(pm => (
                    <div key={pm.id} className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer',
                      paymentMethod === pm.id ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20' : 'hover:bg-muted/50'
                    )}>
                      <RadioGroupItem value={pm.id} id={pm.id} />
                      <Label htmlFor={pm.id} className="flex items-center gap-3 cursor-pointer flex-1">
                        <pm.icon className={cn('h-5 w-5', pm.color)} />
                        <div>
                          <p className="text-sm font-medium">{pm.label}</p>
                          <p className="text-xs text-muted-foreground">{pm.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Phone Number (for mobile money) */}
              {(paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">+263</span>
                    <Input
                      placeholder="7XX XXX XXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter the {paymentMethod === 'ecocash' ? 'Econet' : 'NetOne'} number for payment</p>
                </motion.div>
              )}

              {/* Email (optional, for card) */}
              {paymentMethod === 'card' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </motion.div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Payments are processed securely via Paynow Zimbabwe. Your financial details are encrypted and never stored on our servers.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  onClick={handleSubmit}
                  disabled={!selectedStudent || !amount || parseFloat(amount) <= 0 || ((paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && !phone)}
                >
                  Pay {displayAmount} <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ─── Step: Processing ──────────────────────────────────────────── */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 py-4 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
              >
                <Loader2 className="h-7 w-7 text-emerald-600" />
              </motion.div>

              <div>
                <h3 className="text-lg font-semibold">Processing Payment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {paymentMethod === 'card'
                    ? 'Complete payment on the secure Paynow page'
                    : `Confirm payment on your ${paymentMethod === 'ecocash' ? 'EcoCash' : 'OneMoney'} phone`
                  }
                </p>
              </div>

              {/* Transaction Reference */}
              {transactionRef && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Transaction Reference</p>
                  <p className="text-sm font-mono font-semibold">{transactionRef}</p>
                </div>
              )}

              {/* QR Code & Payment Link */}
              {paymentUrl && (
                <div className="space-y-3">
                  <QRCodePlaceholder />
                  <div className="flex items-center gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => window.open(paymentUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" /> Open Payment Page
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-3 w-3" /> Copy Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-center gap-2">
                <Badge className={cn(
                  'text-xs',
                  paymentStatus === 'pending' && 'bg-amber-100 text-amber-700',
                  paymentStatus === 'paid' && 'bg-emerald-100 text-emerald-700',
                  paymentStatus === 'failed' && 'bg-red-100 text-red-700',
                )}>
                  {paymentStatus === 'pending' && '⏳ Waiting for payment'}
                  {paymentStatus === 'paid' && '✓ Payment received'}
                  {paymentStatus === 'failed' && '✗ Payment failed'}
                </Badge>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{polling ? `Checking status... ${countdown}s remaining` : 'Status check complete'}</span>
              </div>

              {(paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && (
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 text-left">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Instructions:</p>
                  <ol className="text-xs text-amber-600 dark:text-amber-400 space-y-1 list-decimal pl-4">
                    <li>Dial <span className="font-mono font-bold">*153#</span> {paymentMethod === 'onemoney' && '(or *111#)'}</li>
                    <li>Select &quot;Pay Bill&quot;</li>
                    <li>Enter the merchant code when prompted</li>
                    <li>Confirm the amount: {displayAmount}</li>
                    <li>Enter your PIN to authorize</li>
                  </ol>
                </div>
              )}

              <DialogFooter className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => { setPolling(false); setStep('details') }}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ─── Step: Success ──────────────────────────────────────────────── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 py-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}>
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
              </motion.div>

              <div>
                <h3 className="text-lg font-semibold text-emerald-600">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground mt-1">Your school fee payment has been processed.</p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{displayAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{selectedStudentData?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{transactionRef}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" />
                <span>A receipt has been generated and will appear in your payment history.</span>
              </div>

              <DialogFooter className="justify-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleClose}>
                  Done
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ─── Step: Failed ──────────────────────────────────────────────── */}
          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 py-6 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-600">Payment Failed</h3>
                <p className="text-sm text-muted-foreground mt-1">The transaction could not be completed.</p>
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 text-left space-y-1">
                <p className="text-xs font-medium text-red-700 dark:text-red-300">Possible reasons:</p>
                <ul className="text-xs text-red-600 dark:text-red-400 list-disc pl-4 space-y-0.5">
                  <li>Insufficient balance</li>
                  <li>Incorrect PIN entered</li>
                  <li>Transaction timed out</li>
                  <li>Network connectivity issues</li>
                </ul>
              </div>

              <DialogFooter className="justify-center gap-3">
                <Button variant="outline" onClick={() => setStep('details')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Try Again
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
