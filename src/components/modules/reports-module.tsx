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
  Award,
  Signature,
  Select,
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
  LineChart,
  Line,
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
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  { id: 'report_card', name: 'Student Report Card', description: 'Generate individual student report cards with grades and comments' },
  { id: 'zimsec_analysis', name: 'ZIMSEC Results Analysis', description: 'O-Level and A-Level pass rates, grade distribution, and subject breakdown' },
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
  { id: 'emis_census', name: 'Annual EMIS Census Return', description: 'Complete MoPSE census submission with school info, enrollment, staffing, infrastructure, and finance' },
]

const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']

const barChartConfig = {
  value: { label: 'Value', color: '#10b981' },
} satisfies ChartConfig

const zimsecChartConfig = {
  passRate: { label: 'Pass Rate %', color: '#10b981' },
  prevYear: { label: 'Previous Year %', color: '#d1d5db' },
} satisfies ChartConfig

const gradeDistChartConfig = {
  count: { label: 'Students', color: '#10b981' },
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

// ─── EMIS Census Data ────────────────────────────────────────────────────────
const emisCensusSections = [
  {
    section: 'School Information',
    rows: [
      { field: 'School Name', value: 'ZimSchool Academy' },
      { field: 'EMIS Number', value: 'MPW-0421-2024' },
      { field: 'School Type', value: 'Secondary (Form 1-6)' },
      { field: 'Ownership', value: 'Government' },
      { field: 'District', value: 'Harare Urban' },
      { field: 'Province', value: 'Harare Metropolitan' },
      { field: 'Location', value: 'Urban' },
      { field: 'Date Established', value: '1985' },
      { field: 'School Address', value: '12 Samora Machel Ave, Harare' },
      { field: 'Contact Phone', value: '+263-4-782135' },
    ],
  },
  {
    section: 'Enrollment by Grade & Gender',
    rows: [
      { field: 'Form 1 - Male', value: '58' },
      { field: 'Form 1 - Female', value: '62' },
      { field: 'Form 2 - Male', value: '55' },
      { field: 'Form 2 - Female', value: '60' },
      { field: 'Form 3 - Male', value: '52' },
      { field: 'Form 3 - Female', value: '56' },
      { field: 'Form 4 - Male', value: '45' },
      { field: 'Form 4 - Female', value: '50' },
      { field: 'Form 5 - Male', value: '35' },
      { field: 'Form 5 - Female', value: '37' },
      { field: 'Form 6 - Male', value: '27' },
      { field: 'Form 6 - Female', value: '31' },
      { field: 'Total Male', value: '272' },
      { field: 'Total Female', value: '296' },
      { field: 'Grand Total', value: '568' },
    ],
  },
  {
    section: 'Staffing',
    rows: [
      { field: 'Headmaster', value: '1' },
      { field: 'Deputy Head', value: '1' },
      { field: 'Senior Teachers', value: '4' },
      { field: 'Teachers (Trained)', value: '22' },
      { field: 'Teachers (Untrained)', value: '3' },
      { field: 'Student Teachers', value: '2' },
      { field: 'Admin Staff', value: '5' },
      { field: 'Support Staff', value: '6' },
      { field: 'Total Staff', value: '44' },
      { field: 'Pupil:Teacher Ratio', value: '20:1' },
      { field: 'Vacant Posts', value: '3' },
    ],
  },
  {
    section: 'Infrastructure',
    rows: [
      { field: 'Classrooms', value: '24' },
      { field: 'Classrooms in Use', value: '22' },
      { field: 'Laboratories', value: '3' },
      { field: 'Libraries', value: '1' },
      { field: 'Computer Labs', value: '2' },
      { field: 'Staff Houses', value: '8' },
      { field: 'Toilets (Boys)', value: '12' },
      { field: 'Toilets (Girls)', value: '14' },
      { field: 'Toilets (Staff)', value: '6' },
      { field: 'Sports Fields', value: '3' },
      { field: 'Dormitories', value: '4' },
      { field: 'Water Source', value: 'Borehole + Municipal' },
      { field: 'Power Source', value: 'ZESA + Solar' },
    ],
  },
  {
    section: 'Finance Summary (USD)',
    rows: [
      { field: 'Total Fees Billed', value: '$530,000' },
      { field: 'Total Collected', value: '$463,750' },
      { field: 'Outstanding', value: '$66,250' },
      { field: 'Collection Rate', value: '87.5%' },
      { field: 'BEAM Contributions', value: '$43,500' },
      { field: 'SDC Levies', value: '$18,200' },
      { field: 'Govt Grants', value: '$12,500' },
      { field: 'Total Revenue', value: '$537,950' },
      { field: 'Total Expenditure', value: '$498,200' },
      { field: 'Surplus/Deficit', value: '$39,750' },
    ],
  },
]

// ─── Report Card Data ────────────────────────────────────────────────────────
const reportCardStudents = [
  { id: '1', name: 'Tendai Moyo', class: 'Form 3A', studentNumber: 'STD-2024-001' },
  { id: '2', name: 'Chido Ndlovu', class: 'Form 3A', studentNumber: 'STD-2024-002' },
  { id: '3', name: 'Kudzai Chikumbu', class: 'Form 4B', studentNumber: 'STD-2024-003' },
  { id: '4', name: 'Rumbidzai Dube', class: 'Form 2A', studentNumber: 'STD-2024-004' },
  { id: '5', name: 'Tapiwa Gumbo', class: 'Form 3B', studentNumber: 'STD-2024-005' },
]

const reportCardSubjects = [
  { subject: 'Mathematics', midTerm: 62, test: 58, exam: 65, grade: 'C' },
  { subject: 'English Language', midTerm: 71, test: 68, exam: 74, grade: 'B' },
  { subject: 'Shona', midTerm: 78, test: 82, exam: 80, grade: 'A' },
  { subject: 'Physics', midTerm: 55, test: 52, exam: 58, grade: 'D' },
  { subject: 'Chemistry', midTerm: 60, test: 57, exam: 63, grade: 'C' },
  { subject: 'Biology', midTerm: 68, test: 65, exam: 70, grade: 'B' },
  { subject: 'History', midTerm: 74, test: 70, exam: 76, grade: 'B' },
  { subject: 'Geography', midTerm: 65, test: 62, exam: 67, grade: 'C' },
  { subject: 'Accounts', midTerm: 58, test: 55, exam: 60, grade: 'C' },
  { subject: 'Computer Science', midTerm: 72, test: 75, exam: 78, grade: 'A' },
]

const teacherComments = [
  'A diligent learner who shows improvement in analytical subjects. Needs to focus more on problem-solving techniques.',
  'Good participation in class discussions. Encourage consistent revision habits.',
  'Shows potential in Sciences. Extra practice in practical work recommended.',
]

// ─── ZIMSEC Analysis Data ────────────────────────────────────────────────────
const zimsecPassRateData = [
  { subject: 'Mathematics', passRate: 65, prevYear: 62 },
  { subject: 'English', passRate: 78, prevYear: 75 },
  { subject: 'Shona', passRate: 85, prevYear: 82 },
  { subject: 'Physics', passRate: 55, prevYear: 58 },
  { subject: 'Chemistry', passRate: 60, prevYear: 57 },
  { subject: 'Biology', passRate: 72, prevYear: 68 },
  { subject: 'History', passRate: 80, prevYear: 76 },
  { subject: 'Geography', passRate: 68, prevYear: 65 },
  { subject: 'Accounts', passRate: 58, prevYear: 55 },
  { subject: 'Computer Sci', passRate: 74, prevYear: 70 },
]

const zimsecGradeDistribution = [
  { grade: 'A*', count: 12, fill: '#10b981' },
  { grade: 'A', count: 28, fill: '#14b8a6' },
  { grade: 'B', count: 45, fill: '#06b6d4' },
  { grade: 'C', count: 52, fill: '#f59e0b' },
  { grade: 'D', count: 38, fill: '#f97316' },
  { grade: 'E', count: 22, fill: '#ef4444' },
  { grade: 'U', count: 8, fill: '#6b7280' },
]

const zimsecSubjectBreakdown = [
  { subject: 'Mathematics', aStar: 2, a: 5, b: 12, c: 18, d: 15, e: 8, u: 3, entries: 63, passRate: '89.5%' },
  { subject: 'English Language', aStar: 4, a: 10, b: 18, c: 22, d: 10, e: 5, u: 2, entries: 71, passRate: '95.8%' },
  { subject: 'Shona', aStar: 6, a: 14, b: 15, c: 12, d: 5, e: 3, u: 1, entries: 56, passRate: '96.4%' },
  { subject: 'Physics', aStar: 1, a: 4, b: 8, c: 10, d: 12, e: 8, u: 5, entries: 48, passRate: '79.2%' },
  { subject: 'Chemistry', aStar: 1, a: 5, b: 9, c: 11, d: 10, e: 7, u: 4, entries: 47, passRate: '82.9%' },
  { subject: 'Biology', aStar: 3, a: 8, b: 14, c: 16, d: 8, e: 4, u: 2, entries: 55, passRate: '93.6%' },
  { subject: 'History', aStar: 5, a: 12, b: 16, c: 10, d: 5, e: 2, u: 1, entries: 51, passRate: '96.1%' },
  { subject: 'Geography', aStar: 2, a: 6, b: 10, c: 14, d: 8, e: 5, u: 3, entries: 48, passRate: '87.5%' },
  { subject: 'Accounts', aStar: 1, a: 3, b: 7, c: 9, d: 11, e: 6, u: 4, entries: 41, passRate: '80.5%' },
  { subject: 'Computer Science', aStar: 3, a: 9, b: 12, c: 11, d: 4, e: 2, u: 1, entries: 42, passRate: '95.2%' },
]

// ─── Reports Module ──────────────────────────────────────────────────────────

export default function ReportsModule() {
  const [activeCategory, setActiveCategory] = useState('academic')
  const [previewReport, setPreviewReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReturnType<typeof getReportData> | null>(null)

  // Report Card state
  const [selectedStudent, setSelectedStudent] = useState('1')
  const [selectedTerm, setSelectedTerm] = useState('1')
  const [showReportCard, setShowReportCard] = useState(false)

  // ZIMSEC state
  const [zimsecYear, setZimsecYear] = useState('2024')
  const [zimsecLevel, setZimsecLevel] = useState('o-level')
  const [showZimsecReport, setShowZimsecReport] = useState(false)

  // EMIS Census state
  const [showEmisCensus, setShowEmisCensus] = useState(false)

  const handleGenerate = useCallback((reportId: string) => {
    // Special handling for new report types
    if (reportId === 'report_card') {
      setShowReportCard(true)
      setShowZimsecReport(false)
      setShowEmisCensus(false)
      setPreviewReport(null)
      setReportData(null)
      return
    }
    if (reportId === 'zimsec_analysis') {
      setShowZimsecReport(true)
      setShowReportCard(false)
      setShowEmisCensus(false)
      setPreviewReport(null)
      setReportData(null)
      return
    }
    if (reportId === 'emis_census') {
      setShowEmisCensus(true)
      setShowReportCard(false)
      setShowZimsecReport(false)
      setPreviewReport(null)
      setReportData(null)
      return
    }

    setShowReportCard(false)
    setShowZimsecReport(false)
    setShowEmisCensus(false)
    setGenerating(true)
    setPreviewReport(reportId)
    // Simulate loading
    setTimeout(() => {
      setReportData(getReportData(reportId))
      setGenerating(false)
    }, 1000)
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewReport(null)
    setReportData(null)
    setShowReportCard(false)
    setShowZimsecReport(false)
    setShowEmisCensus(false)
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

  const selectedStudentData = reportCardStudents.find(s => s.id === selectedStudent)
  const totalScore = reportCardSubjects.reduce((sum, s) => sum + s.exam, 0)
  const avgScore = (totalScore / reportCardSubjects.length).toFixed(1)

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
              onClick={() => { setActiveCategory(cat.id); handleClosePreview() }}
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
        {showReportCard ? (
          <motion.div
            key="report-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Report Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleClosePreview}>
                  <X className="mr-1 h-4 w-4" />
                  Close Preview
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <h2 className="text-lg font-semibold">Student Report Card</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const headers = ['Subject', 'Mid-Term', 'Test', 'Exam', 'Grade']
                  const rows = reportCardSubjects.map(s => [s.subject, String(s.midTerm), String(s.test), String(s.exam), s.grade])
                  printReport(`Report Card - ${selectedStudentData?.name || 'Student'}`, buildHTMLTable(headers, rows))
                }}>
                  <Printer className="mr-2 h-3.5 w-3.5" />
                  Print Report Card
                </Button>
              </div>
            </div>

            {/* Student Selector */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Student</label>
                    <SelectComponent value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportCardStudents.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem>
                        ))}
                      </SelectContent>
                    </SelectComponent>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Term</label>
                    <SelectComponent value={selectedTerm} onValueChange={setSelectedTerm}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                      </SelectContent>
                    </SelectComponent>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Card Preview */}
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">ZimSchool Academy</h2>
                    <p className="text-emerald-100 text-sm">Excellence in Education Since 1985</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Term {selectedTerm}, 2024</p>
                    <p className="text-emerald-100 text-xs">Student Academic Report</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                {/* Student Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Student Name</p>
                    <p className="text-sm font-semibold">{selectedStudentData?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Student Number</p>
                    <p className="text-sm font-semibold">{selectedStudentData?.studentNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Class</p>
                    <p className="text-sm font-semibold">{selectedStudentData?.class}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Position</p>
                    <p className="text-sm font-semibold">8th out of 32</p>
                  </div>
                </div>

                {/* Subject Grades Table */}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50/50">
                      <TableHead className="text-xs font-semibold">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Mid-Term (30%)</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Test (20%)</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Exam (50%)</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportCardSubjects.map((s, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{s.subject}</TableCell>
                        <TableCell className="text-sm text-center">{s.midTerm}</TableCell>
                        <TableCell className="text-sm text-center">{s.test}</TableCell>
                        <TableCell className="text-sm text-center font-semibold">{s.exam}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            'text-xs font-bold border-0',
                            s.grade === 'A' || s.grade === 'A*' ? 'bg-emerald-100 text-emerald-700' :
                            s.grade === 'B' ? 'bg-teal-100 text-teal-700' :
                            s.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                            s.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {s.grade}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-emerald-50/30 font-semibold">
                      <TableCell>Total / Average</TableCell>
                      <TableCell className="text-center">{(reportCardSubjects.reduce((sum, s) => sum + s.midTerm, 0)).toString()}</TableCell>
                      <TableCell className="text-center">{(reportCardSubjects.reduce((sum, s) => sum + s.test, 0)).toString()}</TableCell>
                      <TableCell className="text-center">{totalScore}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-bold">Avg: {avgScore}</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Teacher Comments */}
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-xl border">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Class Teacher Comments</p>
                    <p className="text-sm">{teacherComments[0]}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">Mrs. Ncube - Class Teacher</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Signature className="h-4 w-4" />
                        <span>Signature: ________________</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Headmaster Comments</p>
                    <p className="text-sm">Satisfactory progress. Continue working hard. Encouraged to seek extra help in weaker subjects.</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">Mr. Dube - Headmaster</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Signature className="h-4 w-4" />
                        <span>Signature: ________________</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 p-3 rounded-xl bg-muted/30 text-xs text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>Stamp:</span>
                    <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <span className="text-[8px] text-center">SCHOOL<br />STAMP</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : showZimsecReport ? (
          <motion.div
            key="zimsec-analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* ZIMSEC Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleClosePreview}>
                  <X className="mr-1 h-4 w-4" />
                  Close Preview
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <h2 className="text-lg font-semibold">ZIMSEC Results Analysis</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const headers = ['Subject', 'A*', 'A', 'B', 'C', 'D', 'E', 'U', 'Entries', 'Pass Rate']
                  const rows = zimsecSubjectBreakdown.map(s => [s.subject, String(s.aStar), String(s.a), String(s.b), String(s.c), String(s.d), String(s.e), String(s.u), String(s.entries), s.passRate])
                  printReport('ZIMSEC Results Analysis', buildHTMLTable(headers, rows))
                }}>
                  <Printer className="mr-2 h-3.5 w-3.5" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const csvData = zimsecSubjectBreakdown.map(s => ({
                    Subject: s.subject,
                    'A*': s.aStar,
                    'A': s.a,
                    'B': s.b,
                    'C': s.c,
                    'D': s.d,
                    'E': s.e,
                    'U': s.u,
                    Entries: s.entries,
                    'Pass Rate': s.passRate,
                  }))
                  exportToCSV(csvData, `ZIMSEC_Analysis_${zimsecYear}_${zimsecLevel}`)
                }}>
                  <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* ZIMSEC Selectors */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Year</label>
                    <SelectComponent value={zimsecYear} onValueChange={setZimsecYear}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </SelectComponent>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Level</label>
                    <SelectComponent value={zimsecLevel} onValueChange={setZimsecLevel}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="o-level">O-Level</SelectItem>
                        <SelectItem value="a-level">A-Level</SelectItem>
                      </SelectContent>
                    </SelectComponent>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ZIMSEC Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Pass Rate</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xl font-bold">87.3%</p>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Candidates</p>
                  <p className="text-xl font-bold mt-1">205</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">5+ Passes</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xl font-bold">72.1%</p>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Subjects Offered</p>
                  <p className="text-xl font-bold mt-1">10</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pass Rate by Subject Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Pass Rate by Subject vs Previous Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={zimsecChartConfig} className="h-[280px] w-full">
                    <BarChart data={zimsecPassRateData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="prevYear" fill="#d1d5db" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="passRate" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ChartContainer>
                  <div className="flex items-center justify-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-xs text-muted-foreground">Current Year</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-300" />
                      <span className="text-xs text-muted-foreground">Previous Year</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grade Distribution Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Grade Distribution (A*-U)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={gradeDistChartConfig} className="h-[280px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="grade" />} />
                      <Pie
                        data={zimsecGradeDistribution}
                        dataKey="count"
                        nameKey="grade"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {zimsecGradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    {zimsecGradeDistribution.map((g) => (
                      <div key={g.grade} className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: g.fill }} />
                        <span className="text-xs text-muted-foreground">{g.grade} ({g.count})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject-by-Subject Breakdown Table */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Subject-by-Subject Breakdown (A*-E Percentages)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-50/50">
                        <TableHead className="text-xs font-semibold">Subject</TableHead>
                        <TableHead className="text-xs font-semibold text-center">A*</TableHead>
                        <TableHead className="text-xs font-semibold text-center">A</TableHead>
                        <TableHead className="text-xs font-semibold text-center">B</TableHead>
                        <TableHead className="text-xs font-semibold text-center">C</TableHead>
                        <TableHead className="text-xs font-semibold text-center">D</TableHead>
                        <TableHead className="text-xs font-semibold text-center">E</TableHead>
                        <TableHead className="text-xs font-semibold text-center">U</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Entries</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Pass Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zimsecSubjectBreakdown.map((s, i) => (
                        <TableRow key={i} className="hover:bg-muted/30">
                          <TableCell className="text-sm font-medium">{s.subject}</TableCell>
                          <TableCell className="text-sm text-center">{s.aStar}</TableCell>
                          <TableCell className="text-sm text-center">{s.a}</TableCell>
                          <TableCell className="text-sm text-center">{s.b}</TableCell>
                          <TableCell className="text-sm text-center">{s.c}</TableCell>
                          <TableCell className="text-sm text-center">{s.d}</TableCell>
                          <TableCell className="text-sm text-center">{s.e}</TableCell>
                          <TableCell className="text-sm text-center text-red-500">{s.u}</TableCell>
                          <TableCell className="text-sm text-center">{s.entries}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              'text-xs font-bold border-0',
                              parseFloat(s.passRate) >= 90 ? 'bg-emerald-100 text-emerald-700' :
                              parseFloat(s.passRate) >= 80 ? 'bg-teal-100 text-teal-700' :
                              'bg-amber-100 text-amber-700'
                            )}>
                              {s.passRate}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        ) : showEmisCensus ? (
          <motion.div
            key="emis-census"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* EMIS Census Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleClosePreview}>
                  <X className="mr-1 h-4 w-4" />
                  Close Preview
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <h2 className="text-lg font-semibold">Annual EMIS Census Return</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const headers = ['Section', 'Field', 'Value']
                  const rows = emisCensusSections.flatMap(section =>
                    section.rows.map(row => [section.section, row.field, row.value])
                  )
                  printReport('Annual EMIS Census Return - ZimSchool Academy', buildHTMLTable(headers, rows))
                }}>
                  <Printer className="mr-2 h-3.5 w-3.5" />
                  Print
                </Button>
                <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={() => {
                  const csvData = emisCensusSections.flatMap(section =>
                    section.rows.map(row => ({
                      Section: section.section,
                      Field: row.field,
                      Value: row.value,
                    }))
                  )
                  exportToCSV(csvData, `EMIS_Census_Return_${new Date().getFullYear()}`)
                }}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Export for EMIS
                </Button>
              </div>
            </div>

            {/* EMIS Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Enrollment</p>
                  <p className="text-xl font-bold mt-1">568</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Staff</p>
                  <p className="text-xl font-bold mt-1">44</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pupil:Teacher Ratio</p>
                  <p className="text-xl font-bold mt-1">20:1</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Collection Rate</p>
                  <p className="text-xl font-bold mt-1">87.5%</p>
                </CardContent>
              </Card>
            </div>

            {/* EMIS Census Data Sections */}
            {emisCensusSections.map((section, sectionIndex) => (
              <motion.div
                key={section.section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
              >
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                        <span className="text-xs font-bold text-emerald-700">{sectionIndex + 1}</span>
                      </div>
                      <CardTitle className="text-base font-semibold">{section.section}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-emerald-50/30">
                          <TableHead className="text-xs font-semibold w-[60%]">Field</TableHead>
                          <TableHead className="text-xs font-semibold">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.rows.map((row, i) => (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="text-sm">{row.field}</TableCell>
                            <TableCell className="text-sm font-semibold">{row.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : previewReport && reportData ? (
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
                <Button variant="ghost" size="sm" onClick={handleClosePreview}>
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
