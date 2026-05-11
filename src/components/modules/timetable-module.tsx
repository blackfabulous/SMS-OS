'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Calendar,
  Users,
  MapPin,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Layers,
  Edit,
  Trash2,
  Filter,
} from 'lucide-react'

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

// ─── Mock Data ──────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8']
const PERIOD_TIMES = ['07:30-08:10', '08:10-08:50', '08:50-09:30', '09:30-10:10', '10:30-11:10', '11:10-11:50', '11:50-12:30', '14:00-14:40']

const TEACHERS = [
  { id: 't1', name: 'Mrs. Chideme', initials: 'MC' },
  { id: 't2', name: 'Mr. Ncube', initials: 'MN' },
  { id: 't3', name: 'Ms. Dube', initials: 'MD' },
  { id: 't4', name: 'Mr. Moyo', initials: 'MM' },
  { id: 't5', name: 'Mrs. Sithole', initials: 'MS' },
  { id: 't6', name: 'Mr. Gumbo', initials: 'MG' },
  { id: 't7', name: 'Mrs. Nhongo', initials: 'MN' },
  { id: 't8', name: 'Mr. Ndlovu', initials: 'MNd' },
  { id: 't9', name: 'Ms. Mukasa', initials: 'MMu' },
  { id: 't10', name: 'Mr. Chikwanda', initials: 'MCk' },
]

const CLASSES = [
  { id: 'c1', name: 'Form 1A' },
  { id: 'c2', name: 'Form 1B' },
  { id: 'c3', name: 'Form 2A' },
  { id: 'c4', name: 'Form 2B' },
  { id: 'c5', name: 'Form 3A' },
  { id: 'c6', name: 'Form 3B' },
  { id: 'c7', name: 'Form 4A' },
  { id: 'c8', name: 'Form 4B' },
  { id: 'c9', name: 'Form 5A' },
  { id: 'c10', name: 'Form 6A' },
]

const ROOMS = [
  'Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5',
  'Room 6', 'Room 7', 'Room 8', 'Science Lab', 'Computer Lab',
  'Hall A', 'Hall B',
]

const SUBJECTS = [
  { id: 's1', name: 'Mathematics', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', bg: 'bg-emerald-50' },
  { id: 's2', name: 'English', color: 'bg-teal-100 text-teal-800 border-teal-300', bg: 'bg-teal-50' },
  { id: 's3', name: 'Science', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', bg: 'bg-cyan-50' },
  { id: 's4', name: 'History', color: 'bg-amber-100 text-amber-800 border-amber-300', bg: 'bg-amber-50' },
  { id: 's5', name: 'Geography', color: 'bg-orange-100 text-orange-800 border-orange-300', bg: 'bg-orange-50' },
  { id: 's6', name: 'Shona', color: 'bg-rose-100 text-rose-800 border-rose-300', bg: 'bg-rose-50' },
  { id: 's7', name: 'Ndebele', color: 'bg-pink-100 text-pink-800 border-pink-300', bg: 'bg-pink-50' },
  { id: 's8', name: 'Physics', color: 'bg-violet-100 text-violet-800 border-violet-300', bg: 'bg-violet-50' },
  { id: 's9', name: 'Chemistry', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', bg: 'bg-fuchsia-50' },
  { id: 's10', name: 'Biology', color: 'bg-lime-100 text-lime-800 border-lime-300', bg: 'bg-lime-50' },
  { id: 's11', name: 'Accounting', color: 'bg-sky-100 text-sky-800 border-sky-300', bg: 'bg-sky-50' },
  { id: 's12', name: 'Commerce', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', bg: 'bg-indigo-50' },
  { id: 's13', name: 'Art', color: 'bg-red-100 text-red-800 border-red-300', bg: 'bg-red-50' },
  { id: 's14', name: 'PE', color: 'bg-green-100 text-green-800 border-green-300', bg: 'bg-green-50' },
]

interface TimetableEntry {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  day: string
  period: number
  room: string
}

const INITIAL_ENTRIES: TimetableEntry[] = [
  // Monday
  { id: 'e1', classId: 'c1', subjectId: 's1', teacherId: 't1', day: 'Monday', period: 0, room: 'Room 1' },
  { id: 'e2', classId: 'c2', subjectId: 's2', teacherId: 't2', day: 'Monday', period: 0, room: 'Room 2' },
  { id: 'e3', classId: 'c3', subjectId: 's3', teacherId: 't3', day: 'Monday', period: 0, room: 'Science Lab' },
  { id: 'e4', classId: 'c1', subjectId: 's2', teacherId: 't2', day: 'Monday', period: 1, room: 'Room 1' },
  { id: 'e5', classId: 'c3', subjectId: 's1', teacherId: 't1', day: 'Monday', period: 1, room: 'Room 3' },
  { id: 'e6', classId: 'c4', subjectId: 's4', teacherId: 't4', day: 'Monday', period: 1, room: 'Room 4' },
  { id: 'e7', classId: 'c1', subjectId: 's3', teacherId: 't3', day: 'Monday', period: 2, room: 'Science Lab' },
  { id: 'e8', classId: 'c5', subjectId: 's5', teacherId: 't5', day: 'Monday', period: 2, room: 'Room 5' },
  { id: 'e9', classId: 'c2', subjectId: 's6', teacherId: 't6', day: 'Monday', period: 2, room: 'Room 2' },
  { id: 'e10', classId: 'c1', subjectId: 's4', teacherId: 't4', day: 'Monday', period: 3, room: 'Room 1' },
  { id: 'e11', classId: 'c6', subjectId: 's1', teacherId: 't1', day: 'Monday', period: 3, room: 'Room 6' },
  { id: 'e12', classId: 'c7', subjectId: 's8', teacherId: 't7', day: 'Monday', period: 4, room: 'Science Lab' },
  // Tuesday
  { id: 'e13', classId: 'c1', subjectId: 's5', teacherId: 't5', day: 'Tuesday', period: 0, room: 'Room 1' },
  { id: 'e14', classId: 'c2', subjectId: 's1', teacherId: 't1', day: 'Tuesday', period: 0, room: 'Room 2' },
  { id: 'e15', classId: 'c3', subjectId: 's6', teacherId: 't6', day: 'Tuesday', period: 0, room: 'Room 3' },
  { id: 'e16', classId: 'c1', subjectId: 's10', teacherId: 't3', day: 'Tuesday', period: 1, room: 'Science Lab' },
  { id: 'e17', classId: 'c4', subjectId: 's2', teacherId: 't2', day: 'Tuesday', period: 1, room: 'Room 4' },
  { id: 'e18', classId: 'c5', subjectId: 's11', teacherId: 't8', day: 'Tuesday', period: 2, room: 'Room 5' },
  { id: 'e19', classId: 'c1', subjectId: 's6', teacherId: 't6', day: 'Tuesday', period: 2, room: 'Room 1' },
  { id: 'e20', classId: 'c8', subjectId: 's9', teacherId: 't9', day: 'Tuesday', period: 3, room: 'Science Lab' },
  { id: 'e21', classId: 'c1', subjectId: 's11', teacherId: 't8', day: 'Tuesday', period: 3, room: 'Room 1' },
  { id: 'e22', classId: 'c6', subjectId: 's2', teacherId: 't2', day: 'Tuesday', period: 4, room: 'Room 6' },
  // Wednesday
  { id: 'e23', classId: 'c1', subjectId: 's8', teacherId: 't7', day: 'Wednesday', period: 0, room: 'Science Lab' },
  { id: 'e24', classId: 'c3', subjectId: 's2', teacherId: 't2', day: 'Wednesday', period: 0, room: 'Room 3' },
  { id: 'e25', classId: 'c5', subjectId: 's1', teacherId: 't1', day: 'Wednesday', period: 1, room: 'Room 5' },
  { id: 'e26', classId: 'c1', subjectId: 's14', teacherId: 't10', day: 'Wednesday', period: 1, room: 'Hall A' },
  { id: 'e27', classId: 'c7', subjectId: 's3', teacherId: 't3', day: 'Wednesday', period: 2, room: 'Science Lab' },
  { id: 'e28', classId: 'c1', subjectId: 's9', teacherId: 't9', day: 'Wednesday', period: 2, room: 'Science Lab' },
  { id: 'e29', classId: 'c2', subjectId: 's4', teacherId: 't4', day: 'Wednesday', period: 3, room: 'Room 2' },
  { id: 'e30', classId: 'c1', subjectId: 's13', teacherId: 't10', day: 'Wednesday', period: 3, room: 'Room 1' },
  // Thursday
  { id: 'e31', classId: 'c1', subjectId: 's7', teacherId: 't5', day: 'Thursday', period: 0, room: 'Room 1' },
  { id: 'e32', classId: 'c4', subjectId: 's1', teacherId: 't1', day: 'Thursday', period: 0, room: 'Room 4' },
  { id: 'e33', classId: 'c1', subjectId: 's12', teacherId: 't8', day: 'Thursday', period: 1, room: 'Room 1' },
  { id: 'e34', classId: 'c8', subjectId: 's2', teacherId: 't2', day: 'Thursday', period: 1, room: 'Room 8' },
  { id: 'e35', classId: 'c1', subjectId: 's5', teacherId: 't5', day: 'Thursday', period: 2, room: 'Room 1' },
  { id: 'e36', classId: 'c9', subjectId: 's3', teacherId: 't3', day: 'Thursday', period: 2, room: 'Science Lab' },
  { id: 'e37', classId: 'c1', subjectId: 's2', teacherId: 't2', day: 'Thursday', period: 3, room: 'Room 1' },
  { id: 'e38', classId: 'c10', subjectId: 's1', teacherId: 't1', day: 'Thursday', period: 3, room: 'Room 10' },
  // Friday
  { id: 'e39', classId: 'c1', subjectId: 's3', teacherId: 't3', day: 'Friday', period: 0, room: 'Science Lab' },
  { id: 'e40', classId: 'c5', subjectId: 's2', teacherId: 't2', day: 'Friday', period: 0, room: 'Room 5' },
  { id: 'e41', classId: 'c1', subjectId: 's1', teacherId: 't1', day: 'Friday', period: 1, room: 'Room 1' },
  { id: 'e42', classId: 'c3', subjectId: 's5', teacherId: 't5', day: 'Friday', period: 1, room: 'Room 3' },
  { id: 'e43', classId: 'c1', subjectId: 's4', teacherId: 't4', day: 'Friday', period: 2, room: 'Room 1' },
  { id: 'e44', classId: 'c6', subjectId: 's6', teacherId: 't6', day: 'Friday', period: 2, room: 'Room 6' },
  { id: 'e45', classId: 'c7', subjectId: 's11', teacherId: 't8', day: 'Friday', period: 3, room: 'Room 7' },
  { id: 'e46', classId: 'c1', subjectId: 's10', teacherId: 't3', day: 'Friday', period: 3, room: 'Science Lab' },
  // Additional entries for afternoon periods
  { id: 'e47', classId: 'c1', subjectId: 's1', teacherId: 't1', day: 'Monday', period: 4, room: 'Room 1' },
  { id: 'e48', classId: 'c2', subjectId: 's3', teacherId: 't3', day: 'Monday', period: 4, room: 'Science Lab' },
  { id: 'e49', classId: 'c1', subjectId: 's12', teacherId: 't8', day: 'Tuesday', period: 4, room: 'Room 1' },
  { id: 'e50', classId: 'c3', subjectId: 's4', teacherId: 't4', day: 'Wednesday', period: 4, room: 'Room 3' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSubject(id: string) {
  return SUBJECTS.find((s) => s.id === id) || SUBJECTS[0]
}
function getTeacher(id: string) {
  return TEACHERS.find((t) => t.id === id) || TEACHERS[0]
}
function getClass(id: string) {
  return CLASSES.find((c) => c.id === id) || CLASSES[0]
}

// ─── Timetable Module ──────────────────────────────────────────────────────

export default function TimetableModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [entries, setEntries] = useState<TimetableEntry[]>(INITIAL_ENTRIES)
  const [selectedClass, setSelectedClass] = useState('c1')
  const [selectedTeacher, setSelectedTeacher] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null)
  const [form, setForm] = useState({
    classId: 'c1',
    subjectId: 's1',
    teacherId: 't1',
    day: 'Monday',
    period: '0',
    room: 'Room 1',
  })

  // ─── Computed ─────────────────────────────────────────────────────────

  const totalPeriods = entries.length
  const teachersScheduled = new Set(entries.map((e) => e.teacherId)).size
  const roomsInUse = new Set(entries.map((e) => e.room)).size
  const totalSlots = DAYS.length * PERIODS.length * CLASSES.length
  const freeSlots = totalSlots - totalPeriods

  const entriesForClass = useMemo(() => {
    return entries.filter((e) => e.classId === selectedClass)
  }, [entries, selectedClass])

  const entriesForTeacher = useMemo(() => {
    if (selectedTeacher === 'all') return entries
    return entries.filter((e) => e.teacherId === selectedTeacher)
  }, [entries, selectedTeacher])

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditEntry(null)
    setForm({ classId: 'c1', subjectId: 's1', teacherId: 't1', day: 'Monday', period: '0', room: 'Room 1' })
    setDialogOpen(true)
  }

  const handleEdit = (entry: TimetableEntry) => {
    setEditEntry(entry)
    setForm({
      classId: entry.classId,
      subjectId: entry.subjectId,
      teacherId: entry.teacherId,
      day: entry.day,
      period: String(entry.period),
      room: entry.room,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSave = () => {
    if (editEntry) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editEntry.id
            ? { ...e, classId: form.classId, subjectId: form.subjectId, teacherId: form.teacherId, day: form.day, period: parseInt(form.period), room: form.room }
            : e
        )
      )
    } else {
      const newEntry: TimetableEntry = {
        id: `e${Date.now()}`,
        classId: form.classId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        day: form.day,
        period: parseInt(form.period),
        room: form.room,
      }
      setEntries((prev) => [...prev, newEntry])
    }
    setDialogOpen(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────

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
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage class schedules, periods and room allocations</p>
        </div>
        <Button
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
          onClick={handleAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            My Schedule
          </TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Manage
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="overview-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Periods</p>
                        <p className="text-2xl font-bold tracking-tight">{totalPeriods}</p>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-600">Scheduled</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                        <Clock className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teachers Scheduled</p>
                        <p className="text-2xl font-bold tracking-tight">{teachersScheduled}</p>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-teal-600" />
                          <span className="text-xs font-medium text-teal-600">Of {TEACHERS.length} total</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                        <Users className="h-5 w-5 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rooms In Use</p>
                        <p className="text-2xl font-bold tracking-tight">{roomsInUse}</p>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-medium text-amber-600">Of {ROOMS.length} available</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                        <MapPin className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Free Periods</p>
                        <p className="text-2xl font-bold tracking-tight">{freeSlots}</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-violet-600" />
                          <span className="text-xs font-medium text-violet-600">Unscheduled slots</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                        <Calendar className="h-5 w-5 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 to-purple-500" />
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                  <CardDescription>Common timetable management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => { setActiveTab('weekly'); setSelectedClass('c1') }}
                      className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">View Weekly Grid</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('schedule') }}
                      className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Teacher Schedule</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('manage') }}
                      className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <Edit className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Manage Entries</span>
                    </button>
                    <button
                      onClick={handleAdd}
                      className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add New Entry</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Schedule Summary */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Today&apos;s Highlights</CardTitle>
                  <CardDescription>Current day schedule summary for Form 1A</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(() => {
                      const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 'Monday'
                      const todayEntries = entries.filter((e) => e.day === today && e.classId === 'c1')
                      if (todayEntries.length === 0) {
                        return <p className="text-sm text-muted-foreground text-center py-4">No classes scheduled</p>
                      }
                      return todayEntries.sort((a, b) => a.period - b.period).map((entry) => {
                        const subject = getSubject(entry.subjectId)
                        const teacher = getTeacher(entry.teacherId)
                        return (
                          <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="text-xs text-muted-foreground w-20 font-mono">{PERIOD_TIMES[entry.period]}</div>
                            <div className={cn('h-8 w-1 rounded-full', subject.bg.replace('bg-', 'bg-'))} style={{ backgroundColor: undefined }}>
                              <div className={cn('h-full w-full rounded-full', subject.bg)} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={cn('text-xs border', subject.color)}>{subject.name}</Badge>
                                <span className="text-xs text-muted-foreground">{entry.room}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{teacher.name}</p>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Weekly View Tab ──────────────────────────────────────────── */}
        <TabsContent value="weekly" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="weekly-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Class Selector */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">Class:</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-xs">
                  {entriesForClass.length} periods/week
                </Badge>
              </div>

              {/* Weekly Grid */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border/50 p-2 text-xs font-semibold text-muted-foreground text-left w-24">
                            Period
                          </th>
                          {DAYS.map((day) => (
                            <th key={day} className="border border-border/50 p-2 text-xs font-semibold text-muted-foreground text-center">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map((periodLabel, periodIdx) => (
                          <tr key={periodIdx}>
                            <td className="border border-border/50 p-2 bg-muted/30">
                              <div className="text-xs font-medium">{periodLabel}</div>
                              <div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[periodIdx]}</div>
                              {periodIdx === 3 && (
                                <div className="text-[10px] text-emerald-600 font-medium mt-1">Break</div>
                              )}
                            </td>
                            {DAYS.map((day) => {
                              const entry = entriesForClass.find((e) => e.day === day && e.period === periodIdx)
                              if (!entry) {
                                return (
                                  <td key={day} className="border border-border/50 p-1">
                                    <div className="h-full min-h-[60px] flex items-center justify-center">
                                      <span className="text-xs text-muted-foreground/40">—</span>
                                    </div>
                                  </td>
                                )
                              }
                              const subject = getSubject(entry.subjectId)
                              const teacher = getTeacher(entry.teacherId)
                              return (
                                <td key={day} className="border border-border/50 p-1">
                                  <div
                                    className={cn(
                                      'rounded-lg p-2 min-h-[60px] cursor-pointer transition-all hover:shadow-sm border',
                                      subject.bg,
                                      subject.color
                                    )}
                                    onClick={() => handleEdit(entry)}
                                  >
                                    <div className="text-xs font-bold">{subject.name}</div>
                                    <div className="text-[10px] mt-0.5 opacity-80">{teacher.name}</div>
                                    <div className="text-[10px] opacity-70">{entry.room}</div>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Subject Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.slice(0, 10).map((s) => (
                      <Badge key={s.id} className={cn('text-[10px] border', s.color)}>
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── My Schedule Tab ──────────────────────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="schedule-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Teacher Selector */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">Teacher:</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {TEACHERS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTeacher !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    {entriesForTeacher.length} periods/week
                  </Badge>
                )}
              </div>

              {/* Teacher Schedule Grid */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border/50 p-2 text-xs font-semibold text-muted-foreground text-left w-24">
                            Period
                          </th>
                          {DAYS.map((day) => (
                            <th key={day} className="border border-border/50 p-2 text-xs font-semibold text-muted-foreground text-center">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map((periodLabel, periodIdx) => (
                          <tr key={periodIdx}>
                            <td className="border border-border/50 p-2 bg-muted/30">
                              <div className="text-xs font-medium">{periodLabel}</div>
                              <div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[periodIdx]}</div>
                            </td>
                            {DAYS.map((day) => {
                              const entry = entriesForTeacher.find((e) => e.day === day && e.period === periodIdx)
                              if (!entry) {
                                return (
                                  <td key={day} className="border border-border/50 p-1">
                                    <div className="h-full min-h-[60px] flex items-center justify-center">
                                      {selectedTeacher !== 'all' ? (
                                        <span className="text-[10px] text-emerald-600 font-medium">Free</span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground/40">—</span>
                                      )}
                                    </div>
                                  </td>
                                )
                              }
                              const subject = getSubject(entry.subjectId)
                              const cls = getClass(entry.classId)
                              return (
                                <td key={day} className="border border-border/50 p-1">
                                  <div
                                    className={cn(
                                      'rounded-lg p-2 min-h-[60px] cursor-pointer transition-all hover:shadow-sm border',
                                      subject.bg,
                                      subject.color
                                    )}
                                  >
                                    <div className="text-xs font-bold">{subject.name}</div>
                                    <div className="text-[10px] mt-0.5 opacity-80">{cls.name}</div>
                                    <div className="text-[10px] opacity-70">{entry.room}</div>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Workload Summary */}
              {selectedTeacher !== 'all' && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Workload Summary</CardTitle>
                    <CardDescription>{getTeacher(selectedTeacher).name}&apos;s teaching allocation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-emerald-50">
                        <p className="text-2xl font-bold text-emerald-700">{entriesForTeacher.length}</p>
                        <p className="text-xs text-emerald-600">Periods/Week</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-teal-50">
                        <p className="text-2xl font-bold text-teal-700">
                          {new Set(entriesForTeacher.map((e) => e.classId)).size}
                        </p>
                        <p className="text-xs text-teal-600">Classes</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-amber-50">
                        <p className="text-2xl font-bold text-amber-700">
                          {new Set(entriesForTeacher.map((e) => e.subjectId)).size}
                        </p>
                        <p className="text-xs text-amber-600">Subjects</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-violet-50">
                        <p className="text-2xl font-bold text-violet-700">
                          {40 - entriesForTeacher.length}
                        </p>
                        <p className="text-xs text-violet-600">Free Periods</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Manage Tab ───────────────────────────────────────────────── */}
        <TabsContent value="manage" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="manage-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{entries.length} timetable entries</p>
                <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Entry
                </Button>
              </div>

              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Day</TableHead>
                          <TableHead className="text-xs">Period</TableHead>
                          <TableHead className="text-xs">Class</TableHead>
                          <TableHead className="text-xs">Subject</TableHead>
                          <TableHead className="text-xs">Teacher</TableHead>
                          <TableHead className="text-xs">Room</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries
                          .sort((a, b) => {
                            const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
                            if (dayOrder !== 0) return dayOrder
                            return a.period - b.period
                          })
                          .map((entry) => {
                            const subject = getSubject(entry.subjectId)
                            const teacher = getTeacher(entry.teacherId)
                            const cls = getClass(entry.classId)
                            return (
                              <TableRow key={entry.id} className="hover:bg-muted/20">
                                <TableCell className="text-sm">{entry.day}</TableCell>
                                <TableCell className="text-sm">
                                  <div className="font-medium">{PERIODS[entry.period]}</div>
                                  <div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[entry.period]}</div>
                                </TableCell>
                                <TableCell className="text-sm font-medium">{cls.name}</TableCell>
                                <TableCell>
                                  <Badge className={cn('text-[10px] border', subject.color)}>{subject.name}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">{teacher.name}</TableCell>
                                <TableCell className="text-sm">{entry.room}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => handleEdit(entry)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => handleDelete(entry.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* ─── Add/Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</DialogTitle>
            <DialogDescription>
              {editEntry ? 'Modify the schedule entry details' : 'Create a new timetable slot'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Class</Label>
                <Select value={form.classId} onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm((p) => ({ ...p, subjectId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Teacher</Label>
                <Select value={form.teacherId} onValueChange={(v) => setForm((p) => ({ ...p, teacherId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEACHERS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Room</Label>
                <Select value={form.room} onValueChange={(v) => setForm((p) => ({ ...p, room: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROOMS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Day</Label>
                <Select value={form.day} onValueChange={(v) => setForm((p) => ({ ...p, day: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Period</Label>
                <Select value={form.period} onValueChange={(v) => setForm((p) => ({ ...p, period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {p} ({PERIOD_TIMES[idx]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {editEntry ? 'Save Changes' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
