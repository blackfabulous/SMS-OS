'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Calendar, Users, MapPin, Plus, TrendingUp, Edit, Trash2, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useApiQuery, useApiMutation, useApiPut, useApiDelete, useQueryClient } from '@/hooks/use-api-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatGrid, ModuleStatCard, ModuleContainer, SectionCard, ModuleToolbar, TableShell, KitEmptyState, ModulePageLayout } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

import { DAYS, PERIODS, PERIOD_TIMES, SUBJECT_PALETTE, hashIdx } from './timetable/timetable-constants'
import { TimetableDialog } from './timetable/timetable-dialog'
import { WeeklyGrid, TeacherScheduleGrid } from './timetable/timetable-grids'
import type { AcademicsResponse, StaffResponse, TimetableForm, TimetableResponse, UIEntry, ApiEntry } from './timetable/timetable-types'

export default function TimetableModule() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<UIEntry | null>(null)
  const [form, setForm] = useState<TimetableForm>({ classId: '', subjectId: '', teacherId: 'none', day: 'Monday', period: '0', room: '' })

  const { data: academicsData, isPending: refsLoading } = useApiQuery<AcademicsResponse>(['academics', 'refs'], '/api/academics')
  const classes = useMemo(() => (academicsData?.classes || []).map((c) => ({ id: c.id, name: c.name })), [academicsData])
  const subjects = useMemo(() => (academicsData?.subjects || []).map((s) => ({ id: s.id, name: s.name })), [academicsData])

  const { data: staffData, isPending: staffLoading } = useApiQuery<StaffResponse>(['staff', 'timetable'], '/api/staff?limit=500')
  const teachers = useMemo(
    () => (staffData?.data || []).map((s) => ({ id: s.id, name: [s.title, s.firstName, s.lastName].filter(Boolean).join(' ') })),
    [staffData]
  )

  const { data: timetableData, isPending: ttLoading } = useApiQuery<TimetableResponse>(['timetable'], '/api/timetable?limit=500')
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t.name])), [teachers])

  const entries: UIEntry[] = useMemo(() => {
    const tMap = teacherMap
    return ((timetableData?.data as ApiEntry[]) || []).map((e) => ({
      id: e.id,
      classId: e.classId,
      subjectId: e.subjectId,
      teacherId: e.staffId || 'none',
      day: DAYS[(e.dayOfWeek || 1) - 1] || 'Monday',
      period: (e.period || 1) - 1,
      room: e.room || '',
      subjectName: e.subject?.name || '—',
      className: e.class?.name || '—',
      teacherName: e.staffId ? (tMap.get(e.staffId) || '—') : '—',
    }))
  }, [timetableData, teacherMap])

  const effectiveSelectedClass = selectedClass || classes[0]?.id || ''
  const loading = refsLoading || staffLoading || ttLoading

  const subjectColor = (id: string) => SUBJECT_PALETTE[hashIdx(id || 'x', SUBJECT_PALETTE.length)]
  const subjName = (id: string) => subjects.find((s) => s.id === id)?.name || '—'

  const totalPeriods = entries.length
  const teachersScheduled = new Set(entries.filter((e) => e.teacherId !== 'none').map((e) => e.teacherId)).size
  const roomsInUse = new Set(entries.map((e) => e.room).filter(Boolean)).size
  const totalSlots = DAYS.length * PERIODS.length * Math.max(classes.length, 1)
  const freeSlots = Math.max(totalSlots - totalPeriods, 0)

  const entriesForClass = useMemo(() => entries.filter((e) => e.classId === effectiveSelectedClass), [entries, effectiveSelectedClass])
  const entriesForTeacher = useMemo(() => (selectedTeacher === 'all' ? entries : entries.filter((e) => e.teacherId === selectedTeacher)), [entries, selectedTeacher])

  const { mutate: createEntry, isPending: isCreating } = useApiMutation<Record<string, unknown>, unknown>('/api/timetable', {
    onSuccess: () => {
      toast.success('Entry added')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed'),
  })

  const { mutate: updateEntry, isPending: isUpdating } = useApiPut<Record<string, unknown>, unknown>('/api/timetable', {
    onSuccess: () => {
      toast.success('Entry updated')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed'),
  })

  const { mutate: deleteEntry, isPending: isDeleting } = useApiDelete<unknown>('/api/timetable', {
    onSuccess: () => {
      toast.success('Entry deleted')
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed'),
  })

  const busy = isCreating || isUpdating || isDeleting

  const handleAdd = () => {
    setEditEntry(null)
    setForm({ classId: classes[0]?.id || '', subjectId: subjects[0]?.id || '', teacherId: 'none', day: 'Monday', period: '0', room: '' })
    setDialogOpen(true)
  }
  const handleEdit = (entry: UIEntry) => {
    setEditEntry(entry)
    setForm({ classId: entry.classId, subjectId: entry.subjectId, teacherId: entry.teacherId, day: entry.day, period: String(entry.period), room: entry.room })
    setDialogOpen(true)
  }
  const handleDelete = (id: string) => {
    if (!confirm('Delete this timetable entry?')) return
    deleteEntry(id)
  }
  const handleSave = () => {
    if (!form.classId || !form.subjectId) { toast.error('Class and subject are required'); return }
    const payload = {
      classId: form.classId,
      subjectId: form.subjectId,
      staffId: form.teacherId === 'none' ? null : form.teacherId,
      dayOfWeek: DAYS.indexOf(form.day) + 1,
      period: parseInt(form.period) + 1,
      room: form.room || null,
    }
    if (editEntry) {
      updateEntry({ id: editEntry.id, ...payload })
    } else {
      createEntry(payload)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading timetable…</div>
  }

  const noRefs = classes.length === 0 || subjects.length === 0
  const selectedClassName = classes.find((c) => c.id === effectiveSelectedClass)?.name || 'Selected class'

  return (
    <ModuleContainer>
      {noRefs && (
        <Card className="border-amber-200 bg-amber-50/50"><CardContent className="p-4 text-sm text-amber-800">Set up <span className="font-medium">classes</span> and <span className="font-medium">subjects</span> in the Academics module before building the timetable.</CardContent></Card>
      )}

      <ModulePageLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="schedule">Teacher Schedule</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </>}
      >
        {/* ─── Overview ─── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard icon={Clock} label="Total Periods" value={totalPeriods} accentGradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50" footer={<div className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" /><span className="text-xs font-medium text-emerald-600">Scheduled</span></div>} />
            <ModuleStatCard icon={Users} label="Teachers Scheduled" value={teachersScheduled} accentGradient="from-teal-400 to-cyan-500" bgColor="bg-teal-50" iconColor="text-teal-600" footer={<span className="text-xs font-medium text-teal-600">Of {teachers.length} total</span>} />
            <ModuleStatCard icon={MapPin} label="Rooms In Use" value={roomsInUse} accentGradient="from-amber-400 to-orange-500" bgColor="bg-amber-50" iconColor="text-amber-600" footer={<span className="text-xs font-medium text-amber-600">distinct rooms</span>} />
            <ModuleStatCard icon={Calendar} label="Free Slots" value={freeSlots} accentGradient="from-violet-400 to-purple-500" bgColor="bg-violet-50" iconColor="text-violet-600" footer={<span className="text-xs font-medium text-violet-600">Unscheduled</span>} />
          </StatGrid>

          <SectionCard title="Today&apos;s Highlights" description={`${selectedClassName} schedule today`}>
            <div className="space-y-2">
              {(() => {
                const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 'Monday'
                const todayEntries = entries.filter((e) => e.day === today && e.classId === effectiveSelectedClass)
                if (todayEntries.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No classes scheduled today (or pick a class in Weekly View).</p>
                return todayEntries.sort((a, b) => a.period - b.period).map((entry) => {
                  const col = subjectColor(entry.subjectId)
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="text-xs text-muted-foreground w-20 font-mono">{PERIOD_TIMES[entry.period]}</div>
                      <div className={cn('h-8 w-1.5 rounded-full', col.bg)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-xs border', col.color)}>{entry.subjectName}</Badge>
                          <span className="text-xs text-muted-foreground">{entry.room || '—'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.teacherName}</p>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ─── Weekly View ─── */}
        <TabsContent value="weekly" className="space-y-4">
          <ModuleToolbar
            filters={
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Class:</Label>
                <Select value={effectiveSelectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((cls) => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent>
                </Select>
                <Badge variant="secondary" className="text-[10px]">{entriesForClass.length} periods/week</Badge>
              </div>
            }
          />
          <WeeklyGrid entries={entriesForClass} subjectColor={subjectColor} onEdit={handleEdit} />
        </TabsContent>

        {/* ─── Teacher Schedule ─── */}
        <TabsContent value="schedule" className="space-y-4">
          <ModuleToolbar
            filters={
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Teacher:</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedTeacher !== 'all' && (
                  <Badge variant="secondary" className="text-[10px]">{entriesForTeacher.length} periods/week</Badge>
                )}
              </div>
            }
          />
          <TeacherScheduleGrid entries={entriesForTeacher} selectedTeacher={selectedTeacher} subjectColor={subjectColor} />
        </TabsContent>

        {/* ─── Manage ─── */}
        <TabsContent value="manage" className="space-y-4">
          <ModuleToolbar
            filters={<p className="text-xs text-muted-foreground">{entries.length} timetable entries</p>}
            actions={
              <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white" disabled={noRefs}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add Entry
              </Button>
            }
          />
          <TableShell isEmpty={entries.length === 0} empty={<KitEmptyState title="No timetable entries yet" description="Use 'Add Entry' to create timetable slots." />}>
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader><TableRow className="bg-muted/30"><TableHead className="text-xs">Day</TableHead><TableHead className="text-xs">Period</TableHead><TableHead className="text-xs">Class</TableHead><TableHead className="text-xs">Subject</TableHead><TableHead className="text-xs">Teacher</TableHead><TableHead className="text-xs">Room</TableHead><TableHead className="text-xs text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[...entries].sort((a, b) => { const d = DAYS.indexOf(a.day) - DAYS.indexOf(b.day); return d !== 0 ? d : a.period - b.period }).map((entry) => {
                    const col = subjectColor(entry.subjectId)
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/20">
                        <TableCell className="text-sm">{entry.day}</TableCell>
                        <TableCell className="text-sm"><div className="font-medium">{PERIODS[entry.period]}</div><div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[entry.period]}</div></TableCell>
                        <TableCell className="text-sm font-medium">{entry.className}</TableCell>
                        <TableCell><Badge className={cn('text-[10px] border', col.color)}>{entry.subjectName}</Badge></TableCell>
                        <TableCell className="text-sm">{entry.teacherName}</TableCell>
                        <TableCell className="text-sm">{entry.room || '—'}</TableCell>
                        <TableCell className="text-right"><div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleEdit(entry)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" disabled={busy} onClick={() => handleDelete(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </TableShell>
        </TabsContent>
      </ModulePageLayout>

      <TimetableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editEntry={editEntry}
        form={form}
        setForm={setForm}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        subjName={subjName}
        busy={busy}
        onSave={handleSave}
      />
    </ModuleContainer>
  )
}
