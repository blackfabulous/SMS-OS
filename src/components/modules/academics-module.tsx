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
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useApiQuery, useApiMutation } from '@/hooks/use-api-query'
import { apiPost } from '@/lib/api-client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Award,
  Beaker,
  FlaskConical,
  FileCheck,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Users,
  GraduationCap,
  ClipboardList,
  Loader2,
  Save,
  TrendingUp,
  Calendar,
  BarChart3,
  Settings,
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
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface GradeData {
  id: string
  name: string
  level: string
  sequence: number
  classes: ClassData[]
  gradeSubjects: Array<{ id: string; subject: SubjectData; isCompulsory: boolean; periodsPerWeek: number }>
}

interface ClassData {
  id: string
  name: string
  stream: string | null
  capacity: number
  classTeacherId: string | null
  gradeId: string
  studentCount?: number
  grade?: { name: string }
}

interface SubjectData {
  id: string
  code: string
  name: string
  department: string | null
  isCore: boolean
  isPractical: boolean
  passMark: number
}

interface AssessmentData {
  id: string
  name: string
  assessmentType: string
  totalMarks: number
  weight: number
  date: string | null
  isLocked: boolean
  subjectId: string
  classId: string | null
  subject: SubjectData
  marks: AssessmentMarkData[]
  createdAt: string
}

interface AssessmentMarkData {
  id: string
  studentId: string
  marksObtained: number
  grade: string | null
  student: { id: string; firstName: string; lastName: string; studentNumber: string }
}

interface ClassStudent {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
  existingMarkId: string | null
  marksObtained: number | null
  grade: string | null
}

interface AcademicsOverview {
  grades: GradeData[]
  subjects: SubjectData[]
  recentAssessments: AssessmentData[]
  totalSubjects: number
  coreSubjects: number
  practicalSubjects: number
  classes: Array<ClassData & { studentCount: number }>
}

interface MarksResponse {
  assessment: AssessmentData
  classStudents: ClassStudent[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const assessmentTypeLabels: Record<string, string> = {
  TEST: 'Test',
  EXAM: 'Exam',
  ASSIGNMENT: 'Assignment',
  PROJECT: 'Project',
  PRACTICAL: 'Practical',
  CONTINUOUS: 'Continuous Assessment',
}

const assessmentTypeColors: Record<string, string> = {
  TEST: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EXAM: 'bg-amber-100 text-amber-700 border-amber-200',
  ASSIGNMENT: 'bg-teal-100 text-teal-700 border-teal-200',
  PROJECT: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  PRACTICAL: 'bg-violet-100 text-violet-700 border-violet-200',
  CONTINUOUS: 'bg-orange-100 text-orange-700 border-orange-200',
}

const calculateGrade = (marks: number, total: number): string => {
  const pct = (marks / total) * 100
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  return 'U'
}

const gradeColors: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-teal-100 text-teal-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-orange-100 text-orange-700',
  E: 'bg-red-100 text-red-700',
  U: 'bg-red-200 text-red-800',
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const gradeDistChartConfig = {
  students: { label: 'Students', color: '#10b981' },
} satisfies ChartConfig

const subjectCoverageConfig = {
  value: { label: 'Subjects', color: '#10b981' },
} satisfies ChartConfig

// ─── Academics Module ──────────────────────────────────────────────────────

export default function AcademicsModule() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  // Assessments tab state
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState('ALL')

  // Marks entry sub-view
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [editedMarks, setEditedMarks] = useState<Record<string, number>>({})

  // ViewMode state pattern
  type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    subjectId: '',
    classId: '',
    assessmentType: 'TEST',
    totalMarks: '100',
    weight: '1',
    date: '',
  })

  // Subjects filter
  const [subjectDeptFilter, setSubjectDeptFilter] = useState('ALL')
  const [subjectCoreFilter, setSubjectCoreFilter] = useState('ALL')
  const [subjectSearch, setSubjectSearch] = useState('')

  // Expanded grades
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set())

  // Settings state
  const [academicsSettings, setAcademicsSettings] = useState({
    gradingScale: 'ZIMSEC',
    passMark: '50',
    testWeight: '25',
    examWeight: '50',
    assignmentWeight: '25',
    autoCalculateGrades: true,
    showClassRank: true,
  })

  // ─── API Queries & Mutations ───────────────────────────────────────────

  const {
    data: overview,
    isPending: loading,
  } = useApiQuery<AcademicsOverview>(['academics'], '/api/academics')

  const assessmentsUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (assessmentTypeFilter !== 'ALL') params.set('assessmentType', assessmentTypeFilter)
    return `/api/assessments?${params.toString()}`
  }, [assessmentTypeFilter])

  const {
    data: assessmentsData,
    isPending: assessmentsLoading,
  } = useApiQuery<{ data: AssessmentData[] }>(['assessments', assessmentTypeFilter], assessmentsUrl, { enabled: activeTab === 'assessments' })

  const assessments = assessmentsData?.data ?? []

  const {
    data: marksData,
    isPending: marksLoading,
  } = useApiQuery<MarksResponse>(
    ['assessments', 'marks', selectedAssessmentId],
    selectedAssessmentId ? `/api/assessments/${selectedAssessmentId}/marks` : '',
    { enabled: !!selectedAssessmentId }
  )

  const selectedAssessment = marksData?.assessment ?? null
  const classStudents = marksData?.classStudents ?? []

  type AssessmentBody = {
    name: string
    subjectId: string
    classId: string | null
    assessmentType: string
    totalMarks: number
    weight: number
    date: string | null
  }

  const { mutate: createAssessment, isPending: isCreating } = useApiMutation<AssessmentBody, AssessmentData>('/api/assessments', {
    onSuccess: () => {
      setViewMode('list')
      setCreateForm({ name: '', subjectId: '', classId: '', assessmentType: 'TEST', totalMarks: '100', weight: '1', date: '' })
      toast.success('Assessment created successfully')
      queryClient.invalidateQueries({ queryKey: ['academics'] })
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
    onError: (err) => toast.error(err.message || 'Failed to create assessment'),
  })

  interface SaveMarksResponse {
    saved: number
    marks: AssessmentMarkData[]
  }

  const { mutate: saveMarks, isPending: marksSaving } = useMutation<
    SaveMarksResponse,
    Error,
    { id: string; marks: { studentId: string; marksObtained: number }[] }
  >({
    mutationFn: ({ id, marks }) =>
      apiPost<SaveMarksResponse, { marks: { studentId: string; marksObtained: number }[] }>(`/api/assessments/${id}/marks`, { marks }),
    onSuccess: () => {
      toast.success('Marks saved successfully')
      queryClient.invalidateQueries({ queryKey: ['assessments', 'marks', selectedAssessmentId] })
    },
    onError: (err) => toast.error(err.message || 'Failed to save marks'),
  })

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCreateAssessment = () => {
    if (!createForm.name || !createForm.subjectId) return
    createAssessment({
      name: createForm.name,
      subjectId: createForm.subjectId,
      classId: createForm.classId || null,
      assessmentType: createForm.assessmentType,
      totalMarks: parseFloat(createForm.totalMarks) || 100,
      weight: parseFloat(createForm.weight) || 1,
      date: createForm.date || null,
    })
  }

  const handleSaveMarks = () => {
    if (!selectedAssessment) return
    const marksToSave = Object.entries(editedMarks)
      .filter(([, marks]) => marks !== undefined && marks !== null)
      .map(([studentId, marks]) => ({ studentId, marksObtained: marks }))

    if (marksToSave.length === 0) return
    saveMarks({ id: selectedAssessment.id, marks: marksToSave })
  }

  const toggleGradeExpand = (gradeId: string) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev)
      if (next.has(gradeId)) next.delete(gradeId)
      else next.add(gradeId)
      return next
    })
  }

  // ─── Computed Data ────────────────────────────────────────────────────

  const gradeDistribution = overview?.grades.map((g) => {
    const totalStudents = g.classes.reduce((sum, cls) => {
      const classWithCount = overview.classes.find((c) => c.id === cls.id)
      return sum + (classWithCount?.studentCount || 0)
    }, 0)
    return { grade: g.name, students: totalStudents }
  }) || []

  const departments = [...new Set(overview?.subjects.map((s) => s.department).filter(Boolean) as string[])]

  const filteredSubjects = overview?.subjects.filter((s) => {
    if (subjectDeptFilter !== 'ALL' && s.department !== subjectDeptFilter) return false
    if (subjectCoreFilter === 'CORE' && !s.isCore) return false
    if (subjectCoreFilter === 'OPTIONAL' && s.isCore) return false
    if (subjectSearch && !s.name.toLowerCase().includes(subjectSearch.toLowerCase()) && !s.code.toLowerCase().includes(subjectSearch.toLowerCase())) return false
    return true
  }) || []

  const subjectCoverageData = [
    { name: 'Core', value: overview?.coreSubjects || 0, fill: '#10b981' },
    { name: 'Optional', value: (overview?.totalSubjects || 0) - (overview?.coreSubjects || 0), fill: '#f59e0b' },
    { name: 'Practical', value: overview?.practicalSubjects || 0, fill: '#14b8a6' },
  ]

  const activeAssessmentsCount = assessments.filter((a) => !a.isLocked).length

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  // ─── Add Assessment Inline View ─────────────────────────────────────────────

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
            <ChevronLeft className="h-4 w-4" /> Back to Academics
          </Button>
        </div>

        <Card className="border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
            <h2 className="text-xl font-bold">Create Assessment</h2>
            <p className="text-emerald-100 text-sm mt-1">Add a new test, exam, or assignment for a class</p>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Assessment Name *</Label>
                <Input
                  placeholder="e.g. Term 1 Mathematics Test"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Subject *</Label>
                  <Select
                    value={createForm.subjectId}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, subjectId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {overview?.subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Class</Label>
                  <Select
                    value={createForm.classId}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, classId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {overview?.classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.grade?.name || ''} - {cls.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Assessment Type</Label>
                  <Select
                    value={createForm.assessmentType}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, assessmentType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(assessmentTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={createForm.totalMarks}
                    onChange={(e) => setCreateForm((p) => ({ ...p, totalMarks: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Weight</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="1"
                    value={createForm.weight}
                    onChange={(e) => setCreateForm((p) => ({ ...p, weight: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setViewMode('list')}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssessment}
                disabled={isCreating || !createForm.name || !createForm.subjectId}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Assessment
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
            <ChevronLeft className="h-4 w-4" /> Back to Academics
          </Button>
        </div>

        <Card className="border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
            <h2 className="text-xl font-bold">Academics Settings</h2>
            <p className="text-emerald-100 text-sm mt-1">Configure grading scales, pass marks, and display preferences</p>
          </div>
          <CardContent className="p-6 space-y-6">
            {/* Grading Scale */}
            <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grading Scale</CardTitle>
                <CardDescription>Choose the grading system used for assessment marks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Grading Scale</Label>
                    <Select
                      value={academicsSettings.gradingScale}
                      onValueChange={(v) => setAcademicsSettings((p) => ({ ...p, gradingScale: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZIMSEC">ZIMSEC (A-U)</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage (0-100%)</SelectItem>
                        <SelectItem value="GPA">GPA (4.0 Scale)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Default Pass Mark (%)</Label>
                    <Input
                      type="number"
                      value={academicsSettings.passMark}
                      onChange={(e) => setAcademicsSettings((p) => ({ ...p, passMark: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Weightings */}
            <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assessment Weightings</CardTitle>
                <CardDescription>Set default weights for different assessment types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Tests Weight (%)</Label>
                    <Input
                      type="number"
                      value={academicsSettings.testWeight}
                      onChange={(e) => setAcademicsSettings((p) => ({ ...p, testWeight: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Exams Weight (%)</Label>
                    <Input
                      type="number"
                      value={academicsSettings.examWeight}
                      onChange={(e) => setAcademicsSettings((p) => ({ ...p, examWeight: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Assignments Weight (%)</Label>
                    <Input
                      type="number"
                      value={academicsSettings.assignmentWeight}
                      onChange={(e) => setAcademicsSettings((p) => ({ ...p, assignmentWeight: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: {parseInt(academicsSettings.testWeight || '0') + parseInt(academicsSettings.examWeight || '0') + parseInt(academicsSettings.assignmentWeight || '0')}%
                  {parseInt(academicsSettings.testWeight || '0') + parseInt(academicsSettings.examWeight || '0') + parseInt(academicsSettings.assignmentWeight || '0') !== 100 && (
                    <span className="text-amber-600 ml-2">⚠ Should total 100%</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Display Preferences */}
            <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Display Preferences</CardTitle>
                <CardDescription>Control how academic data is displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-calculate Grades</p>
                    <p className="text-xs text-muted-foreground">Automatically compute grades from marks entered</p>
                  </div>
                  <Switch
                    checked={academicsSettings.autoCalculateGrades}
                    onCheckedChange={(v) => setAcademicsSettings((p) => ({ ...p, autoCalculateGrades: v }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show Class Rank</p>
                    <p className="text-xs text-muted-foreground">Display student ranking position in class</p>
                  </div>
                  <Switch
                    checked={academicsSettings.showClassRank}
                    onCheckedChange={(v) => setAcademicsSettings((p) => ({ ...p, showClassRank: v }))}
                  />
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
    const assessment = assessments.find((a) => a.id === selectedId) || overview?.recentAssessments.find((a) => a.id === selectedId)
    if (assessment) {
      return (
        <ModuleContainer>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => { setViewMode('list'); setSelectedId(null) }}
            >
              <ChevronLeft className="h-4 w-4" /> Back to Academics
            </Button>
          </div>

          <Card className="border border-border/60 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
              <h2 className="text-xl font-bold">{assessment.name}</h2>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{assessment.subject.name}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <Award className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{assessmentTypeLabels[assessment.assessmentType] || assessment.assessmentType}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium">Total: {assessment.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <Calendar className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-medium">{formatDate(assessment.date)}</span>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Subject</p>
                    <p className="text-sm font-semibold mt-1">{assessment.subject.name}</p>
                    <Badge className={cn('mt-2 text-[10px] border', assessment.subject.isCore ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>{assessment.subject.isCore ? 'Core' : 'Optional'}</Badge>
                  </CardContent>
                </Card>
                <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Type</p>
                    <p className="text-sm font-semibold mt-1">{assessmentTypeLabels[assessment.assessmentType] || assessment.assessmentType}</p>
                    <Badge className={cn('mt-2 text-[10px] border', assessmentTypeColors[assessment.assessmentType] || 'bg-gray-100 text-gray-700')}>{assessment.assessmentType}</Badge>
                  </CardContent>
                </Card>
                <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Total Marks</p>
                    <p className="text-sm font-semibold mt-1">{assessment.totalMarks}</p>
                    <p className="text-xs text-muted-foreground mt-1">Weight: {assessment.weight}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/60 shadow-sm bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                    <p className="text-sm font-semibold mt-1">{assessment.isLocked ? 'Locked' : 'Open'}</p>
                    <Badge className={cn('mt-2 text-[10px]', assessment.isLocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')}>{assessment.isLocked ? 'Locked' : 'Open for Entry'}</Badge>
                  </CardContent>
                </Card>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  onClick={() => setSelectedAssessmentId(assessment.id)}
                >
                  Enter Marks
                </Button>
                <p className="text-sm text-muted-foreground">{assessment.marks?.length || 0} marks entered</p>
              </div>
            </CardContent>
          </Card>
        </ModuleContainer>
      )
    }
  }

  // ─── Marks Entry Sub-view ─────────────────────────────────────────────

  if (selectedAssessment) {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => {
              setSelectedAssessmentId(null)
              setEditedMarks({})
            }}
          >
            <ChevronLeft className="h-4 w-4" /> Back to Academics
          </Button>
        </div>

        <Card className="border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
            <h2 className="text-xl font-bold">{selectedAssessment.name}</h2>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <BookOpen className="h-4 w-4 text-emerald-200" />
                <span className="text-sm font-medium">{selectedAssessment.subject.name}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Award className="h-4 w-4 text-emerald-200" />
                <span className="text-sm font-medium">{assessmentTypeLabels[selectedAssessment.assessmentType] || selectedAssessment.assessmentType}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium">Total: {selectedAssessment.totalMarks} marks</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Calendar className="h-4 w-4 text-emerald-200" />
                <span className="text-sm font-medium">{formatDate(selectedAssessment.date)}</span>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            {marksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                <span className="ml-2 text-muted-foreground">Loading students...</span>
              </div>
            ) : classStudents.length > 0 ? (
              <>
                <TableShell maxHeight="60vh">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-12 text-xs">#</TableHead>
                        <TableHead className="text-xs">Student Number</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs w-32 text-center">Marks</TableHead>
                        <TableHead className="text-xs w-20 text-center">Grade</TableHead>
                        <TableHead className="text-xs w-20 text-center">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.map((student, idx) => {
                        const currentMarks = editedMarks[student.id] ?? student.marksObtained
                        const computedGrade = currentMarks !== undefined && currentMarks !== null
                          ? calculateGrade(currentMarks, selectedAssessment.totalMarks)
                          : '—'
                        const percentage = currentMarks !== undefined && currentMarks !== null
                          ? Math.round((currentMarks / selectedAssessment.totalMarks) * 100)
                          : 0

                        return (
                          <TableRow key={student.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{student.studentNumber}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {student.lastName}, {student.firstName}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min={0}
                                max={selectedAssessment.totalMarks}
                                className="h-8 w-24 mx-auto text-center text-sm border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                value={currentMarks ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === '') {
                                    setEditedMarks((prev) => {
                                      const next = { ...prev }
                                      delete next[student.id]
                                      return next
                                    })
                                  } else {
                                    const num = parseFloat(val)
                                    if (!isNaN(num) && num >= 0 && num <= selectedAssessment.totalMarks) {
                                      setEditedMarks((prev) => ({ ...prev, [student.id]: num }))
                                    }
                                  }
                                }}
                                placeholder="—"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {computedGrade !== '—' ? (
                                <Badge className={cn('text-xs px-2', gradeColors[computedGrade] || 'bg-gray-100 text-gray-700')}>
                                  {computedGrade}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium">
                              {percentage > 0 ? `${percentage}%` : '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableShell>
                <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    {classStudents.length} students • {Object.keys(editedMarks).length} marks entered
                  </div>
                  <Button
                    onClick={handleSaveMarks}
                    disabled={marksSaving || Object.keys(editedMarks).length === 0}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                  >
                    {marksSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Marks
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No students found for this class</p>
                <p className="text-xs text-muted-foreground mt-1">Enroll students to this class to enter marks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </ModuleContainer>
    )
  }

  // ─── Main Render ───────────────────────────────────────────────────────

  return (
    <ModuleContainer>
<ModulePageLayout
        actions={<>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
            onClick={() => setViewMode('add')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="grades">Grades & Classes</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={GraduationCap}
              label="Total Grades"
              value={overview?.grades.length || 0}
              accentGradient="from-emerald-400 to-teal-500"
              trend={{ value: 'Active levels', positive: true }}
              index={0}
            />
            <ModuleStatCard
              icon={Users}
              label="Total Classes"
              value={overview?.classes.length || 0}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              trend={{ value: 'All streams', positive: true }}
              index={1}
            />
            <ModuleStatCard
              icon={BookOpen}
              label="Total Subjects"
              value={overview?.totalSubjects || 0}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              trend={{ value: `${overview?.coreSubjects || 0} core`, positive: true }}
              index={2}
            />
            <ModuleStatCard
              icon={FileCheck}
              label="Active Assessments"
              value={activeAssessmentsCount}
              accentGradient="from-orange-400 to-red-500"
              bgColor="bg-orange-50 dark:bg-orange-950/40"
              iconColor="text-orange-600 dark:text-orange-400"
              trend={{ value: 'Open for entry', positive: true }}
              index={3}
            />
          </StatGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Grade Distribution" description="Students per grade level">
              {gradeDistribution.length > 0 ? (
                <ChartContainer config={gradeDistChartConfig} className="h-[250px] w-full">
                  <BarChart data={gradeDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="grade" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="students" fill="var(--color-students)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2 opacity-50" /> No grade data available
                </div>
              )}
            </SectionCard>

            <SectionCard title="Subject Coverage" description="Core vs Optional vs Practical breakdown">
              <div className="flex items-center justify-center">
                <ChartContainer config={subjectCoverageConfig} className="h-[250px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={subjectCoverageData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {subjectCoverageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-muted-foreground">Core ({overview?.coreSubjects || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-muted-foreground">Optional ({(overview?.totalSubjects || 0) - (overview?.coreSubjects || 0)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-teal-500" />
                  <span className="text-sm text-muted-foreground">Practical ({overview?.practicalSubjects || 0})</span>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Recent Assessments"
            actions={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                onClick={() => setActiveTab('assessments')}
              >
                View All <ChevronLeft className="ml-1 h-3 w-3 rotate-180" />
              </Button>
            }
          >
            <TableShell
              isEmpty={(overview?.recentAssessments || []).length === 0}
              empty={
                <KitEmptyState
                  icon={ClipboardList}
                  title="No assessments yet"
                  description="Create your first assessment to get started"
                />
              }
              maxHeight="300px"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Total Marks</TableHead>
                    <TableHead className="text-xs text-right">Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.recentAssessments.map((a) => (
                    <TableRow key={a.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedId(a.id); setViewMode('detail') }}>
                      <TableCell className="text-sm font-medium">{a.name}</TableCell>
                      <TableCell className="text-sm">{a.subject.name}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] px-1.5 py-0 border', assessmentTypeColors[a.assessmentType] || 'bg-gray-100 text-gray-700')}>
                          {assessmentTypeLabels[a.assessmentType] || a.assessmentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right">{a.totalMarks}</TableCell>
                      <TableCell className="text-sm text-right">{a.marks.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Grades & Classes Tab ─────────────────────────────────────── */}
        <TabsContent value="grades" className="space-y-4">
          {overview?.grades.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="text-center py-12">
                <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No grades configured yet</p>
                <p className="text-xs text-muted-foreground mt-1">Grades and classes will appear here once set up</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {overview?.grades.map((grade) => {
                const isExpanded = expandedGrades.has(grade.id)
                const totalStudentsInGrade = grade.classes.reduce((sum, cls) => {
                  const classWithCount = overview.classes.find((c) => c.id === cls.id)
                  return sum + (classWithCount?.studentCount || 0)
                }, 0)

                return (
                  <Card key={grade.id} className="border border-border/60 shadow-sm overflow-hidden bg-card text-card-foreground">
                    <button
                      className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors"
                      onClick={() => toggleGradeExpand(grade.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold">{grade.name}</h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-sm text-muted-foreground">{grade.classes.length} class{grade.classes.length !== 1 ? 'es' : ''}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{totalStudentsInGrade} students</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {grade.level}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {grade.gradeSubjects.length} subjects
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 pb-5">
                            <Separator className="mb-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {grade.classes.map((cls) => {
                                const classWithCount = overview.classes.find((c) => c.id === cls.id)
                                const studentCount = classWithCount?.studentCount || 0
                                const capacityPct = cls.capacity > 0 ? Math.round((studentCount / cls.capacity) * 100) : 0

                                return (
                                  <div
                                    key={cls.id}
                                    className="rounded-xl border border-border/60 p-4 hover:shadow-md transition-all hover:border-emerald-200 bg-card text-card-foreground"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold text-sm">{cls.name}</h4>
                                      {cls.stream && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                          {cls.stream}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Students</span>
                                        <span className="font-medium">{studentCount}/{cls.capacity}</span>
                                      </div>
                                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                          className={cn(
                                            'h-full rounded-full transition-all',
                                            capacityPct > 90 ? 'bg-red-500' : capacityPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                          )}
                                          style={{ width: `${Math.min(capacityPct, 100)}%` }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Capacity: {capacityPct}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Grade Subjects */}
                            {grade.gradeSubjects.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Subjects for {grade.name}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {grade.gradeSubjects.map((gs) => (
                                    <Badge
                                      key={gs.id}
                                      variant="outline"
                                      className={cn(
                                        'text-xs px-2.5 py-1',
                                        gs.isCompulsory
                                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                          : 'border-gray-300 text-gray-600 bg-gray-50'
                                      )}
                                    >
                                      {gs.isCompulsory && <Award className="mr-1 h-3 w-3" />}
                                      {!gs.isCompulsory && <Beaker className="mr-1 h-3 w-3" />}
                                      {gs.subject.name}
                                      <span className="ml-1 opacity-60">({gs.periodsPerWeek}p/w)</span>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Subjects Tab ─────────────────────────────────────────────── */}
        <TabsContent value="subjects" className="space-y-4">
          <ModuleToolbar
            search={subjectSearch}
            onSearch={setSubjectSearch}
            searchPlaceholder="Search subjects..."
            filters={
              <>
                <Select value={subjectDeptFilter} onValueChange={setSubjectDeptFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={subjectCoreFilter} onValueChange={setSubjectCoreFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="CORE">Core Only</SelectItem>
                    <SelectItem value="OPTIONAL">Optional Only</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />

          <TableShell
            isEmpty={filteredSubjects.length === 0}
            empty={
              <KitEmptyState
                icon={BookOpen}
                title="No subjects found"
                description="No subjects match your selected filters."
              />
            }
            maxHeight="60vh"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs text-center">Core/Optional</TableHead>
                  <TableHead className="text-xs text-center">Practical</TableHead>
                  <TableHead className="text-xs text-right">Pass Mark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-semibold text-emerald-600">{subject.code}</TableCell>
                    <TableCell className="text-sm font-medium">{subject.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{subject.department || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        'text-[10px] px-2',
                        subject.isCore
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      )}>
                        {subject.isCore ? 'Core' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {subject.isPractical ? (
                        <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px] px-2">
                          <FlaskConical className="mr-1 h-3 w-3" /> Practical
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">{subject.passMark}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        {/* ─── Assessments Tab ──────────────────────────────────────────── */}
        <TabsContent value="assessments" className="space-y-4">
          <ModuleToolbar
            filters={
              <Select value={assessmentTypeFilter} onValueChange={setAssessmentTypeFilter}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Assessment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {Object.entries(assessmentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            actions={
              <div className="text-sm text-muted-foreground">
                {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} found
              </div>
            }
          />

          <TableShell
            isEmpty={!assessmentsLoading && assessments.length === 0}
            empty={
              <KitEmptyState
                icon={ClipboardList}
                title="No assessments found"
                description="No assessments match the active filter or have been created yet."
              />
            }
            maxHeight="60vh"
          >
            {assessmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                <span className="ml-2 text-muted-foreground">Loading assessments...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Total Marks</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                    <TableHead className="text-xs text-right">Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow
                      key={assessment.id}
                      className="hover:bg-muted/20 cursor-pointer"
                      onClick={() => setSelectedAssessmentId(assessment.id)}
                    >
                      <TableCell className="text-sm font-medium">{assessment.name}</TableCell>
                      <TableCell className="text-sm">{assessment.subject.name}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] px-1.5 py-0 border', assessmentTypeColors[assessment.assessmentType] || 'bg-gray-100 text-gray-700')}>
                          {assessmentTypeLabels[assessment.assessmentType] || assessment.assessmentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right">{assessment.totalMarks}</TableCell>
                      <TableCell className="text-sm">{formatDate(assessment.date)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          'text-[10px] px-2',
                          assessment.isLocked
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        )}>
                          {assessment.isLocked ? 'Locked' : 'Open'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right">{assessment.marks.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableShell>
        </TabsContent>

        {/* ─── Settings Tab ─────────────────────────────────────────────── */}
        </ModulePageLayout>
    </ModuleContainer>
  )
}
