'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DialogFooter } from '@/components/ui/dialog'
import type { PaymentMethod } from './paynow-types'

interface PaynowSuccessProps {
  displayAmount: string
  studentName?: string
  paymentMethod: PaymentMethod
  transactionRef: string
  onClose: () => void
}

export function PaynowSuccess({ displayAmount, studentName, paymentMethod, transactionRef, onClose }: PaynowSuccessProps) {
  return (
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
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{displayAmount}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Student</span><span className="font-medium">{studentName}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Method</span><span className="font-medium capitalize">{paymentMethod}</span></div>
        <Separator />
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{transactionRef}</span></div>
      </div>

      <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
        <Receipt className="h-3.5 w-3.5" />
        <span>A receipt has been generated and will appear in your payment history.</span>
      </div>

      <DialogFooter className="justify-center">
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onClose}>Done</Button>
      </DialogFooter>
    </motion.div>
  )
}
