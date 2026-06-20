'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Search,
  Plus,
  Users,
  BedDouble,
  Sun,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  DollarSign,
  ClipboardCheck,
  Heart,
  Scale,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Briefcase,
  Download,
  Printer,
  FileSpreadsheet,
  Settings,
  Save,
  Pencil,
  Ban,
  FileBarChart,
  Columns3,
  Hash,
  ToggleLeft,
  Bell,
  Camera,
  Stethoscope,
  Baby,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Image,
  Sliders,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModulePageLayout, ModuleSettingsButton, ModuleStatCard } from '@/components/module-ui'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { exportToCSV, printReport, buildHTMLTable } from '@/lib/export-utils'
import { toast } from 'sonner'
import { EmptyState } from '@/components/empty-state'

// ─── View Mode Type ──────────────────────────────────────────────────────────
type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentEnrollment {
  id: string
  classId: string
  status: string
  enrollmentDate: string
  class: {
    id: string
    name: string
    stream: string | null
    grade: { id: string; name: string; level: string }
  }
}

interface ParentLink {
  id: string
  relationship: string
  isPrimary: boolean
  parent: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email: string | null
    occupation: string | null
  }
}

interface Student {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  middleName: string | null
  gender: string
  dateOfBirth: string
  boardingStatus: string | null
  enrollmentStatus: string
  birthCertNumber: string | null
  previousSchool: string | null
  nationality: string
  beamStatus: string | null
  enrollments: StudentEnrollment[]
  parentLinks: ParentLink[]
}

interface StudentDetail {
  student: Student & {
    religion: string | null
    homeLanguage: string | null
    bloodGroup: string | null
    allergies: string | null
    chronicConditions: string | null
    admissionDate: string
    photo: string | null
    feeInvoices: {
      id: string
      invoiceNumber: string
      totalAmount: number
      amountPaid: number
      balance: number
      status: string
      dueDate: string
      createdAt: string
      items: { description: string; amount: number; feeType: string }[]
      term: { name: string } | null
    }[]
    attendanceRecords: {
      id: string
      date: string
      status: string
      attendanceType: string
      remarks: string | null
    }[]
    disciplineRecords: {
      id: string
      incidentType: string
      description: string
      date: string
      action: string | null
      status: string
      meritPoints: number
      demeritPoints: number
    }[]
    healthRecords: {
      id: string
      visitType: string
      description: string
      treatment: string | null
      visitDate: string
    }[]
    beamApplication: {
      id: string
      status: string
      coveredAmount: number
      outstandingBalance: number
      socialWelfareRef: string | null
    } | null
  }
  attendanceSummary: {
    total: number
    present: number
    absent: number
    late: number
    attendanceRate: string
  }
}

interface StudentsResponse {
  data: Student[]
  total: number
  page: number
  totalPages: number
}

// ─── Student Settings Type ───────────────────────────────────────────────────
interface StudentSettings {
  defaultView: 'table' | 'cards'
  studentNumberFormat: string
  autoGenerateStudentNumber: boolean
  defaultEnrollmentStatus: string
  autoAssignToClass: boolean
  requiredFirstName: boolean
  requiredLastName: boolean
  requiredGender: boolean
  requiredDateOfBirth: boolean
  requiredBirthCert: boolean
  requiredBoardingStatus: boolean
  showStudentNumber: boolean
  showGender: boolean
  showGrade: boolean
  showBoarding: boolean
  showStatus: boolean
  showBEAM: boolean
  photoDisplay: boolean
  photoAutoResize: boolean
  ageCalculationMethod: string
  beamDefaultStatus: string
  emailOnNewStudent: boolean
  emailOnTransfer: boolean
  exportFormat: string
}

const defaultStudentSettings: StudentSettings = {
  defaultView: 'table',
  studentNumberFormat: 'SCH-YYYY-NNNN',
  autoGenerateStudentNumber: true,
  defaultEnrollmentStatus: 'ACTIVE',
  autoAssignToClass: false,
  requiredFirstName: true,
  requiredLastName: true,
  requiredGender: true,
  requiredDateOfBirth: true,
  requiredBirthCert: false,
  requiredBoardingStatus: false,
  showStudentNumber: true,
  showGender: true,
  showGrade: true,
  showBoarding: true,
  showStatus: true,
  showBEAM: true,
  photoDisplay: true,
  photoAutoResize: true,
  ageCalculationMethod: 'year_start',
  beamDefaultStatus: 'NOT_APPLIED',
  emailOnNewStudent: true,
  emailOnTransfer: true,
  exportFormat: 'csv',
}

// ─── Status Badge Helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50' },
    TRANSFERRED: { label: 'Transferred', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50' },
    GRADUATED: { label: 'Graduated', className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/50' },
    DROPPED_OUT: { label: 'Dropped Out', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50' },
    SUSPENDED: { label: 'Suspended', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50' },
  }
  const c = config[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' }
  return (
    <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-medium', c.className)}>
      {c.label}
    </Badge>
  )
}

function BoardingBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>
  const isBoarder = status === 'BOARDER'
  return (
    <Badge variant="outline" className={cn(
      'text-[11px] px-2 py-0.5 font-medium',
      isBoarder
        ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/50'
        : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50'
    )}>
      {isBoarder ? 'Boarder' : 'Day Scholar'}
    </Badge>
  )
}

function GenderBadge({ gender }: { gender: string }) {
  return (
    <Badge variant="outline" className={cn(
      'text-[11px] px-2 py-0.5 font-medium',
      gender === 'MALE'
        ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50'
        : 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/50'
    )}>
      {gender === 'MALE' ? 'Male' : 'Female'}
    </Badge>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PARTIAL: { label: 'Partial', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    PENDING: { label: 'Pending', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    OVERDUE: { label: 'Overdue', className: 'bg-red-50 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  }
  const c = config[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' }
  return (
    <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-medium', c.className)}>
      {c.label}
    </Badge>
  )
}

function AttendanceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PRESENT: { label: 'Present', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ABSENT: { label: 'Absent', className: 'bg-red-50 text-red-700 border-red-200' },
    LATE: { label: 'Late', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    EXCUSED: { label: 'Excused', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  }
  const c = config[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' }
  return (
    <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-medium', c.className)}>
      {c.label}
    </Badge>
  )
}

// ─── Student List View ────────────────────────────────────────────────────────
function StudentListView({
  onSelectStudent,
  onAddStudent,
  onOpenSettings,
}: {
  onSelectStudent: (id: string) => void
  onAddStudent: () => void
  onOpenSettings: () => void
}) {
  const [activeTab, setActiveTab] = useState('directory')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')
  const [boardingFilter, setBoardingFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortField, setSortField] = useState<string>('studentNumber')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [stats, setStats] = useState({
    total: 0, active: 0, boarders: 0, dayScholars: 0, beam: 0,
  })

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('enrollmentStatus', statusFilter)
      if (genderFilter !== 'ALL') params.set('gender', genderFilter)
      if (boardingFilter !== 'ALL') params.set('boardingStatus', boardingFilter)

      const res = await fetch(`/api/students?${params.toString()}`)
      if (res.ok) {
        const json: StudentsResponse = await res.json()
        setStudents(json.data)
        setTotalPages(json.totalPages)
        setTotal(json.total)
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, genderFilter, boardingFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/students?limit=1000')
      if (res.ok) {
        const json: StudentsResponse = await res.json()
        const allStudents = json.data
        setStats({
          total: json.total,
          active: allStudents.filter(s => s.enrollmentStatus === 'ACTIVE').length,
          boarders: allStudents.filter(s => s.boardingStatus === 'BOARDER').length,
          dayScholars: allStudents.filter(s => s.boardingStatus === 'DAY_SCHOLAR').length,
          beam: allStudents.filter(s => s.beamStatus === 'APPROVED' || s.beamStatus === 'ACTIVE').length,
        })
      }
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => { setPage(1) }, [search, statusFilter, genderFilter, boardingFilter])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    let aVal: string | number = ''
    let bVal: string | number = ''
    switch (sortField) {
      case 'studentNumber': aVal = a.studentNumber; bVal = b.studentNumber; break
      case 'name': aVal = `${a.lastName} ${a.firstName}`; bVal = `${b.lastName} ${b.firstName}`; break
      case 'gender': aVal = a.gender; bVal = b.gender; break
      case 'grade': {
        aVal = a.enrollments[0]?.class?.grade?.name || ''
        bVal = b.enrollments[0]?.class?.grade?.name || ''
        break
      }
      case 'boardingStatus': aVal = a.boardingStatus || ''; bVal = b.boardingStatus || ''; break
      case 'enrollmentStatus': aVal = a.enrollmentStatus; bVal = b.enrollmentStatus; break
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 text-emerald-600" />
      : <ArrowDown className="ml-1 h-3 w-3 text-emerald-600" />
  }

  return (
    <div className="space-y-5">
      <ModulePageLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="directory">Student Directory</TabsTrigger>
        </>}
        actions={<>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const csvData = sortedStudents.map(s => ({
                  'Student Number': s.studentNumber,
                  'First Name': s.firstName,
                  'Last Name': s.lastName,
                  'Gender': s.gender === 'MALE' ? 'Male' : 'Female',
                  'Grade': s.enrollments[0]?.class?.grade?.name || '',
                  'Class': s.enrollments[0]?.class?.name || '',
                  'Boarding Status': s.boardingStatus === 'BOARDER' ? 'Boarder' : s.boardingStatus === 'DAY_SCHOLAR' ? 'Day Scholar' : '',
                  'Enrollment Status': s.enrollmentStatus,
                }))
                exportToCSV(csvData, `students_export_${new Date().toISOString().slice(0, 10)}`)
              }}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const headers = ['Student #', 'Name', 'Gender', 'Grade', 'Class', 'Boarding', 'Status']
                const rows = sortedStudents.map(s => [
                  s.studentNumber,
                  `${s.firstName} ${s.lastName}`,
                  s.gender === 'MALE' ? 'Male' : 'Female',
                  s.enrollments[0]?.class?.grade?.name || '-',
                  s.enrollments[0]?.class?.name || '-',
                  s.boardingStatus === 'BOARDER' ? 'Boarder' : s.boardingStatus === 'DAY_SCHOLAR' ? 'Day Scholar' : '-',
                  s.enrollmentStatus,
                ])
                printReport('Student List', buildHTMLTable(headers, rows))
              }}>
                <Printer className="mr-2 h-4 w-4 text-teal-600" />
                Print List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md gap-2" onClick={onAddStudent}>
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
          <ModuleSettingsButton onClick={onOpenSettings} />
        </>}
      >
        <TabsContent value="directory" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            <ModuleStatCard icon={GraduationCap} label="Total Students" value={stats.total} accentGradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50" />
            <ModuleStatCard icon={CheckCircle2} label="Active" value={stats.active} accentGradient="from-teal-400 to-cyan-500" bgColor="bg-teal-50" />
            <ModuleStatCard icon={BedDouble} label="Boarders" value={stats.boarders} accentGradient="from-cyan-400 to-sky-500" bgColor="bg-cyan-50" />
            <ModuleStatCard icon={Sun} label="Day Scholars" value={stats.dayScholars} accentGradient="from-amber-400 to-orange-500" bgColor="bg-amber-50" />
            <ModuleStatCard icon={Shield} label="BEAM" value={stats.beam} accentGradient="from-emerald-400 to-green-500" bgColor="bg-emerald-50" />
          </motion.div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or student number..."
                  className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  {(['ALL', 'ACTIVE', 'TRANSFERRED', 'DROPPED_OUT'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={statusFilter === s ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-7 text-xs px-2.5',
                        statusFilter === s
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'hover:bg-muted/60'
                      )}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s === 'ALL' ? 'All' : s === 'DROPPED_OUT' ? 'Dropped' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Genders</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={boardingFilter} onValueChange={setBoardingFilter}>
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue placeholder="Boarding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="BOARDER">Boarder</SelectItem>
                    <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('studentNumber')}>
                      <span className="flex items-center text-xs">Student # <SortIcon field="studentNumber" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('name')}>
                      <span className="flex items-center text-xs">Name <SortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10 hidden sm:table-cell" onClick={() => handleSort('gender')}>
                      <span className="flex items-center text-xs">Gender <SortIcon field="gender" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10 hidden md:table-cell" onClick={() => handleSort('grade')}>
                      <span className="flex items-center text-xs">Grade <SortIcon field="grade" /></span>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Class</TableHead>
                    <TableHead className="cursor-pointer select-none h-10 hidden md:table-cell" onClick={() => handleSort('boardingStatus')}>
                      <span className="flex items-center text-xs">Boarding <SortIcon field="boardingStatus" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('enrollmentStatus')}>
                      <span className="flex items-center text-xs">Status <SortIcon field="enrollmentStatus" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : sortedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-0 px-0">
                        <EmptyState
                          icon={GraduationCap}
                          title="No students found"
                          description="Try adjusting your search or filters to find what you're looking for."
                          actionLabel={search ? undefined : "Add Student"}
                          onAction={search ? undefined : onAddStudent}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedStudents.map((student) => {
                      const enrollment = student.enrollments[0]
                      const gradeName = enrollment?.class?.grade?.name || '—'
                      const className = enrollment?.class?.name || '—'
                      return (
                        <TableRow
                          key={student.id}
                          className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                          onClick={() => onSelectStudent(student.id)}
                        >
                          <TableCell className="font-mono text-xs py-2.5">{student.studentNumber}</TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 ring-1 ring-white/50 dark:ring-white/20">
                                <AvatarFallback className={cn(
                                  'text-[10px] font-semibold',
                                  student.gender === 'MALE'
                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                                    : 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
                                )}>
                                  {student.firstName[0]}{student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium leading-tight">{student.firstName} {student.lastName}</p>
                                {student.middleName && <p className="text-[10px] text-muted-foreground">{student.middleName}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-2.5"><GenderBadge gender={student.gender} /></TableCell>
                          <TableCell className="text-sm hidden md:table-cell py-2.5">{gradeName}</TableCell>
                          <TableCell className="text-sm hidden lg:table-cell py-2.5">{className}</TableCell>
                          <TableCell className="hidden md:table-cell py-2.5"><BoardingBadge status={student.boardingStatus} /></TableCell>
                          <TableCell className="py-2.5"><StatusBadge status={student.enrollmentStatus} /></TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} of {Math.max(totalPages, 1)} ({total} records)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  if (pageNum > totalPages) return null
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-8 w-8 p-0 text-xs',
                        pageNum === page && 'bg-emerald-600 hover:bg-emerald-700'
                      )}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          </Card>
        </TabsContent>
      </ModulePageLayout>
    </div>
  )
}

// ─── Add Student Inline Form (Multi-Step) ────────────────────────────────────
function AddStudentInlineForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const steps = ['Basic Info', 'Parent/Guardian', 'Medical', 'Review']

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    birthCertNumber: '',
    boardingStatus: '',
    nationality: 'Zimbabwean',
    religion: '',
    homeLanguage: '',
    previousSchool: '',
    // Parent/Guardian
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    parentRelationship: '',
    // Second parent
    parent2FirstName: '',
    parent2LastName: '',
    parent2Phone: '',
    parent2Relationship: '',
    // Medical
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    medicalNotes: '',
    doctorName: '',
    doctorPhone: '',
  })

  const resetForm = () => {
    setForm({
      firstName: '', lastName: '', middleName: '', dateOfBirth: '', gender: '',
      birthCertNumber: '', boardingStatus: '', nationality: 'Zimbabwean', religion: '',
      homeLanguage: '', previousSchool: '',
      parentFirstName: '', parentLastName: '', parentPhone: '', parentEmail: '',
      parentOccupation: '', parentRelationship: '',
      parent2FirstName: '', parent2LastName: '', parent2Phone: '', parent2Relationship: '',
      bloodGroup: '', allergies: '', chronicConditions: '', medicalNotes: '',
      doctorName: '', doctorPhone: '',
    })
    setError('')
    setStep(0)
  }

  const canProceed = () => {
    switch (step) {
      case 0: return form.firstName.trim() && form.lastName.trim() && form.gender && form.dateOfBirth
      case 1: return form.parentFirstName.trim() && form.parentLastName.trim() && form.parentPhone.trim()
      case 2: return true
      default: return true
    }
  }

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.gender || !form.dateOfBirth) {
      setError('First name, last name, gender, and date of birth are required.')
      setStep(0)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || undefined,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          birthCertNumber: form.birthCertNumber.trim() || undefined,
          boardingStatus: form.boardingStatus || undefined,
          previousSchool: form.previousSchool.trim() || undefined,
          nationality: form.nationality.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create student')
      }
      resetForm()
      toast.success('Student added successfully', {
        description: `${form.firstName} ${form.lastName} has been enrolled`,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 text-muted-foreground hover:text-foreground min-h-[44px]" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Student List</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <UserPlus className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Add New Student</CardTitle>
              <CardDescription>Complete all steps to register a new student.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((label, i) => (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                      i < step ? 'bg-emerald-500 text-white' :
                      i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {i < step ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={cn(
                      'text-[11px] font-medium hidden sm:block',
                      i <= step ? 'text-emerald-700' : 'text-muted-foreground'
                    )}>{label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 mx-2 mb-4 sm:mb-0 transition-all',
                      i < step ? 'bg-emerald-500' : 'bg-muted'
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Tendai" required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Moyo" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input value={form.middleName} onChange={e => setForm(f => ({ ...f, middleName: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Birth Certificate #</Label>
                  <Input value={form.birthCertNumber} onChange={e => setForm(f => ({ ...f, birthCertNumber: e.target.value }))} placeholder="e.g. 08-123456A12" />
                </div>
                <div className="space-y-2">
                  <Label>Boarding Status</Label>
                  <Select value={form.boardingStatus} onValueChange={v => setForm(f => ({ ...f, boardingStatus: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                      <SelectItem value="BOARDER">Boarder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="Zimbabwean" />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Input value={form.religion} onChange={e => setForm(f => ({ ...f, religion: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label>Home Language</Label>
                  <Select value={form.homeLanguage} onValueChange={v => setForm(f => ({ ...f, homeLanguage: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shona">Shona</SelectItem>
                      <SelectItem value="Ndebele">Ndebele</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Tonga">Tonga</SelectItem>
                      <SelectItem value="Venda">Venda</SelectItem>
                      <SelectItem value="Shangani">Shangani</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Previous School</Label>
                <Input value={form.previousSchool} onChange={e => setForm(f => ({ ...f, previousSchool: e.target.value }))} placeholder="e.g. Glen View Primary" />
              </div>
            </motion.div>
          )}

          {/* Step 1: Parent/Guardian */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold">Primary Parent/Guardian</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input value={form.parentFirstName} onChange={e => setForm(f => ({ ...f, parentFirstName: e.target.value }))} placeholder="e.g. Chenai" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input value={form.parentLastName} onChange={e => setForm(f => ({ ...f, parentLastName: e.target.value }))} placeholder="e.g. Moyo" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="+263 77 123 4567" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="parent@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Input value={form.parentOccupation} onChange={e => setForm(f => ({ ...f, parentOccupation: e.target.value }))} placeholder="e.g. Teacher" />
                  </div>
                </div>
                <div className="space-y-2 mt-4 max-w-xs">
                  <Label>Relationship</Label>
                  <Select value={form.parentRelationship} onValueChange={v => setForm(f => ({ ...f, parentRelationship: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Grandparent">Grandparent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold">Secondary Parent/Guardian (Optional)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={form.parent2FirstName} onChange={e => setForm(f => ({ ...f, parent2FirstName: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={form.parent2LastName} onChange={e => setForm(f => ({ ...f, parent2LastName: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.parent2Phone} onChange={e => setForm(f => ({ ...f, parent2Phone: e.target.value }))} placeholder="+263 77 123 4567" />
                  </div>
                </div>
                <div className="space-y-2 mt-4 max-w-xs">
                  <Label>Relationship</Label>
                  <Select value={form.parent2Relationship} onValueChange={v => setForm(f => ({ ...f, parent2Relationship: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Grandparent">Grandparent</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Medical */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Medical Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={v => setForm(f => ({ ...f, bloodGroup: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <Input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin, Peanuts" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chronic Conditions</Label>
                  <Input value={form.chronicConditions} onChange={e => setForm(f => ({ ...f, chronicConditions: e.target.value }))} placeholder="e.g. Asthma, Diabetes" />
                </div>
                <div className="space-y-2">
                  <Label>Medical Notes</Label>
                  <Textarea value={form.medicalNotes} onChange={e => setForm(f => ({ ...f, medicalNotes: e.target.value }))} placeholder="Any additional medical information..." rows={2} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Doctor&apos;s Name</Label>
                  <Input value={form.doctorName} onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))} placeholder="e.g. Dr. Nkomo" />
                </div>
                <div className="space-y-2">
                  <Label>Doctor&apos;s Phone</Label>
                  <Input value={form.doctorPhone} onChange={e => setForm(f => ({ ...f, doctorPhone: e.target.value }))} placeholder="+263 4 123 456" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Review Information</h3>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Student Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                    <div><span className="text-[11px] text-muted-foreground">Name:</span> <span className="text-sm font-medium">{form.firstName} {form.middleName && form.middleName + ' '}{form.lastName}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Gender:</span> <span className="text-sm font-medium">{form.gender || '—'}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">DOB:</span> <span className="text-sm font-medium">{form.dateOfBirth ? new Date(form.dateOfBirth).toLocaleDateString() : '—'}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Birth Cert:</span> <span className="text-sm font-medium">{form.birthCertNumber || '—'}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Boarding:</span> <span className="text-sm font-medium">{form.boardingStatus === 'BOARDER' ? 'Boarder' : form.boardingStatus === 'DAY_SCHOLAR' ? 'Day Scholar' : '—'}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Previous School:</span> <span className="text-sm font-medium">{form.previousSchool || '—'}</span></div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Primary Parent/Guardian</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                    <div><span className="text-[11px] text-muted-foreground">Name:</span> <span className="text-sm font-medium">{form.parentFirstName || '—'} {form.parentLastName || ''}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Phone:</span> <span className="text-sm font-medium">{form.parentPhone || '—'}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Relationship:</span> <span className="text-sm font-medium">{form.parentRelationship || '—'}</span></div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Medical</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                    <div><span className="text-[11px] text-muted-foreground">Blood Group:</span> <span className="text-sm font-medium">{form.bloodGroup || '—'}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Allergies:</span> <span className="text-sm font-medium">{form.allergies || 'None'}</span></div>
                    <div><span className="text-[11px] text-muted-foreground">Chronic:</span> <span className="text-sm font-medium">{form.chronicConditions || 'None'}</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t mt-6">
            <div>
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => { resetForm(); onBack() }}>Cancel</Button>
              {step < steps.length - 1 ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Creating...' : 'Create Student'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Student Settings View ────────────────────────────────────────────────────
function StudentSettingsView({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<StudentSettings>(defaultStudentSettings)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    toast.success('Student settings saved successfully')
  }

  const updateSetting = <K extends keyof StudentSettings>(key: K, value: StudentSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 text-muted-foreground hover:text-foreground min-h-[44px]" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Student List</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Display Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Columns3 className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Display Settings</CardTitle>
            </div>
            <CardDescription>Configure how the student records are displayed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select value={settings.defaultView} onValueChange={v => updateSetting('defaultView', v as 'table' | 'cards')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table View</SelectItem>
                  <SelectItem value="cards">Cards View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Visible Columns</Label>
              {[
                { key: 'showStudentNumber' as const, label: 'Student Number' },
                { key: 'showGender' as const, label: 'Gender' },
                { key: 'showGrade' as const, label: 'Grade' },
                { key: 'showBoarding' as const, label: 'Boarding Status' },
                { key: 'showStatus' as const, label: 'Enrollment Status' },
                { key: 'showBEAM' as const, label: 'BEAM Status' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Switch checked={settings[item.key]} onCheckedChange={v => updateSetting(item.key, v)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Number Format Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Student Number Format</CardTitle>
            </div>
            <CardDescription>Configure how student numbers are generated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Number Format</Label>
              <Input
                value={settings.studentNumberFormat}
                onChange={e => updateSetting('studentNumberFormat', e.target.value)}
                placeholder="SCH-YYYY-NNNN"
              />
              <p className="text-[11px] text-muted-foreground">Use YYYY for year, NNNN for auto-increment number</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Generate Student Numbers</p>
                <p className="text-xs text-muted-foreground">Automatically assign numbers on creation</p>
              </div>
              <Switch checked={settings.autoGenerateStudentNumber} onCheckedChange={v => updateSetting('autoGenerateStudentNumber', v)} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Default Enrollment Status</Label>
              <Select value={settings.defaultEnrollmentStatus} onValueChange={v => updateSetting('defaultEnrollmentStatus', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Assign to Class</p>
                <p className="text-xs text-muted-foreground">Automatically assign to a class based on grade</p>
              </div>
              <Switch checked={settings.autoAssignToClass} onCheckedChange={v => updateSetting('autoAssignToClass', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Required Fields */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ToggleLeft className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Required Fields</CardTitle>
            </div>
            <CardDescription>Choose which fields are required when adding students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'requiredFirstName' as const, label: 'First Name' },
              { key: 'requiredLastName' as const, label: 'Last Name' },
              { key: 'requiredGender' as const, label: 'Gender' },
              { key: 'requiredDateOfBirth' as const, label: 'Date of Birth' },
              { key: 'requiredBirthCert' as const, label: 'Birth Certificate #' },
              { key: 'requiredBoardingStatus' as const, label: 'Boarding Status' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Switch checked={settings[item.key]} onCheckedChange={v => updateSetting(item.key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Photo, Age & BEAM Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Photo, Age & BEAM</CardTitle>
            </div>
            <CardDescription>Student photo, age calculation, and BEAM defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Display Student Photos</p>
                <p className="text-xs text-muted-foreground">Show student photos in the list view</p>
              </div>
              <Switch checked={settings.photoDisplay} onCheckedChange={v => updateSetting('photoDisplay', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Resize Photos</p>
                <p className="text-xs text-muted-foreground">Automatically resize uploaded photos</p>
              </div>
              <Switch checked={settings.photoAutoResize} onCheckedChange={v => updateSetting('photoAutoResize', v)} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Age Calculation Method</Label>
              <Select value={settings.ageCalculationMethod} onValueChange={v => updateSetting('ageCalculationMethod', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="year_start">Age at Start of Year</SelectItem>
                  <SelectItem value="current_date">Current Age</SelectItem>
                  <SelectItem value="year_end">Age at End of Year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Determines how student age is calculated for reports</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Default BEAM Status</Label>
              <Select value={settings.beamDefaultStatus} onValueChange={v => updateSetting('beamDefaultStatus', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_APPLIED">Not Applied</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email on New Student</p>
                <p className="text-xs text-muted-foreground">Notify when a student is enrolled</p>
              </div>
              <Switch checked={settings.emailOnNewStudent} onCheckedChange={v => updateSetting('emailOnNewStudent', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email on Transfer</p>
                <p className="text-xs text-muted-foreground">Notify when a student is transferred</p>
              </div>
              <Switch checked={settings.emailOnTransfer} onCheckedChange={v => updateSetting('emailOnTransfer', v)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

// ─── Student Detail View ──────────────────────────────────────────────────────
function StudentDetailView({
  studentId,
  onBack,
  onEdit,
}: {
  studentId: string
  onBack: () => void
  onEdit: () => void
}) {
  const [data, setData] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/students/${studentId}`)
        if (!res.ok) throw new Error('Failed to fetch student details')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-3" />
        <p className="text-sm">{error || 'Student not found'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onBack}>Go Back</Button>
      </div>
    )
  }

  const { student, attendanceSummary } = data
  const enrollment = student.enrollments[0]
  const primaryParent = student.parentLinks.find(p => p.isPrimary)?.parent

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Back Button + Actions */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 text-muted-foreground hover:text-foreground min-h-[44px]" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Student List</span>
          <span className="sm:hidden">Back</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Transfer</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
            onClick={() => window.open(`/api/reports/report-card-pdf?studentId=${studentId}`, '_blank')}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Report Card</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-4 sm:px-6 py-4 sm:py-5 relative">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5" />
          <div className="flex items-center gap-4 relative z-10">
            <Avatar className="h-16 w-16 border-2 border-white/30 shadow-lg">
              <AvatarFallback className={cn(
                'text-lg font-bold backdrop-blur-sm',
                student.gender === 'MALE'
                  ? 'bg-sky-200/40 text-sky-100'
                  : 'bg-pink-200/40 text-pink-100'
              )}>
                {student.firstName[0]}{student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-sm text-emerald-100 font-mono">{student.studentNumber}</span>
                {enrollment && (
                  <Badge variant="outline" className="text-[11px] bg-white/10 text-white border-white/20">
                    {enrollment.class.grade.name} - {enrollment.class.name}
                  </Badge>
                )}
                <StatusBadge status={student.enrollmentStatus} />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <GenderBadge gender={student.gender} />
                <BoardingBadge status={student.boardingStatus} />
                {student.beamStatus && (
                  <Badge variant="outline" className="text-[11px] bg-white/10 text-white border-white/20">
                    BEAM: {student.beamStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b px-4">
              <TabsList className="bg-transparent h-12 p-0 gap-0">
                {[
                  { value: 'overview', label: 'Overview', icon: User },
                  { value: 'fees', label: 'Fees', icon: DollarSign },
                  { value: 'attendance', label: 'Attendance', icon: Calendar },
                  { value: 'discipline', label: 'Discipline', icon: Scale },
                  { value: 'health', label: 'Health', icon: Heart },
                  { value: 'documents', label: 'Documents', icon: FileText },
                  { value: 'timeline', label: 'Timeline', icon: Clock },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-12 px-2 sm:px-3 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none"
                  >
                    <tab.icon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline text-xs">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                    Student Details
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Full Name', value: `${student.firstName}${student.middleName ? ' ' + student.middleName : ''} ${student.lastName}` },
                      { label: 'Gender', value: student.gender === 'MALE' ? 'Male' : 'Female' },
                      { label: 'Date of Birth', value: new Date(student.dateOfBirth).toLocaleDateString() },
                      { label: 'Birth Certificate', value: student.birthCertNumber || '—' },
                      { label: 'Nationality', value: student.nationality },
                      { label: 'Religion', value: student.religion || '—' },
                      { label: 'Home Language', value: student.homeLanguage || '—' },
                      { label: 'Previous School', value: student.previousSchool || '—' },
                      { label: 'Admission Date', value: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '—' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-dashed last:border-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parent Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Parent/Guardian
                  </h3>
                  {student.parentLinks.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No parent/guardian linked</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {student.parentLinks.map(pl => (
                        <Card key={pl.id} className="border shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{pl.parent.firstName} {pl.parent.lastName}</span>
                              <Badge variant="outline" className="text-[11px]">{pl.relationship}{pl.isPrimary ? ' (Primary)' : ''}</Badge>
                            </div>
                            <div className="space-y-0.5 text-xs text-muted-foreground">
                              <p><Phone className="h-3 w-3 inline mr-1" />{pl.parent.phone}</p>
                              {pl.parent.email && <p><Mail className="h-3 w-3 inline mr-1" />{pl.parent.email}</p>}
                              {pl.parent.occupation && <p><Briefcase className="h-3 w-3 inline mr-1" />{pl.parent.occupation}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Attendance Summary */}
                  <h3 className="text-sm font-semibold flex items-center gap-2 mt-4">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Attendance Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Rate</p>
                      <p className="text-lg font-bold text-emerald-600">{attendanceSummary.attendanceRate}</p>
                    </div>
                    <div className="rounded-xl border p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Present</p>
                      <p className="text-lg font-bold">{attendanceSummary.present}</p>
                    </div>
                    <div className="rounded-xl border p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Absent</p>
                      <p className="text-lg font-bold text-red-600">{attendanceSummary.absent}</p>
                    </div>
                    <div className="rounded-xl border p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Late</p>
                      <p className="text-lg font-bold text-amber-600">{attendanceSummary.late}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Fees Tab */}
            <TabsContent value="fees" className="p-6">
              {student.feeInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No fee invoices found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {student.feeInvoices.map(inv => (
                    <Card key={inv.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                            {inv.term && <span className="text-xs text-muted-foreground ml-2">{inv.term.name}</span>}
                          </div>
                          <InvoiceStatusBadge status={inv.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div><span className="text-muted-foreground">Total:</span> <span className="font-medium">${inv.totalAmount.toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">Paid:</span> <span className="font-medium text-emerald-600">${inv.amountPaid.toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">Balance:</span> <span className={cn('font-medium', inv.balance > 0 ? 'text-red-600' : 'text-emerald-600')}>${inv.balance.toFixed(2)}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="p-6">
              {student.attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No attendance records found</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.attendanceRecords.slice(0, 20).map(ar => (
                        <TableRow key={ar.id}>
                          <TableCell className="text-xs">{new Date(ar.date).toLocaleDateString()}</TableCell>
                          <TableCell><AttendanceStatusBadge status={ar.status} /></TableCell>
                          <TableCell className="text-xs">{ar.attendanceType}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{ar.remarks || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Discipline Tab */}
            <TabsContent value="discipline" className="p-6">
              {student.disciplineRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scale className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No discipline records</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {student.disciplineRecords.map(d => (
                    <Card key={d.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{d.incidentType}</span>
                          <Badge variant="outline" className="text-[11px]">{d.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{d.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span>{new Date(d.date).toLocaleDateString()}</span>
                          {d.meritPoints > 0 && <span className="text-emerald-600">+{d.meritPoints} merits</span>}
                          {d.demeritPoints > 0 && <span className="text-red-600">-{d.demeritPoints} demerits</span>}
                          {d.action && <span>Action: {d.action}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Health Tab */}
            <TabsContent value="health" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    Medical Information
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Blood Group', value: student.bloodGroup || '—' },
                      { label: 'Allergies', value: student.allergies || 'None' },
                      { label: 'Chronic Conditions', value: student.chronicConditions || 'None' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-dashed last:border-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Health Records</h3>
                  {student.healthRecords.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Heart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No health records</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {student.healthRecords.map(h => (
                        <Card key={h.id} className="border shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{h.visitType}</span>
                              <span className="text-[11px] text-muted-foreground">{new Date(h.visitDate).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{h.description}</p>
                            {h.treatment && <p className="text-xs text-emerald-700 mt-1">Treatment: {h.treatment}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="p-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Documents</p>
                <p className="text-xs mt-1">Upload and manage student documents here.</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="p-6">
              <div className="space-y-4">
                {student.admissionDate ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="w-px h-full bg-border" />
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">Admitted</p>
                        <p className="text-xs text-muted-foreground">{new Date(student.admissionDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {student.disciplineRecords.map(d => (
                      <div key={d.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <Scale className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="w-px h-full bg-border" />
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">{d.incidentType}</p>
                          <p className="text-xs text-muted-foreground">{d.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{new Date(d.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    {student.healthRecords.map(h => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Heart className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="w-px h-full bg-border" />
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">{h.visitType}</p>
                          <p className="text-xs text-muted-foreground">{h.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{new Date(h.visitDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">Activity Timeline</p>
                    <p className="text-xs mt-1">Student activity will appear here.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Students Module ─────────────────────────────────────────────────────
export default function StudentsModule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id)
    setViewMode('detail')
  }

  const handleAddStudent = () => {
    setViewMode('add')
  }

  const handleOpenSettings = () => {
    setViewMode('settings')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedStudentId(null)
  }

  const handleEditStudent = () => {
    setViewMode('edit')
  }

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'list' && (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <StudentListView
            onSelectStudent={handleSelectStudent}
            onAddStudent={handleAddStudent}
            onOpenSettings={handleOpenSettings}
          />
        </motion.div>
      )}
      {viewMode === 'add' && (
        <AddStudentInlineForm
          key="add"
          onBack={handleBackToList}
          onSuccess={handleBackToList}
        />
      )}
      {viewMode === 'detail' && selectedStudentId && (
        <StudentDetailView
          key="detail"
          studentId={selectedStudentId}
          onBack={handleBackToList}
          onEdit={handleEditStudent}
        />
      )}
      {viewMode === 'edit' && selectedStudentId && (
        <AddStudentInlineForm
          key="edit"
          onBack={() => setViewMode('detail')}
          onSuccess={() => setViewMode('detail')}
        />
      )}
      {viewMode === 'settings' && (
        <StudentSettingsView
          key="settings"
          onBack={handleBackToList}
        />
      )}
    </AnimatePresence>
  )
}
