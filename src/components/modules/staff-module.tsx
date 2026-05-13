'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  DollarSign,
  Calendar,
  Clock,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  BookOpen,
  Building,
  BadgeCheck,
  FileText,
  Plane,
  Settings,
  Save,
  Download,
  Printer,
  FileSpreadsheet,
  Pencil,
  Ban,
  FileBarChart,
  Eye,
  EyeOff,
  Bell,
  Columns3,
  Hash,
  ToggleLeft,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── View Mode Type ──────────────────────────────────────────────────────────
type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'

// ─── Types ────────────────────────────────────────────────────────────────────
interface StaffMember {
  id: string
  staffNumber: string
  title: string | null
  firstName: string
  lastName: string
  middleName: string | null
  gender: string | null
  phone: string | null
  email: string | null
  position: string
  department: string | null
  staffType: string
  payType: string
  contractType: string
  basicSalary: number
  isActive: boolean
  dateOfBirth: string | null
  employmentDate: string | null
  qualifications: string | null
  subjectSpecialisation: string | null
  photo: string | null
  createdAt: string
}

interface StaffDetail extends StaffMember {
  address: string | null
  nextOfKin: string | null
  nextOfKinPhone: string | null
  nationalId: string | null
  bankName: string | null
  bankAccountNumber: string | null
  payrollStatus: string
  housingAllowance: number
  transportAllowance: number
  responsibilityAllowance: number
  payslips: {
    id: string
    periodMonth: number
    periodYear: number
    basicSalary: number
    grossPay: number
    netPay: number
    status: string
    currency: string
    createdAt: string
  }[]
  leaveRecords: {
    id: string
    leaveType: string
    startDate: string
    endDate: string
    days: number
    reason: string | null
    status: string
    createdAt: string
  }[]
  appraisalRecords: {
    id: string
    period: string
    rating: number
    comments: string | null
    strengths: string | null
    areasForImprovement: string | null
    status: string
    createdAt: string
  }[]
  disciplinaryRecords: {
    id: string
    incidentType: string
    description: string
    date: string
    action: string | null
    status: string
  }[]
}

interface StaffResponse {
  data: StaffMember[]
  total: number
  page: number
  totalPages: number
}

// ─── Staff Settings Type ─────────────────────────────────────────────────────
interface StaffSettings {
  defaultView: 'table' | 'cards'
  staffNumberFormat: string
  autoGenerateStaffNumber: boolean
  defaultContractType: string
  defaultPayType: string
  requiredFirstName: boolean
  requiredLastName: boolean
  requiredPhone: boolean
  requiredEmail: boolean
  requiredDepartment: boolean
  showStaffNumber: boolean
  showPosition: boolean
  showDepartment: boolean
  showStaffType: boolean
  showPayType: boolean
  showStatus: boolean
  emailOnNewStaff: boolean
  emailOnContractExpiry: boolean
  emailOnLeaveRequest: boolean
  exportIncludeSalary: boolean
  exportFormat: string
}

const defaultStaffSettings: StaffSettings = {
  defaultView: 'table',
  staffNumberFormat: 'SCH-STAFF-YYYY-NNN',
  autoGenerateStaffNumber: true,
  defaultContractType: 'PERMANENT',
  defaultPayType: 'SCHOOL_PAID',
  requiredFirstName: true,
  requiredLastName: true,
  requiredPhone: false,
  requiredEmail: false,
  requiredDepartment: false,
  showStaffNumber: true,
  showPosition: true,
  showDepartment: true,
  showStaffType: true,
  showPayType: true,
  showStatus: true,
  emailOnNewStaff: true,
  emailOnContractExpiry: false,
  emailOnLeaveRequest: true,
  exportIncludeSalary: false,
  exportFormat: 'csv',
}

// ─── Status Badge Helpers ─────────────────────────────────────────────────────
function StaffTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    TEACHING: { label: 'Teaching', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    NON_TEACHING: { label: 'Non-Teaching', className: 'bg-teal-50 text-teal-700 border-teal-200' },
    ADMIN: { label: 'Admin', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    SUPPORT: { label: 'Support', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  }
  const c = config[type] || { label: type, className: 'bg-gray-50 text-gray-700 border-gray-200' }
  return (
    <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-medium', c.className)}>
      {c.label}
    </Badge>
  )
}

function PayTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    SCHOOL_PAID: { label: 'School Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PSC: { label: 'PSC', className: 'bg-teal-50 text-teal-700 border-teal-200' },
    PART_TIME: { label: 'Part-Time', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    VOLUNTEER: { label: 'Volunteer', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  }
  const c = config[type] || { label: type, className: 'bg-gray-50 text-gray-700 border-gray-200' }
  return (
    <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-medium', c.className)}>
      {c.label}
    </Badge>
  )
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant="outline" className={cn(
      'text-[11px] px-2 py-0.5 font-medium',
      isActive
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200'
    )}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  )
}

function LeaveStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  }
  const c = config[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' }
  return (
    <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-medium', c.className)}>
      {c.label}
    </Badge>
  )
}

function PayslipStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DRAFT: { label: 'Draft', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    PROCESSING: { label: 'Processing', className: 'bg-amber-50 text-amber-700 border-amber-200' },
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
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accentGradient: string
  bgColor: string
  iconColor?: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn('flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl', bgColor)}>
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor || 'text-teal-600')} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-lg sm:text-xl font-bold tracking-tight">{value}</p>
          </div>
        </div>
      </CardContent>
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', accentGradient)} />
    </Card>
  )
}

// ─── Staff List View ──────────────────────────────────────────────────────────
function StaffListView({
  onSelectStaff,
  onAddStaff,
  onOpenSettings,
}: {
  onSelectStaff: (id: string) => void
  onAddStaff: () => void
  onOpenSettings: () => void
}) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [staffTypeFilter, setStaffTypeFilter] = useState('ALL')
  const [positionFilter, setPositionFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortField, setSortField] = useState<string>('staffNumber')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [stats, setStats] = useState({
    total: 0, teaching: 0, nonTeaching: 0, onLeave: 0,
  })

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (staffTypeFilter !== 'ALL') params.set('staffType', staffTypeFilter)
      if (positionFilter && positionFilter !== 'ALL') params.set('position', positionFilter)

      const res = await fetch(`/api/staff?${params.toString()}`)
      if (res.ok) {
        const json: StaffResponse = await res.json()
        setStaff(json.data)
        setTotalPages(json.totalPages)
        setTotal(json.total)
      }
    } catch (err) {
      console.error('Error fetching staff:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, staffTypeFilter, positionFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/staff?limit=1000')
      if (res.ok) {
        const json: StaffResponse = await res.json()
        const allStaff = json.data
        setStats({
          total: json.total,
          teaching: allStaff.filter(s => s.staffType === 'TEACHING').length,
          nonTeaching: allStaff.filter(s => s.staffType !== 'TEACHING').length,
          onLeave: 0,
        })
      }
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])
  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => { setPage(1) }, [search, staffTypeFilter, positionFilter])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedStaff = [...staff].sort((a, b) => {
    let aVal: string | number = ''
    let bVal: string | number = ''
    switch (sortField) {
      case 'staffNumber': aVal = a.staffNumber; bVal = b.staffNumber; break
      case 'name': aVal = `${a.lastName} ${a.firstName}`; bVal = `${b.lastName} ${b.firstName}`; break
      case 'position': aVal = a.position; bVal = b.position; break
      case 'department': aVal = a.department || ''; bVal = b.department || ''; break
      case 'staffType': aVal = a.staffType; bVal = b.staffType; break
      case 'payType': aVal = a.payType; bVal = b.payType; break
      case 'status': aVal = a.isActive ? '1' : '0'; bVal = b.isActive ? '1' : '0'; break
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 text-teal-600" />
      : <ArrowDown className="ml-1 h-3 w-3 text-teal-600" />
  }

  return (
    <div className="space-y-5">
      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <ModuleStatCard icon={Users} label="Total Staff" value={stats.total} accentGradient="from-teal-400 to-cyan-500" bgColor="bg-teal-50" iconColor="text-teal-600" />
        <ModuleStatCard icon={GraduationCap} label="Teaching" value={stats.teaching} accentGradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50" iconColor="text-emerald-600" />
        <ModuleStatCard icon={Briefcase} label="Non-Teaching" value={stats.nonTeaching} accentGradient="from-amber-400 to-orange-500" bgColor="bg-amber-50" iconColor="text-amber-600" />
        <ModuleStatCard icon={Plane} label="On Leave" value={stats.onLeave} accentGradient="from-cyan-400 to-sky-500" bgColor="bg-cyan-50" iconColor="text-cyan-600" />
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
                <CardTitle className="text-lg font-semibold">Staff Directory</CardTitle>
                <CardDescription>{total} staff member{total !== 1 ? 's' : ''} found</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={onOpenSettings}>
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={onAddStaff}>
                  <UserPlus className="h-4 w-4" />
                  Add Staff
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or staff number..."
                  className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-teal-500/30"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  {(['ALL', 'TEACHING', 'NON_TEACHING', 'ADMIN', 'SUPPORT'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={staffTypeFilter === s ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-7 text-xs px-2.5',
                        staffTypeFilter === s
                          ? 'bg-teal-600 hover:bg-teal-700 text-white'
                          : 'hover:bg-muted/60'
                      )}
                      onClick={() => setStaffTypeFilter(s)}
                    >
                      {s === 'ALL' ? 'All' : s === 'NON_TEACHING' ? 'Non-Teaching' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="h-7 w-[150px] text-xs">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Positions</SelectItem>
                    <SelectItem value="Headmaster">Headmaster</SelectItem>
                    <SelectItem value="Deputy Head">Deputy Head</SelectItem>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="School Bursar">Bursar</SelectItem>
                    <SelectItem value="School Clerk">Clerk</SelectItem>
                    <SelectItem value="Librarian">Librarian</SelectItem>
                    <SelectItem value="Cleaner">Cleaner</SelectItem>
                    <SelectItem value="Security Guard">Security</SelectItem>
                    <SelectItem value="Groundsman">Groundsman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('staffNumber')}>
                      <span className="flex items-center text-xs">Staff # <SortIcon field="staffNumber" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('name')}>
                      <span className="flex items-center text-xs">Name <SortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10 hidden md:table-cell" onClick={() => handleSort('position')}>
                      <span className="flex items-center text-xs">Position <SortIcon field="position" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10 hidden lg:table-cell" onClick={() => handleSort('department')}>
                      <span className="flex items-center text-xs">Department <SortIcon field="department" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10 hidden sm:table-cell" onClick={() => handleSort('staffType')}>
                      <span className="flex items-center text-xs">Type <SortIcon field="staffType" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10 hidden lg:table-cell" onClick={() => handleSort('payType')}>
                      <span className="flex items-center text-xs">Pay Type <SortIcon field="payType" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('status')}>
                      <span className="flex items-center text-xs">Status <SortIcon field="status" /></span>
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
                  ) : sortedStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="h-8 w-8 opacity-40" />
                          <p className="text-sm">No staff members found</p>
                          <p className="text-xs">Try adjusting your search or filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedStaff.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-teal-50/50 transition-colors"
                        onClick={() => onSelectStaff(member.id)}
                      >
                        <TableCell className="font-mono text-xs py-2.5">{member.staffNumber}</TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px] font-semibold">
                                {member.firstName[0]}{member.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {member.title ? member.title + '. ' : ''}{member.firstName} {member.lastName}
                              </p>
                              {member.email && <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell py-2.5">{member.position}</TableCell>
                        <TableCell className="text-sm hidden lg:table-cell py-2.5">{member.department || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell py-2.5"><StaffTypeBadge type={member.staffType} /></TableCell>
                        <TableCell className="hidden lg:table-cell py-2.5"><PayTypeBadge type={member.payType} /></TableCell>
                        <TableCell className="py-2.5"><ActiveBadge isActive={member.isActive} /></TableCell>
                      </TableRow>
                    ))
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
                        pageNum === page && 'bg-teal-600 hover:bg-teal-700'
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

// ─── Add Staff Inline Form ───────────────────────────────────────────────────
function AddStaffInlineForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    firstName: '',
    lastName: '',
    middleName: '',
    position: '',
    department: '',
    staffType: 'TEACHING',
    payType: 'SCHOOL_PAID',
    phone: '',
    email: '',
    basicSalary: '',
    contractType: 'PERMANENT',
    gender: '',
    dateOfBirth: '',
    employmentDate: '',
    qualifications: '',
    subjectSpecialisation: '',
    nationalId: '',
    address: '',
    nextOfKin: '',
    nextOfKinPhone: '',
    bankName: '',
    bankAccountNumber: '',
  })

  const resetForm = () => {
    setForm({
      title: '', firstName: '', lastName: '', middleName: '', position: '', department: '',
      staffType: 'TEACHING', payType: 'SCHOOL_PAID', phone: '', email: '',
      basicSalary: '', contractType: 'PERMANENT', gender: '', dateOfBirth: '', employmentDate: '',
      qualifications: '', subjectSpecialisation: '', nationalId: '', address: '',
      nextOfKin: '', nextOfKinPhone: '', bankName: '', bankAccountNumber: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.position) {
      setError('First name, last name, and position are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || undefined,
          title: form.title || undefined,
          position: form.position,
          department: form.department || undefined,
          staffType: form.staffType,
          payType: form.payType,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0,
          contractType: form.contractType,
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          employmentDate: form.employmentDate || undefined,
          qualifications: form.qualifications.trim() || undefined,
          subjectSpecialisation: form.subjectSpecialisation.trim() || undefined,
          nationalId: form.nationalId.trim() || undefined,
          address: form.address.trim() || undefined,
          nextOfKin: form.nextOfKin.trim() || undefined,
          nextOfKinPhone: form.nextOfKinPhone.trim() || undefined,
          bankName: form.bankName.trim() || undefined,
          bankAccountNumber: form.bankAccountNumber.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create staff member')
      }
      resetForm()
      toast.success('Staff member created successfully')
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
          <span className="hidden sm:inline">Back to Staff List</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
              <UserPlus className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Add New Staff Member</CardTitle>
              <CardDescription>Enter staff details to register a new member. Fields marked with * are required.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Select value={form.title} onValueChange={v => setForm(f => ({ ...f, title: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Prof">Prof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Chenai" required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dube" required />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input value={form.middleName} onChange={e => setForm(f => ({ ...f, middleName: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>National ID</Label>
                  <Input value={form.nationalId} onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))} placeholder="e.g. 63-123456A12" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Employment Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-foreground">Employment Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Headmaster">Headmaster</SelectItem>
                      <SelectItem value="Deputy Head">Deputy Head</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                      <SelectItem value="School Bursar">Bursar</SelectItem>
                      <SelectItem value="School Clerk">Clerk</SelectItem>
                      <SelectItem value="Librarian">Librarian</SelectItem>
                      <SelectItem value="Cleaner">Cleaner</SelectItem>
                      <SelectItem value="Security Guard">Security</SelectItem>
                      <SelectItem value="Groundsman">Groundsman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Languages">Languages</SelectItem>
                      <SelectItem value="Sciences">Sciences</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Humanities">Humanities</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Commercials">Commercials</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Staff Type</Label>
                  <Select value={form.staffType} onValueChange={v => setForm(f => ({ ...f, staffType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEACHING">Teaching</SelectItem>
                      <SelectItem value="NON_TEACHING">Non-Teaching</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPPORT">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pay Type</Label>
                  <Select value={form.payType} onValueChange={v => setForm(f => ({ ...f, payType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHOOL_PAID">School Paid</SelectItem>
                      <SelectItem value="PSC">PSC</SelectItem>
                      <SelectItem value="PART_TIME">Part-Time</SelectItem>
                      <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select value={form.contractType} onValueChange={v => setForm(f => ({ ...f, contractType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERMANENT">Permanent</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                      <SelectItem value="PART_TIME">Part-Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employment Date</Label>
                  <Input type="date" value={form.employmentDate} onChange={e => setForm(f => ({ ...f, employmentDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Basic Salary (USD)</Label>
                  <Input type="number" step="0.01" value={form.basicSalary} onChange={e => setForm(f => ({ ...f, basicSalary: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+263 77 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@school.zw" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. 12 Samora Machel Ave, Harare" rows={2} />
              </div>
            </div>

            <Separator />

            {/* Qualifications & Subject Specialisation */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-foreground">Qualifications & Subjects</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qualifications</Label>
                  <Input value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} placeholder="e.g. B.Ed, PGCE, MSc" />
                </div>
                <div className="space-y-2">
                  <Label>Subject Specialisation</Label>
                  <Input value={form.subjectSpecialisation} onChange={e => setForm(f => ({ ...f, subjectSpecialisation: e.target.value }))} placeholder="e.g. Mathematics, Physics" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Next of Kin */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-foreground">Next of Kin</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Next of Kin Name</Label>
                  <Input value={form.nextOfKin} onChange={e => setForm(f => ({ ...f, nextOfKin: e.target.value }))} placeholder="e.g. Tendai Dube" />
                </div>
                <div className="space-y-2">
                  <Label>Next of Kin Phone</Label>
                  <Input value={form.nextOfKinPhone} onChange={e => setForm(f => ({ ...f, nextOfKinPhone: e.target.value }))} placeholder="+263 77 123 4567" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Bank Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-foreground">Bank Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Select value={form.bankName} onValueChange={v => setForm(f => ({ ...f, bankName: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBZ">CBZ Bank</SelectItem>
                      <SelectItem value="Stanbic">Stanbic Bank</SelectItem>
                      <SelectItem value="FBC">FBC Bank</SelectItem>
                      <SelectItem value="EcoBank">EcoBank</SelectItem>
                      <SelectItem value="BancABC">BancABC</SelectItem>
                      <SelectItem value="Steward">Steward Bank</SelectItem>
                      <SelectItem value="CABS">CABS</SelectItem>
                      <SelectItem value="POSB">POSB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bank Account Number</Label>
                  <Input value={form.bankAccountNumber} onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))} placeholder="e.g. 0123456789012" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { resetForm(); onBack() }}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Staff Member'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Staff Settings View ──────────────────────────────────────────────────────
function StaffSettingsView({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<StaffSettings>(defaultStaffSettings)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate saving delay
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    toast.success('Staff settings saved successfully')
  }

  const updateSetting = <K extends keyof StaffSettings>(key: K, value: StaffSettings[K]) => {
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
            <span className="hidden sm:inline">Back to Staff List</span>
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
              <Columns3 className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-base">Display Settings</CardTitle>
            </div>
            <CardDescription>Configure how the staff directory is displayed.</CardDescription>
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
                { key: 'showStaffNumber' as const, label: 'Staff Number' },
                { key: 'showPosition' as const, label: 'Position' },
                { key: 'showDepartment' as const, label: 'Department' },
                { key: 'showStaffType' as const, label: 'Staff Type' },
                { key: 'showPayType' as const, label: 'Pay Type' },
                { key: 'showStatus' as const, label: 'Status' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Switch
                    checked={settings[item.key]}
                    onCheckedChange={v => updateSetting(item.key, v)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Number Format Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-base">Staff Number Format</CardTitle>
            </div>
            <CardDescription>Configure how staff numbers are generated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Number Format</Label>
              <Input
                value={settings.staffNumberFormat}
                onChange={e => updateSetting('staffNumberFormat', e.target.value)}
                placeholder="SCH-STAFF-YYYY-NNN"
              />
              <p className="text-[11px] text-muted-foreground">Use YYYY for year, NNN for auto-increment number</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Generate Staff Numbers</p>
                <p className="text-xs text-muted-foreground">Automatically assign staff numbers on creation</p>
              </div>
              <Switch
                checked={settings.autoGenerateStaffNumber}
                onCheckedChange={v => updateSetting('autoGenerateStaffNumber', v)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Default Contract Type</Label>
              <Select value={settings.defaultContractType} onValueChange={v => updateSetting('defaultContractType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="TEMPORARY">Temporary</SelectItem>
                  <SelectItem value="PART_TIME">Part-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Pay Type</Label>
              <Select value={settings.defaultPayType} onValueChange={v => updateSetting('defaultPayType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHOOL_PAID">School Paid</SelectItem>
                  <SelectItem value="PSC">PSC</SelectItem>
                  <SelectItem value="PART_TIME">Part-Time</SelectItem>
                  <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Required Fields */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ToggleLeft className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-base">Required Fields</CardTitle>
            </div>
            <CardDescription>Choose which fields are required when adding staff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'requiredFirstName' as const, label: 'First Name' },
              { key: 'requiredLastName' as const, label: 'Last Name' },
              { key: 'requiredPhone' as const, label: 'Phone Number' },
              { key: 'requiredEmail' as const, label: 'Email Address' },
              { key: 'requiredDepartment' as const, label: 'Department' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={v => updateSetting(item.key, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notification & Export Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-base">Notifications & Export</CardTitle>
            </div>
            <CardDescription>Email notifications and data export preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Email Notifications</Label>
              {[
                { key: 'emailOnNewStaff' as const, label: 'New staff added', desc: 'Notify admin when staff is added' },
                { key: 'emailOnContractExpiry' as const, label: 'Contract expiry', desc: 'Alert before contract ends' },
                { key: 'emailOnLeaveRequest' as const, label: 'Leave requests', desc: 'Notify on new leave requests' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings[item.key]}
                    onCheckedChange={v => updateSetting(item.key, v)}
                  />
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Settings</Label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Include Salary in Exports</p>
                  <p className="text-[11px] text-muted-foreground">Include salary data when exporting</p>
                </div>
                <Switch
                  checked={settings.exportIncludeSalary}
                  onCheckedChange={v => updateSetting('exportIncludeSalary', v)}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Export Format</Label>
                <Select value={settings.exportFormat} onValueChange={v => updateSetting('exportFormat', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

// ─── Staff Detail View ────────────────────────────────────────────────────────
function StaffDetailView({
  staffId,
  onBack,
  onEdit,
}: {
  staffId: string
  onBack: () => void
  onEdit: () => void
}) {
  const [staff, setStaff] = useState<StaffDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/staff/${staffId}`)
        if (!res.ok) throw new Error('Failed to fetch staff details')
        const json = await res.json()
        setStaff(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [staffId])

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

  if (error || !staff) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-3" />
        <p className="text-sm">{error || 'Staff member not found'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onBack}>Go Back</Button>
      </div>
    )
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
          <span className="hidden sm:inline">Back to Staff List</span>
          <span className="sm:hidden">Back</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
            <Ban className="h-4 w-4" />
            <span className="hidden sm:inline">Deactivate</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50">
            <FileBarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Report</span>
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 px-4 sm:px-6 py-4 sm:py-5 relative">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5" />
          <div className="flex items-center gap-4 relative z-10">
            <Avatar className="h-16 w-16 border-2 border-white/30 shadow-lg">
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">
                {staff.firstName[0]}{staff.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h2 className="text-xl font-bold">
                {staff.title ? staff.title + '. ' : ''}{staff.firstName} {staff.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-sm text-teal-100 font-mono">{staff.staffNumber}</span>
                <Badge variant="outline" className="text-[11px] bg-white/10 text-white border-white/20">
                  {staff.position}
                </Badge>
                <ActiveBadge isActive={staff.isActive} />
              </div>
              <p className="text-sm text-teal-100 mt-1">
                {staff.department || 'No Department'} &middot; <StaffTypeBadge type={staff.staffType} />
              </p>
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
                  { value: 'payroll', label: 'Payroll', icon: DollarSign },
                  { value: 'leave', label: 'Leave', icon: Calendar },
                  { value: 'appraisals', label: 'Appraisals', icon: BadgeCheck },
                  { value: 'documents', label: 'Documents', icon: FileText },
                  { value: 'timeline', label: 'Timeline', icon: Clock },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-12 px-3 sm:px-4 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none"
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
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-teal-600" />
                    Personal Details
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Full Name', value: `${staff.title ? staff.title + '. ' : ''}${staff.firstName} ${staff.middleName ? staff.middleName + ' ' : ''}${staff.lastName}` },
                      { label: 'Gender', value: staff.gender || '—' },
                      { label: 'Date of Birth', value: staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : '—' },
                      { label: 'National ID', value: staff.nationalId || '—' },
                      { label: 'Address', value: staff.address || '—' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-dashed last:border-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact & Employment */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-teal-600" />
                    Employment & Contact
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Phone', value: staff.phone || '—' },
                      { label: 'Email', value: staff.email || '—' },
                      { label: 'Position', value: staff.position },
                      { label: 'Department', value: staff.department || '—' },
                      { label: 'Employment Date', value: staff.employmentDate ? new Date(staff.employmentDate).toLocaleDateString() : '—' },
                      { label: 'Contract Type', value: staff.contractType },
                      { label: 'Next of Kin', value: staff.nextOfKin || '—' },
                      { label: 'Next of Kin Phone', value: staff.nextOfKinPhone || '—' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-dashed last:border-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualifications */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-teal-600" />
                    Qualifications
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Qualifications', value: staff.qualifications || '—' },
                      { label: 'Subject Specialisation', value: staff.subjectSpecialisation || '—' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-dashed last:border-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-teal-600" />
                    Bank Details
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Bank Name', value: staff.bankName || '—' },
                      { label: 'Account Number', value: staff.bankAccountNumber || '—' },
                      { label: 'Payroll Status', value: staff.payrollStatus },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-dashed last:border-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Payroll Tab */}
            <TabsContent value="payroll" className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Basic Salary</p>
                    <p className="text-lg font-bold">${staff.basicSalary.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Housing</p>
                    <p className="text-lg font-bold">${staff.housingAllowance.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Transport</p>
                    <p className="text-lg font-bold">${staff.transportAllowance.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Responsibility</p>
                    <p className="text-lg font-bold">${staff.responsibilityAllowance.toFixed(2)}</p>
                  </div>
                </div>
                <h3 className="text-sm font-semibold">Payslip History</h3>
                {staff.payslips.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No payslips found</p>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Period</TableHead>
                          <TableHead className="text-xs">Basic</TableHead>
                          <TableHead className="text-xs">Gross</TableHead>
                          <TableHead className="text-xs">Net</TableHead>
                          <TableHead className="text-xs">Currency</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.payslips.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs font-mono">{monthNames[p.periodMonth - 1]} {p.periodYear}</TableCell>
                            <TableCell className="text-xs">${p.basicSalary.toFixed(2)}</TableCell>
                            <TableCell className="text-xs">${p.grossPay.toFixed(2)}</TableCell>
                            <TableCell className="text-xs font-medium">${p.netPay.toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{p.currency}</TableCell>
                            <TableCell><PayslipStatusBadge status={p.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Leave Tab */}
            <TabsContent value="leave" className="p-6">
              {staff.leaveRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No leave records found</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Start</TableHead>
                        <TableHead className="text-xs">End</TableHead>
                        <TableHead className="text-xs">Days</TableHead>
                        <TableHead className="text-xs">Reason</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.leaveRecords.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs">{l.leaveType}</TableCell>
                          <TableCell className="text-xs">{new Date(l.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{new Date(l.endDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{l.days}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{l.reason || '—'}</TableCell>
                          <TableCell><LeaveStatusBadge status={l.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Appraisals Tab */}
            <TabsContent value="appraisals" className="p-6">
              {staff.appraisalRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BadgeCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No appraisal records found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staff.appraisalRecords.map(a => (
                    <Card key={a.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{a.period}</span>
                          <Badge variant="outline" className="text-[11px]">{a.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground">Rating:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div key={i} className={cn('h-3 w-3 rounded-full', i < a.rating ? 'bg-teal-500' : 'bg-gray-200')} />
                            ))}
                          </div>
                        </div>
                        {a.strengths && <p className="text-xs text-muted-foreground"><strong>Strengths:</strong> {a.strengths}</p>}
                        {a.areasForImprovement && <p className="text-xs text-muted-foreground"><strong>Areas for improvement:</strong> {a.areasForImprovement}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="p-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Documents</p>
                <p className="text-xs mt-1">Upload and manage staff documents here.</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="p-6">
              <div className="space-y-4">
                {staff.disciplinaryRecords.length === 0 && !staff.employmentDate ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">Activity Timeline</p>
                    <p className="text-xs mt-1">Staff activity will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staff.employmentDate && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-teal-600" />
                          </div>
                          <div className="w-px h-full bg-border" />
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">Employment Started</p>
                          <p className="text-xs text-muted-foreground">{new Date(staff.employmentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {staff.disciplinaryRecords.map(d => (
                      <div key={d.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="w-px h-full bg-border" />
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">{d.incidentType}</p>
                          <p className="text-xs text-muted-foreground">{d.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{new Date(d.date).toLocaleDateString()} &middot; {d.status}</p>
                        </div>
                      </div>
                    ))}
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

// ─── Main Staff Module ────────────────────────────────────────────────────────
export default function StaffModule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  const handleSelectStaff = (id: string) => {
    setSelectedStaffId(id)
    setViewMode('detail')
  }

  const handleAddStaff = () => {
    setViewMode('add')
  }

  const handleOpenSettings = () => {
    setViewMode('settings')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedStaffId(null)
  }

  const handleEditStaff = () => {
    setViewMode('edit')
  }

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'list' && (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <StaffListView
            onSelectStaff={handleSelectStaff}
            onAddStaff={handleAddStaff}
            onOpenSettings={handleOpenSettings}
          />
        </motion.div>
      )}
      {viewMode === 'add' && (
        <AddStaffInlineForm
          key="add"
          onBack={handleBackToList}
          onSuccess={handleBackToList}
        />
      )}
      {viewMode === 'detail' && selectedStaffId && (
        <StaffDetailView
          key="detail"
          staffId={selectedStaffId}
          onBack={handleBackToList}
          onEdit={handleEditStaff}
        />
      )}
      {viewMode === 'edit' && selectedStaffId && (
        <AddStaffInlineForm
          key="edit"
          onBack={() => setViewMode('detail')}
          onSuccess={() => setViewMode('detail')}
        />
      )}
      {viewMode === 'settings' && (
        <StaffSettingsView
          key="settings"
          onBack={handleBackToList}
        />
      )}
    </AnimatePresence>
  )
}
