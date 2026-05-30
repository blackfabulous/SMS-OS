'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LoginPage from '@/components/login-page'

export default function Login() {
  const router = useRouter()
  const { status } = useSession()

  // Already signed in → go straight to the dashboard.
  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
  }, [status, router])

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  return <LoginPage />
}
