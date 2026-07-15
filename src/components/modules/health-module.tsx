'use client'

import {
  ModulePageLayout,
  ModuleSettingsButton,
  ModuleContainer,
  StatGrid,
  ModuleStatCard,
  SectionCard,
  TableShell,
  KitEmptyState,
} from '@/components/module-ui';
import React, { useState } from 'react'
import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
import { motion } from 'framer-motion'
import {
  HeartPulse,
  Plus,
  Search,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Syringe,
  Activity,
  Stethoscope,
  Loader2,
  Ambulance,
  Pill,
  Thermometer,
  FileHeart,
  Clipboard,
  ArrowLeft,
  Settings,
  Save,
  FileDown,
  ShieldCheck,
  Hospital,
  Bell,
  UserCircle,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import { cn } from '@/lib/utils'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add' | 'quick-sickbay' | 'detail' | 'settings' | 'profile'

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
  allergies?: string | null
  chronicConditions?: string | null
  medications?: string | null
  bloodGroup?: string | null
  doctorName?: string | null
  doctorPhone?: string | null
}

interface HealthRecord {
  id: string
  studentId: string
  visitType: string
  description: string
  treatment: string | null
  medicationGiven: string | null
  referredTo: string | null
  visitDate: string
  isConfidential: boolean
  createdAt: string
  student: Student
}

interface StudentsResponse {
  data: Student[]
  total: number
  page: number
  totalPages: number
}

interface HealthResponse {
  data: HealthRecord[]
  total: number
  page: number
  totalPages: number
  stats: {
    totalRecords: number
    todayVisits: number
    confidentialCount: number
    referralsCount: number
    studentsWithChronicConditions: number
    studentsWithAllergies: number
  }
  visitTypeBreakdown: { type: string; count: number }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const isToday = (dateStr: string) => {
  const d = new Date(dateStr)
  const today = new Date()
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

const visitTypeLabels: Record<string, string> = {
  SICK_BAY: 'Sick Bay',
  INJURY: 'Injury',
  HOSPITAL: 'Hospital Referral',
  CHECKUP: 'Checkup',
  IMMUNISATION: 'Immunisation',
}

const visitTypeColors: Record<string, string> = {
  SICK_BAY: 'bg-teal-100 text-teal-700 border-teal-200',
  INJURY: 'bg-orange-100 text-orange-700 border-orange-200',
  HOSPITAL: 'bg-red-100 text-red-700 border-red-200',
  CHECKUP: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  IMMUNISATION: 'bg-purple-100 text-purple-700 border-purple-200',
}

const visitTypeIcons: Record<string, React.ElementType> = {
  SICK_BAY: Thermometer,
  INJURY: AlertTriangle,
  HOSPITAL: Ambulance,
  CHECKUP: Stethoscope,
  IMMUNISATION: Syringe,
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const visitChartConfig = {
  count: { label: 'Visits', color: '#10b981' },
} satisfies ChartConfig

const visitDonutConfig = {
  sickBay: { label: 'Sick Bay', color: '#14b8a6' },
  injury: { label: 'Injury', color: '#f97316' },
  hospital: { label: 'Hospital', color: '#ef4444' },
  checkup: { label: 'Checkup', color: '#10b981' },
  immunisation: { label: 'Immunisation', color: '#a855f7' },
} satisfies ChartConfig

// ─── Health Module ───────────────────────────────────────────────────────────

export default function HealthModule() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfidential, setShowConfidential] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const {
    data: healthData,
    isPending: loading,
  } = useApiQuery<HealthResponse>(['health'], '/api/health')

  const {
    data: studentsData,
  } = useApiQuery<StudentsResponse>(['students', 'health'], '/api/students?limit=500')

  const students = studentsData?.data ?? []
  const records = healthData?.data ?? []

  // Form state
  const [form, setForm] = useState({
    studentId: '',
    visitType: 'SICK_BAY',
    description: '',
    treatment: '',
    medicationGiven: '',
    referredTo: '',
    isConfidential: false,
  })

  // Quick sick bay form
  const [quickForm, setQuickForm] = useState({
    studentId: '',
    description: '',
    treatment: '',
    medicationGiven: '',
  })

  // Settings
  const [settings, setSettings] = useState({
    defaultVisitType: 'SICK_BAY',
    trackMedication: true,
    autoConfidential: false,
    requireTreatment: false,
    referralHospitals: 'Parirenyatwa Hospital, Harare Central Hospital',
    notifyParentSerious: true,
    notifyParentAll: false,
    notifyMethod: 'SMS',
    reportFormat: 'PDF',
    showConfidentialByDefault: false,
    autoArchive: true,
    archiveAfterDays: '90',
  })

  const { toast } = useToast()

  // ─── Mutations ──────────────────────────────────────────────────────────

  type CreateHealthBody = {
    studentId: string
    visitType: string
    description: string
    treatment?: string
    medicationGiven?: string
    referredTo?: string
    isConfidential?: boolean
    visitDate?: string
  }

  const { mutate: createHealthRecord, isPending: isCreating } = useApiMutation<CreateHealthBody, HealthRecord>('/api/health', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] })
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message || 'Failed to add health record', variant: 'destructive' })
    },
  })

  // ─── Form Handlers ─────────────────────────────────────────────────────

  const handleAddRecord = () => {
    if (!form.studentId || !form.visitType || !form.description) return
    createHealthRecord({
      studentId: form.studentId,
      visitType: form.visitType,
      description: form.description,
      treatment: form.treatment || undefined,
      medicationGiven: form.medicationGiven || undefined,
      referredTo: form.referredTo || undefined,
      isConfidential: form.isConfidential,
    }, {
      onSuccess: () => {
        setForm({ studentId: '', visitType: 'SICK_BAY', description: '', treatment: '', medicationGiven: '', referredTo: '', isConfidential: false })
        setViewMode('list')
        toast({ title: 'Record added', description: 'Health record has been created successfully.' })
      },
    })
  }

  const handleQuickAdd = () => {
    if (!quickForm.studentId || !quickForm.description) return
    createHealthRecord({
      studentId: quickForm.studentId,
      visitType: 'SICK_BAY',
      description: quickForm.description,
      treatment: quickForm.treatment || undefined,
      medicationGiven: quickForm.medicationGiven || undefined,
    }, {
      onSuccess: () => {
        setQuickForm({ studentId: '', description: '', treatment: '', medicationGiven: '' })
        setViewMode('list')
        toast({ title: 'Sick bay visit added', description: 'Sick bay entry has been recorded.' })
      },
    })
  }

  const handleSaveSettings = () => {
    toast({ title: 'Settings saved', description: 'Health module settings have been updated.' })
  }

  // ─── Computed Data ─────────────────────────────────────────────────────

  const sickBayVisits = records.filter((r) => r.visitType === 'SICK_BAY').length
  const hospitalReferrals = records.filter((r) => r.visitType === 'HOSPITAL').length
  const immunisationRecords = records.filter((r) => r.visitType === 'IMMUNISATION').length
  const studentsWithChronic = students.filter((s) => s.chronicConditions && s.chronicConditions.trim() !== '').length
  const todayVisits = records.filter((r) => isToday(r.visitDate))

  const visitBreakdown = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.visitType] = (acc[r.visitType] || 0) + 1
    return acc
  }, {})

  const visitChartData = Object.entries(visitBreakdown).map(([type, count]) => ({
    type: visitTypeLabels[type] || type,
    count,
  }))

  const visitDonutData = [
    { name: 'Sick Bay', value: visitBreakdown.SICK_BAY || 0, fill: 'var(--color-sickBay)' },
    { name: 'Injury', value: visitBreakdown.INJURY || 0, fill: 'var(--color-injury)' },
    { name: 'Hospital', value: visitBreakdown.HOSPITAL || 0, fill: 'var(--color-hospital)' },
    { name: 'Checkup', value: visitBreakdown.CHECKUP || 0, fill: 'var(--color-checkup)' },
    { name: 'Immunisation', value: visitBreakdown.IMMUNISATION || 0, fill: 'var(--color-immunisation)' },
  ].filter(d => d.value > 0)

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(q) || r.visitType.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
  })

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div className="h-8 w-48 bg-muted animate-pulse rounded" /><div className="flex gap-2"><div className="h-10 w-36 bg-muted animate-pulse rounded" /><div className="h-10 w-32 bg-muted animate-pulse rounded" /></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => (<div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />))}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="h-80 bg-muted animate-pulse rounded-xl" /><div className="h-80 bg-muted animate-pulse rounded-xl" /></div>
      </div>
    )
  }

  // ─── Add Health Record Inline Form ─────────────────────────────────────

  if (viewMode === 'add') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><FileHeart className="h-5 w-5 text-red-500" /> Add Health Record</h2>
            <p className="text-sm text-muted-foreground">Record a new health visit or medical event</p>
          </div>
        </div>
        <Card className="border-0 shadow-md max-w-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label>Student *</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm((p) => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Search and select student..." /></SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</SelectItem>))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Visit Type</Label>
              <Select value={form.visitType} onValueChange={(v) => setForm((p) => ({ ...p, visitType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SICK_BAY">Sick Bay</SelectItem>
                  <SelectItem value="INJURY">Injury</SelectItem>
                  <SelectItem value="HOSPITAL">Hospital Referral</SelectItem>
                  <SelectItem value="CHECKUP">Checkup</SelectItem>
                  <SelectItem value="IMMUNISATION">Immunisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea placeholder="Describe the health concern or visit reason..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Treatment</Label>
              <Textarea placeholder="Treatment administered..." value={form.treatment} onChange={(e) => setForm((p) => ({ ...p, treatment: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><Pill className="h-3.5 w-3.5 text-teal-500" /> Medication Given</Label>
                <Input placeholder="Medication details..." value={form.medicationGiven} onChange={(e) => setForm((p) => ({ ...p, medicationGiven: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Referred To</Label>
                <Input placeholder="e.g., Parirenyatwa Hospital" value={form.referredTo} onChange={(e) => setForm((p) => ({ ...p, referredTo: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
              <Checkbox id="healthConfidential" checked={form.isConfidential} onCheckedChange={(checked) => setForm((p) => ({ ...p, isConfidential: !!checked }))} className="border-red-300" />
              <div className="grid gap-0.5">
                <Label htmlFor="healthConfidential" className="text-sm font-medium flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-red-500" /> Confidential Record</Label>
                <span className="text-xs text-muted-foreground">Restrict access to authorised medical personnel only</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleAddRecord} disabled={isCreating || !form.studentId || !form.description} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Record
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── Quick Sick Bay Inline Form ────────────────────────────────────────

  if (viewMode === 'quick-sickbay') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Thermometer className="h-5 w-5 text-red-500" /> Quick Sick Bay Entry</h2>
            <p className="text-sm text-muted-foreground">Record a sick bay visit for today</p>
          </div>
        </div>
        <Card className="border-0 shadow-md max-w-xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label>Student *</Label>
              <Select value={quickForm.studentId} onValueChange={(v) => setQuickForm((p) => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Search and select student..." /></SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</SelectItem>))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea placeholder="What is the student complaining of?" value={quickForm.description} onChange={(e) => setQuickForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Treatment</Label>
              <Input placeholder="Treatment given..." value={quickForm.treatment} onChange={(e) => setQuickForm((p) => ({ ...p, treatment: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Medication Given</Label>
              <Input placeholder="Medication details..." value={quickForm.medicationGiven} onChange={(e) => setQuickForm((p) => ({ ...p, medicationGiven: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleQuickAdd} disabled={isCreating || !quickForm.studentId || !quickForm.description} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Visit
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── Detail View ───────────────────────────────────────────────────────

  if (viewMode === 'detail' && selectedRecord) {
    const VisitIcon = visitTypeIcons[selectedRecord.visitType] || Stethoscope
    const isHidden = selectedRecord.isConfidential && !showConfidential
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedRecord(null) }}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <VisitIcon className="h-5 w-5 text-red-500" />
              Health Record Detail
            </h2>
            <p className="text-sm text-muted-foreground">
              {isHidden ? 'Confidential record' : `${selectedRecord.student.firstName} ${selectedRecord.student.lastName}`}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visit Type</p>
              <Badge variant="outline" className={cn('mt-2 text-xs', visitTypeColors[selectedRecord.visitType] || 'bg-muted text-muted-foreground')}>
                <VisitIcon className="mr-1 h-3 w-3" />
                {visitTypeLabels[selectedRecord.visitType] || selectedRecord.visitType}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
              <p className="text-lg font-bold mt-1">{formatDate(selectedRecord.visitDate)}</p>
              <p className="text-xs text-muted-foreground">{new Date(selectedRecord.visitDate).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Access Level</p>
              {selectedRecord.isConfidential ? (
                <div className="flex items-center gap-1 text-red-500 mt-2"><Lock className="h-4 w-4" /><span className="text-sm font-medium">Confidential</span></div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 mt-2"><ShieldCheck className="h-4 w-4" /><span className="text-sm font-medium">Open Access</span></div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm">{isHidden ? '••••••' : selectedRecord.description}</p>
            </div>
            {selectedRecord.treatment && !isHidden && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Treatment</p>
                <p className="text-sm">{selectedRecord.treatment}</p>
              </div>
            )}
            {selectedRecord.medicationGiven && !isHidden && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Medication Given</p>
                <Badge variant="secondary" className="text-xs"><Pill className="mr-1 h-3 w-3" />{selectedRecord.medicationGiven}</Badge>
              </div>
            )}
            {selectedRecord.referredTo && !isHidden && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Referred To</p>
                <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50"><Ambulance className="mr-1 h-3 w-3" />{selectedRecord.referredTo}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── Student Medical Profile ───────────────────────────────────────────

  if (viewMode === 'profile' && selectedStudent) {
    const studentRecords = records.filter((r) => r.studentId === selectedStudent.id)
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedStudent(null) }}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div>
            <h2 className="text-xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
            <p className="text-sm text-muted-foreground">{selectedStudent.studentNumber} &mdash; Medical Profile</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Medical Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Blood Group</span><Badge variant="outline" className="text-xs">{selectedStudent.bloodGroup || 'Not recorded'}</Badge></div>
              <Separator />
              <div><span className="text-xs text-muted-foreground">Allergies</span><p className="text-sm mt-1">{selectedStudent.allergies || 'None recorded'}</p></div>
              <Separator />
              <div><span className="text-xs text-muted-foreground">Chronic Conditions</span><p className="text-sm mt-1">{selectedStudent.chronicConditions || 'None recorded'}</p></div>
              <Separator />
              <div><span className="text-xs text-muted-foreground">Current Medications</span><p className="text-sm mt-1">{selectedStudent.medications || 'None recorded'}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Doctor Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Doctor Name</span><span className="text-sm">{selectedStudent.doctorName || 'Not recorded'}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Doctor Phone</span><span className="text-sm">{selectedStudent.doctorPhone || 'Not recorded'}</span></div>
            </CardContent>
          </Card>
        </div>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Health Visit History ({studentRecords.length})</CardTitle></CardHeader>
          <CardContent>
            {studentRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No health records for this student</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Treatment</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {studentRecords.map((r) => {
                    const isH = r.isConfidential && !showConfidential
                    const VIcon = visitTypeIcons[r.visitType] || Stethoscope
                    return (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-muted/30" onClick={() => { setSelectedRecord(r); setViewMode('detail') }}>
                        <TableCell><Badge variant="outline" className={cn('text-[10px]', visitTypeColors[r.visitType])}><VIcon className="mr-1 h-3 w-3" />{visitTypeLabels[r.visitType]}</Badge></TableCell>
                        <TableCell className="text-xs">{formatDate(r.visitDate)}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{isH ? '••••••' : r.description}</TableCell>
                        <TableCell className="text-xs">{isH ? '••••••' : (r.treatment || '\u2014')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── Settings View ─────────────────────────────────────────────────────

  if (viewMode === 'settings') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-red-500" /> Health Settings</h2>
            <p className="text-sm text-muted-foreground">Configure health module preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Visit Type Configuration */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Stethoscope className="h-4 w-4 text-teal-500" /> Visit Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Default Visit Type</Label>
                <Select value={settings.defaultVisitType} onValueChange={(v) => setSettings((p) => ({ ...p, defaultVisitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SICK_BAY">Sick Bay</SelectItem>
                    <SelectItem value="INJURY">Injury</SelectItem>
                    <SelectItem value="HOSPITAL">Hospital Referral</SelectItem>
                    <SelectItem value="CHECKUP">Checkup</SelectItem>
                    <SelectItem value="IMMUNISATION">Immunisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>Require Treatment Field</Label><p className="text-xs text-muted-foreground">Make treatment description mandatory</p></div>
                <Switch checked={settings.requireTreatment} onCheckedChange={(v) => setSettings((p) => ({ ...p, requireTreatment: v }))} />
              </div>
            </CardContent>
          </Card>

          {/* Medication Tracking */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Pill className="h-4 w-4 text-purple-500" /> Medication Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Track Medication</Label><p className="text-xs text-muted-foreground">Enable medication tracking and logging</p></div>
                <Switch checked={settings.trackMedication} onCheckedChange={(v) => setSettings((p) => ({ ...p, trackMedication: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>Auto-Mark Confidential</Label><p className="text-xs text-muted-foreground">Auto-mark records with medication as confidential</p></div>
                <Switch checked={settings.autoConfidential} onCheckedChange={(v) => setSettings((p) => ({ ...p, autoConfidential: v }))} />
              </div>
            </CardContent>
          </Card>

          {/* Confidentiality & Referrals */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Lock className="h-4 w-4 text-red-500" /> Confidentiality & Referrals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Show Confidential by Default</Label><p className="text-xs text-muted-foreground">Display confidential records without toggling</p></div>
                <Switch checked={settings.showConfidentialByDefault} onCheckedChange={(v) => setSettings((p) => ({ ...p, showConfidentialByDefault: v }))} />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label>Default Referral Hospitals</Label>
                <Textarea placeholder="One hospital per line..." value={settings.referralHospitals} onChange={(e) => setSettings((p) => ({ ...p, referralHospitals: e.target.value }))} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications & Reports */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-amber-500" /> Notifications & Reports</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Notify for Serious Cases</Label><p className="text-xs text-muted-foreground">Auto-notify parents for hospital referrals</p></div>
                <Switch checked={settings.notifyParentSerious} onCheckedChange={(v) => setSettings((p) => ({ ...p, notifyParentSerious: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>Notify for All Visits</Label><p className="text-xs text-muted-foreground">Send notification for every health visit</p></div>
                <Switch checked={settings.notifyParentAll} onCheckedChange={(v) => setSettings((p) => ({ ...p, notifyParentAll: v }))} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Notification Method</Label>
                  <Select value={settings.notifyMethod} onValueChange={(v) => setSettings((p) => ({ ...p, notifyMethod: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Report Format</Label>
                  <Select value={settings.reportFormat} onValueChange={(v) => setSettings((p) => ({ ...p, reportFormat: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="EXCEL">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>Auto-Archive Old Records</Label><p className="text-xs text-muted-foreground">Archive records after specified days</p></div>
                <Switch checked={settings.autoArchive} onCheckedChange={(v) => setSettings((p) => ({ ...p, autoArchive: v }))} />
              </div>
              <div className="grid gap-2">
                <Label>Archive After (days)</Label>
                <Input type="number" min="30" value={settings.archiveAfterDays} onChange={(e) => setSettings((p) => ({ ...p, archiveAfterDays: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </motion.div>
    )
  }

  // ─── Main List View ────────────────────────────────────────────────────

  return (
    <ModuleContainer>
<ModulePageLayout
        actions={<>
          <Button variant="outline" size="sm" className={cn('border-red-200', showConfidential ? 'text-red-700 bg-red-50' : 'text-muted-foreground')} onClick={() => setShowConfidential(!showConfidential)}>
            {showConfidential ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showConfidential ? 'Confidential Visible' : 'Show Confidential'}
          </Button>
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setViewMode('quick-sickbay')}>
            <Thermometer className="mr-2 h-4 w-4" /> Quick Sick Bay
          </Button>
          <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md" onClick={() => setViewMode('add')}>
            <Plus className="mr-2 h-4 w-4" /> Add Health Record
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="sickbay">Sick Bay Today</TabsTrigger>
            <TabsTrigger value="profiles">Medical Profiles</TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={Thermometer}
              label="Sick Bay Visits"
              value={sickBayVisits}
              hint="This term"
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50"
              iconColor="text-teal-600"
              index={0}
            />
            <ModuleStatCard
              icon={Ambulance}
              label="Hospital Referrals"
              value={hospitalReferrals}
              hint="Referred out"
              accentGradient="from-red-400 to-rose-500"
              bgColor="bg-red-50"
              iconColor="text-red-600"
              index={1}
            />
            <ModuleStatCard
              icon={Syringe}
              label="Immunisation Records"
              value={immunisationRecords}
              hint="Vaccinations"
              accentGradient="from-purple-400 to-violet-500"
              bgColor="bg-purple-50"
              iconColor="text-purple-600"
              index={2}
            />
            <ModuleStatCard
              icon={HeartPulse}
              label="Chronic Conditions"
              value={studentsWithChronic}
              hint="Ongoing care"
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50"
              iconColor="text-amber-600"
              index={3}
            />
          </StatGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Visits by Type" description="Health visit distribution" icon={Activity}>
              {visitChartData.length > 0 ? (
                <ChartContainer config={visitChartConfig} className="h-[250px] w-full">
                  <BarChart data={visitChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="type" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ChartContainer>
              ) : (<div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No health data yet</div>)}
            </SectionCard>
            <SectionCard title="Visit Distribution" description="Breakdown by visit type" icon={HeartPulse}>
              <div className="flex items-center justify-center">
                <ChartContainer config={visitDonutConfig} className="h-[220px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={visitDonutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                      {visitDonutData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                {visitDonutData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.name === 'Sick Bay' ? '#14b8a6' : item.name === 'Injury' ? '#f97316' : item.name === 'Hospital' ? '#ef4444' : item.name === 'Checkup' ? '#10b981' : '#a855f7' }} />
                    <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── Records Tab ──────────────────────────────────────────────── */}
        <TabsContent value="records" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search health records..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Badge variant="outline" className="text-xs">{filteredRecords.length} records</Badge>
          </div>
          <SectionCard title="Health Records" icon={FileHeart} noPadding>
            <TableShell maxHeight="500px">
              <Table>
                <TableHeader>
                  <TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Visit Type</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Treatment</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Access</TableHead><TableHead className="text-xs"></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const isHidden = record.isConfidential && !showConfidential
                    const VisitIcon = visitTypeIcons[record.visitType] || Stethoscope
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedRecord(record); setViewMode('detail') }}>
                        <TableCell className="font-medium text-sm">{isHidden ? <span className="text-muted-foreground italic">Confidential</span> : `${record.student.firstName} ${record.student.lastName}`}</TableCell>
                        <TableCell><Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', visitTypeColors[record.visitType] || 'bg-muted text-muted-foreground')}><VisitIcon className="mr-1 h-3 w-3" />{visitTypeLabels[record.visitType] || record.visitType}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{isHidden ? '\u2022\u2022\u2022\u2022\u2022\u2022' : record.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{isHidden ? '\u2022\u2022\u2022\u2022\u2022\u2022' : (record.treatment || '\u2014')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(record.visitDate)}</TableCell>
                        <TableCell>{record.isConfidential ? <div className="flex items-center gap-1 text-red-500"><Lock className="h-3.5 w-3.5" /><span className="text-[10px] font-medium">Restricted</span></div> : <span className="text-[10px] text-muted-foreground">Open</span>}</TableCell>
                        <TableCell><Eye className="h-4 w-4 text-muted-foreground" /></TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredRecords.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No health records found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Sick Bay Today Tab ───────────────────────────────────────── */}
        <TabsContent value="sickbay" className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-semibold">Today&apos;s Sick Bay Visits</h2><p className="text-sm text-muted-foreground">{todayVisits.length} visit{todayVisits.length !== 1 ? 's' : ''} recorded today</p></div>
            <Button onClick={() => setViewMode('quick-sickbay')} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Visit
            </Button>
          </div>
          {todayVisits.length > 0 ? (
            <div className="space-y-3">
              {todayVisits.map((record) => (
                <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelectedRecord(record); setViewMode('detail') }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 shrink-0"><Thermometer className="h-5 w-5 text-red-500" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{record.student.firstName} {record.student.lastName}</p>
                            {record.isConfidential && <Lock className="h-3.5 w-3.5 text-red-400" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{record.student.studentNumber}</p>
                          <p className="text-sm mt-2">{record.isConfidential && !showConfidential ? <span className="text-muted-foreground italic">Confidential</span> : record.description}</p>
                          {(record.treatment || record.medicationGiven) && !(record.isConfidential && !showConfidential) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {record.treatment && <Badge variant="secondary" className="text-[10px]"><Clipboard className="mr-1 h-3 w-3" />{record.treatment}</Badge>}
                              {record.medicationGiven && <Badge variant="secondary" className="text-[10px]"><Pill className="mr-1 h-3 w-3" />{record.medicationGiven}</Badge>}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{new Date(record.visitDate).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })}</p>
                          {record.referredTo && <Badge variant="outline" className="mt-1 text-[10px] text-amber-700 border-amber-200 bg-amber-50"><Ambulance className="mr-1 h-3 w-3" />Referred</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <SectionCard>
              <KitEmptyState
                icon={Thermometer}
                title="No sick bay visits recorded today."
                action={
                  <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setViewMode('quick-sickbay')}>
                    <Plus className="mr-2 h-4 w-4" /> Record First Visit
                  </Button>
                }
              />
            </SectionCard>
          )}
        </TabsContent>

        {/* ─── Medical Profiles Tab ─────────────────────────────────────── */}
        <TabsContent value="profiles" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.filter((s) => {
              if (!searchQuery) return true
              const q = searchQuery.toLowerCase()
              return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentNumber.toLowerCase().includes(q)
            }).slice(0, 30).map((student) => {
              const studentRecords_ = records.filter((r) => r.studentId === student.id)
              const hasAllergies = !!student.allergies && student.allergies.trim() !== ''
              const hasChronic = !!student.chronicConditions && student.chronicConditions.trim() !== ''
              return (
                <Card key={student.id} className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelectedStudent(student); setViewMode('profile') }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700 text-xs font-semibold shrink-0">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground">{student.studentNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {student.bloodGroup && <Badge variant="outline" className="text-[10px] text-red-700 border-red-200 bg-red-50">{student.bloodGroup}</Badge>}
                      {hasAllergies && <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200 bg-amber-50">Allergies</Badge>}
                      {hasChronic && <Badge variant="outline" className="text-[10px] text-orange-700 border-orange-200 bg-orange-50">Chronic</Badge>}
                      {studentRecords_.length > 0 && <Badge variant="outline" className="text-[10px] text-teal-700 border-teal-200 bg-teal-50">{studentRecords_.length} visits</Badge>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {students.length === 0 && (
              <SectionCard className="col-span-full">
                <KitEmptyState icon={UserCircle} title="No student profiles available" />
              </SectionCard>
            )}
          </div>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
