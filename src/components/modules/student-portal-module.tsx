'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  BookOpen,
  BarChart3,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Upload,
  Download,
  FileText,
  Users,
  Library,
  Plus,
  Send,
  ChevronRight,
  Award,
  Target,
  BookmarkCheck,
  Timer,
  Home,
  Flame,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
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
  type ChartConfig,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimetablePeriod {
  day: string
  periods: {
    period: number
    time: string
    subject: string
    teacher: string
    room: string
    color: string
  }[]
}

interface SubjectGrade {
  subject: string
  midTerm: number
  test: number
  exam: number
  letterGrade: string
  teacher: string
}

interface Assignment {
  id: string
  title: string
  subject: string
  teacher: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded' | 'overdue'
  mark?: number
  maxMark: number
  description: string
}

interface BorrowedBook {
  id: string
  title: string
  author: string
  dueDate: string
  overdue: boolean
  fineAmount?: number
  coverColor: string
}

interface DigitalResource {
  id: string
  title: string
  subject: string
  type: 'Notes' | 'Video' | 'Past Paper' | 'Worksheet'
  size: string
  downloads: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const studentName = 'Tendai Dube'
const studentClass = 'Form 4A'
const studentHouse = 'Mhondoro'
const studentNumber = 'STD-2024-0042'
const studentInitials = 'TD'

const todaySchedule = [
  { period: 1, time: '7:30 - 8:15', subject: 'Mathematics', teacher: 'Mr. Hove', room: 'Rm 12', color: 'bg-emerald-500' },
  { period: 2, time: '8:20 - 9:05', subject: 'English', teacher: 'Mrs. Mlambo', room: 'Rm 8', color: 'bg-teal-500' },
  { period: 3, time: '9:10 - 9:55', subject: 'Physics', teacher: 'Mrs. Ncube', room: 'Lab 1', color: 'bg-cyan-500' },
  { period: 4, time: '10:15 - 11:00', subject: 'Shona', teacher: 'Mr. Gumbo', room: 'Rm 5', color: 'bg-amber-500' },
  { period: 5, time: '11:05 - 11:50', subject: 'History', teacher: 'Mr. Moyo', room: 'Rm 3', color: 'bg-violet-500' },
  { period: 6, time: '11:55 - 12:40', subject: 'Chemistry', teacher: 'Mr. Zvambe', room: 'Lab 2', color: 'bg-rose-500' },
  { period: 7, time: '1:30 - 2:15', subject: 'Biology', teacher: 'Mrs. Dube', room: 'Lab 1', color: 'bg-orange-500' },
  { period: 8, time: '2:20 - 3:05', subject: 'Geography', teacher: 'Ms. Chikumba', room: 'Rm 10', color: 'bg-sky-500' },
]

const weeklyTimetable: TimetablePeriod[] = [
  {
    day: 'Monday',
    periods: [
      { period: 1, time: '7:30', subject: 'Mathematics', teacher: 'Mr. Hove', room: 'Rm 12', color: 'bg-emerald-500' },
      { period: 2, time: '8:20', subject: 'English', teacher: 'Mrs. Mlambo', room: 'Rm 8', color: 'bg-teal-500' },
      { period: 3, time: '9:10', subject: 'Physics', teacher: 'Mrs. Ncube', room: 'Lab 1', color: 'bg-cyan-500' },
      { period: 4, time: '10:15', subject: 'Shona', teacher: 'Mr. Gumbo', room: 'Rm 5', color: 'bg-amber-500' },
      { period: 5, time: '11:05', subject: 'History', teacher: 'Mr. Moyo', room: 'Rm 3', color: 'bg-violet-500' },
      { period: 6, time: '11:55', subject: 'Chemistry', teacher: 'Mr. Zvambe', room: 'Lab 2', color: 'bg-rose-500' },
      { period: 7, time: '1:30', subject: 'Biology', teacher: 'Mrs. Dube', room: 'Lab 1', color: 'bg-orange-500' },
      { period: 8, time: '2:20', subject: 'Geography', teacher: 'Ms. Chikumba', room: 'Rm 10', color: 'bg-sky-500' },
    ],
  },
  {
    day: 'Tuesday',
    periods: [
      { period: 1, time: '7:30', subject: 'English', teacher: 'Mrs. Mlambo', room: 'Rm 8', color: 'bg-teal-500' },
      { period: 2, time: '8:20', subject: 'Mathematics', teacher: 'Mr. Hove', room: 'Rm 12', color: 'bg-emerald-500' },
      { period: 3, time: '9:10', subject: 'Biology', teacher: 'Mrs. Dube', room: 'Lab 1', color: 'bg-orange-500' },
      { period: 4, time: '10:15', subject: 'Chemistry', teacher: 'Mr. Zvambe', room: 'Lab 2', color: 'bg-rose-500' },
      { period: 5, time: '11:05', subject: 'Geography', teacher: 'Ms. Chikumba', room: 'Rm 10', color: 'bg-sky-500' },
      { period: 6, time: '11:55', subject: 'Physics', teacher: 'Mrs. Ncube', room: 'Lab 1', color: 'bg-cyan-500' },
      { period: 7, time: '1:30', subject: 'Shona', teacher: 'Mr. Gumbo', room: 'Rm 5', color: 'bg-amber-500' },
      { period: 8, time: '2:20', subject: 'History', teacher: 'Mr. Moyo', room: 'Rm 3', color: 'bg-violet-500' },
    ],
  },
  {
    day: 'Wednesday',
    periods: [
      { period: 1, time: '7:30', subject: 'Physics', teacher: 'Mrs. Ncube', room: 'Lab 1', color: 'bg-cyan-500' },
      { period: 2, time: '8:20', subject: 'Shona', teacher: 'Mr. Gumbo', room: 'Rm 5', color: 'bg-amber-500' },
      { period: 3, time: '9:10', subject: 'Mathematics', teacher: 'Mr. Hove', room: 'Rm 12', color: 'bg-emerald-500' },
      { period: 4, time: '10:15', subject: 'Geography', teacher: 'Ms. Chikumba', room: 'Rm 10', color: 'bg-sky-500' },
      { period: 5, time: '11:05', subject: 'English', teacher: 'Mrs. Mlambo', room: 'Rm 8', color: 'bg-teal-500' },
      { period: 6, time: '11:55', subject: 'History', teacher: 'Mr. Moyo', room: 'Rm 3', color: 'bg-violet-500' },
      { period: 7, time: '1:30', subject: 'Chemistry', teacher: 'Mr. Zvambe', room: 'Lab 2', color: 'bg-rose-500' },
      { period: 8, time: '2:20', subject: 'PE / Sports', teacher: 'Mr. Sithole', room: 'Field', color: 'bg-lime-500' },
    ],
  },
  {
    day: 'Thursday',
    periods: [
      { period: 1, time: '7:30', subject: 'History', teacher: 'Mr. Moyo', room: 'Rm 3', color: 'bg-violet-500' },
      { period: 2, time: '8:20', subject: 'Biology', teacher: 'Mrs. Dube', room: 'Lab 1', color: 'bg-orange-500' },
      { period: 3, time: '9:10', subject: 'English', teacher: 'Mrs. Mlambo', room: 'Rm 8', color: 'bg-teal-500' },
      { period: 4, time: '10:15', subject: 'Physics', teacher: 'Mrs. Ncube', room: 'Lab 1', color: 'bg-cyan-500' },
      { period: 5, time: '11:05', subject: 'Chemistry', teacher: 'Mr. Zvambe', room: 'Lab 2', color: 'bg-rose-500' },
      { period: 6, time: '11:55', subject: 'Mathematics', teacher: 'Mr. Hove', room: 'Rm 12', color: 'bg-emerald-500' },
      { period: 7, time: '1:30', subject: 'Geography', teacher: 'Ms. Chikumba', room: 'Rm 10', color: 'bg-sky-500' },
      { period: 8, time: '2:20', subject: 'Shona', teacher: 'Mr. Gumbo', room: 'Rm 5', color: 'bg-amber-500' },
    ],
  },
  {
    day: 'Friday',
    periods: [
      { period: 1, time: '7:30', subject: 'Chemistry', teacher: 'Mr. Zvambe', room: 'Lab 2', color: 'bg-rose-500' },
      { period: 2, time: '8:20', subject: 'Geography', teacher: 'Ms. Chikumba', room: 'Rm 10', color: 'bg-sky-500' },
      { period: 3, time: '9:10', subject: 'Shona', teacher: 'Mr. Gumbo', room: 'Rm 5', color: 'bg-amber-500' },
      { period: 4, time: '10:15', subject: 'Mathematics', teacher: 'Mr. Hove', room: 'Rm 12', color: 'bg-emerald-500' },
      { period: 5, time: '11:05', subject: 'Biology', teacher: 'Mrs. Dube', room: 'Lab 1', color: 'bg-orange-500' },
      { period: 6, time: '11:55', subject: 'English', teacher: 'Mrs. Mlambo', room: 'Rm 8', color: 'bg-teal-500' },
      { period: 7, time: '1:30', subject: 'History', teacher: 'Mr. Moyo', room: 'Rm 3', color: 'bg-violet-500' },
      { period: 8, time: '2:20', subject: 'Club Activity', teacher: 'Various', room: 'Various', color: 'bg-lime-500' },
    ],
  },
]

const subjectGrades: SubjectGrade[] = [
  { subject: 'Mathematics', midTerm: 72, test: 78, exam: 75, letterGrade: 'B', teacher: 'Mr. Hove' },
  { subject: 'English Language', midTerm: 82, test: 85, exam: 83, letterGrade: 'A', teacher: 'Mrs. Mlambo' },
  { subject: 'Shona', midTerm: 68, test: 72, exam: 70, letterGrade: 'B', teacher: 'Mr. Gumbo' },
  { subject: 'Physics', midTerm: 58, test: 65, exam: 62, letterGrade: 'C', teacher: 'Mrs. Ncube' },
  { subject: 'Chemistry', midTerm: 62, test: 68, exam: 65, letterGrade: 'C', teacher: 'Mr. Zvambe' },
  { subject: 'Biology', midTerm: 70, test: 74, exam: 72, letterGrade: 'B', teacher: 'Mrs. Dube' },
  { subject: 'History', midTerm: 85, test: 88, exam: 86, letterGrade: 'A', teacher: 'Mr. Moyo' },
  { subject: 'Geography', midTerm: 64, test: 70, exam: 67, letterGrade: 'C', teacher: 'Ms. Chikumba' },
]

const performanceTrend = [
  { term: 'Term 2 2025', average: 68 },
  { term: 'Term 3 2025', average: 72 },
  { term: 'Term 1 2026', average: 75 },
]

const mockAssignments: Assignment[] = [
  { id: '1', title: 'Quadratic Equations Problem Set', subject: 'Mathematics', teacher: 'Mr. Hove', dueDate: '2026-03-07', status: 'pending', maxMark: 100, description: 'Complete exercises 5-12 from Chapter 7' },
  { id: '2', title: 'Comprehension Exercise 3', subject: 'English Language', teacher: 'Mrs. Mlambo', dueDate: '2026-03-05', status: 'submitted', maxMark: 50, description: 'Read the passage and answer all questions' },
  { id: '3', title: 'Forces & Motion Lab Report', subject: 'Physics', teacher: 'Mrs. Ncube', dueDate: '2026-03-03', status: 'graded', mark: 24, maxMark: 30, description: 'Write up the experiment on Newton\'s Second Law' },
  { id: '4', title: 'Ngano yeVatendi Essay', subject: 'Shona', teacher: 'Mr. Gumbo', dueDate: '2026-03-10', status: 'pending', maxMark: 40, description: 'Write a 500-word essay on the assigned Shona novel' },
  { id: '5', title: 'Chemical Reactions Worksheet', subject: 'Chemistry', teacher: 'Mr. Zvambe', dueDate: '2026-03-06', status: 'graded', mark: 18, maxMark: 25, description: 'Balance equations and identify reaction types' },
  { id: '6', title: 'Cell Biology Diagram Test', subject: 'Biology', teacher: 'Mrs. Dube', dueDate: '2026-03-08', status: 'pending', maxMark: 40, description: 'Label and describe cell organelle diagrams' },
  { id: '7', title: 'Zimbabwe Independence Essay', subject: 'History', teacher: 'Mr. Moyo', dueDate: '2026-03-04', status: 'graded', mark: 42, maxMark: 50, description: 'Discuss the events leading to Zimbabwe\'s independence' },
  { id: '8', title: 'Map Reading Assessment', subject: 'Geography', teacher: 'Ms. Chikumba', dueDate: '2026-02-28', status: 'overdue', maxMark: 30, description: 'Complete topographical map interpretation questions' },
  { id: '9', title: 'Algebra Test Revision', subject: 'Mathematics', teacher: 'Mr. Hove', dueDate: '2026-03-12', status: 'pending', maxMark: 80, description: 'Revision worksheet covering all algebra topics' },
]

const borrowedBooks: BorrowedBook[] = [
  { id: '1', title: 'New General Mathematics 4', author: 'Channon et al.', dueDate: '2026-03-15', overdue: false, coverColor: 'bg-emerald-500' },
  { id: '2', title: 'O-Level English Language', author: 'Moyo & Bhebhe', dueDate: '2026-03-10', overdue: false, coverColor: 'bg-teal-500' },
  { id: '3', title: 'Rudo Ibofu (Shona Novel)', author: 'C. Magosvongwe', dueDate: '2026-02-28', overdue: true, fineAmount: 2.50, coverColor: 'bg-amber-500' },
  { id: '4', title: 'O-Level Physics', author: 'A.C. Duncan', dueDate: '2026-03-20', overdue: false, coverColor: 'bg-cyan-500' },
]

const digitalResources: DigitalResource[] = [
  { id: '1', title: 'Algebra & Functions Notes', subject: 'Mathematics', type: 'Notes', size: '2.4 MB', downloads: 89 },
  { id: '2', title: 'ZIMSEC 2024 Maths Paper 1', subject: 'Mathematics', type: 'Past Paper', size: '1.8 MB', downloads: 156 },
  { id: '3', title: 'Newton\'s Laws Video Series', subject: 'Physics', type: 'Video', size: '120 MB', downloads: 33 },
  { id: '4', title: 'English Comprehension Skills', subject: 'English', type: 'Notes', size: '3.1 MB', downloads: 78 },
  { id: '5', title: 'Zimbabwe Independence History', subject: 'History', type: 'Notes', size: '5.1 MB', downloads: 52 },
  { id: '6', title: 'Organic Chemistry Worksheet', subject: 'Chemistry', type: 'Worksheet', size: '0.8 MB', downloads: 25 },
  { id: '7', title: 'ZIMSEC 2024 English Paper 2', subject: 'English', type: 'Past Paper', size: '2.0 MB', downloads: 134 },
  { id: '8', title: 'Cell Biology Diagram Pack', subject: 'Biology', type: 'Notes', size: '4.5 MB', downloads: 41 },
]

const trendChartConfig = {
  average: { label: 'Average %', color: '#10b981' },
} satisfies ChartConfig

const subjectChartConfig = {
  midTerm: { label: 'Mid-Term', color: '#10b981' },
  test: { label: 'Test', color: '#14b8a6' },
  exam: { label: 'Exam', color: '#f59e0b' },
} satisfies ChartConfig

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-100'
  if (grade.startsWith('B')) return 'text-teal-600 bg-teal-100'
  if (grade.startsWith('C')) return 'text-amber-600 bg-amber-100'
  return 'text-red-600 bg-red-100'
}

const gradeTextColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-emerald-600'
  if (grade.startsWith('B')) return 'text-teal-600'
  if (grade.startsWith('C')) return 'text-amber-600'
  return 'text-red-600'
}

const assignmentStatusConfig = (status: string) => {
  switch (status) {
    case 'pending': return { label: 'Pending', color: 'bg-blue-100 text-blue-700', icon: Clock }
    case 'submitted': return { label: 'Submitted', color: 'bg-teal-100 text-teal-700', icon: Send }
    case 'graded': return { label: 'Graded', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
    case 'overdue': return { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    default: return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock }
  }
}

const resourceTypeColor = (type: string) => {
  switch (type) {
    case 'Notes': return 'bg-emerald-100 text-emerald-700'
    case 'Video': return 'bg-red-100 text-red-700'
    case 'Past Paper': return 'bg-amber-100 text-amber-700'
    case 'Worksheet': return 'bg-teal-100 text-teal-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const resourceTypeIcon = (type: string) => {
  switch (type) {
    case 'Notes': return <FileText className="h-4 w-4 text-emerald-600" />
    case 'Video': return <Clock className="h-4 w-4 text-red-500" />
    case 'Past Paper': return <FileText className="h-4 w-4 text-amber-600" />
    case 'Worksheet': return <BookOpen className="h-4 w-4 text-teal-600" />
    default: return <FileText className="h-4 w-4" />
  }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric' })
}

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StudentPortalModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [reserveBookOpen, setReserveBookOpen] = useState(false)
  const [reserveBookTitle, setReserveBookTitle] = useState('')
  const [reportCardOpen, setReportCardOpen] = useState(false)

  const attendanceRate = 94
  const currentAverage = Math.round(subjectGrades.reduce((s, g) => s + g.exam, 0) / subjectGrades.length)
  const libraryBooksDue = borrowedBooks.filter(b => !b.overdue).length
  const assignmentsPending = mockAssignments.filter(a => a.status === 'pending' || a.status === 'overdue').length
  const classPosition = 8
  const classSize = 42

  const pendingAssignments = mockAssignments.filter(a => a.status === 'pending' || a.status === 'overdue')
  const completedAssignments = mockAssignments.filter(a => a.status === 'graded' || a.status === 'submitted')

  const handleSubmitAssignment = () => {
    if (selectedAssignment) {
      toast.success(`"${selectedAssignment.title}" submitted successfully!`)
      setSubmitDialogOpen(false)
      setSelectedAssignment(null)
    }
  }

  const handleReserveBook = () => {
    if (reserveBookTitle) {
      toast.success(`"${reserveBookTitle}" reserved successfully!`)
      setReserveBookTitle('')
      setReserveBookOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Student Portal</h2>
            <p className="text-sm text-muted-foreground">Welcome, {studentName}</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="grades">Grades & Reports</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Welcome Banner */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 p-6 text-white relative">
              <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20 text-white text-lg font-bold">{studentInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">Mhoroi, {studentName.split(' ')[0]}!</h3>
                    <p className="text-teal-100 mt-1">{studentClass} • House {studentHouse} • {studentNumber}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="bg-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-teal-100">Class Position</p>
                    <p className="text-lg font-bold">{classPosition}/{classSize}</p>
                  </div>
                  <div className="bg-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-teal-100">Current Average</p>
                    <p className="text-lg font-bold">{currentAverage}%</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attendance Rate</p>
                    <p className="text-2xl font-bold">{attendanceRate}%</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+2% this term</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Average</p>
                    <p className="text-2xl font-bold">{currentAverage}%</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">+3% from last term</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <BarChart3 className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Library Books Due</p>
                    <p className="text-2xl font-bold">{libraryBooksDue}</p>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">1 overdue</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <Library className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignments Pending</p>
                    <p className="text-2xl font-bold">{assignmentsPending}</p>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-medium text-red-500">1 overdue</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                    <FileText className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Timetable Preview */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" /> Today&apos;s Timetable
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setActiveTab('schedule')}>
                  View Full Schedule <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {todaySchedule.map((period) => (
                  <div key={period.period} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className={cn('w-1 h-10 rounded-full shrink-0', period.color)} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{period.subject}</p>
                      <p className="text-[10px] text-muted-foreground">{period.time.split(' - ')[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{period.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions + Upcoming Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: BarChart3, label: 'View Grades', color: 'bg-emerald-50 text-emerald-600', action: () => setActiveTab('grades') },
                    { icon: FileText, label: 'Assignments', color: 'bg-amber-50 text-amber-600', action: () => setActiveTab('assignments') },
                    { icon: Library, label: 'Library', color: 'bg-teal-50 text-teal-600', action: () => setActiveTab('library') },
                    { icon: Clock, label: 'Timetable', color: 'bg-violet-50 text-violet-600', action: () => setActiveTab('schedule') },
                    { icon: Award, label: 'Report Card', color: 'bg-rose-50 text-rose-600', action: () => setReportCardOpen(true) },
                    { icon: Target, label: 'Progress', color: 'bg-cyan-50 text-cyan-600', action: () => setActiveTab('grades') },
                  ].map((action, idx) => (
                    <button key={idx} onClick={action.action} className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', action.color)}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Timer className="h-4 w-4 text-amber-600" /> Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto space-y-2">
                {pendingAssignments.map(a => {
                  const days = daysUntil(a.dueDate)
                  return (
                    <div key={a.id} className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-colors',
                      a.status === 'overdue' ? 'bg-red-50 border border-red-100' : 'bg-muted/30'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
                          a.status === 'overdue' ? 'bg-red-100 text-red-700' : days <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {days <= 0 ? '!' : days + 'd'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.subject} • Due: {formatDate(a.dueDate)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => { setSelectedAssignment(a); setSubmitDialogOpen(true) }}
                      >
                        <Upload className="h-3 w-3" /> Submit
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── My Schedule Tab ────────────────────────────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" /> Weekly Timetable
              </CardTitle>
              <CardDescription>{studentClass} • {studentName}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Period Header */}
                <div className="grid grid-cols-9 gap-1 mb-1">
                  <div className="text-center text-xs font-medium text-muted-foreground py-2">Period</div>
                  <div className="text-center text-xs font-medium text-muted-foreground py-2">Time</div>
                  {weeklyTimetable.map(d => (
                    <div key={d.day} className="text-center text-xs font-medium text-muted-foreground py-2">{d.day}</div>
                  ))}
                </div>
                {/* Periods */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map(periodIdx => (
                  <div key={periodIdx} className="grid grid-cols-9 gap-1 mb-1">
                    <div className="flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted/30 rounded-lg p-2">
                      P{periodIdx + 1}
                    </div>
                    <div className="flex items-center justify-center text-[10px] text-muted-foreground bg-muted/20 rounded-lg p-2">
                      {weeklyTimetable[0].periods[periodIdx]?.time}
                    </div>
                    {weeklyTimetable.map(day => {
                      const period = day.periods[periodIdx]
                      if (!period) return <div key={day.day} className="bg-muted/10 rounded-lg p-2" />
                      const isCurrentPeriod = periodIdx === 3 // Highlight period 4 as "current"
                      return (
                        <div key={day.day} className={cn(
                          'rounded-lg p-2 transition-all',
                          period.color,
                          isCurrentPeriod && 'ring-2 ring-white shadow-lg'
                        )}>
                          <p className="text-xs font-semibold text-white truncate">{period.subject}</p>
                          <p className="text-[9px] text-white/80 truncate">{period.teacher}</p>
                          <p className="text-[9px] text-white/70">{period.room}</p>
                          {isCurrentPeriod && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span className="text-[8px] text-white font-medium">NOW</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject Legend */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Subject Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[
                  { subject: 'Mathematics', color: 'bg-emerald-500' },
                  { subject: 'English', color: 'bg-teal-500' },
                  { subject: 'Physics', color: 'bg-cyan-500' },
                  { subject: 'Shona', color: 'bg-amber-500' },
                  { subject: 'History', color: 'bg-violet-500' },
                  { subject: 'Chemistry', color: 'bg-rose-500' },
                  { subject: 'Biology', color: 'bg-orange-500' },
                  { subject: 'Geography', color: 'bg-sky-500' },
                  { subject: 'PE / Sports', color: 'bg-lime-500' },
                  { subject: 'Club Activity', color: 'bg-lime-500' },
                ].map(s => (
                  <div key={s.subject} className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-sm', s.color)} />
                    <span className="text-xs font-medium">{s.subject}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Grades & Reports Tab ────────────────────────────────────────────── */}
        <TabsContent value="grades" className="space-y-4">
          {/* Position Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-white/80" />
                  <div>
                    <p className="text-xs text-emerald-100 uppercase tracking-wide">Class Position</p>
                    <p className="text-3xl font-bold">{classPosition}<span className="text-lg text-emerald-200">/{classSize}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-teal-600" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Average</p>
                    <p className="text-3xl font-bold">{currentAverage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Report Card</p>
                  <p className="text-sm font-medium mt-1">Term 1 2026</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setReportCardOpen(true)}>
                  <FileText className="h-4 w-4" /> Preview
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Grades Table */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" /> Current Term Grades
              </CardTitle>
              <CardDescription>Term 1, 2026</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-6 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span>Subject</span>
                  <span className="text-center">Mid-Term</span>
                  <span className="text-center">Test</span>
                  <span className="text-center">Exam</span>
                  <span className="text-center">Grade</span>
                  <span>Teacher</span>
                </div>
                {subjectGrades.map(sg => (
                  <div key={sg.subject} className="grid grid-cols-6 gap-2 px-3 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors items-center">
                    <span className="text-sm font-medium">{sg.subject}</span>
                    <span className={cn('text-sm text-center font-medium', sg.midTerm >= 80 ? 'text-emerald-600' : sg.midTerm >= 60 ? 'text-amber-600' : 'text-red-600')}>{sg.midTerm}%</span>
                    <span className={cn('text-sm text-center font-medium', sg.test >= 80 ? 'text-emerald-600' : sg.test >= 60 ? 'text-amber-600' : 'text-red-600')}>{sg.test}%</span>
                    <span className={cn('text-sm text-center font-medium', sg.exam >= 80 ? 'text-emerald-600' : sg.exam >= 60 ? 'text-amber-600' : 'text-red-600')}>{sg.exam}%</span>
                    <div className="flex justify-center">
                      <span className={cn('px-2 py-0.5 rounded-md text-xs font-bold', gradeColor(sg.letterGrade))}>{sg.letterGrade}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{sg.teacher}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Performance Trend</CardTitle>
              <CardDescription>Your average across recent terms</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-[200px] w-full">
                <AreaChart data={performanceTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="term" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[50, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="average" stroke="var(--color-average)" fill="url(#avgGradient)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Subject Comparison Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Subject Comparison</CardTitle>
              <CardDescription>Mid-Term vs Test vs Exam marks</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={subjectChartConfig} className="h-[250px] w-full">
                <BarChart data={subjectGrades.map(s => ({ subject: s.subject.length > 8 ? s.subject.substring(0, 8) + '...' : s.subject, midTerm: s.midTerm, test: s.test, exam: s.exam }))} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="midTerm" fill="var(--color-midTerm)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="test" fill="var(--color-test)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="exam" fill="var(--color-exam)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Assignments Tab ────────────────────────────────────────────────── */}
        <TabsContent value="assignments" className="space-y-4">
          {/* Assignment Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{mockAssignments.filter(a => a.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{mockAssignments.filter(a => a.status === 'overdue').length}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{mockAssignments.filter(a => a.status === 'submitted').length}</p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{mockAssignments.filter(a => a.status === 'graded').length}</p>
                <p className="text-xs text-muted-foreground">Graded</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending & Overdue */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" /> Pending Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAssignments.map(a => {
                const days = daysUntil(a.dueDate)
                const statusConf = assignmentStatusConfig(a.status)
                return (
                  <div key={a.id} className={cn(
                    'p-4 rounded-lg border transition-colors',
                    a.status === 'overdue' ? 'border-red-200 bg-red-50/50' : 'border-muted bg-muted/30'
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{a.title}</p>
                          <Badge className={cn('text-[10px]', statusConf.color)}>{statusConf.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{a.subject} • {a.teacher}</p>
                        <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">Due: <span className={cn('font-medium', a.status === 'overdue' ? 'text-red-600' : days <= 3 ? 'text-amber-600' : 'text-foreground')}>{formatDate(a.dueDate)}</span></span>
                          <span className="text-xs text-muted-foreground">Max: {a.maxMark} marks</span>
                          {days <= 3 && a.status !== 'overdue' && (
                            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                              <Timer className="h-3 w-3" /> {days}d left
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={cn('gap-1', a.status === 'overdue' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700')}
                        onClick={() => { setSelectedAssignment(a); setSubmitDialogOpen(true) }}
                      >
                        <Upload className="h-3 w-3" /> Submit
                      </Button>
                    </div>
                  </div>
                )
              })}
              {pendingAssignments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">All caught up! No pending assignments.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedAssignments.map(a => {
                const statusConf = assignmentStatusConfig(a.status)
                return (
                  <div key={a.id} className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{a.title}</p>
                          <Badge className={cn('text-[10px]', statusConf.color)}>{statusConf.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{a.subject} • {a.teacher} • Due: {formatDate(a.dueDate)}</p>
                      </div>
                      {a.status === 'graded' && a.mark !== undefined && (
                        <div className="text-right">
                          <p className={cn('text-lg font-bold', a.mark / a.maxMark >= 0.7 ? 'text-emerald-600' : a.mark / a.maxMark >= 0.5 ? 'text-amber-600' : 'text-red-600')}>
                            {a.mark}/{a.maxMark}
                          </p>
                          <p className="text-xs text-muted-foreground">{Math.round(a.mark / a.maxMark * 100)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Library & Resources Tab ─────────────────────────────────────────── */}
        <TabsContent value="library" className="space-y-4">
          {/* Currently Borrowed */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-emerald-600" /> Currently Borrowed Books
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {borrowedBooks.map(book => (
                <div key={book.id} className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                  book.overdue ? 'border-red-200 bg-red-50/50' : 'bg-muted/30 border-transparent'
                )}>
                  <div className={cn('w-10 h-14 rounded-md flex items-center justify-center text-white text-xs font-bold', book.coverColor)}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-xs', book.overdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                        Due: {formatDate(book.dueDate)}
                      </span>
                      {book.overdue && (
                        <Badge className="bg-red-100 text-red-700 text-[10px]">Overdue</Badge>
                      )}
                    </div>
                  </div>
                  {book.overdue && book.fineAmount && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">${book.fineAmount.toFixed(2)}</p>
                      <p className="text-[10px] text-red-500">Fine due</p>
                    </div>
                  )}
                  {!book.overdue && (
                    <Button variant="outline" size="sm" className="text-xs">Renew</Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Overdue Fines Summary */}
          {borrowedBooks.some(b => b.overdue && b.fineAmount) && (
            <Card className="border-0 shadow-md border-l-4 border-l-red-400">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold">Overdue Fines</p>
                      <p className="text-xs text-muted-foreground">Total outstanding fines</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-red-600">
                    ${borrowedBooks.filter(b => b.overdue && b.fineAmount).reduce((s, b) => s + (b.fineAmount || 0), 0).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Digital Resources */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Download className="h-4 w-4 text-teal-600" /> Digital Resources
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">Form 4 Resources</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {digitalResources.map(res => (
                  <div key={res.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background">
                      {resourceTypeIcon(res.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{res.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={cn('text-[9px]', resourceTypeColor(res.type))}>{res.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{res.size}</span>
                        <span className="text-[10px] text-muted-foreground">{res.downloads} downloads</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 shrink-0" onClick={() => toast.success('Download started!')}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reserve a Book */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <Library className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Reserve a Book</p>
                    <p className="text-xs text-muted-foreground">Search and reserve books from the school library</p>
                  </div>
                </div>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setReserveBookOpen(true)}>
                  <Plus className="h-4 w-4" /> Reserve Book
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Assignment Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm font-semibold">{selectedAssignment.title}</p>
                <p className="text-xs text-muted-foreground">{selectedAssignment.subject} • {selectedAssignment.teacher}</p>
                <p className="text-xs text-muted-foreground mt-1">Max marks: {selectedAssignment.maxMark}</p>
              </div>
              <div className="space-y-2">
                <Label>Comments (optional)</Label>
                <Textarea placeholder="Any notes for your teacher..." rows={3} />
              </div>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload your file</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, or images up to 10MB</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleSubmitAssignment}>
              <Send className="h-4 w-4" /> Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reserve Book Dialog */}
      <Dialog open={reserveBookOpen} onOpenChange={setReserveBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve a Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Book Title</Label>
              <Input value={reserveBookTitle} onChange={e => setReserveBookTitle(e.target.value)} placeholder="Enter book title or ISBN..." />
            </div>
            <div className="space-y-2">
              <Label>Subject Area</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="geography">Geography</SelectItem>
                  <SelectItem value="shona">Shona</SelectItem>
                  <SelectItem value="fiction">Fiction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <Library className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-medium">Book reservation</p>
              <p className="text-xs text-muted-foreground">You will be notified when the book is available</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleReserveBook}>
              <BookmarkCheck className="h-4 w-4" /> Reserve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Card Preview Dialog */}
      <Dialog open={reportCardOpen} onOpenChange={setReportCardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" /> Report Card Preview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* School Header */}
            <div className="text-center border-b pb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold">Mhondoro Secondary School</h3>
              </div>
              <p className="text-xs text-muted-foreground">Excellence in Education • Est. 1985</p>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{studentName}</span></div>
              <div><span className="text-muted-foreground">Class:</span> <span className="font-medium">{studentClass}</span></div>
              <div><span className="text-muted-foreground">Number:</span> <span className="font-medium">{studentNumber}</span></div>
              <div><span className="text-muted-foreground">Position:</span> <span className="font-medium">{classPosition}/{classSize}</span></div>
            </div>

            <Separator />

            {/* Grades */}
            <div className="space-y-1">
              {subjectGrades.map(sg => (
                <div key={sg.subject} className="flex items-center justify-between text-sm py-1">
                  <span className="flex-1">{sg.subject}</span>
                  <span className="w-14 text-center">{sg.midTerm}</span>
                  <span className="w-14 text-center">{sg.test}</span>
                  <span className="w-14 text-center">{sg.exam}</span>
                  <span className={cn('w-10 text-center font-bold', gradeTextColor(sg.letterGrade))}>{sg.letterGrade}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between text-sm font-semibold pt-1">
                <span className="flex-1">Average</span>
                <span className="w-14 text-center">{Math.round(subjectGrades.reduce((s, g) => s + g.midTerm, 0) / subjectGrades.length)}</span>
                <span className="w-14 text-center">{Math.round(subjectGrades.reduce((s, g) => s + g.test, 0) / subjectGrades.length)}</span>
                <span className="w-14 text-center">{currentAverage}</span>
                <span className="w-10 text-center">{currentAverage >= 80 ? 'A' : currentAverage >= 70 ? 'B' : currentAverage >= 60 ? 'C' : 'D'}</span>
              </div>
            </div>

            <Separator />

            {/* Comments */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Class Teacher:</span>
                <p className="italic mt-0.5">&quot;Tendai is making steady progress. Needs to focus more on Physics and Chemistry. Excellent work in History and English.&quot;</p>
              </div>
              <div>
                <span className="text-muted-foreground">Headmaster:</span>
                <p className="italic mt-0.5">&quot;Keep up the good work. Parent-teacher conference on March 20th.&quot;</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => toast.success('Report card printed!')}>
              <FileText className="h-4 w-4" /> Print Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
