'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface OnlineStatus {
  isOnline: boolean
  isOffline: boolean
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') return navigator.onLine
    return true
  })

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online', {
        description: 'Your connection has been restored. Data will sync automatically.',
        duration: 4000,
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You\'re offline', {
        description: 'Some features may be limited. Changes will sync when you reconnect.',
        duration: 6000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
  }
}
