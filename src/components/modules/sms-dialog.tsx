'use client'

import { useState, useMemo } from 'react'
import { useApiMutation } from '@/hooks/use-api-query'
import { AnimatePresence } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

import { recipientGroups, smsTemplates } from './sms/sms-constants'
import { SmsCompose } from './sms/sms-compose'
import { SmsSending } from './sms/sms-sending'
import { SmsResult } from './sms/sms-result'
import { buildPhoneNumbers, computeSmsMetrics, getRecipientCount } from './sms/sms-utils'
import type { SmsSendResponse, SmsStep } from './sms/sms-types'

interface SmsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRecipientGroup?: string
}

export function SmsDialog({ open, onOpenChange, defaultRecipientGroup }: SmsDialogProps) {
  const [step, setStep] = useState<SmsStep>('compose')
  const [recipientGroup, setRecipientGroup] = useState(defaultRecipientGroup || 'all_parents')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [individualPhones, setIndividualPhones] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [smsType, setSmsType] = useState<'sms' | 'whatsapp'>('sms')
  const [sendProgress, setSendProgress] = useState(0)
  const [sendResult, setSendResult] = useState<{
    totalSent: number
    totalFailed: number
    cost: number
    messageId: string
    results: SmsSendResponse['results']
  } | null>(null)

  const selectedGroup = recipientGroups.find(g => g.id === recipientGroup)
  const phoneNumbers = useMemo(
    () => buildPhoneNumbers(recipientGroup, individualPhones, selectedGroup),
    [recipientGroup, individualPhones, selectedGroup]
  )
  const recipientCount = getRecipientCount(recipientGroup, individualPhones, selectedGroup)
  const { charCount, smsCount, isOverLimit, estimatedCost } = computeSmsMetrics(message, recipientCount)

  const canSend = !!message.trim() && !isOverLimit &&
    !(recipientGroup === 'individual' && phoneNumbers.length === 0) &&
    !(recipientGroup === 'class_parents' && !selectedClass) &&
    !(recipientGroup === 'grade_parents' && !selectedGrade)

  const { mutate: sendSms } = useApiMutation<
    { to: string[]; message: string; type: 'sms' | 'whatsapp' },
    SmsSendResponse
  >('/api/communication/sms/send')

  const handleSend = () => {
    if (!message.trim()) return
    if (recipientGroup === 'individual' && phoneNumbers.length === 0) return
    if (recipientGroup === 'class_parents' && !selectedClass) return
    if (recipientGroup === 'grade_parents' && !selectedGrade) return

    setStep('sending')
    setSendProgress(0)

    const progressInterval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90 }
        return prev + Math.random() * 15
      })
    }, 300)

    sendSms(
      { to: phoneNumbers, message, type: smsType },
      {
        onSuccess: (data) => {
          clearInterval(progressInterval)
          setSendProgress(100)
          setSendResult({
            totalSent: data.totalSent,
            totalFailed: data.totalFailed,
            cost: data.cost,
            messageId: data.messageId,
            results: data.results || [],
          })
          setTimeout(() => {
            setStep('result')
            toast.success(`${data.totalSent} SMS sent successfully!`)
          }, 500)
        },
        onError: (err) => {
          clearInterval(progressInterval)
          toast.error('Failed to send SMS', { description: err.message || 'Network error' })
          setStep('compose')
        },
      }
    )
  }

  const handleClose = () => {
    setStep('compose')
    setMessage('')
    setSelectedTemplate('')
    setIndividualPhones('')
    setSendResult(null)
    setSendProgress(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <MessageSquare className="h-4 w-4 text-teal-600" />
            </div>
            Send SMS via Africa&apos;s Talking
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'compose' && (
            <SmsCompose
              message={message}
              setMessage={setMessage}
              recipientGroup={recipientGroup}
              setRecipientGroup={setRecipientGroup}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              individualPhones={individualPhones}
              setIndividualPhones={setIndividualPhones}
              smsType={smsType}
              setSmsType={setSmsType}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              charCount={charCount}
              smsCount={smsCount}
              isOverLimit={isOverLimit}
              recipientCount={recipientCount}
              estimatedCost={estimatedCost}
              canSend={canSend}
              onSend={handleSend}
              onClose={handleClose}
            />
          )}

          {step === 'sending' && (
            <SmsSending recipientCount={recipientCount} sendProgress={sendProgress} />
          )}

          {step === 'result' && sendResult && (
            <SmsResult
              messageId={sendResult.messageId}
              totalSent={sendResult.totalSent}
              totalFailed={sendResult.totalFailed}
              cost={sendResult.cost}
              smsCount={smsCount}
              results={sendResult.results}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
