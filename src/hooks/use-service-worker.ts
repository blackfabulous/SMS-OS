'use client'

import { useState, useEffect, useCallback } from 'react'

interface ServiceWorkerStatus {
  isRegistered: boolean
  isUpdating: boolean
  error: string | null
  registration: ServiceWorkerRegistration | null
}

interface UseServiceWorkerReturn extends ServiceWorkerStatus {
  updateSW: () => Promise<void>
  unregisterSW: () => Promise<void>
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [status, setStatus] = useState<ServiceWorkerStatus>(() => {
    // Check for SW support at initialization time
    if (typeof window !== 'undefined' && !('serviceWorker' in navigator)) {
      return {
        isRegistered: false,
        isUpdating: false,
        error: 'Service workers are not supported in this browser',
        registration: null,
      }
    }
    return {
      isRegistered: false,
      isUpdating: false,
      error: null,
      registration: null,
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    let mounted = true

    async function registerSW() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        if (!mounted) return

        setStatus({
          isRegistered: true,
          isUpdating: false,
          error: null,
          registration,
        })

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (!mounted) return

            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                setStatus((prev) => ({
                  ...prev,
                  isUpdating: true,
                }))
              }
            } else if (newWorker.state === 'activated') {
              setStatus((prev) => ({
                ...prev,
                isUpdating: false,
              }))
            }
          })
        })

        // Check for updates on load
        registration.update().catch(() => {
          // Silently fail - not critical
        })

        console.log('[SW] Service worker registered successfully')
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : 'Failed to register service worker'
        console.warn('[SW] Registration failed:', message)
        setStatus((prev) => ({
          ...prev,
          error: message,
        }))
      }
    }

    registerSW()

    return () => {
      mounted = false
    }
  }, [])

  const updateSW = useCallback(async () => {
    setStatus((prev) => {
      if (!prev.registration) return prev
      return { ...prev, isUpdating: true }
    })
    try {
      const currentReg = await navigator.serviceWorker?.getRegistration()
      if (currentReg) {
        await currentReg.update()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      setStatus((prev) => ({ ...prev, error: message, isUpdating: false }))
    }
  }, [])

  const unregisterSW = useCallback(async () => {
    try {
      const currentReg = await navigator.serviceWorker?.getRegistration()
      if (currentReg) {
        const success = await currentReg.unregister()
        if (success) {
          setStatus({
            isRegistered: false,
            isUpdating: false,
            error: null,
            registration: null,
          })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unregister failed'
      setStatus((prev) => ({ ...prev, error: message }))
    }
  }, [])

  return {
    ...status,
    updateSW,
    unregisterSW,
  }
}
