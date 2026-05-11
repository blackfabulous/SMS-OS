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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', bgColor)}>
            <Icon className={cn('h-5 w-5', iconColor || 'text-teal-600')} />
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

// ─── Staff List View ──────────────────────────────────────────────────────────
function StaffListView({
  onSelectStaff,
}: {
  onSelectStaff: (id: string) => void
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
  const [addDialogOpen, setAddDialogOpen] = useState(false)
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
          onLeave: 0, // Would need leave data for this
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
              <AddStaffDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={() => { fetchStaff(); fetchStats() }}
              />
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
                {/* Staff Type Filter */}
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
                {/* Position Filter */}
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
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('staffNumber')}>
                      <span className="flex items-center">Staff # <SortIcon field="staffNumber" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('name')}>
                      <span className="flex items-center">Name <SortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('position')}>
                      <span className="flex items-center">Position <SortIcon field="position" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('department')}>
                      <span className="flex items-center">Department <SortIcon field="department" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('staffType')}>
                      <span className="flex items-center">Type <SortIcon field="staffType" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('payType')}>
                      <span className="flex items-center">Pay Type <SortIcon field="payType" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none h-10" onClick={() => handleSort('status')}>
                      <span className="flex items-center">Status <SortIcon field="status" /></span>
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
                        <TableCell className="font-mono text-xs">{member.staffNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px] font-semibold">
                                {member.firstName[0]}{member.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {member.title ? member.title + '. ' : ''}{member.firstName} {member.lastName}
                              </p>
                              {member.email && <p className="text-[10px] text-muted-foreground">{member.email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{member.position}</TableCell>
                        <TableCell className="text-sm">{member.department || '—'}</TableCell>
                        <TableCell><StaffTypeBadge type={member.staffType} /></TableCell>
                        <TableCell><PayTypeBadge type={member.payType} /></TableCell>
                        <TableCell><ActiveBadge isActive={member.isActive} /></TableCell>
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

// ─── Add Staff Dialog ─────────────────────────────────────────────────────────
function AddStaffDialog({
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
    title: '',
    firstName: '',
    lastName: '',
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
    qualifications: '',
  })

  const resetForm = () => {
    setForm({
      title: '', firstName: '', lastName: '', position: '', department: '',
      staffType: 'TEACHING', payType: 'SCHOOL_PAID', phone: '', email: '',
      basicSalary: '', contractType: 'PERMANENT', gender: '', dateOfBirth: '', qualifications: '',
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
          qualifications: form.qualifications.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create staff member')
      }
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <UserPlus className="h-4 w-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Add New Staff Member
          </DialogTitle>
          <DialogDescription>Enter staff details to register a new member.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
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
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Chenai" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dube" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+263 77 123 4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@school.zw" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Basic Salary (USD)</Label>
              <Input id="salary" type="number" step="0.01" value={form.basicSalary} onChange={e => setForm(f => ({ ...f, basicSalary: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualifications">Qualifications</Label>
            <Input id="qualifications" value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} placeholder="e.g. B.Ed, PGCE, MSc" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Staff Detail View ────────────────────────────────────────────────────────
function StaffDetailView({
  staffId,
  onBack,
}: {
  staffId: string
  onBack: () => void
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
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
        <ChevronLeft className="h-4 w-4" />
        Back to Staff List
      </Button>

      {/* Profile Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 px-6 py-5 relative">
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
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none"
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
                      { label: 'Gender', value: staff.gender === 'MALE' ? 'Male' : staff.gender === 'FEMALE' ? 'Female' : '—' },
                      { label: 'Date of Birth', value: staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                      { label: 'National ID', value: staff.nationalId || '—' },
                      { label: 'Phone', value: staff.phone || '—' },
                      { label: 'Email', value: staff.email || '—' },
                      { label: 'Address', value: staff.address || '—' },
                      { label: 'Next of Kin', value: staff.nextOfKin || '—' },
                      { label: 'Next of Kin Phone', value: staff.nextOfKinPhone || '—' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-dashed last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employment Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Employment Info
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Position', value: staff.position },
                      { label: 'Department', value: staff.department || '—' },
                      { label: 'Staff Type', value: staff.staffType },
                      { label: 'Pay Type', value: staff.payType },
                      { label: 'Contract Type', value: staff.contractType },
                      { label: 'Employment Date', value: staff.employmentDate ? new Date(staff.employmentDate).toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                      { label: 'Payroll Status', value: staff.payrollStatus },
                      { label: 'Basic Salary', value: `$${staff.basicSalary.toFixed(2)}` },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-dashed last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              {(staff.qualifications || staff.subjectSpecialisation) && (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-4">
                    <GraduationCap className="h-4 w-4" /> Qualifications & Specialisation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {staff.qualifications && (
                      <div className="p-4 rounded-xl border bg-muted/20">
                        <p className="text-xs text-muted-foreground mb-1">Qualifications</p>
                        <p className="text-sm font-medium">{staff.qualifications}</p>
                      </div>
                    )}
                    {staff.subjectSpecialisation && (
                      <div className="p-4 rounded-xl border bg-muted/20">
                        <p className="text-xs text-muted-foreground mb-1">Subject Specialisation</p>
                        <p className="text-sm font-medium">{staff.subjectSpecialisation}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Payroll Tab */}
            <TabsContent value="payroll" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Recent Payslips</h3>
              {staff.payslips.length > 0 ? (
                <div className="space-y-3">
                  {staff.payslips.map(payslip => (
                    <div key={payslip.id} className="p-4 rounded-xl border hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium">
                            {monthNames[payslip.periodMonth - 1]} {payslip.periodYear}
                          </p>
                          <p className="text-xs text-muted-foreground">{payslip.currency}</p>
                        </div>
                        <PayslipStatusBadge status={payslip.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Gross Pay</p>
                          <p className="text-sm font-semibold">${payslip.grossPay.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Deductions</p>
                          <p className="text-sm font-semibold text-red-600">
                            ${(payslip.grossPay - payslip.netPay).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Net Pay</p>
                          <p className="text-sm font-semibold text-emerald-600">${payslip.netPay.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No payslips found</p>
              )}
            </TabsContent>

            {/* Leave Tab */}
            <TabsContent value="leave" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Leave Records</h3>
              {staff.leaveRecords.length > 0 ? (
                <div className="space-y-3">
                  {staff.leaveRecords.map(leave => (
                    <div key={leave.id} className="p-4 rounded-xl border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Badge variant="outline" className="text-[11px] bg-cyan-50 text-cyan-700 border-cyan-200">
                            {leave.leaveType}
                          </Badge>
                        </div>
                        <LeaveStatusBadge status={leave.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {' — '}
                          {new Date(leave.endDate).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">{leave.days} day{leave.days !== 1 ? 's' : ''}</Badge>
                      </div>
                      {leave.reason && (
                        <p className="text-xs text-muted-foreground mt-2">{leave.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No leave records found</p>
              )}
            </TabsContent>

            {/* Appraisals Tab */}
            <TabsContent value="appraisals" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Appraisal Records</h3>
              {staff.appraisalRecords.length > 0 ? (
                <div className="space-y-3">
                  {staff.appraisalRecords.map(appraisal => (
                    <div key={appraisal.id} className="p-4 rounded-xl border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{appraisal.period}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(
                            'text-[11px]',
                            appraisal.rating >= 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            appraisal.rating >= 3 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          )}>
                            Rating: {appraisal.rating}/5
                          </Badge>
                          <Badge variant="outline" className="text-[11px] bg-gray-50 text-gray-700 border-gray-200">
                            {appraisal.status}
                          </Badge>
                        </div>
                      </div>
                      {appraisal.comments && (
                        <p className="text-sm text-muted-foreground mt-1">{appraisal.comments}</p>
                      )}
                      {(appraisal.strengths || appraisal.areasForImprovement) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {appraisal.strengths && (
                            <div className="p-3 rounded-lg bg-emerald-50">
                              <p className="text-[10px] text-emerald-600 uppercase font-semibold mb-1">Strengths</p>
                              <p className="text-xs">{appraisal.strengths}</p>
                            </div>
                          )}
                          {appraisal.areasForImprovement && (
                            <div className="p-3 rounded-lg bg-amber-50">
                              <p className="text-[10px] text-amber-600 uppercase font-semibold mb-1">Areas for Improvement</p>
                              <p className="text-xs">{appraisal.areasForImprovement}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No appraisal records found</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Staff Module ────────────────────────────────────────────────────────
export default function StaffModule() {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  return (
    <AnimatePresence mode="wait">
      {selectedStaffId ? (
        <StaffDetailView
          key="detail"
          staffId={selectedStaffId}
          onBack={() => setSelectedStaffId(null)}
        />
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <StaffListView onSelectStaff={setSelectedStaffId} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
