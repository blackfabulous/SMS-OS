'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RealtimeNotification {
  id: string
  type: 'new-notification' | 'fee-payment' | 'attendance-alert' | 'exam-result' | 'message-received'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  module?: string
  data?: Record<string, unknown>
  timestamp: string
  sender?: string
}

interface UseNotificationsOptions {
  role?: 'ADMIN' | 'TEACHER' | 'BURSAR' | 'PARENT' | 'STUDENT'
  schoolId?: string
  username?: string
  enabled?: boolean
}

interface UseNotificationsReturn {
  notifications: RealtimeNotification[]
  unreadCount: number
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  sendNotification: (data: {
    type: RealtimeNotification['type']
    title: string
    description: string
    priority?: RealtimeNotification['priority']
    module?: string
    targetRole?: string
    targetUser?: string
    data?: Record<string, unknown>
  }) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    role = 'ADMIN',
    schoolId = 'default',
    username = 'Admin User',
    enabled = true,
  } = options

  const socketRef = useRef<Socket | null>(null)
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<UseNotificationsReturn['connectionStatus']>('disconnected')

  const handleNewNotification = useCallback((notification: RealtimeNotification) => {
    setNotifications((prev) => [notification, ...prev])

    // Show toast based on priority
    const toastOptions: Record<string, { duration: number }> = {
      critical: { duration: 8000 },
      high: { duration: 6000 },
      medium: { duration: 4000 },
      low: { duration: 3000 },
    }

    const priority = notification.priority || 'medium'

    if (priority === 'critical') {
      toast.error(notification.title, {
        description: notification.description,
        duration: toastOptions.critical.duration,
      })
    } else if (priority === 'high') {
      toast.warning(notification.title, {
        description: notification.description,
        duration: toastOptions.high.duration,
      })
    } else {
      toast.info(notification.title, {
        description: notification.description,
        duration: toastOptions[priority].duration,
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConnectionStatus('connecting')

    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      setIsConnected(true)
      setConnectionStatus('connected')

      // Join with role and school
      socketInstance.emit('join', { role, schoolId, username })
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
      setConnectionStatus('disconnected')
    })

    socketInstance.on('reconnecting', () => {
      setConnectionStatus('reconnecting')
    })

    // Listen for all notification events
    socketInstance.on('new-notification', handleNewNotification)
    socketInstance.on('fee-payment', handleNewNotification)
    socketInstance.on('attendance-alert', handleNewNotification)
    socketInstance.on('exam-result', handleNewNotification)
    socketInstance.on('message-received', handleNewNotification)

    // Receive notification history
    socketInstance.on('notification-history', (history: RealtimeNotification[]) => {
      setNotifications(history)
    })

    // Connection confirmation
    socketInstance.on('join-confirmed', (data: { user: { username: string; role: string } }) => {
      console.log(`[WS] Joined as ${data.user.username} (${data.user.role})`)
    })

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
    }
  }, [enabled, role, schoolId, username, handleNewNotification])

  const sendNotification = useCallback((data: Parameters<UseNotificationsReturn['sendNotification']>[0]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-notification', data)
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id))
  }, [])

  const markAllAsRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)))
  }, [notifications])

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setReadIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  return {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    sendNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
  }
}
