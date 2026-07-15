'use client'

import {
  ModuleContainer,
  StatGrid,
  ModuleStatCard,
  SectionCard,
  TableShell,
  ModulePageLayout,
  ModuleSettingsButton,
  KitEmptyState,
  ModuleToolbar,
} from '@/components/module-ui'
import React, { useState, useEffect, useMemo } from 'react'
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
  ArrowLeft,
  Settings,
  Save,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'

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

interface CourseResponse {
  data: any[]
  total: number
  page: number
  totalPages: number
  stats: any
}

interface ResourcesResponse {
  data: any[]
  total: number
  page: number
  totalPages: number
}

interface AssignmentsResponse {
  data: any[]
  total: number
  page: number
  totalPages: number
}

// ─── Mappings ─────────────────────────────────────────────────────────────────

const mapDbCourse = (c: any): Course => {
  return {
    id: c.id,
    subject: c.name,
    teacher: c.instructor || 'Unknown',
    enrollmentCount: c.enrollmentCount || 0,
    maxEnrollment: 50,
    progress: c.syllabusCompletion || 0,
    category: 'Sciences',
    status: c.isActive ? 'Active' : 'Completed',
    description: c.description || '',
  }
}

const mapDbResource = (r: any): Resource => {
  const mapType = (t: string): Resource['type'] => {
    switch (t?.toUpperCase()) {
      case 'NOTES': return 'Notes'
      case 'VIDEO': return 'Video'
      case 'PAST_EXAM_PAPER': return 'Past Exam Paper'
      case 'WORKSHEET': return 'Worksheet'
      default: return 'Notes'
    }
  }
  return {
    id: r.id,
    title: r.title,
    subject: r.course?.name || 'General',
    type: mapType(r.resourceType),
    uploadDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
    uploadedBy: r.uploadedBy || 'Admin',
    fileSize: typeof r.fileSize === 'number' ? (r.fileSize >= 1024 * 1024 ? `${(r.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${(r.fileSize / 1024).toFixed(0)} KB`) : String(r.fileSize || '1.0 MB'),
    downloads: r.downloads || 0,
    description: r.description || '',
  }
}

const mapDbAssignment = (a: any): Assignment => {
  const mapStatus = (s: string): Assignment['status'] => {
    switch (s?.toUpperCase()) {
      case 'OPEN': return 'Open'
      case 'CLOSED': return 'Closed'
      case 'GRADING': return 'Grading'
      default: return 'Open'
    }
  }
  return {
    id: a.id,
    title: a.title,
    course: a.course?.name || 'General',
    dueDate: a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : '',
    totalStudents: 50,
    submitted: a.submissionsCount || 0,
    graded: a.submissionsCount || 0,
    avgScore: a.avgScore || null,
    status: mapStatus(a.status),
    maxMarks: a.maxMarks || 100,
  }
}

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

// ─── Component ────────────────────────────────────────────────────────────────
export default function ElearningModule() {
  const queryClient = useQueryClient()
  const { schoolName } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')

  const [searchCourse, setSearchCourse] = useState('')
  const [searchResource, setSearchResource] = useState('')
  const [searchAssignment, setSearchAssignment] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('All')
  const [subjectFilter, setSubjectFilter] = useState('All')

  // ViewMode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Form state for new course
  const [newCourseSubject, setNewCourseSubject] = useState('')
  const [newCourseTeacher, setNewCourseTeacher] = useState('')
  const [newCourseCategory, setNewCourseCategory] = useState('Sciences')
  const [newCourseMaxEnroll, setNewCourseMaxEnroll] = useState('')
  const [newCourseDesc, setNewCourseDesc] = useState('')

  // Form state for new resource
  const [newResTitle, setNewResTitle] = useState('')
  const [newResCourseId, setNewResCourseId] = useState('')
  const [newResType, setNewResType] = useState<Resource['type']>('Notes')
  const [newResDesc, setNewResDesc] = useState('')

  // Form state for new assignment
  const [newAsgTitle, setNewAsgTitle] = useState('')
  const [newAsgCourseId, setNewAsgCourseId] = useState('')
  const [newAsgMaxMarks, setNewAsgMaxMarks] = useState('100')
  const [newAsgDueDate, setNewAsgDueDate] = useState('')
  const [newAsgDesc, setNewAsgDesc] = useState('')

  // Settings state
  const [defaultVideoQuality, setDefaultVideoQuality] = useState('720p')
  const [autoSaveAssignments, setAutoSaveAssignments] = useState(true)
  const [enablePlagiarismCheck, setEnablePlagiarismCheck] = useState(true)
  const [notifyNewSubmission, setNotifyNewSubmission] = useState(true)
  const [maxFileSize, setMaxFileSize] = useState('50')
  const [enableStudentMessaging, setEnableStudentMessaging] = useState(true)
  const [defaultAssignmentDueDays, setDefaultAssignmentDueDays] = useState('7')
  const [platformName, setPlatformName] = useState(`${schoolName} LMS`)

  // ─── Data & Mutations ──────────────────────────────────────────────────────
  const {
    data: coursesData,
    isPending: coursesLoading,
  } = useApiQuery<CourseResponse>(['elearning', 'courses'], '/api/elearning')

  const courses = useMemo(() => (coursesData?.data || []).map(mapDbCourse), [coursesData])
  const stats = coursesData?.stats ?? null

  const {
    data: resourcesData,
    isPending: resourcesLoading,
  } = useApiQuery<ResourcesResponse>(['elearning', 'resources'], '/api/elearning?type=resources')

  const resources = useMemo(() => (resourcesData?.data || []).map(mapDbResource), [resourcesData])

  const {
    data: assignmentsData,
    isPending: assignmentsLoading,
  } = useApiQuery<AssignmentsResponse>(['elearning', 'assignments'], '/api/elearning?type=assignments')

  const assignments = useMemo(() => (assignmentsData?.data || []).map(mapDbAssignment), [assignmentsData])

  const defaultCourseId = useMemo(() => coursesData?.data?.[0]?.id ?? '', [coursesData])

  const selectedResCourseId = newResCourseId || defaultCourseId
  const selectedAsgCourseId = newAsgCourseId || defaultCourseId

  const { mutate: addCourse, isPending: isAddingCourse } = useApiMutation<
    { action: 'addCourse'; name: string; instructor: string; description: string; enrollmentCount: number; syllabusCompletion: number },
    any
  >('/api/elearning', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elearning'] })
      toast.success(`Course "${newCourseSubject}" created successfully`)
      setNewCourseSubject('')
      setNewCourseTeacher('')
      setNewCourseMaxEnroll('')
      setNewCourseDesc('')
      setViewMode('list')
    },
    onError: (err) => toast.error(err.message || 'Failed to create course'),
  })

  const { mutate: addResource, isPending: isAddingResource } = useApiMutation<
    { action: 'addResource'; courseId: string; title: string; resourceType: string; url: string; fileSize: number; uploadedBy: string },
    any
  >('/api/elearning', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elearning'] })
      toast.success(`Resource "${newResTitle}" uploaded successfully`)
      setNewResTitle('')
      setNewResDesc('')
      setViewMode('list')
    },
    onError: (err) => toast.error(err.message || 'Failed to upload resource'),
  })

  const { mutate: addAssignment, isPending: isAddingAssignment } = useApiMutation<
    { action: 'addAssignment'; courseId: string; title: string; description: string; maxMarks: number; dueDate: string },
    any
  >('/api/elearning', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elearning'] })
      toast.success(`Assignment "${newAsgTitle}" created successfully`)
      setNewAsgTitle('')
      setNewAsgDesc('')
      setNewAsgMaxMarks('100')
      setNewAsgDueDate('')
      setViewMode('list')
    },
    onError: (err) => toast.error(err.message || 'Failed to create assignment'),
  })

  const submitting = isAddingCourse || isAddingResource || isAddingAssignment
  const loading = coursesLoading || resourcesLoading || assignmentsLoading

  // Computed values
  const activeCourses = stats?.activeCourses || courses.filter(c => c.status === 'Active').length
  const totalEnrolled = stats?.totalEnrollments || courses.reduce((sum, c) => sum + c.enrollmentCount, 0)
  const avgCompletion = stats ? Math.round(stats.avgCompletion) : (courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0)
  const totalResources = stats?.totalResources || resources.length

  const popularCourses = [...courses].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 5)

  const completionChartData = courses.slice(0, 8).map(c => ({
    subject: c.subject.length > 10 ? c.subject.substring(0, 10) + '...' : c.subject,
    progress: c.progress,
  }))

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
    if (!newCourseSubject || !newCourseTeacher || !newCourseMaxEnroll) {
      toast.error('Subject, Teacher, and Max Enrollment are required')
      return
    }
    addCourse({
      action: 'addCourse',
      name: newCourseSubject,
      instructor: newCourseTeacher,
      description: newCourseDesc,
      enrollmentCount: 0,
      syllabusCompletion: 0,
    })
  }

  const handleAddResource = () => {
    if (!newResTitle || !selectedResCourseId || !newResDesc) {
      toast.error('Title, Course and Description are required')
      return
    }
    addResource({
      action: 'addResource',
      courseId: selectedResCourseId,
      title: newResTitle,
      resourceType: newResType.toUpperCase().replace(/ /g, '_'),
      url: '',
      fileSize: 1024 * 1024 * 1.5,
      uploadedBy: 'Admin',
    })
  }

  const handleAddAssignment = () => {
    if (!newAsgTitle || !selectedAsgCourseId || !newAsgDueDate) {
      toast.error('Title, Course, and Due Date are required')
      return
    }
    addAssignment({
      action: 'addAssignment',
      courseId: selectedAsgCourseId,
      title: newAsgTitle,
      description: newAsgDesc,
      maxMarks: parseInt(newAsgMaxMarks) || 100,
      dueDate: newAsgDueDate,
    })
  }

  const resourceTypeIcon = (type: string) => {
    switch (type) {
      case 'Notes': return <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case 'Video': return <Video className="h-4 w-4 text-red-500" />
      case 'Past Exam Paper': return <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      case 'Worksheet': return <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const resourceTypeColor = (type: string) => {
    switch (type) {
      case 'Notes': return 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/20'
      case 'Video': return 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-500/20'
      case 'Past Exam Paper': return 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-500/20'
      case 'Worksheet': return 'bg-teal-100/80 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const assignmentStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/20'
      case 'Grading': return 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-500/20'
      case 'Closed': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-600 dark:text-emerald-400'
    if (grade.startsWith('B')) return 'text-teal-600 dark:text-teal-400'
    if (grade.startsWith('C')) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
  }

  const selectedCourse = courses.find(c => c.id === selectedId)
  const selectedResource = resources.find(r => r.id === selectedId)

  if (loading) {
    return (
      <ModuleContainer>
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <StatGrid cols={4}>
          {[1, 2, 3, 4].map((i) => (<div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />))}
        </StatGrid>
      </ModuleContainer>
    )
  }

  // ─── Settings View ──────────────────────────────────────────────────────
  if (viewMode === 'settings') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 px-2.5 hover:bg-accent" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back to LMS
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">E-Learning Settings</h2>
            <p className="text-sm text-muted-foreground">Configure platform defaults, content, and notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Platform Settings" description="General platform configuration" icon={Monitor}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Platform Name</Label>
                <Input value={platformName} onChange={e => setPlatformName(e.target.value)} className="h-9" />
              </div>
              <div className="grid gap-2">
                <Label>Default Video Quality</Label>
                <Select value={defaultVideoQuality} onValueChange={setDefaultVideoQuality}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Max File Upload Size (MB)</Label>
                <Input type="number" value={maxFileSize} onChange={e => setMaxFileSize(e.target.value)} className="h-9" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Assignment & Content Defaults" description="Default settings for new assignments" icon={FileText}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Default Assignment Due (Days)</Label>
                <Input type="number" value={defaultAssignmentDueDays} onChange={e => setDefaultAssignmentDueDays(e.target.value)} className="h-9" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                <div>
                  <p className="text-sm font-medium">Auto-save Assignments</p>
                  <p className="text-xs text-muted-foreground">Automatically save student progress</p>
                </div>
                <Switch checked={autoSaveAssignments} onCheckedChange={setAutoSaveAssignments} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                <div>
                  <p className="text-sm font-medium">Plagiarism Check</p>
                  <p className="text-xs text-muted-foreground">Enable plagiarism detection on submissions</p>
                </div>
                <Switch checked={enablePlagiarismCheck} onCheckedChange={setEnablePlagiarismCheck} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Notification Preferences" description="Manage notification settings" icon={Settings}>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                <div>
                  <p className="text-sm font-medium">New Submission Alerts</p>
                  <p className="text-xs text-muted-foreground">Notify teachers of new submissions</p>
                </div>
                <Switch checked={notifyNewSubmission} onCheckedChange={setNotifyNewSubmission} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                <div>
                  <p className="text-sm font-medium">Student Messaging</p>
                  <p className="text-xs text-muted-foreground">Allow students to message teachers</p>
                </div>
                <Switch checked={enableStudentMessaging} onCheckedChange={setEnableStudentMessaging} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Settings saved successfully')}>
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Add Course View ────────────────────────────────────────────────────
  if (viewMode === 'add' && activeTab === 'courses') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 px-2.5 hover:bg-accent" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back to LMS
          </Button>
        </div>
        <SectionCard title="Add New Course" description="Create a new course for the e-learning platform" icon={BookOpen}>
          <div className="space-y-4 max-w-2xl">
             <div className="space-y-2">
               <Label>Subject Name *</Label>
               <Input value={newCourseSubject} onChange={e => setNewCourseSubject(e.target.value)} placeholder="e.g. Mathematics" className="h-9" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Teacher *</Label>
                 <Input value={newCourseTeacher} onChange={e => setNewCourseTeacher(e.target.value)} placeholder="Teacher name" className="h-9" />
               </div>
               <div className="space-y-2">
                 <Label>Category</Label>
                 <Select value={newCourseCategory} onValueChange={setNewCourseCategory}>
                   <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
               <Label>Max Enrollment *</Label>
               <Input type="number" value={newCourseMaxEnroll} onChange={e => setNewCourseMaxEnroll(e.target.value)} placeholder="e.g. 40" className="h-9" />
             </div>
             <div className="space-y-2">
               <Label>Description</Label>
               <Textarea value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} placeholder="Course description..." rows={3} />
             </div>
             <div className="flex items-center gap-3 pt-2">
               <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>Cancel</Button>
               <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={handleAddCourse} disabled={!newCourseSubject || !newCourseTeacher || !newCourseMaxEnroll || submitting}>
                 {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Create Course
               </Button>
             </div>
          </div>
        </SectionCard>
      </ModuleContainer>
    )
  }

  // ─── Upload Resource View ───────────────────────────────────────────────
  if (viewMode === 'add' && activeTab === 'resources') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 px-2.5 hover:bg-accent" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back to LMS
          </Button>
        </div>
        <SectionCard title="Upload Learning Resource" description="Add a new resource for students and teachers" icon={Upload}>
          <div className="space-y-4 max-w-2xl">
             <div className="space-y-2">
               <Label>Resource Title *</Label>
               <Input value={newResTitle} onChange={e => setNewResTitle(e.target.value)} placeholder="e.g. Algebra Notes - Form 4" className="h-9" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Course *</Label>
                 <Select value={selectedResCourseId} onValueChange={setNewResCourseId}>
                   <SelectTrigger className="h-9"><SelectValue placeholder="Select course" /></SelectTrigger>
                   <SelectContent>
                     {courses.map(c => (
                       <SelectItem key={c.id} value={c.id}>{c.subject}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Resource Type</Label>
                 <Select value={newResType} onValueChange={v => setNewResType(v as Resource['type'])}>
                   <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
               <Label>Description *</Label>
               <Textarea value={newResDesc} onChange={e => setNewResDesc(e.target.value)} placeholder="Brief description of the resource..." rows={3} />
             </div>
             <div className="flex items-center gap-3 pt-2">
               <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>Cancel</Button>
               <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={handleAddResource} disabled={!newResTitle || !newResDesc || submitting}>
                 {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Upload
               </Button>
             </div>
          </div>
        </SectionCard>
      </ModuleContainer>
    )
  }

  // ─── Add Assignment View ────────────────────────────────────────────────
  if (viewMode === 'add' && activeTab === 'assignments') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 px-2.5 hover:bg-accent" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back to LMS
          </Button>
        </div>
        <SectionCard title="Create New Assignment" description="Add a new assignment for students" icon={Plus}>
          <div className="space-y-4 max-w-2xl">
             <div className="space-y-2">
               <Label>Assignment Title *</Label>
               <Input value={newAsgTitle} onChange={e => setNewAsgTitle(e.target.value)} placeholder="e.g. Mid-term Exam Paper" className="h-9" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Course *</Label>
                 <Select value={selectedAsgCourseId} onValueChange={setNewAsgCourseId}>
                   <SelectTrigger className="h-9"><SelectValue placeholder="Select course" /></SelectTrigger>
                   <SelectContent>
                     {courses.map(c => (
                       <SelectItem key={c.id} value={c.id}>{c.subject}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Max Marks</Label>
                 <Input type="number" value={newAsgMaxMarks} onChange={e => setNewAsgMaxMarks(e.target.value)} className="h-9" />
               </div>
             </div>
             <div className="space-y-2">
               <Label>Due Date *</Label>
               <Input type="date" value={newAsgDueDate} onChange={e => setNewAsgDueDate(e.target.value)} className="h-9" />
             </div>
             <div className="space-y-2">
               <Label>Description</Label>
               <Textarea value={newAsgDesc} onChange={e => setNewAsgDesc(e.target.value)} placeholder="Assignment details and instructions..." rows={3} />
             </div>
             <div className="flex items-center gap-3 pt-2">
               <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>Cancel</Button>
               <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={handleAddAssignment} disabled={!newAsgTitle || !newAsgDueDate || submitting}>
                 {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Create Assignment
               </Button>
             </div>
          </div>
        </SectionCard>
      </ModuleContainer>
    )
  }

  // ─── Course Detail View ─────────────────────────────────────────────────
  if (viewMode === 'detail' && selectedCourse) {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 px-2.5 hover:bg-accent" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back to LMS
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{selectedCourse.subject}</h2>
              <p className="text-sm text-muted-foreground">{selectedCourse.teacher} &middot; {selectedCourse.category}</p>
            </div>
          </div>
          <Badge variant={selectedCourse.status === 'Active' ? 'default' : selectedCourse.status === 'Upcoming' ? 'secondary' : 'outline'} className="self-start sm:self-center">
            {selectedCourse.status}
          </Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Course Details" icon={BookOpen}>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
                <p className="text-sm mt-1 text-foreground">{selectedCourse.description}</p>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex justify-between items-center py-0.5">
                <span className="text-sm text-muted-foreground">Enrollment Limit</span>
                <span className="text-sm font-semibold">{selectedCourse.enrollmentCount}/{selectedCourse.maxEnrollment} students</span>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex justify-between items-center py-0.5">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="outline" className="text-xs font-medium">{selectedCourse.category}</Badge>
              </div>
              <Separator className="bg-border/60" />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Enrollment Capacity</span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{Math.round((selectedCourse.enrollmentCount / selectedCourse.maxEnrollment) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(selectedCourse.enrollmentCount / selectedCourse.maxEnrollment) * 100}%` }} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Syllabus Progress" icon={BarChart3}>
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="text-center">
                <p className={cn('text-6xl font-extrabold tracking-tight', selectedCourse.progress >= 70 ? 'text-emerald-600 dark:text-emerald-400' : selectedCourse.progress >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500')}>{selectedCourse.progress}%</p>
                <p className="text-sm font-medium text-muted-foreground mt-2">Syllabus Completed</p>
              </div>
              <div className="w-full bg-muted rounded-full h-3 max-w-sm">
                <div className={cn('h-3 rounded-full transition-all', selectedCourse.progress >= 70 ? 'bg-emerald-500' : selectedCourse.progress >= 40 ? 'bg-amber-500' : 'bg-rose-400')} style={{ width: `${selectedCourse.progress}%` }} />
              </div>
            </div>
          </SectionCard>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Resource Detail View ───────────────────────────────────────────────
  if (viewMode === 'detail' && selectedResource) {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 px-2.5 hover:bg-accent" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4" /> Back to LMS
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/40">
              {resourceTypeIcon(selectedResource.type)}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{selectedResource.title}</h2>
              <p className="text-sm text-muted-foreground">{selectedResource.subject} &middot; {selectedResource.type}</p>
            </div>
          </div>
          <Badge className={cn('text-xs', resourceTypeColor(selectedResource.type))}>{selectedResource.type}</Badge>
        </div>
        <SectionCard title="Resource Details" icon={FileText}>
          <div className="space-y-4 max-w-2xl">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
              <p className="text-sm mt-1 text-foreground">{selectedResource.description}</p>
            </div>
            <Separator className="bg-border/60" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Uploaded By</span>
                <p className="font-semibold mt-0.5 text-foreground">{selectedResource.uploadedBy}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Upload Date</span>
                <p className="font-semibold mt-0.5 text-foreground">{selectedResource.uploadDate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">File Size</span>
                <p className="font-semibold mt-0.5 text-foreground">{selectedResource.fileSize}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Downloads</span>
                <p className="font-semibold mt-0.5 text-foreground">{selectedResource.downloads}</p>
              </div>
            </div>
            <div className="pt-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" size="sm" onClick={() => toast.success('Resource download initiated')}>
                <Download className="h-4 w-4" /> Download File
              </Button>
            </div>
          </div>
        </SectionCard>
      </ModuleContainer>
    )
  }

  // ─── List View (Main) ──────────────────────────────────────────────────
  return (
    <ModuleContainer>
      <ModulePageLayout
        actions={<>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </>}
      >
        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={BookOpen}
              label="Active Courses"
              value={activeCourses}
              trend={{ value: "+2 this term", positive: true }}
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              index={0}
            />
            <ModuleStatCard
              icon={GraduationCap}
              label="Enrolled Students"
              value={totalEnrolled}
              trend={{ value: "Across all courses", positive: true }}
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              index={1}
            />
            <ModuleStatCard
              icon={BarChart3}
              label="Avg. Completion"
              value={`${avgCompletion}%`}
              trend={{ value: "+8% vs last month", positive: true }}
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              index={2}
            />
            <ModuleStatCard
              icon={FileText}
              label="Digital Resources"
              value={totalResources}
              trend={{ value: `${resources.reduce((s, r) => s + r.downloads, 0)} downloads`, positive: true }}
              bgColor="bg-cyan-50 dark:bg-cyan-950/40"
              iconColor="text-cyan-600 dark:text-cyan-400"
              index={3}
            />
          </StatGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Popular Courses" icon={Star}>
              <div className="space-y-3.5">
                {popularCourses.map((course, idx) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white', idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-muted-foreground' : idx === 2 ? 'bg-orange-400' : 'bg-muted text-muted-foreground')}>{idx + 1}</div>
                      <div><p className="text-sm font-medium">{course.subject}</p><p className="text-xs text-muted-foreground">{course.teacher} &middot; {course.category}</p></div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{course.enrollmentCount}/{course.maxEnrollment}</p>
                      <div className="w-16 bg-muted rounded-full h-1.5 mt-1"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${course.progress}%` }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Recent Activity" icon={Clock}>
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                {recentActivity.map(act => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5', act.type === 'assignment' ? 'bg-emerald-100 dark:bg-emerald-950/60' : act.type === 'resource' ? 'bg-cyan-100 dark:bg-cyan-950/60' : act.type === 'submission' ? 'bg-teal-100 dark:bg-teal-950/60' : act.type === 'grade' ? 'bg-amber-100 dark:bg-amber-950/60' : 'bg-muted')}>
                      {act.type === 'assignment' ? <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : act.type === 'resource' ? <FileText className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> : act.type === 'submission' ? <Users className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> : act.type === 'grade' ? <BarChart3 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> : <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <div><p className="text-sm font-medium text-foreground">{act.action}</p><p className="text-xs text-muted-foreground">{act.detail}</p><p className="text-[10px] text-muted-foreground/70 mt-0.5">{act.time}</p></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Course Completion Progress" description="Percentage of syllabus covered by course">
            <ChartContainer config={completionChartConfig} className="h-[280px] w-full">
              <BarChart data={completionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--border), 0.3)" />
                <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="progress" fill="var(--color-progress)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </SectionCard>
        </TabsContent>

        {/* ─── Courses Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="courses" className="space-y-4">
          <ModuleToolbar
            search={searchCourse}
            onSearch={setSearchCourse}
            searchPlaceholder="Search courses..."
            actions={
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setViewMode('add')}>
                <Plus className="h-4 w-4" /> Add Course
              </Button>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <Card key={course.id} className="border border-border/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer" onClick={() => { setSelectedId(course.id); setViewMode('detail') }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div><p className="text-sm font-semibold text-foreground">{course.subject}</p><p className="text-xs text-muted-foreground">{course.teacher}</p></div>
                    <Badge variant={course.status === 'Active' ? 'default' : course.status === 'Upcoming' ? 'secondary' : 'outline'} className="text-[10px]">{course.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Enrollment</span><span className="font-medium text-foreground">{course.enrollmentCount}/{course.maxEnrollment}</span></div>
                    <div className="w-full bg-muted rounded-full h-1.5"><div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${(course.enrollmentCount / course.maxEnrollment) * 100}%` }} /></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Syllabus Progress</span><span className="font-medium text-foreground">{course.progress}%</span></div>
                    <div className="w-full bg-muted rounded-full h-1.5"><div className={cn('h-1.5 rounded-full transition-all', course.progress > 70 ? 'bg-emerald-500' : course.progress > 40 ? 'bg-amber-500' : 'bg-rose-400')} style={{ width: `${course.progress}%` }} /></div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/60">
                    <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">View <ChevronRight className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── Resources Tab ────────────────────────────────────────────────── */}
        <TabsContent value="resources" className="space-y-4">
          <ModuleToolbar
            search={searchResource}
            onSearch={setSearchResource}
            searchPlaceholder="Search resources..."
            filters={
              <>
                <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{resourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>{uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </>
            }
            actions={
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setViewMode('add')}>
                <Upload className="h-4 w-4" /> Upload Resource
              </Button>
            }
          />

          <TableShell isEmpty={filteredResources.length === 0} empty={<KitEmptyState icon={FileText} title="No resources found" description="Try adjusting your filters or search query." />}>
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
                  <TableRow key={res.id} className="cursor-pointer hover:bg-muted/30" onClick={() => { setSelectedId(res.id); setViewMode('detail') }}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded bg-muted/60">
                          {resourceTypeIcon(res.type)}
                        </div>
                        <div><p className="text-sm font-medium text-foreground">{res.title}</p><p className="text-xs text-muted-foreground">{res.fileSize}</p></div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{res.subject}</Badge></TableCell>
                    <TableCell><Badge className={cn('text-[10px]', resourceTypeColor(res.type))}>{res.type}</Badge></TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{res.uploadedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{res.uploadDate}</TableCell>
                    <TableCell className="text-sm text-foreground"><div className="flex items-center gap-1"><Download className="h-3 w-3 text-muted-foreground" />{res.downloads}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        {/* ─── Assignments Tab ──────────────────────────────────────────────── */}
        <TabsContent value="assignments" className="space-y-4">
          <ModuleToolbar
            search={searchAssignment}
            onSearch={setSearchAssignment}
            searchPlaceholder="Search assignments..."
            filters={
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-500/20"><Clock className="h-3 w-3" />{assignments.filter(a => a.status === 'Open').length} Open</Badge>
                <Badge variant="outline" className="gap-1 bg-muted/50 text-muted-foreground border-border/40"><CheckCircle2 className="h-3 w-3" />{assignments.filter(a => a.status === 'Closed').length} Closed</Badge>
              </div>
            }
          />

          <TableShell isEmpty={filteredAssignments.length === 0} empty={<KitEmptyState icon={BookOpen} title="No assignments found" description="Try adjusting your search query." />}>
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
                    <TableCell><div><p className="text-sm font-medium text-foreground">{a.title}</p><p className="text-xs text-muted-foreground">Max marks: {a.maxMarks}</p></div></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.course}</Badge></TableCell>
                    <TableCell className="text-sm"><div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-muted-foreground" />{a.dueDate}</div></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5"><div className={cn('h-1.5 rounded-full', a.submitted / a.totalStudents > 0.8 ? 'bg-emerald-500' : a.submitted / a.totalStudents > 0.5 ? 'bg-amber-500' : 'bg-rose-400')} style={{ width: `${(a.submitted / a.totalStudents) * 100}%` }} /></div>
                        <span className="text-xs font-medium text-foreground">{a.submitted}/{a.totalStudents}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{a.graded}/{a.submitted}</TableCell>
                    <TableCell>
                      {a.avgScore !== null ? (
                        <span className={cn('text-sm font-semibold', a.avgScore / a.maxMarks > 0.7 ? 'text-emerald-600 dark:text-emerald-400' : a.avgScore / a.maxMarks > 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500')}>{a.avgScore}/{a.maxMarks}</span>
                      ) : (<span className="text-xs text-muted-foreground">{'\u2014'}</span>)}
                    </TableCell>
                    <TableCell><Badge className={cn('text-[10px]', assignmentStatusColor(a.status))}>{a.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        {/* ─── Progress Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="progress" className="space-y-4">
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <KitEmptyState
              icon={GraduationCap}
              title="Student Grade & Syllabus Tracking"
              description="Detailed student-specific grades, term reports, and academic syllabus progress tracking are managed centrally inside the core Academics, Gradebook, and Student Portal modules. This ensures data consistency across the ZimSchool Pro platform."
            />
          </div>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
