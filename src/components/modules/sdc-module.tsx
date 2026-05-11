'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Building,
  Users,
  Calendar,
  FolderKanban,
  DollarSign,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  ExternalLink,
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
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SDCMember {
  id: string
  name: string
  position: string
  phone?: string
  email?: string
  termStart?: string
  termEnd?: string
  isActive: boolean
  createdAt: string
}

interface SDCMeeting {
  id: string
  title: string
  description?: string
  eventType: string
  startDate: string
  endDate?: string
  venue?: string
}

interface SDCProject {
  id: string
  title: string
  description?: string
  eventType: string
  startDate: string
  endDate?: string
  venue?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

const positionColors: Record<string, string> = {
  Chairperson: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Secretary: 'bg-teal-100 text-teal-700 border-teal-200',
  Treasurer: 'bg-amber-100 text-amber-700 border-amber-200',
  'Vice Chairperson': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Committee Member': 'bg-gray-100 text-gray-700 border-gray-200',
}

const budgetChartConfig = {
  amount: { label: 'Amount (USD)', color: '#10b981' },
} satisfies ChartConfig

// ─── SDC Module ──────────────────────────────────────────────────────────────

export default function SDCModule() {
  const [members, setMembers] = useState<SDCMember[]>([])
  const [meetings, setMeetings] = useState<SDCMeeting[]>([])
  const [projects, setProjects] = useState<SDCProject[]>([])
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [schoolInfo, setSchoolInfo] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [memberForm, setMemberForm] = useState({
    name: '',
    position: 'Committee Member',
    phone: '',
    email: '',
    termStart: '',
    termEnd: '',
  })

  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/sdc')
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
        setMeetings(data.meetings || [])
        setProjects(data.projects || [])
        setStats(data.stats || {})
        setSchoolInfo(data.schoolInfo || {})
      }
    } catch (err) {
      console.error('Failed to fetch SDC data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.position) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/sdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      })
      if (res.ok) {
        setMemberDialogOpen(false)
        setMemberForm({ name: '', position: 'Committee Member', phone: '', email: '', termStart: '', termEnd: '' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add member:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddMeeting = async () => {
    if (!meetingForm.title || !meetingForm.startDate) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/sdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meeting', ...meetingForm }),
      })
      if (res.ok) {
        setMeetingDialogOpen(false)
        setMeetingForm({ title: '', description: '', startDate: '', endDate: '', venue: '' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add meeting:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Simulated budget data
  const budgetData = [
    { category: 'Infrastructure', budget: 15000, actual: 12500 },
    { category: 'Furniture', budget: 5000, actual: 4200 },
    { category: 'ICT Equipment', budget: 8000, actual: 7500 },
    { category: 'Sports', budget: 3000, actual: 1800 },
    { category: 'Fundraising', budget: 2000, actual: 3500 },
  ]

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
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SDC/SDA Governance</h1>
          <p className="text-sm text-muted-foreground mt-1">School Development Committee management</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Add SDC Member</DialogTitle>
                <DialogDescription>Add a new member to the School Development Committee</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Full Name *</Label>
                  <Input placeholder="Full name" value={memberForm.name} onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Position *</Label>
                  <Select value={memberForm.position} onValueChange={(v) => setMemberForm((p) => ({ ...p, position: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chairperson">Chairperson</SelectItem>
                      <SelectItem value="Vice Chairperson">Vice Chairperson</SelectItem>
                      <SelectItem value="Secretary">Secretary</SelectItem>
                      <SelectItem value="Treasurer">Treasurer</SelectItem>
                      <SelectItem value="Committee Member">Committee Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input placeholder="+263..." value={memberForm.phone} onChange={(e) => setMemberForm((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input placeholder="email@example.com" value={memberForm.email} onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Term Start</Label>
                    <Input type="date" value={memberForm.termStart} onChange={(e) => setMemberForm((p) => ({ ...p, termStart: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Term End</Label>
                    <Input type="date" value={memberForm.termEnd} onChange={(e) => setMemberForm((p) => ({ ...p, termEnd: e.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMember} disabled={submitting || !memberForm.name} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Calendar className="mr-2 h-4 w-4" />
                Add Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Schedule SDC Meeting</DialogTitle>
                <DialogDescription>Create a new meeting record</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Meeting Title *</Label>
                  <Input placeholder="e.g. SDC Quarterly Meeting" value={meetingForm.title} onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Agenda / Description</Label>
                  <Input placeholder="Meeting agenda items" value={meetingForm.description} onChange={(e) => setMeetingForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Date *</Label>
                    <Input type="date" value={meetingForm.startDate} onChange={(e) => setMeetingForm((p) => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Venue</Label>
                    <Input placeholder="e.g. School Hall" value={meetingForm.venue} onChange={(e) => setMeetingForm((p) => ({ ...p, venue: e.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMeeting} disabled={submitting || !meetingForm.title || !meetingForm.startDate} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Meeting
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Members</TabsTrigger>
          <TabsTrigger value="meetings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Meetings</TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Projects</TabsTrigger>
          <TabsTrigger value="finances" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Finances</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SDC Members</p>
                    <p className="text-2xl font-bold tracking-tight">{(stats.totalMembers as number) || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">{(stats.activeMembers as number) || 0} active</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meetings This Term</p>
                    <p className="text-2xl font-bold tracking-tight">{(stats.meetingsThisTerm as number) || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Scheduled</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Calendar className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Projects</p>
                    <p className="text-2xl font-bold tracking-tight">{(stats.activeProjects as number) || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">In progress</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <FolderKanban className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fund Balance</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency((stats.fundBalance as number) || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">SDC funds</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
                    <DollarSign className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 to-pink-500" />
            </Card>
          </div>

          {/* Key Members */}
          {schoolInfo && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">SDC Leadership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Chairperson', 'Secretary', 'Treasurer'].map((position) => {
                    const name = schoolInfo[`sdc${position}` as keyof typeof schoolInfo]
                    return (
                      <div key={position} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold">
                          {name ? name[0] : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{name || 'Not assigned'}</p>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', positionColors[position])}>
                            {position}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Members Tab ──────────────────────────────────────────────── */}
        <TabsContent value="members" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">SDC Members</CardTitle>
              <CardDescription>Committee members and their positions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Position</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Term</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                            {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', positionColors[member.position] || positionColors['Committee Member'])}>
                          {member.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {member.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />{member.phone}
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />{member.email}
                            </div>
                          )}
                          {!member.phone && !member.email && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {member.termStart && member.termEnd
                          ? `${formatDate(member.termStart)} — ${formatDate(member.termEnd)}`
                          : 'Not set'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700')}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>No SDC members added yet</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Meetings Tab ─────────────────────────────────────────────── */}
        <TabsContent value="meetings" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Meeting Records</CardTitle>
              <CardDescription>SDC meetings with agendas, minutes, and resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No meetings scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shrink-0">
                        <span className="text-[10px] font-medium leading-none">
                          {new Date(meeting.startDate).toLocaleDateString('en-ZW', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none mt-0.5">
                          {new Date(meeting.startDate).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{meeting.description || 'No agenda details'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {meeting.venue && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />{meeting.venue}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{new Date(meeting.startDate).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Projects Tab ─────────────────────────────────────────────── */}
        <TabsContent value="projects" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">School Development Projects</CardTitle>
              <CardDescription>Projects with budgets, progress, and timelines</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No projects recorded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((project, index) => {
                    const progress = [65, 30, 85, 50, 20][index % 5]
                    const budget = [15000, 8000, 5000, 3000, 12000][index % 5]
                    return (
                      <div key={project.id} className="p-4 rounded-xl border hover:shadow-md transition-shadow space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{project.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{project.description || 'No description'}</p>
                          </div>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5', progress >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : progress >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200')}>
                            {progress >= 80 ? 'On Track' : progress >= 40 ? 'In Progress' : 'Starting'}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Budget: {formatCurrency(budget)}</span>
                          <span className="text-muted-foreground">Due: {project.endDate ? formatDate(project.endDate) : 'TBD'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Finances Tab ─────────────────────────────────────────────── */}
        <TabsContent value="finances" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">SDC Fund Management</CardTitle>
              <CardDescription>Budget vs Actual expenditure</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={budgetChartConfig} className="h-[280px] w-full">
                <BarChart data={budgetData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="budget" fill="#d1d5db" radius={[4, 4, 0, 0]} maxBarSize={32} name="Budget" />
                  <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} name="Actual" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Budget Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-right">Budget</TableHead>
                    <TableHead className="text-xs text-right">Actual</TableHead>
                    <TableHead className="text-xs text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetData.map((item) => {
                    const variance = item.budget - item.actual
                    return (
                      <TableRow key={item.category} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{item.category}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(item.budget)}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(item.actual)}</TableCell>
                        <TableCell className={cn('text-sm text-right font-mono font-semibold', variance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(budgetData.reduce((s, b) => s + b.budget, 0))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(budgetData.reduce((s, b) => s + b.actual, 0))}</TableCell>
                    <TableCell className={cn('text-right font-mono', budgetData.reduce((s, b) => s + b.budget - b.actual, 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {formatCurrency(budgetData.reduce((s, b) => s + b.budget - b.actual, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
