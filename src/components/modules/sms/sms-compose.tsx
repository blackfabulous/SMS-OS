'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Phone, Send, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { MAX_SMS_LENGTH, availableClasses, availableGrades, recipientGroups, smsTemplates } from './sms-constants'
import type { RecipientGroup, SmsTemplate } from './sms-types'

interface SmsComposeProps {
  message: string
  setMessage: (v: string) => void
  recipientGroup: string
  setRecipientGroup: (v: string) => void
  selectedClass: string
  setSelectedClass: (v: string) => void
  selectedGrade: string
  setSelectedGrade: (v: string) => void
  individualPhones: string
  setIndividualPhones: (v: string) => void
  smsType: 'sms' | 'whatsapp'
  setSmsType: (v: 'sms' | 'whatsapp') => void
  selectedTemplate: string
  setSelectedTemplate: (v: string) => void
  charCount: number
  smsCount: number
  isOverLimit: boolean
  recipientCount: number
  estimatedCost: string
  canSend: boolean
  onSend: () => void
  onClose: () => void
}

export function SmsCompose({
  message,
  setMessage,
  recipientGroup,
  setRecipientGroup,
  selectedClass,
  setSelectedClass,
  selectedGrade,
  setSelectedGrade,
  individualPhones,
  setIndividualPhones,
  smsType,
  setSmsType,
  selectedTemplate,
  setSelectedTemplate,
  charCount,
  smsCount,
  isOverLimit,
  recipientCount,
  estimatedCost,
  canSend,
  onSend,
  onClose,
}: SmsComposeProps) {
  const handleTemplateSelect = (templateId: string) => {
    const template = smsTemplates.find(t => t.id === templateId)
    if (template) {
      setMessage(template.content)
      setSelectedTemplate(templateId)
    }
  }

  return (
    <motion.div key="compose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="space-y-2">
        <Label>Recipients</Label>
        <div className="grid grid-cols-2 gap-2">
          {recipientGroups.map((group: RecipientGroup) => (
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

      {recipientGroup === 'class_parents' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="Choose a class" /></SelectTrigger>
            <SelectContent>
              {availableClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {recipientGroup === 'grade_parents' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
          <Label>Select Grade</Label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger><SelectValue placeholder="Choose a grade" /></SelectTrigger>
            <SelectContent>
              {availableGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>
      )}

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

      <div className="space-y-2">
        <Label>Quick Template</Label>
        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
          <SelectContent>
            {smsTemplates.map((t: SmsTemplate) => (
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
            {smsCount > 1 && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{smsCount} SMS</Badge>}
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
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={onSend} disabled={!canSend}>
          <Send className="h-4 w-4" /> Send SMS
        </Button>
      </DialogFooter>
    </motion.div>
  )
}
