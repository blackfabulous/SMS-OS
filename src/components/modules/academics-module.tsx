'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  const [overview, setOverview] = useState<AcademicsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Assessments tab state
  const [assessments, setAssessments] = useState<AssessmentData[]>([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState('ALL')

  // Marks entry sub-view
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentData | null>(null)
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([])
  const [marksLoading, setMarksLoading] = useState(false)
  const [marksSaving, setMarksSaving] = useState(false)
  const [editedMarks, setEditedMarks] = useState<Record<string, number>>({})

  // Create assessment dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
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

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/academics')
      if (res.ok) {
        const data = await res.json()
        setOverview(data)
      }
    } catch (err) {
      console.error('Failed to fetch academics overview:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAssessments = useCallback(async () => {
    try {
      setAssessmentsLoading(true)
      const params = new URLSearchParams()
      if (assessmentTypeFilter !== 'ALL') params.set('assessmentType', assessmentTypeFilter)
      const res = await fetch(`/api/assessments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAssessments(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch assessments:', err)
    } finally {
      setAssessmentsLoading(false)
    }
  }, [assessmentTypeFilter])

  const fetchMarks = useCallback(async (assessmentId: string) => {
    try {
      setMarksLoading(true)
      const res = await fetch(`/api/assessments/${assessmentId}/marks`)
      if (res.ok) {
        const data = await res.json()
        setSelectedAssessment(data.assessment)
        setClassStudents(data.classStudents || [])
        // Initialize edited marks from existing data
        const marksMap: Record<string, number> = {}
        for (const s of data.classStudents || []) {
          if (s.marksObtained !== null) {
            marksMap[s.id] = s.marksObtained
          }
        }
        setEditedMarks(marksMap)
      }
    } catch (err) {
      console.error('Failed to fetch marks:', err)
    } finally {
      setMarksLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    if (activeTab === 'assessments') fetchAssessments()
  }, [activeTab, fetchAssessments])

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCreateAssessment = async () => {
    if (!createForm.name || !createForm.subjectId) return
    try {
      setCreating(true)
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          subjectId: createForm.subjectId,
          classId: createForm.classId || null,
          assessmentType: createForm.assessmentType,
          totalMarks: parseFloat(createForm.totalMarks) || 100,
          weight: parseFloat(createForm.weight) || 1,
          date: createForm.date || null,
        }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({ name: '', subjectId: '', classId: '', assessmentType: 'TEST', totalMarks: '100', weight: '1', date: '' })
        fetchOverview()
        if (activeTab === 'assessments') fetchAssessments()
      } else {
        const error = await res.json()
        console.error('Create assessment error:', error)
      }
    } catch (err) {
      console.error('Failed to create assessment:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleSaveMarks = async () => {
    if (!selectedAssessment) return
    try {
      setMarksSaving(true)
      const marksToSave = Object.entries(editedMarks)
        .filter(([, marks]) => marks !== undefined && marks !== null)
        .map(([studentId, marks]) => ({
          studentId,
          marksObtained: marks,
        }))

      if (marksToSave.length === 0) return

      const res = await fetch(`/api/assessments/${selectedAssessment.id}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks: marksToSave }),
      })

      if (res.ok) {
        // Refresh marks
        fetchMarks(selectedAssessment.id)
      }
    } catch (err) {
      console.error('Failed to save marks:', err)
    } finally {
      setMarksSaving(false)
    }
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

  // ─── Marks Entry Sub-view ─────────────────────────────────────────────

  if (selectedAssessment) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => {
              setSelectedAssessment(null)
              setClassStudents([])
              setEditedMarks({})
            }}
          >
            <ChevronLeft className="h-4 w-4" /> Back to Assessments
          </Button>
        </div>

        <Card className="border-0 shadow-md overflow-hidden">
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
                <ScrollArea className="max-h-[60vh]">
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
                </ScrollArea>
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
      </motion.div>
    )
  }

  // ─── Main Render ───────────────────────────────────────────────────────

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
          <h1 className="text-2xl font-bold tracking-tight">Academics</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage grades, subjects, assessments and marks</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Assessment</DialogTitle>
                <DialogDescription>Add a new test, exam, or assignment for a class</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[65vh]">
                <div className="grid gap-4 py-4 pr-4">
                  <div className="grid gap-2">
                    <Label>Assessment Name *</Label>
                    <Input
                      placeholder="e.g. Term 1 Mathematics Test"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAssessment}
                  disabled={creating || !createForm.name || !createForm.subjectId}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Assessment
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
          <TabsTrigger value="grades" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Grades & Classes
          </TabsTrigger>
          <TabsTrigger value="subjects" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Subjects
          </TabsTrigger>
          <TabsTrigger value="assessments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Assessments
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Settings className="h-3.5 w-3.5 mr-1" />
            Settings
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Grades</p>
                    <p className="text-2xl font-bold tracking-tight">{overview?.grades.length || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Active levels</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Classes</p>
                    <p className="text-2xl font-bold tracking-tight">{overview?.classes.length || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">All streams</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Users className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Subjects</p>
                    <p className="text-2xl font-bold tracking-tight">{overview?.totalSubjects || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">{overview?.coreSubjects || 0} core</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Assessments</p>
                    <p className="text-2xl font-bold tracking-tight">{activeAssessmentsCount}</p>
                    <div className="flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-orange-600" />
                      <span className="text-xs font-medium text-orange-600">Open for entry</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                    <FileCheck className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 to-red-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Grade Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Grade Distribution</CardTitle>
                <CardDescription>Students per grade level</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Subject Coverage */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Subject Coverage</CardTitle>
                <CardDescription>Core vs Optional vs Practical breakdown</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Recent Assessments */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Assessments</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                  onClick={() => setActiveTab('assessments')}
                >
                  View All <ChevronLeft className="ml-1 h-3 w-3 rotate-180" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(overview?.recentAssessments || []).length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
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
                        <TableRow key={a.id} className="hover:bg-muted/30 cursor-pointer">
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
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No assessments yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first assessment to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                  <Card key={grade.id} className="border-0 shadow-md overflow-hidden">
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
                                    className="rounded-xl border p-4 hover:shadow-md transition-all hover:border-emerald-200 bg-white"
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
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search subjects..."
                    className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:bg-white"
                  />
                </div>
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
              </div>
            </CardContent>
          </Card>

          {/* Subjects Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[60vh]">
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
                    {filteredSubjects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No subjects found matching filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Assessments Tab ──────────────────────────────────────────── */}
        <TabsContent value="assessments" className="space-y-4">
          {/* Filter */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
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
                <div className="text-sm text-muted-foreground">
                  {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessments Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {assessmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-muted-foreground">Loading assessments...</span>
                </div>
              ) : assessments.length > 0 ? (
                <ScrollArea className="max-h-[60vh]">
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
                          onClick={() => fetchMarks(assessment.id)}
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
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No assessments found</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first assessment to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Settings Tab ─────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-4">
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Academics Module Settings</h3>
              <p className="text-sm text-muted-foreground">Configure grading, assessments, and reporting preferences</p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Grading Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Grading Scale</Label>
                    <p className="text-xs text-muted-foreground">Select the grading scale for assessments</p>
                  </div>
                  <Select value={academicsSettings.gradingScale} onValueChange={(v) => setAcademicsSettings((s) => ({ ...s, gradingScale: v }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZIMSEC">ZIMSEC (A-U)</SelectItem>
                      <SelectItem value="CAMBRIDGE">Cambridge (A-G)</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Pass Mark (%)</Label>
                    <p className="text-xs text-muted-foreground">Minimum percentage to pass a subject</p>
                  </div>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={academicsSettings.passMark}
                      onChange={(e) => setAcademicsSettings((s) => ({ ...s, passMark: e.target.value }))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Assessment Weightings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Test Weight (%)</Label>
                    <p className="text-xs text-muted-foreground">Weight of tests in final grade</p>
                  </div>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={academicsSettings.testWeight}
                      onChange={(e) => setAcademicsSettings((s) => ({ ...s, testWeight: e.target.value }))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Exam Weight (%)</Label>
                    <p className="text-xs text-muted-foreground">Weight of exams in final grade</p>
                  </div>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={academicsSettings.examWeight}
                      onChange={(e) => setAcademicsSettings((s) => ({ ...s, examWeight: e.target.value }))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Assignment Weight (%)</Label>
                    <p className="text-xs text-muted-foreground">Weight of assignments in final grade</p>
                  </div>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={academicsSettings.assignmentWeight}
                      onChange={(e) => setAcademicsSettings((s) => ({ ...s, assignmentWeight: e.target.value }))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Advanced Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Auto-Calculate Grades</Label>
                    <p className="text-xs text-muted-foreground">Automatically compute grades from entered marks</p>
                  </div>
                  <Switch checked={academicsSettings.autoCalculateGrades} onCheckedChange={(v) => setAcademicsSettings((s) => ({ ...s, autoCalculateGrades: v }))} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Show Class Rank</Label>
                    <p className="text-xs text-muted-foreground">Display student rank position in report cards</p>
                  </div>
                  <Switch checked={academicsSettings.showClassRank} onCheckedChange={(v) => setAcademicsSettings((s) => ({ ...s, showClassRank: v }))} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                onClick={() => toast.success('Settings saved', { description: 'Academics module settings have been updated' })}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
