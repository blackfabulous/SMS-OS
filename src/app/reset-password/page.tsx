'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { School, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function ResetInner() {
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const tooShort = password.length > 0 && password.length < 8
  const mismatch = confirm.length > 0 && confirm !== password
  const canSubmit = token && password.length >= 8 && password === confirm && !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/password/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white"><AlertCircle className="h-7 w-7" /></div>
        <h2 className="mt-5 text-xl font-bold">Invalid reset link</h2>
        <p className="mt-2 text-sm text-muted-foreground">This link is missing its token. Please request a new password reset.</p>
        <Link href="/forgot-password" className="mt-6 inline-block font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">Request a new link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white"><CheckCircle2 className="h-7 w-7" /></div>
        <h2 className="mt-5 text-xl font-bold">Password reset</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your password has been updated. You can now sign in with your new password.</p>
        <Link href="/login" className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700">Go to sign in</Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight">Choose a new password</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Enter a new password for your account. Minimum 8 characters.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="pw" className="mb-1.5 block text-sm font-medium">New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="pw" type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {tooShort && <p className="mt-1 text-xs text-amber-600">At least 8 characters.</p>}
        </div>
        <div>
          <label htmlFor="cf" className="mb-1.5 block text-sm font-medium">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="cf" type={show ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {mismatch && <p className="mt-1 text-xs text-amber-600">Passwords don’t match.</p>}
        </div>
        {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</p>}
        <button
          type="submit" disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : 'Reset password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50/40 p-4 dark:from-background dark:to-background">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
            <School className="h-6 w-6 text-white" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">ZimSchool Pro</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
          <Suspense fallback={<div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>}>
            <ResetInner />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
