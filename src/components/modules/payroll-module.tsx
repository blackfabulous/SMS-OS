'use client'

import { ModuleContainer, StatGrid, ModuleStatCard, SectionCard, TableShell, ModulePageLayout, ModuleSettingsButton, KitEmptyState, ModuleToolbar } from '@/components/module-ui';
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Settings,
  ArrowLeft,
  Calendar,
  Percent,
  FileCheck,
  Building2,
  Wallet,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import { cn } from '@/lib/utils'
import { formatDualCurrency, formatUSD, formatZiG, getCurrentRate, fetchExchangeRate } from '@/lib/currency'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'process-confirm' | 'payslip-detail' | 'settings'

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [exchangeRate, setExchangeRate] = useState(getCurrentRate().rate)
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))
  const [processing, setProcessing] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null)

  // Settings state
  const [payrollSettings, setPayrollSettings] = useState({
    payrollPeriodDefault: 'MONTHLY',
    nssaRate: '4.5',
    nssaMaxEarnings: '7533.33',
    aidsLevyRate: '6',
    zimdefRate: '1',
    payslipFormat: 'DETAILED',
    bankFileFormat: 'CSV',
    deductionTypes: 'ALL',
    autoProcess: false,
    payDayDefault: '25',
  })

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
    fetchExchangeRate().then(r => setExchangeRate(r.rate))
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
        setViewMode('list')
        fetchData()
        toast.success('Payroll processed successfully', {
          description: `Payslips generated for ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`,
        })
      }
    } catch (err) {
      console.error('Failed to process payroll:', err)
      toast.error('Failed to process payroll')
    } finally {
      setProcessing(false)
    }
  }

  // ─── Inline: Process Payroll Confirmation ──────────────────────────────

  if (viewMode === 'process-confirm') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div className="max-w-xl mx-auto">
          <SectionCard
            title="Confirm Payroll Processing"
            description={`Generate payslips for ${stats?.totalStaff || 0} staff members for ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`}
          >
            <div className="space-y-6">
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

              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Gross Pay</span><span className="font-semibold">{formatCurrency(stats?.totalPayroll || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Deductions</span><span className="font-semibold">{formatCurrency(stats?.totalDeductions || 0)}</span></div>
                <Separator />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Net Pay</span><span className="font-bold text-emerald-600">{formatCurrency(stats?.totalNetPay || 0)}</span></div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Payroll Processing</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This will generate payslips for all active school-paid staff. Existing payslips for this period will be skipped. PAYE, NSSA, AIDS Levy, and ZIMDEF will be calculated automatically based on ZIMRA rates.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
                <Button onClick={handleProcessPayroll} disabled={processing || stats?.payslipsGenerated === stats?.totalStaff} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm & Process
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Inline: Payslip Detail ────────────────────────────────────────────

  if (viewMode === 'payslip-detail' && selectedPayslip) {
    const p = selectedPayslip
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedPayslip(null) }} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Payslips
          </Button>
        </div>
        <div className="max-w-2xl mx-auto">
          <SectionCard
            title={`Payslip — ${p.staff.firstName} ${p.staff.lastName}`}
            description={`${monthNames[p.periodMonth - 1]} ${p.periodYear}`}
            actions={<Badge className={cn('text-xs', p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{p.status}</Badge>}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Staff #:</span> <span className="font-mono">{p.staff.staffNumber}</span></div>
                <div><span className="text-muted-foreground">Position:</span> {p.staff.position}</div>
              </div>
              <Separator />
              {/* Earnings */}
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Earnings</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono">{formatCurrency(p.basicSalary)}</span></div>
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG(p.basicSalary * exchangeRate)}</span></div>
                  <div className="flex justify-between"><span>Housing Allowance</span><span className="font-mono">{formatCurrency(p.housingAllowance)}</span></div>
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG(p.housingAllowance * exchangeRate)}</span></div>
                  <div className="flex justify-between"><span>Transport Allowance</span><span className="font-mono">{formatCurrency(p.transportAllowance)}</span></div>
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG(p.transportAllowance * exchangeRate)}</span></div>
                  <div className="flex justify-between"><span>Responsibility Allowance</span><span className="font-mono">{formatCurrency(p.responsibilityAllowance)}</span></div>
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG(p.responsibilityAllowance * exchangeRate)}</span></div>
                  {p.overtime > 0 && <div className="flex justify-between"><span>Overtime</span><span className="font-mono">{formatCurrency(p.overtime)}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold"><span>Gross Pay</span><span className="font-mono">{formatCurrency(p.grossPay)}</span></div>
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG(p.grossPay * exchangeRate)}</span></div>
                </div>
              </div>
              {/* Deductions */}
              <div>
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Deductions</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span>PAYE (Income Tax)</span><span className="font-mono text-red-600">-{formatCurrency(p.paye)}</span></div>
                  <div className="flex justify-between"><span>NSSA (Employee 4.5%)</span><span className="font-mono text-red-600">-{formatCurrency(p.nssaEmployee)}</span></div>
                  <div className="flex justify-between"><span>AIDS Levy (6% of PAYE)</span><span className="font-mono text-red-600">-{formatCurrency(p.aidsLevy)}</span></div>
                  <div className="flex justify-between"><span>ZIMDEF (1%)</span><span className="font-mono text-red-600">-{formatCurrency(p.zimdef)}</span></div>
                  {p.pension > 0 && <div className="flex justify-between"><span>Pension</span><span className="font-mono text-red-600">-{formatCurrency(p.pension)}</span></div>}
                  {p.medicalAid > 0 && <div className="flex justify-between"><span>Medical Aid</span><span className="font-mono text-red-600">-{formatCurrency(p.medicalAid)}</span></div>}
                  {p.funeralPolicy > 0 && <div className="flex justify-between"><span>Funeral Policy</span><span className="font-mono text-red-600">-{formatCurrency(p.funeralPolicy)}</span></div>}
                  {p.otherDeductions > 0 && <div className="flex justify-between"><span>Other Deductions</span><span className="font-mono text-red-600">-{formatCurrency(p.otherDeductions)}</span></div>}
                </div>
              </div>
              {/* Employer Contributions */}
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Employer Contributions</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span>NSSA (Employer 4.5%)</span><span className="font-mono">{formatCurrency(p.nssaEmployer)}</span></div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg">
                <span>Net Pay</span>
                <div className="text-right">
                  <div className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(p.netPay)}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{formatZiG(p.netPay * exchangeRate)}</div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" size="sm"><Printer className="mr-2 h-3 w-3" />Print</Button>
                <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" />Download PDF</Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Inline: Settings ──────────────────────────────────────────────────

  if (viewMode === 'settings') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" /> Payroll Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure payroll module, statutory deductions, and payslip format</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payroll Period Defaults */}
          <SectionCard
            title={<span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-600" /> Payroll Period Defaults</span>}
            description="Set default processing period and pay day"
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Payroll Period</Label>
                <Select value={payrollSettings.payrollPeriodDefault} onValueChange={(v) => setPayrollSettings(s => ({ ...s, payrollPeriodDefault: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Default Pay Day</Label>
                <Input type="number" min="1" max="28" value={payrollSettings.payDayDefault} onChange={(e) => setPayrollSettings(s => ({ ...s, payDayDefault: e.target.value }))} />
                <p className="text-[10px] text-muted-foreground">Day of month (1-28)</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Auto-process Payroll</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically generate payslips on pay day</p>
                </div>
                <Switch checked={payrollSettings.autoProcess} onCheckedChange={(v) => setPayrollSettings(s => ({ ...s, autoProcess: v }))} />
              </div>
            </div>
          </SectionCard>

          {/* ZIMRA Tax Calculation */}
          <SectionCard
            title={<span className="flex items-center gap-2"><Calculator className="h-4 w-4 text-amber-600" /> ZIMRA Tax Rates</span>}
            description="Income tax (PAYE) calculation settings"
          >
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-400">
                <p className="font-semibold mb-1">Current PAYE Brackets (2024)</p>
                <p>$0–$300: 0% | $300–$1,500: 20% | $1,500–$5,000: 25%</p>
                <p>$5,000–$10,000: 30% | $10,000–$20,000: 35% | $20,000+: 40%</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">AIDS Levy Rate (% of PAYE)</Label>
                <Input type="number" step="0.1" value={payrollSettings.aidsLevyRate} onChange={(e) => setPayrollSettings(s => ({ ...s, aidsLevyRate: e.target.value }))} />
              </div>
            </div>
          </SectionCard>

          {/* NSSA Settings */}
          <SectionCard
            title={<span className="flex items-center gap-2"><Shield className="h-4 w-4 text-rose-600" /> NSSA Settings</span>}
            description="National Social Security Authority contributions"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">NSSA Rate (%)</Label>
                  <Input type="number" step="0.1" value={payrollSettings.nssaRate} onChange={(e) => setPayrollSettings(s => ({ ...s, nssaRate: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Max Insurable Earnings</Label>
                  <Input type="number" step="0.01" value={payrollSettings.nssaMaxEarnings} onChange={(e) => setPayrollSettings(s => ({ ...s, nssaMaxEarnings: e.target.value }))} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-400">
                Rate: {payrollSettings.nssaRate}% each (Employee + Employer). Maximum insurable earnings: ${payrollSettings.nssaMaxEarnings}/month.
              </div>
            </div>
          </SectionCard>

          {/* Deduction Types */}
          <SectionCard
            title={<span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-purple-600" /> Deduction Types</span>}
            description="Configure which deductions to apply"
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Active Deductions</Label>
                <Select value={payrollSettings.deductionTypes} onValueChange={(v) => setPayrollSettings(s => ({ ...s, deductionTypes: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All (PAYE, NSSA, AIDS, ZIMDEF)</SelectItem>
                    <SelectItem value="STATUTORY_ONLY">Statutory Only (PAYE, NSSA)</SelectItem>
                    <SelectItem value="PAYE_NSSA_AIDS">PAYE + NSSA + AIDS Levy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">ZIMDEF Rate (% of Gross)</Label>
                <Input type="number" step="0.1" value={payrollSettings.zimdefRate} onChange={(e) => setPayrollSettings(s => ({ ...s, zimdefRate: e.target.value }))} />
              </div>
            </div>
          </SectionCard>

          {/* Payslip Format */}
          <SectionCard
            title={<span className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-cyan-600" /> Payslip Format</span>}
            description="Customize payslip layout and details"
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Payslip Detail Level</Label>
                <Select value={payrollSettings.payslipFormat} onValueChange={(v) => setPayrollSettings(s => ({ ...s, payslipFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DETAILED">Detailed (full breakdown with dual currency)</SelectItem>
                    <SelectItem value="SIMPLE">Simple (earnings, deductions, net only)</SelectItem>
                    <SelectItem value="COMPACT">Compact (summary with key figures)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Show Dual Currency</Label>
                  <p className="text-[10px] text-muted-foreground">Display ZiG equivalent on payslips</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </SectionCard>

          {/* Bank Payment File */}
          <SectionCard
            title={<span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-600" /> Bank Payment File</span>}
            description="Format for bank salary payment upload files"
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">File Format</Label>
                <Select value={payrollSettings.bankFileFormat} onValueChange={(v) => setPayrollSettings(s => ({ ...s, bankFileFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV (Standard)</SelectItem>
                    <SelectItem value="OFX">OFX (Open Financial Exchange)</SelectItem>
                    <SelectItem value="BANK_ZW">Zimbabwe Bank Format</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 text-xs text-teal-700 dark:text-teal-400">
                The bank payment file contains net pay amounts and bank account details for all staff. Common Zimbabwe banks: CBZ, FBC, Stanbic, BancABC.
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => { toast.success('Payroll settings saved successfully') }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            Save Settings
          </Button>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Main List View ────────────────────────────────────────────────────

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

  return (
    <ModuleContainer>
      <ModulePageLayout
        actions={<>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthNames.map((m, i) => (<SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Payroll</TabsTrigger>
          <TabsTrigger value="process">Process Payroll</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="statutory">Statutory</TabsTrigger>
        </>}
      >
        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <span className="text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
              Rate: 1 USD = {exchangeRate.toFixed(1)} ZiG
            </span>
          </div>

          <StatGrid cols={4}>
            <ModuleStatCard
              icon={Banknote}
              label="Total Payroll"
              value={formatCurrency(stats?.totalPayroll || 0)}
              accentGradient="from-emerald-400 to-teal-500"
              hint={formatZiG((stats?.totalPayroll || 0) * exchangeRate)}
              trend={{ value: `${stats?.totalStaff || 0} staff`, positive: true }}
              index={0}
            />
            <ModuleStatCard
              icon={DollarSign}
              label="Net Pay This Month"
              value={formatCurrency(stats?.totalNetPay || 0)}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              hint={formatZiG((stats?.totalNetPay || 0) * exchangeRate)}
              trend={{ value: "After deductions", positive: true }}
              index={1}
            />
            <ModuleStatCard
              icon={Calculator}
              label="PAYE"
              value={formatCurrency(stats?.payeTotal || 0)}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              trend={{ value: "Income tax", positive: true }}
              index={2}
            />
            <ModuleStatCard
              icon={Shield}
              label="NSSA"
              value={formatCurrency((stats?.nssaEmployee || 0) + (stats?.nssaEmployer || 0))}
              accentGradient="from-rose-400 to-pink-500"
              bgColor="bg-rose-50 dark:bg-rose-950/40"
              iconColor="text-rose-600 dark:text-rose-400"
              trend={{ value: "Employee + Employer", positive: true }}
              index={3}
            />
          </StatGrid>

          <SectionCard title="Salary Distribution" description="Staff count by salary range (Gross Pay)">
            <ChartContainer config={distributionChartConfig} className="h-[250px] w-full">
              <BarChart data={distribution} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ChartContainer>
          </SectionCard>
        </TabsContent>

        {/* ─── Staff Payroll Tab ────────────────────────────────────────── */}
        <TabsContent value="staff" className="space-y-4">
          <SectionCard
            title="Staff Salary Breakdown"
            description="Basic salary, housing, transport, and responsibility allowances"
          >
            <TableShell maxHeight="500px">
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
                        {s.hasPayslip ? (<Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Generated</Badge>) : (<Badge variant="secondary" className="text-[10px]">Pending</Badge>)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {staff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No staff on payroll</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Process Payroll Tab ──────────────────────────────────────── */}
        <TabsContent value="process" className="space-y-4">
          <SectionCard
            title="Process Payroll"
            description="Generate payslips for the selected period"
          >
            <div className="space-y-6">
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
                  <p className="text-xs text-amber-700 mt-1">This will generate payslips for all active school-paid staff for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}. Existing payslips for this period will be skipped. PAYE, NSSA, AIDS Levy, and ZIMDEF will be calculated automatically.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" onClick={() => setViewMode('process-confirm')} disabled={stats?.payslipsGenerated === stats?.totalStaff}>
                  <Calculator className="mr-2 h-4 w-4" />
                  {stats?.payslipsGenerated === stats?.totalStaff ? 'Already Processed' : 'Process Payroll'}
                </Button>
                {stats?.payslipsGenerated && stats.payslipsGenerated > 0 && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {stats.payslipsGenerated} payslips already generated
                  </Badge>
                )}
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ─── Payslips Tab ─────────────────────────────────────────────── */}
        <TabsContent value="payslips" className="space-y-4">
          <SectionCard
            title="Generated Payslips"
            description={`${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`}
          >
            <TableShell
              isEmpty={payslips.length === 0}
              empty={
                <KitEmptyState
                  icon={FileText}
                  title="No payslips generated for this period"
                />
              }
            >
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
                      <TableRow key={p.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedPayslip(p); setViewMode('payslip-detail') }}>
                        <TableCell>
                          <p className="text-sm font-medium">{p.staff.firstName} {p.staff.lastName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.staff.staffNumber}</p>
                        </TableCell>
                        <TableCell className="text-sm">{p.staff.position}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(p.grossPay)}</TableCell>
                        <TableCell className="text-sm text-right font-mono text-red-600">-{formatCurrency(totalDeductions)}</TableCell>
                        <TableCell className="text-sm text-right font-bold font-mono text-emerald-600">{formatCurrency(p.netPay)}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{p.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setSelectedPayslip(p); setViewMode('payslip-detail') }}>
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
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Statutory Deductions Tab ─────────────────────────────────── */}
        <TabsContent value="statutory" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard title={<span className="flex items-center gap-2"><Calculator className="h-5 w-5 text-amber-600" /> PAYE Summary</span>}>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total PAYE Collected</span><span className="font-bold">{formatCurrency(stats?.payeTotal || 0)}</span></div>
                <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG((stats?.payeTotal || 0) * exchangeRate)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">AIDS Levy (6% of PAYE)</span><span className="font-bold">{formatCurrency(stats?.aidsLevy || 0)}</span></div>
                <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG((stats?.aidsLevy || 0) * exchangeRate)}</span></div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold"><span>Total to ZIMRA</span><span className="text-amber-600">{formatCurrency((stats?.payeTotal || 0) + (stats?.aidsLevy || 0))}</span></div>
                <div className="p-2 rounded bg-amber-50 text-xs text-amber-700">Due by 10th of following month. Late penalty: 100% + interest.</div>
              </div>
            </SectionCard>

            <SectionCard title={<span className="flex items-center gap-2"><Shield className="h-5 w-5 text-rose-600" /> NSSA Summary</span>}>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Employee Contribution</span><span className="font-bold">{formatCurrency(stats?.nssaEmployee || 0)}</span></div>
                <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG((stats?.nssaEmployee || 0) * exchangeRate)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Employer Contribution</span><span className="font-bold">{formatCurrency(stats?.nssaEmployer || 0)}</span></div>
                <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG((stats?.nssaEmployer || 0) * exchangeRate)}</span></div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold"><span>Total NSSA Remittance</span><span className="text-rose-600">{formatCurrency((stats?.nssaEmployee || 0) + (stats?.nssaEmployer || 0))}</span></div>
                <div className="p-2 rounded bg-rose-50 text-xs text-rose-700">Rate: 4.5% each. Maximum insurable earnings: $7,533.33/month.</div>
              </div>
            </SectionCard>

            <SectionCard title={<span className="flex items-center gap-2"><FileText className="h-5 w-5 text-teal-600" /> ZIMDEF</span>}>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">1% of Total Payroll</span><span className="font-bold">{formatCurrency(stats?.zimdef || 0)}</span></div>
                <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG((stats?.zimdef || 0) * exchangeRate)}</span></div>
                <div className="p-2 rounded bg-teal-50 text-xs text-teal-700">Zimbabwe Manpower Development Fund. Employer-only contribution.</div>
              </div>
            </SectionCard>

            <SectionCard title={<span className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600" /> AIDS Levy</span>}>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">6% of PAYE</span><span className="font-bold">{formatCurrency(stats?.aidsLevy || 0)}</span></div>
                <div className="flex justify-between text-[10px] text-muted-foreground"><span></span><span>{formatZiG((stats?.aidsLevy || 0) * exchangeRate)}</span></div>
                <div className="p-2 rounded bg-orange-50 text-xs text-orange-700">National AIDS Trust Fund. Paid together with PAYE to ZIMRA.</div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
