'use client'

import { ModuleContainer, ModulePageLayout, ModuleSettingsButton, StatGrid, ModuleStatCard, SectionCard, TableShell } from '@/components/module-ui';
import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  Shield,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Users,
  Baby,
  UserCheck,
  Loader2,
  HandHeart,
  FileText,
  ArrowLeft,
  Settings,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
  beamStatus?: string | null
}

interface WelfareRecord {
  id: string
  studentId: string
  category: string
  description: string | null
  actionTaken: string | null
  referredTo: string | null
  status: string
  isConfidential: boolean
  createdAt: string
  updatedAt: string
  student: Student
}

interface BeamApplication {
  id: string
  studentId: string
  applicationDate: string
  status: string
  coveredAmount: number
  outstandingBalance: number
  socialWelfareRef: string | null
  guardianSituation: string | null
  orphanStatus: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  student: Student
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

const categoryColors: Record<string, string> = {
  VULNERABLE: 'bg-amber-100 text-amber-700 border-amber-200',
  ORPHAN: 'bg-rose-100 text-rose-700 border-rose-200',
  CHILD_HEADED: 'bg-red-100 text-red-700 border-red-200',
  DISABLED: 'bg-purple-100 text-purple-700 border-purple-200',
  CHRONIC_ILLNESS: 'bg-teal-100 text-teal-700 border-teal-200',
}

const categoryLabels: Record<string, string> = {
  VULNERABLE: 'Vulnerable',
  ORPHAN: 'Orphan',
  CHILD_HEADED: 'Child-Headed',
  DISABLED: 'Disabled',
  CHRONIC_ILLNESS: 'Chronic Illness',
}

const categoryVulnerabilityLevel: Record<string, { level: string; color: string }> = {
  VULNERABLE: { level: 'Moderate', color: 'text-amber-600 bg-amber-50' },
  ORPHAN: { level: 'High', color: 'text-rose-600 bg-rose-50' },
  CHILD_HEADED: { level: 'Critical', color: 'text-red-600 bg-red-50' },
  DISABLED: { level: 'High', color: 'text-purple-600 bg-purple-50' },
  CHRONIC_ILLNESS: { level: 'Moderate', color: 'text-teal-600 bg-teal-50' },
}

const welfareStatusColors: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-teal-100 text-teal-700 border-teal-200',
  RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-muted text-muted-foreground border-border',
}

const beamStatusColors: Record<string, string> = {
  APPLIED: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  RENEWAL: 'bg-teal-100 text-teal-700 border-teal-200',
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const categoryChartConfig = {
  count: { label: 'Cases', color: '#10b981' },
} satisfies ChartConfig

const statusDonutConfig = {
  open: { label: 'Open', color: '#f59e0b' },
  inProgress: { label: 'In Progress', color: '#14b8a6' },
  resolved: { label: 'Resolved', color: '#10b981' },
  closed: { label: 'Closed', color: '#9ca3af' },
} satisfies ChartConfig

// ─── Welfare Module ─────────────────────────────────────────────────────────

export default function WelfareModule() {
  const [welfareRecords, setWelfareRecords] = useState<WelfareRecord[]>([])
  const [beamApplications, setBeamApplications] = useState<BeamApplication[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [beamSearch, setBeamSearch] = useState('')
  const [showConfidential, setShowConfidential] = useState(false)

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'detail' | 'settings'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addType, setAddType] = useState<'welfare' | 'beam'>('welfare')
  const [submitting, setSubmitting] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    defaultConfidential: true,
    caseAutoAssign: false,
    referralTracking: true,
    fundingSourceRequired: false,
    reportFormat: 'detailed',
  })

  // Welfare form
  const [welfareForm, setWelfareForm] = useState({
    studentId: '',
    category: 'VULNERABLE',
    description: '',
    actionTaken: '',
    referredTo: '',
    isConfidential: true,
  })

  // BEAM form
  const [beamForm, setBeamForm] = useState({
    studentId: '',
    guardianSituation: '',
    orphanStatus: '',
    notes: '',
    coveredAmount: '',
    outstandingBalance: '',
  })

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/welfare')
      if (res.ok) {
        const data = await res.json()
        setWelfareRecords(data.welfareRecords || [])
        setBeamApplications(data.beamApplications || [])
      }
    } catch (err) {
      console.error('Failed to fetch welfare data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (viewMode === 'add') fetchStudents()
  }, [viewMode, fetchStudents])

  // ─── Form Handlers ─────────────────────────────────────────────────────

  const handleAddWelfare = async () => {
    if (!welfareForm.studentId || !welfareForm.category) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welfare',
          ...welfareForm,
        }),
      })
      if (res.ok) {
        setViewMode('list')
        setWelfareForm({
          studentId: '',
          category: 'VULNERABLE',
          description: '',
          actionTaken: '',
          referredTo: '',
          isConfidential: true,
        })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add welfare record:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplyBeam = async () => {
    if (!beamForm.studentId) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'beam',
          studentId: beamForm.studentId,
          guardianSituation: beamForm.guardianSituation || undefined,
          orphanStatus: beamForm.orphanStatus || undefined,
          notes: beamForm.notes || undefined,
          coveredAmount: beamForm.coveredAmount ? parseFloat(beamForm.coveredAmount) : 0,
          outstandingBalance: beamForm.outstandingBalance ? parseFloat(beamForm.outstandingBalance) : 0,
        }),
      })
      if (res.ok) {
        setViewMode('list')
        setBeamForm({
          studentId: '',
          guardianSituation: '',
          orphanStatus: '',
          notes: '',
          coveredAmount: '',
          outstandingBalance: '',
        })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to apply for BEAM:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Computed Data ─────────────────────────────────────────────────────

  const totalCases = welfareRecords.length
  const orphans = welfareRecords.filter((r) => r.category === 'ORPHAN').length
  const vulnerable = welfareRecords.filter((r) => r.category === 'VULNERABLE').length
  const beamCount = beamApplications.length
  const beamApproved = beamApplications.filter((b) => b.status === 'APPROVED').length

  const categoryBreakdown = welfareRecords.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {})

  const categoryChartData = Object.entries(categoryBreakdown).map(([cat, count]) => ({
    category: categoryLabels[cat] || cat,
    count,
  }))

  const statusBreakdown = {
    open: welfareRecords.filter((r) => r.status === 'OPEN').length,
    inProgress: welfareRecords.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: welfareRecords.filter((r) => r.status === 'RESOLVED').length,
    closed: welfareRecords.filter((r) => r.status === 'CLOSED').length,
  }

  const statusDonutData = [
    { name: 'Open', value: statusBreakdown.open, fill: 'var(--color-open)' },
    { name: 'In Progress', value: statusBreakdown.inProgress, fill: 'var(--color-inProgress)' },
    { name: 'Resolved', value: statusBreakdown.resolved, fill: 'var(--color-resolved)' },
    { name: 'Closed', value: statusBreakdown.closed, fill: 'var(--color-closed)' },
  ]

  const filteredRecords = welfareRecords.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    )
  })

  const filteredBeam = beamApplications.filter((b) => {
    if (!beamSearch) return true
    const q = beamSearch.toLowerCase()
    return (
      `${b.student.firstName} ${b.student.lastName}`.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    )
  })

  const totalBeamCovered = beamApplications.reduce((sum, b) => sum + b.coveredAmount, 0)
  const totalBeamOutstanding = beamApplications.reduce((sum, b) => sum + b.outstandingBalance, 0)

  // Settings view
  if (viewMode === 'settings') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-6 w-6 text-rose-500" /> Welfare Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure welfare and BEAM module preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Programme Defaults" description="Default settings for new welfare cases">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Default Confidential</p><p className="text-xs text-muted-foreground">New cases are confidential by default</p></div>
                <Switch checked={settings.defaultConfidential} onCheckedChange={(v) => setSettings({...settings, defaultConfidential: v})} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Auto-Assign Cases</p><p className="text-xs text-muted-foreground">Automatically assign cases to staff</p></div>
                <Switch checked={settings.caseAutoAssign} onCheckedChange={(v) => setSettings({...settings, caseAutoAssign: v})} />
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Referral & Funding" description="Referral and funding source settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Referral Tracking</p><p className="text-xs text-muted-foreground">Track external referrals</p></div>
                <Switch checked={settings.referralTracking} onCheckedChange={(v) => setSettings({...settings, referralTracking: v})} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Funding Source Required</p><p className="text-xs text-muted-foreground">Require funding source for BEAM</p></div>
                <Switch checked={settings.fundingSourceRequired} onCheckedChange={(v) => setSettings({...settings, fundingSourceRequired: v})} />
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Report Format" description="Default format for welfare reports">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Report Format</p><p className="text-xs text-muted-foreground">Choose report detail level</p></div>
                <Select value={settings.reportFormat} onValueChange={(v) => setSettings({...settings, reportFormat: v})}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="flex justify-end">
          <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white" onClick={() => { toast.success('Settings saved successfully'); setViewMode('list') }}>Save Settings</Button>
        </div>
      </div>
    )
  }

  // Add welfare/BEAM record view
  if (viewMode === 'add') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {addType === 'welfare' ? <><Heart className="h-6 w-6 text-rose-500" /> Add Welfare Record</> : <><Shield className="h-6 w-6 text-emerald-500" /> Apply for BEAM</>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{addType === 'welfare' ? 'Record a new welfare case for a student. Confidential by default.' : 'Submit a BEAM (Basic Education Assistance Module) application.'}</p>
        </div>
        <SectionCard contentClassName="p-6 space-y-4">
            <div className="grid gap-2">
              <Label>Student</Label>
              <Select value={addType === 'welfare' ? welfareForm.studentId : beamForm.studentId} onValueChange={(v) => addType === 'welfare' ? setWelfareForm((p) => ({ ...p, studentId: v })) : setBeamForm((p) => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Search and select student..." /></SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            {addType === 'welfare' ? (
              <>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={welfareForm.category} onValueChange={(v) => setWelfareForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VULNERABLE">Vulnerable</SelectItem>
                      <SelectItem value="ORPHAN">Orphan</SelectItem>
                      <SelectItem value="CHILD_HEADED">Child-Headed</SelectItem>
                      <SelectItem value="DISABLED">Disabled</SelectItem>
                      <SelectItem value="CHRONIC_ILLNESS">Chronic Illness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Description</Label><Textarea placeholder="Describe the welfare concern..." value={welfareForm.description} onChange={(e) => setWelfareForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
                <div className="grid gap-2"><Label>Action Taken</Label><Textarea placeholder="Describe actions taken..." value={welfareForm.actionTaken} onChange={(e) => setWelfareForm((p) => ({ ...p, actionTaken: e.target.value }))} rows={2} /></div>
                <div className="grid gap-2"><Label>Referred To</Label><Input placeholder="e.g., Social Welfare, DSW, NGO" value={welfareForm.referredTo} onChange={(e) => setWelfareForm((p) => ({ ...p, referredTo: e.target.value }))} /></div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-100">
                  <Checkbox id="confidential" checked={welfareForm.isConfidential} onCheckedChange={(checked) => setWelfareForm((p) => ({ ...p, isConfidential: !!checked }))} className="border-rose-300" />
                  <div className="grid gap-0.5">
                    <Label htmlFor="confidential" className="text-sm font-medium flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-rose-500" />Confidential Record</Label>
                    <span className="text-xs text-muted-foreground">Restrict access to authorised personnel only</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2"><Label>Guardian Situation</Label><Textarea placeholder="Describe the guardian/parent situation..." value={beamForm.guardianSituation} onChange={(e) => setBeamForm((p) => ({ ...p, guardianSituation: e.target.value }))} rows={3} /></div>
                <div className="grid gap-2">
                  <Label>Orphan Status</Label>
                  <Select value={beamForm.orphanStatus} onValueChange={(v) => setBeamForm((p) => ({ ...p, orphanStatus: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select orphan status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Not an Orphan</SelectItem>
                      <SelectItem value="SINGLE_ORPHAN">Single Orphan</SelectItem>
                      <SelectItem value="DOUBLE_ORPHAN">Double Orphan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Covered Amount (USD)</Label><Input type="number" placeholder="0.00" value={beamForm.coveredAmount} onChange={(e) => setBeamForm((p) => ({ ...p, coveredAmount: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>Outstanding Balance (USD)</Label><Input type="number" placeholder="0.00" value={beamForm.outstandingBalance} onChange={(e) => setBeamForm((p) => ({ ...p, outstandingBalance: e.target.value }))} /></div>
                </div>
                <div className="grid gap-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={beamForm.notes} onChange={(e) => setBeamForm((p) => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-amber-700">BEAM applications are processed by the Department of Social Welfare</span>
                </div>
              </>
            )}
        </SectionCard>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
          <Button className={addType === 'welfare' ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'} disabled={submitting} onClick={addType === 'welfare' ? handleAddWelfare : handleApplyBeam}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {addType === 'welfare' ? 'Add Record' : 'Submit Application'}
          </Button>
        </div>
      </div>
    )
  }

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-40 bg-muted animate-pulse rounded" />
            <div className="h-10 w-36 bg-muted animate-pulse rounded" />
          </div>
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

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
<ModulePageLayout
        actions={<>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'border-rose-200',
              showConfidential ? 'text-rose-700 bg-rose-50' : 'text-muted-foreground'
            )}
            onClick={() => setShowConfidential(!showConfidential)}
          >
            {showConfidential ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showConfidential ? 'Confidential Visible' : 'Show Confidential'}
          </Button>
          <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md" onClick={() => { setAddType('welfare'); setViewMode('add') }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Welfare Record
          </Button>
          <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => { setAddType('beam'); setViewMode('add') }}>
            <HandHeart className="mr-2 h-4 w-4" />
            Apply for BEAM
          </Button>
          <ModuleSettingsButton onClick={() => { setViewMode('settings'); setSelectedId(null) }} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="welfare">Welfare Cases</TabsTrigger>
            <TabsTrigger value="beam">BEAM</TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <StatGrid cols={4}>
            <ModuleStatCard icon={Heart} label="Total Welfare Cases" value={totalCases} accentGradient="from-rose-400 to-pink-500" bgColor="bg-rose-50 dark:bg-rose-950/40" iconColor="text-rose-600 dark:text-rose-400" hint={`${statusBreakdown.open} open`} index={0} />
            <ModuleStatCard icon={Shield} label="BEAM Beneficiaries" value={beamCount} accentGradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600 dark:text-emerald-400" hint={`${beamApproved} approved`} index={1} />
            <ModuleStatCard icon={Baby} label="Orphans" value={orphans} accentGradient="from-rose-400 to-red-500" bgColor="bg-rose-50 dark:bg-rose-950/40" iconColor="text-rose-600 dark:text-rose-400" hint="Require support" index={2} />
            <ModuleStatCard icon={UserCheck} label="Vulnerable Children" value={vulnerable} accentGradient="from-amber-400 to-orange-500" bgColor="bg-amber-50 dark:bg-amber-950/40" iconColor="text-amber-600 dark:text-amber-400" hint="Need attention" index={3} />
          </StatGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Breakdown Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Cases by Category</CardTitle>
                <CardDescription>Welfare case distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ChartContainer config={categoryChartConfig} className="h-[250px] w-full">
                    <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No welfare data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Donut */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Case Status</CardTitle>
                <CardDescription>Current status of welfare cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={statusDonutConfig} className="h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={statusDonutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {statusDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {statusDonutData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            item.name === 'Open' ? '#f59e0b' :
                            item.name === 'In Progress' ? '#14b8a6' :
                            item.name === 'Resolved' ? '#10b981' : '#9ca3af'
                        }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BEAM Summary */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">BEAM Financial Summary</CardTitle>
                  <CardDescription>Basic Education Assistance Module coverage</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-600" onClick={() => setActiveTab('beam')}>
                  View All <TrendingUp className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Total Covered</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalBeamCovered)}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-100">
                  <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Outstanding Balance</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(totalBeamOutstanding)}</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-100">
                  <p className="text-xs text-rose-600 font-medium uppercase tracking-wide">Pending Applications</p>
                  <p className="text-xl font-bold text-rose-700 mt-1">{beamApplications.filter((b) => b.status === 'APPLIED').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Welfare Cases Tab ────────────────────────────────────────── */}
        <TabsContent value="welfare" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search welfare cases..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredRecords.length} records
            </Badge>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Vulnerability</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Action Taken</TableHead>
                      <TableHead className="text-xs">Referred To</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const vuln = categoryVulnerabilityLevel[record.category]
                      const isHidden = record.isConfidential && !showConfidential
                      return (
                        <TableRow key={record.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setViewMode('detail'); setSelectedId(record.id) }}>
                          <TableCell className="font-medium text-sm">
                            {isHidden ? (
                              <span className="text-muted-foreground italic">Confidential</span>
                            ) : (
                              `${record.student.firstName} ${record.student.lastName}`
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', categoryColors[record.category] || 'bg-muted text-muted-foreground border-border')}>
                              {categoryLabels[record.category] || record.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {vuln && (
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', vuln.color)}>
                                {vuln.level}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', welfareStatusColors[record.status] || 'bg-muted text-muted-foreground')}>
                              {record.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {isHidden ? '••••••' : (record.actionTaken || '—')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {isHidden ? '••••••' : (record.referredTo || '—')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(record.createdAt)}
                          </TableCell>
                          <TableCell>
                            {record.isConfidential ? (
                              <div className="flex items-center gap-1 text-rose-500">
                                <Lock className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-medium">Restricted</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Open</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                          No welfare records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── BEAM Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="beam" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search BEAM applications..."
                className="pl-9"
                value={beamSearch}
                onChange={(e) => setBeamSearch(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredBeam.length} applications
            </Badge>
          </div>

          {/* BEAM Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-100 text-center">
              <p className="text-xs text-amber-600 font-medium">Applied</p>
              <p className="text-lg font-bold text-amber-700">{beamApplications.filter((b) => b.status === 'APPLIED').length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 text-center">
              <p className="text-xs text-emerald-600 font-medium">Approved</p>
              <p className="text-lg font-bold text-emerald-700">{beamApproved}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50/80 border border-red-100 text-center">
              <p className="text-xs text-red-600 font-medium">Rejected</p>
              <p className="text-lg font-bold text-red-700">{beamApplications.filter((b) => b.status === 'REJECTED').length}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-100 text-center">
              <p className="text-xs text-teal-600 font-medium">Renewal</p>
              <p className="text-lg font-bold text-teal-700">{beamApplications.filter((b) => b.status === 'RENEWAL').length}</p>
            </div>
          </div>

          {/* BEAM Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Orphan Status</TableHead>
                      <TableHead className="text-xs">Covered Amount</TableHead>
                      <TableHead className="text-xs">Outstanding</TableHead>
                      <TableHead className="text-xs">SW Reference</TableHead>
                      <TableHead className="text-xs">Application Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBeam.map((app) => (
                      <TableRow key={app.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm">
                          {app.student.firstName} {app.student.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', beamStatusColors[app.status] || 'bg-muted text-muted-foreground')}>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {app.orphanStatus ? app.orphanStatus.replace('_', ' ') : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(app.coveredAmount)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-amber-600">
                          {formatCurrency(app.outstandingBalance)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {app.socialWelfareRef || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(app.applicationDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredBeam.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                          No BEAM applications found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </ModulePageLayout>
    </motion.div>
  )
}
