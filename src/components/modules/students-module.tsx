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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { exportToCSV, printReport, buildHTMLTable } from '@/lib/export-utils'
import { toast } from 'sonner'

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

// ─── Status Badge Helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    TRANSFERRED: { label: 'Transferred', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    GRADUATED: { label: 'Graduated', className: 'bg-teal-50 text-teal-700 border-teal-200' },
    DROPPED_OUT: { label: 'Dropped Out', className: 'bg-red-50 text-red-700 border-red-200' },
    SUSPENDED: { label: 'Suspended', className: 'bg-orange-50 text-orange-700 border-orange-200' },
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
        ? 'bg-teal-50 text-teal-700 border-teal-200'
        : 'bg-sky-50 text-sky-700 border-sky-200'
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
        ? 'bg-sky-50 text-sky-700 border-sky-200'
        : 'bg-pink-50 text-pink-700 border-pink-200'
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

// ─── Stat Card Component ──────────────────────────────────────────────────────
function ModuleStatCard({
  icon: Icon,
  label,
  value,
  accentGradient,
  bgColor,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accentGradient: string
  bgColor: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', bgColor)}>
            <Icon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold tracking-tight">{value}</p>
          </div>
        </div>
      </CardContent>
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', accentGradient)} />
    </Card>
  )
}

// ─── Student List View ────────────────────────────────────────────────────────
function StudentListView({
  onSelectStudent,
}: {
  onSelectStudent: (id: string) => void
}) {
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
  const [addDialogOpen, setAddDialogOpen] = useState(false)
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
      {/* Stats Bar */}
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

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold">Student Records</CardTitle>
                <CardDescription>{total} student{total !== 1 ? 's' : ''} found</CardDescription>
              </div>
              <div className="flex items-center gap-2">
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
                        'Middle Name': s.middleName || '',
                        'Gender': s.gender === 'MALE' ? 'Male' : 'Female',
                        'Grade': s.enrollments[0]?.class?.grade?.name || '',
                        'Class': s.enrollments[0]?.class?.name || '',
                        'Boarding Status': s.boardingStatus === 'BOARDER' ? 'Boarder' : s.boardingStatus === 'DAY_SCHOLAR' ? 'Day Scholar' : '',
                        'Enrollment Status': s.enrollmentStatus,
                        'BEAM Status': s.beamStatus || '',
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
                      printReport('Student List (PDF View)', buildHTMLTable(headers, rows))
                    }}>
                      <FileText className="mr-2 h-4 w-4 text-amber-600" />
                      Export PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AddStudentDialog
                  open={addDialogOpen}
                  onOpenChange={setAddDialogOpen}
                  onSuccess={() => { fetchStudents(); fetchStats() }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                {/* Status Filter */}
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
                {/* Gender Filter */}
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
                {/* Boarding Filter */}
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
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('studentNumber')}>
                      <span className="flex items-center">Student # <SortIcon field="studentNumber" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('name')}>
                      <span className="flex items-center">Name <SortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('gender')}>
                      <span className="flex items-center">Gender <SortIcon field="gender" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('grade')}>
                      <span className="flex items-center">Grade <SortIcon field="grade" /></span>
                    </TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('boardingStatus')}>
                      <span className="flex items-center">Boarding <SortIcon field="boardingStatus" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('enrollmentStatus')}>
                      <span className="flex items-center">Status <SortIcon field="enrollmentStatus" /></span>
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
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <GraduationCap className="h-8 w-8 opacity-40" />
                          <p className="text-sm">No students found</p>
                          <p className="text-xs">Try adjusting your search or filters</p>
                        </div>
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
                          className="cursor-pointer hover:bg-emerald-50/50 transition-colors"
                          onClick={() => onSelectStudent(student.id)}
                        >
                          <TableCell className="font-mono text-xs">{student.studentNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className={cn(
                                  'text-[10px] font-semibold',
                                  student.gender === 'MALE'
                                    ? 'bg-sky-100 text-sky-700'
                                    : 'bg-pink-100 text-pink-700'
                                )}>
                                  {student.firstName[0]}{student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                                {student.middleName && <p className="text-[10px] text-muted-foreground">{student.middleName}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><GenderBadge gender={student.gender} /></TableCell>
                          <TableCell className="text-sm">{gradeName}</TableCell>
                          <TableCell className="text-sm">{className}</TableCell>
                          <TableCell><BoardingBadge status={student.boardingStatus} /></TableCell>
                          <TableCell><StatusBadge status={student.enrollmentStatus} /></TableCell>
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
      </motion.div>
    </div>
  )
}

// ─── Add Student Dialog ───────────────────────────────────────────────────────
function AddStudentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    birthCertNumber: '',
    boardingStatus: '',
    previousSchool: '',
  })

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', middleName: '', dateOfBirth: '', gender: '', birthCertNumber: '', boardingStatus: '', previousSchool: '' })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.gender || !form.dateOfBirth) {
      setError('First name, last name, gender, and date of birth are required.')
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
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create student')
      }
      resetForm()
      onOpenChange(false)
      onSuccess()
      toast.success('Student added successfully', {
        description: `${form.firstName} ${form.lastName} has been enrolled`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast.error('Failed to add student', {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Add New Student
          </DialogTitle>
          <DialogDescription>Enter student details to register a new student.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Tendai" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Moyo" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input id="middleName" value={form.middleName} onChange={e => setForm(f => ({ ...f, middleName: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthCert">Birth Certificate #</Label>
              <Input id="birthCert" value={form.birthCertNumber} onChange={e => setForm(f => ({ ...f, birthCertNumber: e.target.value }))} placeholder="e.g. 08-123456A12" />
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
          <div className="space-y-2">
            <Label htmlFor="prevSchool">Previous School</Label>
            <Input id="prevSchool" value={form.previousSchool} onChange={e => setForm(f => ({ ...f, previousSchool: e.target.value }))} placeholder="e.g. Glen View Primary" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Student Detail View ──────────────────────────────────────────────────────
function StudentDetailView({
  studentId,
  onBack,
}: {
  studentId: string
  onBack: () => void
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
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
        <ChevronLeft className="h-4 w-4" />
        Back to Student List
      </Button>

      {/* Profile Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 relative">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5" />
          <div className="flex items-center gap-4 relative z-10">
            <Avatar className="h-16 w-16 border-2 border-white/30 shadow-lg">
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">
                {student.firstName[0]}{student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h2 className="text-xl font-bold">{student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-sm text-emerald-100 font-mono">{student.studentNumber}</span>
                <StatusBadge status={student.enrollmentStatus} />
                <BoardingBadge status={student.boardingStatus} />
              </div>
              {enrollment && (
                <p className="text-sm text-emerald-100 mt-1">
                  {enrollment.class.grade.name} — {enrollment.class.name}
                </p>
              )}
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
                  { value: 'academics', label: 'Academics', icon: BookOpen },
                  { value: 'finance', label: 'Finance', icon: DollarSign },
                  { value: 'attendance', label: 'Attendance', icon: ClipboardCheck },
                  { value: 'discipline', label: 'Discipline', icon: Scale },
                  { value: 'health', label: 'Health', icon: Heart },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none"
                  >
                    <tab.icon className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Personal Details
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Date of Birth', value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                      { label: 'Gender', value: student.gender === 'MALE' ? 'Male' : 'Female' },
                      { label: 'Birth Certificate', value: student.birthCertNumber || '—' },
                      { label: 'Nationality', value: student.nationality || 'Zimbabwean' },
                      { label: 'Religion', value: student.religion || '—' },
                      { label: 'Home Language', value: student.homeLanguage || '—' },
                      { label: 'Blood Group', value: student.bloodGroup || '—' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-dashed last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parent/Guardian Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" /> Parent / Guardian
                  </h3>
                  {student.parentLinks.length > 0 ? student.parentLinks.map(link => (
                    <div key={link.id} className="p-4 rounded-xl border bg-muted/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                            {link.parent.firstName[0]}{link.parent.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{link.parent.firstName} {link.parent.lastName}</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {link.relationship}{link.isPrimary ? ' (Primary)' : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {link.parent.phone && (
                          <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{link.parent.phone}</span>
                        )}
                        {link.parent.email && (
                          <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{link.parent.email}</span>
                        )}
                        {link.parent.occupation && (
                          <span className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" />{link.parent.occupation}</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No parent/guardian linked</p>
                  )}
                </div>
              </div>

              {/* Enrollment Info */}
              <Separator className="my-6" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4" /> Enrollment Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Admission Date</p>
                  <p className="text-sm font-medium mt-1">
                    {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Previous School</p>
                  <p className="text-sm font-medium mt-1">{student.previousSchool || '—'}</p>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20">
                  <p className="text-xs text-muted-foreground">BEAM Status</p>
                  <p className="text-sm font-medium mt-1">{student.beamApplication?.status || student.beamStatus || 'Not Applied'}</p>
                </div>
              </div>
            </TabsContent>

            {/* Academics Tab */}
            <TabsContent value="academics" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Enrollment History</h3>
              {student.enrollments.length > 0 ? (
                <div className="space-y-3">
                  {student.enrollments.map(enr => (
                    <div key={enr.id} className="flex items-center justify-between p-4 rounded-xl border">
                      <div>
                        <p className="text-sm font-medium">{enr.class?.grade?.name || '—'} — {enr.class?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Enrolled: {new Date(enr.enrollmentDate).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-[11px]',
                        enr.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                      )}>
                        {enr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No enrollment records</p>
              )}
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Fee Invoices</h3>
              {student.feeInvoices.length > 0 ? (
                <div className="space-y-3">
                  {student.feeInvoices.map(inv => (
                    <div key={inv.id} className="p-4 rounded-xl border hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium font-mono">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{inv.term?.name || '—'}</p>
                        </div>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                          <p className="text-sm font-semibold">${inv.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                          <p className="text-sm font-semibold text-emerald-600">${inv.amountPaid.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
                          <p className="text-sm font-semibold text-red-600">${inv.balance.toFixed(2)}</p>
                        </div>
                      </div>
                      {inv.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          {inv.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-muted-foreground py-0.5">
                              <span>{item.description}</span>
                              <span>${item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No invoices found</p>
              )}
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="p-6">
              {/* Attendance Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-xl border bg-muted/20 text-center">
                  <p className="text-2xl font-bold">{attendanceSummary.attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                </div>
                <div className="p-4 rounded-xl border bg-emerald-50 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{attendanceSummary.present}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="p-4 rounded-xl border bg-red-50 text-center">
                  <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="p-4 rounded-xl border bg-amber-50 text-center">
                  <p className="text-2xl font-bold text-amber-600">{attendanceSummary.late}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Recent Records</h3>
              {student.attendanceRecords.length > 0 ? (
                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {student.attendanceRecords.map(rec => (
                      <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{new Date(rec.date).toLocaleDateString('en-ZW', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <AttendanceStatusBadge status={rec.status} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No attendance records</p>
              )}
            </TabsContent>

            {/* Discipline Tab */}
            <TabsContent value="discipline" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Discipline Records</h3>
              {student.disciplineRecords.length > 0 ? (
                <div className="space-y-3">
                  {student.disciplineRecords.map(rec => (
                    <div key={rec.id} className="p-4 rounded-xl border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[11px] bg-orange-50 text-orange-700 border-orange-200">
                          {rec.incidentType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(rec.date).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm">{rec.description}</p>
                      {rec.action && (
                        <p className="text-xs text-muted-foreground mt-2"><strong>Action:</strong> {rec.action}</p>
                      )}
                      <div className="flex gap-4 mt-2">
                        {rec.meritPoints > 0 && <span className="text-xs text-emerald-600">+{rec.meritPoints} merits</span>}
                        {rec.demeritPoints > 0 && <span className="text-xs text-red-600">-{rec.demeritPoints} demerits</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No discipline records</p>
              )}
            </TabsContent>

            {/* Health Tab */}
            <TabsContent value="health" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Health Records</h3>
              {(student.allergies || student.chronicConditions) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {student.allergies && (
                    <div className="p-4 rounded-xl border bg-red-50">
                      <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                      <p className="text-sm font-medium text-red-700">{student.allergies}</p>
                    </div>
                  )}
                  {student.chronicConditions && (
                    <div className="p-4 rounded-xl border bg-amber-50">
                      <p className="text-xs text-muted-foreground mb-1">Chronic Conditions</p>
                      <p className="text-sm font-medium text-amber-700">{student.chronicConditions}</p>
                    </div>
                  )}
                </div>
              )}
              {student.healthRecords.length > 0 ? (
                <div className="space-y-3">
                  {student.healthRecords.map(rec => (
                    <div key={rec.id} className="p-4 rounded-xl border">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[11px] bg-teal-50 text-teal-700 border-teal-200">
                          {rec.visitType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(rec.visitDate).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{rec.description}</p>
                      {rec.treatment && (
                        <p className="text-xs text-muted-foreground mt-1"><strong>Treatment:</strong> {rec.treatment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No health records</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Students Module ─────────────────────────────────────────────────────
export default function StudentsModule() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  return (
    <AnimatePresence mode="wait">
      {selectedStudentId ? (
        <StudentDetailView
          key="detail"
          studentId={selectedStudentId}
          onBack={() => setSelectedStudentId(null)}
        />
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <StudentListView onSelectStudent={setSelectedStudentId} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
