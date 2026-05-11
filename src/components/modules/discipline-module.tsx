'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Scale,
  Shield,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  Star,
  Loader2,
  Gavel,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Trophy,
  Medal,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
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
  const [records, setRecords] = useState<DisciplineRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('ALL')

  // Dialog states
  const [addIncidentOpen, setAddIncidentOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/discipline')
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
      }
    } catch (err) {
      console.error('Failed to fetch discipline data:', err)
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
    if (addIncidentOpen) fetchStudents()
  }, [addIncidentOpen, fetchStudents])

  // ─── Form Handler ──────────────────────────────────────────────────────

  const handleAddIncident = async () => {
    if (!form.studentId || !form.incidentType || !form.description) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/discipline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          incidentType: form.incidentType,
          description: form.description,
          date: form.date,
          action: form.action || undefined,
          meritPoints: parseInt(form.meritPoints) || 0,
          demeritPoints: parseInt(form.demeritPoints) || 0,
          parentNotified: form.parentNotified,
        }),
      })
      if (res.ok) {
        setAddIncidentOpen(false)
        setForm({
          studentId: '',
          incidentType: 'LATE_COMING',
          description: '',
          date: new Date().toISOString().split('T')[0],
          action: '',
          meritPoints: '0',
          demeritPoints: '0',
          parentNotified: false,
        })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add incident:', err)
    } finally {
      setSubmitting(false)
    }
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

  // Merit board
  const studentPointsMap = records.reduce<Record<string, { merit: number; demerit: number; student: Student }>>((acc, r) => {
    if (!acc[r.studentId]) {
      acc[r.studentId] = { merit: 0, demerit: 0, student: r.student }
    }
    acc[r.studentId].merit += r.meritPoints
    acc[r.studentId].demerit += r.demeritPoints
    return acc
  }, {})

  const meritBoard = Object.values(studentPointsMap)
    .map((s) => ({ ...s, net: s.merit - s.demerit }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 10)

  // Filtered records
  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(q) ||
      r.incidentType.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  }).filter((r) => {
    if (filterSeverity === 'ALL') return true
    return incidentSeverity[r.incidentType]?.level?.toUpperCase() === filterSeverity
  })

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 bg-muted animate-pulse rounded" />
          <div className="h-10 w-44 bg-muted animate-pulse rounded" />
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
            <Scale className="h-6 w-6 text-orange-500" />
            Discipline & Behaviour
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage disciplinary incidents and student behaviour</p>
        </div>
        <Dialog open={addIncidentOpen} onOpenChange={setAddIncidentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Add Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-orange-500" />
                Record Disciplinary Incident
              </DialogTitle>
              <DialogDescription>Record a new disciplinary incident for a student</DialogDescription>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Incident Type</Label>
                    <Select
                      value={form.incidentType}
                      onValueChange={(v) => setForm((p) => ({ ...p, incidentType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the incident in detail..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Action Taken</Label>
                  <Textarea
                    placeholder="Describe the disciplinary action taken..."
                    value={form.action}
                    onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                      Merit Points
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.meritPoints}
                      onChange={(e) => setForm((p) => ({ ...p, meritPoints: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      Demerit Points
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.demeritPoints}
                      onChange={(e) => setForm((p) => ({ ...p, demeritPoints: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <Checkbox
                    id="parentNotified"
                    checked={form.parentNotified}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, parentNotified: !!checked }))}
                    className="border-orange-300"
                  />
                  <div className="grid gap-0.5">
                    <Label htmlFor="parentNotified" className="text-sm font-medium flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-orange-500" />
                      Parent / Guardian Notified
                    </Label>
                    <span className="text-xs text-muted-foreground">Confirm that the parent or guardian has been informed</span>
                  </div>
                </div>
                {form.incidentType && incidentSeverity[form.incidentType] && (
                  <div className={cn('p-3 rounded-lg border', 
                    incidentSeverity[form.incidentType].level === 'Serious' ? 'bg-red-50 border-red-100' :
                    incidentSeverity[form.incidentType].level === 'Moderate' ? 'bg-amber-50 border-amber-100' :
                    'bg-emerald-50 border-emerald-100'
                  )}>
                    <span className={cn('text-xs font-medium', incidentSeverity[form.incidentType].color)}>
                      Severity: {incidentSeverity[form.incidentType].level}
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddIncidentOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddIncident}
                disabled={submitting || !form.studentId || !form.description}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Incident
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Incidents
          </TabsTrigger>
          <TabsTrigger value="merit" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Merit Board
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Cases</p>
                    <p className="text-2xl font-bold tracking-tight">{openCases}</p>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Pending resolution</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resolved This Term</p>
                    <p className="text-2xl font-bold tracking-tight">{resolvedThisTerm}</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Cases closed</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Merit Points Total</p>
                    <p className="text-2xl font-bold tracking-tight text-emerald-700">{totalMerit}</p>
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Positive behaviour</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-green-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Demerit Points Total</p>
                    <p className="text-2xl font-bold tracking-tight text-red-700">{totalDemerit}</p>
                    <div className="flex items-center gap-1.5">
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-500">Needs attention</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400 to-rose-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Incident Type Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Incidents by Type</CardTitle>
                <CardDescription>Breakdown of disciplinary incidents</CardDescription>
              </CardHeader>
              <CardContent>
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
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No incident data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Severity Donut */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Severity Distribution</CardTitle>
                <CardDescription>Incident severity breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={severityDonutConfig} className="h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={severityDonutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {severityDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Serious ({severityCounts.serious})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-muted-foreground">Moderate ({severityCounts.moderate})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Minor ({severityCounts.minor})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Incidents Tab ────────────────────────────────────────────── */}
        <TabsContent value="incidents" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'SERIOUS', 'MODERATE', 'MINOR'].map((sev) => (
                <Button
                  key={sev}
                  variant={filterSeverity === sev ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    filterSeverity === sev && sev === 'SERIOUS' && 'bg-red-500 hover:bg-red-600 text-white',
                    filterSeverity === sev && sev === 'MODERATE' && 'bg-amber-500 hover:bg-amber-600 text-white',
                    filterSeverity === sev && sev === 'MINOR' && 'bg-emerald-500 hover:bg-emerald-600 text-white',
                    filterSeverity === sev && sev === 'ALL' && 'bg-orange-500 hover:bg-orange-600 text-white',
                  )}
                  onClick={() => setFilterSeverity(sev)}
                >
                  {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredRecords.length} records
            </Badge>
          </div>

          {/* Incidents Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Incident Type</TableHead>
                      <TableHead className="text-xs">Severity</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs text-center">Merit</TableHead>
                      <TableHead className="text-xs text-center">Demerit</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Parent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const severity = incidentSeverity[record.incidentType]
                      return (
                        <TableRow key={record.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">
                            {record.student.firstName} {record.student.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border">
                              {incidentTypeLabels[record.incidentType] || record.incidentType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {severity && (
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', severity.badgeBg)}>
                                {severity.level}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {record.action || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {record.meritPoints > 0 && (
                              <span className="text-xs font-semibold text-emerald-600">+{record.meritPoints}</span>
                            )}
                            {record.meritPoints === 0 && <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {record.demeritPoints > 0 && (
                              <span className="text-xs font-semibold text-red-600">-{record.demeritPoints}</span>
                            )}
                            {record.demeritPoints === 0 && <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', statusColors[record.status] || 'bg-gray-100 text-gray-700')}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.parentNotified ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                          No discipline records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
                  <motion.div
                    key={entry.student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      'border-0 shadow-md hover:shadow-lg transition-shadow',
                      rank === 1 && 'ring-2 ring-amber-400',
                      rank === 2 && 'ring-2 ring-gray-300',
                      rank === 3 && 'ring-2 ring-amber-600',
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg',
                            rank === 1 && 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white',
                            rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 text-white',
                            rank === 3 && 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
                            rank > 3 && 'bg-muted text-muted-foreground',
                          )}>
                            {rank <= 3 ? (
                              <Medal className="h-6 w-6" />
                            ) : (
                              <span>{rank}</span>
                            )}
                          </div>

                          {/* Student Info */}
                          <Avatar className="h-10 w-10 border-2 border-emerald-200">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{entry.student.firstName} {entry.student.lastName}</p>
                            <p className="text-xs text-muted-foreground">{entry.student.studentNumber}</p>
                          </div>

                          {/* Points */}
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Merit</p>
                              <p className="text-sm font-bold text-emerald-600">+{entry.merit}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Demerit</p>
                              <p className="text-sm font-bold text-red-500">-{entry.demerit}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="text-center px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                              <p className="text-xs text-emerald-600">Net</p>
                              <p className={cn(
                                'text-lg font-bold',
                                entry.net >= 0 ? 'text-emerald-700' : 'text-red-600'
                              )}>
                                {entry.net >= 0 ? '+' : ''}{entry.net}
                              </p>
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
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No merit data yet. Record incidents with merit/demerit points to see the leaderboard.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
