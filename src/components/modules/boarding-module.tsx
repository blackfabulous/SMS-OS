'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BedDouble,
  TrendingUp,
  Users,
  Home,
  Building2,
  Search,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  X,
} from 'lucide-react'
import {
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Dormitory {
  id: string
  name: string
  capacity: number
  currentOccupancy: number
  boardingAssignments: Array<{
    id: string
    bedNumber: string | null
    status: string
    student: {
      id: string
      firstName: string
      lastName: string
      studentNumber: string
      gender: string
    }
  }>
}

interface Hostel {
  id: string
  name: string
  gender: string | null
  capacity: number
  isActive: boolean
  dormitories: Dormitory[]
}

interface BoardingAssignment {
  id: string
  bedNumber: string | null
  startDate: string
  status: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentNumber: string
    gender: string
  }
  dormitory: {
    id: string
    name: string
    hostel: {
      id: string
      name: string
      gender: string | null
    }
  }
}

interface BoardingData {
  hostels: Hostel[]
  stats: {
    totalBoarders: number
    totalHostels: number
    totalDormitories: number
    totalCapacity: number
    totalOccupancy: number
    occupancyRate: string
  }
  assignments: BoardingAssignment[]
}

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
}

// ─── Chart Config ────────────────────────────────────────────────────────────

const occupancyChartConfig = {
  occupancy: { label: 'Occupancy', color: '#10b981' },
  capacity: { label: 'Capacity', color: '#d1d5db' },
} satisfies ChartConfig

// ─── Helpers ────────────────────────────────────────────────────────────────

const genderColors: Record<string, string> = {
  MALE: 'bg-teal-100 text-teal-700 border-teal-200',
  FEMALE: 'bg-rose-100 text-rose-700 border-rose-200',
  MIXED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const getCapacityColor = (occupancy: number, capacity: number) => {
  const rate = capacity > 0 ? occupancy / capacity : 0
  if (rate >= 1) return 'bg-red-500'
  if (rate >= 0.8) return 'bg-amber-500'
  return 'bg-emerald-500'
}

const getCapacityBarColor = (occupancy: number, capacity: number) => {
  const rate = capacity > 0 ? occupancy / capacity : 0
  if (rate >= 1) return 'from-red-400 to-red-500'
  if (rate >= 0.8) return 'from-amber-400 to-amber-500'
  return 'from-emerald-400 to-teal-500'
}

// ─── Boarding Module ─────────────────────────────────────────────────────────

export default function BoardingModule() {
  const [data, setData] = useState<BoardingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Form
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    dormitoryId: '',
    bedNumber: '',
  })

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/boarding')
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (err) {
      console.error('Failed to fetch boarding data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?limit=200')
      if (res.ok) {
        const d = await res.json()
        setStudents(d.data || d || [])
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (assignDialogOpen) fetchStudents()
  }, [assignDialogOpen, fetchStudents])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!assignForm.studentId || !assignForm.dormitoryId) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/boarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          studentId: assignForm.studentId,
          dormitoryId: assignForm.dormitoryId,
          bedNumber: assignForm.bedNumber || undefined,
        }),
      })
      if (res.ok) {
        setAssignDialogOpen(false)
        setAssignForm({ studentId: '', dormitoryId: '', bedNumber: '' })
        fetchData()
      } else {
        const err = await res.json()
        console.error('Assignment error:', err.error)
      }
    } catch (err) {
      console.error('Failed to assign boarder:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Chart Data ────────────────────────────────────────────────────────

  const occupancyChartData = data
    ? data.hostels.map((h) => ({
        name: h.name.length > 12 ? h.name.slice(0, 12) + '...' : h.name,
        occupancy: h.dormitories.reduce((s, d) => s + d.currentOccupancy, 0),
        capacity: h.dormitories.reduce((s, d) => s + d.capacity, 0),
      }))
    : []

  // Filtered boarders
  const filteredAssignments = (data?.assignments || []).filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      `${a.student.firstName} ${a.student.lastName}`.toLowerCase().includes(q) ||
      a.student.studentNumber.toLowerCase().includes(q) ||
      a.dormitory.name.toLowerCase().includes(q) ||
      a.dormitory.hostel.name.toLowerCase().includes(q)
    )
  })

  // Get all dormitories for the select dropdown
  const allDormitories = data
    ? data.hostels.flatMap((h) =>
        h.dormitories.map((d) => ({
          id: d.id,
          name: `${d.name} (${h.name})`,
          available: d.capacity - d.currentOccupancy,
        }))
      )
    : []

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
        <div className="h-80 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  const stats = data?.stats

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
          <h1 className="text-2xl font-bold tracking-tight">Boarding Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage hostels, dormitories, and boarding assignments</p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Assign Boarder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Boarder</DialogTitle>
              <DialogDescription>Assign a student to a dormitory and bed</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Student</Label>
                <Select
                  value={assignForm.studentId}
                  onValueChange={(v) => setAssignForm((p) => ({ ...p, studentId: v }))}
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
                <Label>Dormitory</Label>
                <Select
                  value={assignForm.dormitoryId}
                  onValueChange={(v) => setAssignForm((p) => ({ ...p, dormitoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dormitory..." />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-48">
                      {allDormitories.map((d) => (
                        <SelectItem key={d.id} value={d.id} disabled={d.available <= 0}>
                          {d.name} {d.available > 0 ? `(${d.available} beds available)` : '(Full)'}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Bed Number (optional)</Label>
                <Input
                  placeholder="e.g., A1, B3"
                  value={assignForm.bedNumber}
                  onChange={(e) => setAssignForm((p) => ({ ...p, bedNumber: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={submitting || !assignForm.studentId || !assignForm.dormitoryId}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Boarder
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
          <TabsTrigger value="hostels" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Hostels
          </TabsTrigger>
          <TabsTrigger value="boarders" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Boarders
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Boarders</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.totalBoarders || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Active boarders</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <BedDouble className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hostels</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.totalHostels || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">{stats?.totalDormitories || 0} dormitories</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Home className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Occupancy Rate</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.occupancyRate || '0'}%</p>
                    <div className="flex items-center gap-1.5">
                      {parseFloat(stats?.occupancyRate || '0') >= 90 ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <span className={cn(
                        'text-xs font-medium',
                        parseFloat(stats?.occupancyRate || '0') >= 90 ? 'text-amber-600' : 'text-emerald-600'
                      )}>
                        {stats?.totalOccupancy || 0}/{stats?.totalCapacity || 0} beds
                      </span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                    <Building2 className="h-5 w-5 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available Beds</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {(stats?.totalCapacity || 0) - (stats?.totalOccupancy || 0)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Open for assignment</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-green-500" />
            </Card>
          </div>

          {/* Occupancy Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Hostel Occupancy</CardTitle>
              <CardDescription>Current occupancy vs capacity by hostel</CardDescription>
            </CardHeader>
            <CardContent>
              {occupancyChartData.length > 0 ? (
                <ChartContainer config={occupancyChartConfig} className="h-[280px] w-full">
                  <BarChart data={occupancyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="capacity" fill="var(--color-capacity)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="occupancy" fill="var(--color-occupancy)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  No hostel data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Hostels Tab ──────────────────────────────────────────────── */}
        <TabsContent value="hostels" className="space-y-4">
          {data?.hostels.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <Home className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No hostels configured</p>
                <p className="text-xs text-muted-foreground mt-1">Hostels and dormitories will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data?.hostels.map((hostel) => {
                const totalOccupancy = hostel.dormitories.reduce((s, d) => s + d.currentOccupancy, 0)
                const totalCapacity = hostel.dormitories.reduce((s, d) => s + d.capacity, 0)
                const rate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0
                return (
                  <Card key={hostel.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <div className={cn(
                      'h-2',
                      rate >= 100 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                      rate >= 80 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      'bg-gradient-to-r from-emerald-400 to-teal-500'
                    )} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">{hostel.name}</CardTitle>
                          <CardDescription>
                            {hostel.dormitories.length} dormitor{hostel.dormitories.length === 1 ? 'y' : 'ies'}
                          </CardDescription>
                        </div>
                        {hostel.gender && (
                          <Badge className={cn('text-[10px] px-2 py-0.5 border', genderColors[hostel.gender] || genderColors.MIXED)}>
                            {hostel.gender}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Capacity bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">Capacity</span>
                          <span className="text-xs font-medium">{totalOccupancy}/{totalCapacity}</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full bg-gradient-to-r', getCapacityBarColor(totalOccupancy, totalCapacity))}
                            style={{ width: `${Math.min(rate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Dormitories list */}
                      <div className="space-y-2">
                        {hostel.dormitories.map((dorm) => (
                          <div key={dorm.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{dorm.name}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {dorm.currentOccupancy}/{dorm.capacity}
                              </Badge>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', getCapacityColor(dorm.currentOccupancy, dorm.capacity))}
                                style={{ width: `${dorm.capacity > 0 ? Math.min((dorm.currentOccupancy / dorm.capacity) * 100, 100) : 0}%` }}
                              />
                            </div>
                            {/* Bed allocation grid */}
                            {dorm.boardingAssignments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {dorm.boardingAssignments.map((ba) => (
                                  <div
                                    key={ba.id}
                                    className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5"
                                  >
                                    <BedDouble className="h-3 w-3 text-emerald-600" />
                                    <span className="text-[10px] font-medium text-emerald-700">
                                      {ba.bedNumber || '—'} {ba.student.firstName[0]}.{ba.student.lastName}
                                    </span>
                                  </div>
                                ))}
                                {dorm.capacity - dorm.currentOccupancy > 0 && (
                                  <div className="flex items-center gap-1 rounded-md bg-muted/50 border border-dashed px-2 py-0.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      +{dorm.capacity - dorm.currentOccupancy} vacant
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Boarders Tab ─────────────────────────────────────────────── */}
        <TabsContent value="boarders" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Boarding Students</CardTitle>
                  <CardDescription>{filteredAssignments.length} students assigned to boarding</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search boarders..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Dormitory</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                              {a.student.firstName[0]}{a.student.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{a.student.firstName} {a.student.lastName}</p>
                              <p className="text-xs text-muted-foreground">{a.student.studentNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{a.dormitory.hostel.name}</span>
                            {a.dormitory.hostel.gender && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {a.dormitory.hostel.gender}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{a.dormitory.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {a.bedNumber || 'Unassigned'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 border">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAssignments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                          {search ? 'No boarders match your search' : 'No boarding students assigned yet'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
