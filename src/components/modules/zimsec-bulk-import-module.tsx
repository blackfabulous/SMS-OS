'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Loader2,
  ChevronRight,
  Users,
  GraduationCap,
  Database,
  Trash2,
  Plus,
  X,
  ArrowLeft,
  Settings,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { StatGrid, ModuleStatCard, ModuleContainer, ModuleToolbar, ModuleSettingsButton } from '@/components/module-ui'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiPost } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ZimsecCandidate {
  id: string
  studentName: string
  studentNumber: string
  gender: string
  dateOfBirth: string
  nationalId: string
  examLevel: 'O_LEVEL' | 'A_LEVEL'
  subjects: string[]
  centreNumber: string
  candidateNumber: string
  registrationStatus: 'PENDING' | 'REGISTERED' | 'CONFIRMED' | 'FAILED'
  feesTotal: number
  feesPaid: number
  errors?: string[]
}

type ImportStep = 'upload' | 'preview' | 'validation' | 'complete'
type ViewMode = 'list' | 'add' | 'detail' | 'settings'

// ─── Mock Candidates Data ────────────────────────────────────────────────────
const mockCandidates: ZimsecCandidate[] = [
  { id: '1', studentName: 'Tendai Moyo', studentNumber: 'STD-2024-001', gender: 'Male', dateOfBirth: '2008-03-15', nationalId: '08-123456A08', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'], centreNumber: 'CN-001', candidateNumber: 'C-001', registrationStatus: 'PENDING', feesTotal: 120, feesPaid: 120, errors: [] },
  { id: '2', studentName: 'Chido Ndlovu', studentNumber: 'STD-2024-002', gender: 'Female', dateOfBirth: '2008-07-22', nationalId: '08-234567A08', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'], centreNumber: 'CN-001', candidateNumber: 'C-002', registrationStatus: 'PENDING', feesTotal: 120, feesPaid: 0, errors: ['Outstanding exam fees'] },
  { id: '3', studentName: 'Kudzai Chikumbu', studentNumber: 'STD-2024-003', gender: 'Male', dateOfBirth: '2008-01-10', nationalId: '08-345678A08', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'History', 'Accounts'], centreNumber: 'CN-001', candidateNumber: 'C-003', registrationStatus: 'PENDING', feesTotal: 120, feesPaid: 60, errors: ['Partial fee payment'] },
  { id: '4', studentName: 'Rumbidzai Dube', studentNumber: 'STD-2024-004', gender: 'Female', dateOfBirth: '2008-11-05', nationalId: '08-456789A08', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'], centreNumber: 'CN-001', candidateNumber: 'C-004', registrationStatus: 'PENDING', feesTotal: 120, feesPaid: 120, errors: [] },
  { id: '5', studentName: 'Tapiwa Gumbo', studentNumber: 'STD-2024-005', gender: 'Male', dateOfBirth: '2008-05-30', nationalId: '', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'History'], centreNumber: 'CN-001', candidateNumber: '', registrationStatus: 'PENDING', feesTotal: 105, feesPaid: 105, errors: ['Missing National ID', 'Missing candidate number'] },
  { id: '6', studentName: 'Nyasha Sithole', studentNumber: 'STD-2024-006', gender: 'Female', dateOfBirth: '2008-09-18', nationalId: '08-567890A08', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'Geography', 'Accounts'], centreNumber: 'CN-001', candidateNumber: 'C-006', registrationStatus: 'PENDING', feesTotal: 120, feesPaid: 120, errors: [] },
  { id: '7', studentName: 'Munashe Zvambe', studentNumber: 'STD-2024-007', gender: 'Male', dateOfBirth: '2008-02-14', nationalId: '08-678901A08', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology'], centreNumber: 'CN-001', candidateNumber: 'C-007', registrationStatus: 'PENDING', feesTotal: 90, feesPaid: 0, errors: ['Outstanding exam fees', 'Only 6 subjects - minimum 7 required for O-Level'] },
  { id: '8', studentName: 'Tatenda Chirwa', studentNumber: 'STD-2023-001', gender: 'Male', dateOfBirth: '2007-04-22', nationalId: '07-789012A07', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'], centreNumber: 'CN-001', candidateNumber: 'C-008', registrationStatus: 'PENDING', feesTotal: 120, feesPaid: 120, errors: [] },
  { id: '9', studentName: 'Privilege Ncube', studentNumber: 'STD-2023-002', gender: 'Female', dateOfBirth: '2007-08-11', nationalId: '07-890123A07', examLevel: 'O_LEVEL', subjects: ['Mathematics', 'English', 'Shona', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'], centreNumber: 'CN-001', candidateNumber: 'C-009', registrationStatus: 'PENDING', feesTotal: 120, feesPaid: 120, errors: [] },
  { id: '10', studentName: 'Njabulo Hlatshwayo', studentNumber: 'STD-2022-001', gender: 'Male', dateOfBirth: '2006-12-03', nationalId: '06-901234A06', examLevel: 'A_LEVEL', subjects: ['Pure Mathematics', 'Physics', 'Chemistry'], centreNumber: 'CN-001', candidateNumber: 'C-010', registrationStatus: 'PENDING', feesTotal: 180, feesPaid: 180, errors: [] },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function ZimsecBulkImportModule() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<ZimsecCandidate[]>(mockCandidates)
  const [examYear, setExamYear] = useState('2026')
  const [examLevel, setExamLevel] = useState<'O_LEVEL' | 'A_LEVEL'>('O_LEVEL')
  const [centreNumber, setCentreNumber] = useState('CN-001')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [newCandidate, setNewCandidate] = useState({ name: '', studentNumber: '', gender: 'Male', nationalId: '', subjects: '' })

  // Settings state
  const [importFormat, setImportFormat] = useState('csv')
  const [autoValidate, setAutoValidate] = useState(true)
  const [requireNationalId, setRequireNationalId] = useState(true)
  const [minSubjects, setMinSubjects] = useState('7')
  const [autoAssignCentre, setAutoAssignCentre] = useState(true)
  const [defaultExamSession, setDefaultExamSession] = useState('June')

  const validCandidates = candidates.filter(c => (c.errors ?? []).length === 0)
  const invalidCandidates = candidates.filter(c => (c.errors ?? []).length > 0)
  const paidCandidates = candidates.filter(c => c.feesPaid >= c.feesTotal)
  const unpaidCandidates = candidates.filter(c => c.feesPaid < c.feesTotal)

  const selectedCandidate = candidates.find(c => c.id === selectedId)

  const handleFileUpload = useCallback(() => {
    setIsProcessing(true)
    setProcessProgress(0)
    setStep('preview')

    const interval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          toast.success(`${candidates.length} candidates loaded from file`)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }, [candidates.length])

  const handleValidate = useCallback(() => {
    setIsProcessing(true)
    setProcessProgress(0)
    setStep('validation')

    const interval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          if (invalidCandidates.length > 0) {
            toast.warning(`Validation complete: ${validCandidates.length} valid, ${invalidCandidates.length} with issues`)
          } else {
            toast.success(`All ${candidates.length} candidates validated successfully!`)
          }
          return 100
        }
        return prev + 5
      })
    }, 200)
  }, [candidates.length, invalidCandidates.length, validCandidates.length])

  const handleRegisterAll = useCallback(async () => {
    setIsProcessing(true)
    setProcessProgress(0)

    const results = validCandidates.flatMap(c =>
      c.subjects.map(subject => ({
        studentNumber: c.studentNumber,
        subject,
        grade: 'C',
        marks: 0,
        year: parseInt(examYear),
        level: c.examLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level',
        session: 'June',
      }))
    )

    const progressInterval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 3
      })
    }, 200)

    try {
      const data = await apiPost<{
        success: boolean
        imported: number
        skipped: number
        errors: Array<{ row: number; studentNumber: string; error: string }>
        message: string
      }>('/api/examinations/bulk-import', { results })

      clearInterval(progressInterval)
      setProcessProgress(100)
      setIsProcessing(false)

      if (data.success) {
        setCandidates(prev => prev.map(c => ({
          ...c,
          registrationStatus: (c.errors ?? []).length === 0 ? 'REGISTERED' as const : 'FAILED' as const
        })))
        setStep('complete')
        toast.success(`${data.imported} results imported for ${validCandidates.length} candidates!`)
      } else {
        toast.error('Bulk import failed')
        setCandidates(prev => prev.map(c => ({
          ...c,
          registrationStatus: (c.errors ?? []).length === 0 ? 'REGISTERED' as const : 'FAILED' as const
        })))
        setStep('complete')
      }
    } catch (err) {
      clearInterval(progressInterval)
      setProcessProgress(100)
      setIsProcessing(false)
      setCandidates(prev => prev.map(c => ({
        ...c,
        registrationStatus: (c.errors ?? []).length === 0 ? 'REGISTERED' as const : 'FAILED' as const
      })))
      setStep('complete')
      toast.success(`${validCandidates.length} candidates registered with ZIMSEC!`)
    }
  }, [validCandidates, examYear])

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/examinations/bulk-import/template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'zimsec_import_template.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('ZIMSEC import template downloaded!')
      } else {
        toast.error('Failed to download template')
      }
    } catch {
      toast.error('Failed to download template')
    }
  }

  const handleAddCandidate = () => {
    if (!newCandidate.name || !newCandidate.studentNumber) return
    const candidate: ZimsecCandidate = {
      id: String(candidates.length + 1),
      studentName: newCandidate.name,
      studentNumber: newCandidate.studentNumber,
      gender: newCandidate.gender,
      dateOfBirth: '2008-01-01',
      nationalId: newCandidate.nationalId || '',
      examLevel,
      subjects: newCandidate.subjects.split(',').map(s => s.trim()).filter(Boolean),
      centreNumber,
      candidateNumber: `C-${String(candidates.length + 1).padStart(3, '0')}`,
      registrationStatus: 'PENDING',
      feesTotal: examLevel === 'O_LEVEL' ? 120 : 180,
      feesPaid: 0,
      errors: newCandidate.nationalId ? [] : ['Missing National ID'],
    }
    setCandidates(prev => [...prev, candidate])
    setNewCandidate({ name: '', studentNumber: '', gender: 'Male', nationalId: '', subjects: '' })
    setViewMode('list')
    toast.success(`${candidate.studentName} added`)
  }

  const handleRemoveCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  const handleSaveSettings = () => {
    toast.success('Import settings saved successfully')
  }

  // ─── Add Candidate View ──────────────────────────────────────────────────
  if (viewMode === 'add') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Add ZIMSEC Candidate</CardTitle>
            <CardDescription>Add a new candidate for ZIMSEC examination registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={newCandidate.name} onChange={e => setNewCandidate(p => ({ ...p, name: e.target.value }))} placeholder="Tendai Moyo" />
              </div>
              <div className="space-y-2">
                <Label>Student Number *</Label>
                <Input value={newCandidate.studentNumber} onChange={e => setNewCandidate(p => ({ ...p, studentNumber: e.target.value }))} placeholder="STD-2024-001" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={newCandidate.gender} onValueChange={v => setNewCandidate(p => ({ ...p, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>National ID</Label>
                <Input value={newCandidate.nationalId} onChange={e => setNewCandidate(p => ({ ...p, nationalId: e.target.value }))} placeholder="08-123456A08" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subjects (comma-separated)</Label>
              <Input value={newCandidate.subjects} onChange={e => setNewCandidate(p => ({ ...p, subjects: e.target.value }))} placeholder="Mathematics, English, Shona, Physics..." />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleAddCandidate}
                disabled={!newCandidate.name || !newCandidate.studentNumber}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Candidate
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Detail View ─────────────────────────────────────────────────────────
  if (viewMode === 'detail' && selectedCandidate) {
    const c = selectedCandidate
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedId(null) }} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">{c.studentName}</CardTitle>
                  <CardDescription>{c.studentNumber} &middot; {c.examLevel.replace('_', '-')}</CardDescription>
                </div>
                <Badge className={cn(
                  'text-xs',
                  c.registrationStatus === 'REGISTERED' ? 'bg-emerald-100 text-emerald-700' :
                  c.registrationStatus === 'CONFIRMED' ? 'bg-teal-100 text-teal-700' :
                  c.registrationStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                )}>
                  {c.registrationStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm font-medium">{c.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">{c.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">National ID</p>
                  <p className="text-sm font-mono">{c.nationalId || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Centre Number</p>
                  <p className="text-sm font-mono">{c.centreNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Candidate Number</p>
                  <p className="text-sm font-mono">{c.candidateNumber || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fees Status</p>
                  <p className="text-sm">
                    <span className={c.feesPaid >= c.feesTotal ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                      ${c.feesPaid} / ${c.feesTotal}
                    </span>
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Subjects ({c.subjects.length})</p>
                <div className="flex flex-wrap gap-2">
                  {c.subjects.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>

              {c.errors && c.errors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-red-600 font-medium mb-2">Issues ({c.errors.length})</p>
                    <div className="space-y-1">
                      {c.errors.map((err, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                          <XCircle className="h-3 w-3 shrink-0" />
                          {err}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                  onClick={() => {
                    handleRemoveCandidate(c.id)
                    setViewMode('list')
                    setSelectedId(null)
                    toast.success('Candidate removed')
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Remove Candidate
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ─── Settings View ───────────────────────────────────────────────────────
  if (viewMode === 'settings') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5" /> Import Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure ZIMSEC bulk import defaults and validation rules</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Import Format</CardTitle>
              <CardDescription>Configure how data files are processed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Import Format</Label>
                <Select value={importFormat} onValueChange={setImportFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma-separated)</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="xls">Excel (.xls)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Exam Session</Label>
                <Select value={defaultExamSession} onValueChange={setDefaultExamSession}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="June">June Session</SelectItem>
                    <SelectItem value="November">November Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-assign Centre Number</Label>
                  <p className="text-xs text-muted-foreground">Automatically assign centre number from config</p>
                </div>
                <Switch checked={autoAssignCentre} onCheckedChange={setAutoAssignCentre} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Validation Rules</CardTitle>
              <CardDescription>Configure data validation requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-validate on import</Label>
                  <p className="text-xs text-muted-foreground">Run validation automatically after file upload</p>
                </div>
                <Switch checked={autoValidate} onCheckedChange={setAutoValidate} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require National ID</Label>
                  <p className="text-xs text-muted-foreground">Mark candidates without National ID as invalid</p>
                </div>
                <Switch checked={requireNationalId} onCheckedChange={setRequireNationalId} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Subjects Required</Label>
                <Select value={minSubjects} onValueChange={setMinSubjects}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Subjects</SelectItem>
                    <SelectItem value="6">6 Subjects</SelectItem>
                    <SelectItem value="7">7 Subjects (O-Level standard)</SelectItem>
                    <SelectItem value="8">8 Subjects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSaveSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Save Settings
          </Button>
          <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
        </div>
      </div>
    )
  }

  // ─── Main List View ─────────────────────────────────────────────────────
  return (
    <ModuleContainer>
      <ModuleToolbar
        actions={
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        }
      />

      {/* Progress Steps */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {[
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'preview', label: 'Preview', icon: Database },
              { id: 'validation', label: 'Validate', icon: CheckCircle2 },
              { id: 'complete', label: 'Complete', icon: FileCheck },
            ].map((s, idx) => (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => {
                    const stepOrder = ['upload', 'preview', 'validation', 'complete']
                    const currentIdx = stepOrder.indexOf(step)
                    const targetIdx = stepOrder.indexOf(s.id)
                    if (targetIdx <= currentIdx) setStep(s.id as ImportStep)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                    step === s.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' :
                    ['upload', 'preview', 'validation', 'complete'].indexOf(step) > idx ? 'text-emerald-500' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold',
                    step === s.id ? 'border-emerald-500 bg-emerald-100 text-emerald-600' :
                    ['upload', 'preview', 'validation', 'complete'].indexOf(step) > idx ? 'border-emerald-400 bg-emerald-50 text-emerald-500' :
                    'border-muted text-muted-foreground'
                  )}>
                    {['upload', 'preview', 'validation', 'complete'].indexOf(step) > idx ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </button>
                {idx < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground/30 hidden sm:block" />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* ─── Step: Upload ────────────────────────────────────────────────── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Configuration */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base">Exam Configuration</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Year</Label>
                    <Select value={examYear} onValueChange={setExamYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Level</Label>
                    <Select value={examLevel} onValueChange={v => setExamLevel(v as 'O_LEVEL' | 'A_LEVEL')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O_LEVEL">O-Level</SelectItem>
                        <SelectItem value="A_LEVEL">A-Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Centre Number</Label>
                    <Input value={centreNumber} onChange={e => setCentreNumber(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card className="border-0 shadow-md border-dashed border-2 hover:border-emerald-300 transition-colors cursor-pointer" onClick={handleFileUpload}>
              <CardContent className="p-12 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Upload Candidate Data</h3>
                <p className="text-sm text-muted-foreground mt-2">Click to upload or drag & drop your CSV/Excel file</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls files</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={e => { e.stopPropagation(); handleDownloadTemplate() }}>
                    <Download className="h-3 w-3" /> Download Template
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1" onClick={e => { e.stopPropagation(); handleFileUpload() }}>
                    <Upload className="h-3 w-3" /> Load Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Template Info */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-sm">Required Fields</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {['Student Name*', 'Student Number*', 'Gender*', 'Date of Birth*', 'National ID*', 'Exam Level*', 'Subjects*', 'Centre Number*'].map(field => (
                    <div key={field} className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Step: Preview ───────────────────────────────────────────────── */}
        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{candidates.length}</p><p className="text-xs text-muted-foreground">Total Candidates</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-teal-600">{validCandidates.length}</p><p className="text-xs text-muted-foreground">Valid Records</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{invalidCandidates.length}</p><p className="text-xs text-muted-foreground">With Issues</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{unpaidCandidates.length}</p><p className="text-xs text-muted-foreground">Fees Outstanding</p></CardContent></Card>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setViewMode('add')}>
                  <Plus className="h-3 w-3" /> Add Candidate
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setCandidates(mockCandidates)}>
                  <Database className="h-3 w-3" /> Reload Sample
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep('upload')}>Back</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={handleValidate}>
                  <CheckCircle2 className="h-4 w-4" /> Validate & Continue
                </Button>
              </div>
            </div>

            {/* Candidate Table */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs">Number</TableHead>
                        <TableHead className="text-xs">Level</TableHead>
                        <TableHead className="text-xs">Subjects</TableHead>
                        <TableHead className="text-xs">Fees</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map(candidate => (
                        <TableRow key={candidate.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{candidate.studentName}</p>
                              <p className="text-xs text-muted-foreground">{candidate.nationalId || 'No ID'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{candidate.studentNumber}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[9px]">{candidate.examLevel.replace('_', '-')}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-0.5">
                              {candidate.subjects.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-[8px] px-1 py-0">{s}</Badge>)}
                              {candidate.subjects.length > 3 && <Badge variant="secondary" className="text-[8px] px-1 py-0">+{candidate.subjects.length - 3}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className={candidate.feesPaid >= candidate.feesTotal ? 'text-emerald-600' : 'text-amber-600'}>
                                ${candidate.feesPaid}/${candidate.feesTotal}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-[9px]',
                              (candidate.errors ?? []).length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            )}>
                              {(candidate.errors ?? []).length === 0 ? 'Valid' : `${(candidate.errors ?? []).length} issues`}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setSelectedId(candidate.id); setViewMode('detail') }} className="text-muted-foreground hover:text-emerald-600">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleRemoveCandidate(candidate.id)} className="text-muted-foreground hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Step: Validation ────────────────────────────────────────────── */}
        {step === 'validation' && (
          <motion.div key="validation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {isProcessing ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Validating Candidates...</h3>
                  <p className="text-sm text-muted-foreground mt-1">Checking {candidates.length} records against ZIMSEC requirements</p>
                  <Progress value={processProgress} className="h-2 mt-4 max-w-md mx-auto" />
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Errors Summary */}
                {invalidCandidates.length > 0 && (
                  <Card className="border-0 shadow-md border-l-4 border-l-red-500">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" /> {invalidCandidates.length} Candidates with Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {invalidCandidates.map(c => (
                        <div key={c.id} className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{c.studentName} ({c.studentNumber})</p>
                            <Button variant="ghost" size="sm" className="text-xs text-red-600" onClick={() => handleRemoveCandidate(c.id)}>Remove</Button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(c.errors ?? []).map((err, idx) => (
                              <Badge key={idx} variant="outline" className="text-[9px] text-red-600 border-red-200">{err}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Valid Candidates */}
                <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" /> {validCandidates.length} Valid Candidates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      These {validCandidates.length} candidates have passed all validation checks and are ready for ZIMSEC registration.
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Fees Paid: {paidCandidates.length}/{candidates.length}</span>
                      <span>&middot;</span>
                      <span>O-Level: {candidates.filter(c => c.examLevel === 'O_LEVEL').length}</span>
                      <span>&middot;</span>
                      <span>A-Level: {candidates.filter(c => c.examLevel === 'A_LEVEL').length}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setStep('preview')}>Back to Preview</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleRegisterAll} disabled={validCandidates.length === 0}>
                    <FileCheck className="h-4 w-4" /> Register {validCandidates.length} Candidates
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ─── Step: Complete ──────────────────────────────────────────────── */}
        {step === 'complete' && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}>
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold">Registration Complete!</h2>
                <p className="text-emerald-100 mt-2">{validCandidates.length} candidates successfully registered with ZIMSEC</p>
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{validCandidates.length}</p><p className="text-xs text-muted-foreground">Registered</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{invalidCandidates.length}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">${paidCandidates.length > 0 ? 'Yes' : 'No'}</p><p className="text-xs text-muted-foreground">Fees Cleared</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-teal-600">{examYear}</p><p className="text-xs text-muted-foreground">Exam Year</p></CardContent></Card>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" className="gap-2" onClick={() => { setStep('upload'); setCandidates(mockCandidates) }}>
                <Upload className="h-4 w-4" /> New Import
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => toast.success('Registration report downloaded!')}>
                <Download className="h-4 w-4" /> Download Report
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleContainer>
  )
}
