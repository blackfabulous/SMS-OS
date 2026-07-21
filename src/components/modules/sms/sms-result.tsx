'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { DeliveryResult } from './sms-types'

interface SmsResultProps {
  messageId: string
  totalSent: number
  totalFailed: number
  cost: number
  smsCount: number
  results: DeliveryResult[]
  onClose: () => void
}

export function SmsResult({ messageId, totalSent, totalFailed, cost, smsCount, results, onClose }: SmsResultProps) {
  return (
    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-4">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
        </motion.div>
        <h3 className="text-lg font-semibold mt-3">SMS Sent Successfully!</h3>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Message ID</span><span className="font-mono text-xs">{messageId}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Sent</span><span className="font-semibold text-emerald-600">{totalSent}</span></div>
        {totalFailed > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Failed</span><span className="font-semibold text-red-600">{totalFailed}</span></div>}
        <Separator />
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Cost</span><span className="font-semibold">${cost.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">SMS Segments</span><span className="font-medium">{smsCount}</span></div>
      </div>

      {results && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2"><Mail className="h-4 w-4" /> Delivery Status</p>
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-1.5 text-xs',
                  result.status === 'Delivered' || result.status === 'Sent'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20'
                    : result.status === 'Failed' || result.status === 'Rejected'
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : 'bg-amber-50 dark:bg-amber-950/20'
                )}
              >
                <span className="font-mono">{result.recipient}</span>
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    'text-[8px] px-1.5 py-0',
                    (result.status === 'Delivered' || result.status === 'Sent') && 'bg-emerald-100 text-emerald-700',
                    (result.status === 'Failed' || result.status === 'Rejected') && 'bg-red-100 text-red-700',
                    result.status === 'Queued' && 'bg-amber-100 text-amber-700',
                  )}>
                    {result.status}
                  </Badge>
                  <span className="text-muted-foreground">${result.cost.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Delivery reports will be available shortly</span>
      </div>

      <DialogFooter className="justify-center">
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={onClose}>Done</Button>
      </DialogFooter>
    </motion.div>
  )
}
