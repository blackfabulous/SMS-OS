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
  documents: { title: 'Documents', description: 'Manage school documents and templates', icon: FileText, gradient: 'from-emerald-500 to-teal-600' },
  alumni: { title: 'Alumni', description: 'Alumni network, contributions and events', icon: UsersRound, gradient: 'from-teal-500 to-emerald-600' },
}

// ─── App Sidebar Component ────────────────────────────────────────────────────
function AppSidebar({ onLogout, notificationCount }: { onLogout: () => void; notificationCount: number }) {
  const { activeModule, setActiveModule } = useAppStore()

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
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

      <Separator className="mx-3 w-auto opacity-60" />

      <SidebarContent className="px-2 py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2">
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
                          'transition-all duration-200',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 hover:text-emerald-800 [&>svg]:text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200 dark:[&>svg]:text-emerald-400'
                            : 'hover:bg-muted/60'
                        )}
                      >
                        <item.icon className={cn(
                          'transition-colors',
                          isActive ? 'text-emerald-600' : 'text-muted-foreground'
                        )} />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-emerald-500" />
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
            <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
              <Avatar className="h-8 w-8 border-2 border-emerald-200">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                  AU
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-[10px] text-muted-foreground">Super Administrator</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
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
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1.5">
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
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', bgColor)}>
            <Icon className={cn('h-5 w-5', accentColor)} />
          </div>
        </div>
      </CardContent>
      {/* Decorative gradient line at top */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', accentColor === 'text-emerald-600' ? 'from-emerald-400 to-teal-500' : accentColor === 'text-teal-600' ? 'from-teal-400 to-cyan-500' : accentColor === 'text-amber-600' ? 'from-amber-400 to-orange-500' : 'from-violet-400 to-purple-500')} />
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
    <button onClick={onClick} className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-colors', color)}>
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

  // Upcoming events - since there's no /api/events, show a placeholder message
  const upcomingEvents: Array<{ id: number; title: string; date: string; category: string }> = []

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
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <School className="h-5 w-5 text-emerald-200" />
                <span className="text-sm font-medium text-emerald-100">{schoolName}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome to ZimSchool Pro</h1>
              <p className="mt-1 text-emerald-100 text-sm md:text-base">Your comprehensive school management dashboard</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm px-3 py-1.5">
                  <Calendar className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{today}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm px-3 py-1.5">
                  <Activity className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">Term 1, {new Date().getFullYear()}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm px-3 py-1.5">
                  <Clock className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{activeStudents} Active Students</span>
                </div>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5" />
            <div className="absolute right-20 top-8 h-20 w-20 rounded-full bg-white/5" />
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

      {/* Fee Collection + Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
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
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
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
      </div>

      {/* Upcoming Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/30">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                      <span className="text-[10px] font-medium leading-none">
                        {event.date.split(' ')[0]}
                      </span>
                      <span className="text-xs font-bold leading-none mt-0.5">
                        {event.date.split(' ')[1]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{event.title}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 h-4">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No upcoming events</p>
                  <p className="text-xs mt-1">Events will appear here when scheduled</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
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
      {/* Left Side - Gradient Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-12 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute top-12 left-1/3 h-32 w-32 rounded-full bg-white/10" />
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

            {/* School image placeholder */}
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
                className="flex items-center gap-3 rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/5"
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

          {/* Zimbabwe flag colors accent at bottom */}
          <div className="mt-8">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
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
          >
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your ZimSchool Pro account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email or Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@zimschool.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Zimbabwe flag stripe on mobile */}
            <div className="mt-8 lg:hidden">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                <div className="flex-1 bg-green-500" />
                <div className="flex-1 bg-yellow-400" />
                <div className="flex-1 bg-red-500" />
                <div className="flex-1 bg-black" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Proudly built for Zimbabwean schools
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} ZimSchool Pro. All rights reserved.
            </p>
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
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-gray-50/50 to-emerald-50/20 dark:from-background dark:to-background">
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
            ) : activeModule === 'documents' ? (
              <DocumentsModule key="documents" />
            ) : activeModule === 'alumni' ? (
              <AlumniModule key="alumni" />
            ) : (
              <ModulePlaceholder key={activeModule} moduleId={activeModule} />
            )}
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
