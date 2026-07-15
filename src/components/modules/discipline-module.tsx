'use client'

import {
  ModulePageLayout,
  ModuleSettingsButton,
  ModuleContainer,
  StatGrid,
  ModuleStatCard,
  SectionCard,
  ModuleToolbar,
  TableShell,
  KitEmptyState,
} from '@/components/module-ui';
import React, { useState, useEffect, useCallback } from 'react'
import { useApiQuery, useApiMutation, useApiPut, useQueryClient } from '@/hooks/use-api-query'
import { motion } from 'framer-motion'
import {
  Scale,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  Loader2,
  Gavel,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Trophy,
  Medal,
  ArrowLeft,
  Settings,
  Save,
  FileDown,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  Eye,
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
import { Card, CardContent } from '@/components/ui/card'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
}

interface DisciplineRecord {
  id: string
  studentId: string
  incidentType: string
  description: string
  date: string
  action: string | null
  meritPoints: number
  demeritPoints: number
  parentNotified: boolean
  status: string
  createdAt: string
  updatedAt: string
  student: Student
}

interface DisciplineResponse {
  data: DisciplineRecord[]
  total: number
  page: number
  totalPages: number
  stats: {
    total: number
    open: number
    resolved: number
    closed: number
    totalMerit: number
    totalDemerit: number
    parentNotifiedCount: number
  }
  incidentTypeBreakdown: { type: string; count: number }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const incidentTypeLabels: Record<string, string> = {
  BULLYING: 'Bullying',
  FIGHTING: 'Fighting',
  SUBSTANCE_ABUSE: 'Substance Abuse',
  VANDALISM: 'Vandalism',
  THEFT: 'Theft',
  ABSCONDING: 'Absconding',
  LATE_COMING: 'Late Coming',
  UNIFORM_VIOLATION: 'Uniform Violation',
  PHONE_VIOLATION: 'Phone Violation',
  OTHER: 'Other',
}

const incidentSeverity: Record<string, { level: string; color: string; badgeBg: string }> = {
  BULLYING: { level: 'Serious', color: 'text-red-700', badgeBg: 'bg-red-100 text-red-700 border-red-200' },
  FIGHTING: { level: 'Serious', color: 'text-red-700', badgeBg: 'bg-red-100 text-red-700 border-red-200' },
  SUBSTANCE_ABUSE: { level: 'Serious', color: 'text-red-700', badgeBg: 'bg-red-100 text-red-700 border-red-200' },
  VANDALISM: { level: 'Moderate', color: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-700 border-amber-200' },
  THEFT: { level: 'Serious', color: 'text-red-700', badgeBg: 'bg-red-100 text-red-700 border-red-200' },
  ABSCONDING: { level: 'Moderate', color: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-700 border-amber-200' },
  LATE_COMING: { level: 'Minor', color: 'text-emerald-700', badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  UNIFORM_VIOLATION: { level: 'Minor', color: 'text-emerald-700', badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PHONE_VIOLATION: { level: 'Minor', color: 'text-emerald-700', badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  OTHER: { level: 'Moderate', color: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-700 border-amber-200' },
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700 border-amber-200',
  INVESTIGATING: 'bg-teal-100 text-teal-700 border-teal-200',
  RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-muted text-muted-foreground border-border',
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const incidentChartConfig = {
  count: { label: 'Incidents', color: '#10b981' },
} satisfies ChartConfig

const severityDonutConfig = {
  serious: { label: 'Serious', color: '#ef4444' },
  moderate: { label: 'Moderate', color: '#f59e0b' },
  minor: { label: 'Minor', color: '#10b981' },
} satisfies ChartConfig

// ─── Discipline Module ──────────────────────────────────────────────────────

export default function DisciplineModule() {
  const queryClient = useQueryClient()
  const [students, setStudents] = useState<Student[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRecord, setSelectedRecord] = useState<DisciplineRecord | null>(null)

  const {
    data: disciplineData,
    isPending: loading,
  } = useApiQuery<DisciplineResponse>(['discipline'], '/api/discipline')

  const records = disciplineData?.data ?? []

  // Form state
  const [form, setForm] = useState({
    studentId: '',
    incidentType: 'LATE_COMING',
    description: '',
    date: new Date().toISOString().split('T')[0],
    action: '',
    meritPoints: '0',
    demeritPoints: '0',
    parentNotified: false,
  })

  // Settings
  const [settings, setSettings] = useState({
    meritSystem: 'STANDARD',
    meritValue: '1',
    demeritValue: '1',
    autoEscalation: true,
    escalationThreshold: '10',
    parentNotifySerious: true,
    parentNotifyAll: false,
    notifyMethod: 'SMS',
    reportFormat: 'PDF',
    showResolved: true,
    incidentTypes: Object.keys(incidentTypeLabels),
  })

  const { toast } = useToast()

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?limit=500')
      if (res.ok) {
        const data = await res.json()
        setStudents(data.data || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (viewMode === 'add' || viewMode === 'edit') fetchStudents()
  }, [viewMode, fetchStudents])

  // ─── Mutations ───────────────────────────────────────────────────────

  const { mutate: createIncident, isPending: isCreating } = useApiMutation<
    { studentId: string; incidentType: string; description: string; date: string; action?: string; meritPoints: number; demeritPoints: number; parentNotified: boolean },
    DisciplineRecord
  >('/api/discipline', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipline'] })
      setForm({ studentId: '', incidentType: 'LATE_COMING', description: '', date: new Date().toISOString().split('T')[0], action: '', meritPoints: '0', demeritPoints: '0', parentNotified: false })
      setViewMode('list')
      toast({ title: 'Incident recorded', description: 'Disciplinary incident has been recorded successfully.' })
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message || 'Failed to record incident', variant: 'destructive' })
    },
  })

  const { mutate: updateIncidentStatus, isPending: isUpdating } = useApiPut<
    { id: string; status: string },
    DisciplineRecord
  >('/api/discipline', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipline'] })
    },
  })

  // ─── Form Handler ──────────────────────────────────────────────────────

  const handleAddIncident = () => {
    if (!form.studentId || !form.incidentType || !form.description) return
    createIncident({
      studentId: form.studentId,
      incidentType: form.incidentType,
      description: form.description,
      date: form.date,
      action: form.action || undefined,
      meritPoints: parseInt(form.meritPoints) || 0,
      demeritPoints: parseInt(form.demeritPoints) || 0,
      parentNotified: form.parentNotified,
    })
  }

  const handleUpdateStatus = (recordId: string, newStatus: string) => {
    updateIncidentStatus({ id: recordId, status: newStatus }, {
      onSuccess: () => {
        if (selectedRecord) setSelectedRecord({ ...selectedRecord, status: newStatus })
        toast({ title: 'Status updated', description: `Case status changed to ${newStatus}` })
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.message || 'Failed to update status', variant: 'destructive' })
      },
    })
  }

  const handleSaveSettings = () => {
    toast({ title: 'Settings saved', description: 'Discipline settings have been updated.' })
  }

  // ─── Computed Data ─────────────────────────────────────────────────────

  const openCases = records.filter((r) => r.status === 'OPEN').length
  const resolvedThisTerm = records.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length
  const totalMerit = records.reduce((sum, r) => sum + r.meritPoints, 0)
  const totalDemerit = records.reduce((sum, r) => sum + r.demeritPoints, 0)

  const incidentBreakdown = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.incidentType] = (acc[r.incidentType] || 0) + 1
    return acc
  }, {})

  const incidentChartData = Object.entries(incidentBreakdown).map(([type, count]) => ({
    type: incidentTypeLabels[type] || type,
    count,
  }))

  const severityCounts = {
    serious: records.filter((r) => incidentSeverity[r.incidentType]?.level === 'Serious').length,
    moderate: records.filter((r) => incidentSeverity[r.incidentType]?.level === 'Moderate').length,
    minor: records.filter((r) => incidentSeverity[r.incidentType]?.level === 'Minor').length,
  }

  const severityDonutData = [
    { name: 'Serious', value: severityCounts.serious, fill: 'var(--color-serious)' },
    { name: 'Moderate', value: severityCounts.moderate, fill: 'var(--color-moderate)' },
    { name: 'Minor', value: severityCounts.minor, fill: 'var(--color-minor)' },
  ]

  const studentPointsMap = records.reduce<Record<string, { merit: number; demerit: number; student: Student }>>((acc, r) => {
    if (!acc[r.studentId]) acc[r.studentId] = { merit: 0, demerit: 0, student: r.student }
    acc[r.studentId].merit += r.meritPoints
    acc[r.studentId].demerit += r.demeritPoints
    return acc
  }, {})

  const meritBoard = Object.values(studentPointsMap).map((s) => ({ ...s, net: s.merit - s.demerit })).sort((a, b) => b.net - a.net).slice(0, 10)

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(q) || r.incidentType.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
  }).filter((r) => {
    if (filterSeverity === 'ALL') return true
    return incidentSeverity[r.incidentType]?.level?.toUpperCase() === filterSeverity
  })

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div className="h-8 w-56 bg-muted animate-pulse rounded" /><div className="h-10 w-44 bg-muted animate-pulse rounded" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => (<div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />))}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="h-80 bg-muted animate-pulse rounded-xl" /><div className="h-80 bg-muted animate-pulse rounded-xl" /></div>
      </div>
    )
  }

  // ─── Add Incident Inline Form ──────────────────────────────────────────

  if (viewMode === 'add') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Gavel className="h-5 w-5 text-orange-500" /> Record Disciplinary Incident</h2>
            <p className="text-sm text-muted-foreground">Record a new disciplinary incident for a student</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Incident Type</Label>
                <Select value={form.incidentType} onValueChange={(v) => setForm((p) => ({ ...p, incidentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BULLYING">Bullying</SelectItem>
                    <SelectItem value="FIGHTING">Fighting</SelectItem>
                    <SelectItem value="SUBSTANCE_ABUSE">Substance Abuse</SelectItem>
                    <SelectItem value="VANDALISM">Vandalism</SelectItem>
                    <SelectItem value="THEFT">Theft</SelectItem>
                    <SelectItem value="ABSCONDING">Absconding</SelectItem>
                    <SelectItem value="LATE_COMING">Late Coming</SelectItem>
                    <SelectItem value="UNIFORM_VIOLATION">Uniform Violation</SelectItem>
                    <SelectItem value="PHONE_VIOLATION">Phone Violation</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            {form.incidentType && incidentSeverity[form.incidentType] && (
              <div className={cn('p-3 rounded-lg border', incidentSeverity[form.incidentType].level === 'Serious' ? 'bg-red-50 border-red-100' : incidentSeverity[form.incidentType].level === 'Moderate' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100')}>
                <span className={cn('text-xs font-medium', incidentSeverity[form.incidentType].color)}>Severity: {incidentSeverity[form.incidentType].level}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea placeholder="Describe the incident in detail..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Action Taken</Label>
              <Textarea placeholder="Describe the disciplinary action taken..." value={form.action} onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5 text-emerald-500" /> Merit Points</Label>
                <Input type="number" min="0" placeholder="0" value={form.meritPoints} onChange={(e) => setForm((p) => ({ ...p, meritPoints: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><ThumbsDown className="h-3.5 w-3.5 text-red-500" /> Demerit Points</Label>
                <Input type="number" min="0" placeholder="0" value={form.demeritPoints} onChange={(e) => setForm((p) => ({ ...p, demeritPoints: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100">
              <Checkbox id="parentNotified" checked={form.parentNotified} onCheckedChange={(checked) => setForm((p) => ({ ...p, parentNotified: !!checked }))} className="border-orange-300" />
              <div className="grid gap-0.5">
                <Label htmlFor="parentNotified" className="text-sm font-medium flex items-center gap-1.5"><Bell className="h-3.5 w-3.5 text-orange-500" /> Parent / Guardian Notified</Label>
                <span className="text-xs text-muted-foreground">Confirm that the parent or guardian has been informed</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleAddIncident} disabled={isCreating || !form.studentId || !form.description} className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Incident
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
    const severity = incidentSeverity[selectedRecord.incidentType]
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedRecord(null) }}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div>
            <h2 className="text-xl font-bold">Incident Detail</h2>
            <p className="text-sm text-muted-foreground">{selectedRecord.student.firstName} {selectedRecord.student.lastName} &mdash; {incidentTypeLabels[selectedRecord.incidentType] || selectedRecord.incidentType}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incident Type</p>
              <Badge variant="outline" className="mt-2 text-xs">{incidentTypeLabels[selectedRecord.incidentType] || selectedRecord.incidentType}</Badge>
              {severity && <Badge variant="outline" className={cn('ml-2 text-xs', severity.badgeBg)}>{severity.level}</Badge>}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
              <p className="text-lg font-bold mt-1">{formatDate(selectedRecord.date)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <Badge variant="outline" className={cn('mt-2 text-xs', statusColors[selectedRecord.status] || '')}>{selectedRecord.status}</Badge>
            </CardContent>
          </Card>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm">{selectedRecord.description}</p>
            </div>
            {selectedRecord.action && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Action Taken</p>
                <p className="text-sm">{selectedRecord.action}</p>
              </div>
            )}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4 text-emerald-500" /><span className="text-sm font-medium">Merit: +{selectedRecord.meritPoints}</span></div>
              <div className="flex items-center gap-1.5"><ThumbsDown className="h-4 w-4 text-red-500" /><span className="text-sm font-medium">Demerit: -{selectedRecord.demeritPoints}</span></div>
              <div className="flex items-center gap-1.5">
                {selectedRecord.parentNotified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm">{selectedRecord.parentNotified ? 'Parent notified' : 'Parent not notified'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          {selectedRecord.status === 'OPEN' && (
            <Button onClick={() => handleUpdateStatus(selectedRecord.id, 'INVESTIGATING')} disabled={isUpdating} className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">Start Investigation</Button>
          )}
          {(selectedRecord.status === 'OPEN' || selectedRecord.status === 'INVESTIGATING') && (
            <Button onClick={() => handleUpdateStatus(selectedRecord.id, 'RESOLVED')} disabled={isUpdating} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Mark Resolved</Button>
          )}
          {selectedRecord.status === 'RESOLVED' && (
            <Button onClick={() => handleUpdateStatus(selectedRecord.id, 'CLOSED')} disabled={isUpdating} variant="outline">Close Case</Button>
          )}
        </div>
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
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-orange-500" /> Discipline Settings</h2>
            <p className="text-sm text-muted-foreground">Configure discipline module preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Merit/Demerit Point System */}
          <SectionCard title="Merit/Demerit System" icon={Award} contentClassName="space-y-4">
            <div className="grid gap-2">
              <Label>Point System</Label>
              <Select value={settings.meritSystem} onValueChange={(v) => setSettings((p) => ({ ...p, meritSystem: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard (1 point per incident)</SelectItem>
                  <SelectItem value="WEIGHTED">Weighted (severity-based)</SelectItem>
                  <SelectItem value="CUSTOM">Custom values</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Default Merit Value</Label>
                <Input type="number" min="1" value={settings.meritValue} onChange={(e) => setSettings((p) => ({ ...p, meritValue: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Default Demerit Value</Label>
                <Input type="number" min="1" value={settings.demeritValue} onChange={(e) => setSettings((p) => ({ ...p, demeritValue: e.target.value }))} />
              </div>
            </div>
          </SectionCard>

          {/* Auto-Escalation */}
          <SectionCard title="Auto-Escalation Rules" icon={ShieldAlert} contentClassName="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Auto-Escalation</Label><p className="text-xs text-muted-foreground">Automatically escalate serious cases</p></div>
              <Switch checked={settings.autoEscalation} onCheckedChange={(v) => setSettings((p) => ({ ...p, autoEscalation: v }))} />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Demerit Escalation Threshold</Label>
              <Input type="number" min="1" value={settings.escalationThreshold} onChange={(e) => setSettings((p) => ({ ...p, escalationThreshold: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Auto-escalate when student reaches this many demerits</p>
            </div>
          </SectionCard>

          {/* Parent Notification */}
          <SectionCard title="Parent Notifications" icon={Bell} contentClassName="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Notify for Serious Incidents</Label><p className="text-xs text-muted-foreground">Auto-notify parents of serious incidents</p></div>
              <Switch checked={settings.parentNotifySerious} onCheckedChange={(v) => setSettings((p) => ({ ...p, parentNotifySerious: v }))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label>Notify for All Incidents</Label><p className="text-xs text-muted-foreground">Auto-notify parents for every incident</p></div>
              <Switch checked={settings.parentNotifyAll} onCheckedChange={(v) => setSettings((p) => ({ ...p, parentNotifyAll: v }))} />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Notification Method</Label>
              <Select value={settings.notifyMethod} onValueChange={(v) => setSettings((p) => ({ ...p, notifyMethod: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="BOTH">SMS + Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SectionCard>

          {/* Report & Display */}
          <SectionCard title="Report & Display" icon={FileDown} contentClassName="space-y-4">
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
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label>Show Resolved Cases</Label><p className="text-xs text-muted-foreground">Display resolved/closed cases in lists</p></div>
              <Switch checked={settings.showResolved} onCheckedChange={(v) => setSettings((p) => ({ ...p, showResolved: v }))} />
            </div>
          </SectionCard>
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
          <Button onClick={() => setViewMode('add')} className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Add Incident
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="merit">Merit Board</TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={Clock}
              label="Open Cases"
              value={openCases}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600"
              hint="Pending resolution"
              index={0}
            />
            <ModuleStatCard
              icon={CheckCircle2}
              label="Resolved This Term"
              value={resolvedThisTerm}
              accentGradient="from-emerald-400 to-teal-500"
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600"
              hint="Cases closed"
              index={1}
            />
            <ModuleStatCard
              icon={Award}
              label="Merit Points Total"
              value={totalMerit}
              accentGradient="from-emerald-400 to-green-500"
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600"
              hint="Positive behaviour"
              valueClassName="text-emerald-700"
              index={2}
            />
            <ModuleStatCard
              icon={AlertTriangle}
              label="Demerit Points Total"
              value={totalDemerit}
              accentGradient="from-red-400 to-rose-500"
              bgColor="bg-red-50 dark:bg-red-950/40"
              iconColor="text-red-600"
              hint="Needs attention"
              valueClassName="text-red-700"
              index={3}
            />
          </StatGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Incidents by Type" description="Breakdown of disciplinary incidents">
              {incidentChartData.length > 0 ? (
                <ChartContainer config={incidentChartConfig} className="h-[250px] w-full">
                  <BarChart data={incidentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="type" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ChartContainer>
              ) : (<div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No incident data yet</div>)}
            </SectionCard>
            <SectionCard title="Severity Distribution" description="Incident severity breakdown">
              <div className="flex items-center justify-center">
                <ChartContainer config={severityDonutConfig} className="h-[220px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={severityDonutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                      {severityDonutData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" /><span className="text-sm text-muted-foreground">Serious ({severityCounts.serious})</span></div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-500" /><span className="text-sm text-muted-foreground">Moderate ({severityCounts.moderate})</span></div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500" /><span className="text-sm text-muted-foreground">Minor ({severityCounts.minor})</span></div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── Incidents Tab ────────────────────────────────────────────── */}
        <TabsContent value="incidents" className="space-y-4">
          <ModuleToolbar
            search={searchQuery}
            onSearch={setSearchQuery}
            searchPlaceholder="Search incidents..."
            filters={<>
              {['ALL', 'SERIOUS', 'MODERATE', 'MINOR'].map((sev) => (
                <Button key={sev} variant={filterSeverity === sev ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', filterSeverity === sev && sev === 'SERIOUS' && 'bg-red-500 hover:bg-red-600 text-white', filterSeverity === sev && sev === 'MODERATE' && 'bg-amber-500 hover:bg-amber-600 text-white', filterSeverity === sev && sev === 'MINOR' && 'bg-emerald-500 hover:bg-emerald-600 text-white', filterSeverity === sev && sev === 'ALL' && 'bg-orange-500 hover:bg-orange-600 text-white')} onClick={() => setFilterSeverity(sev)}>
                  {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()}
                </Button>
              ))}
            </>}
            actions={<Badge variant="outline" className="text-xs">{filteredRecords.length} records</Badge>}
          />

          <SectionCard noPadding>
            <TableShell maxHeight="500px">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Incident Type</TableHead><TableHead className="text-xs">Severity</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Action</TableHead><TableHead className="text-xs text-center">Merit</TableHead><TableHead className="text-xs text-center">Demerit</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Parent</TableHead><TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const sev = incidentSeverity[record.incidentType]
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedRecord(record); setViewMode('detail') }}>
                        <TableCell className="font-medium text-sm">{record.student.firstName} {record.student.lastName}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] px-1.5 py-0 border">{incidentTypeLabels[record.incidentType] || record.incidentType}</Badge></TableCell>
                        <TableCell>{sev && <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', sev.badgeBg)}>{sev.level}</Badge>}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(record.date)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{record.action || '\u2014'}</TableCell>
                        <TableCell className="text-center">{record.meritPoints > 0 ? <span className="text-xs font-semibold text-emerald-600">+{record.meritPoints}</span> : <span className="text-xs text-muted-foreground">\u2014</span>}</TableCell>
                        <TableCell className="text-center">{record.demeritPoints > 0 ? <span className="text-xs font-semibold text-red-600">-{record.demeritPoints}</span> : <span className="text-xs text-muted-foreground">\u2014</span>}</TableCell>
                        <TableCell><Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', statusColors[record.status] || 'bg-muted text-muted-foreground')}>{record.status}</Badge></TableCell>
                        <TableCell>{record.parentNotified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-xs text-muted-foreground">No</span>}</TableCell>
                        <TableCell><Eye className="h-4 w-4 text-muted-foreground" /></TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredRecords.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">No discipline records found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Merit Board Tab ──────────────────────────────────────────── */}
        <TabsContent value="merit" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 relative flex items-center justify-center">
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5" />
              <div className="text-center text-white relative z-10">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-90" />
                <h2 className="text-2xl font-bold">Merit Leaderboard</h2>
                <p className="text-sm text-emerald-100 mt-1">Top students by net merit points</p>
              </div>
            </div>
          </Card>
          {meritBoard.length > 0 ? (
            <div className="space-y-3">
              {meritBoard.map((entry, index) => {
                const initials = `${entry.student.firstName[0]}${entry.student.lastName[0]}`
                const rank = index + 1
                return (
                  <motion.div key={entry.student.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className={cn('border-0 shadow-md hover:shadow-lg transition-shadow', rank === 1 && 'ring-2 ring-amber-400', rank === 2 && 'ring-2 ring-gray-300', rank === 3 && 'ring-2 ring-amber-600')}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg', rank === 1 && 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white', rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 text-white', rank === 3 && 'bg-gradient-to-br from-amber-600 to-amber-700 text-white', rank > 3 && 'bg-muted text-muted-foreground')}>
                            {rank <= 3 ? <Medal className="h-6 w-6" /> : <span>{rank}</span>}
                          </div>
                          <Avatar className="h-10 w-10 border-2 border-emerald-200">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{entry.student.firstName} {entry.student.lastName}</p>
                            <p className="text-xs text-muted-foreground">{entry.student.studentNumber}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center"><p className="text-xs text-muted-foreground">Merit</p><p className="text-sm font-bold text-emerald-600">+{entry.merit}</p></div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="text-center"><p className="text-xs text-muted-foreground">Demerit</p><p className="text-sm font-bold text-red-500">-{entry.demerit}</p></div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="text-center px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                              <p className="text-xs text-emerald-600">Net</p>
                              <p className={cn('text-lg font-bold', entry.net >= 0 ? 'text-emerald-700' : 'text-red-600')}>{entry.net >= 0 ? '+' : ''}{entry.net}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <SectionCard>
              <KitEmptyState
                icon={Award}
                title="No merit data available yet"
                description="Record incidents to see the leaderboard."
              />
            </SectionCard>
          )}
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
