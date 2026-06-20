'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Calendar, Users, MapPin, Plus, TrendingUp, Edit, Trash2, Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatGrid, ModuleStatCard, ModuleContainer, SectionCard, ModuleToolbar, TableShell, KitEmptyState, ModulePageLayout } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// ─── Constants ──────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8']
const PERIOD_TIMES = ['07:30-08:10', '08:10-08:50', '08:50-09:30', '09:30-10:10', '10:30-11:10', '11:10-11:50', '11:50-12:30', '14:00-14:40']

const SUBJECT_PALETTE = [
  { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', bg: 'bg-emerald-50' },
  { color: 'bg-teal-100 text-teal-800 border-teal-300', bg: 'bg-teal-50' },
  { color: 'bg-cyan-100 text-cyan-800 border-cyan-300', bg: 'bg-cyan-50' },
  { color: 'bg-amber-100 text-amber-800 border-amber-300', bg: 'bg-amber-50' },
  { color: 'bg-orange-100 text-orange-800 border-orange-300', bg: 'bg-orange-50' },
  { color: 'bg-rose-100 text-rose-800 border-rose-300', bg: 'bg-rose-50' },
  { color: 'bg-violet-100 text-violet-800 border-violet-300', bg: 'bg-violet-50' },
  { color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', bg: 'bg-fuchsia-50' },
  { color: 'bg-lime-100 text-lime-800 border-lime-300', bg: 'bg-lime-50' },
  { color: 'bg-sky-100 text-sky-800 border-sky-300', bg: 'bg-sky-50' },
  { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', bg: 'bg-indigo-50' },
  { color: 'bg-pink-100 text-pink-800 border-pink-300', bg: 'bg-pink-50' },
]
function hashIdx(key: string, mod: number) { let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0; return h % mod }

// ─── Types ──────────────────────────────────────────────────────────────────
interface RefClass { id: string; name: string }
interface RefSubject { id: string; name: string }
interface RefTeacher { id: string; name: string }
interface UIEntry { id: string; classId: string; subjectId: string; teacherId: string; day: string; period: number; room: string; subjectName: string; className: string; teacherName: string }

interface ApiEntry {
  id: string; classId: string; subjectId: string; staffId: string | null; dayOfWeek: number; period: number; room: string | null
  class?: { name: string } | null; subject?: { name: string } | null
}

// ─── Module ──────────────────────────────────────────────────────────────────
export default function TimetableModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [entries, setEntries] = useState<UIEntry[]>([])
  const [classes, setClasses] = useState<RefClass[]>([])
  const [subjects, setSubjects] = useState<RefSubject[]>([])
  const [teachers, setTeachers] = useState<RefTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<UIEntry | null>(null)
  const [form, setForm] = useState({ classId: '', subjectId: '', teacherId: 'none', day: 'Monday', period: '0', room: '' })

  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t.name])), [teachers])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [acaRes, staffRes, ttRes] = await Promise.all([
        fetch('/api/academics').then((r) => r.json()),
        fetch('/api/staff?limit=500').then((r) => r.json()),
        fetch('/api/timetable?limit=500').then((r) => r.json()),
      ])
      const cls: RefClass[] = (acaRes.classes || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
      const subs: RefSubject[] = (acaRes.subjects || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))
      const staff: RefTeacher[] = (staffRes.data || []).map((s: { id: string; title: string | null; firstName: string; lastName: string }) => ({ id: s.id, name: [s.title, s.firstName, s.lastName].filter(Boolean).join(' ') }))
      const tMap = new Map(staff.map((t) => [t.id, t.name]))
      const mapped: UIEntry[] = (ttRes.data as ApiEntry[] || []).map((e) => ({
        id: e.id, classId: e.classId, subjectId: e.subjectId, teacherId: e.staffId || 'none',
        day: DAYS[(e.dayOfWeek || 1) - 1] || 'Monday', period: (e.period || 1) - 1, room: e.room || '',
        subjectName: e.subject?.name || '—', className: e.class?.name || '—', teacherName: e.staffId ? (tMap.get(e.staffId) || '—') : '—',
      }))
      setClasses(cls); setSubjects(subs); setTeachers(staff); setEntries(mapped)
      setSelectedClass((prev) => prev || cls[0]?.id || '')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load timetable')
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Lookups
  const subjectColor = useCallback((id: string) => SUBJECT_PALETTE[hashIdx(id || 'x', SUBJECT_PALETTE.length)], [])
  const subjName = useCallback((id: string) => subjects.find((s) => s.id === id)?.name || '—', [subjects])

  // Computed stats
  const totalPeriods = entries.length
  const teachersScheduled = new Set(entries.filter((e) => e.teacherId !== 'none').map((e) => e.teacherId)).size
  const roomsInUse = new Set(entries.map((e) => e.room).filter(Boolean)).size
  const totalSlots = DAYS.length * PERIODS.length * Math.max(classes.length, 1)
  const freeSlots = Math.max(totalSlots - totalPeriods, 0)

  const entriesForClass = useMemo(() => entries.filter((e) => e.classId === selectedClass), [entries, selectedClass])
  const entriesForTeacher = useMemo(() => selectedTeacher === 'all' ? entries : entries.filter((e) => e.teacherId === selectedTeacher), [entries, selectedTeacher])

  // Handlers
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
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this timetable entry?')) return
    setBusy(true)
    try { const r = await fetch(`/api/timetable?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); const j = await r.json(); if (!r.ok) throw new Error(j?.error || 'Failed'); toast.success('Entry deleted'); load() }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const handleSave = async () => {
    if (!form.classId || !form.subjectId) { toast.error('Class and subject are required'); return }
    const payload = {
      classId: form.classId, subjectId: form.subjectId,
      staffId: form.teacherId === 'none' ? null : form.teacherId,
      dayOfWeek: DAYS.indexOf(form.day) + 1, period: parseInt(form.period) + 1, room: form.room || null,
    }
    setBusy(true)
    try {
      const res = await fetch('/api/timetable', {
        method: editEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEntry ? { id: editEntry.id, ...payload } : payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save entry')
      toast.success(editEntry ? 'Entry updated' : 'Entry added')
      setDialogOpen(false); load()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading timetable…</div>
  }

  const noRefs = classes.length === 0 || subjects.length === 0

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

          <SectionCard title="Today's Highlights" description={`${classes.find((c) => c.id === selectedClass)?.name || 'Selected class'} schedule today`}>
            <div className="space-y-2">
              {(() => {
                const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 'Monday'
                const todayEntries = entries.filter((e) => e.day === today && e.classId === selectedClass)
                if (todayEntries.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No classes scheduled today (or pick a class in Weekly View).</p>
                return todayEntries.sort((a, b) => a.period - b.period).map((entry) => {
                  const col = subjectColor(entry.subjectId)
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="text-xs text-muted-foreground w-20 font-mono">{PERIOD_TIMES[entry.period]}</div>
                      <div className={cn('h-8 w-1.5 rounded-full', col.bg)} />
                      <div className="flex-1"><div className="flex items-center gap-2"><Badge className={cn('text-xs border', col.color)}>{entry.subjectName}</Badge><span className="text-xs text-muted-foreground">{entry.room || '—'}</span></div><p className="text-xs text-muted-foreground mt-0.5">{entry.teacherName}</p></div>
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
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((cls) => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent>
                </Select>
                <Badge variant="secondary" className="text-[10px]">{entriesForClass.length} periods/week</Badge>
              </div>
            }
          />
          <TableShell>
            <Table className="w-full min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24 text-xs font-semibold text-muted-foreground text-left">Period</TableHead>
                  {DAYS.map((day) => (
                    <TableHead key={day} className="text-xs font-semibold text-muted-foreground text-center">{day}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERIODS.map((periodLabel, periodIdx) => (
                  <TableRow key={periodIdx}>
                    <TableCell className="bg-muted/30 py-2">
                      <div className="text-xs font-medium">{periodLabel}</div>
                      <div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[periodIdx]}</div>
                    </TableCell>
                    {DAYS.map((day) => {
                      const entry = entriesForClass.find((e) => e.day === day && e.period === periodIdx)
                      if (!entry) {
                        return (
                          <TableCell key={day} className="p-1">
                            <div className="h-full min-h-[60px] flex items-center justify-center">
                              <span className="text-xs text-muted-foreground/40">—</span>
                            </div>
                          </TableCell>
                        )
                      }
                      const col = subjectColor(entry.subjectId)
                      return (
                        <TableCell key={day} className="p-1">
                          <div
                            className={cn('rounded-lg p-2 min-h-[60px] cursor-pointer transition-all hover:shadow-sm border', col.bg, col.color)}
                            onClick={() => handleEdit(entry)}
                          >
                            <div className="text-xs font-bold">{entry.subjectName}</div>
                            <div className="text-[10px] mt-0.5 opacity-80">{entry.teacherName}</div>
                            <div className="text-[10px] opacity-70">{entry.room || '—'}</div>
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
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
          <TableShell>
            <Table className="w-full min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24 text-xs font-semibold text-muted-foreground text-left">Period</TableHead>
                  {DAYS.map((day) => (
                    <TableHead key={day} className="text-xs font-semibold text-muted-foreground text-center">{day}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERIODS.map((periodLabel, periodIdx) => (
                  <TableRow key={periodIdx}>
                    <TableCell className="bg-muted/30 py-2">
                      <div className="text-xs font-medium">{periodLabel}</div>
                      <div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[periodIdx]}</div>
                    </TableCell>
                    {DAYS.map((day) => {
                      const entry = entriesForTeacher.find((e) => e.day === day && e.period === periodIdx)
                      if (!entry) {
                        return (
                          <TableCell key={day} className="p-1">
                            <div className="h-full min-h-[60px] flex items-center justify-center">
                              {selectedTeacher !== 'all' ? (
                                <span className="text-[10px] text-emerald-600 font-medium">Free</span>
                              ) : (
                                <span className="text-xs text-muted-foreground/40">—</span>
                              )}
                            </div>
                          </TableCell>
                        )
                      }
                      const col = subjectColor(entry.subjectId)
                      return (
                        <TableCell key={day} className="p-1">
                          <div className={cn('rounded-lg p-2 min-h-[60px] border', col.bg, col.color)}>
                            <div className="text-xs font-bold">{entry.subjectName}</div>
                            <div className="text-[10px] mt-0.5 opacity-80">{entry.className}</div>
                            <div className="text-[10px] opacity-70">{entry.room || '—'}</div>
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
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

      {/* ─── Add/Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</DialogTitle>
            <DialogDescription>{editEntry ? 'Modify the schedule entry details' : 'Create a new timetable slot'}. Conflicts (class / teacher / room) are detected automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Class</Label><Select value={form.classId} onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classes.map((cls) => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Subject</Label><Select value={form.subjectId} onValueChange={(v) => setForm((p) => ({ ...p, subjectId: v }))}><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Teacher</Label><Select value={form.teacherId} onValueChange={(v) => setForm((p) => ({ ...p, teacherId: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Room</Label><Input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="e.g. Room 1 / Science Lab" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Day</Label><Select value={form.day} onValueChange={(v) => setForm((p) => ({ ...p, day: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Period</Label><Select value={form.period} onValueChange={(v) => setForm((p) => ({ ...p, period: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PERIODS.map((p, idx) => <SelectItem key={idx} value={String(idx)}>{p} ({PERIOD_TIMES[idx]})</SelectItem>)}</SelectContent></Select></div>
            </div>
            {form.subjectId && <p className="text-xs text-muted-foreground">Selected: <span className="font-medium">{subjName(form.subjectId)}</span></p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={busy} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editEntry ? 'Save Changes' : 'Add Entry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleContainer>
  )
}
