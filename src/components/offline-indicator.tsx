'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { WifiOff, Wifi, CloudOff, X } from 'lucide-react'

interface PendingOperation {
  id: string
  type: string
  description: string
  timestamp: number
}

function loadPendingOps(): PendingOperation[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('zimschool-pending-ops')
    return stored ? JSON.parse(stored) as PendingOperation[] : []
  } catch {
    return []
  }
}

export function OfflineIndicator() {
  const { isOffline } = useOnlineStatus()
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>(loadPendingOps)
  const [dismissed, setDismissed] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [backOnlineTimer, setBackOnlineTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Track offline→online transitions via event callbacks
  useEffect(() => {
    function handleOffline() {
      setDismissed(false)
      setWasOffline(true)
    }
    function handleOnline() {
      // wasOffline will be set by handleOffline, so this transition is correct
      // Start a timer to clear the "back online" banner
      const timer = setTimeout(() => {
        setPendingOps([])
        setWasOffline(false)
        setDismissed(false)
        try {
          localStorage.removeItem('zimschool-pending-ops')
        } catch {
          // Ignore
        }
      }, 3000)
      setBackOnlineTimer(timer)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (backOnlineTimer) clearTimeout(backOnlineTimer)
    }
  }, [backOnlineTimer])

  // Simulate adding pending operations while offline
  const addPendingOp = useCallback((op: Omit<PendingOperation, 'id' | 'timestamp'>) => {
    const newOp: PendingOperation = {
      ...op,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    }
    setPendingOps((prev) => {
      const updated = [newOp, ...prev]
      try {
        localStorage.setItem('zimschool-pending-ops', JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
      return updated
    })
  }, [])

  // Expose addPendingOp for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__zimschool_addPendingOp = addPendingOp
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).__zimschool_addPendingOp
      }
    }
  }, [addPendingOp])

  // Derive banner state
  const isBackOnline = !isOffline && wasOffline
  const showBanner = (isOffline || isBackOnline) && !dismissed

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] animate-slide-up">
      <div
        className={`relative flex items-center justify-between px-4 py-3 text-sm font-medium shadow-lg transition-colors duration-500 ${
          isBackOnline
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-700 text-emerald-50'
        }`}
      >
        {/* Left: Status info */}
        <div className="flex items-center gap-3 min-w-0">
          {isBackOnline ? (
            <Wifi className="h-4 w-4 shrink-0 animate-pulse" />
          ) : (
            <WifiOff className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {isBackOnline
              ? 'Back online — syncing pending changes'
              : 'You are offline — some features may be limited'}
          </span>
        </div>

        {/* Center: Pending operations count */}
        {pendingOps.length > 0 && !isBackOnline && (
          <div className="flex items-center gap-1.5 mx-4 shrink-0 bg-emerald-800/50 rounded-full px-3 py-0.5">
            <CloudOff className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">
              {pendingOps.length} pending
            </span>
          </div>
        )}

        {/* Right: Dismiss button (only when offline) */}
        {!isBackOnline && (
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 ml-2 rounded-full p-1 hover:bg-emerald-800/60 transition-colors"
            aria-label="Dismiss offline banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Syncing progress bar (when back online) */}
        {isBackOnline && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-800">
            <div className="h-full bg-white animate-sync-progress" />
          </div>
        )}
      </div>
    </div>
  )
}
