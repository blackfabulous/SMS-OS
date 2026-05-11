'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  FileText,
  Download,
  Printer,
  GraduationCap,
  DollarSign,
  Users,
  Heart,
  Building,
  Loader2,
  ChevronRight,
  Eye,
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Shield,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import { cn } from '@/lib/utils'
import { exportToCSV, printReport, buildHTMLTable } from '@/lib/export-utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Report Categories ───────────────────────────────────────────────────────

const reportCategories = [
  { id: 'academic', label: 'Academic', icon: GraduationCap, color: 'from-emerald-500 to-teal-600', bgLight: 'bg-emerald-50' },
  { id: 'finance', label: 'Finance', icon: DollarSign, color: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50' },
  { id: 'hr', label: 'HR', icon: Users, color: 'from-teal-500 to-cyan-600', bgLight: 'bg-teal-50' },
  { id: 'welfare', label: 'Welfare', icon: Heart, color: 'from-rose-500 to-pink-600', bgLight: 'bg-rose-50' },
  { id: 'emis', label: 'EMIS', icon: Building, color: 'from-cyan-500 to-teal-600', bgLight: 'bg-cyan-50' },
]

const academicReports = [
  { id: 'pass_rate', name: 'Pass Rate Analysis', description: 'Subject and grade pass rate trends' },
  { id: 'subject_perf', name: 'Subject Performance', description: 'Performance by subject across grades' },
  { id: 'learner_progress', name: 'Learner Progress Report', description: 'Individual learner progress tracking' },
  { id: 'promotion_list', name: 'Promotion List', description: 'Students meeting promotion criteria' },
]

const financeReports = [
  { id: 'income_stmt', name: 'Income Statement', description: 'Revenue and expenses summary' },
  { id: 'debtor_ageing', name: 'Debtor Ageing', description: 'Outstanding fees by age' },
  { id: 'fee_collection', name: 'Fee Collection Report', description: 'Collection rates and trends' },
  { id: 'budget_vs_actual', name: 'Budget vs Actual', description: 'Budget performance analysis' },
]

const hrReports = [
  { id: 'staff_list', name: 'Staff List', description: 'Complete staff directory' },
  { id: 'leave_report', name: 'Leave Report', description: 'Leave usage and balances' },
  { id: 'payroll_summary', name: 'Payroll Summary', description: 'Monthly payroll breakdown' },
]

const welfareReports = [
  { id: 'beam_report', name: 'BEAM Report', description: 'BEAM beneficiaries and coverage' },
  { id: 'vulnerable', name: 'Vulnerable Learners', description: 'Students needing support' },
  { id: 'discipline_incidents', name: 'Discipline Incidents', description: 'Incident summary and trends' },
]

const emisReports = [
  { id: 'enrollment_census', name: 'Enrollment Census', description: 'EMIS enrollment return data' },
  { id: 'teacher_data', name: 'Teacher Data Return', description: 'Staff qualifications and deployment' },
  { id: 'infrastructure', name: 'Infrastructure Return', description: 'Facilities and equipment data' },
  { id: 'textbook_data', name: 'Textbook Data', description: 'Textbook inventory and ratios' },
]

const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']

const barChartConfig = {
  value: { label: 'Value', color: '#10b981' },
} satisfies ChartConfig

// ─── Simulated Report Data ───────────────────────────────────────────────────

function getReportData(reportId: string) {
  switch (reportId) {
    case 'pass_rate':
      return {
        title: 'Pass Rate Analysis',
        summary: [
          { label: 'Overall Pass Rate', value: '72.4%', trend: 'up' as const },
          { label: 'Grade 7 Pass Rate', value: '85.2%', trend: 'up' as const },
          { label: 'O Level Pass Rate', value: '68.7%', trend: 'down' as const },
          { label: 'Subjects Above 80%', value: '12', trend: 'up' as const },
        ],
        chart: [
          { name: 'Form 1', value: 78 },
          { name: 'Form 2', value: 74 },
          { name: 'Form 3', value: 71 },
          { name: 'Form 4', value: 69 },
          { name: 'Form 5', value: 75 },
          { name: 'Form 6', value: 80 },
        ],
        table: [
          { subject: 'Mathematics', passRate: '65%', avgMark: 52, entries: 120 },
          { subject: 'English', passRate: '78%', avgMark: 58, entries: 125 },
          { subject: 'Science', passRate: '71%', avgMark: 55, entries: 118 },
          { subject: 'History', passRate: '82%', avgMark: 62, entries: 95 },
          { subject: 'Geography', passRate: '76%', avgMark: 57, entries: 88 },
        ],
      }
    case 'fee_collection':
      return {
        title: 'Fee Collection Report',
        summary: [
          { label: 'Total Invoiced', value: '$530,000', trend: 'up' as const },
          { label: 'Total Collected', value: '$463,750', trend: 'up' as const },
          { label: 'Collection Rate', value: '87.5%', trend: 'up' as const },
          { label: 'Outstanding', value: '$66,250', trend: 'down' as const },
        ],
        chart: [
          { name: 'Jan', value: 85000 },
          { name: 'Feb', value: 92000 },
          { name: 'Mar', value: 78000 },
          { name: 'Apr', value: 96000 },
          { name: 'May', value: 88000 },
          { name: 'Jun', value: 91000 },
        ],
        table: [
          { method: 'Cash', amount: '$185,000', count: 245 },
          { method: 'Bank Transfer', amount: '$156,250', count: 89 },
          { method: 'Mobile Money', amount: '$78,500', count: 167 },
          { method: 'EcoCash', amount: '$44,000', count: 98 },
        ],
      }
    case 'staff_list':
      return {
        title: 'Staff Directory',
        summary: [
          { label: 'Total Staff', value: '42', trend: 'up' as const },
          { label: 'Teaching', value: '28', trend: 'up' as const },
          { label: 'Non-Teaching', value: '14', trend: 'neutral' as const },
          { label: 'On Leave', value: '3', trend: 'down' as const },
        ],
        chart: [
          { name: 'Teaching', value: 28 },
          { name: 'Admin', value: 5 },
          { name: 'Support', value: 6 },
          { name: 'SGB', value: 3 },
        ],
        table: [
          { subject: 'Mr. Dube', passRate: 'Headmaster', avgMark: 15, entries: 2005 },
          { subject: 'Mrs. Ncube', passRate: 'Deputy Head', avgMark: 12, entries: 2008 },
          { subject: 'Mr. Moyo', passRate: 'Senior Teacher', avgMark: 20, entries: 2010 },
          { subject: 'Ms. Chido', passRate: 'Teacher', avgMark: 8, entries: 2019 },
          { subject: 'Mr. Zvinavashe', passRate: 'Teacher', avgMark: 5, entries: 2021 },
        ],
      }
    case 'beam_report':
      return {
        title: 'BEAM Report',
        summary: [
          { label: 'BEAM Beneficiaries', value: '87', trend: 'up' as const },
          { label: 'Total Covered', value: '$43,500', trend: 'up' as const },
          { label: 'Pending Applications', value: '12', trend: 'down' as const },
          { label: 'Renewals Due', value: '23', trend: 'neutral' as const },
        ],
        chart: [
          { name: 'Approved', value: 87 },
          { name: 'Pending', value: 12 },
          { name: 'Rejected', value: 5 },
          { name: 'Renewal', value: 23 },
        ],
        table: [
          { subject: 'Orphaned', passRate: '34', avgMark: 39, entries: 0 },
          { subject: 'Vulnerable', passRate: '28', avgMark: 25, entries: 0 },
          { subject: 'Disabled', passRate: '8', avgMark: 10, entries: 0 },
          { subject: 'Child-Headed', passRate: '5', avgMark: 7, entries: 0 },
          { subject: 'Chronic Illness', passRate: '12', avgMark: 15, entries: 0 },
        ],
      }
    case 'enrollment_census':
      return {
        title: 'EMIS Enrollment Census',
        summary: [
          { label: 'Total Enrollment', value: '668', trend: 'up' as const },
          { label: 'Male', value: '312', trend: 'neutral' as const },
          { label: 'Female', value: '356', trend: 'neutral' as const },
          { label: 'BEAM', value: '87', trend: 'up' as const },
        ],
        chart: [
          { name: 'Form 1', value: 120 },
          { name: 'Form 2', value: 115 },
          { name: 'Form 3', value: 108 },
          { name: 'Form 4', value: 95 },
          { name: 'Form 5', value: 72 },
          { name: 'Form 6', value: 58 },
        ],
        table: [
          { subject: 'Boarders', passRate: '145', avgMark: 0, entries: 0 },
          { subject: 'Day Scholars', passRate: '523', avgMark: 0, entries: 0 },
          { subject: 'Special Needs', passRate: '12', avgMark: 0, entries: 0 },
          { subject: 'Foreign Nationals', passRate: '3', avgMark: 0, entries: 0 },
          { subject: 'Repeating', passRate: '8', avgMark: 0, entries: 0 },
        ],
      }
    default:
      return {
        title: 'Report Preview',
        summary: [],
        chart: [],
        table: [],
      }
  }
}

// ─── Reports Module ──────────────────────────────────────────────────────────

export default function ReportsModule() {
  const [activeCategory, setActiveCategory] = useState('academic')
  const [previewReport, setPreviewReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReturnType<typeof getReportData> | null>(null)

  const handleGenerate = useCallback((reportId: string) => {
    setGenerating(true)
    setPreviewReport(reportId)
    // Simulate loading
    setTimeout(() => {
      setReportData(getReportData(reportId))
      setGenerating(false)
    }, 1000)
  }, [])

  const currentReports = () => {
    switch (activeCategory) {
      case 'academic': return academicReports
      case 'finance': return financeReports
      case 'hr': return hrReports
      case 'welfare': return welfareReports
      case 'emis': return emisReports
      default: return academicReports
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate and view school reports across all departments</p>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportCategories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setPreviewReport(null) }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 border-2 hover:shadow-md',
                isActive
                  ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                  : 'border-transparent bg-white hover:border-muted hover:bg-muted/30'
              )}
            >
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-colors', isActive ? 'bg-gradient-to-br ' + cat.color + ' text-white shadow-md' : cat.bgLight)}>
                <cat.icon className={cn('h-6 w-6', isActive ? 'text-white' : 'text-muted-foreground')} />
              </div>
              <span className={cn('text-sm font-medium', isActive ? 'text-emerald-700' : 'text-muted-foreground')}>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Reports List / Preview */}
      <AnimatePresence mode="wait">
        {previewReport && reportData ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => { setPreviewReport(null); setReportData(null) }}>
                  <X className="mr-1 h-4 w-4" />
                  Close Preview
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <h2 className="text-lg font-semibold">{reportData.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (!reportData) return
                  const headers = ['Item', ...reportData.table[0] && reportData.table[0].passRate ? ['Value'] : [], ...reportData.table[0] && reportData.table[0].avgMark > 0 ? ['Average'] : [], ...reportData.table[0] && reportData.table[0].entries > 0 ? ['Entries'] : []]
                  const rows = reportData.table.map(row => {
                    const cells: string[] = [row.subject]
                    if (reportData!.table[0].passRate) cells.push(row.passRate)
                    if (reportData!.table[0].avgMark > 0) cells.push(String(row.avgMark))
                    if (reportData!.table[0].entries > 0) cells.push(String(row.entries))
                    return cells
                  })
                  printReport(reportData.title, buildHTMLTable(headers.filter(Boolean), rows))
                }}>
                  <Printer className="mr-2 h-3.5 w-3.5" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  if (!reportData) return
                  const csvData = reportData.table.map(row => {
                    const obj: Record<string, string> = { Item: row.subject }
                    if (reportData!.table[0].passRate) obj['Value'] = row.passRate
                    if (reportData!.table[0].avgMark > 0) obj['Average'] = String(row.avgMark)
                    if (reportData!.table[0].entries > 0) obj['Entries'] = String(row.entries)
                    return obj
                  })
                  exportToCSV(csvData, `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`)
                }}>
                  <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  if (!reportData) return
                  const headers = ['Item']
                  if (reportData.table[0]?.passRate) headers.push('Value')
                  if (reportData.table[0]?.avgMark > 0) headers.push('Average')
                  if (reportData.table[0]?.entries > 0) headers.push('Entries')
                  const rows = reportData.table.map(row => {
                    const cells: string[] = [row.subject]
                    if (reportData!.table[0]?.passRate) cells.push(row.passRate)
                    if (reportData!.table[0]?.avgMark > 0) cells.push(String(row.avgMark))
                    if (reportData!.table[0]?.entries > 0) cells.push(String(row.entries))
                    return cells
                  })
                  printReport(`${reportData.title} (PDF View)`, buildHTMLTable(headers, rows))
                }}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            {reportData.summary.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {reportData.summary.map((item, i) => (
                  <Card key={i} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xl font-bold">{item.value}</p>
                        {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                        {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Chart + Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reportData.chart.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Visual Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                      <BarChart data={reportData.chart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {reportData.table.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Detailed Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Item</TableHead>
                          {reportData.table[0].passRate && <TableHead className="text-xs text-right">Value</TableHead>}
                          {reportData.table[0].avgMark > 0 && <TableHead className="text-xs text-right">Average</TableHead>}
                          {reportData.table[0].entries > 0 && <TableHead className="text-xs text-right">Entries</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.table.map((row, i) => (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="text-sm font-medium">{row.subject}</TableCell>
                            {row.passRate && <TableCell className="text-sm text-right">{row.passRate}</TableCell>}
                            {row.avgMark > 0 && <TableCell className="text-sm text-right">{row.avgMark}</TableCell>}
                            {row.entries > 0 && <TableCell className="text-sm text-right">{row.entries}</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {reportCategories.find((c) => c.id === activeCategory)?.label} Reports
                </CardTitle>
                <CardDescription>Select a report to generate and preview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentReports().map((report) => (
                    <div key={report.id} className="flex items-start gap-4 p-4 rounded-xl border hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer" onClick={() => handleGenerate(report.id)}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 shrink-0">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-emerald-700 transition-colors">{report.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <div className="text-center">
                <p className="font-semibold">Generating Report</p>
                <p className="text-sm text-muted-foreground mt-1">Compiling data and creating preview...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  )
}
