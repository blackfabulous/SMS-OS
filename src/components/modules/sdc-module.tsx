'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Calendar } from 'lucide-react'

import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
import { ModulePageLayout, ModuleSettingsButton } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'


import { SDCAddView } from './sdc/sdc-add-view'
import { SDCFinances } from './sdc/sdc-finances'
import { SDCMembers } from './sdc/sdc-members'
import { SDCMeetings } from './sdc/sdc-meetings'
import { SDCOverview } from './sdc/sdc-overview'
import { SDCProjects } from './sdc/sdc-projects'
import { SDCSettingsView } from './sdc/sdc-settings-view'
import type { SDCMember, SDCMeeting, SDCResponse, SDCViewMode } from './sdc/sdc-types'

const initialStats: SDCResponse['stats'] = {
  totalMembers: 0,
  activeMembers: 0,
  meetingsThisTerm: 0,
  activeProjects: 0,
  fundBalance: 0,
  totalPayments: 0,
}

const initialSchoolInfo: SDCResponse['schoolInfo'] = {
  sdcChairperson: null,
  sdcSecretary: null,
  sdcTreasurer: null,
}

export default function SDCModule() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<SDCViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addType, setAddType] = useState<'member' | 'meeting'>('member')
  const [settings, setSettings] = useState({
    autoScheduleMeetings: false,
    votingEnabled: true,
    documentTemplates: true,
    termDuration: '2',
    quorumRequired: '50',
  })
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

  const { data: sdcData, isPending: loading } = useApiQuery<SDCResponse>(['sdc'], '/api/sdc')

  const members: SDCMember[] = sdcData?.members ?? []
  const meetings: SDCMeeting[] = sdcData?.meetings ?? []
  const projects = sdcData?.projects ?? []
  const stats = sdcData?.stats ?? initialStats
  const schoolInfo = sdcData?.schoolInfo ?? initialSchoolInfo

  const { mutate: createSdcRecord, isPending: isSubmitting } = useApiMutation<
    ({ type: 'member' } & typeof memberForm) | ({ type: 'meeting' } & typeof meetingForm),
    SDCMember | SDCMeeting
  >('/api/sdc', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdc'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create SDC record')
    },
  })

  const handleAddMember = () => {
    if (!memberForm.name || !memberForm.position) return
    createSdcRecord({ type: 'member', ...memberForm }, {
      onSuccess: () => {
        setViewMode('list')
        setMemberForm({ name: '', position: 'Committee Member', phone: '', email: '', termStart: '', termEnd: '' })
        toast.success('SDC member added successfully')
      },
    })
  }

  const handleAddMeeting = () => {
    if (!meetingForm.title || !meetingForm.startDate) return
    createSdcRecord({ type: 'meeting', ...meetingForm }, {
      onSuccess: () => {
        setViewMode('list')
        setMeetingForm({ title: '', description: '', startDate: '', endDate: '', venue: '' })
        toast.success('SDC meeting added successfully')
      },
    })
  }

  const handleSubmit = () => {
    if (addType === 'member') {
      handleAddMember()
    } else {
      handleAddMeeting()
    }
  }

  const setAddAndOpen = (type: 'member' | 'meeting') => {
    setAddType(type)
    setViewMode('add')
    setSelectedId(null)
  }

  if (viewMode === 'settings') {
    return (
      <SDCSettingsView
        settings={settings}
        setSettings={setSettings}
        onBack={() => setViewMode('list')}
      />
    )
  }

  if (viewMode === 'add') {
    return (
      <SDCAddView
        addType={addType}
        onAddTypeChange={setAddType}
        memberForm={memberForm}
        setMemberForm={setMemberForm}
        meetingForm={meetingForm}
        setMeetingForm={setMeetingForm}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => setViewMode('list')}
      />
    )
  }

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
      <ModulePageLayout
        actions={<>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" onClick={() => setAddAndOpen('member')}>
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setAddAndOpen('meeting')}>
            <Calendar className="mr-2 h-4 w-4" /> Add Meeting
          </Button>
          <ModuleSettingsButton onClick={() => { setViewMode('settings'); setSelectedId(null) }} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </>}
      >
        <TabsContent value="overview" className="space-y-4">
          <SDCOverview stats={stats} schoolInfo={schoolInfo} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <SDCMembers members={members} />
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <SDCMeetings meetings={meetings} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <SDCProjects projects={projects} />
        </TabsContent>

        <TabsContent value="finances" className="space-y-4">
          <SDCFinances />
        </TabsContent>
      </ModulePageLayout>
    </motion.div>
  )
}
