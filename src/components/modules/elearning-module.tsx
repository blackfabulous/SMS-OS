'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Monitor,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Search,
  Play,
  FileText,
  Video,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  GraduationCap,
  Star,
  Upload,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string
  subject: string
  teacher: string
  enrollmentCount: number
  maxEnrollment: number
  progress: number
  category: string
  status: 'Active' | 'Upcoming' | 'Completed'
  description: string
}

interface Resource {
  id: string
  title: string
  subject: string
  type: 'Notes' | 'Video' | 'Past Exam Paper' | 'Worksheet'
  uploadDate: string
  uploadedBy: string
  fileSize: string
  downloads: number
  description: string
}

interface Assignment {
  id: string
  title: string
  course: string
  dueDate: string
  totalStudents: number
  submitted: number
  graded: number
  avgScore: number | null
  status: 'Open' | 'Closed' | 'Grading'
  maxMarks: number
}

interface StudentProgress {
  id: string
  studentName: string
  form: string
  courses: { subject: string; progress: number; grade: string }[]
  overallProgress: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockCourses: Course[] = [
  { id: '1', subject: 'Mathematics', teacher: 'Mr. Hove', enrollmentCount: 42, maxEnrollment: 50, progress: 68, category: 'Sciences', status: 'Active', description: 'O-Level Mathematics covering algebra, geometry, and statistics' },
  { id: '2', subject: 'English Language', teacher: 'Mrs. Mlambo', enrollmentCount: 48, maxEnrollment: 50, progress: 72, category: 'Languages', status: 'Active', description: 'O-Level English Language with focus on comprehension and composition' },
  { id: '3', subject: 'Shona', teacher: 'Mr. Gumbo', enrollmentCount: 38, maxEnrollment: 45, progress: 55, category: 'Languages', status: 'Active', description: 'O-Level Shona language and literature' },
  { id: '4', subject: 'Physics', teacher: 'Mrs. Ncube', enrollmentCount: 28, maxEnrollment: 35, progress: 45, category: 'Sciences', status: 'Active', description: 'O-Level Physics covering mechanics, electricity, and optics' },
  { id: '5', subject: 'Chemistry', teacher: 'Mr. Zvambe', enrollmentCount: 30, maxEnrollment: 35, progress: 50, category: 'Sciences', status: 'Active', description: 'O-Level Chemistry with practical lab sessions' },
  { id: '6', subject: 'Biology', teacher: 'Mrs. Dube', enrollmentCount: 35, maxEnrollment: 40, progress: 62, category: 'Sciences', status: 'Active', description: 'O-Level Biology covering human biology, plants, and ecology' },
  { id: '7', subject: 'History', teacher: 'Mr. Moyo', enrollmentCount: 40, maxEnrollment: 45, progress: 78, category: 'Humanities', status: 'Active', description: 'Zimbabwe and African history with world history components' },
  { id: '8', subject: 'Geography', teacher: 'Ms. Chikumba', enrollmentCount: 32, maxEnrollment: 40, progress: 58, category: 'Humanities', status: 'Active', description: 'Physical and human geography with Zimbabwe case studies' },
  { id: '9', subject: 'Accounts', teacher: 'Mr. Tafara', enrollmentCount: 22, maxEnrollment: 30, progress: 40, category: 'Commercial', status: 'Active', description: 'O-Level Accounting principles and bookkeeping' },
  { id: '10', subject: 'Computer Science', teacher: 'Mr. Kufa', enrollmentCount: 25, maxEnrollment: 30, progress: 35, category: 'Sciences', status: 'Active', description: 'Introduction to programming, databases, and computer systems' },
  { id: '11', subject: 'A-Level Mathematics', teacher: 'Mr. Hove', enrollmentCount: 15, maxEnrollment: 20, progress: 82, category: 'A-Level', status: 'Active', description: 'A-Level Pure Mathematics and Statistics' },
  { id: '12', subject: 'A-Level Physics', teacher: 'Mrs. Ncube', enrollmentCount: 12, maxEnrollment: 20, progress: 70, category: 'A-Level', status: 'Active', description: 'A-Level Advanced Physics' },
]

const mockResources: Resource[] = [
  { id: '1', title: 'Algebra & Functions - Notes Pack', subject: 'Mathematics', type: 'Notes', uploadDate: '2026-02-28', uploadedBy: 'Mr. Hove', fileSize: '2.4 MB', downloads: 89, description: 'Complete notes on algebraic expressions, equations, and functions for O-Level' },
  { id: '2', title: 'Quadratic Equations Video Tutorial', subject: 'Mathematics', type: 'Video', uploadDate: '2026-02-25', uploadedBy: 'Mr. Hove', fileSize: '45 MB', downloads: 67, description: 'Step-by-step video solving quadratic equations' },
  { id: '3', title: 'ZIMSEC 2024 Maths Paper 1', subject: 'Mathematics', type: 'Past Exam Paper', uploadDate: '2026-01-15', uploadedBy: 'Admin', fileSize: '1.8 MB', downloads: 156, description: 'November 2024 ZIMSEC O-Level Mathematics Paper 1' },
  { id: '4', title: 'Geometry Worksheet - Triangles', subject: 'Mathematics', type: 'Worksheet', uploadDate: '2026-02-20', uploadedBy: 'Mr. Hove', fileSize: '0.5 MB', downloads: 42, description: 'Practice problems on triangle properties and theorems' },
  { id: '5', title: 'English Comprehension Skills', subject: 'English Language', type: 'Notes', uploadDate: '2026-02-27', uploadedBy: 'Mrs. Mlambo', fileSize: '3.1 MB', downloads: 78, description: 'Techniques for answering comprehension questions at O-Level' },
  { id: '6', title: 'Descriptive Essay Writing Video', subject: 'English Language', type: 'Video', uploadDate: '2026-02-22', uploadedBy: 'Mrs. Mlambo', fileSize: '52 MB', downloads: 45, description: 'How to write high-scoring descriptive essays' },
  { id: '7', title: 'ZIMSEC 2024 English Paper 2', subject: 'English Language', type: 'Past Exam Paper', uploadDate: '2026-01-15', uploadedBy: 'Admin', fileSize: '2.0 MB', downloads: 134, description: 'November 2024 ZIMSEC O-Level English Language Paper 2' },
  { id: '8', title: 'Newton\'s Laws Video Series', subject: 'Physics', type: 'Video', uploadDate: '2026-02-18', uploadedBy: 'Mrs. Ncube', fileSize: '120 MB', downloads: 33, description: 'Complete video series on Newton\'s three laws of motion' },
  { id: '9', title: 'Electricity & Magnetism Notes', subject: 'Physics', type: 'Notes', uploadDate: '2026-02-26', uploadedBy: 'Mrs. Ncube', fileSize: '4.2 MB', downloads: 28, description: 'Comprehensive notes on circuits, resistance, and electromagnetic induction' },
  { id: '10', title: 'ZIMSEC 2024 Physics Paper', subject: 'Physics', type: 'Past Exam Paper', uploadDate: '2026-01-12', uploadedBy: 'Admin', fileSize: '1.5 MB', downloads: 87, description: 'November 2024 ZIMSEC O-Level Physics Paper' },
  { id: '11', title: 'Organic Chemistry Worksheet', subject: 'Chemistry', type: 'Worksheet', uploadDate: '2026-02-24', uploadedBy: 'Mr. Zvambe', fileSize: '0.8 MB', downloads: 25, description: 'Naming organic compounds and reaction mechanisms' },
  { id: '12', title: 'Zimbabwe Independence History', subject: 'History', type: 'Notes', uploadDate: '2026-02-15', uploadedBy: 'Mr. Moyo', fileSize: '5.1 MB', downloads: 52, description: 'Detailed notes on Zimbabwe\'s path to independence 1890-1980' },
  { id: '13', title: 'Map Reading & Interpretation', subject: 'Geography', type: 'Video', uploadDate: '2026-02-20', uploadedBy: 'Ms. Chikumba', fileSize: '38 MB', downloads: 30, description: 'How to read and interpret topographical maps for O-Level' },
  { id: '14', title: 'Shona Novel Study Guide - Rudo Ibofu', subject: 'Shona', type: 'Notes', uploadDate: '2026-02-10', uploadedBy: 'Mr. Gumbo', fileSize: '2.8 MB', downloads: 38, description: 'Character analysis and themes for the set Shona novel' },
  { id: '15', title: 'Double Entry Bookkeeping', subject: 'Accounts', type: 'Notes', uploadDate: '2026-02-22', uploadedBy: 'Mr. Tafara', fileSize: '1.9 MB', downloads: 20, description: 'Introduction to double entry bookkeeping principles' },
]

const mockAssignments: Assignment[] = [
  { id: '1', title: 'Quadratic Equations Test', course: 'Mathematics', dueDate: '2026-03-07', totalStudents: 42, submitted: 28, graded: 15, avgScore: 62, status: 'Open', maxMarks: 100 },
  { id: '2', title: 'Comprehension Exercise 3', course: 'English Language', dueDate: '2026-03-05', totalStudents: 48, submitted: 45, graded: 40, avgScore: 71, status: 'Grading', maxMarks: 50 },
  { id: '3', title: 'Forces & Motion Practical Report', course: 'Physics', dueDate: '2026-03-03', totalStudents: 28, submitted: 22, graded: 22, avgScore: 58, status: 'Closed', maxMarks: 30 },
  { id: '4', title: 'Shona Essay - Ngano', course: 'Shona', dueDate: '2026-03-10', totalStudents: 38, submitted: 10, graded: 0, avgScore: null, status: 'Open', maxMarks: 40 },
  { id: '5', title: 'Chemical Reactions Worksheet', course: 'Chemistry', dueDate: '2026-03-06', totalStudents: 30, submitted: 30, graded: 25, avgScore: 65, status: 'Grading', maxMarks: 25 },
  { id: '6', title: 'Cell Biology Diagram Test', course: 'Biology', dueDate: '2026-03-08', totalStudents: 35, submitted: 20, graded: 8, avgScore: 55, status: 'Open', maxMarks: 40 },
  { id: '7', title: 'Zimbabwe History Essay', course: 'History', dueDate: '2026-03-04', totalStudents: 40, submitted: 38, graded: 38, avgScore: 68, status: 'Closed', maxMarks: 50 },
  { id: '8', title: 'Map Skills Assessment', course: 'Geography', dueDate: '2026-03-12', totalStudents: 32, submitted: 5, graded: 0, avgScore: null, status: 'Open', maxMarks: 30 },
  { id: '9', title: 'Trial Balance Exercise', course: 'Accounts', dueDate: '2026-03-09', totalStudents: 22, submitted: 18, graded: 12, avgScore: 60, status: 'Open', maxMarks: 50 },
  { id: '10', title: 'Programming Fundamentals Quiz', course: 'Computer Science', dueDate: '2026-03-11', totalStudents: 25, submitted: 8, graded: 0, avgScore: null, status: 'Open', maxMarks: 20 },
]

const mockStudentProgress: StudentProgress[] = [
  { id: '1', studentName: 'Tendai Moyo', form: 'Form 4A', courses: [{ subject: 'Mathematics', progress: 85, grade: 'A' }, { subject: 'Physics', progress: 72, grade: 'B' }, { subject: 'Chemistry', progress: 68, grade: 'B' }, { subject: 'English', progress: 78, grade: 'B' }], overallProgress: 76 },
  { id: '2', studentName: 'Chido Ndlovu', form: 'Form 4B', courses: [{ subject: 'Mathematics', progress: 92, grade: 'A*' }, { subject: 'Biology', progress: 88, grade: 'A' }, { subject: 'Chemistry', progress: 80, grade: 'A' }, { subject: 'English', progress: 75, grade: 'B' }], overallProgress: 84 },
  { id: '3', studentName: 'Rumbidzai Dube', form: 'Form 3A', courses: [{ subject: 'Mathematics', progress: 65, grade: 'C' }, { subject: 'English', progress: 82, grade: 'A' }, { subject: 'History', progress: 78, grade: 'B' }, { subject: 'Shona', progress: 90, grade: 'A*' }], overallProgress: 79 },
  { id: '4', studentName: 'Kudzai Chiweshe', form: 'Form 4A', courses: [{ subject: 'Mathematics', progress: 45, grade: 'D' }, { subject: 'Physics', progress: 38, grade: 'E' }, { subject: 'English', progress: 62, grade: 'C' }, { subject: 'Geography', progress: 70, grade: 'B' }], overallProgress: 54 },
  { id: '5', studentName: 'Tafara Gumbo', form: 'Form 5', courses: [{ subject: 'A-Level Maths', progress: 78, grade: 'B' }, { subject: 'A-Level Physics', progress: 72, grade: 'B' }], overallProgress: 75 },
  { id: '6', studentName: 'Nyasha Chikumbu', form: 'Form 3B', courses: [{ subject: 'Mathematics', progress: 88, grade: 'A' }, { subject: 'Biology', progress: 82, grade: 'A' }, { subject: 'English', progress: 70, grade: 'B' }, { subject: 'Accounts', progress: 95, grade: 'A*' }], overallProgress: 84 },
  { id: '7', studentName: 'Panashe Zvambe', form: 'Form 4A', courses: [{ subject: 'Mathematics', progress: 55, grade: 'C' }, { subject: 'Chemistry', progress: 50, grade: 'C' }, { subject: 'Biology', progress: 62, grade: 'C' }, { subject: 'English', progress: 58, grade: 'C' }], overallProgress: 56 },
  { id: '8', studentName: 'Tariro Machingaidze', form: 'Form 6', courses: [{ subject: 'A-Level Maths', progress: 90, grade: 'A*' }, { subject: 'A-Level Physics', progress: 85, grade: 'A' }], overallProgress: 88 },
]

const recentActivity = [
  { id: '1', action: 'New assignment posted', detail: 'Quadratic Equations Test - Mathematics', time: '2 hours ago', type: 'assignment' },
  { id: '2', action: 'Resource uploaded', detail: 'Algebra & Functions Notes Pack by Mr. Hove', time: '3 hours ago', type: 'resource' },
  { id: '3', action: 'Assignment submitted', detail: '28 students submitted Quadratic Equations Test', time: '5 hours ago', type: 'submission' },
  { id: '4', action: 'Grades published', detail: 'Physics Practical Report - average 58%', time: 'Yesterday', type: 'grade' },
  { id: '5', action: 'Course updated', detail: 'Computer Science syllabus updated for Term 1', time: 'Yesterday', type: 'course' },
  { id: '6', action: 'New enrollment', detail: '5 new students joined Computer Science', time: '2 days ago', type: 'enrollment' },
]

const completionChartConfig = {
  progress: { label: 'Completion %', color: '#10b981' },
} satisfies ChartConfig

const completionChartData = mockCourses.slice(0, 8).map(c => ({
  subject: c.subject.length > 10 ? c.subject.substring(0, 10) + '...' : c.subject,
  progress: c.progress,
}))

// ─── Component ────────────────────────────────────────────────────────────────
export default function ElearningModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [resources, setResources] = useState<Resource[]>(mockResources)
  const [assignments] = useState<Assignment[]>(mockAssignments)
  const [studentProgress] = useState<StudentProgress[]>(mockStudentProgress)
  const [searchCourse, setSearchCourse] = useState('')
  const [searchResource, setSearchResource] = useState('')
  const [searchAssignment, setSearchAssignment] = useState('')
  const [addCourseOpen, setAddCourseOpen] = useState(false)
  const [addResourceOpen, setAddResourceOpen] = useState(false)
  const [resourceTypeFilter, setResourceTypeFilter] = useState('All')
  const [subjectFilter, setSubjectFilter] = useState('All')

  // Form state for new course
  const [newCourseSubject, setNewCourseSubject] = useState('')
  const [newCourseTeacher, setNewCourseTeacher] = useState('')
  const [newCourseCategory, setNewCourseCategory] = useState('Sciences')
  const [newCourseMaxEnroll, setNewCourseMaxEnroll] = useState('')
  const [newCourseDesc, setNewCourseDesc] = useState('')

  // Form state for new resource
  const [newResTitle, setNewResTitle] = useState('')
  const [newResSubject, setNewResSubject] = useState('Mathematics')
  const [newResType, setNewResType] = useState<Resource['type']>('Notes')
  const [newResDesc, setNewResDesc] = useState('')

  // Computed values
  const activeCourses = courses.filter(c => c.status === 'Active').length
  const totalEnrolled = courses.reduce((sum, c) => sum + c.enrollmentCount, 0)
  const avgCompletion = Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
  const totalResources = resources.length

  const popularCourses = [...courses].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 5)

  const filteredCourses = courses.filter(c =>
    c.subject.toLowerCase().includes(searchCourse.toLowerCase()) ||
    c.teacher.toLowerCase().includes(searchCourse.toLowerCase()) ||
    c.category.toLowerCase().includes(searchCourse.toLowerCase())
  )

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchResource.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchResource.toLowerCase())
    const matchesType = resourceTypeFilter === 'All' || r.type === resourceTypeFilter
    const matchesSubject = subjectFilter === 'All' || r.subject === subjectFilter
    return matchesSearch && matchesType && matchesSubject
  })

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(searchAssignment.toLowerCase()) ||
    a.course.toLowerCase().includes(searchAssignment.toLowerCase())
  )

  const uniqueSubjects = ['All', ...Array.from(new Set(resources.map(r => r.subject)))]
  const resourceTypes = ['All', 'Notes', 'Video', 'Past Exam Paper', 'Worksheet']

  const handleAddCourse = () => {
    if (!newCourseSubject || !newCourseTeacher || !newCourseMaxEnroll) return
    const newCourse: Course = {
      id: String(courses.length + 1),
      subject: newCourseSubject,
      teacher: newCourseTeacher,
      enrollmentCount: 0,
      maxEnrollment: parseInt(newCourseMaxEnroll),
      progress: 0,
      category: newCourseCategory,
      status: 'Upcoming',
      description: newCourseDesc,
    }
    setCourses(prev => [...prev, newCourse])
    setNewCourseSubject('')
    setNewCourseTeacher('')
    setNewCourseMaxEnroll('')
    setNewCourseDesc('')
    setAddCourseOpen(false)
  }

  const handleAddResource = () => {
    if (!newResTitle || !newResSubject || !newResDesc) return
    const newResource: Resource = {
      id: String(resources.length + 1),
      title: newResTitle,
      subject: newResSubject,
      type: newResType,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'Admin',
      fileSize: '1.0 MB',
      downloads: 0,
      description: newResDesc,
    }
    setResources(prev => [newResource, ...prev])
    setNewResTitle('')
    setNewResDesc('')
    setAddResourceOpen(false)
  }

  const resourceTypeIcon = (type: string) => {
    switch (type) {
      case 'Notes': return <FileText className="h-4 w-4 text-emerald-600" />
      case 'Video': return <Video className="h-4 w-4 text-red-500" />
      case 'Past Exam Paper': return <FileText className="h-4 w-4 text-amber-600" />
      case 'Worksheet': return <FileText className="h-4 w-4 text-teal-600" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const resourceTypeColor = (type: string) => {
    switch (type) {
      case 'Notes': return 'bg-emerald-100 text-emerald-700'
      case 'Video': return 'bg-red-100 text-red-700'
      case 'Past Exam Paper': return 'bg-amber-100 text-amber-700'
      case 'Worksheet': return 'bg-teal-100 text-teal-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const assignmentStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-emerald-100 text-emerald-700'
      case 'Grading': return 'bg-amber-100 text-amber-700'
      case 'Closed': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-600'
    if (grade.startsWith('B')) return 'text-teal-600'
    if (grade.startsWith('C')) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Monitor className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">E-Learning & LMS</h2>
            <p className="text-sm text-muted-foreground">Manage online courses, resources, and student progress</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Courses</p>
                    <p className="text-2xl font-bold">{activeCourses}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+2 this term</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Enrolled Students</p>
                    <p className="text-2xl font-bold">{totalEnrolled}</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Across all courses</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <GraduationCap className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg. Completion</p>
                    <p className="text-2xl font-bold">{avgCompletion}%</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+8% vs last month</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Digital Resources</p>
                    <p className="text-2xl font-bold">{totalResources}</p>
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3 text-cyan-600" />
                      <span className="text-xs font-medium text-cyan-600">{resources.reduce((s, r) => s + r.downloads, 0)} downloads</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                    <FileText className="h-5 w-5 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Courses + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Popular Courses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {popularCourses.map((course, idx) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white',
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-muted text-muted-foreground'
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{course.subject}</p>
                        <p className="text-xs text-muted-foreground">{course.teacher} · {course.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{course.enrollmentCount}/{course.maxEnrollment}</p>
                      <div className="w-16 bg-muted rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-72 overflow-y-auto">
                {recentActivity.map(act => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
                      act.type === 'assignment' ? 'bg-emerald-100' :
                      act.type === 'resource' ? 'bg-cyan-100' :
                      act.type === 'submission' ? 'bg-teal-100' :
                      act.type === 'grade' ? 'bg-amber-100' :
                      'bg-gray-100'
                    )}>
                      {act.type === 'assignment' ? <BookOpen className="h-3.5 w-3.5 text-emerald-600" /> :
                       act.type === 'resource' ? <FileText className="h-3.5 w-3.5 text-cyan-600" /> :
                       act.type === 'submission' ? <Users className="h-3.5 w-3.5 text-teal-600" /> :
                       act.type === 'grade' ? <BarChart3 className="h-3.5 w-3.5 text-amber-600" /> :
                       <GraduationCap className="h-3.5 w-3.5 text-gray-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{act.action}</p>
                      <p className="text-xs text-muted-foreground">{act.detail}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Course Completion Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Course Completion Progress</CardTitle>
              <CardDescription>Percentage of syllabus covered by course</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={completionChartConfig} className="h-[280px] w-full">
                <BarChart data={completionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="progress" fill="var(--color-progress)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Courses Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-9 h-9"
                value={searchCourse}
                onChange={e => setSearchCourse(e.target.value)}
              />
            </div>
            <Dialog open={addCourseOpen} onOpenChange={setAddCourseOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> Add Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Subject Name</Label>
                    <Input value={newCourseSubject} onChange={e => setNewCourseSubject(e.target.value)} placeholder="e.g. Mathematics" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teacher</Label>
                      <Input value={newCourseTeacher} onChange={e => setNewCourseTeacher(e.target.value)} placeholder="Teacher name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newCourseCategory} onValueChange={setNewCourseCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sciences">Sciences</SelectItem>
                          <SelectItem value="Languages">Languages</SelectItem>
                          <SelectItem value="Humanities">Humanities</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                          <SelectItem value="A-Level">A-Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Enrollment</Label>
                    <Input type="number" value={newCourseMaxEnroll} onChange={e => setNewCourseMaxEnroll(e.target.value)} placeholder="e.g. 40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} placeholder="Course description..." rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddCourse}>Create Course</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <Card key={course.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{course.subject}</p>
                      <p className="text-xs text-muted-foreground">{course.teacher}</p>
                    </div>
                    <Badge variant={course.status === 'Active' ? 'default' : course.status === 'Upcoming' ? 'secondary' : 'outline'} className="text-[10px]">
                      {course.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Enrollment</span>
                      <span className="font-medium">{course.enrollmentCount}/{course.maxEnrollment}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${(course.enrollmentCount / course.maxEnrollment) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Syllabus Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={cn(
                        'h-2 rounded-full transition-all',
                        course.progress > 70 ? 'bg-emerald-500' : course.progress > 40 ? 'bg-amber-500' : 'bg-red-400'
                      )} style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t">
                    <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      View <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── Resources Tab ────────────────────────────────────────────────── */}
        <TabsContent value="resources" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  className="pl-9 h-9"
                  value={searchResource}
                  onChange={e => setSearchResource(e.target.value)}
                />
              </div>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={addResourceOpen} onOpenChange={setAddResourceOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="h-4 w-4" /> Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Learning Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Resource Title</Label>
                    <Input value={newResTitle} onChange={e => setNewResTitle(e.target.value)} placeholder="e.g. Algebra Notes - Form 4" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={newResSubject} onValueChange={setNewResSubject}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="English Language">English Language</SelectItem>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Biology">Biology</SelectItem>
                          <SelectItem value="History">History</SelectItem>
                          <SelectItem value="Geography">Geography</SelectItem>
                          <SelectItem value="Shona">Shona</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Resource Type</Label>
                      <Select value={newResType} onValueChange={v => setNewResType(v as Resource['type'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Notes">Notes</SelectItem>
                          <SelectItem value="Video">Video</SelectItem>
                          <SelectItem value="Past Exam Paper">Past Exam Paper</SelectItem>
                          <SelectItem value="Worksheet">Worksheet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newResDesc} onChange={e => setNewResDesc(e.target.value)} placeholder="Brief description of the resource..." rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddResource}>Upload</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Resources by Subject Groups */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Downloads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map(res => (
                    <TableRow key={res.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {resourceTypeIcon(res.type)}
                          <div>
                            <p className="text-sm font-medium">{res.title}</p>
                            <p className="text-xs text-muted-foreground">{res.fileSize}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{res.subject}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', resourceTypeColor(res.type))}>
                          {res.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{res.uploadedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{res.uploadDate}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3 text-muted-foreground" />
                          {res.downloads}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Assignments Tab ──────────────────────────────────────────────── */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                className="pl-9 h-9"
                value={searchAssignment}
                onChange={e => setSearchAssignment(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {assignments.filter(a => a.status === 'Open').length} Open
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {assignments.filter(a => a.status === 'Closed').length} Closed
              </Badge>
            </div>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Graded</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">Max marks: {a.maxMarks}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{a.course}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {a.dueDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div className={cn(
                              'h-1.5 rounded-full',
                              a.submitted / a.totalStudents > 0.8 ? 'bg-emerald-500' :
                              a.submitted / a.totalStudents > 0.5 ? 'bg-amber-500' : 'bg-red-400'
                            )} style={{ width: `${(a.submitted / a.totalStudents) * 100}%` }} />
                          </div>
                          <span className="text-xs">{a.submitted}/{a.totalStudents}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{a.graded}/{a.submitted}</TableCell>
                      <TableCell>
                        {a.avgScore !== null ? (
                          <span className={cn(
                            'text-sm font-semibold',
                            a.avgScore / a.maxMarks > 0.7 ? 'text-emerald-600' :
                            a.avgScore / a.maxMarks > 0.5 ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {a.avgScore}/{a.maxMarks}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', assignmentStatusColor(a.status))}>
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Progress Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="progress" className="space-y-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Overall Student Progress</p>
                  <p className="text-xs text-muted-foreground">Average across all courses and students</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">
                      {Math.round(studentProgress.reduce((s, p) => s + p.overallProgress, 0) / studentProgress.length)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {studentProgress.map(student => (
              <Card key={student.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                        <GraduationCap className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{student.studentName}</p>
                        <p className="text-xs text-muted-foreground">{student.form}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-lg font-bold', student.overallProgress >= 75 ? 'text-emerald-600' : student.overallProgress >= 55 ? 'text-amber-600' : 'text-red-600')}>
                        {student.overallProgress}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Overall</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {student.courses.map((course, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs w-28 shrink-0 text-muted-foreground">{course.subject}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className={cn(
                            'h-2 rounded-full transition-all',
                            course.progress >= 75 ? 'bg-emerald-500' : course.progress >= 55 ? 'bg-amber-500' : 'bg-red-400'
                          )} style={{ width: `${course.progress}%` }} />
                        </div>
                        <span className="text-xs font-medium w-10 text-right">{course.progress}%</span>
                        <span className={cn('text-xs font-bold w-8', gradeColor(course.grade))}>{course.grade}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
