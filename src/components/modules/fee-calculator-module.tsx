'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator,
  DollarSign,
  ArrowRightLeft,
  GraduationCap,
  CreditCard,
  Award,
  Printer,
  Download,
  CheckCircle2,
  Info,
  TrendingUp,
  Users,
  Percent,
  ChevronRight,
  BedDouble,
  Bus,
  FileCheck,
  Monitor,
  Wrench,
  Heart,
  Globe,
  ArrowUpDown,
  BadgeCheck,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ModuleContainer, TableShell, ModulePageLayout } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

// ─── Fee Structure Data (Zimbabwe School Fees) ────────────────────────────────
const feeData: Record<string, { tuition: number; boarding: number }> = {
  'ECD A': { tuition: 150, boarding: 0 },
  'ECD B': { tuition: 150, boarding: 0 },
  'Grade 1': { tuition: 180, boarding: 0 },
  'Grade 2': { tuition: 180, boarding: 0 },
  'Grade 3': { tuition: 200, boarding: 0 },
  'Grade 4': { tuition: 200, boarding: 0 },
  'Grade 5': { tuition: 220, boarding: 0 },
  'Grade 6': { tuition: 220, boarding: 0 },
  'Grade 7': { tuition: 250, boarding: 0 },
  'Form 1': { tuition: 300, boarding: 350 },
  'Form 2': { tuition: 300, boarding: 350 },
  'Form 3': { tuition: 350, boarding: 400 },
  'Form 4': { tuition: 400, boarding: 450 },
  'Form 5': { tuition: 450, boarding: 500 },
  'Form 6': { tuition: 500, boarding: 550 },
}

const transportRoutes = [
  { id: 'route1', name: 'Harare CBD Route', fee: 80 },
  { id: 'route2', name: 'Borrowdale Route', fee: 60 },
  { id: 'route3', name: 'Chitungwiza Route', fee: 90 },
  { id: 'route4', name: 'Budiriro Route', fee: 70 },
  { id: 'route5', name: 'Mbare Route', fee: 50 },
  { id: 'none', name: 'No Transport', fee: 0 },
]

const additionalFees = [
  { id: 'exam', name: 'Exam Fees', amount: 50, icon: FileCheck },
  { id: 'it', name: 'IT Levy', amount: 40, icon: Monitor },
  { id: 'sports', name: 'Sports Fee', amount: 30, icon: TrendingUp },
  { id: 'development', name: 'Development Levy', amount: 60, icon: Wrench },
  { id: 'medical', name: 'Medical Fee', amount: 25, icon: Heart },
]

const beamCriteria = [
  'Orphan (one or both parents deceased)',
  'Child from a child-headed household',
  'Child with disability',
  'Child from extremely poor household',
  'Child living on the streets',
  'Child in conflict with the law',
  'Child in domestic servitude',
  'Child affected by HIV/AIDS',
]

// ─── Exchange Rate Data ───────────────────────────────────────────────────────
const RBZ_RATE = 28.5 // ZiG per USD (mock current rate)
const historicalRateData = [
  { month: 'Oct 2024', rate: 24.8 },
  { month: 'Nov 2024', rate: 25.9 },
  { month: 'Dec 2024', rate: 26.5 },
  { month: 'Jan 2025', rate: 27.2 },
  { month: 'Feb 2025', rate: 27.8 },
  { month: 'Mar 2025', rate: 28.5 },
]

const rateChartConfig = {
  rate: { label: 'ZiG/USD', color: '#10b981' },
} satisfies ChartConfig

// ─── Payment Plan Data ────────────────────────────────────────────────────────
const mockStudents = [
  { id: '1', name: 'Tendai Moyo', grade: 'Form 3', balance: 680, paid: 200 },
  { id: '2', name: 'Chido Ndlovu', grade: 'Form 1', balance: 650, paid: 0 },
  { id: '3', name: 'Kudzai Chikumbu', grade: 'Grade 7', balance: 250, paid: 150 },
  { id: '4', name: 'Rumbidzai Dube', grade: 'Form 5', balance: 950, paid: 400 },
  { id: '5', name: 'Tapiwa Gumbo', grade: 'Form 2', balance: 650, paid: 300 },
]

const mockPaymentPlans = [
  {
    id: '1',
    student: 'Tendai Moyo',
    grade: 'Form 3',
    totalOwed: 680,
    terms: 3,
    installment: 226.67,
    dueDates: ['Feb 15, 2025', 'May 15, 2025', 'Aug 15, 2025'],
    status: 'Active',
    paid: 2,
  },
  {
    id: '2',
    student: 'Chido Ndlovu',
    grade: 'Form 1',
    totalOwed: 650,
    terms: 2,
    installment: 325.00,
    dueDates: ['Feb 15, 2025', 'May 15, 2025'],
    status: 'Pending',
    paid: 0,
  },
  {
    id: '3',
    student: 'Rumbidzai Dube',
    grade: 'Form 5',
    totalOwed: 950,
    terms: 1,
    installment: 902.50,
    dueDates: ['Feb 15, 2025'],
    status: 'Completed',
    paid: 1,
  },
]

// ─── Scholarship Data ─────────────────────────────────────────────────────────
const scholarships = [
  {
    id: 'beam',
    name: 'BEAM (Basic Education Assistance Module)',
    provider: 'Government of Zimbabwe',
    coverage: '100% Tuition + Levies',
    value: 630,
    criteria: ['Orphan/Vulnerable', 'Extreme poverty', 'Child-headed household'],
    recipients: 45,
    status: 'Active',
  },
  {
    id: 'sdc',
    name: 'SDC Bursary',
    provider: 'School Development Committee',
    coverage: '50-75% Tuition',
    value: 315,
    criteria: ['Financial hardship', 'Academic potential', 'Parent at SDC school'],
    recipients: 12,
    status: 'Active',
  },
  {
    id: 'academic',
    name: 'Academic Merit Scholarship',
    provider: 'School / Corporate Donors',
    coverage: '100% Tuition',
    value: 500,
    criteria: ['Top 3 in grade', 'A* average', 'Consistent performance'],
    recipients: 6,
    status: 'Active',
  },
  {
    id: 'sports',
    name: 'Sports Excellence Award',
    provider: 'Ministry of Sport / Sponsors',
    coverage: '50% Tuition + Sports Fee',
    value: 265,
    criteria: ['Provincial team member', 'National competition qualifier', 'Good academic standing'],
    recipients: 4,
    status: 'Active',
  },
  {
    id: 'ovc',
    name: 'Orphan & Vulnerable Children Fund',
    provider: 'NGO Partners / Church',
    coverage: '100% Tuition + Boarding',
    value: 850,
    criteria: ['Double orphan', 'No guardian income', 'Community referral'],
    recipients: 8,
    status: 'Active',
  },
]

const scholarshipTypeChartConfig = {
  count: { label: 'Recipients', color: '#10b981' },
} satisfies ChartConfig

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FeeCalculatorModule() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <ModuleContainer>

      {/* Tabs */}
      <ModulePageLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calculator">Fee Calculator</TabsTrigger>
            <TabsTrigger value="currency">Currency Converter</TabsTrigger>
            <TabsTrigger value="payments">Payment Plans</TabsTrigger>
            <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
          </>}
      >


        <TabsContent value="overview"><OverviewTab onNavigate={setActiveTab} /></TabsContent>
        <TabsContent value="calculator"><FeeCalculatorTab /></TabsContent>
        <TabsContent value="currency"><CurrencyConverterTab /></TabsContent>
        <TabsContent value="payments"><PaymentPlansTab /></TabsContent>
        <TabsContent value="scholarships"><ScholarshipsTab /></TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const stats = [
    { icon: Calculator, label: 'Fee Structures', value: '15', color: 'text-emerald-600 bg-emerald-50' },
    { icon: Award, label: 'Active Scholarships', value: '5', color: 'text-amber-600 bg-amber-50' },
    { icon: ArrowRightLeft, label: 'Exchange Rate', value: '1 USD = 28.5 ZiG', color: 'text-teal-600 bg-teal-50' },
    { icon: Percent, label: 'Collection Rate', value: '78.5%', color: 'text-violet-600 bg-violet-50' },
  ]

  const actions = [
    { icon: Calculator, label: 'Calculate Fees', desc: 'Compute fees for any grade level', color: 'from-emerald-500 to-teal-600', tab: 'calculator' },
    { icon: ArrowRightLeft, label: 'Currency Converter', desc: 'USD ↔ ZiG conversion', color: 'from-teal-500 to-cyan-600', tab: 'currency' },
    { icon: Award, label: 'Scholarship Eligibility', desc: 'Check BEAM and other scholarships', color: 'from-amber-500 to-orange-600', tab: 'scholarships' },
    { icon: CreditCard, label: 'Payment Plan Generator', desc: 'Create installment plans', color: 'from-violet-500 to-purple-600', tab: 'payments' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white overflow-hidden relative">
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="max-w-lg">
              <h2 className="text-xl font-bold mb-2">Fee Calculator & Currency Tools</h2>
              <p className="text-emerald-100 text-sm leading-relaxed">
                Calculate school fees for any grade level with boarding, transport, and additional levies. 
                Convert between USD and Zimbabwe Gold (ZiG) at current RBZ rates. Generate payment plans 
                and check scholarship eligibility including BEAM.
              </p>
            </div>
            <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Calculator className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card
            key={action.label}
            className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
            onClick={() => onNavigate(action.tab)}
          >
            <CardContent className="p-5">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r text-white mb-3 group-hover:scale-110 transition-transform', action.color)}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{action.label}</h3>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fee Summary Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Fee Structure Summary (USD per Term)</CardTitle>
          <CardDescription>Quick reference for tuition and boarding fees across all grade levels</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TableShell maxHeight="320px" className="border-0 rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Grade Level</TableHead>
                  <TableHead className="text-xs text-right">Tuition (Day)</TableHead>
                  <TableHead className="text-xs text-right">Boarding</TableHead>
                  <TableHead className="text-xs text-right">Total (Boarder)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(feeData).map(([grade, fees]) => (
                  <TableRow key={grade} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{grade}</TableCell>
                    <TableCell className="text-sm text-right font-mono">${fees.tuition}</TableCell>
                    <TableCell className="text-sm text-right font-mono">{fees.boarding > 0 ? `$${fees.boarding}` : '—'}</TableCell>
                    <TableCell className="text-sm text-right font-bold font-mono text-emerald-600">
                      {fees.boarding > 0 ? `$${fees.tuition + fees.boarding}` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Fee Calculator Tab ──────────────────────────────────────────────────────
function FeeCalculatorTab() {
  const [grade, setGrade] = useState('Form 1')
  const [boarding, setBoarding] = useState<'day' | 'boarder'>('day')
  const [transport, setTransport] = useState('none')
  const [selectedAdditional, setSelectedAdditional] = useState<string[]>([])
  const [beamChecks, setBeamChecks] = useState<string[]>([])

  const calculation = useMemo(() => {
    const gradeFees = feeData[grade] || { tuition: 0, boarding: 0 }
    const tuition = gradeFees.tuition
    const boardingFee = boarding === 'boarder' ? gradeFees.boarding : 0
    const transportRoute = transportRoutes.find(r => r.id === transport)
    const transportFee = transportRoute?.fee || 0
    const additionalTotal = selectedAdditional.reduce((sum, id) => {
      const fee = additionalFees.find(f => f.id === id)
      return sum + (fee?.amount || 0)
    }, 0)
    const total = tuition + boardingFee + transportFee + additionalTotal

    return { tuition, boardingFee, transportFee, additionalTotal, total }
  }, [grade, boarding, transport, selectedAdditional])

  const toggleAdditional = (id: string) => {
    setSelectedAdditional(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  const toggleBeam = (criterion: string) => {
    setBeamChecks(prev => prev.includes(criterion) ? prev.filter(c => c !== criterion) : [...prev, criterion])
  }

  const beamEligible = beamChecks.length >= 2

  // Day vs Boarding comparison
  const gradeFees = feeData[grade] || { tuition: 0, boarding: 0 }
  const dayTotal = gradeFees.tuition + calculation.transportFee + calculation.additionalTotal
  const boarderTotal = gradeFees.tuition + (gradeFees.boarding || 0) + calculation.additionalTotal

  const handlePrintFeeStatement = () => {
    const content = `
      <h2 style="text-align:center;color:#10b981;">ZimSchool Pro - Fee Statement</h2>
      <h3 style="text-align:center;">Grade: ${grade} | ${boarding === 'boarder' ? 'Boarder' : 'Day Scholar'}</h3>
      <hr/>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <tr><td style="padding:8px;border:1px solid #ddd;">Tuition</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">$${calculation.tuition.toFixed(2)}</td></tr>
        ${boarding === 'boarder' ? `<tr><td style="padding:8px;border:1px solid #ddd;">Boarding</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">$${calculation.boardingFee.toFixed(2)}</td></tr>` : ''}
        ${calculation.transportFee > 0 ? `<tr><td style="padding:8px;border:1px solid #ddd;">Transport</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">$${calculation.transportFee.toFixed(2)}</td></tr>` : ''}
        ${selectedAdditional.map(id => { const f = additionalFees.find(af => af.id === id); return f ? `<tr><td style="padding:8px;border:1px solid #ddd;">${f.name}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">$${f.amount.toFixed(2)}</td></tr>` : '' }).join('')}
        <tr style="font-weight:bold;background:#ecfdf5;"><td style="padding:8px;border:1px solid #ddd;">Total (per term)</td><td style="padding:8px;border:1px solid #ddd;text-align:right;color:#10b981;">$${calculation.total.toFixed(2)}</td></tr>
        <tr style="font-weight:bold;"><td style="padding:8px;border:1px solid #ddd;">Annual (3 terms)</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">$${(calculation.total * 3).toFixed(2)}</td></tr>
      </table>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Fee Statement</title></head><body>${content}</body></html>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Card */}
        <Card className="border-0 shadow-md lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Configure Fee Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Grade Level</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(feeData).map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Boarding Status</Label>
              <div className="flex gap-2">
                <Button
                  variant={boarding === 'day' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('flex-1', boarding === 'day' && 'bg-emerald-600 hover:bg-emerald-700')}
                  onClick={() => setBoarding('day')}
                >
                  <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                  Day Scholar
                </Button>
                <Button
                  variant={boarding === 'boarder' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('flex-1', boarding === 'boarder' && 'bg-emerald-600 hover:bg-emerald-700')}
                  onClick={() => setBoarding('boarder')}
                >
                  <BedDouble className="mr-1.5 h-3.5 w-3.5" />
                  Boarder
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Transport Route</Label>
              <Select value={transport} onValueChange={setTransport}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {transportRoutes.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} {r.fee > 0 ? `(+$${r.fee})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Additional Fees</Label>
              <div className="space-y-2">
                {additionalFees.map(fee => (
                  <div key={fee.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`fee-${fee.id}`}
                      checked={selectedAdditional.includes(fee.id)}
                      onCheckedChange={() => toggleAdditional(fee.id)}
                    />
                    <label htmlFor={`fee-${fee.id}`} className="text-sm flex-1 cursor-pointer">{fee.name}</label>
                    <span className="text-sm font-mono text-muted-foreground">${fee.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Fee Breakdown</CardTitle>
              <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handlePrintFeeStatement}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print Statement
              </Button>
            </div>
            <CardDescription>{grade} — {boarding === 'boarder' ? 'Boarder' : 'Day Scholar'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                <span className="text-sm">Tuition Fee</span>
                <span className="text-sm font-mono font-semibold">${calculation.tuition.toFixed(2)}</span>
              </div>
              {boarding === 'boarder' && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Boarding Fee</span>
                  <span className="text-sm font-mono font-semibold">${calculation.boardingFee.toFixed(2)}</span>
                </div>
              )}
              {calculation.transportFee > 0 && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Transport ({transportRoutes.find(r => r.id === transport)?.name})</span>
                  <span className="text-sm font-mono font-semibold">${calculation.transportFee.toFixed(2)}</span>
                </div>
              )}
              {selectedAdditional.map(id => {
                const fee = additionalFees.find(f => f.id === id)
                return fee ? (
                  <div key={id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                    <span className="text-sm">{fee.name}</span>
                    <span className="text-sm font-mono font-semibold">${fee.amount.toFixed(2)}</span>
                  </div>
                ) : null
              })}
              <Separator />
              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                <span className="text-base font-semibold">Total per Term</span>
                <span className="text-xl font-bold font-mono text-emerald-600">${calculation.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                <span className="text-sm">Annual (3 Terms)</span>
                <span className="text-sm font-mono font-bold">${(calculation.total * 3).toFixed(2)}</span>
              </div>
            </div>

            {/* Day vs Boarding Comparison */}
            {gradeFees.boarding > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Day vs Boarding Comparison</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn('p-4 rounded-xl border-2 transition-colors', boarding === 'day' ? 'border-emerald-300 bg-emerald-50' : 'border-muted')}>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold">Day Scholar</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">${dayTotal.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">per term</p>
                  </div>
                  <div className={cn('p-4 rounded-xl border-2 transition-colors', boarding === 'boarder' ? 'border-emerald-300 bg-emerald-50' : 'border-muted')}>
                    <div className="flex items-center gap-2 mb-2">
                      <BedDouble className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold">Boarder</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">${boarderTotal.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">per term</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Boarding premium: <span className="font-semibold text-emerald-600">${(boarderTotal - dayTotal).toFixed(2)}/term</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BEAM Eligibility */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
            BEAM Scholarship Eligibility Checker
          </CardTitle>
          <CardDescription>Select all criteria that apply. Meeting 2+ criteria qualifies for BEAM assistance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {beamCriteria.map(criterion => (
              <div key={criterion} className="flex items-start gap-2 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                <Checkbox
                  id={`beam-${criterion}`}
                  checked={beamChecks.includes(criterion)}
                  onCheckedChange={() => toggleBeam(criterion)}
                  className="mt-0.5"
                />
                <label htmlFor={`beam-${criterion}`} className="text-sm cursor-pointer">{criterion}</label>
              </div>
            ))}
          </div>
          <div className={cn('p-4 rounded-xl border-2 flex items-center gap-3 transition-all', beamEligible ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200 bg-amber-50')}>
            {beamEligible ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Eligible for BEAM</p>
                  <p className="text-xs text-emerald-600">This student meets {beamChecks.length} vulnerability criteria and may qualify for full fee assistance.</p>
                </div>
              </>
            ) : (
              <>
                <Info className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">Not Yet Eligible</p>
                  <p className="text-xs text-amber-600">Select at least 2 vulnerability criteria to qualify. Currently {beamChecks.length} selected.</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Currency Converter Tab ───────────────────────────────────────────────────
function CurrencyConverterTab() {
  const [usdAmount, setUsdAmount] = useState('100')
  const [zigAmount, setZigAmount] = useState('')
  const [customRate, setCustomRate] = useState(RBZ_RATE.toString())
  const [useCustomRate, setUseCustomRate] = useState(false)
  const [convertDirection, setConvertDirection] = useState<'usd-to-zig' | 'zig-to-usd'>('usd-to-zig')
  const [batchAmounts, setBatchAmounts] = useState('50, 100, 150, 200, 300, 500')

  const currentRate = useCustomRate ? parseFloat(customRate) || RBZ_RATE : RBZ_RATE

  const convertedAmount = useMemo(() => {
    if (convertDirection === 'usd-to-zig') {
      const usd = parseFloat(usdAmount) || 0
      return (usd * currentRate).toFixed(2)
    } else {
      const zig = parseFloat(zigAmount) || 0
      return (zig / currentRate).toFixed(2)
    }
  }, [usdAmount, zigAmount, currentRate, convertDirection])

  const batchResults = useMemo(() => {
    return batchAmounts.split(',').map(a => {
      const amount = parseFloat(a.trim()) || 0
      return {
        usd: amount,
        zig: (amount * currentRate).toFixed(2),
      }
    })
  }, [batchAmounts, currentRate])

  // Fee structure in both currencies
  const feeInBothCurrencies = useMemo(() => {
    return Object.entries(feeData).map(([grade, fees]) => ({
      grade,
      tuitionUSD: fees.tuition,
      tuitionZiG: (fees.tuition * currentRate).toFixed(2),
      boardingUSD: fees.boarding,
      boardingZiG: fees.boarding > 0 ? (fees.boarding * currentRate).toFixed(2) : '—',
    }))
  }, [currentRate])

  const handleExportReport = () => {
    const headers = ['USD Amount', `ZiG Amount (Rate: ${currentRate})`]
    const rows = batchResults.map(r => [r.usd.toString(), r.zig])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `currency-conversion-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Main Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              USD ↔ ZiG Converter
            </CardTitle>
            <CardDescription>Zimbabwe Gold (ZiG) — Current RBZ Rate: 1 USD = {RBZ_RATE} ZiG</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 grid gap-2">
                <Label>USD Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                  <Input
                    type="number"
                    value={convertDirection === 'usd-to-zig' ? usdAmount : convertedAmount}
                    onChange={e => {
                      if (convertDirection === 'usd-to-zig') setUsdAmount(e.target.value)
                      else setZigAmount(e.target.value)
                    }}
                    className="pl-7 font-mono"
                    readOnly={convertDirection === 'zig-to-usd'}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="mt-6 h-10 w-10 rounded-full border-emerald-200 hover:bg-emerald-50"
                onClick={() => setConvertDirection(d => d === 'usd-to-zig' ? 'zig-to-usd' : 'usd-to-zig')}
              >
                <ArrowUpDown className="h-4 w-4 text-emerald-600" />
              </Button>
              <div className="flex-1 grid gap-2">
                <Label>ZiG Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">ZiG</span>
                  <Input
                    type="number"
                    value={convertDirection === 'zig-to-usd' ? zigAmount : convertedAmount}
                    onChange={e => {
                      if (convertDirection === 'zig-to-usd') setZigAmount(e.target.value)
                      else setUsdAmount(e.target.value)
                    }}
                    className="pl-11 font-mono"
                    readOnly={convertDirection === 'usd-to-zig'}
                  />
                </div>
              </div>
            </div>

            {/* Rate Info */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Exchange Rate</p>
                  <p className="text-lg font-bold text-emerald-700 font-mono">1 USD = {currentRate} ZiG</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-semibold text-emerald-700">RBZ Official</p>
                </div>
              </div>
            </div>

            {/* Custom Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="custom-rate"
                  checked={useCustomRate}
                  onCheckedChange={(checked) => setUseCustomRate(checked === true)}
                />
                <label htmlFor="custom-rate" className="text-sm cursor-pointer">Use custom exchange rate</label>
              </div>
              {useCustomRate && (
                <div className="grid gap-2">
                  <Label>Custom Rate (ZiG per USD)</Label>
                  <Input
                    type="number"
                    value={customRate}
                    onChange={e => setCustomRate(e.target.value)}
                    className="font-mono"
                    step="0.1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Historical Rate Trend */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Exchange Rate Trend (Last 6 Months)</CardTitle>
            <CardDescription>ZiG per USD — Official RBZ Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={rateChartConfig} className="h-[260px] w-full">
              <LineChart data={historicalRateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Batch Conversion */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Batch Conversion Table</CardTitle>
              <CardDescription>Enter USD amounts separated by commas to see ZiG equivalents</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleExportReport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>USD Amounts (comma-separated)</Label>
            <Input
              value={batchAmounts}
              onChange={e => setBatchAmounts(e.target.value)}
              placeholder="50, 100, 150, 200"
              className="font-mono"
            />
          </div>
          <TableShell>
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="text-xs">USD ($)</TableHead>
                <TableHead className="text-xs text-right">ZiG (ZiG$)</TableHead>
                <TableHead className="text-xs text-right">Rate Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchResults.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-mono font-semibold">${row.usd.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-right font-mono font-bold text-emerald-600">ZiG {row.zig}</TableCell>
                  <TableCell className="text-sm text-right text-muted-foreground">1:{currentRate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableShell>
        </CardContent>
      </Card>

      {/* Fee Amount Converter */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Fee Structure in Both Currencies</CardTitle>
          <CardDescription>Tuition and boarding fees converted at rate 1 USD = {currentRate} ZiG</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TableShell maxHeight="350px" className="border-0 rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Grade</TableHead>
                  <TableHead className="text-xs text-right">Tuition (USD)</TableHead>
                  <TableHead className="text-xs text-right">Tuition (ZiG)</TableHead>
                  <TableHead className="text-xs text-right">Boarding (USD)</TableHead>
                  <TableHead className="text-xs text-right">Boarding (ZiG)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeInBothCurrencies.map(row => (
                  <TableRow key={row.grade} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{row.grade}</TableCell>
                    <TableCell className="text-sm text-right font-mono">${row.tuitionUSD}</TableCell>
                    <TableCell className="text-sm text-right font-mono text-emerald-600">ZiG {row.tuitionZiG}</TableCell>
                    <TableCell className="text-sm text-right font-mono">{row.boardingUSD > 0 ? `$${row.boardingUSD}` : '—'}</TableCell>
                    <TableCell className="text-sm text-right font-mono text-emerald-600">{row.boardingZiG}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Payment Plans Tab ────────────────────────────────────────────────────────
function PaymentPlansTab() {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [planTerms, setPlanTerms] = useState('3')
  const [showPlanResult, setShowPlanResult] = useState(false)
  const [earlyPayment, setEarlyPayment] = useState<'none' | 'half' | 'full'>('none')

  const student = mockStudents.find(s => s.id === selectedStudent)
  const outstandingBalance = student?.balance || 0
  const paidAmount = student?.paid || 0

  const earlyDiscount = (() => {
    if (earlyPayment === 'full') return outstandingBalance * 0.05
    if (earlyPayment === 'half') return (outstandingBalance / 2) * 0.02
    return 0
  })()

  const planCalculation = (() => {
    const terms = parseInt(planTerms) || 1
    const afterDiscount = outstandingBalance - earlyDiscount
    const perTerm = afterDiscount / terms
    const perMonth = perTerm / 3 // 3 months per term approx
    return { terms, afterDiscount, perTerm, perMonth }
  })()

  const handlePrintPlan = () => {
    if (!student) return
    const content = `
      <h2 style="text-align:center;color:#10b981;">ZimSchool Pro - Payment Plan Agreement</h2>
      <hr/>
      <p><strong>Student:</strong> ${student.name}</p>
      <p><strong>Grade:</strong> ${student.grade}</p>
      <p><strong>Outstanding Balance:</strong> $${outstandingBalance.toFixed(2)}</p>
      ${earlyDiscount > 0 ? `<p><strong>Early Payment Discount:</strong> -$${earlyDiscount.toFixed(2)}</p>` : ''}
      <p><strong>Amount After Discount:</strong> $${planCalculation.afterDiscount.toFixed(2)}</p>
      <hr/>
      <p><strong>Payment Terms:</strong> ${planCalculation.terms} term(s)</p>
      <p><strong>Installment per Term:</strong> $${planCalculation.perTerm.toFixed(2)}</p>
      <p><strong>Monthly Approx:</strong> $${planCalculation.perMonth.toFixed(2)}</p>
      <hr/>
      <p style="margin-top:30px;">Signature: _________________________</p>
      <p>Date: _________________________</p>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Payment Plan</title></head><body>${content}</body></html>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Generate Payment Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Select Student</Label>
              <Select value={selectedStudent} onValueChange={v => { setSelectedStudent(v); setShowPlanResult(false) }}>
                <SelectTrigger><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                <SelectContent>
                  {mockStudents.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {student && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                <p className="text-xl font-bold font-mono text-amber-700">${outstandingBalance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Already paid: ${paidAmount.toFixed(2)}</p>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Payment Terms</Label>
              <Select value={planTerms} onValueChange={setPlanTerms}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Term (Full Payment)</SelectItem>
                  <SelectItem value="2">2 Terms</SelectItem>
                  <SelectItem value="3">3 Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Early Payment Discount</Label>
              <div className="flex gap-2">
                <Button variant={earlyPayment === 'none' ? 'default' : 'outline'} size="sm" className={cn('flex-1 text-xs', earlyPayment === 'none' && 'bg-emerald-600')} onClick={() => setEarlyPayment('none')}>None</Button>
                <Button variant={earlyPayment === 'half' ? 'default' : 'outline'} size="sm" className={cn('flex-1 text-xs', earlyPayment === 'half' && 'bg-emerald-600')} onClick={() => setEarlyPayment('half')}>2% (Half)</Button>
                <Button variant={earlyPayment === 'full' ? 'default' : 'outline'} size="sm" className={cn('flex-1 text-xs', earlyPayment === 'full' && 'bg-emerald-600')} onClick={() => setEarlyPayment('full')}>5% (Full)</Button>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              disabled={!selectedStudent}
              onClick={() => setShowPlanResult(true)}
            >
              Generate Payment Plan
            </Button>
          </CardContent>
        </Card>

        {/* Plan Result */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Payment Plan Summary</CardTitle>
              {showPlanResult && student && (
                <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handlePrintPlan}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print Agreement
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!showPlanResult || !student ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a student and generate a plan to see results</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Student</span>
                  <span className="text-sm font-semibold">{student.name}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Grade</span>
                  <span className="text-sm font-semibold">{student.grade}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Outstanding Balance</span>
                  <span className="text-sm font-mono font-semibold">${outstandingBalance.toFixed(2)}</span>
                </div>
                {earlyDiscount > 0 && (
                  <div className="flex justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-emerald-700">Early Payment Discount</span>
                    <span className="text-sm font-mono font-semibold text-emerald-700">-${earlyDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Amount After Discount</span>
                  <span className="text-sm font-mono font-semibold">${planCalculation.afterDiscount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                  <span className="text-base font-semibold">Per Term Installment</span>
                  <span className="text-xl font-bold font-mono text-emerald-600">${planCalculation.perTerm.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Monthly Approx.</span>
                  <span className="text-sm font-mono font-bold">${planCalculation.perMonth.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm">Number of Terms</span>
                  <span className="text-sm font-semibold">{planCalculation.terms}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Existing Payment Plans */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Active Payment Plans</CardTitle>
          <CardDescription>Currently active payment plans for students</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TableShell className="border-0 rounded-none">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Grade</TableHead>
                <TableHead className="text-xs text-right">Total Owed</TableHead>
                <TableHead className="text-xs">Terms</TableHead>
                <TableHead className="text-xs text-right">Installment</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPaymentPlans.map(plan => (
                <TableRow key={plan.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{plan.student}</TableCell>
                  <TableCell className="text-sm">{plan.grade}</TableCell>
                  <TableCell className="text-sm text-right font-mono">${plan.totalOwed.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{plan.terms}</TableCell>
                  <TableCell className="text-sm text-right font-mono font-semibold">${plan.installment.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px]', plan.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : plan.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[80px]">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(plan.paid / plan.terms) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{plan.paid}/{plan.terms}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableShell>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Scholarships Tab ─────────────────────────────────────────────────────────
function ScholarshipsTab() {
  const [eligibilityCriteria, setEligibilityCriteria] = useState<string[]>([])
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [applicationScholarship, setApplicationScholarship] = useState('')

  const allCriteria = Array.from(new Set(scholarships.flatMap(s => s.criteria)))

  const matchingScholarships = eligibilityCriteria.length === 0
    ? scholarships
    : scholarships.filter(s => s.criteria.some(c => eligibilityCriteria.includes(c)))

  const toggleCriterion = (c: string) => {
    setEligibilityCriteria(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const totalScholars = scholarships.reduce((sum, s) => sum + s.recipients, 0)
  const totalValue = scholarships.reduce((sum, s) => sum + s.recipients * s.value, 0)

  const scholarshipTypeData = scholarships.map(s => ({ name: s.name.split(' ')[0], count: s.recipients }))

  const handleApply = (scholarshipId: string) => {
    setApplicationScholarship(scholarshipId)
    setShowApplicationDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Scholars</p>
                <p className="text-lg font-bold">{totalScholars}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-lg font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Programs</p>
                <p className="text-lg font-bold">{scholarships.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Percent className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Coverage Avg</p>
                <p className="text-lg font-bold">75%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Eligibility Checker */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Eligibility Checker</CardTitle>
            <CardDescription>Select criteria to find matching scholarships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allCriteria.map(criterion => (
                <div key={criterion} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Checkbox
                    id={`elig-${criterion}`}
                    checked={eligibilityCriteria.includes(criterion)}
                    onCheckedChange={() => toggleCriterion(criterion)}
                    className="mt-0.5"
                  />
                  <label htmlFor={`elig-${criterion}`} className="text-xs cursor-pointer leading-tight">{criterion}</label>
                </div>
              ))}
            </div>
            {eligibilityCriteria.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-700 font-semibold">{matchingScholarships.length} matching scholarship(s)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scholarships List */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Available Scholarships</CardTitle>
            <CardDescription>{matchingScholarships.length} programs available</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {matchingScholarships.map(scholarship => (
                  <div key={scholarship.id} className="p-4 rounded-xl border hover:shadow-sm transition-all hover:border-emerald-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold">{scholarship.name}</h4>
                        <p className="text-xs text-muted-foreground">{scholarship.provider}</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{scholarship.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Coverage</p>
                        <p className="text-xs font-semibold">{scholarship.coverage}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Value</p>
                        <p className="text-xs font-semibold text-emerald-600">${scholarship.value}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Recipients</p>
                        <p className="text-xs font-semibold">{scholarship.recipients}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap mt-3">
                      {scholarship.criteria.map(c => (
                        <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50">
                          {c}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => handleApply(scholarship.id)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* By Type Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Scholarship Recipients by Program</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={scholarshipTypeChartConfig} className="h-[220px] w-full">
            <BarChart data={scholarshipTypeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scholarship Application</DialogTitle>
            <DialogDescription>Apply for {scholarships.find(s => s.id === applicationScholarship)?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Student Name</Label>
              <Input placeholder="Enter student's full name" />
            </div>
            <div className="grid gap-2">
              <Label>Grade</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(feeData).map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Motivation / Supporting Information</Label>
              <Textarea placeholder="Explain why this student qualifies for the scholarship..." className="min-h-[80px]" />
            </div>
            <div className="grid gap-2">
              <Label>Supporting Documents</Label>
              <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center">
                <p className="text-xs text-muted-foreground">Upload supporting documents (death certificates, income proof, etc.)</p>
                <Button variant="outline" size="sm" className="mt-2 border-emerald-200 text-emerald-700">Choose Files</Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => setShowApplicationDialog(false)}>
                Submit Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
