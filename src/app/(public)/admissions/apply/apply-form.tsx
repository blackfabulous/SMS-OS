'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Users, CheckCircle2, ArrowRight, ArrowLeft, Loader2, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPost } from '@/lib/api-client'

interface ApplyFormProps {
  gradeOptions: string[]
}

type FormState = {
  firstName: string; lastName: string; middleName: string
  gender: '' | 'MALE' | 'FEMALE'
  dateOfBirth: string
  gradeApplyingFor: string
  boardingStatus: '' | 'DAY_SCHOLAR' | 'BOARDER'
  previousSchool: string
  guardianFirstName: string; guardianLastName: string
  guardianPhone: string; guardianEmail: string; guardianRelationship: string
  message: string
  company: string // honeypot
}

const EMPTY: FormState = {
  firstName: '', lastName: '', middleName: '', gender: '', dateOfBirth: '',
  gradeApplyingFor: '', boardingStatus: '', previousSchool: '',
  guardianFirstName: '', guardianLastName: '', guardianPhone: '', guardianEmail: '',
  guardianRelationship: '', message: '', company: '',
}

const STEPS = ['Learner', 'Guardian', 'Review'] as const

const inputCls = 'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
const labelCls = 'mb-1.5 block text-sm font-medium text-foreground'

export function ApplyForm({ gradeOptions }: ApplyFormProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ reference: string } | null>(null)

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const step1Valid = form.firstName && form.lastName && form.gender && form.dateOfBirth && form.gradeApplyingFor
  const step2Valid = form.guardianFirstName && form.guardianLastName && form.guardianPhone

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const data = await apiPost<{ reference: string }>('/api/admissions/apply', form)
      setDone({ reference: data.reference })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-emerald-50/60 p-10 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <PartyPopper className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Application submitted!</h2>
        <p className="mt-2 text-muted-foreground">
          Thank you. Your application reference is{' '}
          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{done.reference}</span>.
          Our admissions team will be in touch shortly.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700">Back to home</Link>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 font-semibold transition-colors hover:bg-muted">Contact admissions</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' : 'bg-muted text-muted-foreground',
              )}>
                {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </span>
              <span className={cn('text-sm font-medium', i === step ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className={cn('mx-3 h-px flex-1', i < step ? 'bg-emerald-500' : 'bg-border')} />}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        {/* Honeypot (visually hidden) */}
        <input
          type="text" name="company" tabIndex={-1} autoComplete="off"
          value={form.company} onChange={set('company')}
          className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true"
        />

        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <User className="h-5 w-5" /><h2 className="text-lg font-semibold">Learner details</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="firstName" className={labelCls}>First name *</label><input id="firstName" className={inputCls} value={form.firstName} onChange={set('firstName')} /></div>
              <div><label htmlFor="lastName" className={labelCls}>Last name *</label><input id="lastName" className={inputCls} value={form.lastName} onChange={set('lastName')} /></div>
              <div><label htmlFor="middleName" className={labelCls}>Middle name</label><input id="middleName" className={inputCls} value={form.middleName} onChange={set('middleName')} /></div>
              <div>
                <label htmlFor="gender" className={labelCls}>Gender *</label>
                <select id="gender" className={inputCls} value={form.gender} onChange={set('gender')}>
                  <option value="">Select…</option><option value="MALE">Male</option><option value="FEMALE">Female</option>
                </select>
              </div>
              <div><label htmlFor="dateOfBirth" className={labelCls}>Date of birth *</label><input id="dateOfBirth" type="date" className={inputCls} value={form.dateOfBirth} onChange={set('dateOfBirth')} /></div>
              <div>
                <label htmlFor="gradeApplyingFor" className={labelCls}>Grade applying for *</label>
                <select id="gradeApplyingFor" className={inputCls} value={form.gradeApplyingFor} onChange={set('gradeApplyingFor')}>
                  <option value="">Select…</option>
                  {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="boardingStatus" className={labelCls}>Boarding preference</label>
                <select id="boardingStatus" className={inputCls} value={form.boardingStatus} onChange={set('boardingStatus')}>
                  <option value="">No preference</option><option value="DAY_SCHOLAR">Day scholar</option><option value="BOARDER">Boarder</option>
                </select>
              </div>
              <div><label htmlFor="previousSchool" className={labelCls}>Previous school</label><input id="previousSchool" className={inputCls} value={form.previousSchool} onChange={set('previousSchool')} /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Users className="h-5 w-5" /><h2 className="text-lg font-semibold">Parent / guardian details</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="guardianFirstName" className={labelCls}>First name *</label><input id="guardianFirstName" className={inputCls} value={form.guardianFirstName} onChange={set('guardianFirstName')} /></div>
              <div><label htmlFor="guardianLastName" className={labelCls}>Last name *</label><input id="guardianLastName" className={inputCls} value={form.guardianLastName} onChange={set('guardianLastName')} /></div>
              <div><label htmlFor="guardianPhone" className={labelCls}>Phone *</label><input id="guardianPhone" className={inputCls} placeholder="+263…" value={form.guardianPhone} onChange={set('guardianPhone')} /></div>
              <div><label htmlFor="guardianEmail" className={labelCls}>Email</label><input id="guardianEmail" type="email" className={inputCls} value={form.guardianEmail} onChange={set('guardianEmail')} /></div>
              <div><label htmlFor="guardianRelationship" className={labelCls}>Relationship</label><input id="guardianRelationship" className={inputCls} placeholder="Mother, Father, Guardian…" value={form.guardianRelationship} onChange={set('guardianRelationship')} /></div>
            </div>
            <div><label htmlFor="message" className={labelCls}>Anything else we should know?</label><textarea id="message" className={cn(inputCls, 'min-h-[96px]')} value={form.message} onChange={set('message')} /></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" /><h2 className="text-lg font-semibold">Review &amp; submit</h2>
            </div>
            <dl className="grid gap-x-6 gap-y-3 rounded-xl bg-muted/40 p-5 text-sm sm:grid-cols-2">
              <Row label="Learner" value={`${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g, ' ').trim()} />
              <Row label="Gender" value={form.gender} />
              <Row label="Date of birth" value={form.dateOfBirth} />
              <Row label="Grade" value={form.gradeApplyingFor} />
              <Row label="Boarding" value={form.boardingStatus || '—'} />
              <Row label="Previous school" value={form.previousSchool || '—'} />
              <Row label="Guardian" value={`${form.guardianFirstName} ${form.guardianLastName}`} />
              <Row label="Phone" value={form.guardianPhone} />
              <Row label="Email" value={form.guardianEmail || '—'} />
            </dl>
            <p className="text-xs text-muted-foreground">By submitting, you confirm the information provided is accurate.</p>
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</p>}
          </div>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 0 && !step1Valid) || (step === 1 && !step2Valid)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>Submit application <ArrowRight className="h-4 w-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}
