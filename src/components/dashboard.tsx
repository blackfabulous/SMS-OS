'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, GraduationCap, Users, UserPlus, BookOpen,
  CalendarCheck, FileCheck, BarChart3, DollarSign, BedDouble,
  Bus, Library, Heart, HeartPulse, Building, Calendar, Flag,
  Star, Shield, AlertTriangle, AlertCircle, TrendingUp, TrendingDown,
  Home as HomeIcon, ArrowUpRight, School, Activity, Clock, RefreshCw, Megaphone,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { useAppStore } from '@/lib/store'
import { formatDualCurrency } from '@/lib/currency'

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
export default function Dashboard() {
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

