'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

interface PaynowFailedProps {
  onRetry: () => void
  onClose: () => void
}

export function PaynowFailed({ onRetry, onClose }: PaynowFailedProps) {
  return (
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
        <Button variant="outline" onClick={onRetry}><ArrowLeft className="h-4 w-4 mr-2" /> Try Again</Button>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </motion.div>
  )
}
