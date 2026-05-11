'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileCheck,
  Award,
  GraduationCap,
  Users,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Upload,
  BarChart3,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ZimsecCandidate {
  id: string
  centreNumber: string | null
  candidateNumber: string | null
  examLevel: string
  examYear: number
  registrationStatus: string
  subjects: string | null
  totalFees: number
  feesPaid: number
  createdAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentNumber: string
    gender: string
    dateOfBirth: string | null
    enrollments: Array<{
      class: { name: string; grade: { name: string } }
    }>
  }
}

interface ExaminationStats {
  totalCandidates: number
  grade7Count: number
  oLevelCount: number
  aLevelCount: number
  registeredCount: number
  pendingCount: number
  confirmedCount: number
  registrationProgress: number
}

interface StudentOption {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
  gender: string
  enrollments: Array<{
    class: { name: string; grade: { name: string } }
  }>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const examLevelLabels: Record<string, string> = {
  GRADE_7: 'Grade 7',
  O_LEVEL: 'O Level',
  A_LEVEL: 'A Level',
}

const examLevelColors: Record<string, string> = {
  GRADE_7: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  O_LEVEL: 'bg-amber-100 text-amber-700 border-amber-200',
  A_LEVEL: 'bg-teal-100 text-teal-700 border-teal-200',
}

const registrationStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  REGISTERED: 'Registered',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
}

const registrationStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  REGISTERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CONFIRMED: 'bg-teal-100 text-teal-700 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ZIMSEC subjects per level
const zimsecSubjects: Record<string, string[]> = {
  GRADE_7: ['English', 'Mathematics', 'Shona', 'General Paper', 'Agriculture', 'Home Economics'],
  O_LEVEL: [
    'English Language', 'Mathematics', 'Shona', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Combined Science',
    'Accounting', 'Business Studies', 'Economics',
    'Computer Studies', 'Art', 'Music', 'Physical Education',
    'Agriculture', 'Food & Nutrition', 'Fashion & Fabrics',
    'Technical Graphics', 'Woodwork', 'Metalwork',
  ],
  A_LEVEL: [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English Literature', 'History', 'Geography', 'Economics',
    'Accounting', 'Business Studies', 'Divinity',
    'Computer Science', 'Art', 'Music', 'Sociology',
    'Law', 'Psychology', 'French', 'Portuguese',
  ],
}

// Simulated exam schedule data
const examScheduleData = [
  { id: '1', subject: 'English Language Paper 1', level: 'O_LEVEL', date: '2025-10-15', time: '08:00 - 11:00', duration: '3 hours' },
  { id: '2', subject: 'English Language Paper 2', level: 'O_LEVEL', date: '2025-10-17', time: '08:00 - 10:30', duration: '2.5 hours' },
  { id: '3', subject: 'Mathematics Paper 1', level: 'O_LEVEL', date: '2025-10-20', time: '08:00 - 11:00', duration: '3 hours' },
  { id: '4', subject: 'Mathematics Paper 2', level: 'O_LEVEL', date: '2025-10-22', time: '08:00 - 10:30', duration: '2.5 hours' },
  { id: '5', subject: 'Shona Paper 1', level: 'O_LEVEL', date: '2025-10-24', time: '08:00 - 11:00', duration: '3 hours' },
  { id: '6', subject: 'Combined Science Paper 1', level: 'O_LEVEL', date: '2025-10-27', time: '08:00 - 10:00', duration: '2 hours' },
  { id: '7', subject: 'Combined Science Paper 2', level: 'O_LEVEL', date: '2025-10-29', time: '08:00 - 10:00', duration: '2 hours' },
  { id: '8', subject: 'History Paper 1', level: 'O_LEVEL', date: '2025-11-03', time: '08:00 - 10:30', duration: '2.5 hours' },
  { id: '9', subject: 'English', level: 'GRADE_7', date: '2025-09-22', time: '08:00 - 10:00', duration: '2 hours' },
  { id: '10', subject: 'Mathematics', level: 'GRADE_7', date: '2025-09-23', time: '08:00 - 10:00', duration: '2 hours' },
  { id: '11', subject: 'Shona', level: 'GRADE_7', date: '2025-09-24', time: '08:00 - 10:00', duration: '2 hours' },
  { id: '12', subject: 'General Paper', level: 'GRADE_7', date: '2025-09-25', time: '08:00 - 10:00', duration: '2 hours' },
  { id: '13', subject: 'Mathematics Paper 1', level: 'A_LEVEL', date: '2025-11-10', time: '08:00 - 11:30', duration: '3.5 hours' },
  { id: '14', subject: 'Physics Paper 1', level: 'A_LEVEL', date: '2025-11-12', time: '08:00 - 11:00', duration: '3 hours' },
  { id: '15', subject: 'Chemistry Paper 1', level: 'A_LEVEL', date: '2025-11-14', time: '08:00 - 11:00', duration: '3 hours' },
]

// Simulated results data for analysis
const simulatedResults = [
  { subject: 'English Language', passRate: 72, distinctionRate: 15, totalCandidates: 95 },
  { subject: 'Mathematics', passRate: 58, distinctionRate: 12, totalCandidates: 95 },
  { subject: 'Shona', passRate: 85, distinctionRate: 22, totalCandidates: 90 },
  { subject: 'Combined Science', passRate: 64, distinctionRate: 10, totalCandidates: 88 },
  { subject: 'History', passRate: 71, distinctionRate: 14, totalCandidates: 65 },
  { subject: 'Geography', passRate: 68, distinctionRate: 11, totalCandidates: 55 },
  { subject: 'Accounting', passRate: 76, distinctionRate: 18, totalCandidates: 42 },
  { subject: 'Business Studies', passRate: 80, distinctionRate: 16, totalCandidates: 48 },
  { subject: 'Computer Studies', passRate: 82, distinctionRate: 20, totalCandidates: 35 },
  { subject: 'Biology', passRate: 62, distinctionRate: 8, totalCandidates: 60 },
]

// ─── Chart Configs ──────────────────────────────────────────────────────────

const passRateChartConfig = {
  passRate: { label: 'Pass Rate %', color: '#10b981' },
} satisfies ChartConfig

const levelDistConfig = {
  value: { label: 'Candidates', color: '#10b981' },
} satisfies ChartConfig

// ─── Examinations Module ───────────────────────────────────────────────────

export default function ExaminationsModule() {
  const [candidates, setCandidates] = useState<ZimsecCandidate[]>([])
  const [stats, setStats] = useState<ExaminationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [examLevelFilter, setExamLevelFilter] = useState('ALL')

  // Register dialog
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    examLevel: 'O_LEVEL',
    examYear: new Date().getFullYear().toString(),
    subjects: [] as string[],
  })
  const [students, setStudents] = useState<StudentOption[]>([])
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  // Results tab state
  const [resultsView, setResultsView] = useState<'import' | 'analysis' | 'table'>('analysis')

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (examLevelFilter !== 'ALL') params.set('examLevel', examLevelFilter)
      const res = await fetch(`/api/examinations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCandidates(data.data || [])
        setStats(data.stats || null)
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err)
    } finally {
      setLoading(false)
    }
  }, [examLevelFilter])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?limit=500&enrollmentStatus=ACTIVE')
      if (res.ok) {
        const data = await res.json()
        setStudents(data.data || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    }
  }, [])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  useEffect(() => {
    if (registerDialogOpen) fetchStudents()
  }, [registerDialogOpen, fetchStudents])

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleRegister = async () => {
    if (!registerForm.studentId || !registerForm.examLevel) return
    try {
      setRegistering(true)
      setDuplicateWarning(false)
      const res = await fetch('/api/examinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: registerForm.studentId,
          examLevel: registerForm.examLevel,
          examYear: parseInt(registerForm.examYear),
          subjects: registerForm.subjects.length > 0 ? JSON.stringify(registerForm.subjects) : null,
        }),
      })
      if (res.ok) {
        setRegisterDialogOpen(false)
        setRegisterForm({ studentId: '', examLevel: 'O_LEVEL', examYear: new Date().getFullYear().toString(), subjects: [] })
        fetchCandidates()
      } else if (res.status === 409) {
        setDuplicateWarning(true)
      } else {
        const error = await res.json()
        console.error('Registration error:', error)
      }
    } catch (err) {
      console.error('Failed to register candidate:', err)
    } finally {
      setRegistering(false)
    }
  }

  const toggleSubject = (subject: string) => {
    setRegisterForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }))
  }

  // ─── Computed Data ────────────────────────────────────────────────────

  const filteredSchedule = examScheduleData.filter((s) => {
    if (examLevelFilter !== 'ALL' && s.level !== examLevelFilter) return false
    return true
  })

  const levelDistribution = stats
    ? [
        { name: 'Grade 7', value: stats.grade7Count, fill: '#10b981' },
        { name: 'O Level', value: stats.oLevelCount, fill: '#f59e0b' },
        { name: 'A Level', value: stats.aLevelCount, fill: '#14b8a6' },
      ]
    : []

  // Schedule grouped by date
  const scheduleByDate = filteredSchedule.reduce<Record<string, typeof filteredSchedule>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {})

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ZIMSEC Examinations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage exam registrations, schedules and results</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Register Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Register ZIMSEC Candidate</DialogTitle>
                <DialogDescription>Register a student for ZIMSEC examinations</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[65vh]">
                <div className="grid gap-4 py-4 pr-4">
                  {duplicateWarning && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="text-sm text-amber-700">This student is already registered for this exam year.</span>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label>Student *</Label>
                    <Select
                      value={registerForm.studentId}
                      onValueChange={(v) => {
                        setRegisterForm((p) => ({ ...p, studentId: v }))
                        setDuplicateWarning(false)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Search and select student..." />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {students.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.firstName} {s.lastName} ({s.studentNumber})
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Exam Level *</Label>
                      <Select
                        value={registerForm.examLevel}
                        onValueChange={(v) => setRegisterForm((p) => ({ ...p, examLevel: v, subjects: [] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(examLevelLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Exam Year</Label>
                      <Input
                        type="number"
                        value={registerForm.examYear}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, examYear: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Subject Selection */}
                  <div className="grid gap-2">
                    <Label>Subjects</Label>
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20 min-h-[60px]">
                      {zimsecSubjects[registerForm.examLevel]?.map((subject) => {
                        const isSelected = registerForm.subjects.includes(subject)
                        return (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => toggleSubject(subject)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
                              isSelected
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-white text-muted-foreground border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                            )}
                          >
                            {subject}
                          </button>
                        )
                      })}
                      {registerForm.subjects.length === 0 && (
                        <span className="text-xs text-muted-foreground py-1">Click subjects to select</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {registerForm.subjects.length} subject{registerForm.subjects.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={registering || !registerForm.studentId || !registerForm.examLevel}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Candidate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="candidates" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Candidates
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Schedule
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Results
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Candidates</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.totalCandidates || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">All levels</span>
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grade 7</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.grade7Count || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Primary</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <GraduationCap className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">O Level</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.oLevelCount || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Secondary</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <FileCheck className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registration Progress</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.registrationProgress || 0}%</p>
                    <div className="flex items-center gap-1.5">
                      {(stats?.registrationProgress || 0) >= 80 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      <span className={cn('text-xs font-medium', (stats?.registrationProgress || 0) >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                        {(stats?.registrationProgress || 0) >= 80 ? 'On track' : 'Needs attention'}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                    <Award className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 to-red-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Level Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Candidates by Level</CardTitle>
                <CardDescription>Distribution across exam levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={levelDistConfig} className="h-[250px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={levelDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {levelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Grade 7 ({stats?.grade7Count || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-muted-foreground">O Level ({stats?.oLevelCount || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-teal-500" />
                    <span className="text-sm text-muted-foreground">A Level ({stats?.aLevelCount || 0})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Progress */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Registration Progress</CardTitle>
                <CardDescription>Status of candidate registrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confirmed</span>
                    <span className="text-sm text-muted-foreground">{stats?.confirmedCount || 0}</span>
                  </div>
                  <Progress value={stats?.totalCandidates ? (stats.confirmedCount / stats.totalCandidates) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Registered</span>
                    <span className="text-sm text-muted-foreground">{stats?.registeredCount || 0}</span>
                  </div>
                  <Progress value={stats?.totalCandidates ? (stats.registeredCount / stats.totalCandidates) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending</span>
                    <span className="text-sm text-muted-foreground">{stats?.pendingCount || 0}</span>
                  </div>
                  <Progress value={stats?.totalCandidates ? (stats.pendingCount / stats.totalCandidates) * 100 : 0} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats?.confirmedCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{stats?.registeredCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Registered</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats?.pendingCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-emerald-200" />
                <span className="text-sm font-medium text-emerald-100">ZIMSEC Centre</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-emerald-200 text-xs uppercase tracking-wide">Current Year</p>
                  <p className="text-2xl font-bold mt-1">{new Date().getFullYear()}</p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs uppercase tracking-wide">Exam Session</p>
                  <p className="text-2xl font-bold mt-1">November</p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs uppercase tracking-wide">Registration Deadline</p>
                  <p className="text-2xl font-bold mt-1">31 March</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Candidates Tab ───────────────────────────────────────────── */}
        <TabsContent value="candidates" className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:bg-white"
                  />
                </div>
                <Select value={examLevelFilter} onValueChange={setExamLevelFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Exam Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    {Object.entries(examLevelLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidates Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {candidates.length > 0 ? (
                <ScrollArea className="max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Candidate #</TableHead>
                        <TableHead className="text-xs">Student Name</TableHead>
                        <TableHead className="text-xs">Student #</TableHead>
                        <TableHead className="text-xs">Level</TableHead>
                        <TableHead className="text-xs">Year</TableHead>
                        <TableHead className="text-xs text-center">Status</TableHead>
                        <TableHead className="text-xs text-right">Fees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((candidate) => (
                        <TableRow key={candidate.id} className="hover:bg-muted/20">
                          <TableCell className="font-mono text-xs font-semibold text-emerald-600">
                            {candidate.candidateNumber || 'Pending'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {candidate.student.lastName}, {candidate.student.firstName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{candidate.student.studentNumber}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px] px-1.5 py-0 border', examLevelColors[candidate.examLevel] || 'bg-gray-100 text-gray-700')}>
                              {examLevelLabels[candidate.examLevel] || candidate.examLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{candidate.examYear}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn('text-[10px] px-2 border', registrationStatusColors[candidate.registrationStatus] || 'bg-gray-100 text-gray-700')}>
                              {registrationStatusLabels[candidate.registrationStatus] || candidate.registrationStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            <div>
                              <span className="font-medium">${candidate.feesPaid}</span>
                              <span className="text-muted-foreground">/${candidate.totalFees}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <FileCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No candidates registered yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Register candidates for ZIMSEC examinations</p>
                  <Button
                    className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    onClick={() => setRegisterDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Register First Candidate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Schedule Tab ─────────────────────────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Level Filter */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={examLevelFilter} onValueChange={setExamLevelFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Exam Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    {Object.entries(examLevelLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  {filteredSchedule.length} exam{filteredSchedule.length !== 1 ? 's' : ''} scheduled
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calendar View */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Exam Calendar</CardTitle>
                <CardDescription>Exam dates overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  <div className="space-y-4">
                    {Object.entries(scheduleByDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, exams]) => (
                        <div key={date}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                              <span className="text-[10px] font-medium leading-none">
                                {new Date(date).toLocaleDateString('en-ZW', { month: 'short' })}
                              </span>
                              <span className="text-sm font-bold leading-none mt-0.5">
                                {new Date(date).getDate()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {new Date(date).toLocaleDateString('en-ZW', { weekday: 'long' })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(date).toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="ml-12 space-y-1.5">
                            {exams.map((exam) => (
                              <div
                                key={exam.id}
                                className="flex items-center gap-2 rounded-lg border p-2.5 hover:bg-muted/20 transition-colors"
                              >
                                <Badge className={cn('text-[10px] px-1.5 py-0 border shrink-0', examLevelColors[exam.level] || 'bg-gray-100 text-gray-700')}>
                                  {examLevelLabels[exam.level] || exam.level}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{exam.subject}</p>
                                  <p className="text-xs text-muted-foreground">{exam.time} • {exam.duration}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* List View */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Exam List</CardTitle>
                <CardDescription>All scheduled examinations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs">Level</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedule
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((exam) => (
                          <TableRow key={exam.id} className="hover:bg-muted/20">
                            <TableCell className="text-sm font-medium">{exam.subject}</TableCell>
                            <TableCell>
                              <Badge className={cn('text-[10px] px-1.5 py-0 border', examLevelColors[exam.level] || 'bg-gray-100 text-gray-700')}>
                                {examLevelLabels[exam.level] || exam.level}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(exam.date)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exam.time}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Results Tab ──────────────────────────────────────────────── */}
        <TabsContent value="results" className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-2">
            <Button
              variant={resultsView === 'analysis' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                resultsView === 'analysis' && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
              )}
              onClick={() => setResultsView('analysis')}
            >
              <BarChart3 className="mr-1.5 h-4 w-4" /> Analysis
            </Button>
            <Button
              variant={resultsView === 'table' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                resultsView === 'table' && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
              )}
              onClick={() => setResultsView('table')}
            >
              <FileCheck className="mr-1.5 h-4 w-4" /> Results Table
            </Button>
            <Button
              variant={resultsView === 'import' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                resultsView === 'import' && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
              )}
              onClick={() => setResultsView('import')}
            >
              <Upload className="mr-1.5 h-4 w-4" /> Import
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {resultsView === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Subject Pass Rate Chart */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Subject Pass Rates</CardTitle>
                    <CardDescription>O Level pass rate by subject (simulated data)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={passRateChartConfig} className="h-[350px] w-full">
                      <BarChart data={simulatedResults} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                        <YAxis dataKey="subject" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={120} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="passRate" fill="var(--color-passRate)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Performance Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5 text-center">
                      <Award className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">72%</p>
                      <p className="text-sm text-muted-foreground">Overall Pass Rate</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5 text-center">
                      <TrendingUp className="h-8 w-8 text-teal-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">15%</p>
                      <p className="text-sm text-muted-foreground">Distinction Rate</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5 text-center">
                      <Users className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">95</p>
                      <p className="text-sm text-muted-foreground">Total Candidates</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {resultsView === 'table' && (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-md">
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[60vh]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">Subject</TableHead>
                            <TableHead className="text-xs text-center">Candidates</TableHead>
                            <TableHead className="text-xs text-center">Pass Rate</TableHead>
                            <TableHead className="text-xs text-center">Distinctions</TableHead>
                            <TableHead className="text-xs text-center">Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulatedResults.map((result) => (
                            <TableRow key={result.subject} className="hover:bg-muted/20">
                              <TableCell className="text-sm font-medium">{result.subject}</TableCell>
                              <TableCell className="text-sm text-center">{result.totalCandidates}</TableCell>
                              <TableCell className="text-center">
                                <span className={cn(
                                  'text-sm font-semibold',
                                  result.passRate >= 70 ? 'text-emerald-600' : result.passRate >= 50 ? 'text-amber-600' : 'text-red-600'
                                )}>
                                  {result.passRate}%
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-center">{result.distinctionRate}%</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full',
                                        result.passRate >= 70 ? 'bg-emerald-500' : result.passRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                      )}
                                      style={{ width: `${result.passRate}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {resultsView === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="text-center max-w-lg mx-auto">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mx-auto mb-4">
                        <Upload className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Import ZIMSEC Results</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Upload ZIMSEC results CSV file to import candidate results into the system.
                      </p>

                      <div
                        className="border-2 border-dashed border-emerald-200 rounded-xl p-8 mb-4 hover:border-emerald-400 transition-colors cursor-pointer relative"
                        onClick={() => document.getElementById('zimsec-file-input')?.click()}
                      >
                        <Upload className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">CSV format (Max 5MB)</p>
                        <input
                          id="zimsec-file-input"
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const formData = new FormData()
                            formData.append('file', file)
                            try {
                              const res = await fetch('/api/examinations/bulk-import', {
                                method: 'POST',
                                body: formData,
                              })
                              const data = await res.json()
                              if (res.ok && data.success) {
                                alert(data.message)
                              } else {
                                alert(data.error || 'Import failed')
                              }
                            } catch {
                              alert('Failed to upload file')
                            }
                            e.target.value = ''
                          }}
                        />
                      </div>

                      <div className="text-left space-y-3 bg-muted/30 rounded-lg p-4">
                        <p className="text-sm font-semibold">Expected CSV format:</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• candidateNumber - ZIMSEC candidate number</p>
                          <p>• subject - Subject name (e.g. Mathematics)</p>
                          <p>• grade - Grade achieved (A*, A, B, C, D, E, U)</p>
                          <p>• year - Exam year (e.g. 2024)</p>
                          <p>• level - Exam level (O-Level, A-Level, Grade 7)</p>
                        </div>
                        <div className="mt-2 p-2 rounded bg-white border font-mono text-[10px]">
                          candidateNumber,subject,grade,year,level<br/>
                          C2024001,Mathematics,B,2024,O-Level<br/>
                          C2024001,English,A,2024,O-Level
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => document.getElementById('zimsec-file-input')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Select CSV File to Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
