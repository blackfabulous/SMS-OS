'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserPlus,
  BookOpen,
  CalendarCheck,
  FileCheck,
  BarChart3,
  DollarSign,
  Banknote,
  BedDouble,
  Bus,
  Library,
  Package,
  Heart,
  Scale,
  HeartPulse,
  Building,
  MessageSquare,
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  School,
  LogOut,
  User,
  Shield,
  Plus,
  CreditCard,
  ClipboardCheck,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  UsersRound,
  Wallet,
  Activity,
  RefreshCw,
  Calculator,
  Coffee,
  ShoppingCart,
  Trophy,
  Monitor,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Zap,
  BellRing,
  X,
  Flag,
  Star,
  AlertTriangle,
  MapPin,
  Award,
  Megaphone,
  Wrench,
  Home as HomeIcon,
  Users as UsersIcon2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts'

import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { GlobalSearch } from '@/components/global-search'
import StudentsModule from '@/components/modules/students-module'
import StaffModule from '@/components/modules/staff-module'
import FinanceModule from '@/components/modules/finance-module'
import AttendanceModule from '@/components/modules/attendance-module'
import BoardingModule from '@/components/modules/boarding-module'
import TransportModule from '@/components/modules/transport-module'
import LibraryModule from '@/components/modules/library-module'
import InventoryModule from '@/components/modules/inventory-module'
import AcademicsModule from '@/components/modules/academics-module'
import ExaminationsModule from '@/components/modules/examinations-module'
import WelfareModule from '@/components/modules/welfare-module'
import DisciplineModule from '@/components/modules/discipline-module'
import HealthModule from '@/components/modules/health-module'
import AdmissionsModule from '@/components/modules/admissions-module'
import PayrollModule from '@/components/modules/payroll-module'
import SDCModule from '@/components/modules/sdc-module'
import CommunicationModule from '@/components/modules/communication-module'
import ReportsModule from '@/components/modules/reports-module'
import SettingsModule from '@/components/modules/settings-module'
import TimetableModule from '@/components/modules/timetable-module'
import EventsModule from '@/components/modules/events-module'
import CanteenModule from '@/components/modules/canteen-module'
import ProcurementModule from '@/components/modules/procurement-module'
import DocumentsModule from '@/components/modules/documents-module'
import AlumniModule from '@/components/modules/alumni-module'
import SecurityModule from '@/components/modules/security-module'
import ElearningModule from '@/components/modules/elearning-module'
import ParentPortalModule from '@/components/modules/parent-portal-module'
import StudentPortalModule from '@/components/modules/student-portal-module'
import FeeCalculatorModule from '@/components/modules/fee-calculator-module'
import TeacherPortalModule from '@/components/modules/teacher-portal-module'
import NotificationCenterModule from '@/components/modules/notification-center-module'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Navigation Config ────────────────────────────────────────────────────────
const navGroups = [
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
      { id: 'elearning', label: 'E-Learning', icon: Monitor },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
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
    ],
  },
]

// ─── Chart Configs ────────────────────────────────────────────────────────────
const genderChartConfig = {
  male: { label: 'Male', color: '#10b981' },
  female: { label: 'Female', color: '#f59e0b' },
} satisfies ChartConfig

const enrollmentChartConfig = {
  students: { label: 'Students', color: '#10b981' },
} satisfies ChartConfig

const feeChartConfig = {
  collected: { label: 'Collected', color: '#10b981' },
  target: { label: 'Target', color: '#d1d5db' },
} satisfies ChartConfig

const attendanceTrendChartConfig = {
  present: { label: 'Present %', color: '#10b981' },
} satisfies ChartConfig

// ─── Upcoming Events & Holidays (Zimbabwe) ────────────────────────────────────
const currentYear = new Date().getFullYear()
const upcomingEventsData = [
  { id: 1, name: 'Independence Day', date: `${currentYear}-04-18`, type: 'Holiday' as const, icon: Flag },
  { id: 2, name: 'Workers Day', date: `${currentYear}-05-01`, type: 'Holiday' as const, icon: Users },
  { id: 3, name: 'Africa Day', date: `${currentYear}-05-25`, type: 'Holiday' as const, icon: Star },
  { id: 4, name: 'Heroes Day', date: `${currentYear}-08-11`, type: 'Holiday' as const, icon: Flag },
  { id: 5, name: 'Defence Forces Day', date: `${currentYear}-08-12`, type: 'Holiday' as const, icon: Shield },
  { id: 6, name: 'Mid-Term Break', date: `${currentYear}-06-28`, type: 'Event' as const, icon: Calendar },
  { id: 7, name: 'ZIMSEC Exam Period', date: `${currentYear}-10-15`, type: 'Exam' as const, icon: FileCheck },
  { id: 8, name: 'SDC Quarterly Meeting', date: `${currentYear}-04-10`, type: 'Meeting' as const, icon: Building },
].map(e => {
  const eventDate = new Date(e.date)
  const now = new Date()
  const diffTime = eventDate.getTime() - now.getTime()
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return { ...e, dateObj: eventDate, daysUntil }
}).filter(e => e.daysUntil >= -1).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 6)

// ─── Attendance Trend Data (Weekly) ───────────────────────────────────────────
const weeklyAttendanceData = [
  { day: 'Mon', present: 94.2 },
  { day: 'Tue', present: 92.8 },
  { day: 'Wed', present: 96.1 },
  { day: 'Thu', present: 91.5 },
  { day: 'Fri', present: 89.3 },
]

// ─── Alerts & Reminders Data ──────────────────────────────────────────────────
const alertsData = [
  {
    id: 1,
    severity: 'critical' as const,
    title: 'Outstanding Fees Alert',
    description: '3 students have outstanding fees exceeding $500',
    action: 'View Debtors',
    module: 'finance' as const,
  },
  {
    id: 2,
    severity: 'critical' as const,
    title: 'ZIMSEC Registration Deadline',
    description: 'O-Level registration closes in 5 days. 12 candidates pending.',
    action: 'Register Now',
    module: 'examinations' as const,
  },
  {
    id: 3,
    severity: 'warning' as const,
    title: 'Staff on Leave Today',
    description: '5 staff members are on leave today, including 2 teachers',
    action: 'View Schedule',
    module: 'staff' as const,
  },
  {
    id: 4,
    severity: 'warning' as const,
    title: 'Maintenance Overdue',
    description: '2 maintenance requests have been overdue for 7+ days',
    action: 'View Requests',
    module: 'inventory' as const,
  },
  {
    id: 5,
    severity: 'info' as const,
    title: 'Boarding Capacity',
    description: 'Boarding facility is at 92% capacity - 8 beds remaining',
    action: 'View Boarding',
    module: 'boarding' as const,
  },
  {
    id: 6,
    severity: 'info' as const,
    title: 'SDC Meeting Tomorrow',
    description: 'School Development Committee meeting at 2:00 PM in the main hall',
    action: 'View Details',
    module: 'sdc' as const,
  },
]

// ─── Quick Stats Footer Data ──────────────────────────────────────────────────
const quickStatsData = [
  { icon: GraduationCap, label: 'Grade Levels', value: '13' },
  { icon: BookOpen, label: 'Total Classes', value: '28' },
  { icon: Users, label: 'Teacher:Student', value: '1:24' },
  { icon: BarChart3, label: 'Avg Class Size', value: '32' },
  { icon: HomeIcon, label: 'Boarding Occupancy', value: '92%' },
  { icon: Library, label: 'Library Books', value: '4,250' },
]

// ─── Activity helpers ─────────────────────────────────────────────────────────
const activityIcons = {
  enrollment: UserPlus,
  payment: DollarSign,
  attendance: CalendarCheck,
  event: Calendar,
  library: Library,
  exam: FileCheck,
}

const activityColors = {
  enrollment: 'text-emerald-600 bg-emerald-50',
  payment: 'text-amber-600 bg-amber-50',
  attendance: 'text-teal-600 bg-teal-50',
  event: 'text-violet-600 bg-violet-50',
  library: 'text-sky-600 bg-sky-50',
  exam: 'text-rose-600 bg-rose-50',
}

// ─── Module Placeholders ──────────────────────────────────────────────────────
const moduleInfo: Record<string, { title: string; description: string; icon: React.ElementType; gradient: string }> = {
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
  'notification-center': { title: 'Notification Center', description: 'SMS, WhatsApp, and email notification management', icon: BellRing, gradient: 'from-teal-500 to-cyan-600' },
}

// ─── App Sidebar Component ────────────────────────────────────────────────────
function AppSidebar({ onLogout, notificationCount }: { onLogout: () => void; notificationCount: number }) {
  const { activeModule, setActiveModule } = useAppStore()

  return (
    <Sidebar collapsible="icon" className="border-r-0 sidebar-watermark bg-gradient-to-b from-sidebar via-sidebar to-emerald-50/30 dark:to-emerald-950/20">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-200/70 dark:hover:shadow-emerald-800/40">
            <School className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">ZimSchool Pro</span>
              {notificationCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <div className="sidebar-divider" />

      <SidebarContent className="px-2 py-2 sidebar-scroll">
        {navGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label} className={cn("py-1", groupIndex > 0 && "mt-1")}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2 flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-400/40" />
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeModule === item.id
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setActiveModule(item.id)}
                        tooltip={item.label}
                        className={cn(
                          'transition-all duration-200 group relative hover-ripple',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 hover:text-emerald-800 [&>svg]:text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200 dark:[&>svg]:text-emerald-400'
                            : 'hover:bg-muted/60 hover:translate-x-0.5'
                        )}
                      >
                        <item.icon className={cn(
                          'transition-all duration-200',
                          isActive ? 'text-emerald-600' : 'text-muted-foreground group-hover:text-emerald-500'
                        )} />
                        <span>{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Separator className="mb-3 opacity-60" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-all duration-200 hover:bg-muted/60 hover:ring-1 hover:ring-emerald-200/50 dark:hover:ring-emerald-800/30 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group">
              <Avatar className="h-8 w-8 border-2 border-emerald-200 dark:border-emerald-800 transition-colors group-hover:border-emerald-400 dark:group-hover:border-emerald-600">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                  AU
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-[10px] text-muted-foreground">Super Administrator</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-emerald-500 transition-colors group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Shield className="mr-2 h-4 w-4" /> Security</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

// ─── Notification Data ────────────────────────────────────────────────────────
interface Notification {
  id: string
  icon: React.ElementType
  title: string
  description: string
  time: string
  read: boolean
  type: 'enrollment' | 'payment' | 'attendance' | 'exam' | 'meeting' | 'deadline' | 'alert' | 'system'
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    icon: UserPlus,
    title: 'New Student Enrolled',
    description: 'Tendai Moyo has been enrolled in Form 3A',
    time: '5 min ago',
    read: false,
    type: 'enrollment',
  },
  {
    id: '2',
    icon: DollarSign,
    title: 'Fee Payment Received',
    description: 'Payment of $350.00 received from Chido Ndlovu',
    time: '15 min ago',
    read: false,
    type: 'payment',
  },
  {
    id: '3',
    icon: AlertCircle,
    title: 'Attendance Alert',
    description: 'Form 2B has 5 students absent today - above threshold',
    time: '1 hour ago',
    read: false,
    type: 'attendance',
  },
  {
    id: '4',
    icon: FileCheck,
    title: 'ZIMSEC Registration Deadline',
    description: 'O-Level registration closes in 3 days. 12 candidates pending.',
    time: '2 hours ago',
    read: false,
    type: 'deadline',
  },
  {
    id: '5',
    icon: Building,
    title: 'SDC Meeting Tomorrow',
    description: 'School Development Committee meeting at 2:00 PM in the main hall',
    time: '3 hours ago',
    read: true,
    type: 'meeting',
  },
  {
    id: '6',
    icon: DollarSign,
    title: 'Fee Payment Received',
    description: 'Payment of $200.00 received from Kudzai Chikumbu',
    time: '4 hours ago',
    read: true,
    type: 'payment',
  },
  {
    id: '7',
    icon: HeartPulse,
    title: 'Health Alert',
    description: '3 students in Form 1 reported flu symptoms today',
    time: '5 hours ago',
    read: true,
    type: 'alert',
  },
  {
    id: '8',
    icon: Settings,
    title: 'System Update',
    description: 'ZimSchool Pro v2.4.1 has been installed successfully',
    time: 'Yesterday',
    read: true,
    type: 'system',
  },
]

const notificationTypeColors: Record<string, string> = {
  enrollment: 'text-emerald-600 bg-emerald-50',
  payment: 'text-amber-600 bg-amber-50',
  attendance: 'text-red-600 bg-red-50',
  exam: 'text-violet-600 bg-violet-50',
  meeting: 'text-teal-600 bg-teal-50',
  deadline: 'text-orange-600 bg-orange-50',
  alert: 'text-rose-600 bg-rose-50',
  system: 'text-slate-600 bg-slate-50',
}

// ─── Header Component ─────────────────────────────────────────────────────────
function AppHeader({ onLogout, notifications, onMarkAllRead, onMarkRead }: {
  onLogout: () => void
  notifications: Notification[]
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
}) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-xl px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-background">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-semibold">Notifications</h4>
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px] bg-emerald-100 text-emerald-700">
                    {notifications.filter(n => !n.read).length} new
                  </Badge>
                )}
              </div>
              {notifications.some(n => !n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                  onClick={onMarkAllRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[320px]">
              <div className="flex flex-col">
                {notifications.map((notification) => {
                  const IconComp = notification.icon
                  return (
                    <button
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 w-full',
                        !notification.read && 'bg-emerald-50/50 dark:bg-emerald-950/20'
                      )}
                      onClick={() => onMarkRead(notification.id)}
                    >
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', notificationTypeColors[notification.type])}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('text-sm truncate', !notification.read ? 'font-semibold' : 'font-medium')}>{notification.title}</p>
                          {!notification.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{notification.time}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="border-t px-4 py-2">
              <Button variant="ghost" size="sm" className="w-full text-xs text-emerald-600 hover:text-emerald-700">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-semibold">
                  AU
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  accentColor,
  bgColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  trend: 'up' | 'down'
  trendLabel: string
  accentColor: string
  bgColor: string
}) {
  const accentGradient = accentColor === 'text-emerald-600' ? 'from-emerald-400 to-teal-500' : accentColor === 'text-teal-600' ? 'from-teal-400 to-cyan-500' : accentColor === 'text-amber-600' ? 'from-amber-400 to-orange-500' : 'from-violet-400 to-purple-500'

  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 stat-card-accent premium-card group cursor-default">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold tracking-tight count-up">{value}</p>
            <div className={cn('flex items-center gap-1.5', trend === 'up' && 'trend-pulse')}>
              {trend === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={cn('text-xs font-medium', trend === 'up' ? 'text-emerald-600' : 'text-red-500')}>
                {trendLabel}
              </span>
            </div>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3 shadow-sm', bgColor)}>
            <Icon className={cn('h-5 w-5 transition-transform duration-300 group-hover:animate-bounce-subtle', accentColor)} />
          </div>
        </div>
      </CardContent>
      {/* Decorative gradient line at top with shimmer effect */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', accentGradient)}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
    </Card>
  )
}

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Chart Card Skeleton ──────────────────────────────────────────────────────
function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, color, onClick }: { icon: React.ElementType; label: string; color: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/40 bg-muted/30 hover:bg-white dark:hover:bg-card group premium-card">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </button>
  )
}

// ─── Dashboard Data Types ─────────────────────────────────────────────────────
interface DashboardData {
  enrollment: {
    total: number
    active: number
    newThisYear: number
    boarding: number
    dayScholars: number
    beamBeneficiaries: number
    byStatus: Record<string, number>
  }
  genderDistribution: Record<string, number>
  gradeDistribution: Record<string, number>
  attendance: {
    total: number
    present: number
    absent: number
    late: number
    rate: string
  }
  finance: {
    totalInvoiced: number
    totalCollected: number
    totalOutstanding: number
    totalInvoices: number
    paidInvoices: number
    overdueInvoices: number
    collectionRate: string
  }
  staff: {
    total: number
    active: number
    teaching: number
    nonTeaching: number
  }
  recentActivities: {
    students: Array<{
      id: string
      firstName: string
      lastName: string
      studentNumber: string
      enrollmentStatus: string
      createdAt: string
    }>
    payments: Array<{
      id: string
      amount: number
      paymentMethod: string
      receiptNumber: string
      createdAt: string
      student: {
        firstName: string
        lastName: string
        studentNumber: string
      }
    }>
  }
}

interface FinanceData {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  debtorCount: number
  invoiceStatusBreakdown: {
    pending: number
    partial: number
    paid: number
    overdue: number
  }
  paymentsByMethod: Array<{ paymentMethod: string; _sum: { amount: number }; _count: number }>
  monthlyCollectionTrend: Record<string, number>
  collectionRate: string
}

interface AttendanceData {
  summary: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
    attendanceRate: string
  }
  byClass: Record<string, { present: number; absent: number; late: number; total: number }>
}

// ─── Time Ago Helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric' })
}

// ─── Dashboard Component ──────────────────────────────────────────────────────
function Dashboard() {
  const { schoolName, setActiveModule } = useAppStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-ZW', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [dashboardRes, financeRes, attendanceRes] = await Promise.allSettled([
          fetch('/api/dashboard'),
          fetch('/api/finance'),
          fetch('/api/attendance'),
        ])

        if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
          setDashboardData(await dashboardRes.value.json())
        }

        if (financeRes.status === 'fulfilled' && financeRes.value.ok) {
          setFinanceData(await financeRes.value.json())
        }

        if (attendanceRes.status === 'fulfilled' && attendanceRes.value.ok) {
          setAttendanceData(await attendanceRes.value.json())
        }

        if (dashboardRes.status === 'rejected' || (dashboardRes.status === 'fulfilled' && !dashboardRes.value.ok)) {
          setError('Failed to load dashboard data. Please try again.')
        }
      } catch {
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Build enrollment chart data from API
  const enrollmentChartData = useMemo(() => {
    if (!dashboardData?.gradeDistribution) return []
    return Object.entries(dashboardData.gradeDistribution)
      .sort(([a], [b]) => {
        const order = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7']
        return order.indexOf(a) - order.indexOf(b)
      })
      .map(([grade, students]) => ({ grade, students }))
  }, [dashboardData])

  // Build gender chart data from API
  const genderChartData = useMemo(() => {
    if (!dashboardData?.genderDistribution) return []
    const data = Object.entries(dashboardData.genderDistribution).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      fill: name.toUpperCase() === 'MALE' ? 'var(--color-male)' : 'var(--color-female)',
    }))
    return data
  }, [dashboardData])

  // Build fee collection trend from finance API
  const feeCollectionChartData = useMemo(() => {
    if (!financeData?.monthlyCollectionTrend) return []
    const months = Object.entries(financeData.monthlyCollectionTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)

    if (months.length === 0) return []

    return months.map(([monthKey, collected]) => {
      const date = new Date(monthKey + '-01')
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
      // Estimate target as average collected rounded up, or just use a reasonable target
      const avgTarget = Math.ceil(collected / 0.85) // assume 85% collection target
      return { month: monthLabel, collected, target: avgTarget }
    })
  }, [financeData])

  // Build recent activities from API data
  const recentActivitiesData = useMemo(() => {
    const activities: Array<{
      id: string
      text: string
      time: string
      type: 'enrollment' | 'payment' | 'attendance'
    }> = []

    // Add recent student enrollments
    if (dashboardData?.recentActivities?.students) {
      for (const student of dashboardData.recentActivities.students) {
        activities.push({
          id: `student-${student.id}`,
          text: `${student.firstName} ${student.lastName} enrolled (${student.studentNumber})`,
          time: timeAgo(student.createdAt),
          type: 'enrollment',
        })
      }
    }

    // Add recent payments
    if (dashboardData?.recentActivities?.payments) {
      for (const payment of dashboardData.recentActivities.payments) {
        activities.push({
          id: `payment-${payment.id}`,
          text: `Payment of $${payment.amount.toLocaleString()} received from ${payment.student.firstName} ${payment.student.lastName}`,
          time: timeAgo(payment.createdAt),
          type: 'payment',
        })
      }
    }

    // Add attendance entry if we have data
    if (attendanceData?.summary && attendanceData.summary.total > 0) {
      activities.push({
        id: 'attendance-today',
        text: `Today's attendance: ${attendanceData.summary.present} present, ${attendanceData.summary.absent} absent, ${attendanceData.summary.late} late`,
        time: 'Today',
        type: 'attendance',
      })
    }

    // Sort by recency (approximate - enrollment and payment items already have proper timeAgo)
    // Put 'Today' items and 'Just now' items first
    return activities.slice(0, 8)
  }, [dashboardData, attendanceData])

  // Derive stat values from API
  const totalStudents = dashboardData?.enrollment?.total ?? 0
  const activeStudents = dashboardData?.enrollment?.active ?? 0
  const newThisYear = dashboardData?.enrollment?.newThisYear ?? 0
  const totalStaff = dashboardData?.staff?.total ?? 0
  const collectionRate = dashboardData?.finance?.collectionRate ?? '0'
  const attendanceRate = dashboardData?.attendance?.rate ?? '0'
  const maleCount = dashboardData?.genderDistribution?.MALE ?? dashboardData?.genderDistribution?.Male ?? 0
  const femaleCount = dashboardData?.genderDistribution?.FEMALE ?? dashboardData?.genderDistribution?.Female ?? 0

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-200/50 overflow-hidden relative">
          <CardContent className="p-6 md:p-8">
            {/* Sparkle/particle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-4 left-1/4 h-1.5 w-1.5 rounded-full bg-white/40 animate-sparkle" style={{ animationDelay: '0s' }} />
              <div className="absolute top-8 right-1/3 h-1 w-1 rounded-full bg-white/30 animate-sparkle" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-12 left-1/2 h-1.5 w-1.5 rounded-full bg-white/35 animate-sparkle" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 right-1/4 h-1 w-1 rounded-full bg-white/25 animate-sparkle" style={{ animationDelay: '1.5s' }} />
              <div className="absolute bottom-6 right-12 h-1.5 w-1.5 rounded-full bg-white/30 animate-sparkle" style={{ animationDelay: '0.8s' }} />
              <div className="absolute top-1/3 left-16 h-1 w-1 rounded-full bg-white/20 animate-sparkle" style={{ animationDelay: '2s' }} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <School className="h-5 w-5 text-emerald-200" />
                <span className="text-sm font-medium text-emerald-100">{schoolName}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome to <span className="text-white drop-shadow-sm">ZimSchool Pro</span></h1>
              <p className="mt-1 text-emerald-100 text-sm md:text-base">Your comprehensive school management dashboard</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 animate-pulse-glow shadow-sm shadow-emerald-900/10">
                  <Calendar className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{today}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 shadow-sm shadow-emerald-900/10">
                  <Activity className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium animate-pulse-glow">Term 1, {new Date().getFullYear()}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 shadow-sm shadow-emerald-900/10">
                  <Clock className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{activeStudents} Active Students</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 shadow-sm shadow-emerald-900/10">
                  <School className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{schoolName || 'Mufakose High School'}</span>
                </div>
              </div>
            </div>
            {/* Decorative circles with subtle float animation */}
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 animate-float" />
            <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5 animate-float-slow" />
            <div className="absolute right-20 top-8 h-20 w-20 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-0 shadow-md border-l-4 border-l-red-400">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={GraduationCap}
              label="Total Students"
              value={totalStudents.toLocaleString()}
              trend="up"
              trendLabel={`+${newThisYear} this year`}
              accentColor="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <StatCard
              icon={Users}
              label="Total Staff"
              value={totalStaff.toLocaleString()}
              trend="up"
              trendLabel={`${dashboardData?.staff?.teaching ?? 0} teaching`}
              accentColor="text-teal-600"
              bgColor="bg-teal-50"
            />
            <StatCard
              icon={DollarSign}
              label="Fee Collection"
              value={`${collectionRate}%`}
              trend={parseFloat(collectionRate) >= 80 ? 'up' : 'down'}
              trendLabel={`${dashboardData?.finance?.paidInvoices ?? 0} invoices paid`}
              accentColor="text-amber-600"
              bgColor="bg-amber-50"
            />
            <StatCard
              icon={CalendarCheck}
              label="Attendance Rate"
              value={`${attendanceRate}%`}
              trend={parseFloat(attendanceRate) >= 90 ? 'up' : 'down'}
              trendLabel={`${dashboardData?.attendance?.present ?? 0} present today`}
              accentColor="text-violet-600"
              bgColor="bg-violet-50"
            />
          </>
        )}
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Enrollment by Grade */}
        {loading ? (
          <ChartCardSkeleton title="Enrollment by Grade" />
        ) : (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Enrollment by Grade</CardTitle>
              <CardDescription>Current term student distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentChartData.length > 0 ? (
                <ChartContainer config={enrollmentChartConfig} className="h-[250px] w-full">
                  <BarChart data={enrollmentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="grade" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="students" fill="var(--color-students)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No enrollment data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gender Distribution */}
        {loading ? (
          <ChartCardSkeleton title="Gender Distribution" />
        ) : (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Gender Distribution</CardTitle>
              <CardDescription>Male vs Female student ratio</CardDescription>
            </CardHeader>
            <CardContent>
              {genderChartData.length > 0 ? (
                <>
                  <div className="flex items-center justify-center">
                    <ChartContainer config={genderChartConfig} className="h-[250px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <Pie
                          data={genderChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          strokeWidth={0}
                        >
                          {genderChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-2">
                    {genderChartData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className={cn('h-3 w-3 rounded-full', entry.name === 'Male' ? 'bg-emerald-500' : 'bg-amber-500')} />
                        <span className="text-sm text-muted-foreground">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No gender data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Fee Collection + Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fee Collection Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Fee Collection Trend</CardTitle>
              <CardDescription>Monthly collection vs target (USD)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[220px] w-full rounded-lg" />
              ) : feeCollectionChartData.length > 0 ? (
                <ChartContainer config={feeChartConfig} className="h-[220px] w-full">
                  <AreaChart data={feeCollectionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="target" stroke="#d1d5db" fill="#f9fafb" strokeWidth={2} strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="collected" stroke="var(--color-collected)" fill="var(--color-collected)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No financial data available</p>
                  </div>
                </div>
              )}
              {/* Financial Summary */}
              {!loading && financeData && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                    <p className="text-[10px] font-medium text-emerald-600 uppercase">Collected</p>
                    <p className="text-sm font-bold text-emerald-700">${financeData.totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-3 py-2">
                    <p className="text-[10px] font-medium text-amber-600 uppercase">Outstanding</p>
                    <p className="text-sm font-bold text-amber-700">${financeData.totalOutstanding.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Overview Mini-Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Attendance Overview</CardTitle>
                  <CardDescription>Weekly attendance trend</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5">
                    <CalendarCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">{attendanceRate}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full rounded-lg" />
              ) : (
                <>
                  <ChartContainer config={attendanceTrendChartConfig} className="h-[180px] w-full">
                    <LineChart data={weeklyAttendanceData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="present" stroke="var(--color-present)" strokeWidth={3} dot={{ fill: 'var(--color-present)', r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ChartContainer>
                  {/* Attendance by Level */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-teal-50 px-3 py-2">
                      <p className="text-[10px] font-medium text-teal-600 uppercase">Primary Attendance</p>
                      <p className="text-sm font-bold text-teal-700">94.2%</p>
                    </div>
                    <div className="rounded-lg bg-cyan-50 px-3 py-2">
                      <p className="text-[10px] font-medium text-cyan-600 uppercase">Secondary Attendance</p>
                      <p className="text-sm font-bold text-cyan-700">91.8%</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity + Upcoming Events & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 hover:text-emerald-700">
                  View All <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivitiesData.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {recentActivitiesData.map((activity) => {
                    const Icon = activityIcons[activity.type]
                    const colorClass = activityColors[activity.type]
                    return (
                      <div key={activity.id} className="flex items-start gap-3 group">
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug line-clamp-2">{activity.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events & Holidays Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Upcoming Events & Holidays</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => setActiveModule('events')}>
                  View Calendar <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {upcomingEventsData.map((event) => {
                  const EventIcon = event.icon
                  const typeBadgeColors: Record<string, string> = {
                    Holiday: 'bg-emerald-100 text-emerald-700',
                    Event: 'bg-amber-100 text-amber-700',
                    Exam: 'bg-rose-100 text-rose-700',
                    Meeting: 'bg-cyan-100 text-cyan-700',
                  }
                  const iconColors: Record<string, string> = {
                    Holiday: 'bg-emerald-50 text-emerald-600',
                    Event: 'bg-amber-50 text-amber-600',
                    Exam: 'bg-rose-50 text-rose-600',
                    Meeting: 'bg-cyan-50 text-cyan-600',
                  }
                  return (
                    <div key={event.id} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-emerald-50/30 hover:border-emerald-200">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconColors[event.type])}>
                        <EventIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{event.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.dateObj.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', typeBadgeColors[event.type])}>
                          {event.type}
                        </Badge>
                        <span className={cn(
                          'text-[10px] font-medium',
                          event.daysUntil <= 3 ? 'text-rose-600' : event.daysUntil <= 7 ? 'text-amber-600' : 'text-muted-foreground'
                        )}>
                          {event.daysUntil === 0 ? 'Today' : event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil} days`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <QuickAction icon={Plus} label="Add Student" color="bg-emerald-50 text-emerald-600" onClick={() => setActiveModule('students')} />
              <QuickAction icon={CreditCard} label="Record Payment" color="bg-amber-50 text-amber-600" onClick={() => setActiveModule('finance')} />
              <QuickAction icon={ClipboardCheck} label="Take Attendance" color="bg-teal-50 text-teal-600" onClick={() => setActiveModule('attendance')} />
              <QuickAction icon={FileText} label="Generate Report" color="bg-violet-50 text-violet-600" onClick={() => setActiveModule('reports')} />
              <QuickAction icon={UsersRound} label="Add Staff" color="bg-cyan-50 text-cyan-600" onClick={() => setActiveModule('staff')} />
              <QuickAction icon={Wallet} label="View Finances" color="bg-orange-50 text-orange-600" onClick={() => setActiveModule('finance')} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts & Reminders Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base font-semibold">Alerts & Reminders</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px] px-2 bg-emerald-100 text-emerald-700">
                {alertsData.length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alertsData.map((alert, index) => {
                const severityStyles: Record<string, { icon: React.ElementType; border: string; bg: string; iconBg: string; iconColor: string; badge: string }> = {
                  critical: { icon: AlertTriangle, border: 'border-l-red-400', bg: 'bg-red-50/50', iconBg: 'bg-red-100', iconColor: 'text-red-600', badge: 'bg-red-100 text-red-700' },
                  warning: { icon: AlertCircle, border: 'border-l-amber-400', bg: 'bg-amber-50/50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
                  info: { icon: Bell, border: 'border-l-teal-400', bg: 'bg-teal-50/50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
                }
                const style = severityStyles[alert.severity]
                const SeverityIcon = style.icon
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                  >
                    <div className={cn('rounded-xl border border-l-4 p-4 transition-all hover:shadow-md', style.border, style.bg)}>
                      <div className="flex items-start gap-3">
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', style.iconBg)}>
                          <SeverityIcon className={cn('h-4 w-4', style.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold truncate">{alert.title}</p>
                            <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0 h-4 border-0 shrink-0', style.badge)}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 mt-2 text-xs px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setActiveModule(alert.module)}
                          >
                            {alert.action} <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
      >
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-emerald-50/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickStatsData.map((stat, index) => {
                const StatIcon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                    className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow-sm border border-emerald-100/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <StatIcon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold tracking-tight leading-none">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
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
  finance: { group: 'Finance', path: ['Finance', 'Fees & Billing'] },
  payroll: { group: 'Finance', path: ['Finance', 'Payroll'] },
  procurement: { group: 'Finance', path: ['Finance', 'Procurement'] },
  boarding: { group: 'Operations', path: ['Operations', 'Boarding'] },
  transport: { group: 'Operations', path: ['Operations', 'Transport'] },
  library: { group: 'Operations', path: ['Operations', 'Library'] },
  inventory: { group: 'Operations', path: ['Operations', 'Inventory'] },
  canteen: { group: 'Operations', path: ['Operations', 'Canteen'] },
  welfare: { group: 'Welfare', path: ['Welfare', 'Support Programs'] },
  discipline: { group: 'Welfare', path: ['Welfare', 'Discipline'] },
  health: { group: 'Welfare', path: ['Welfare', 'Health'] },
  alumni: { group: 'Community', path: ['Community', 'Alumni'] },
  'parent-portal': { group: 'People', path: ['People', 'Parent Portal'] },
  'student-portal': { group: 'People', path: ['People', 'Student Portal'] },
  sdc: { group: 'Admin', path: ['Admin', 'SDC'] },
  events: { group: 'Admin', path: ['Admin', 'Events & Sports'] },
  communication: { group: 'Admin', path: ['Admin', 'Communication'] },
  documents: { group: 'Admin', path: ['Admin', 'Documents'] },
  security: { group: 'Admin', path: ['Admin', 'Security'] },
  settings: { group: 'Admin', path: ['Admin', 'Settings'] },
}

// ─── Module Header Component ──────────────────────────────────────────────────
function ModuleHeader({ moduleId }: { moduleId: string }) {
  const info = moduleInfo[moduleId]
  const breadcrumb = moduleGroupMap[moduleId]
  if (!info || !breadcrumb) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        {breadcrumb.path.map((segment, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            <span className={cn(
              'transition-colors',
              i === breadcrumb.path.length - 1 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'hover:text-foreground cursor-default'
            )}>
              {segment}
            </span>
          </React.Fragment>
        ))}
      </div>
      {/* Module Title with gradient underline */}
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', info.gradient)}>
          <info.icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight gradient-underline">{info.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Module Placeholder Component ─────────────────────────────────────────────
function ModulePlaceholder({ moduleId }: { moduleId: string }) {
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

// ─── Login Page Component ─────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@zimschool.co.zw')
  const [password, setPassword] = useState('password')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shakeForm, setShakeForm] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.success('Welcome back!', {
      description: 'Successfully signed in to ZimSchool Pro',
    })
    onLogin()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Animated Gradient Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden login-gradient-animated"
      >
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Circles */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 animate-float" />
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/5 animate-float-slow" />
          <div className="absolute top-1/3 right-12 h-64 w-64 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-12 left-1/3 h-32 w-32 rounded-full bg-white/10 animate-float-slow" style={{ animationDelay: '2s' }} />
          {/* Squares / Diamonds */}
          <div className="absolute top-20 right-1/4 h-16 w-16 rounded-lg bg-white/[0.07] rotate-45 animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-40 left-16 h-12 w-12 rounded-md bg-white/[0.06] rotate-12 animate-float-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-2/3 right-20 h-8 w-8 rounded-sm bg-white/[0.08] -rotate-12 animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-1/3 left-1/4 h-20 w-20 rounded-xl bg-white/[0.04] rotate-6 animate-float-slow" style={{ animationDelay: '2.5s' }} />
          {/* Small decorative dots */}
          <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-white/20 animate-float" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-1/2 right-1/3 h-3 w-3 rounded-full bg-white/15 animate-float" style={{ animationDelay: '1.8s' }} />
          <div className="absolute bottom-1/4 left-1/2 h-2 w-2 rounded-full bg-white/20 animate-float" style={{ animationDelay: '2.2s' }} />
          {/* Grid pattern */}
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

            {/* School building SVG illustration */}
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
              {/* School Building SVG */}
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 200 100" className="w-full max-w-[200px] h-auto opacity-80" fill="none">
                  {/* Main building */}
                  <rect x="40" y="40" width="120" height="55" rx="2" fill="white" fillOpacity="0.2" />
                  {/* Roof */}
                  <path d="M30 42 L100 15 L170 42 Z" fill="white" fillOpacity="0.25" />
                  {/* Door */}
                  <rect x="85" y="65" width="30" height="30" rx="1.5" fill="white" fillOpacity="0.3" />
                  <circle cx="112" cy="80" r="2" fill="white" fillOpacity="0.5" />
                  {/* Windows */}
                  <rect x="50" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  <rect x="78" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  <rect x="104" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  <rect x="132" y="52" width="18" height="14" rx="1" fill="white" fillOpacity="0.3" />
                  {/* Flag */}
                  <line x1="35" y1="10" x2="35" y2="42" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
                  <rect x="36" y="10" width="14" height="9" rx="0.5" fill="#10b981" fillOpacity="0.6" />
                  {/* Trees */}
                  <circle cx="18" cy="75" r="10" fill="white" fillOpacity="0.1" />
                  <rect x="16" y="85" width="4" height="10" rx="1" fill="white" fillOpacity="0.15" />
                  <circle cx="182" cy="75" r="10" fill="white" fillOpacity="0.1" />
                  <rect x="180" y="85" width="4" height="10" rx="1" fill="white" fillOpacity="0.15" />
                  {/* Ground */}
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

          {/* Feature highlights */}
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

          {/* Zimbabwe flag colors accent at bottom - animated wave */}
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
        className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
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
                  <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                    Forgot password?
                  </button>
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

            {/* Zimbabwe flag stripe on mobile - animated wave */}
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

            <div className="mt-6 flex items-center justify-between">
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

export default function Home() {
  const { activeModule } = useAppStore()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true)
  }, [])

  const handleLogout = useCallback(() => {
    toast('Signed out successfully', { description: 'You have been logged out of ZimSchool Pro' })
    setIsLoggedIn(false)
  }, [])

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }, [])

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <SidebarProvider
      style={{ '--sidebar-width': '280px' } as React.CSSProperties}
    >
      <AppSidebar onLogout={handleLogout} notificationCount={unreadCount} />
      <SidebarInset>
        <AppHeader onLogout={handleLogout} notifications={notifications} onMarkAllRead={handleMarkAllRead} onMarkRead={handleMarkRead} />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-gray-50/50 to-emerald-50/20 dark:from-background dark:to-background dot-pattern">
          <div className="module-enter">
          <ModuleHeader moduleId={activeModule} />
          <AnimatePresence mode="wait">
            {activeModule === 'dashboard' ? (
              <Dashboard key="dashboard" />
            ) : activeModule === 'students' ? (
              <StudentsModule key="students" />
            ) : activeModule === 'staff' ? (
              <StaffModule key="staff" />
            ) : activeModule === 'finance' ? (
              <FinanceModule key="finance" />
            ) : activeModule === 'attendance' ? (
              <AttendanceModule key="attendance" />
            ) : activeModule === 'academics' ? (
              <AcademicsModule key="academics" />
            ) : activeModule === 'examinations' ? (
              <ExaminationsModule key="examinations" />
            ) : activeModule === 'welfare' ? (
              <WelfareModule key="welfare" />
            ) : activeModule === 'discipline' ? (
              <DisciplineModule key="discipline" />
            ) : activeModule === 'health' ? (
              <HealthModule key="health" />
            ) : activeModule === 'boarding' ? (
              <BoardingModule key="boarding" />
            ) : activeModule === 'transport' ? (
              <TransportModule key="transport" />
            ) : activeModule === 'library' ? (
              <LibraryModule key="library" />
            ) : activeModule === 'inventory' ? (
              <InventoryModule key="inventory" />
            ) : activeModule === 'admissions' ? (
              <AdmissionsModule key="admissions" />
            ) : activeModule === 'payroll' ? (
              <PayrollModule key="payroll" />
            ) : activeModule === 'sdc' ? (
              <SDCModule key="sdc" />
            ) : activeModule === 'communication' ? (
              <CommunicationModule key="communication" />
            ) : activeModule === 'reports' ? (
              <ReportsModule key="reports" />
            ) : activeModule === 'timetable' ? (
              <TimetableModule key="timetable" />
            ) : activeModule === 'events' ? (
              <EventsModule key="events" />
            ) : activeModule === 'settings' ? (
              <SettingsModule key="settings" />
            ) : activeModule === 'canteen' ? (
              <CanteenModule key="canteen" />
            ) : activeModule === 'procurement' ? (
              <ProcurementModule key="procurement" />
            ) : activeModule === 'security' ? (
              <SecurityModule key="security" />
            ) : activeModule === 'elearning' ? (
              <ElearningModule key="elearning" />
            ) : activeModule === 'fee-calculator' ? (
              <FeeCalculatorModule key="fee-calculator" />
            ) : activeModule === 'documents' ? (
              <DocumentsModule key="documents" />
            ) : activeModule === 'alumni' ? (
              <AlumniModule key="alumni" />
            ) : activeModule === 'parent-portal' ? (
              <ParentPortalModule key="parent-portal" />
            ) : activeModule === 'student-portal' ? (
              <StudentPortalModule key="student-portal" />
            ) : activeModule === 'teacher-portal' ? (
              <TeacherPortalModule key="teacher-portal" />
            ) : activeModule === 'notification-center' ? (
              <NotificationCenterModule key="notification-center" />
            ) : (
              <ModulePlaceholder key={activeModule} moduleId={activeModule} />
            )}
          </AnimatePresence>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
