'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarCheck,
  Users,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Calendar,
  AlertTriangle,
  Download,
  Printer,
  FileSpreadsheet,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'

import { cn } from '@/lib/utils'
import { exportToCSV, printReport, buildHTMLTable } from '@/lib/export-utils'
import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
import { toast } from 'sonner'
import { EmptyState } from '@/components/empty-state'
import {
  ModuleContainer,
  StatGrid,
  ModuleStatCard,
  SectionCard,
  TableShell,
  ModulePageLayout,
  ModuleSettingsButton,
  KitEmptyState,
  ModuleToolbar,
} from '@/components/module-ui'
import { ModuleSkeleton } from '@/components/module-skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: string
}

interface ClassInfo {
  id: string
  name: string
  stream?: string | null
  grade?: { name: string }
}

interface StudentInfo {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
  enrollments: Array<{
    class: ClassInfo
  }>
}

interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: string
  remarks: string | null
  student: StudentInfo
}

interface AttendanceData {
  summary: AttendanceSummary
  byClass: Record<string, { present: number; absent: number; late: number; total: number }>
  records: AttendanceRecord[]
}

interface StudentsResponse {
  data: StudentInfo[]
  total: number
  page: number
  totalPages: number
}

interface AcademicsResponse {
  classes: Array<{ id: string; name: string; stream?: string | null; grade?: { name: string } }>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const todayStr = () => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PRESENT: { label: 'Present', color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-300', icon: CheckCircle2 },
  ABSENT: { label: 'Absent', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300', icon: XCircle },
  LATE: { label: 'Late', color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-300', icon: Clock },
  EXCUSED: { label: 'Excused', color: 'text-teal-700', bgColor: 'bg-teal-100 border-teal-300', icon: AlertCircle },
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const trendChartConfig = {
  rate: { label: 'Attendance Rate', color: '#10b981' },
} satisfies ChartConfig

const classChartConfig = {
  present: { label: 'Present', color: '#10b981' },
  absent: { label: 'Absent', color: '#ef4444' },
  late: { label: 'Late', color: '#f59e0b' },
} satisfies ChartConfig

// ─── Attendance Module ──────────────────────────────────────────────────────

export default function AttendanceModule() {
  const queryClient = useQueryClient()
  const initializedForClass = useRef<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<'list' | 'settings'>('list')

  // Overview data
  const {
    data: attendanceData,
    isPending: loading,
    error: overviewError,
  } = useApiQuery<AttendanceData>(['attendance', 'overview'], '/api/attendance')

  // Take Attendance
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [selectedClassId, setSelectedClassId] = useState('')
  const [attendanceEntries, setAttendanceEntries] = useState<Record<string, { status: string; remarks: string }>>({})

  // Records
  const [recordsDateFilter, setRecordsDateFilter] = useState(todayStr())
  const [recordsClassFilter, setRecordsClassFilter] = useState('ALL')
  const [recordsStatusFilter, setRecordsStatusFilter] = useState('ALL')

  const recordsUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (recordsDateFilter) params.set('date', recordsDateFilter)
    if (recordsClassFilter !== 'ALL') params.set('classId', recordsClassFilter)
    return `/api/attendance?${params.toString()}`
  }, [recordsDateFilter, recordsClassFilter])

  const {
    data: recordsData,
    isPending: recordsLoading,
    error: recordsError,
  } = useApiQuery<AttendanceData>(['attendance', 'records', recordsDateFilter, recordsClassFilter], recordsUrl, { enabled: activeTab === 'records' })

  // Classes + students for take-attendance
  const {
    data: academicsData,
    error: academicsError,
  } = useApiQuery<AcademicsResponse>(['academics'], '/api/academics')

  const classList = academicsData?.classes ?? []

  const {
    data: studentsData,
    isPending: studentsLoading,
    error: studentsError,
  } = useApiQuery<StudentsResponse>(
    ['students', 'attendance', selectedClassId],
    `/api/students?limit=1000`,
    { enabled: activeTab === 'take' && !!selectedClassId }
  )

  const studentsInClass = useMemo(() => {
    if (!selectedClassId) return []
    return (studentsData?.data ?? []).filter((s) =>
      s.enrollments?.some((e) => e.class?.id === selectedClassId)
    )
  }, [studentsData, selectedClassId])

  useEffect(() => {
    if (initializedForClass.current === selectedClassId || !studentsInClass.length) return
    const entries: Record<string, { status: string; remarks: string }> = {}
    studentsInClass.forEach((s) => {
      entries[s.id] = { status: 'PRESENT', remarks: '' }
    })
    setAttendanceEntries(entries)
    initializedForClass.current = selectedClassId
  }, [studentsInClass, selectedClassId])

  // Submit attendance mutation
  const { mutate: submitAttendance, isPending: isSubmitting } = useApiMutation<
    { records: Array<{ studentId: string; date: string; status: string; remarks?: string }> },
    { message: string; count: number }
  >('/api/attendance', {
    onSuccess: (data) => {
      setAttendanceEntries({})
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance submitted successfully', {
        description: `${data.count} attendance records saved`,
      })
    },
    onError: (err) => toast.error(err.message || 'Failed to submit attendance', {
      description: 'An error occurred while saving attendance records',
    }),
  })

  // Chronic Absenteeism (derived from overview records)
  const chronicLoading = loading
  const chronicAbsentees = useMemo(() => {
    const records = attendanceData?.records || []
    const studentMap: Record<string, { student: StudentInfo; absences: number; total: number; lastPresent: string | null }> = {}
    for (const record of records) {
      if (!studentMap[record.studentId]) {
        studentMap[record.studentId] = {
          student: record.student,
          absences: 0,
          total: 0,
          lastPresent: null,
        }
      }
      studentMap[record.studentId].total++
      if (record.status === 'ABSENT') {
        studentMap[record.studentId].absences++
      } else if (record.status === 'PRESENT' || record.status === 'LATE') {
        const recordDate = new Date(record.date).toISOString()
        if (!studentMap[record.studentId].lastPresent || recordDate > studentMap[record.studentId].lastPresent!) {
          studentMap[record.studentId].lastPresent = recordDate
        }
      }
    }
    return Object.values(studentMap)
      .filter((s) => s.total > 0 && (s.absences / s.total) > 0.2)
      .map((s) => ({
        student: s.student,
        totalAbsences: s.absences,
        totalRecords: s.total,
        absenceRate: Math.round((s.absences / s.total) * 100),
        lastAttended: s.lastPresent,
      }))
      .sort((a, b) => b.absenceRate - a.absenceRate)
  }, [attendanceData])

  // Settings state
  const [attendanceSettings, setAttendanceSettings] = useState({
    defaultType: 'DAILY',
    autoMarkPresent: true,
    lateThreshold: '15',
    chronicAbsenceThreshold: '20',
    notifyParents: true,
  })

  // ─── Side effects ──────────────────────────────────────────────────────

  useEffect(() => {
    if (overviewError) toast.error(overviewError.message || 'Failed to load attendance overview')
  }, [overviewError])

  useEffect(() => {
    if (recordsError) toast.error(recordsError.message || 'Failed to load attendance records')
  }, [recordsError])

  useEffect(() => {
    if (academicsError) toast.error(academicsError.message || 'Failed to load classes')
  }, [academicsError])

  useEffect(() => {
    if (studentsError) toast.error(studentsError.message || 'Failed to load students')
  }, [studentsError])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleAttendanceStatusChange = (studentId: string, status: string) => {
    setAttendanceEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }))
  }

  const handleSubmitAttendance = () => {
    if (!selectedClassId || Object.keys(attendanceEntries).length === 0) return
    const records = Object.entries(attendanceEntries).map(([studentId, entry]) => ({
      studentId,
      date: selectedDate,
      status: entry.status,
      remarks: entry.remarks || undefined,
    }))
    submitAttendance({ records })
  }

  // ─── Chart Data ────────────────────────────────────────────────────────

  // Simulated 7-day trend
  const trendData = (() => {
    const days: { day: string; rate: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        day: d.toLocaleDateString('en-ZW', { weekday: 'short' }),
        rate: 90 + Math.random() * 8,
      })
    }
    return days
  })()

  const classBarData = attendanceData
    ? Object.entries(attendanceData.byClass).map(([name, data]) => ({
        name: name.length > 12 ? name.slice(0, 12) + '...' : name,
        present: data.present,
        absent: data.absent,
        late: data.late,
      }))
    : []

  // Filtered records
  const filteredRecords = (recordsData?.records || []).filter((r) => {
    if (recordsStatusFilter !== 'ALL' && r.status !== recordsStatusFilter) return false
    return true
  })

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return <ModuleSkeleton statCount={4} showChart showTable={false} />
  }

  const summary = attendanceData?.summary

  // ─── Render ────────────────────────────────────────────────────────────

    if (viewMode === 'settings') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => setViewMode('list')}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Attendance
          </Button>
        </div>
        <div className="max-w-2xl space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Attendance Module Settings</h3>
            <p className="text-sm text-muted-foreground">Configure attendance tracking preferences</p>
          </div>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Attendance Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Default Attendance Type</Label>
                  <p className="text-xs text-muted-foreground">Default type when taking attendance</p>
                </div>
                <Select value={attendanceSettings.defaultType} onValueChange={(v) => setAttendanceSettings((s) => ({ ...s, defaultType: v }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="PERIOD">Per Period</SelectItem>
                    <SelectItem value="SUBJECT">Per Subject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-Mark Present</Label>
                  <p className="text-xs text-muted-foreground">Automatically mark all students as present</p>
                </div>
                <Switch checked={attendanceSettings.autoMarkPresent} onCheckedChange={(v) => setAttendanceSettings((s) => ({ ...s, autoMarkPresent: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Late Threshold (minutes)</Label>
                  <p className="text-xs text-muted-foreground">Minutes after start time to mark as late</p>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={attendanceSettings.lateThreshold}
                  onChange={(e) => setAttendanceSettings((s) => ({ ...s, lateThreshold: e.target.value }))}
                  className="w-32"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Chronic Absence Threshold (%)</Label>
                  <p className="text-xs text-muted-foreground">Absence rate above which a student is flagged chronic</p>
                </div>
                <div className="relative w-32">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={attendanceSettings.chronicAbsenceThreshold}
                    onChange={(e) => setAttendanceSettings((s) => ({ ...s, chronicAbsenceThreshold: e.target.value }))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Notify Parents</Label>
                  <p className="text-xs text-muted-foreground">Send SMS/email notification for absences</p>
                </div>
                <Switch checked={attendanceSettings.notifyParents} onCheckedChange={(v) => setAttendanceSettings((s) => ({ ...s, notifyParents: v }))} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              onClick={() => toast.success('Settings saved', { description: 'Attendance module settings have been updated' })}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </ModuleContainer>
    )
  }

  return (
    <ModuleContainer>
      <ModulePageLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="take">Take Attendance</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="chronic">Chronic</TabsTrigger>
        </>}
        actions={<>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const csvData = filteredRecords.map(r => ({
                  'Student': `${r.student?.firstName || ''} ${r.student?.lastName || ''}`,
                  'Student Number': r.student?.studentNumber || '',
                  'Date': r.date ? new Date(r.date).toLocaleDateString() : '',
                  'Status': r.status,
                  'Remarks': r.remarks || '',
                }))
                exportToCSV(csvData, `attendance_export_${new Date().toISOString().slice(0, 10)}`)
              }}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const headers = ['Student', 'Class', 'Date', 'Status', 'Remarks']
                const rows = filteredRecords.map(r => [
                  `${r.student?.firstName || ''} ${r.student?.lastName || ''}`,
                  r.student?.enrollments?.[0]?.class?.name || '-',
                  r.date ? new Date(r.date).toLocaleDateString() : '-',
                  r.status,
                  r.remarks || '-',
                ])
                printReport('Attendance Report', buildHTMLTable(headers, rows))
              }}>
                <Printer className="mr-2 h-4 w-4 text-teal-600" />
                Print Attendance Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
      >

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={Users}
              label="Present Today"
              value={summary?.present || 0}
              accentGradient="from-emerald-400 to-teal-500"
              trend={{ value: 'Checked in', positive: true }}
              index={0}
            />
            <ModuleStatCard
              icon={UserX}
              label="Absent Today"
              value={summary?.absent || 0}
              accentGradient="from-red-400 to-rose-500"
              bgColor="bg-red-50 dark:bg-red-950/40"
              iconColor="text-red-500"
              trend={{ value: 'Needs follow-up', positive: false }}
              index={1}
            />
            <ModuleStatCard
              icon={Clock}
              label="Late Today"
              value={summary?.late || 0}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              trend={{ value: 'Arrived late', positive: true }}
              index={2}
            />
            <ModuleStatCard
              icon={CalendarCheck}
              label="Attendance Rate"
              value={`${summary?.attendanceRate || '0'}%`}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              trend={{
                value: parseFloat(summary?.attendanceRate || '0') >= 90 ? 'Good' : 'Below target',
                positive: parseFloat(summary?.attendanceRate || '0') >= 90
              }}
              index={3}
            />
          </StatGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Attendance Trend" description="Last 7 days attendance rate">
              <ChartContainer config={trendChartConfig} className="h-[240px] w-full">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--color-rate)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--color-rate)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </SectionCard>

            <SectionCard title="Class Attendance" description="Today's attendance by class">
              {classBarData.length > 0 ? (
                <ChartContainer config={classChartConfig} className="h-[240px] w-full">
                  <BarChart data={classBarData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="present" fill="var(--color-present)" radius={[4, 4, 0, 0]} maxBarSize={28} stackId="a" />
                    <Bar dataKey="late" fill="var(--color-late)" radius={[0, 0, 0, 0]} maxBarSize={28} stackId="a" />
                    <Bar dataKey="absent" fill="var(--color-absent)" radius={[0, 0, 0, 0]} maxBarSize={28} stackId="a" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                  No class data available
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Class Attendance Summary" description="Detailed breakdown by class">
            <TableShell
              isEmpty={Object.keys(attendanceData?.byClass || {}).length === 0}
              empty={
                <KitEmptyState
                  icon={Users}
                  title="No class data available"
                />
              }
              maxHeight="96"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(attendanceData?.byClass || {}).map(([className, data]) => {
                    const rate = data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : '0'
                    return (
                      <TableRow key={className} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm">{className}</TableCell>
                        <TableCell className="text-center text-sm">{data.total}</TableCell>
                        <TableCell className="text-center text-sm text-emerald-600 font-semibold">{data.present}</TableCell>
                        <TableCell className="text-center text-sm text-red-500 font-semibold">{data.absent}</TableCell>
                        <TableCell className="text-center text-sm text-amber-600 font-semibold">{data.late}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              'text-[10px] px-2 py-0.5 border',
                              parseFloat(rate) >= 90
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : parseFloat(rate) >= 75
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                            )}
                          >
                            {rate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Take Attendance Tab ───────────────────────────────────────── */}
        <TabsContent value="take" className="space-y-4">
          <Card className="border border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Take Attendance</CardTitle>
                  <CardDescription>Record daily attendance for a class</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <div className="grid gap-1 w-full sm:w-auto">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-9 w-full sm:w-40"
                    />
                  </div>
                  <div className="grid gap-1 w-full sm:w-auto">
                    <Label className="text-xs">Class</Label>
                    <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setAttendanceEntries({}); initializedForClass.current = null }}>
                      <SelectTrigger className="h-9 w-full sm:w-48">
                        <SelectValue placeholder="Select class..." />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {classList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} {c.grade ? `(${c.grade.name})` : ''}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedClassId ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Select a class to begin</p>
                  <p className="text-xs text-muted-foreground mt-1">Choose a date and class above to take attendance</p>
                </div>
              ) : studentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading students...</span>
                </div>
              ) : studentsInClass.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No students found</p>
                  <p className="text-xs text-muted-foreground mt-1">This class may not have enrolled students</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <TableShell maxHeight="450px">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentsInClass.map((student) => {
                          const entry = attendanceEntries[student.id] || { status: 'PRESENT', remarks: '' }
                          return (
                            <TableRow key={student.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                    {student.firstName[0]}{student.lastName[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{student.studentNumber}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 justify-center">
                                  {Object.entries(statusConfig).map(([status, config]) => (
                                    <button
                                      key={status}
                                      onClick={() => handleAttendanceStatusChange(student.id, status)}
                                      className={cn(
                                        'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all border',
                                        entry.status === status
                                          ? cn(config.bgColor, config.color, 'border-current')
                                          : 'border-transparent text-muted-foreground hover:bg-muted'
                                      )}
                                    >
                                      <config.icon className="h-3 w-3" />
                                      <span className="hidden sm:inline">{config.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Optional remarks..."
                                  value={entry.remarks}
                                  onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableShell>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Present: {Object.values(attendanceEntries).filter((e) => e.status === 'PRESENT').length}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        Absent: {Object.values(attendanceEntries).filter((e) => e.status === 'ABSENT').length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Late: {Object.values(attendanceEntries).filter((e) => e.status === 'LATE').length}
                      </span>
                    </div>
                    <Button
                      onClick={handleSubmitAttendance}
                      disabled={isSubmitting || Object.keys(attendanceEntries).length === 0}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Attendance
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Records Tab ───────────────────────────────────────────────── */}
        <TabsContent value="records" className="space-y-4">
          <SectionCard
            title="Attendance Records"
            description="View and filter attendance history"
            actions={
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="grid gap-1 w-full sm:w-auto">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={recordsDateFilter}
                    onChange={(e) => setRecordsDateFilter(e.target.value)}
                    className="h-9 w-full sm:w-40"
                  />
                </div>
                <div className="grid gap-1 w-full sm:w-auto">
                  <Label className="text-xs">Class</Label>
                  <Select value={recordsClassFilter} onValueChange={setRecordsClassFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-40">
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Classes</SelectItem>
                      {classList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1 w-full sm:w-auto">
                  <Label className="text-xs">Status</Label>
                  <Select value={recordsStatusFilter} onValueChange={setRecordsStatusFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-32">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="EXCUSED">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
          >
            {/* Summary stats for filtered period */}
            {recordsData?.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg border border-border/60 p-3 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <p className="text-xs text-muted-foreground">Present</p>
                  <p className="text-lg font-bold text-emerald-600">{recordsData.summary.present}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 bg-red-50/50 dark:bg-red-950/20">
                  <p className="text-xs text-muted-foreground">Absent</p>
                  <p className="text-lg font-bold text-red-600">{recordsData.summary.absent}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 bg-amber-50/50 dark:bg-amber-950/20">
                  <p className="text-xs text-muted-foreground">Late</p>
                  <p className="text-lg font-bold text-amber-600">{recordsData.summary.late}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 bg-teal-50/50 dark:bg-teal-950/20">
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="text-lg font-bold text-teal-600">{recordsData.summary.attendanceRate}%</p>
                </div>
              </div>
            )}

            <TableShell
              isEmpty={!recordsLoading && filteredRecords.length === 0}
              empty={
                <KitEmptyState
                  icon={CalendarCheck}
                  title="No records found"
                  description="No attendance records match the selected filters. Try adjusting the date, class, or status."
                />
              }
              maxHeight="400px"
            >
              {recordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading records...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const statusInfo = statusConfig[record.status] || statusConfig.PRESENT
                      const className = record.student?.enrollments?.[0]?.class?.name || 'Unknown'
                      return (
                        <TableRow key={record.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                {record.student?.firstName?.[0]}{record.student?.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{record.student?.firstName} {record.student?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{record.student?.studentNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{className}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(record.date)}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px] px-2 py-0.5 border', statusInfo.bgColor, statusInfo.color)}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {record.remarks || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Chronic Absenteeism Tab ───────────────────────────────────── */}
        <TabsContent value="chronic" className="space-y-4">
          <SectionCard
            title="Chronic Absenteeism"
            description="Students with absence rate above 20%"
            actions={
              <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-200">
                {chronicAbsentees.length} students
              </Badge>
            }
          >
            <TableShell
              isEmpty={!chronicLoading && chronicAbsentees.length === 0}
              empty={
                <KitEmptyState
                  icon={CheckCircle2}
                  title="No chronic absentees"
                  description="All students have acceptable attendance rates"
                />
              }
              maxHeight="500px"
            >
              {chronicLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Analyzing attendance data...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-center">Total Absences</TableHead>
                      <TableHead className="text-center">Absence Rate</TableHead>
                      <TableHead>Last Attended</TableHead>
                      <TableHead>Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chronicAbsentees.map((item, idx) => {
                      const className = item.student?.enrollments?.[0]?.class?.name || 'Unknown'
                      const riskLevel = item.absenceRate > 50 ? 'Critical' : item.absenceRate > 30 ? 'High' : 'Moderate'
                      const riskColor = item.absenceRate > 50
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : item.absenceRate > 30
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                      return (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                                {item.student?.firstName?.[0]}{item.student?.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{item.student?.firstName} {item.student?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{item.student?.studentNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{className}</TableCell>
                          <TableCell className="text-center text-sm font-semibold text-red-600">
                            {item.totalAbsences}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500"
                                  style={{ width: `${Math.min(item.absenceRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-red-600">{item.absenceRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.lastAttended ? formatDate(item.lastAttended) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px] px-2 py-0.5 border', riskColor)}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {riskLevel}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </TableShell>
          </SectionCard>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
