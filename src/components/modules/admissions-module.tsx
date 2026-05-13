'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  UserPlus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  ChevronRight,
  Loader2,
  Plus,
  ArrowRight,
  Eye,
  ListOrdered,
  ArrowLeft,
  Settings,
  Save,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'

interface Application {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  middleName?: string
  gender: string
  dateOfBirth: string
  enrollmentStatus: string
  boardingStatus?: string
  previousSchool?: string
  admissionDate: string
  parentLinks: Array<{
    parent: { firstName: string; lastName: string; phone: string; email?: string }
    relationship: string
    isPrimary: boolean
  }>
  enrollments: Array<{
    class: { name: string; grade: { name: string } }
  }>
}

interface AdmissionStats {
  total: number
  active: number
  pending: number
  droppedOut: number
  transferred: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Eye },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  WAITLISTED: { label: 'Waitlisted', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: ListOrdered },
  DROPPED_OUT: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  TRANSFERRED: { label: 'Transferred', color: 'bg-muted text-muted-foreground border-border', icon: ArrowRight },
}

const funnelChartConfig = {
  count: { label: 'Applicants', color: '#10b981' },
} satisfies ChartConfig

// ─── Default Form State ────────────────────────────────────────────────────

const defaultForm = {
  firstName: '',
  lastName: '',
  middleName: '',
  gender: 'MALE',
  dateOfBirth: '',
  birthCertNumber: '',
  nationalId: '',
  boardingStatus: 'DAY_SCHOLAR',
  previousSchool: '',
  guardianFirstName: '',
  guardianLastName: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianRelationship: 'PARENT',
  gradeId: '',
  status: 'PENDING',
}

// ─── Admissions Module ───────────────────────────────────────────────────────

export default function AdmissionsModule() {
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<AdmissionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [submitting, setSubmitting] = useState(false)

  // ViewMode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({ ...defaultForm })

  // Settings state
  const [defaultIntakeYear, setDefaultIntakeYear] = useState('2026')
  const [requireInterview, setRequireInterview] = useState(true)
  const [requireBirthCert, setRequireBirthCert] = useState(true)
  const [requireTransferLetter, setRequireTransferLetter] = useState(true)
  const [autoAssignStudentNumber, setAutoAssignStudentNumber] = useState(true)
  const [notifyGuardianOnStatusChange, setNotifyGuardianOnStatusChange] = useState(true)
  const [applicationFeeAmount, setApplicationFeeAmount] = useState('25')
  const [maxApplicationsPerGrade, setMaxApplicationsPerGrade] = useState('50')
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome to our school! Please complete your application carefully.')

  const selectedApp = applications.find(a => a.id === selectedId)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/admissions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setApplications(data.data || [])
        setStats(data.stats || null)
      }
    } catch (err) {
      console.error('Failed to fetch admissions:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Application submitted successfully')
        setForm({ ...defaultForm })
        setViewMode('list')
        fetchData()
      } else {
        toast.error('Failed to submit application')
      }
    } catch (err) {
      console.error('Failed to submit application:', err)
      toast.error('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered data for tabs
  const pendingApps = applications.filter((a) => a.enrollmentStatus === 'PENDING')
  const waitlistedApps = applications.filter((a) => a.enrollmentStatus === 'WAITLISTED')
  const acceptedApps = applications.filter((a) => a.enrollmentStatus === 'ACTIVE')

  // Funnel chart data
  const funnelData = stats ? [
    { stage: 'Applications', count: stats.total },
    { stage: 'Accepted', count: stats.active },
    { stage: 'Pending', count: stats.pending },
    { stage: 'Rejected', count: stats.droppedOut },
  ] : []

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

  // ─── Settings View ──────────────────────────────────────────────────────
  if (viewMode === 'settings') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admissions Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure admission process, requirements, and defaults</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Default Configuration</CardTitle>
              <CardDescription>Set defaults for new applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Default Intake Year</Label>
                <Input value={defaultIntakeYear} onChange={e => setDefaultIntakeYear(e.target.value)} placeholder="e.g. 2026" />
              </div>
              <div className="grid gap-2">
                <Label>Application Fee (USD)</Label>
                <Input type="number" value={applicationFeeAmount} onChange={e => setApplicationFeeAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="grid gap-2">
                <Label>Max Applications Per Grade</Label>
                <Input type="number" value={maxApplicationsPerGrade} onChange={e => setMaxApplicationsPerGrade(e.target.value)} placeholder="50" />
              </div>
              <div className="grid gap-2">
                <Label>Welcome Message for Applicants</Label>
                <Textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows={3} placeholder="Welcome message..." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Document Requirements</CardTitle>
              <CardDescription>Required documents for application submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Birth Certificate</p>
                  <p className="text-xs text-muted-foreground">Require birth certificate copy</p>
                </div>
                <Switch checked={requireBirthCert} onCheckedChange={setRequireBirthCert} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Transfer Letter</p>
                  <p className="text-xs text-muted-foreground">Require transfer letter from previous school</p>
                </div>
                <Switch checked={requireTransferLetter} onCheckedChange={setRequireTransferLetter} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Interview Required</p>
                  <p className="text-xs text-muted-foreground">Schedule interview before acceptance</p>
                </div>
                <Switch checked={requireInterview} onCheckedChange={setRequireInterview} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Auto-assign Student Number</p>
                  <p className="text-xs text-muted-foreground">Automatically generate student numbers</p>
                </div>
                <Switch checked={autoAssignStudentNumber} onCheckedChange={setAutoAssignStudentNumber} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Notify Guardian on Status Change</p>
                  <p className="text-xs text-muted-foreground">Send SMS/email when application status changes</p>
                </div>
                <Switch checked={notifyGuardianOnStatusChange} onCheckedChange={setNotifyGuardianOnStatusChange} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => toast.success('Settings saved successfully')}>
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </motion.div>
    )
  }

  // ─── Add Application View ────────────────────────────────────────────────
  if (viewMode === 'add') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Application</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit a new student admission application</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="grid gap-6 max-w-3xl">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-emerald-700">Student Details</Label>
                <Separator />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>First Name *</Label>
                  <Input placeholder="First name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Last Name *</Label>
                  <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Middle Name</Label>
                  <Input placeholder="Middle name" value={form.middleName} onChange={(e) => setForm((p) => ({ ...p, middleName: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Birth Certificate #</Label>
                  <Input placeholder="e.g. 08-123456A78" value={form.birthCertNumber} onChange={(e) => setForm((p) => ({ ...p, birthCertNumber: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>National ID</Label>
                  <Input placeholder="e.g. 08-1234567X89" value={form.nationalId} onChange={(e) => setForm((p) => ({ ...p, nationalId: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Boarding Status</Label>
                  <Select value={form.boardingStatus} onValueChange={(v) => setForm((p) => ({ ...p, boardingStatus: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                      <SelectItem value="BOARDER">Boarder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Previous School</Label>
                  <Input placeholder="Previous school name" value={form.previousSchool} onChange={(e) => setForm((p) => ({ ...p, previousSchool: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <Label className="text-sm font-semibold text-emerald-700">Guardian Details</Label>
                <Separator />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Guardian First Name</Label>
                  <Input placeholder="First name" value={form.guardianFirstName} onChange={(e) => setForm((p) => ({ ...p, guardianFirstName: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Guardian Last Name</Label>
                  <Input placeholder="Last name" value={form.guardianLastName} onChange={(e) => setForm((p) => ({ ...p, guardianLastName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input placeholder="+263..." value={form.guardianPhone} onChange={(e) => setForm((p) => ({ ...p, guardianPhone: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input placeholder="email@example.com" value={form.guardianEmail} onChange={(e) => setForm((p) => ({ ...p, guardianEmail: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Relationship</Label>
                  <Select value={form.guardianRelationship} onValueChange={(v) => setForm((p) => ({ ...p, guardianRelationship: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARENT">Parent</SelectItem>
                      <SelectItem value="GUARDIAN">Guardian</SelectItem>
                      <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
                      <SelectItem value="SIBLING">Sibling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <Label className="text-sm font-semibold text-emerald-700">Documents Checklist</Label>
                <Separator />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Birth Certificate', 'Previous School Report', 'Transfer Letter', 'Passport Photo', 'Immunisation Card', 'National ID Copy'].map((doc) => (
                  <label key={doc} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-muted-foreground focus:ring-emerald-500" />
                    <span>{doc}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting || !form.firstName || !form.lastName} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── Detail View ──────────────────────────────────────────────────────────
  if (viewMode === 'detail' && selectedApp) {
    const sc = statusConfig[selectedApp.enrollmentStatus] || statusConfig.PENDING
    const primaryParent = selectedApp.parentLinks.find((p) => p.isPrimary)?.parent
    const grade = selectedApp.enrollments[0]?.class?.grade?.name || 'N/A'
    const className = selectedApp.enrollments[0]?.class?.name || 'Not assigned'

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-lg font-semibold">
            {selectedApp.firstName[0]}{selectedApp.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedApp.firstName} {selectedApp.lastName}</h1>
            <p className="text-sm text-muted-foreground">{selectedApp.studentNumber} &middot; {grade}</p>
          </div>
          <Badge variant="outline" className={cn('text-xs px-3 py-1 ml-auto', sc.color)}>
            {sc.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Student Number</span><span className="text-sm font-mono font-semibold">{selectedApp.studentNumber}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Full Name</span><span className="text-sm font-medium">{selectedApp.firstName} {selectedApp.middleName || ''} {selectedApp.lastName}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Gender</span><span className="text-sm">{selectedApp.gender === 'MALE' ? 'Male' : 'Female'}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Date of Birth</span><span className="text-sm">{selectedApp.dateOfBirth ? formatDate(selectedApp.dateOfBirth) : 'N/A'}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Boarding Status</span><span className="text-sm">{selectedApp.boardingStatus === 'BOARDER' ? 'Boarder' : 'Day Scholar'}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Previous School</span><span className="text-sm">{selectedApp.previousSchool || 'N/A'}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Admission Date</span><span className="text-sm">{formatDate(selectedApp.admissionDate)}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Class</span><span className="text-sm">{className}</span></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedApp.parentLinks.map((link, idx) => (
                <div key={idx} className={cn('p-4 rounded-xl border', link.isPrimary ? 'border-emerald-200 bg-emerald-50/50' : 'border-muted')}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{link.parent.firstName} {link.parent.lastName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{link.relationship}</Badge>
                      {link.isPrimary && <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Primary</Badge>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground">Phone</span><span className="text-xs font-medium">{link.parent.phone}</span></div>
                    {link.parent.email && <div className="flex justify-between"><span className="text-xs text-muted-foreground">Email</span><span className="text-xs font-medium">{link.parent.email}</span></div>}
                  </div>
                </div>
              ))}
              {selectedApp.parentLinks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No guardian information available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  // ─── List View ────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admissions & Enrollment</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage student applications and enrollment process</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setViewMode('settings')}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" onClick={() => { setForm({ ...defaultForm }); setViewMode('add') }}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Applications</TabsTrigger>
          <TabsTrigger value="enrollment" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Enrollment</TabsTrigger>
          <TabsTrigger value="waiting" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Waiting List</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Applications</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.total || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Total received</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accepted</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.active || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Enrolled</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.pending || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Awaiting review</span>
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rejected</p>
                    <p className="text-2xl font-bold tracking-tight">{(stats?.droppedOut || 0) + (stats?.transferred || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-500">Not accepted</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400 to-rose-500" />
            </Card>
          </div>

          {/* Conversion Funnel Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Admission Funnel</CardTitle>
              <CardDescription>Application to enrollment conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={funnelChartConfig} className="h-[250px] w-full">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Applications Tab ──────────────────────────────────────────── */}
        <TabsContent value="applications" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, student number..."
                className="pl-9 h-9 bg-background border-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {['ALL', 'PENDING', 'ACTIVE', 'DROPPED_OUT', 'TRANSFERRED'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    statusFilter === status && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Accepted' : status === 'DROPPED_OUT' ? 'Rejected' : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Applications Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Applicant</TableHead>
                    <TableHead className="text-xs">Gender</TableHead>
                    <TableHead className="text-xs">Grade</TableHead>
                    <TableHead className="text-xs">Previous School</TableHead>
                    <TableHead className="text-xs">Guardian</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>No applications found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app) => {
                      const sc = statusConfig[app.enrollmentStatus] || statusConfig.PENDING
                      const primaryParent = app.parentLinks.find((p) => p.isPrimary)?.parent
                      const grade = app.enrollments[0]?.class?.grade?.name || 'N/A'
                      return (
                        <TableRow key={app.id} className="hover:bg-muted/30 cursor-pointer group" onClick={() => { setSelectedId(app.id); setViewMode('detail') }}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                                {app.firstName[0]}{app.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium group-hover:text-emerald-700 transition-colors">{app.firstName} {app.lastName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{app.studentNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{app.gender === 'MALE' ? 'Male' : 'Female'}</TableCell>
                          <TableCell className="text-sm font-medium">{grade}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{app.previousSchool || '\u2014'}</TableCell>
                          <TableCell className="text-sm">
                            {primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : '\u2014'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', sc.color)}>
                              {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(app.admissionDate)}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Enrollment Tab ────────────────────────────────────────────── */}
        <TabsContent value="enrollment" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Accepted Applications — Ready to Enroll</CardTitle>
              <CardDescription>Convert accepted applications to enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              {acceptedApps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No accepted applications to enroll</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-semibold">
                          {app.firstName[0]}{app.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{app.firstName} {app.lastName}</p>
                          <p className="text-xs text-muted-foreground">{app.studentNumber} &middot; {app.enrollments[0]?.class?.grade?.name || 'No grade assigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Accepted</Badge>
                        <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-8">
                          <ChevronRight className="mr-1 h-3 w-3" />
                          Enroll
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Waiting List Tab ──────────────────────────────────────────── */}
        <TabsContent value="waiting" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Waiting List</CardTitle>
              <CardDescription>Applicants waiting for available spots</CardDescription>
            </CardHeader>
            <CardContent>
              {waitlistedApps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No applicants on the waiting list</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Gender</TableHead>
                      <TableHead className="text-xs">Desired Grade</TableHead>
                      <TableHead className="text-xs">Date Added</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistedApps.map((app, index) => (
                      <TableRow key={app.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-bold text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{app.firstName} {app.lastName}</TableCell>
                        <TableCell className="text-sm">{app.gender === 'MALE' ? 'Male' : 'Female'}</TableCell>
                        <TableCell className="text-sm">{app.enrollments[0]?.class?.grade?.name || 'N/A'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(app.admissionDate)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            Accept
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
