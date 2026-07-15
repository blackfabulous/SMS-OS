'use client'

import React, { useState, useMemo } from 'react'
import { useApiMutation } from '@/hooks/use-api-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Users,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  GraduationCap,
  UserCheck,
  Phone,
  Mail,
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SmsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRecipientGroup?: string
  availableClasses?: string[]
  availableGrades?: string[]
}

type SmsStep = 'compose' | 'sending' | 'result'

interface RecipientGroup {
  id: string
  label: string
  icon: React.ElementType
  count: number
  description: string
}

interface SmsTemplate {
  id: string
  name: string
  category: string
  content: string
}

interface DeliveryResult {
  messageId: string
  recipient: string
  status: 'Sent' | 'Delivered' | 'Failed' | 'Rejected' | 'Queued'
  cost: number
  network: string
  failureReason?: string
}

interface SmsSendResponse {
  success: boolean
  messageId: string
  status: string
  cost: number
  totalSent: number
  totalFailed: number
  results: DeliveryResult[]
  demo?: boolean
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const recipientGroups: RecipientGroup[] = [
  { id: 'all_parents', label: 'All Parents', icon: Users, count: 145, description: 'Send to all parents with children enrolled' },
  { id: 'class_parents', label: 'By Class', icon: GraduationCap, count: 35, description: 'Parents of students in a specific class' },
  { id: 'grade_parents', label: 'By Grade', icon: GraduationCap, count: 52, description: 'Parents of students in a grade level' },
  { id: 'individual', label: 'Individual', icon: UserCheck, count: 1, description: 'Send to specific phone number(s)' },
]

const smsTemplates: SmsTemplate[] = [
  { id: 'fee_reminder', name: 'Fee Reminder', category: 'Finance', content: 'Dear Parent, your child has an outstanding fee balance. Please arrange payment at your earliest convenience. Contact the bursar for details. - ZimSchool' },
  { id: 'attendance_alert', name: 'Attendance Alert', category: 'Attendance', content: 'Dear Parent, your child was marked absent today. Please contact the school office if this is an error. - ZimSchool' },
  { id: 'exam_notice', name: 'Exam Notice', category: 'Academics', content: 'Dear Parent, end-of-term examinations begin soon. Please ensure your child is well prepared and arrives on time. - ZimSchool' },
  { id: 'meeting_notice', name: 'Meeting Notice', category: 'Meetings', content: 'Dear Parent, you are invited to attend the SDC meeting. Your attendance is valued. - ZimSchool' },
  { id: 'school_closure', name: 'School Closure', category: 'Emergency', content: 'URGENT: School will be closed. Please make alternative arrangements for your children. - ZimSchool' },
  { id: 'sports_event', name: 'Sports Event', category: 'Events', content: 'Dear Parent, the inter-house athletics competition will be held soon. Come support your child! - ZimSchool' },
  { id: 'parent_teacher', name: 'Parent-Teacher Conference', category: 'Meetings', content: 'Dear Parent, the Parent-Teacher Conference is scheduled. Please attend to discuss your child\'s progress. - ZimSchool' },
  { id: 'results_available', name: 'Results Available', category: 'Academics', content: 'Dear Parent, term results are now available. Please visit the school to collect your child\'s report card. - ZimSchool' },
]

const availableClasses = [
  'Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B',
  'Form 4A', 'Form 4B', 'Form 5A', 'Form 6A',
]

const availableGrades = [
  'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6',
]

const MAX_SMS_LENGTH = 160

// ─── Component ────────────────────────────────────────────────────────────────
export function SmsDialog({ open, onOpenChange, defaultRecipientGroup }: SmsDialogProps) {
  const [step, setStep] = useState<SmsStep>('compose')
  const [recipientGroup, setRecipientGroup] = useState(defaultRecipientGroup || 'all_parents')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [individualPhones, setIndividualPhones] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [smsType, setSmsType] = useState<'sms' | 'whatsapp'>('sms')
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendResult, setSendResult] = useState<{
    totalSent: number
    totalFailed: number
    cost: number
    messageId: string
    results: DeliveryResult[]
  } | null>(null)

  const charCount = message.length
  const smsCount = Math.ceil(charCount / MAX_SMS_LENGTH) || (charCount > 0 ? 1 : 0)
  const selectedGroup = recipientGroups.find(g => g.id === recipientGroup)
  const recipientCount = recipientGroup === 'individual'
    ? individualPhones.split(',').filter(p => p.trim()).length || 0
    : (selectedGroup?.count || 0)
  const estimatedCost = (smsCount * 0.02 * recipientCount).toFixed(2)
  const isOverLimit = charCount > MAX_SMS_LENGTH * 5

  // Build recipient phone list based on group selection
  const phoneNumbers = useMemo(() => {
    if (recipientGroup === 'individual' && individualPhones) {
      return individualPhones
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => p.startsWith('+') ? p : `+263${p}`)
    }
    // In production, these would be fetched from the database
    // For demo, generate sample phone numbers
    const count = selectedGroup?.count || 1
    const phones: string[] = []
    for (let i = 0; i < Math.min(count, 5); i++) {
      phones.push(`+26377${Math.floor(1000000 + Math.random() * 9000000)}`)
    }
    return phones
  }, [recipientGroup, individualPhones, selectedGroup])

  const handleTemplateSelect = (templateId: string) => {
    const template = smsTemplates.find(t => t.id === templateId)
    if (template) {
      setMessage(template.content)
      setSelectedTemplate(templateId)
    }
  }

  const { mutate: sendSms, isPending: isSending } = useApiMutation<
    { to: string[]; message: string; type: 'sms' | 'whatsapp' },
    SmsSendResponse
  >('/api/communication/sms/send', {
    onSuccess: (data) => {
      // onSuccess is handled in handleSend to clear the simulated progress interval
    },
  })

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (recipientGroup === 'individual' && phoneNumbers.length === 0) {
      toast.error('Please enter at least one phone number')
      return
    }

    if (recipientGroup === 'class_parents' && !selectedClass) {
      toast.error('Please select a class')
      return
    }

    if (recipientGroup === 'grade_parents' && !selectedGrade) {
      toast.error('Please select a grade')
      return
    }

    setStep('sending')
    setSending(true)
    setSendProgress(0)

    // Simulate progress for bulk sends
    const progressInterval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
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
        onSettled: () => setSending(false),
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
          {/* ─── Step: Compose ──────────────────────────────────────────────── */}
          {step === 'compose' && (
            <motion.div key="compose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Recipient Group */}
              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="grid grid-cols-2 gap-2">
                  {recipientGroups.map(group => (
                    <button
                      key={group.id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-3 text-left transition-all',
                        recipientGroup === group.id
                          ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => setRecipientGroup(group.id)}
                    >
                      <group.icon className={cn('h-4 w-4 shrink-0', recipientGroup === group.id ? 'text-teal-600' : 'text-muted-foreground')} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{group.label}</p>
                        <p className="text-[10px] text-muted-foreground">{group.count} recipients</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Selector */}
              {recipientGroup === 'class_parents' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              {/* Grade Selector */}
              {recipientGroup === 'grade_parents' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>Select Grade</Label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              {/* Individual Phone Numbers */}
              {recipientGroup === 'individual' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>Phone Number(s)</Label>
                  <Textarea
                    placeholder="Enter phone numbers separated by commas (e.g., 0771234567, 0712345678)"
                    value={individualPhones}
                    onChange={e => setIndividualPhones(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Separate multiple numbers with commas. Zimbabwe format: 07XXXXXXXX
                  </p>
                </motion.div>
              )}

              {/* Message Type */}
              <div className="space-y-2">
                <Label>Message Type</Label>
                <div className="flex gap-2">
                  <button
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all text-sm',
                      smsType === 'sms'
                        ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20 text-teal-600'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                    onClick={() => setSmsType('sms')}
                  >
                    <MessageSquare className="h-4 w-4" /> SMS
                  </button>
                  <button
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all text-sm',
                      smsType === 'whatsapp'
                        ? 'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/20 text-green-600'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                    onClick={() => setSmsType('whatsapp')}
                  >
                    <Phone className="h-4 w-4" /> WhatsApp
                  </button>
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-2">
                <Label>Quick Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {smsTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">{t.category}</Badge>
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className={cn(isOverLimit && 'border-red-300 focus-visible:ring-red-300')}
                />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn(charCount > MAX_SMS_LENGTH * 4 ? 'text-red-500' : 'text-muted-foreground')}>
                      {charCount} / {MAX_SMS_LENGTH * 5}
                    </span>
                    {smsCount > 1 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {smsCount} SMS
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {MAX_SMS_LENGTH - (charCount % MAX_SMS_LENGTH || (charCount > 0 ? MAX_SMS_LENGTH : 0))} chars left in segment
                  </span>
                </div>
                {isOverLimit && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Message exceeds maximum length (5 SMS segments)
                  </p>
                )}
              </div>

              {/* Cost Estimate */}
              <div className="bg-teal-50 dark:bg-teal-950/20 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Cost</p>
                  <p className="text-lg font-bold text-teal-600">${estimatedCost}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Recipients</p>
                  <p className="text-sm font-medium">{recipientCount}</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button
                  className="bg-teal-600 hover:bg-teal-700 gap-2"
                  onClick={handleSend}
                  disabled={!message.trim() || isOverLimit || (recipientGroup === 'individual' && phoneNumbers.length === 0) || (recipientGroup === 'class_parents' && !selectedClass) || (recipientGroup === 'grade_parents' && !selectedGrade)}
                >
                  <Send className="h-4 w-4" /> Send SMS
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ─── Step: Sending ─────────────────────────────────────────────── */}
          {step === 'sending' && (
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
              <p className="text-xs text-muted-foreground">
                {Math.round(sendProgress)}% complete
              </p>
            </motion.div>
          )}

          {/* ─── Step: Result ───────────────────────────────────────────────── */}
          {step === 'result' && sendResult && (
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Message ID</span>
                  <span className="font-mono text-xs">{sendResult.messageId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Sent</span>
                  <span className="font-semibold text-emerald-600">{sendResult.totalSent}</span>
                </div>
                {sendResult.totalFailed > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-semibold text-red-600">{sendResult.totalFailed}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-semibold">${sendResult.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SMS Segments</span>
                  <span className="font-medium">{smsCount}</span>
                </div>
              </div>

              {/* Delivery Status Details */}
              {sendResult.results && sendResult.results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Delivery Status
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {sendResult.results.map((result, idx) => (
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
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleClose}>
                  Done
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
