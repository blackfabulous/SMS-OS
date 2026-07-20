'use client'

import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface SmsSendingProps {
  recipientCount: number
  sendProgress: number
}

export function SmsSending({ recipientCount, sendProgress }: SmsSendingProps) {
  return (
    <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 py-8 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-100"
      >
        <Send className="h-6 w-6 text-teal-600" />
      </motion.div>
      <div>
        <h3 className="text-lg font-semibold">Sending SMS...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Delivering {recipientCount} messages via Africa&apos;s Talking
        </p>
      </div>
      <Progress value={sendProgress} className="h-2" />
      <p className="text-xs text-muted-foreground">{Math.round(sendProgress)}% complete</p>
    </motion.div>
  )
}
