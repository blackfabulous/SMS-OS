'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
} from 'lucide-react'


import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
import { ModuleContainer, ModulePageLayout, ModuleSettingsButton, StatGrid } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { AdmissionsSettingsView, type AdmissionsSettings } from './admissions/admissions-settings-view'
import { AdmissionsAddForm } from './admissions/admissions-add-form'
import { AdmissionsDetailView } from './admissions/admissions-detail-view'
import { AdmissionsOverview } from './admissions/admissions-overview'
import { AdmissionsApplicationsTab } from './admissions/admissions-applications-tab'
import { AdmissionsEnrollmentTab } from './admissions/admissions-enrollment-tab'
import { AdmissionsWaitingTab } from './admissions/admissions-waiting-tab'
import { defaultForm } from './admissions/admissions-constants'
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
  const waitlistedApps = applications.filter((a) => a.enrollmentStatus === 'WAITLISTED')
  const acceptedApps = applications.filter((a) => a.enrollmentStatus === 'ACTIVE')

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
          <AdmissionsOverview stats={stats} />
        </TabsContent>

        {/* ─── Applications Tab ──────────────────────────────────────────── */}
        <TabsContent value="applications" className="space-y-4">
          <AdmissionsApplicationsTab
            applications={applications}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSelectApplication={(id) => { setSelectedId(id); setViewMode('detail') }}
          />
        </TabsContent>

        {/* ─── Enrollment Tab ────────────────────────────────────────────── */}
        <TabsContent value="enrollment" className="space-y-4">
          <AdmissionsEnrollmentTab acceptedApps={acceptedApps} />
        </TabsContent>

        {/* ─── Waiting List Tab ──────────────────────────────────────────── */}
        <TabsContent value="waiting" className="space-y-4">
          <AdmissionsWaitingTab waitlistedApps={waitlistedApps} />
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
