'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, GraduationCap, Users, UserPlus, BookOpen,
  CalendarCheck, FileCheck, BarChart3, DollarSign, Banknote,
  BedDouble, Bus, Library, Package, Heart, Scale, HeartPulse,
  Building, MessageSquare, Settings, Clock, Trophy, Coffee,
  ShoppingCart, Shield, Monitor, Calculator, FileText, UsersRound,
  ClipboardCheck, School, BellRing, ArrowRightLeft, Bell,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useAppStore } from '@/lib/store'
import { useRBAC } from '@/hooks/use-rbac'
import { useNotifications, type RealtimeNotification } from '@/hooks/use-notifications'
import { formatDualCurrency, getCurrentRate, fetchExchangeRate, type CurrencyCode } from '@/lib/currency'
import { getRoleDisplayName, getRoleColor, type UserRole } from '@/lib/rbac'
import { OfflineIndicator } from '@/components/offline-indicator'
import { AppSidebar, type NavGroup } from '@/components/app-sidebar'
import { AppHeader, type Notification } from '@/components/app-header'
import { ModuleHeader } from '@/components/module-helpers'
import { ModuleRenderer } from '@/components/module-registry'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

// ─── Navigation Config ────────────────────────────────────────────────────────
const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'students', label: 'Students', icon: GraduationCap },
      { id: 'staff', label: 'Staff', icon: Users },
      { id: 'admissions', label: 'Admissions', icon: UserPlus },
      { id: 'parent-portal', label: 'Parent Portal', icon: UsersRound },
      { id: 'student-portal', label: 'Student Portal', icon: GraduationCap },
      { id: 'teacher-portal', label: 'Teacher Portal', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'academics', label: 'Academics', icon: BookOpen },
      { id: 'timetable', label: 'Timetable', icon: Clock },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { id: 'examinations', label: 'Examinations', icon: FileCheck },
      { id: 'zimsec-import', label: 'ZIMSEC Import', icon: FileCheck },
      { id: 'elearning', label: 'E-Learning', icon: Monitor },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'bulk-operations', label: 'Bulk Operations', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'finance', label: 'Finance', icon: DollarSign },
      { id: 'fee-calculator', label: 'Fee Calculator', icon: Calculator },
      { id: 'payroll', label: 'Payroll', icon: Banknote },
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'boarding', label: 'Boarding', icon: BedDouble },
      { id: 'transport', label: 'Transport', icon: Bus },
      { id: 'library', label: 'Library', icon: Library },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'canteen', label: 'Canteen', icon: Coffee },
    ],
  },
  {
    label: 'Welfare',
    items: [
      { id: 'welfare', label: 'Welfare', icon: Heart },
      { id: 'discipline', label: 'Discipline', icon: Scale },
      { id: 'health', label: 'Health', icon: HeartPulse },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'alumni', label: 'Alumni', icon: UsersRound },
    ],
  },
  {
    label: 'Admin',
    items: [
      { id: 'sdc', label: 'SDC', icon: Building },
      { id: 'events', label: 'Events & Sports', icon: Trophy },
      { id: 'notification-center', label: 'Notifications', icon: BellRing },
      { id: 'communication', label: 'Communication', icon: MessageSquare },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'setup-wizard', label: 'Setup Wizard', icon: School },
    ],
  },
]

// ─── Initial Notifications ────────────────────────────────────────────────────
const initialNotifications: Notification[] = [
  { id: '1', icon: UserPlus, title: 'New Student Enrolled', description: 'Tendai Moyo has been enrolled in Form 3A', time: '5 min ago', read: false, type: 'enrollment' },
  { id: '2', icon: DollarSign, title: 'Fee Payment Received', description: 'Payment of $350.00 received from Chido Ndlovu', time: '15 min ago', read: false, type: 'payment' },
  { id: '3', icon: Shield, title: 'Attendance Alert', description: 'Form 2B has 5 students absent today', time: '1 hour ago', read: false, type: 'attendance' },
  { id: '4', icon: FileCheck, title: 'ZIMSEC Registration Deadline', description: 'O-Level registration closes in 3 days', time: '2 hours ago', read: false, type: 'deadline' },
  { id: '5', icon: Building, title: 'SDC Meeting Tomorrow', description: 'SDC meeting at 2:00 PM in the main hall', time: '3 hours ago', read: true, type: 'meeting' },
  { id: '6', icon: HeartPulse, title: 'Health Alert', description: '3 students in Form 1 reported flu symptoms', time: '5 hours ago', read: true, type: 'alert' },
  { id: '7', icon: Settings, title: 'System Update', description: 'ZimSchool Pro v2.4.1 installed successfully', time: 'Yesterday', read: true, type: 'system' },
]

// ─── Main Application ────────────────────────────────────────────────────────
export default function Home() {
  const { data: session, status } = useSession()
  const { activeModule } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  // RBAC
  const rbac = useRBAC((session?.user?.role as UserRole) || 'ADMIN')

  // Real-time Notifications
  const {
    notifications: wsNotifications,
    unreadCount: wsUnreadCount,
    isConnected: wsConnected,
    connectionStatus: wsStatus,
    markAsRead: wsMarkRead,
    markAllAsRead: wsMarkAllRead,
  } = useNotifications({
    role: rbac.currentRole,
    schoolId: 'default',
    username: session?.user?.name || 'Admin User',
    enabled: !!session,
  })

  // Exchange Rate
  const [exchangeRate, setExchangeRate] = useState(getCurrentRate().rate)
  useEffect(() => {
    fetchExchangeRate().then((rate) => setExchangeRate(rate.rate))
    const interval = setInterval(async () => {
      const rate = await fetchExchangeRate()
      setExchangeRate(rate.rate)
    }, 300000)
    return () => clearInterval(interval)
  }, [])

  // Filtered Navigation (RBAC)
  const filteredNavGroups = useMemo(() => rbac.filterNavGroups(navGroups), [rbac])

  // Merge WebSocket notifications
  const allNotifications = useMemo(() => {
    const wsMapped: Notification[] = wsNotifications.slice(0, 5).map((n) => ({
      id: n.id,
      icon: n.type === 'fee-payment' ? DollarSign
        : n.type === 'attendance-alert' ? Shield
        : n.type === 'exam-result' ? FileCheck
        : n.type === 'message-received' ? MessageSquare
        : Bell,
      title: n.title,
      description: n.description,
      time: new Date(n.timestamp).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: n.priority === 'critical' ? 'alert' : n.priority === 'high' ? 'deadline' : 'system' as Notification['type'],
    }))
    return [...wsMapped, ...notifications]
  }, [wsNotifications, notifications])

  const totalUnreadCount = useMemo(() => {
    return wsUnreadCount + notifications.filter(n => !n.read).length
  }, [wsUnreadCount, notifications])

  const handleLogout = useCallback(() => {
    toast('Signed out successfully', { description: 'You have been logged out of ZimSchool Pro' })
    signOut({ redirect: false })
  }, [])

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }, [])

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  // User info
  const userName = session?.user?.name || 'Admin User'
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!session) {
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" /></div>}>
        <ModuleRenderer moduleId="login" />
      </React.Suspense>
    )
  }

  return (
    <SidebarProvider style={{ '--sidebar-width': '280px' } as React.CSSProperties}>
      <OfflineIndicator />
      <AppSidebar
        onLogout={handleLogout}
        notificationCount={totalUnreadCount}
        userName={userName}
        userRole={getRoleDisplayName(rbac.currentRole)}
        userInitials={userInitials}
        currentRole={rbac.currentRole}
        onRoleChange={rbac.setCurrentRole}
        filteredNavGroups={filteredNavGroups}
      />
      <SidebarInset>
        <AppHeader
          onLogout={handleLogout}
          notifications={allNotifications}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          userName={userName}
          userInitials={userInitials}
          wsConnected={wsConnected}
          wsStatus={wsStatus}
          exchangeRate={exchangeRate}
          currentRole={rbac.currentRole}
          unreadCount={totalUnreadCount}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-gray-50/50 to-emerald-50/20 dark:from-background dark:to-background dot-pattern">
          <div className="module-enter">
            <ModuleHeader moduleId={activeModule} />
            <AnimatePresence mode="wait">
              <ModuleRenderer moduleId={activeModule} />
            </AnimatePresence>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
