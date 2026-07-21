'use client'

import { motion } from 'framer-motion'
import { CreditCard, ArrowRight, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { paymentMethods } from './paynow-constants'
import { formatDisplayAmount } from './paynow-utils'
import type { Currency, PaynowStudent, PaymentMethod } from './paynow-types'

interface PaynowDetailsProps {
  students: PaynowStudent[]
  selectedStudent: string
  setSelectedStudent: (v: string) => void
  amount: string
  setAmount: (v: string) => void
  currency: Currency
  setCurrency: (v: Currency) => void
  paymentMethod: PaymentMethod
  setPaymentMethod: (v: PaymentMethod) => void
  phone: string
  setPhone: (v: string) => void
  email: string
  setEmail: (v: string) => void
  isInitiating: boolean
  canSubmit: boolean
  onSubmit: () => void
  onClose: () => void
}

export function PaynowDetails({
  students,
  selectedStudent,
  setSelectedStudent,
  amount,
  setAmount,
  currency,
  setCurrency,
  paymentMethod,
  setPaymentMethod,
  phone,
  setPhone,
  email,
  setEmail,
  isInitiating,
  canSubmit,
  onSubmit,
  onClose,
}: PaynowDetailsProps) {
  const selectedStudentData = students.find(s => s.id === selectedStudent)
  const displayAmount = formatDisplayAmount(amount, currency)

  return (
    <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
      <div className="space-y-2">
        <Label>Student</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
          <SelectContent>
            {students.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — Outstanding: ${s.outstandingFees.toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label>Amount</Label>
          <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={v => setCurrency(v as Currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="ZiG">ZiG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {parseFloat(amount) > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">You are paying</p>
          <p className="text-2xl font-bold text-emerald-600">{displayAmount}</p>
          {selectedStudentData && <p className="text-xs text-muted-foreground mt-1">For: {selectedStudentData.name}</p>}
        </div>
      )}

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

      {(paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
          <Label>Phone Number</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">+263</span>
            <Input placeholder="7XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Enter the {paymentMethod === 'ecocash' ? 'Econet' : 'NetOne'} number for payment</p>
        </motion.div>
      )}

      {paymentMethod === 'card' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
          <Label>Email (optional)</Label>
          <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </motion.div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
        <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Payments are processed securely via Paynow Zimbabwe. Your financial details are encrypted and never stored on our servers.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={onSubmit} disabled={!canSubmit || isInitiating}>
          {isInitiating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Pay {displayAmount}
        </Button>
      </DialogFooter>
    </motion.div>
  )
}
