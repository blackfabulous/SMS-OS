'use client'

import { motion } from 'framer-motion'
import { Loader2, Clock, ArrowLeft, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { QRCodePlaceholder } from './paynow-qr'
import type { PaymentMethod } from './paynow-types'

interface PaynowProcessingProps {
  paymentMethod: PaymentMethod
  displayAmount: string
  transactionRef: string
  paymentUrl: string
  paymentStatus: string
  polling: boolean
  countdown: number
  onCopyLink: () => void
  onBack: () => void
  onClose: () => void
}

export function PaynowProcessing({
  paymentMethod,
  displayAmount,
  transactionRef,
  paymentUrl,
  paymentStatus,
  polling,
  countdown,
  onCopyLink,
  onBack,
  onClose,
}: PaynowProcessingProps) {
  return (
    <motion.div key="processing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 py-4 text-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
        <Loader2 className="h-7 w-7 text-emerald-600" />
      </motion.div>

      <div>
        <h3 className="text-lg font-semibold">Processing Payment</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {paymentMethod === 'card'
            ? 'Complete payment on the secure Paynow page'
            : `Confirm payment on your ${paymentMethod === 'ecocash' ? 'EcoCash' : 'OneMoney'} phone`}
        </p>
      </div>

      {transactionRef && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Transaction Reference</p>
          <p className="text-sm font-mono font-semibold">{transactionRef}</p>
        </div>
      )}

      {paymentUrl && (
        <div className="space-y-3">
          <QRCodePlaceholder />
          <div className="flex items-center gap-2 justify-center">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => window.open(paymentUrl, '_blank')}>
              <ExternalLink className="h-3 w-3" /> Open Payment Page
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={onCopyLink}>
              <Copy className="h-3 w-3" /> Copy Link
            </Button>
          </div>
        </div>
      )}

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
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </DialogFooter>
    </motion.div>
  )
}
