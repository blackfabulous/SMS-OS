'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  DollarSign,
  Calculator,
  CheckCircle2,
  Clock,
  Loader2,
  Download,
  Printer,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface StaffPayroll {
  id: string
  staffNumber: string
  firstName: string
  lastName: string
  position: string
  department: string | null
  staffType: string
  basicSalary: number
  housingAllowance: number
  transportAllowance: number
  responsibilityAllowance: number
  grossPay: number
  hasPayslip: boolean
}

interface PayslipRecord {
  id: string
  staffId: string
  periodMonth: number
  periodYear: number
  basicSalary: number
  housingAllowance: number
  transportAllowance: number
  responsibilityAllowance: number
  overtime: number
  grossPay: number
  paye: number
  nssaEmployee: number
  nssaEmployer: number
  aidsLevy: number
  zimdef: number
  pension: number
  medicalAid: number
  funeralPolicy: number
  otherDeductions: number
  netPay: number
  status: string
  staff: { firstName: string; lastName: string; staffNumber: string; position: string }
}

interface PayrollStats {
  totalStaff: number
  totalPayroll: number
  totalDeductions: number
  totalNetPay: number
  payeTotal: number
  nssaEmployee: number
  nssaEmployer: number
  aidsLevy: number
  zimdef: number
  payslipsGenerated: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const distributionChartConfig = {
  count: { label: 'Staff', color: '#10b981' },
} satisfies ChartConfig

// ─── Payroll Module ─────────────────────────────────────────────────────────

export default function PayrollModule() {
  const [staff, setStaff] = useState<StaffPayroll[]>([])
  const [payslips, setPayslips] = useState<PayslipRecord[]>([])
  const [stats, setStats] = useState<PayrollStats | null>(null)
  const [distribution, setDistribution] = useState<Array<{ range: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [viewPayslip, setViewPayslip] = useState<PayslipRecord | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`)
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff || [])
        setPayslips(data.payslips || [])
        setStats(data.stats || null)
        setDistribution(data.distribution || [])
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleProcessPayroll = async () => {
    try {
      setProcessing(true)
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
        }),
      })
      if (res.ok) {
        setProcessDialogOpen(false)
        fetchData()
      }
    } catch (err) {
      console.error('Failed to process payroll:', err)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll & HR</h1>
          <p className="text-sm text-muted-foreground mt-1">Process salaries, manage statutory deductions</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Staff Payroll</TabsTrigger>
          <TabsTrigger value="process" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Process Payroll</TabsTrigger>
          <TabsTrigger value="payslips" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Payslips</TabsTrigger>
          <TabsTrigger value="statutory" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Statutory</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Payroll</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(stats?.totalPayroll || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">{stats?.totalStaff || 0} staff</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Pay This Month</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(stats?.totalNetPay || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">After deductions</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <DollarSign className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PAYE</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(stats?.payeTotal || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Income tax</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <Calculator className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">NSSA</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency((stats?.nssaEmployee || 0) + (stats?.nssaEmployer || 0))}</p>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-rose-600" />
                      <span className="text-xs font-medium text-rose-600">Employee + Employer</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
                    <Shield className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 to-pink-500" />
            </Card>
          </div>

          {/* Salary Distribution Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Salary Distribution</CardTitle>
              <CardDescription>Staff count by salary range (Gross Pay)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={distributionChartConfig} className="h-[250px] w-full">
                <BarChart data={distribution} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Staff Payroll Tab ────────────────────────────────────────── */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Staff Salary Breakdown</CardTitle>
              <CardDescription>Basic salary, housing, transport, and responsibility allowances</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Staff</TableHead>
                      <TableHead className="text-xs">Position</TableHead>
                      <TableHead className="text-xs text-right">Basic</TableHead>
                      <TableHead className="text-xs text-right">Housing</TableHead>
                      <TableHead className="text-xs text-right">Transport</TableHead>
                      <TableHead className="text-xs text-right">Responsibility</TableHead>
                      <TableHead className="text-xs text-right">Gross Pay</TableHead>
                      <TableHead className="text-xs">Payslip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-xs font-semibold">
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{s.staffNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{s.position}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(s.basicSalary)}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(s.housingAllowance)}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(s.transportAllowance)}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(s.responsibilityAllowance)}</TableCell>
                        <TableCell className="text-sm text-right font-bold font-mono">{formatCurrency(s.grossPay)}</TableCell>
                        <TableCell>
                          {s.hasPayslip ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Generated</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {staff.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No staff on payroll
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Process Payroll Tab ──────────────────────────────────────── */}
        <TabsContent value="process" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Process Payroll</CardTitle>
              <CardDescription>Generate payslips for the selected period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-emerald-50/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Period</p>
                  <p className="text-lg font-bold">{monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</p>
                </div>
                <div className="p-4 rounded-xl border bg-teal-50/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Staff to Process</p>
                  <p className="text-lg font-bold">{stats?.totalStaff || 0}</p>
                </div>
                <div className="p-4 rounded-xl border bg-amber-50/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Gross Pay</p>
                  <p className="text-lg font-bold">{formatCurrency(stats?.totalPayroll || 0)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Payroll Processing</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This will generate payslips for all active school-paid staff for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}.
                    Existing payslips for this period will be skipped. PAYE, NSSA, AIDS Levy, and ZIMDEF will be calculated automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                  onClick={() => setProcessDialogOpen(true)}
                  disabled={stats?.payslipsGenerated === stats?.totalStaff}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  {stats?.payslipsGenerated === stats?.totalStaff ? 'Already Processed' : 'Process Payroll'}
                </Button>
                {stats?.payslipsGenerated && stats.payslipsGenerated > 0 && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {stats.payslipsGenerated} payslips already generated
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Confirm Payroll Processing</DialogTitle>
                <DialogDescription>
                  Generate payslips for {stats?.totalStaff || 0} staff members for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Gross Pay</span>
                    <span className="font-semibold">{formatCurrency(stats?.totalPayroll || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Deductions</span>
                    <span className="font-semibold">{formatCurrency(stats?.totalDeductions || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Net Pay</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(stats?.totalNetPay || 0)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleProcessPayroll} disabled={processing} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm & Process
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── Payslips Tab ─────────────────────────────────────────────── */}
        <TabsContent value="payslips" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Generated Payslips</CardTitle>
              <CardDescription>{monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Staff</TableHead>
                    <TableHead className="text-xs">Position</TableHead>
                    <TableHead className="text-xs text-right">Gross Pay</TableHead>
                    <TableHead className="text-xs text-right">Deductions</TableHead>
                    <TableHead className="text-xs text-right">Net Pay</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((p) => {
                    const totalDeductions = p.paye + p.nssaEmployee + p.aidsLevy + p.zimdef + p.pension + p.medicalAid + p.funeralPolicy + p.otherDeductions
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell>
                          <p className="text-sm font-medium">{p.staff.firstName} {p.staff.lastName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.staff.staffNumber}</p>
                        </TableCell>
                        <TableCell className="text-sm">{p.staff.position}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(p.grossPay)}</TableCell>
                        <TableCell className="text-sm text-right font-mono text-red-600">-{formatCurrency(totalDeductions)}</TableCell>
                        <TableCell className="text-sm text-right font-bold font-mono text-emerald-600">{formatCurrency(p.netPay)}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewPayslip(p)}>
                              <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {payslips.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>No payslips generated for this period</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* View Payslip Dialog */}
          <Dialog open={!!viewPayslip} onOpenChange={() => setViewPayslip(null)}>
            <DialogContent className="sm:max-w-[500px]">
              {viewPayslip && (
                <>
                  <DialogHeader>
                    <DialogTitle>Payslip — {viewPayslip.staff.firstName} {viewPayslip.staff.lastName}</DialogTitle>
                    <DialogDescription>{monthNames[viewPayslip.periodMonth - 1]} {viewPayslip.periodYear}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Staff #:</span> <span className="font-mono">{viewPayslip.staff.staffNumber}</span></div>
                      <div><span className="text-muted-foreground">Position:</span> {viewPayslip.staff.position}</div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Earnings</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono">{formatCurrency(viewPayslip.basicSalary)}</span></div>
                        <div className="flex justify-between"><span>Housing Allowance</span><span className="font-mono">{formatCurrency(viewPayslip.housingAllowance)}</span></div>
                        <div className="flex justify-between"><span>Transport Allowance</span><span className="font-mono">{formatCurrency(viewPayslip.transportAllowance)}</span></div>
                        <div className="flex justify-between"><span>Responsibility Allowance</span><span className="font-mono">{formatCurrency(viewPayslip.responsibilityAllowance)}</span></div>
                        <div className="flex justify-between"><span>Overtime</span><span className="font-mono">{formatCurrency(viewPayslip.overtime)}</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold"><span>Gross Pay</span><span className="font-mono">{formatCurrency(viewPayslip.grossPay)}</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Deductions</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>PAYE</span><span className="font-mono text-red-600">-{formatCurrency(viewPayslip.paye)}</span></div>
                        <div className="flex justify-between"><span>NSSA (Employee)</span><span className="font-mono text-red-600">-{formatCurrency(viewPayslip.nssaEmployee)}</span></div>
                        <div className="flex justify-between"><span>AIDS Levy</span><span className="font-mono text-red-600">-{formatCurrency(viewPayslip.aidsLevy)}</span></div>
                        <div className="flex justify-between"><span>ZIMDEF</span><span className="font-mono text-red-600">-{formatCurrency(viewPayslip.zimdef)}</span></div>
                        {viewPayslip.pension > 0 && <div className="flex justify-between"><span>Pension</span><span className="font-mono text-red-600">-{formatCurrency(viewPayslip.pension)}</span></div>}
                        {viewPayslip.medicalAid > 0 && <div className="flex justify-between"><span>Medical Aid</span><span className="font-mono text-red-600">-{formatCurrency(viewPayslip.medicalAid)}</span></div>}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold bg-emerald-50 p-3 rounded-lg">
                      <span>Net Pay</span>
                      <span className="text-emerald-600 font-mono">{formatCurrency(viewPayslip.netPay)}</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm"><Printer className="mr-2 h-3 w-3" />Print</Button>
                    <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" />Download PDF</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── Statutory Deductions Tab ─────────────────────────────────── */}
        <TabsContent value="statutory" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PAYE Summary */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-amber-600" />
                  PAYE Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total PAYE Collected</span><span className="font-bold">{formatCurrency(stats?.payeTotal || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">AIDS Levy (6% of PAYE)</span><span className="font-bold">{formatCurrency(stats?.aidsLevy || 0)}</span></div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold"><span>Total to ZIMRA</span><span className="text-amber-600">{formatCurrency((stats?.payeTotal || 0) + (stats?.aidsLevy || 0))}</span></div>
                <div className="p-2 rounded bg-amber-50 text-xs text-amber-700">
                  Due by 10th of following month. Late penalty: 100% + interest.
                </div>
              </CardContent>
            </Card>

            {/* NSSA Summary */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-rose-600" />
                  NSSA Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Employee Contribution</span><span className="font-bold">{formatCurrency(stats?.nssaEmployee || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Employer Contribution</span><span className="font-bold">{formatCurrency(stats?.nssaEmployer || 0)}</span></div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold"><span>Total NSSA Remittance</span><span className="text-rose-600">{formatCurrency((stats?.nssaEmployee || 0) + (stats?.nssaEmployer || 0))}</span></div>
                <div className="p-2 rounded bg-rose-50 text-xs text-rose-700">
                  Rate: 4.5% each. Maximum insurable earnings: $7,533.33/month.
                </div>
              </CardContent>
            </Card>

            {/* ZIMDEF */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  ZIMDEF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">1% of Total Payroll</span><span className="font-bold">{formatCurrency(stats?.zimdef || 0)}</span></div>
                <div className="p-2 rounded bg-teal-50 text-xs text-teal-700">
                  Zimbabwe Manpower Development Fund. Employer-only contribution.
                </div>
              </CardContent>
            </Card>

            {/* AIDS Levy */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  AIDS Levy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">6% of PAYE</span><span className="font-bold">{formatCurrency(stats?.aidsLevy || 0)}</span></div>
                <div className="p-2 rounded bg-orange-50 text-xs text-orange-700">
                  National AIDS Trust Fund. Paid together with PAYE to ZIMRA.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
