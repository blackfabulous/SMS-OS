'use client'

import { useState } from 'react'
import Link from 'next/link'
import { School, Mail, ArrowLeft, Loader2, CheckCircle2, Send } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/password/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-bold">Check your inbox</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we’ve sent a link to reset your password. It’s valid for one hour.
              </p>
              <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Enter your account email and we’ll send you a reset link.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.ac.zw"
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</p>}
                <button
                  type="submit" disabled={loading || !email}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Send reset link <Send className="h-4 w-4" /></>}
                </button>
              </form>
              <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
