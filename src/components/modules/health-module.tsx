'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  HeartPulse,
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
  Syringe,
  Activity,
  Stethoscope,
  Loader2,
  Ambulance,
  Pill,
  Thermometer,
  FileHeart,
  Clipboard,
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const isToday = (dateStr: string) => {
  const d = new Date(dateStr)
  const today = new Date()
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
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
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfidential, setShowConfidential] = useState(false)

  // Dialog states
  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Medical profile dialog
  const [profileStudent, setProfileStudent] = useState<Student | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

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

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
      }
    } catch (err) {
      console.error('Failed to fetch health data:', err)
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
    if (addRecordOpen || quickAddOpen) fetchStudents()
  }, [addRecordOpen, quickAddOpen, fetchStudents])

  // ─── Form Handlers ─────────────────────────────────────────────────────

  const handleAddRecord = async () => {
    if (!form.studentId || !form.visitType || !form.description) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setAddRecordOpen(false)
        setForm({
          studentId: '',
          visitType: 'SICK_BAY',
          description: '',
          treatment: '',
          medicationGiven: '',
          referredTo: '',
          isConfidential: false,
        })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add health record:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickAdd = async () => {
    if (!quickForm.studentId || !quickForm.description) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: quickForm.studentId,
          visitType: 'SICK_BAY',
          description: quickForm.description,
          treatment: quickForm.treatment || undefined,
          medicationGiven: quickForm.medicationGiven || undefined,
        }),
      })
      if (res.ok) {
        setQuickAddOpen(false)
        setQuickForm({ studentId: '', description: '', treatment: '', medicationGiven: '' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add sick bay record:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Computed Data ─────────────────────────────────────────────────────

  const sickBayVisits = records.filter((r) => r.visitType === 'SICK_BAY').length
  const hospitalReferrals = records.filter((r) => r.visitType === 'HOSPITAL').length
  const immunisationRecords = records.filter((r) => r.visitType === 'IMMUNISATION').length

  // Chronic conditions from student data
  const studentsWithChronic = students.filter(
    (s) => s.chronicConditions && s.chronicConditions.trim() !== ''
  ).length

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
    return (
      `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(q) ||
      r.visitType.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  })

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-36 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-red-500" />
            Health & Clinic
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Student health records, sick bay, and wellness management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'border-red-200',
              showConfidential ? 'text-red-700 bg-red-50' : 'text-muted-foreground'
            )}
            onClick={() => setShowConfidential(!showConfidential)}
          >
            {showConfidential ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showConfidential ? 'Confidential Visible' : 'Show Confidential'}
          </Button>

          <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                <Thermometer className="mr-2 h-4 w-4" />
                Quick Sick Bay
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  Quick Sick Bay Entry
                </DialogTitle>
                <DialogDescription>Record a sick bay visit for today</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Student</Label>
                  <Select
                    value={quickForm.studentId}
                    onValueChange={(v) => setQuickForm((p) => ({ ...p, studentId: v }))}
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
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What is the student complaining of?"
                    value={quickForm.description}
                    onChange={(e) => setQuickForm((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Treatment</Label>
                  <Input
                    placeholder="Treatment given..."
                    value={quickForm.treatment}
                    onChange={(e) => setQuickForm((p) => ({ ...p, treatment: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Medication Given</Label>
                  <Input
                    placeholder="Medication details..."
                    value={quickForm.medicationGiven}
                    onChange={(e) => setQuickForm((p) => ({ ...p, medicationGiven: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuickAddOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleQuickAdd}
                  disabled={submitting || !quickForm.studentId || !quickForm.description}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Visit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Health Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileHeart className="h-5 w-5 text-red-500" />
                  Add Health Record
                </DialogTitle>
                <DialogDescription>Record a new health visit or medical event</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="grid gap-4 py-4 pr-4">
                  <div className="grid gap-2">
                    <Label>Student</Label>
                    <Select
                      value={form.studentId}
                      onValueChange={(v) => setForm((p) => ({ ...p, studentId: v }))}
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
                  <div className="grid gap-2">
                    <Label>Visit Type</Label>
                    <Select
                      value={form.visitType}
                      onValueChange={(v) => setForm((p) => ({ ...p, visitType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the health concern or visit reason..."
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Treatment</Label>
                    <Textarea
                      placeholder="Treatment administered..."
                      value={form.treatment}
                      onChange={(e) => setForm((p) => ({ ...p, treatment: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1.5">
                        <Pill className="h-3.5 w-3.5 text-teal-500" />
                        Medication Given
                      </Label>
                      <Input
                        placeholder="Medication details..."
                        value={form.medicationGiven}
                        onChange={(e) => setForm((p) => ({ ...p, medicationGiven: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Referred To</Label>
                      <Input
                        placeholder="e.g., Parirenyatwa Hospital"
                        value={form.referredTo}
                        onChange={(e) => setForm((p) => ({ ...p, referredTo: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                    <Checkbox
                      id="healthConfidential"
                      checked={form.isConfidential}
                      onCheckedChange={(checked) => setForm((p) => ({ ...p, isConfidential: !!checked }))}
                      className="border-red-300"
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="healthConfidential" className="text-sm font-medium flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-red-500" />
                        Confidential Record
                      </Label>
                      <span className="text-xs text-muted-foreground">Restrict access to authorised medical personnel only</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddRecordOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleAddRecord}
                  disabled={submitting || !form.studentId || !form.description}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Records
          </TabsTrigger>
          <TabsTrigger value="sickbay" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Sick Bay Today
          </TabsTrigger>
          <TabsTrigger value="profiles" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Medical Profiles
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sick Bay Visits</p>
                    <p className="text-2xl font-bold tracking-tight">{sickBayVisits}</p>
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">This term</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Thermometer className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hospital Referrals</p>
                    <p className="text-2xl font-bold tracking-tight">{hospitalReferrals}</p>
                    <div className="flex items-center gap-1.5">
                      <Ambulance className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-500">Referred out</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <Ambulance className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400 to-rose-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Immunisation Records</p>
                    <p className="text-2xl font-bold tracking-tight">{immunisationRecords}</p>
                    <div className="flex items-center gap-1.5">
                      <Syringe className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">Vaccinations</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
                    <Syringe className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-400 to-violet-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chronic Conditions</p>
                    <p className="text-2xl font-bold tracking-tight">{studentsWithChronic}</p>
                    <div className="flex items-center gap-1.5">
                      <HeartPulse className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Ongoing care</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <HeartPulse className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Visit Type Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Visits by Type</CardTitle>
                <CardDescription>Health visit distribution</CardDescription>
              </CardHeader>
              <CardContent>
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
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No health data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visit Type Donut */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Visit Distribution</CardTitle>
                <CardDescription>Breakdown by visit type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={visitDonutConfig} className="h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={visitDonutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {visitDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  {visitDonutData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{
                        backgroundColor:
                          item.name === 'Sick Bay' ? '#14b8a6' :
                          item.name === 'Injury' ? '#f97316' :
                          item.name === 'Hospital' ? '#ef4444' :
                          item.name === 'Checkup' ? '#10b981' : '#a855f7'
                      }} />
                      <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Records Tab ──────────────────────────────────────────────── */}
        <TabsContent value="records" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search health records..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredRecords.length} records
            </Badge>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Visit Type</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Treatment</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const isHidden = record.isConfidential && !showConfidential
                      const VisitIcon = visitTypeIcons[record.visitType] || Stethoscope
                      return (
                        <TableRow key={record.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">
                            {isHidden ? (
                              <span className="text-muted-foreground italic">Confidential</span>
                            ) : (
                              `${record.student.firstName} ${record.student.lastName}`
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', visitTypeColors[record.visitType] || 'bg-gray-100 text-gray-700')}>
                              <VisitIcon className="mr-1 h-3 w-3" />
                              {visitTypeLabels[record.visitType] || record.visitType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {isHidden ? '••••••' : record.description}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {isHidden ? '••••••' : (record.treatment || '—')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(record.visitDate)}
                          </TableCell>
                          <TableCell>
                            {record.isConfidential ? (
                              <div className="flex items-center gap-1 text-red-500">
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
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          No health records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Sick Bay Today Tab ───────────────────────────────────────── */}
        <TabsContent value="sickbay" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Today&apos;s Sick Bay Visits</h2>
              <p className="text-sm text-muted-foreground">{todayVisits.length} visit{todayVisits.length !== 1 ? 's' : ''} recorded today</p>
            </div>
            <Button
              onClick={() => setQuickAddOpen(true)}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Visit
            </Button>
          </div>

          {todayVisits.length > 0 ? (
            <div className="space-y-3">
              {todayVisits.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 shrink-0">
                          <Thermometer className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              {record.student.firstName} {record.student.lastName}
                            </p>
                            {record.isConfidential && (
                              <Lock className="h-3.5 w-3.5 text-red-400" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{record.student.studentNumber}</p>
                          <p className="text-sm mt-2">
                            {record.isConfidential && !showConfidential ? (
                              <span className="text-muted-foreground italic">Confidential</span>
                            ) : (
                              record.description
                            )}
                          </p>
                          {(record.treatment || record.medicationGiven) && !(record.isConfidential && !showConfidential) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {record.treatment && (
                                <Badge variant="secondary" className="text-[10px]">
                                  <Clipboard className="mr-1 h-3 w-3" />
                                  {record.treatment}
                                </Badge>
                              )}
                              {record.medicationGiven && (
                                <Badge variant="secondary" className="text-[10px]">
                                  <Pill className="mr-1 h-3 w-3" />
                                  {record.medicationGiven}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.visitDate).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {record.referredTo && (
                            <Badge variant="outline" className="mt-1 text-[10px] text-amber-700 border-amber-200 bg-amber-50">
                              <Ambulance className="mr-1 h-3 w-3" />
                              Referred
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No sick bay visits recorded today.</p>
                <Button
                  variant="outline"
                  className="mt-3 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => setQuickAddOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Visit
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Medical Profiles Tab ─────────────────────────────────────── */}
        <TabsContent value="profiles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Student Medical Profiles</h2>
              <p className="text-sm text-muted-foreground">View allergies, chronic conditions, and medications</p>
            </div>
          </div>

          {students.filter((s) => s.allergies || s.chronicConditions || s.medications).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students
                .filter((s) => s.allergies || s.chronicConditions || s.medications)
                .slice(0, 12)
                .map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => { setProfileStudent(student); setProfileOpen(true) }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-rose-500 text-white text-sm font-bold shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-muted-foreground">{student.studentNumber}</p>
                          </div>
                          {student.bloodGroup && (
                            <Badge variant="outline" className="ml-auto text-[10px] text-red-700 border-red-200">
                              {student.bloodGroup}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          {student.allergies && (
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50/80 border border-red-100">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-medium text-red-600 uppercase tracking-wide">Allergies</p>
                                <p className="text-xs text-red-700">{student.allergies}</p>
                              </div>
                            </div>
                          )}
                          {student.chronicConditions && (
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/80 border border-amber-100">
                              <HeartPulse className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Chronic Conditions</p>
                                <p className="text-xs text-amber-700">{student.chronicConditions}</p>
                              </div>
                            </div>
                          )}
                          {student.medications && (
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-teal-50/80 border border-teal-100">
                              <Pill className="h-3.5 w-3.5 text-teal-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-medium text-teal-600 uppercase tracking-wide">Medications</p>
                                <p className="text-xs text-teal-700">{student.medications}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No medical profiles with conditions recorded yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Medical Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {profileStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-red-500" />
                  Medical Profile
                </DialogTitle>
                <DialogDescription>
                  {profileStudent.firstName} {profileStudent.lastName} ({profileStudent.studentNumber})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {profileStudent.bloodGroup && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <span className="text-xs font-bold text-red-600">{profileStudent.bloodGroup}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Group</p>
                      <p className="text-sm font-semibold text-red-700">{profileStudent.bloodGroup}</p>
                    </div>
                  </div>
                )}
                {profileStudent.allergies && (
                  <div className="p-3 rounded-lg bg-red-50/80 border border-red-100">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Allergies</p>
                    <p className="text-sm text-red-800">{profileStudent.allergies}</p>
                  </div>
                )}
                {profileStudent.chronicConditions && (
                  <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-100">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Chronic Conditions</p>
                    <p className="text-sm text-amber-800">{profileStudent.chronicConditions}</p>
                  </div>
                )}
                {profileStudent.medications && (
                  <div className="p-3 rounded-lg bg-teal-50/80 border border-teal-100">
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-1">Current Medications</p>
                    <p className="text-sm text-teal-800">{profileStudent.medications}</p>
                  </div>
                )}
                {profileStudent.doctorName && (
                  <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Doctor</p>
                    <p className="text-sm text-emerald-800">{profileStudent.doctorName}</p>
                    {profileStudent.doctorPhone && (
                      <p className="text-xs text-emerald-600 mt-1">{profileStudent.doctorPhone}</p>
                    )}
                  </div>
                )}
                {!(profileStudent.allergies || profileStudent.chronicConditions || profileStudent.medications || profileStudent.doctorName) && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No medical information recorded for this student.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
