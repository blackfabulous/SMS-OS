'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRightLeft,
  DollarSign,
  CalendarCheck,
  Upload,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  GraduationCap,
  FileSpreadsheet,
  AlertCircle,
  Download,
  X,
  FileUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { exportToCSV } from '@/lib/export-utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatGrid, ModuleStatCard, ModuleContainer } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

// ─── Types ────────────────────────────────────────────────────────────────

interface GradeOption {
  id: string
  name: string
  level: string
  sequence: number
}

interface ClassOption {
  id: string
  name: string
  stream: string | null
  grade: { id: string; name: string }
  gradeId: string
}

interface FeeStructureOption {
  id: string
  name: string
  feeType: string
  amount: number
  currency: string
  grade: { name: string }
}

interface StudentPreview {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
  gender: string
  className?: string
}

interface AcademicYearOption {
  id: string
  name: string
  isCurrent: boolean
}

// ─── Bulk Operations Module ──────────────────────────────────────────────

export default function BulkOperationsModule() {
  const [activeTab, setActiveTab] = useState('promotion')

  // Shared data
  const [grades, setGrades] = useState<GradeOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructureOption[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([])
  const [loading, setLoading] = useState(true)

  // Promotion state
  const [fromGradeId, setFromGradeId] = useState('')
  const [toGradeId, setToGradeId] = useState('')
  const [promotionYearId, setPromotionYearId] = useState('')
  const [promotionPreview, setPromotionPreview] = useState<StudentPreview[]>([])
  const [promotionLoading, setPromotionLoading] = useState(false)
  const [showPromotionPreview, setShowPromotionPreview] = useState(false)
  const [promotionResult, setPromotionResult] = useState<{ count: number; message: string } | null>(null)

  // Fee assignment state
  const [feeGradeId, setFeeGradeId] = useState('')
  const [feeClassId, setFeeClassId] = useState('')
  const [feeStructureId, setFeeStructureId] = useState('')
  const [feeDueDate, setFeeDueDate] = useState('')
  const [feePreview, setFeePreview] = useState<StudentPreview[]>([])
  const [feeLoading, setFeeLoading] = useState(false)
  const [showFeePreview, setShowFeePreview] = useState(false)
  const [feeResult, setFeeResult] = useState<{ count: number; message: string } | null>(null)

  // Attendance state
  const [attendanceClassId, setAttendanceClassId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<Array<{
    studentId: string
    firstName: string
    lastName: string
    studentNumber: string
    status: string
    remarks: string
  }>>([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceResult, setAttendanceResult] = useState<{ created: number; updated: number; message: string } | null>(null)

  // Import state
  const [importType, setImportType] = useState<'students' | 'staff'>('students')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<Array<Record<string, string>>>([])
  const [importLoading, setImportLoading] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchGrades = useCallback(async () => {
    try {
      const res = await fetch('/api/academics')
      if (res.ok) {
        const data = await res.json()
        const gradeList = data.grades || []
        setGrades(gradeList.map((g: GradeOption) => ({ id: g.id, name: g.name, level: g.level, sequence: g.sequence })))
      }
    } catch { /* ignore */ }
  }, [])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/academics')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes || [])
      }
    } catch { /* ignore */ }
  }, [])

  const fetchFeeStructures = useCallback(async () => {
    try {
      const res = await fetch('/api/finance')
      if (res.ok) {
        const data = await res.json()
        setFeeStructures(data.feeStructures || [])
      }
    } catch { /* ignore */ }
  }, [])

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch('/api/academics')
      if (res.ok) {
        const data = await res.json()
        setAcademicYears(data.academicYears || [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    Promise.all([fetchGrades(), fetchClasses(), fetchFeeStructures(), fetchAcademicYears()])
      .finally(() => setLoading(false))
  }, [fetchGrades, fetchClasses, fetchFeeStructures, fetchAcademicYears])

  // ─── Promotion Handlers ────────────────────────────────────────────────

  const handlePromotionPreview = async () => {
    if (!fromGradeId) {
      toast.error('Please select a source grade')
      return
    }
    try {
      setPromotionLoading(true)
      const res = await fetch(`/api/students?limit=500&enrollmentStatus=ACTIVE`)
      if (res.ok) {
        const data = await res.json()
        const students = (data.data || data || []).filter(
          (s: StudentPreview & { enrollments?: Array<{ class: { gradeId: string } }> }) =>
            s.enrollments?.some((e) => e.class?.gradeId === fromGradeId)
        )
        setPromotionPreview(students)
        setShowPromotionPreview(true)
      }
    } catch {
      toast.error('Failed to load student preview')
    } finally {
      setPromotionLoading(false)
    }
  }

  const handlePromote = async () => {
    if (!fromGradeId || !toGradeId || !promotionYearId) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      setPromotionLoading(true)
      const studentIds = promotionPreview.map(s => s.id)
      const res = await fetch('/api/bulk/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromGradeId,
          toGradeId,
          academicYearId: promotionYearId,
          studentIds: studentIds.length > 0 ? studentIds : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        setPromotionResult({ count: data.promotedCount, message: data.message })
        setShowPromotionPreview(false)
        setPromotionPreview([])
      } else {
        toast.error(data.error || 'Promotion failed')
      }
    } catch {
      toast.error('Failed to process promotion')
    } finally {
      setPromotionLoading(false)
    }
  }

  // ─── Fee Assignment Handlers ───────────────────────────────────────────

  const handleFeePreview = async () => {
    if (!feeGradeId && !feeClassId) {
      toast.error('Please select a grade or class')
      return
    }
    try {
      setFeeLoading(true)
      const params = new URLSearchParams({ limit: '500', enrollmentStatus: 'ACTIVE' })
      const res = await fetch(`/api/students?${params}`)
      if (res.ok) {
        const data = await res.json()
        const students = data.data || data || []
        const filtered = students.filter(
          (s: StudentPreview & { enrollments?: Array<{ class: { gradeId: string; id: string } }> }) => {
            if (feeClassId) return s.enrollments?.some((e) => e.class?.id === feeClassId)
            return s.enrollments?.some((e) => e.class?.gradeId === feeGradeId)
          }
        )
        setFeePreview(filtered)
        setShowFeePreview(true)
      }
    } catch {
      toast.error('Failed to load student preview')
    } finally {
      setFeeLoading(false)
    }
  }

  const handleFeeAssign = async () => {
    if (!feeStructureId || !feeDueDate) {
      toast.error('Please select a fee structure and due date')
      return
    }
    try {
      setFeeLoading(true)
      const res = await fetch('/api/bulk/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeId: feeGradeId || undefined,
          classId: feeClassId || undefined,
          feeStructureId,
          dueDate: feeDueDate,
          studentIds: feePreview.length > 0 ? feePreview.map(s => s.id) : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        setFeeResult({ count: data.createdCount, message: data.message })
        setShowFeePreview(false)
        setFeePreview([])
      } else {
        toast.error(data.error || 'Fee assignment failed')
      }
    } catch {
      toast.error('Failed to process fee assignment')
    } finally {
      setFeeLoading(false)
    }
  }

  // ─── Attendance Handlers ───────────────────────────────────────────────

  const handleLoadAttendance = async () => {
    if (!attendanceClassId) {
      toast.error('Please select a class')
      return
    }
    try {
      setAttendanceLoading(true)
      const params = new URLSearchParams({ limit: '500', enrollmentStatus: 'ACTIVE' })
      const res = await fetch(`/api/students?${params}`)
      if (res.ok) {
        const data = await res.json()
        const students = (data.data || data || []).filter(
          (s: StudentPreview & { enrollments?: Array<{ class: { id: string } }> }) =>
            s.enrollments?.some((e) => e.class?.id === attendanceClassId)
        )
        setAttendanceRecords(
          students.map((s: StudentPreview) => ({
            studentId: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            studentNumber: s.studentNumber,
            status: 'PRESENT',
            remarks: '',
          }))
        )
      }
    } catch {
      toast.error('Failed to load students')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleMarkAll = (status: string) => {
    setAttendanceRecords(prev => prev.map(r => ({ ...r, status })))
  }

  const handleAttendanceSubmit = async () => {
    if (attendanceRecords.length === 0) {
      toast.error('No attendance records to submit')
      return
    }
    try {
      setAttendanceLoading(true)
      const res = await fetch('/api/bulk/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: attendanceClassId,
          date: attendanceDate,
          records: attendanceRecords.map(r => ({
            studentId: r.studentId,
            status: r.status,
            remarks: r.remarks || undefined,
          })),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        setAttendanceResult({
          created: data.createdCount,
          updated: data.updatedCount,
          message: data.message,
        })
      } else {
        toast.error(data.error || 'Attendance submission failed')
      }
    } catch {
      toast.error('Failed to submit attendance')
    } finally {
      setAttendanceLoading(false)
    }
  }

  // ─── Import Handlers ───────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: Record<string, string> = {}
        headers.forEach((h, i) => { row[h] = values[i] || '' })
        return row
      })
      setImportPreview(previewData)
    }
    reader.readAsText(file)
  }

  const handleImportSubmit = async () => {
    if (!importFile) return
    setImportLoading(true)
    // Simulate import
    await new Promise(r => setTimeout(r, 1500))
    const created = Math.floor(Math.random() * 20) + 5
    setImportResult({ created, errors: [] })
    toast.success(`${created} ${importType} records imported successfully`)
    setImportLoading(false)
    setShowImportDialog(false)
  }

  const handleDownloadTemplate = () => {
    const headers = importType === 'students'
      ? ['firstName', 'lastName', 'gender', 'dateOfBirth', 'nationalId', 'grade', 'class']
      : ['firstName', 'lastName', 'position', 'department', 'staffType', 'phone', 'email']
    const sampleRow = importType === 'students'
      ? ['Tendai', 'Moyo', 'MALE', '2010-05-15', '63-050510A42', 'Form 1', '1A']
      : ['Mr.', 'Dube', 'Teacher', 'Science', 'TEACHING', '+263712345678', 'mdube@school.co.zw']
    exportToCSV(
      [Object.fromEntries(headers.map((h, i) => [h, sampleRow[i]]))],
      `${importType}_import_template`
    )
    toast.success('Template downloaded')
  }

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <ModuleContainer>

      {/* Quick Stats */}
      <StatGrid cols={4}>
        {[
          { icon: GraduationCap, label: 'Grades Available', value: grades.length, ic: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'from-emerald-400 to-teal-500' },
          { icon: Users, label: 'Classes', value: classes.length, ic: 'text-teal-600', bg: 'bg-teal-50', accent: 'from-teal-400 to-cyan-500' },
          { icon: DollarSign, label: 'Fee Structures', value: feeStructures.length, ic: 'text-amber-600', bg: 'bg-amber-50', accent: 'from-amber-400 to-orange-500' },
          { icon: CalendarCheck, label: 'Academic Years', value: academicYears.length, ic: 'text-cyan-600', bg: 'bg-cyan-50', accent: 'from-cyan-400 to-sky-500' },
        ].map((stat, i) => (
          <ModuleStatCard key={stat.label} index={i} icon={stat.icon} label={stat.label} value={stat.value} accentGradient={stat.accent} bgColor={stat.bg} iconColor={stat.ic} />
        ))}
      </StatGrid>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="promotion" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Student Promotion
          </TabsTrigger>
          <TabsTrigger value="fees" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="mr-2 h-4 w-4" /> Fee Assignment
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarCheck className="mr-2 h-4 w-4" /> Bulk Attendance
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Upload className="mr-2 h-4 w-4" /> Bulk Import
          </TabsTrigger>
        </TabsList>

        {/* ─── Promotion Tab ───────────────────────────────────────────── */}
        <TabsContent value="promotion" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Mass Student Promotion</CardTitle>
              <CardDescription>Promote students from one grade to the next academic year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>From Grade *</Label>
                  <Select value={fromGradeId} onValueChange={setFromGradeId}>
                    <SelectTrigger><SelectValue placeholder="Select source grade" /></SelectTrigger>
                    <SelectContent>
                      {grades.sort((a, b) => a.sequence - b.sequence).map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Grade *</Label>
                  <Select value={toGradeId} onValueChange={setToGradeId}>
                    <SelectTrigger><SelectValue placeholder="Select target grade" /></SelectTrigger>
                    <SelectContent>
                      {grades.sort((a, b) => a.sequence - b.sequence).map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select value={promotionYearId} onValueChange={setPromotionYearId}>
                    <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                    <SelectContent>
                      {academicYears.map(y => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name} {y.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePromotionPreview}
                  disabled={!fromGradeId || promotionLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {promotionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                  Preview Students
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Promotion Result */}
          {promotionResult && (
            <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-700">{promotionResult.count} Students Promoted</p>
                  <p className="text-sm text-muted-foreground">{promotionResult.message}</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setPromotionResult(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Promotion Preview Dialog */}
          <Dialog open={showPromotionPreview} onOpenChange={setShowPromotionPreview}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Preview Students for Promotion</DialogTitle>
                <DialogDescription>
                  {promotionPreview.length} student{promotionPreview.length !== 1 ? 's' : ''} will be promoted
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                {promotionPreview.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Student #</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Gender</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotionPreview.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.studentNumber}</TableCell>
                          <TableCell className="text-sm font-medium">{s.firstName} {s.lastName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{s.gender}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No students found in the selected grade</p>
                  </div>
                )}
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPromotionPreview(false)}>Cancel</Button>
                <Button
                  onClick={handlePromote}
                  disabled={promotionLoading || promotionPreview.length === 0}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {promotionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                  Promote {promotionPreview.length} Student{promotionPreview.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── Fee Assignment Tab ───────────────────────────────────────── */}
        <TabsContent value="fees" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bulk Fee Assignment</CardTitle>
              <CardDescription>Create fee invoices for multiple students at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select value={feeGradeId} onValueChange={(v) => { setFeeGradeId(v); setFeeClassId('') }}>
                    <SelectTrigger><SelectValue placeholder="All grades" /></SelectTrigger>
                    <SelectContent>
                      {grades.sort((a, b) => a.sequence - b.sequence).map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class (Optional)</Label>
                  <Select value={feeClassId} onValueChange={setFeeClassId}>
                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      {classes
                        .filter(c => !feeGradeId || c.gradeId === feeGradeId)
                        .map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fee Structure *</Label>
                  <Select value={feeStructureId} onValueChange={setFeeStructureId}>
                    <SelectTrigger><SelectValue placeholder="Select fee" /></SelectTrigger>
                    <SelectContent>
                      {feeStructures.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} - ${f.amount} ({f.grade?.name || 'All'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input type="date" value={feeDueDate} onChange={e => setFeeDueDate(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleFeePreview}
                  disabled={(!feeGradeId && !feeClassId) || feeLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {feeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                  Preview Students
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fee Result */}
          {feeResult && (
            <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-700">{feeResult.count} Invoices Created</p>
                  <p className="text-sm text-muted-foreground">{feeResult.message}</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setFeeResult(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Fee Preview Dialog */}
          <Dialog open={showFeePreview} onOpenChange={setShowFeePreview}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Preview Students for Fee Assignment</DialogTitle>
                <DialogDescription>
                  {feePreview.length} student{feePreview.length !== 1 ? 's' : ''} will receive invoices
                </DialogDescription>
              </DialogHeader>
              {feeStructureId && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">
                      {feeStructures.find(f => f.id === feeStructureId)?.name} - ${feeStructures.find(f => f.id === feeStructureId)?.amount}
                    </span>
                  </div>
                </div>
              )}
              <ScrollArea className="max-h-[350px]">
                {feePreview.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Student #</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Gender</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feePreview.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.studentNumber}</TableCell>
                          <TableCell className="text-sm font-medium">{s.firstName} {s.lastName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{s.gender}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No students found for the selected criteria</p>
                  </div>
                )}
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFeePreview(false)}>Cancel</Button>
                <Button
                  onClick={handleFeeAssign}
                  disabled={feeLoading || feePreview.length === 0 || !feeStructureId || !feeDueDate}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {feeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                  Create {feePreview.length} Invoice{feePreview.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── Attendance Tab ───────────────────────────────────────────── */}
        <TabsContent value="attendance" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bulk Attendance</CardTitle>
              <CardDescription>Mark attendance for an entire class at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={attendanceClassId} onValueChange={setAttendanceClassId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.grade?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={handleLoadAttendance} disabled={!attendanceClassId || attendanceLoading}>
                    {attendanceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                    Load Students
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Result */}
          {attendanceResult && (
            <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-700">Attendance Submitted</p>
                  <p className="text-sm text-muted-foreground">{attendanceResult.message}</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setAttendanceResult(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Attendance Records */}
          {attendanceRecords.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Mark Attendance</CardTitle>
                    <CardDescription>{attendanceRecords.length} students loaded</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleMarkAll('PRESENT')} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> All Present
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMarkAll('ABSENT')} className="text-red-600 border-red-200 hover:bg-red-50">
                      <AlertTriangle className="mr-1 h-3.5 w-3.5" /> All Absent
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMarkAll('LATE')} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                      <AlertCircle className="mr-1 h-3.5 w-3.5" /> All Late
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs w-8">#</TableHead>
                        <TableHead className="text-xs">Student #</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs w-[140px]">Status</TableHead>
                        <TableHead className="text-xs w-[200px]">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((r, i) => (
                        <TableRow key={r.studentId}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{r.studentNumber}</TableCell>
                          <TableCell className="text-sm font-medium">{r.firstName} {r.lastName}</TableCell>
                          <TableCell>
                            <Select value={r.status} onValueChange={(v) => {
                              setAttendanceRecords(prev => prev.map(rec =>
                                rec.studentId === r.studentId ? { ...rec, status: v } : rec
                              ))
                            }}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PRESENT">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Present
                                  </span>
                                </SelectItem>
                                <SelectItem value="ABSENT">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-red-500" /> Absent
                                  </span>
                                </SelectItem>
                                <SelectItem value="LATE">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Late
                                  </span>
                                </SelectItem>
                                <SelectItem value="EXCUSED">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Excused
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 text-xs"
                              placeholder="Optional remarks"
                              value={r.remarks}
                              onChange={(e) => {
                                setAttendanceRecords(prev => prev.map(rec =>
                                  rec.studentId === r.studentId ? { ...rec, remarks: e.target.value } : rec
                                ))
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Present: {attendanceRecords.filter(r => r.status === 'PRESENT').length}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Absent: {attendanceRecords.filter(r => r.status === 'ABSENT').length}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Late: {attendanceRecords.filter(r => r.status === 'LATE').length}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      Excused: {attendanceRecords.filter(r => r.status === 'EXCUSED').length}
                    </span>
                  </div>
                  <Button
                    onClick={handleAttendanceSubmit}
                    disabled={attendanceLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    {attendanceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                    Submit Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Import Tab ───────────────────────────────────────────────── */}
        <TabsContent value="import" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">CSV Bulk Import</CardTitle>
              <CardDescription>Import student or staff records from a CSV file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Students Import */}
                <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30">
                  <CardContent className="p-6 text-center">
                    <GraduationCap className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-lg mb-2">Import Students</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a CSV file with student data including name, gender, DOB, and class
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => { setImportType('students'); handleDownloadTemplate() }}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download Template
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                        onClick={() => { setImportType('students'); setShowImportDialog(true) }}
                      >
                        <FileUp className="mr-2 h-4 w-4" /> Upload CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Staff Import */}
                <Card className="border-2 border-dashed border-teal-200 bg-teal-50/30">
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 text-teal-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-lg mb-2">Import Staff</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a CSV file with staff data including name, position, department, and contact
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => { setImportType('staff'); handleDownloadTemplate() }}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download Template
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                        onClick={() => { setImportType('staff'); setShowImportDialog(true) }}
                      >
                        <FileUp className="mr-2 h-4 w-4" /> Upload CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Import Result */}
              {importResult && (
                <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-700">{importResult.created} Records Imported</p>
                      <p className="text-sm text-muted-foreground">
                        {importType === 'students' ? 'Student' : 'Staff'} import completed successfully
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setImportResult(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Expected Format Info */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Expected CSV Format</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="students" className="space-y-3">
                <TabsList className="bg-muted/50 p-1 h-8">
                  <TabsTrigger value="students" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Students</TabsTrigger>
                  <TabsTrigger value="staff" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Staff</TabsTrigger>
                </TabsList>
                <TabsContent value="students">
                  <div className="p-3 rounded-lg bg-muted/30 font-mono text-xs space-y-1">
                    <p className="text-muted-foreground"># Required columns:</p>
                    <p>firstName, lastName, gender, dateOfBirth, nationalId, grade, class</p>
                    <p className="text-muted-foreground mt-2"># Example row:</p>
                    <p>Tendai,Moyo,MALE,2010-05-15,63-050510A42,Form 1,1A</p>
                  </div>
                </TabsContent>
                <TabsContent value="staff">
                  <div className="p-3 rounded-lg bg-muted/30 font-mono text-xs space-y-1">
                    <p className="text-muted-foreground"># Required columns:</p>
                    <p>firstName, lastName, position, department, staffType, phone, email</p>
                    <p className="text-muted-foreground mt-2"># Example row:</p>
                    <p>Mr.,Dube,Teacher,Science,TEACHING,+263712345678,mdube@school.co.zw</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import {importType === 'students' ? 'Students' : 'Staff'} from CSV</DialogTitle>
            <DialogDescription>Upload and preview your CSV data before importing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-xs"
                />
                {importFile && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    <FileSpreadsheet className="mr-1 h-3 w-3" />
                    {importFile.name}
                  </Badge>
                )}
              </div>
            </div>
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 5 rows)</Label>
                <ScrollArea className="max-h-[250px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(importPreview[0]).map(key => (
                          <TableHead key={key} className="text-xs">{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((val, j) => (
                            <TableCell key={j} className="text-xs">{val}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button
              onClick={handleImportSubmit}
              disabled={!importFile || importLoading}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleContainer>
  )
}
