'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  FileText,
  Plus,
  UserPlus,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import { cn } from '@/lib/utils'
import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
import { ModuleContainer, StatGrid, ModuleStatCard, SectionCard, TableShell, ModulePageLayout, ModuleSettingsButton, KitEmptyState, ModuleToolbar } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { toast } from 'sonner'
import { AdmissionsSettingsView, type AdmissionsSettings } from './admissions/admissions-settings-view'
import { AdmissionsAddForm } from './admissions/admissions-add-form'
import { AdmissionsDetailView } from './admissions/admissions-detail-view'
import { formatDate, statusConfig, defaultForm } from './admissions/admissions-constants'
import { funnelChartConfig } from './admissions/admissions-types'
import type { Application, AdmissionsResponse, ApplicationForm, ViewMode } from './admissions/admissions-types'

// ─── Admissions Module ───────────────────────────────────────────────────────

export default function AdmissionsModule() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const admissionsUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (searchQuery) params.set('search', searchQuery)
    return `/api/admissions?${params.toString()}`
  }, [statusFilter, searchQuery])

  const {
    data: admissionsResult,
    isPending: loading,
  } = useApiQuery<AdmissionsResponse>(['admissions', statusFilter, searchQuery], admissionsUrl)

  const applications = admissionsResult?.data ?? []
  const stats = admissionsResult?.stats ?? null

  // ViewMode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState<ApplicationForm>({ ...defaultForm })

  // Settings state
  const [admissionsSettings, setAdmissionsSettings] = useState<AdmissionsSettings>({
    defaultIntakeYear: '2026',
    applicationFeeAmount: '25',
    maxApplicationsPerGrade: '50',
    welcomeMessage: 'Welcome to our school! Please complete your application carefully.',
    requireBirthCert: true,
    requireTransferLetter: true,
    requireInterview: true,
    autoAssignStudentNumber: true,
    notifyGuardianOnStatusChange: true,
  })

  const selectedApp = applications.find(a => a.id === selectedId)

  const { mutate: createApp, isPending: submitting } = useApiMutation<typeof defaultForm, Application>('/api/admissions', {
    onSuccess: () => {
      toast.success('Application submitted successfully')
      setForm({ ...defaultForm })
      setViewMode('list')
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit application')
    },
  })

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName) return
    createApp({ ...form })
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
      <ModuleContainer>
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <StatGrid cols={4}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </StatGrid>
      </ModuleContainer>
    )
  }

  // ─── Settings View ──────────────────────────────────────────────────────
  if (viewMode === 'settings') {
    return (
      <AdmissionsSettingsView
        settings={admissionsSettings}
        onSettingsChange={setAdmissionsSettings}
        onBack={() => setViewMode('list')}
      />
    )
  }

  // ─── Add Application View ────────────────────────────────────────────────
  if (viewMode === 'add') {
    return (
      <AdmissionsAddForm
        form={form}
        onFormChange={setForm}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setViewMode('list')}
      />
    )
  }

  // ─── Detail View ──────────────────────────────────────────────────────────
  if (viewMode === 'detail' && selectedApp) {
    return <AdmissionsDetailView application={selectedApp} onBack={() => setViewMode('list')} />
  }

  // ─── List View ────────────────────────────────────────────────────────────
  return (
    <ModuleContainer>
      <ModulePageLayout
        actions={<>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" onClick={() => { setForm({ ...defaultForm }); setViewMode('add') }}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="waiting">Waiting List</TabsTrigger>
        </>}
      >
        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={FileText}
              label="Applications"
              value={stats?.total || 0}
              accentGradient="from-emerald-400 to-teal-500"
              trend={{ value: 'Total received', positive: true }}
              index={0}
            />
            <ModuleStatCard
              icon={CheckCircle2}
              label="Accepted"
              value={stats?.active || 0}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              trend={{ value: 'Enrolled', positive: true }}
              index={1}
            />
            <ModuleStatCard
              icon={Clock}
              label="Pending"
              value={stats?.pending || 0}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              trend={{ value: 'Awaiting review', positive: true }}
              index={2}
            />
            <ModuleStatCard
              icon={XCircle}
              label="Rejected"
              value={(stats?.droppedOut || 0) + (stats?.transferred || 0)}
              accentGradient="from-red-400 to-rose-500"
              bgColor="bg-red-50 dark:bg-red-950/40"
              iconColor="text-red-500 dark:text-red-400"
              trend={{ value: 'Not accepted', positive: false }}
              index={3}
            />
          </StatGrid>

          <SectionCard title="Admission Funnel" description="Application to enrollment conversion">
            <ChartContainer config={funnelChartConfig} className="h-[250px] w-full">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </SectionCard>
        </TabsContent>

        {/* ─── Applications Tab ──────────────────────────────────────────── */}
        <TabsContent value="applications" className="space-y-4">
          <ModuleToolbar
            search={searchQuery}
            onSearch={setSearchQuery}
            searchPlaceholder="Search by name, student number..."
            filters={<>
              <Filter className="h-4 w-4 text-muted-foreground mr-1" />
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
            </>}
          />

          <TableShell
            isEmpty={applications.length === 0}
            empty={
              <KitEmptyState
                icon={UserPlus}
                title="No applications found"
              />
            }
          >
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
                {applications.map((app) => {
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
                })}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        {/* ─── Enrollment Tab ────────────────────────────────────────────── */}
        <TabsContent value="enrollment" className="space-y-4">
          <SectionCard
            title="Accepted Applications — Ready to Enroll"
            description="Convert accepted applications to enrolled students"
          >
            {acceptedApps.length === 0 ? (
              <KitEmptyState
                icon={CheckCircle2}
                title="No accepted applications to enroll"
              />
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
          </SectionCard>
        </TabsContent>

        {/* ─── Waiting List Tab ──────────────────────────────────────────── */}
        <TabsContent value="waiting" className="space-y-4">
          <SectionCard
            title="Waiting List"
            description="Applicants waiting for available spots"
          >
            <TableShell
              isEmpty={waitlistedApps.length === 0}
              empty={
                <KitEmptyState
                  icon={AlertTriangle}
                  title="No applicants on the waiting list"
                />
              }
            >
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
            </TableShell>
          </SectionCard>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
