'use client'

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
import React, { useState, useMemo } from 'react'
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
  Settings,
  Save,
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
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
import { apiFetch } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
// Dialog removed - using ViewMode inline pattern
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
import { Switch } from '@/components/ui/switch'
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

interface StudentsResponse {
  data: StudentOption[]
  total: number
  page: number
  totalPages: number
}

interface ExaminationsResponse {
  data: ZimsecCandidate[]
  total: number
  page: number
  totalPages: number
  stats: ExaminationStats
}

interface BulkImportResponse {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ row: number; studentNumber: string; error: string }>
  message: string
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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [examLevelFilter, setExamLevelFilter] = useState('ALL')

  // ViewMode state pattern
  type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    examLevel: 'O_LEVEL',
    examYear: new Date().getFullYear().toString(),
    subjects: [] as string[],
  })
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  // Results tab state
  const [resultsView, setResultsView] = useState<'import' | 'analysis' | 'table'>('analysis')

  // ─── Data & Mutations ─────────────────────────────────────────────────

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (examLevelFilter !== 'ALL') p.set('examLevel', examLevelFilter)
    return p.toString()
  }, [examLevelFilter])

  const {
    data: examsData,
    isPending: loading,
  } = useApiQuery<ExaminationsResponse>(['examinations', examLevelFilter], `/api/examinations?${params}`)

  const candidates = examsData?.data ?? []
  const stats = examsData?.stats ?? null

  const {
    data: studentsData,
  } = useApiQuery<StudentsResponse>(['students', 'examinations'], '/api/students?limit=500&enrollmentStatus=ACTIVE', {
    enabled: viewMode === 'add',
  })

  const students = studentsData?.data ?? []

  const { mutate: registerCandidate, isPending: registering } = useApiMutation<
    { studentId: string; examLevel: string; examYear: number; subjects: string | null },
    ZimsecCandidate
  >('/api/examinations', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] })
      setViewMode('list')
      setRegisterForm({ studentId: '', examLevel: 'O_LEVEL', examYear: new Date().getFullYear().toString(), subjects: [] })
      toast.success('Candidate registered successfully')
    },
    onError: (err) => {
      if (err.code === 'CONFLICT') {
        setDuplicateWarning(true)
      }
    },
  })

  const bulkImportMutation = useMutation<BulkImportResponse, Error, FormData>({
    mutationFn: (formData) => apiFetch('/api/examinations/bulk-import', {
      method: 'POST',
      body: formData,
      headers: {},
    }),
  })

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleRegister = () => {
    if (!registerForm.studentId || !registerForm.examLevel) return
    setDuplicateWarning(false)
    registerCandidate({
      studentId: registerForm.studentId,
      examLevel: registerForm.examLevel,
      examYear: parseInt(registerForm.examYear),
      subjects: registerForm.subjects.length > 0 ? JSON.stringify(registerForm.subjects) : null,
    })
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

  // ─── Add/Register Inline View ────────────────────────────────────────────

    if (viewMode === 'add') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => setViewMode('list')}
          >
            <ChevronLeft className="h-4 w-4" /> Back to Examinations
          </Button>
        </div>

        <Card className="border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
            <h2 className="text-xl font-bold">Register ZIMSEC Candidate</h2>
            <p className="text-emerald-100 text-sm mt-1">Register a student for ZIMSEC examinations</p>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Exam Level *</Label>
                  <Select
                    value={registerForm.examLevel}
                    onValueChange={(v) => setRegisterForm((p) => ({ ...p, examLevel: v, subjects: [] }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
              <Button
                onClick={handleRegister}
                disabled={registering || !registerForm.studentId || !registerForm.examLevel}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Candidate
              </Button>
            </div>
          </CardContent>
        </Card>
      </ModuleContainer>
    )
  }

  // ─── Settings View ──────────────────────────────────────────────────────

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
            <ChevronLeft className="h-4 w-4" /> Back to Examinations
          </Button>
        </div>

        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
            <h2 className="text-xl font-bold">Examinations Settings</h2>
            <p className="text-emerald-100 text-sm mt-1">Configure ZIMSEC integration, grading, and result publication</p>
          </div>
          <CardContent className="p-6 space-y-6">
            <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ZIMSEC Integration</CardTitle>
                <CardDescription>Centre and registration settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Default Exam Level</Label>
                    <Select defaultValue="O_LEVEL">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GRADE_7">Grade 7</SelectItem>
                        <SelectItem value="O_LEVEL">O Level</SelectItem>
                        <SelectItem value="A_LEVEL">A Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Registration Deadline</Label>
                    <Input type="date" defaultValue="2026-03-31" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-assign Candidate Numbers</p>
                    <p className="text-xs text-muted-foreground">Automatically assign candidate numbers on registration</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grading & Results</CardTitle>
                <CardDescription>Automation settings for grading and publication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-calculate Grades</p>
                    <p className="text-xs text-muted-foreground">Automatically compute grades from marks</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-publish Results</p>
                    <p className="text-xs text-muted-foreground">Publish results automatically after grading</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enable Certificate Generation</p>
                    <p className="text-xs text-muted-foreground">Allow generation of ZIMSEC certificates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                onClick={() => { toast.success('Settings saved successfully'); setViewMode('list') }}
              >
                <Save className="mr-2 h-4 w-4" /> Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </ModuleContainer>
    )
  }

  // ─── Detail View ────────────────────────────────────────────────────────

  if (viewMode === 'detail' && selectedId) {
    const candidate = candidates.find((c) => c.id === selectedId)
    if (candidate) {
      return (
        <ModuleContainer>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => { setViewMode('list'); setSelectedId(null) }}
            >
              <ChevronLeft className="h-4 w-4" /> Back to Examinations
            </Button>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
              <h2 className="text-xl font-bold">{candidate.student.lastName}, {candidate.student.firstName}</h2>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium">#{candidate.candidateNumber || 'Pending'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium">{examLevelLabels[candidate.examLevel]}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium">Year: {candidate.examYear}</span>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Student Number</p>
                    <p className="text-sm font-semibold mt-1">{candidate.student.studentNumber}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Registration Status</p>
                    <Badge className={cn('mt-1 text-xs border', registrationStatusColors[candidate.registrationStatus])}>{registrationStatusLabels[candidate.registrationStatus]}</Badge>
                  </CardContent>
                </Card>
                <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Fees</p>
                    <p className="text-sm font-semibold mt-1">${candidate.feesPaid} / ${candidate.totalFees}</p>
                  </CardContent>
                </Card>
              </div>
              {candidate.student.enrollments?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Class</p>
                  <p className="text-sm text-muted-foreground">{candidate.student.enrollments[0].class.grade.name} - {candidate.student.enrollments[0].class.name}</p>
                </div>
              )}
              {candidate.subjects && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Registered Subjects</p>
                  <div className="flex flex-wrap gap-1.5">{(JSON.parse(candidate.subjects) as string[]).map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </ModuleContainer>
      )
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <ModuleContainer>
      <ModulePageLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </>}
        actions={<>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
            onClick={() => setViewMode('add')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Register Candidate
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
      >

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={Users}
              label="Total Candidates"
              value={stats?.totalCandidates || 0}
              accentGradient="from-emerald-400 to-teal-500"
              trend={{ value: 'All levels', positive: true }}
              index={0}
            />
            <ModuleStatCard
              icon={GraduationCap}
              label="Grade 7"
              value={stats?.grade7Count || 0}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              trend={{ value: 'Primary', positive: true }}
              index={1}
            />
            <ModuleStatCard
              icon={FileCheck}
              label="O Level"
              value={stats?.oLevelCount || 0}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              trend={{ value: 'Secondary', positive: true }}
              index={2}
            />
            <ModuleStatCard
              icon={Award}
              label="Registration Progress"
              value={`${stats?.registrationProgress || 0}%`}
              accentGradient="from-orange-400 to-red-500"
              bgColor="bg-orange-50 dark:bg-orange-950/40"
              iconColor="text-orange-600 dark:text-orange-400"
              trend={{
                value: (stats?.registrationProgress || 0) >= 80 ? 'On track' : 'Needs attention',
                positive: (stats?.registrationProgress || 0) >= 80
              }}
              index={3}
            />
          </StatGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Candidates by Level" description="Distribution across exam levels">
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
            </SectionCard>

            <SectionCard title="Registration Progress" description="Status of candidate registrations">
              <div className="space-y-5">
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
              </div>
            </SectionCard>
          </div>

          {/* Quick Stats */}
          <Card className="border border-border/60 shadow-sm bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white">
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
          <ModuleToolbar
            onSearch={() => {}} // keep empty placeholder
            searchPlaceholder="Search candidates..."
            filters={
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
            }
            actions={
              <div className="text-sm text-muted-foreground">
                {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
              </div>
            }
          />

          <TableShell
            isEmpty={candidates.length === 0}
            empty={
              <KitEmptyState
                icon={FileCheck}
                title="No candidates registered yet"
                description="Register candidates for ZIMSEC examinations"
                action={
                  <Button
                    className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    onClick={() => setViewMode('add')}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Register First Candidate
                  </Button>
                }
              />
            }
            maxHeight="60vh"
          >
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
          </TableShell>
        </TabsContent>

        {/* ─── Schedule Tab ─────────────────────────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          <ModuleToolbar
            filters={
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
            }
            actions={
              <div className="text-sm text-muted-foreground">
                {filteredSchedule.length} exam{filteredSchedule.length !== 1 ? 's' : ''} scheduled
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Exam Calendar" description="Exam dates overview">
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
                              className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 hover:bg-muted/20 transition-colors bg-card text-card-foreground"
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
            </SectionCard>

            <SectionCard title="Exam List" description="All scheduled examinations">
              <TableShell maxHeight="450px">
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
              </TableShell>
            </SectionCard>
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
                <SectionCard title="Subject Pass Rates" description="O Level pass rate by subject (simulated data)">
                  <ChartContainer config={passRateChartConfig} className="h-[350px] w-full">
                    <BarChart data={simulatedResults} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <YAxis dataKey="subject" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="passRate" fill="var(--color-passRate)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                    </BarChart>
                  </ChartContainer>
                </SectionCard>

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
                <TableShell maxHeight="60vh">
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
                </TableShell>
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
                <SectionCard title="Import ZIMSEC Results" description="Upload ZIMSEC results CSV file to import candidate results into the system.">
                  <div className="text-center max-w-lg mx-auto">
                    <div
                      className="border-2 border-dashed border-emerald-200 rounded-xl p-8 mb-4 hover:border-emerald-400 transition-colors cursor-pointer relative bg-muted/10"
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
                            const data = await bulkImportMutation.mutateAsync(formData)
                            if (data.success) {
                              toast.success(data.message)
                              queryClient.invalidateQueries({ queryKey: ['examinations'] })
                            } else {
                              toast.error('Import failed')
                            }
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Failed to upload file')
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
                      <div className="mt-2 p-2 rounded bg-background border font-mono text-[10px]">
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
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
