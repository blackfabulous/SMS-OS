'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  School, GraduationCap, DollarSign, FileCheck, BarChart3,
  Eye, EyeOff, Lock, Mail, Zap, AlertCircle,
  ChevronDown, ChevronUp, Copy, Check, User, Shield, UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { signIn, getSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  // Demo helpers are only available outside production.
  const isDev = process.env.NODE_ENV !== 'production'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shakeForm, setShakeForm] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showDemo, setShowDemo] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setShakeForm(true)
        setTimeout(() => setShakeForm(false), 600)
        setLoginError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error)
        toast.error('Sign in failed', {
          description: result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error,
        })
      } else {
        toast.success('Welcome back!', {
          description: 'Successfully signed in to ZimSchool Pro',
        })
        // Wait for session to be available, then force a hard reload
        try {
          await getSession()
        } catch {}
        // Send the user into the dashboard; hard-navigate so the session cookie
        // is picked up by the server on first render.
        window.location.href = '/dashboard'
      }
    } catch {
      setShakeForm(true)
      setTimeout(() => setShakeForm(false), 600)
      setLoginError('An unexpected error occurred. Please try again.')
      toast.error('Sign in failed', {
        description: 'An unexpected error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Left Side - Animated Gradient Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden login-gradient-animated"
      >
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 animate-float" />
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/5 animate-float-slow" />
          <div className="absolute top-1/3 right-12 h-64 w-64 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-12 left-1/3 h-32 w-32 rounded-full bg-white/10 animate-float-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-20 right-1/4 h-16 w-16 rounded-lg bg-white/[0.07] rotate-45 animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-40 left-16 h-12 w-12 rounded-md bg-white/[0.06] rotate-12 animate-float-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-2/3 right-20 h-8 w-8 rounded-sm bg-white/[0.08] -rotate-12 animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-1/3 left-1/4 h-20 w-20 rounded-xl bg-white/[0.04] rotate-6 animate-float-slow" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-white/20 animate-float" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-1/2 right-1/3 h-3 w-3 rounded-full bg-white/15 animate-float" style={{ animationDelay: '1.8s' }} />
          <div className="absolute bottom-1/4 left-1/2 h-2 w-2 rounded-full bg-white/20 animate-float" style={{ animationDelay: '2.2s' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-lg">
                <School className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">ZimSchool Pro</h2>
                <p className="text-xs text-emerald-200">Management System</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 mb-8 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/15">
                  <GraduationCap className="h-9 w-9 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mufakose High School</h3>
                  <p className="text-sm text-emerald-200">Harare, Zimbabwe</p>
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 200 100" className="w-full max-w-[200px] h-auto opacity-80" fill="none">
                  <rect x="40" y="40" width="120" height="55" rx="2" fill="white" fillOpacity="0.2" />
                  <path d="M30 42 L100 15 L170 42 Z" fill="white" fillOpacity="0.25" />
                  <rect x="85" y="65" width="30" height="30" rx="1.5" fill="white" fillOpacity="0.3" />
                  <circle cx="112" cy="80" r="2" fill="white" fillOpacity="0.5" />
                  <rect x="50" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  <rect x="78" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  <rect x="104" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  <rect x="132" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  <line x1="35" y1="10" x2="35" y2="42" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
                  <rect x="36" y="10" width="14" height="9" rx="0.5" fill="#10b981" fillOpacity="0.6" />
                  <circle cx="18" cy="75" r="10" fill="white" fillOpacity="0.1" />
                  <rect x="16" y="85" width="4" height="10" rx="1" fill="white" fillOpacity="0.15" />
                  <circle cx="182" cy="75" r="10" fill="white" fillOpacity="0.1" />
                  <rect x="180" y="85" width="4" height="10" rx="1" fill="white" fillOpacity="0.15" />
                  <line x1="0" y1="95" x2="200" y2="95" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
                </svg>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg bg-white/10 p-3 text-center">
                  <p className="text-2xl font-bold text-white">55</p>
                  <p className="text-xs text-emerald-200">Students</p>
                </div>
                <div className="flex-1 rounded-lg bg-white/10 p-3 text-center">
                  <p className="text-2xl font-bold text-white">17</p>
                  <p className="text-xs text-emerald-200">Staff</p>
                </div>
                <div className="flex-1 rounded-lg bg-white/10 p-3 text-center">
                  <p className="text-2xl font-bold text-white">96%</p>
                  <p className="text-xs text-emerald-200">Attendance</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-emerald-200 uppercase tracking-wider mb-4">Key Features</h3>
            {[
              { icon: GraduationCap, title: 'Student Management', desc: 'Enrollment, attendance & grades' },
              { icon: DollarSign, title: 'Finance & Fees', desc: 'Multi-currency billing & BEAM tracking' },
              { icon: FileCheck, title: 'ZIMSEC Integration', desc: 'Exam registration & results analysis' },
              { icon: BarChart3, title: 'Reports & Analytics', desc: 'EMIS exports & custom reports' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/5 hover:bg-white/15 transition-colors duration-200"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs text-emerald-200">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full zw-flag-stripe">
              <div className="flex-1 bg-green-500" />
              <div className="flex-1 bg-yellow-400" />
              <div className="flex-1 bg-red-500" />
              <div className="flex-1 bg-black" />
            </div>
            <p className="mt-3 text-xs text-emerald-200/70 text-center">
              Proudly built for Zimbabwean schools
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-background"
      >
        <div className="w-full max-w-md px-2 sm:px-0">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">ZimSchool Pro</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn(shakeForm && 'animate-shake')}
          >
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your <span className="gradient-text font-semibold">ZimSchool Pro</span> account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium transition-colors group-focus-within:text-emerald-600">Email or Username</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@zimschool.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 emerald-focus transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium transition-colors group-focus-within:text-emerald-600">Password</Label>
                  <a href="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 emerald-focus transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="emerald-checkbox"
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 dark:shadow-emerald-900/30 dark:hover:shadow-emerald-800/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 neon-glow-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 lg:hidden">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full zw-flag-stripe">
                <div className="flex-1 bg-green-500" />
                <div className="flex-1 bg-yellow-400" />
                <div className="flex-1 bg-red-500" />
                <div className="flex-1 bg-black" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Proudly built for Zimbabwean schools
              </p>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{loginError}</p>
                </div>
              </motion.div>
            )}

            {/* Demo Credentials Section — development only, never shipped to production */}
            {isDev && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="flex items-center gap-2 w-full text-left group"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                  {showDemo ? (
                    <ChevronUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Demo Credentials
                </span>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] text-muted-foreground/60">Click to expand</span>
              </button>
              <AnimatePresence>
                {showDemo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden max-h-[40vh] overflow-y-auto"
                  >
                    <div className="mt-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20 p-3">
                      <div className="space-y-2">
                        {[
                          { email: 'admin@zimschool.co.zw', password: 'password123', role: 'Administrator', icon: Shield, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
                          { email: 'teacher@zimschool.co.zw', password: 'password123', role: 'Teacher', icon: UserCheck, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' },
                          { email: 'bursar@zimschool.co.zw', password: 'password123', role: 'Bursar', icon: DollarSign, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
                        ].map((cred) => {
                          const CredIcon = cred.icon
                          const fieldId = `${cred.role}-email`
                          return (
                            <div
                              key={cred.role}
                              className="flex items-center gap-2.5 rounded-lg bg-white/70 dark:bg-background/50 backdrop-blur-sm p-2.5 border border-emerald-100/50 dark:border-emerald-800/30"
                            >
                              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', cred.bg)}>
                                <CredIcon className={cn('h-3.5 w-3.5', cred.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{cred.role}</p>
                                <div className="flex items-center gap-1">
                                  <code className="text-[11px] text-muted-foreground font-mono truncate">{cred.email}</code>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(cred.email)
                                      setCopiedField(fieldId)
                                      setEmail(cred.email)
                                      setPassword(cred.password)
                                      setTimeout(() => setCopiedField(null), 1500)
                                    }}
                                    className="shrink-0 p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                  >
                                    {copiedField === fieldId ? (
                                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-muted-foreground/60" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 mt-2 text-center">
                        Click the copy icon to auto-fill credentials
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} ZimSchool Pro
              </p>
              <span className="text-[10px] text-muted-foreground/50 font-mono">v2.5.0</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
