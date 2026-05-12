'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, GraduationCap, Users, UserPlus, BookOpen,
  CalendarCheck, FileCheck, BarChart3, DollarSign, Banknote,
  BedDouble, Bus, Library, Package, Heart, Scale, HeartPulse,
  Building, MessageSquare, Settings, Clock, Trophy, Coffee,
  ShoppingCart, Shield, Monitor, Calculator, FileText, UsersRound,
  ClipboardCheck, School, BellRing, ArrowRightLeft, AlertCircle,
  CheckCircle2, ChevronRight, Globe, Printer, ShoppingBag, Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Module Info ──────────────────────────────────────────────────────────────
export const moduleInfo: Record<string, { title: string; description: string; icon: React.ElementType; gradient: string }> = {
  dashboard: { title: 'Dashboard', description: 'Overview of school operations', icon: LayoutDashboard, gradient: 'from-emerald-500 to-teal-600' },
  students: { title: 'Students', description: 'Manage student records and enrollment', icon: GraduationCap, gradient: 'from-emerald-500 to-teal-600' },
  staff: { title: 'Staff', description: 'Manage staff and teacher records', icon: Users, gradient: 'from-teal-500 to-cyan-600' },
  admissions: { title: 'Admissions', description: 'Process new student admissions', icon: UserPlus, gradient: 'from-cyan-500 to-sky-600' },
  academics: { title: 'Academics', description: 'Manage classes, subjects and curriculum', icon: BookOpen, gradient: 'from-emerald-500 to-green-600' },
  attendance: { title: 'Attendance', description: 'Track student and staff attendance', icon: CalendarCheck, gradient: 'from-teal-500 to-emerald-600' },
  examinations: { title: 'Examinations', description: 'Manage exams, grades and results', icon: FileCheck, gradient: 'from-amber-500 to-orange-600' },
  reports: { title: 'Reports', description: 'Generate and view school reports', icon: BarChart3, gradient: 'from-emerald-500 to-teal-600' },
  finance: { title: 'Finance', description: 'Manage school fees and finances', icon: DollarSign, gradient: 'from-amber-500 to-yellow-600' },
  payroll: { title: 'Payroll', description: 'Process staff salaries and payments', icon: Banknote, gradient: 'from-yellow-500 to-amber-600' },
  boarding: { title: 'Boarding', description: 'Manage hostel and boarding facilities', icon: BedDouble, gradient: 'from-teal-500 to-cyan-600' },
  transport: { title: 'Transport', description: 'Manage school transport routes', icon: Bus, gradient: 'from-cyan-500 to-teal-600' },
  library: { title: 'Library', description: 'Manage library resources and lending', icon: Library, gradient: 'from-emerald-500 to-green-600' },
  inventory: { title: 'Inventory', description: 'Track school assets and supplies', icon: Package, gradient: 'from-teal-500 to-emerald-600' },
  welfare: { title: 'Welfare', description: 'Student welfare and support programs', icon: Heart, gradient: 'from-rose-500 to-pink-600' },
  discipline: { title: 'Discipline', description: 'Manage disciplinary records and cases', icon: Scale, gradient: 'from-orange-500 to-amber-600' },
  health: { title: 'Health', description: 'Student health records and wellness', icon: HeartPulse, gradient: 'from-red-500 to-rose-600' },
  sdc: { title: 'SDC', description: 'School Development Committee management', icon: Building, gradient: 'from-emerald-500 to-teal-600' },
  timetable: { title: 'Timetable', description: 'Manage class schedules and periods', icon: Clock, gradient: 'from-emerald-500 to-teal-600' },
  events: { title: 'Events & Sports', description: 'School events, sports fixtures and activities', icon: Trophy, gradient: 'from-teal-500 to-emerald-600' },
  communication: { title: 'Communication', description: 'Manage school communications', icon: MessageSquare, gradient: 'from-teal-500 to-cyan-600' },
  settings: { title: 'Settings', description: 'System configuration and preferences', icon: Settings, gradient: 'from-gray-500 to-slate-600' },
  canteen: { title: 'Canteen', description: 'Canteen menu, POS, and inventory', icon: Coffee, gradient: 'from-orange-500 to-amber-600' },
  procurement: { title: 'Procurement', description: 'Purchase orders, vendors, and budgets', icon: ShoppingCart, gradient: 'from-teal-500 to-cyan-600' },
  security: { title: 'Security', description: 'Campus security, visitor management, and access control', icon: Shield, gradient: 'from-emerald-600 to-teal-700' },
  elearning: { title: 'E-Learning', description: 'Online courses, resources, and student progress', icon: Monitor, gradient: 'from-teal-500 to-emerald-600' },
  'fee-calculator': { title: 'Fee Calculator', description: 'Calculate fees, convert currencies, plan payments', icon: Calculator, gradient: 'from-emerald-500 to-teal-600' },
  documents: { title: 'Documents', description: 'Manage school documents and templates', icon: FileText, gradient: 'from-emerald-500 to-teal-600' },
  alumni: { title: 'Alumni', description: 'Alumni network, contributions and events', icon: UsersRound, gradient: 'from-teal-500 to-emerald-600' },
  'parent-portal': { title: 'Parent Portal', description: 'View children progress, fees, and communications', icon: UsersRound, gradient: 'from-emerald-500 to-teal-600' },
  'student-portal': { title: 'Student Portal', description: 'View grades, assignments, and schedule', icon: GraduationCap, gradient: 'from-teal-500 to-emerald-600' },
  'teacher-portal': { title: 'Teacher Portal', description: 'Manage classes, marks, assignments, and schedule', icon: ClipboardCheck, gradient: 'from-emerald-500 to-teal-600' },
  'setup-wizard': { title: 'Setup Wizard', description: 'Configure a new school with step-by-step wizard', icon: School, gradient: 'from-teal-500 to-emerald-600' },
  'zimsec-import': { title: 'ZIMSEC Bulk Import', description: 'Bulk register candidates for ZIMSEC exams', icon: FileCheck, gradient: 'from-amber-500 to-orange-600' },
  'notification-center': { title: 'Notification Center', description: 'SMS, WhatsApp, and email notification management', icon: BellRing, gradient: 'from-teal-500 to-cyan-600' },
  'bulk-operations': { title: 'Bulk Operations', description: 'Mass promotion, fee assignment, attendance, and data import', icon: ArrowRightLeft, gradient: 'from-emerald-500 to-teal-600' },
  'premium-templates': { title: 'Print Templates', description: 'Professional invoices, receipts, statements, and payslips', icon: Printer, gradient: 'from-emerald-500 to-teal-600' },
  'website-cms': { title: 'Website CMS', description: 'Manage your public school website content and pages', icon: Globe, gradient: 'from-emerald-500 to-teal-600' },
  'school-shop': { title: 'School Shop', description: 'Uniforms, stationery, textbooks, and school supplies', icon: ShoppingBag, gradient: 'from-emerald-500 to-teal-600' },
  'admin-cms': { title: 'Admin CMS', description: 'Comprehensive website content management, SEO, and branding', icon: Palette, gradient: 'from-teal-500 to-emerald-600' },
}

// ─── Module Breadcrumb Mapping ────────────────────────────────────────────────
const moduleGroupMap: Record<string, { group: string; path: string[] }> = {
  dashboard: { group: 'Main', path: ['Main', 'Dashboard'] },
  students: { group: 'People', path: ['People', 'Students'] },
  staff: { group: 'People', path: ['People', 'Staff'] },
  admissions: { group: 'People', path: ['People', 'Admissions'] },
  academics: { group: 'Academics', path: ['Academics', 'Classes & Subjects'] },
  timetable: { group: 'Academics', path: ['Academics', 'Timetable'] },
  attendance: { group: 'Academics', path: ['Academics', 'Attendance'] },
  examinations: { group: 'Academics', path: ['Academics', 'Examinations'] },
  elearning: { group: 'Academics', path: ['Academics', 'E-Learning'] },
  reports: { group: 'Academics', path: ['Academics', 'Reports'] },
  'bulk-operations': { group: 'Academics', path: ['Academics', 'Bulk Operations'] },
  'zimsec-import': { group: 'Academics', path: ['Academics', 'ZIMSEC Import'] },
  finance: { group: 'Finance', path: ['Finance', 'Fees & Billing'] },
  'fee-calculator': { group: 'Finance', path: ['Finance', 'Fee Calculator'] },
  payroll: { group: 'Finance', path: ['Finance', 'Payroll'] },
  procurement: { group: 'Finance', path: ['Finance', 'Procurement'] },
  'premium-templates': { group: 'Finance', path: ['Finance', 'Print Templates'] },
  boarding: { group: 'Operations', path: ['Operations', 'Boarding'] },
  transport: { group: 'Operations', path: ['Operations', 'Transport'] },
  library: { group: 'Operations', path: ['Operations', 'Library'] },
  inventory: { group: 'Operations', path: ['Operations', 'Inventory'] },
  canteen: { group: 'Operations', path: ['Operations', 'Canteen'] },
  'school-shop': { group: 'Operations', path: ['Operations', 'School Shop'] },
  welfare: { group: 'Welfare', path: ['Welfare', 'Support Programs'] },
  discipline: { group: 'Welfare', path: ['Welfare', 'Discipline'] },
  health: { group: 'Welfare', path: ['Welfare', 'Health'] },
  alumni: { group: 'Community', path: ['Community', 'Alumni'] },
  'parent-portal': { group: 'People', path: ['People', 'Parent Portal'] },
  'student-portal': { group: 'People', path: ['People', 'Student Portal'] },
  'teacher-portal': { group: 'People', path: ['People', 'Teacher Portal'] },
  sdc: { group: 'Admin', path: ['Admin', 'SDC'] },
  events: { group: 'Admin', path: ['Admin', 'Events & Sports'] },
  'notification-center': { group: 'Admin', path: ['Admin', 'Notifications'] },
  communication: { group: 'Admin', path: ['Admin', 'Communication'] },
  documents: { group: 'Admin', path: ['Admin', 'Documents'] },
  security: { group: 'Admin', path: ['Admin', 'Security'] },
  settings: { group: 'Admin', path: ['Admin', 'Settings'] },
  'setup-wizard': { group: 'Admin', path: ['Admin', 'Setup Wizard'] },
  'website-cms': { group: 'Admin', path: ['Admin', 'Website CMS'] },
  'admin-cms': { group: 'Admin', path: ['Admin', 'Admin CMS'] },
}

// ─── Module Header Component ──────────────────────────────────────────────────
export function ModuleHeader({ moduleId }: { moduleId: string }) {
  const info = moduleInfo[moduleId]
  const breadcrumb = moduleGroupMap[moduleId]
  if (!info || !breadcrumb) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      {/* Breadcrumb Navigation */}
      <motion.nav
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3"
        aria-label="Breadcrumb"
      >
        <div className="flex h-4 w-4 items-center justify-center rounded bg-muted/60">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        {breadcrumb.path.map((segment, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 mx-0.5" />
            )}
            <span
              className={cn(
                'transition-all duration-200 px-1.5 py-0.5 rounded',
                i === breadcrumb.path.length - 1
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/30'
                  : 'hover:text-foreground hover:bg-muted/40 cursor-default'
              )}
            >
              {segment}
            </span>
          </React.Fragment>
        ))}
      </motion.nav>

      {/* Module Title with gradient accent */}
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md relative overflow-hidden',
            info.gradient
          )}
        >
          <info.icon className="h-5 w-5 relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">{info.title}</h2>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 bg-emerald-50/50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50">
              {breadcrumb.group}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
          {/* Gradient accent bar under title */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className={cn('mt-1.5 h-[2px] w-24 rounded-full origin-left bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_100%] animate-gradient-x', info.gradient)}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Module Placeholder Component ─────────────────────────────────────────────
export function ModulePlaceholder({ moduleId }: { moduleId: string }) {
  const info = moduleInfo[moduleId]
  if (!info) return null
  const Icon = info.icon

  return (
    <motion.div
      key={moduleId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card className="border-0 shadow-md overflow-hidden">
        <div className={cn('h-40 bg-gradient-to-br flex items-center justify-center relative', info.gradient)}>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5" />
          <div className="text-center text-white relative z-10">
            <Icon className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl font-bold">{info.title}</h2>
            <p className="text-sm opacity-80 mt-1">{info.description}</p>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Module Coming Soon</p>
              <p className="text-xs text-muted-foreground">This module is under development. Full functionality will be available in the next update.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['Data Management', 'Reports & Analytics', 'Configuration'].map((feature) => (
              <div key={feature} className="flex items-center gap-2 p-3 rounded-lg border">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
