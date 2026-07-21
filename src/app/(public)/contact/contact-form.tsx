'use client'

import { useState } from 'react'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPost } from '@/lib/api-client'

const inputCls = 'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
const labelCls = 'mb-1.5 block text-sm font-medium text-foreground'

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', company: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid = form.name && form.email && form.subject && form.message

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiPost('/api/contact', form)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-xl font-bold">Message sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">Thank you for reaching out. We will get back to you shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactName" className={labelCls}>Name *</label>
          <input id="contactName" className={inputCls} value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label htmlFor="contactEmail" className={labelCls}>Email *</label>
          <input id="contactEmail" type="email" className={inputCls} value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label htmlFor="contactPhone" className={labelCls}>Phone</label>
          <input id="contactPhone" className={inputCls} value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label htmlFor="contactSubject" className={labelCls}>Subject *</label>
          <input id="contactSubject" className={inputCls} value={form.subject} onChange={set('subject')} />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="contactMessage" className={labelCls}>Message *</label>
        <textarea id="contactMessage" className={cn(inputCls, 'min-h-[140px]')} value={form.message} onChange={set('message')} />
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!valid || submitting}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Send message <Send className="h-4 w-4" /></>}
      </button>
    </form>
  )
}
