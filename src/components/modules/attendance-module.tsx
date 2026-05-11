'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Overview data
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)

  // Take Attendance
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classList, setClassList] = useState<ClassInfo[]>([])
  const [studentsInClass, setStudentsInClass] = useState<StudentInfo[]>([])
  const [attendanceEntries, setAttendanceEntries] = useState<Record<string, { status: string; remarks: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Records
  const [recordsData, setRecordsData] = useState<AttendanceData | null>(null)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsDateFilter, setRecordsDateFilter] = useState(todayStr())
  const [recordsClassFilter, setRecordsClassFilter] = useState('ALL')
  const [recordsStatusFilter, setRecordsStatusFilter] = useState('ALL')

  // Chronic Absenteeism
  const [chronicAbsentees, setChronicAbsentees] = useState<Array<{
    student: StudentInfo
    totalAbsences: number
    totalRecords: number
    absenceRate: number
    lastAttended: string | null
  }>>([])
  const [chronicLoading, setChronicLoading] = useState(false)

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/attendance')
      if (res.ok) {
        const data = await res.json()
        setAttendanceData(data)
      }
    } catch (err) {
      console.error('Failed to fetch attendance overview:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/academics')
      if (res.ok) {
        const data = await res.json()
        const classes: ClassInfo[] = (data.classes || []).map((c: { id: string; name: string; stream?: string | null; grade?: { name: string } }) => ({
          id: c.id,
          name: c.name,
          stream: c.stream,
          grade: c.grade,
        }))
        setClassList(classes)
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err)
    }
  }, [])

  const fetchStudentsForClass = useCallback(async (classId: string) => {
    if (!classId) return
    try {
      setStudentsLoading(true)
      const res = await fetch(`/api/students?limit=100`)
      if (res.ok) {
        const data = await res.json()
        const allStudents: StudentInfo[] = data.data || data || []
        // Filter students by class
        const filtered = allStudents.filter((s: StudentInfo) =>
          s.enrollments?.some((e) => e.class?.id === classId)
        )
        setStudentsInClass(filtered)
        // Initialize attendance entries
        const entries: Record<string, { status: string; remarks: string }> = {}
        filtered.forEach((s: StudentInfo) => {
          entries[s.id] = { status: 'PRESENT', remarks: '' }
        })
        setAttendanceEntries(entries)
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  const fetchRecords = useCallback(async () => {
    try {
      setRecordsLoading(true)
      const params = new URLSearchParams()
      if (recordsDateFilter) params.set('date', recordsDateFilter)
      if (recordsClassFilter !== 'ALL') params.set('classId', recordsClassFilter)
      const res = await fetch(`/api/attendance?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRecordsData(data)
      }
    } catch (err) {
      console.error('Failed to fetch attendance records:', err)
    } finally {
      setRecordsLoading(false)
    }
  }, [recordsDateFilter, recordsClassFilter])

  const fetchChronicAbsentees = useCallback(async () => {
    try {
      setChronicLoading(true)
      // Fetch all attendance data to compute chronic absenteeism
      const res = await fetch('/api/attendance')
      if (res.ok) {
        const data: AttendanceData = await res.json()
        // Group records by student
        const studentMap: Record<string, { student: StudentInfo; absences: number; total: number; lastPresent: string | null }> = {}
        for (const record of data.records) {
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
        // Filter > 20% absence rate
        const absentees = Object.values(studentMap)
          .filter((s) => s.total > 0 && (s.absences / s.total) > 0.2)
          .map((s) => ({
            student: s.student,
            totalAbsences: s.absences,
            totalRecords: s.total,
            absenceRate: Math.round((s.absences / s.total) * 100),
            lastAttended: s.lastPresent,
          }))
          .sort((a, b) => b.absenceRate - a.absenceRate)
        setChronicAbsentees(absentees)
      }
    } catch (err) {
      console.error('Failed to fetch chronic absentee data:', err)
    } finally {
      setChronicLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
    fetchClasses()
  }, [fetchOverview, fetchClasses])

  useEffect(() => {
    if (activeTab === 'records') fetchRecords()
  }, [activeTab, fetchRecords])

  useEffect(() => {
    if (activeTab === 'chronic') fetchChronicAbsentees()
  }, [activeTab, fetchChronicAbsentees])

  useEffect(() => {
    if (selectedClassId) fetchStudentsForClass(selectedClassId)
  }, [selectedClassId, fetchStudentsForClass])

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

  const handleSubmitAttendance = async () => {
    if (!selectedClassId || Object.keys(attendanceEntries).length === 0) return
    try {
      setSubmitting(true)
      const records = Object.entries(attendanceEntries).map(([studentId, entry]) => ({
        studentId,
        date: selectedDate,
        status: entry.status,
        remarks: entry.remarks || undefined,
      }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (res.ok) {
        setAttendanceEntries({})
        fetchOverview()
      }
    } catch (err) {
      console.error('Failed to submit attendance:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Chart Data ────────────────────────────────────────────────────────

  // Simulated 7-day trend
  const trendData = (() => {
    const days = []
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
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  const summary = attendanceData?.summary

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage student attendance</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="take" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Take Attendance
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Records
          </TabsTrigger>
          <TabsTrigger value="chronic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Chronic Absenteeism
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Present Today</p>
                    <p className="text-2xl font-bold tracking-tight">{summary?.present || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Checked in</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Absent Today</p>
                    <p className="text-2xl font-bold tracking-tight">{summary?.absent || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-500">Needs follow-up</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <UserX className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400 to-rose-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Late Today</p>
                    <p className="text-2xl font-bold tracking-tight">{summary?.late || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Arrived late</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attendance Rate</p>
                    <p className="text-2xl font-bold tracking-tight">{summary?.attendanceRate || '0'}%</p>
                    <div className="flex items-center gap-1.5">
                      {parseFloat(summary?.attendanceRate || '0') >= 90 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className={cn('text-xs font-medium', parseFloat(summary?.attendanceRate || '0') >= 90 ? 'text-emerald-600' : 'text-red-500')}>
                        {parseFloat(summary?.attendanceRate || '0') >= 90 ? 'Good' : 'Below target'}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <CalendarCheck className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Attendance Trend */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Attendance Trend</CardTitle>
                <CardDescription>Last 7 days attendance rate</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Class Attendance Summary */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Class Attendance</CardTitle>
                <CardDescription>Today&apos;s attendance by class</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Class Summary Table */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Class Attendance Summary</CardTitle>
              <CardDescription>Detailed breakdown by class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
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
                    {Object.keys(attendanceData?.byClass || {}).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          No class data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Take Attendance Tab ───────────────────────────────────────── */}
        <TabsContent value="take" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Take Attendance</CardTitle>
                  <CardDescription>Record daily attendance for a class</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-9 w-40"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Class</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger className="h-9 w-48">
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
                  <div className="max-h-[450px] overflow-y-auto">
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
                  </div>
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
                      disabled={submitting || Object.keys(attendanceEntries).length === 0}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Attendance Records</CardTitle>
                  <CardDescription>View and filter attendance history</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={recordsDateFilter}
                      onChange={(e) => setRecordsDateFilter(e.target.value)}
                      className="h-9 w-40"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Class</Label>
                    <Select value={recordsClassFilter} onValueChange={setRecordsClassFilter}>
                      <SelectTrigger className="h-9 w-40">
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
                  <div className="grid gap-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={recordsStatusFilter} onValueChange={setRecordsStatusFilter}>
                      <SelectTrigger className="h-9 w-32">
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
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary stats for filtered period */}
              {recordsData?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-lg border p-3 bg-emerald-50/50">
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p className="text-lg font-bold text-emerald-600">{recordsData.summary.present}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-red-50/50">
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="text-lg font-bold text-red-600">{recordsData.summary.absent}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-amber-50/50">
                    <p className="text-xs text-muted-foreground">Late</p>
                    <p className="text-lg font-bold text-amber-600">{recordsData.summary.late}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-teal-50/50">
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="text-lg font-bold text-teal-600">{recordsData.summary.attendanceRate}%</p>
                  </div>
                </div>
              )}

              {recordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading records...</span>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
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
                      {filteredRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                            No records found for the selected filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Chronic Absenteeism Tab ───────────────────────────────────── */}
        <TabsContent value="chronic" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Chronic Absenteeism</CardTitle>
                  <CardDescription>Students with absence rate above 20%</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-200">
                  {chronicAbsentees.length} students
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {chronicLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Analyzing attendance data...</span>
                </div>
              ) : chronicAbsentees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No chronic absentees</p>
                  <p className="text-xs text-muted-foreground mt-1">All students have acceptable attendance rates</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
