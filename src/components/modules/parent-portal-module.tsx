'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UsersRound,
  GraduationCap,
  DollarSign,
  MessageSquare,
  Calendar,
  Bell,
  ChevronDown,
  ChevronUp,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  BarChart3,
  Phone,
  Mail,
  ExternalLink,
  Plus,
  X,
  Star,
  Heart,
  Users,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PaynowDialog } from '@/components/modules/paynow-dialog'
import { SmsDialog } from '@/components/modules/sms-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Child {
  id: string
  name: string
  class: string
  studentNumber: string
  initials: string
  grades: { subject: string; mark: number; grade: string }[]
  attendanceRate: number
  outstandingFees: number
  recentGrades: { subject: string; test: string; mark: number; grade: string; date: string }[]
  attendanceHistory: { week: string; present: number; absent: number }[]
  disciplineNotes: { date: string; type: string; note: string }[]
}

interface Invoice {
  id: string
  studentName: string
  description: string
  amount: number
  amountZiG: number
  paid: number
  paidZiG: number
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue'
  dueDate: string
  invoiceNumber: string
}

interface Payment {
  id: string
  receiptNumber: string
  studentName: string
  amount: number
  amountZiG: number
  method: string
  date: string
  description: string
}

interface Message {
  id: string
  sender: string
  senderRole: string
  subject: string
  preview: string
  fullMessage: string
  date: string
  read: boolean
  type: 'message' | 'announcement'
}

interface ConversationMessage {
  id: string
  sender: 'school' | 'parent'
  message: string
  time: string
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'exam' | 'event' | 'meeting' | 'holiday'
  description: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const parentName = 'Mrs. Rumbidzai Dube'
const parentInitials = 'RD'

const mockChildren: Child[] = [
  {
    id: '1',
    name: 'Tendai Dube',
    class: 'Form 4A',
    studentNumber: 'STD-2024-0042',
    initials: 'TD',
    grades: [
      { subject: 'Mathematics', mark: 78, grade: 'B' },
      { subject: 'English', mark: 85, grade: 'A' },
      { subject: 'Shona', mark: 72, grade: 'B' },
      { subject: 'Physics', mark: 65, grade: 'C' },
      { subject: 'History', mark: 88, grade: 'A' },
    ],
    attendanceRate: 94,
    outstandingFees: 175.00,
    recentGrades: [
      { subject: 'Mathematics', test: 'Mid-Term', mark: 78, grade: 'B', date: '2026-02-15' },
      { subject: 'English', test: 'Essay', mark: 85, grade: 'A', date: '2026-02-20' },
      { subject: 'Physics', test: 'Practical', mark: 65, grade: 'C', date: '2026-02-25' },
      { subject: 'History', test: 'Assignment', mark: 88, grade: 'A', date: '2026-03-01' },
    ],
    attendanceHistory: [
      { week: 'Week 1', present: 5, absent: 0 },
      { week: 'Week 2', present: 4, absent: 1 },
      { week: 'Week 3', present: 5, absent: 0 },
      { week: 'Week 4', present: 4, absent: 1 },
      { week: 'Week 5', present: 5, absent: 0 },
    ],
    disciplineNotes: [
      { date: '2026-02-10', type: 'Merit', note: 'Excellent participation in class debate' },
      { date: '2026-01-28', type: 'Note', note: 'Late arrival to morning assembly (2nd time)' },
    ],
  },
  {
    id: '2',
    name: 'Chido Dube',
    class: 'Form 2B',
    studentNumber: 'STD-2024-0118',
    initials: 'CD',
    grades: [
      { subject: 'Mathematics', mark: 92, grade: 'A*' },
      { subject: 'English', mark: 80, grade: 'B' },
      { subject: 'Shona', mark: 88, grade: 'A' },
      { subject: 'Biology', mark: 75, grade: 'B' },
      { subject: 'Geography', mark: 82, grade: 'B' },
    ],
    attendanceRate: 97,
    outstandingFees: 175.00,
    recentGrades: [
      { subject: 'Mathematics', test: 'Mid-Term', mark: 92, grade: 'A*', date: '2026-02-15' },
      { subject: 'English', test: 'Comprehension', mark: 80, grade: 'B', date: '2026-02-18' },
      { subject: 'Biology', test: 'Lab Report', mark: 75, grade: 'B', date: '2026-02-22' },
      { subject: 'Geography', test: 'Map Skills', mark: 82, grade: 'B', date: '2026-02-28' },
    ],
    attendanceHistory: [
      { week: 'Week 1', present: 5, absent: 0 },
      { week: 'Week 2', present: 5, absent: 0 },
      { week: 'Week 3', present: 5, absent: 0 },
      { week: 'Week 4', present: 4, absent: 1 },
      { week: 'Week 5', present: 5, absent: 0 },
    ],
    disciplineNotes: [
      { date: '2026-02-28', type: 'Merit', note: 'Top student in Mathematics class test' },
      { date: '2026-02-15', type: 'Merit', note: 'Helped organize Science Fair project' },
    ],
  },
  {
    id: '3',
    name: 'Kudzai Dube',
    class: 'Grade 6C',
    studentNumber: 'STD-2024-0205',
    initials: 'KD',
    grades: [
      { subject: 'Mathematics', mark: 68, grade: 'C' },
      { subject: 'English', mark: 74, grade: 'B' },
      { subject: 'Shona', mark: 80, grade: 'B' },
      { subject: 'Science', mark: 62, grade: 'C' },
      { subject: 'Social Studies', mark: 71, grade: 'B' },
    ],
    attendanceRate: 89,
    outstandingFees: 350.00,
    recentGrades: [
      { subject: 'Mathematics', test: 'Class Test', mark: 68, grade: 'C', date: '2026-02-12' },
      { subject: 'English', test: 'Spelling', mark: 74, grade: 'B', date: '2026-02-19' },
      { subject: 'Science', test: 'Project', mark: 62, grade: 'C', date: '2026-02-26' },
    ],
    attendanceHistory: [
      { week: 'Week 1', present: 4, absent: 1 },
      { week: 'Week 2', present: 5, absent: 0 },
      { week: 'Week 3', present: 3, absent: 2 },
      { week: 'Week 4', present: 4, absent: 1 },
      { week: 'Week 5', present: 5, absent: 0 },
    ],
    disciplineNotes: [
      { date: '2026-02-20', type: 'Note', note: 'Missing homework - Mathematics (3rd occurrence)' },
      { date: '2026-01-15', type: 'Demerit', note: 'Disruptive behavior in class' },
    ],
  },
]

const mockInvoices: Invoice[] = [
  { id: '1', studentName: 'Tendai Dube', description: 'Term 1 Tuition Fee', amount: 450.00, amountZiG: 4875.00, paid: 275.00, paidZiG: 2981.25, status: 'Partial', dueDate: '2026-02-28', invoiceNumber: 'INV-2026-0012' },
  { id: '2', studentName: 'Tendai Dube', description: 'Term 1 Boarding Fee', amount: 300.00, amountZiG: 3250.00, paid: 300.00, paidZiG: 3250.00, status: 'Paid', dueDate: '2026-02-15', invoiceNumber: 'INV-2026-0013' },
  { id: '3', studentName: 'Chido Dube', description: 'Term 1 Tuition Fee', amount: 450.00, amountZiG: 4875.00, paid: 275.00, paidZiG: 2981.25, status: 'Partial', dueDate: '2026-02-28', invoiceNumber: 'INV-2026-0045' },
  { id: '4', studentName: 'Chido Dube', description: 'Term 1 Activity Fee', amount: 50.00, amountZiG: 541.67, paid: 0, paidZiG: 0, status: 'Pending', dueDate: '2026-03-15', invoiceNumber: 'INV-2026-0046' },
  { id: '5', studentName: 'Kudzai Dube', description: 'Term 1 Tuition Fee', amount: 350.00, amountZiG: 3791.67, paid: 0, paidZiG: 0, status: 'Overdue', dueDate: '2026-01-31', invoiceNumber: 'INV-2026-0078' },
  { id: '6', studentName: 'Kudzai Dube', description: 'Term 1 Activity Fee', amount: 50.00, amountZiG: 541.67, paid: 0, paidZiG: 0, status: 'Overdue', dueDate: '2026-01-31', invoiceNumber: 'INV-2026-0079' },
  { id: '7', studentName: 'Tendai Dube', description: 'ZIMSEC Exam Fee', amount: 120.00, amountZiG: 1300.00, paid: 120.00, paidZiG: 1300.00, status: 'Paid', dueDate: '2026-01-15', invoiceNumber: 'INV-2026-0003' },
  { id: '8', studentName: 'Chido Dube', description: 'Sports Equipment', amount: 25.00, amountZiG: 270.83, paid: 25.00, paidZiG: 270.83, status: 'Paid', dueDate: '2026-02-10', invoiceNumber: 'INV-2026-0050' },
]

const mockPayments: Payment[] = [
  { id: '1', receiptNumber: 'RCP-2026-0089', studentName: 'Tendai Dube', amount: 275.00, amountZiG: 2981.25, method: 'EcoCash', date: '2026-02-05', description: 'Term 1 Tuition - Partial' },
  { id: '2', receiptNumber: 'RCP-2026-0090', studentName: 'Tendai Dube', amount: 300.00, amountZiG: 3250.00, method: 'Bank Transfer', date: '2026-02-10', description: 'Term 1 Boarding Fee' },
  { id: '3', receiptNumber: 'RCP-2026-0091', studentName: 'Chido Dube', amount: 275.00, amountZiG: 2981.25, method: 'EcoCash', date: '2026-02-08', description: 'Term 1 Tuition - Partial' },
  { id: '4', receiptNumber: 'RCP-2026-0092', studentName: 'Tendai Dube', amount: 120.00, amountZiG: 1300.00, method: 'Cash (USD)', date: '2026-01-12', description: 'ZIMSEC Exam Fee' },
  { id: '5', receiptNumber: 'RCP-2026-0093', studentName: 'Chido Dube', amount: 25.00, amountZiG: 270.83, method: 'Cash (USD)', date: '2026-02-08', description: 'Sports Equipment' },
]

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'Mr. Hove',
    senderRole: 'Mathematics Teacher',
    subject: 'Tendai\'s Progress in Mathematics',
    preview: 'I wanted to discuss Tendai\'s recent improvement in algebra...',
    fullMessage: 'Dear Mrs. Dube,\n\nI wanted to discuss Tendai\'s recent improvement in algebra. He scored 78% in the mid-term test, which is a significant improvement from last term. I encourage him to continue with the extra practice sessions after school.\n\nPlease feel free to schedule a meeting if you\'d like to discuss further.\n\nBest regards,\nMr. Hove',
    date: '2026-03-01',
    read: false,
    type: 'message',
  },
  {
    id: '2',
    sender: 'Mrs. Mlambo',
    senderRole: 'English Teacher',
    subject: 'Chido\'s Essay Competition',
    preview: 'Great news! Chido has been selected for the district essay competition...',
    fullMessage: 'Dear Mrs. Dube,\n\nGreat news! Chido has been selected to represent our school at the District English Essay Competition on March 15th. She wrote an outstanding essay on "The Role of Education in Nation Building."\n\nPlease ensure she prepares by reviewing the competition guidelines sent home today.\n\nWarm regards,\nMrs. Mlambo',
    date: '2026-02-28',
    read: false,
    type: 'message',
  },
  {
    id: '3',
    sender: 'Headmaster Ndlovu',
    senderRole: 'Headmaster',
    subject: 'Term 1 Parent-Teacher Conference',
    preview: 'You are invited to the Parent-Teacher Conference on March 20th...',
    fullMessage: 'Dear Parents/Guardians,\n\nYou are cordially invited to the Term 1 Parent-Teacher Conference scheduled for March 20th, 2026, from 9:00 AM to 4:00 PM.\n\nPlease bring your child\'s report card and any questions you may have for the teachers. Individual appointment slots will be allocated on a first-come, first-served basis.\n\nWe look forward to seeing you.\n\nHeadmaster Ndlovu',
    date: '2026-02-25',
    read: true,
    type: 'announcement',
  },
  {
    id: '4',
    sender: 'Mr. Gumbo',
    senderRole: 'Shona Teacher',
    subject: 'Kudzai - Missing Homework',
    preview: 'I am writing to inform you that Kudzai has not submitted three homework assignments...',
    fullMessage: 'Dear Mrs. Dube,\n\nI am writing to inform you that Kudzai has not submitted three consecutive Shona homework assignments. This is affecting her overall grade for the term.\n\nI would appreciate it if you could ensure she completes the outstanding work and brings it to class on Monday.\n\nThank you for your cooperation.\n\nMr. Gumbo',
    date: '2026-02-20',
    read: true,
    type: 'message',
  },
  {
    id: '5',
    sender: 'School Administration',
    senderRole: 'Administration',
    subject: 'Outstanding Fee Balance Reminder',
    preview: 'This is a reminder that you have outstanding fee balances for Kudzai...',
    fullMessage: 'Dear Mrs. Dube,\n\nThis is a kind reminder that the following fee balances are outstanding:\n\n• Kudzai Dube (Grade 6C): $350.00 (Overdue since January 31)\n• Tendai Dube (Form 4A): $175.00 (Due February 28)\n• Chido Dube (Form 2B): $225.00 (Due March 15)\n\nPlease arrange payment at your earliest convenience. Payment can be made via EcoCash, bank transfer, or at the school bursar\'s office.\n\nThank you.\nSchool Administration',
    date: '2026-02-18',
    read: true,
    type: 'announcement',
  },
  {
    id: '6',
    sender: 'Mrs. Ncube',
    senderRole: 'Physics Teacher',
    subject: 'Tendai - Science Lab Safety',
    preview: 'I want to bring to your attention a minor safety concern during lab...',
    fullMessage: 'Dear Mrs. Dube,\n\nI want to bring to your attention a minor safety concern during the Physics practical on February 25th. Tendai did not wear safety goggles during the experiment. I have spoken with him about lab safety protocols.\n\nThis is just a precautionary note. Tendai is otherwise a diligent student in the lab.\n\nRegards,\nMrs. Ncube',
    date: '2026-02-26',
    read: false,
    type: 'message',
  },
]

const mockConversation: ConversationMessage[] = [
  { id: '1', sender: 'school', message: 'Dear Mrs. Dube, this is a reminder about the upcoming parent-teacher conference on March 20th.', time: '9:00 AM' },
  { id: '2', sender: 'parent', message: 'Thank you for the reminder. I will attend. Can I schedule specific time slots for Form 4A and Form 2B teachers?', time: '10:30 AM' },
  { id: '3', sender: 'school', message: 'Of course! We have slots available between 9:00 AM and 4:00 PM. Would 10:00 AM for Mr. Hove (Maths) and 10:30 AM for Mrs. Mlambo (English) work for you?', time: '11:15 AM' },
  { id: '4', sender: 'parent', message: 'That works perfectly. Also, I\'d like to meet with Mr. Gumbo regarding Kudzai\'s homework. Do you have a slot around 11:00 AM?', time: '11:45 AM' },
  { id: '5', sender: 'school', message: 'Yes, 11:00 AM with Mr. Gumbo is confirmed. We look forward to seeing you on March 20th!', time: '12:00 PM' },
]

const mockCalendarEvents: CalendarEvent[] = [
  { id: '1', title: 'ZIMSEC O-Level Oral Exams', date: '2026-03-10', type: 'exam', description: 'Tendai - English and Shona oral examinations' },
  { id: '2', title: 'District Essay Competition', date: '2026-03-15', type: 'event', description: 'Chido representing the school' },
  { id: '3', title: 'Parent-Teacher Conference', date: '2026-03-20', type: 'meeting', description: 'Term 1 PT Conference - 9:00 AM to 4:00 PM' },
  { id: '4', title: 'Mid-Term Break Begins', date: '2026-03-28', type: 'holiday', description: 'School closes for mid-term break' },
  { id: '5', title: 'School Reopens', date: '2026-04-07', type: 'event', description: 'Mid-term break ends' },
  { id: '6', title: 'Independence Day Holiday', date: '2026-04-18', type: 'holiday', description: 'School closed - Zimbabwe Independence Day' },
  { id: '7', title: 'Inter-House Athletics', date: '2026-04-25', type: 'event', description: 'Annual inter-house athletics competition' },
  { id: '8', title: 'SDC Quarterly Meeting', date: '2026-04-10', type: 'meeting', description: 'School Development Committee meeting' },
  { id: '9', title: 'Term 1 Exams Begin', date: '2026-05-04', type: 'exam', description: 'End of term examinations for all grades' },
  { id: '10', title: 'Term 1 Ends', date: '2026-05-22', type: 'event', description: 'School closes for Term 1' },
  { id: '11', title: 'Science Fair', date: '2026-03-22', type: 'event', description: 'Annual school science fair' },
  { id: '12', title: 'Form 4 Mock Exams', date: '2026-05-11', type: 'exam', description: 'Tendai - ZIMSEC mock examinations' },
]

const feeChartConfig = {
  outstanding: { label: 'Outstanding', color: '#f59e0b' },
  paid: { label: 'Paid', color: '#10b981' },
} satisfies ChartConfig

const feeChartData = [
  { child: 'Tendai', outstanding: 175, paid: 695 },
  { child: 'Chido', outstanding: 225, paid: 300 },
  { child: 'Kudzai', outstanding: 400, paid: 0 },
]

const attendanceChartConfig = {
  present: { label: 'Present', color: '#10b981' },
} satisfies ChartConfig

// ─── Helper Functions ─────────────────────────────────────────────────────────
const statusColor = (status: string) => {
  switch (status) {
    case 'Paid': return 'bg-emerald-100 text-emerald-700'
    case 'Partial': return 'bg-amber-100 text-amber-700'
    case 'Pending': return 'bg-blue-100 text-blue-700'
    case 'Overdue': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const gradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-emerald-600'
  if (grade.startsWith('B')) return 'text-teal-600'
  if (grade.startsWith('C')) return 'text-amber-600'
  return 'text-red-600'
}

const eventTypeColor = (type: string) => {
  switch (type) {
    case 'exam': return 'bg-red-100 text-red-700 border-red-200'
    case 'event': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'meeting': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'holiday': return 'bg-teal-100 text-teal-700 border-teal-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const eventTypeIcon = (type: string) => {
  switch (type) {
    case 'exam': return '📝'
    case 'event': return '🎉'
    case 'meeting': return '🤝'
    case 'holiday': return '🏖️'
    default: return '📅'
  }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatCalendarDay = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ZW', { weekday: 'short', month: 'short', day: 'numeric' })
}

const ZIG_RATE = 10.83 // ZiG to USD rate

// ─── Component ────────────────────────────────────────────────────────────────
export default function ParentPortalModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD')
  const [expandedChild, setExpandedChild] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [calendarFilter, setCalendarFilter] = useState('All')
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1)) // March 2026
  const [newMsgRecipient, setNewMsgRecipient] = useState('')
  const [newMsgSubject, setNewMsgSubject] = useState('')
  const [newMsgBody, setNewMsgBody] = useState('')
  const [paynowOpen, setPaynowOpen] = useState(false)
  const [smsOpen, setSmsOpen] = useState(false)
  const [paynowStudent, setPaynowStudent] = useState('')
  const [paynowAmount, setPaynowAmount] = useState(0)

  const totalOutstanding = mockChildren.reduce((s, c) => s + c.outstandingFees, 0) + 400 // include Kudzai extra
  const unreadCount = mockMessages.filter(m => !m.read).length
  const upcomingCount = mockCalendarEvents.filter(e => new Date(e.date) >= new Date()).length

  const formatAmount = (usd: number) => {
    if (currency === 'ZiG') return `ZiG ${(usd * ZIG_RATE).toLocaleString('en-ZW', { minimumFractionDigits: 2 })}`
    return `$${usd.toLocaleString('en-ZW', { minimumFractionDigits: 2 })}`
  }

  const filteredCalendarEvents = mockCalendarEvents.filter(e => {
    if (calendarFilter === 'All') return true
    return e.type === calendarFilter.toLowerCase().slice(0, -1) || e.type === calendarFilter.toLowerCase()
  }).filter(e => {
    const eventDate = new Date(e.date)
    return eventDate.getMonth() === currentMonth.getMonth() && eventDate.getFullYear() === currentMonth.getFullYear()
  })

  const handleSendMessage = () => {
    if (!newMsgRecipient || !newMsgSubject || !newMsgBody) return
    toast.success('Message sent successfully!')
    setNewMsgRecipient('')
    setNewMsgSubject('')
    setNewMsgBody('')
    setComposeOpen(false)
  }

  // ─── Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const calendarDays = (() => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  })()

  const getEventsForDay = (day: number) => {
    return mockCalendarEvents.filter(e => {
      const d = new Date(e.date)
      return d.getDate() === day && d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <UsersRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Parent Portal</h2>
            <p className="text-sm text-muted-foreground">Welcome back, {parentName}</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="children">My Children</TabsTrigger>
          <TabsTrigger value="fees">Fee Payments</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Welcome Banner */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20 text-white text-lg font-bold">{parentInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">Mhoroi, {parentName.split(' ').pop()}!</h3>
                    <p className="text-emerald-100 mt-1">You have {mockChildren.length} children enrolled • {unreadCount} unread messages</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6">
                  <div className="bg-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-emerald-100">Outstanding Balance</p>
                    <p className="text-lg font-bold">{formatAmount(totalOutstanding)}</p>
                  </div>
                  <div className="bg-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-emerald-100">Upcoming Events</p>
                    <p className="text-lg font-bold">{upcomingCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Children Enrolled</p>
                    <p className="text-2xl font-bold">{mockChildren.length}</p>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">All active</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <UsersRound className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fees Outstanding</p>
                    <p className="text-2xl font-bold">{formatAmount(totalOutstanding)}</p>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">2 invoices overdue</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unread Messages</p>
                    <p className="text-2xl font-bold">{unreadCount}</p>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Needs attention</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <MessageSquare className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming Events</p>
                    <p className="text-2xl font-bold">{upcomingCount}</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-violet-600" />
                      <span className="text-xs font-medium text-violet-600">This month</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                    <Calendar className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions + Fee Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: DollarSign, label: 'Pay Fees', color: 'bg-emerald-50 text-emerald-600', action: () => setActiveTab('fees') },
                    { icon: MessageSquare, label: 'Messages', color: 'bg-teal-50 text-teal-600', action: () => setActiveTab('communications') },
                    { icon: GraduationCap, label: 'View Grades', color: 'bg-amber-50 text-amber-600', action: () => setActiveTab('children') },
                    { icon: Calendar, label: 'Events', color: 'bg-violet-50 text-violet-600', action: () => setActiveTab('calendar') },
                    { icon: Phone, label: 'Contact School', color: 'bg-rose-50 text-rose-600', action: () => setComposeOpen(true) },
                    { icon: Receipt, label: 'Payment History', color: 'bg-cyan-50 text-cyan-600', action: () => setActiveTab('fees') },
                  ].map((action, idx) => (
                    <button key={idx} onClick={action.action} className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', action.color)}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Fee Balance Overview</CardTitle>
                <CardDescription>Outstanding vs paid per child</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={feeChartConfig} className="h-[200px] w-full">
                  <BarChart data={feeChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="child" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="outstanding" fill="var(--color-outstanding)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── My Children Tab ────────────────────────────────────────────────── */}
        <TabsContent value="children" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {mockChildren.map((child) => (
              <motion.div key={child.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: parseInt(child.id) * 0.1 }}>
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-0">
                    {/* Child Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-emerald-200">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-lg font-bold">
                              {child.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-bold">{child.name}</h3>
                            <p className="text-sm text-muted-foreground">{child.class} • {child.studentNumber}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => setExpandedChild(expandedChild === child.id ? null : child.id)}
                        >
                          {expandedChild === child.id ? 'Less' : 'More'}
                          {expandedChild === child.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Grades Summary */}
                      <div className="mt-4 grid grid-cols-5 gap-3">
                        {child.grades.map((g) => (
                          <div key={g.subject} className="text-center">
                            <p className="text-[10px] text-muted-foreground truncate">{g.subject}</p>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                              <div
                                className={cn(
                                  'h-1.5 rounded-full transition-all',
                                  g.mark >= 80 ? 'bg-emerald-500' : g.mark >= 60 ? 'bg-amber-500' : 'bg-red-400'
                                )}
                                style={{ width: `${g.mark}%` }}
                              />
                            </div>
                            <p className={cn('text-sm font-bold mt-1', gradeColor(g.grade))}>{g.grade}</p>
                          </div>
                        ))}
                      </div>

                      {/* Quick Stats Row */}
                      <div className="mt-4 flex items-center gap-6 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">Attendance: <span className="font-semibold">{child.attendanceRate}%</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-amber-600" />
                          <span className="text-sm">Outstanding: <span className="font-semibold">{formatAmount(child.outstandingFees)}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-teal-600" />
                          <span className="text-sm">Average: <span className="font-semibold">{Math.round(child.grades.reduce((s, g) => s + g.mark, 0) / child.grades.length)}%</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedChild === child.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="border-t bg-muted/20 p-5 space-y-5">
                            {/* Recent Grades */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-emerald-600" /> Recent Grades
                              </h4>
                              <div className="space-y-2">
                                {child.recentGrades.map((g, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-background rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
                                        g.mark >= 80 ? 'bg-emerald-100 text-emerald-700' : g.mark >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                      )}>
                                        {g.grade}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{g.subject} - {g.test}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(g.date)}</p>
                                      </div>
                                    </div>
                                    <span className="text-sm font-semibold">{g.mark}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Attendance History */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-teal-600" /> Attendance History
                              </h4>
                              <div className="space-y-2">
                                {child.attendanceHistory.map((w, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-background rounded-lg p-3">
                                    <span className="text-sm font-medium">{w.week}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-emerald-600">{w.present} present</span>
                                      {w.absent > 0 && <span className="text-xs text-red-500">{w.absent} absent</span>}
                                      <div className="w-16 bg-muted rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(w.present / 5) * 100}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Discipline Notes */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-500" /> Discipline & Merits
                              </h4>
                              <div className="space-y-2">
                                {child.disciplineNotes.map((n, idx) => (
                                  <div key={idx} className="flex items-start gap-3 bg-background rounded-lg p-3">
                                    <Badge variant="outline" className={cn(
                                      'text-[10px] shrink-0',
                                      n.type === 'Merit' ? 'border-emerald-300 text-emerald-700' : n.type === 'Demerit' ? 'border-red-300 text-red-700' : 'border-amber-300 text-amber-700'
                                    )}>
                                      {n.type}
                                    </Badge>
                                    <div>
                                      <p className="text-sm">{n.note}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{formatDate(n.date)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ─── Fee Payments Tab ────────────────────────────────────────────────── */}
        <TabsContent value="fees" className="space-y-4">
          {/* Currency Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={currency === 'USD' ? 'default' : 'outline'}
                size="sm"
                className={cn(currency === 'USD' && 'bg-emerald-600 hover:bg-emerald-700')}
                onClick={() => setCurrency('USD')}
              >
                USD ($)
              </Button>
              <Button
                variant={currency === 'ZiG' ? 'default' : 'outline'}
                size="sm"
                className={cn(currency === 'ZiG' && 'bg-emerald-600 hover:bg-emerald-700')}
                onClick={() => setCurrency('ZiG')}
              >
                ZiG (ZWL)
              </Button>
              <span className="text-xs text-muted-foreground ml-2">Rate: 1 USD = {ZIG_RATE} ZiG</span>
            </div>
          </div>

          {/* Outstanding Balance Card */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Total Outstanding Balance</p>
                  <p className="text-3xl font-bold mt-1">{formatAmount(totalOutstanding)}</p>
                  <p className="text-amber-100 text-xs mt-2">Across {mockChildren.length} children • 2 invoices overdue</p>
                </div>
                <Button className="bg-white text-amber-700 hover:bg-white/90 gap-2" onClick={() => { setPaynowStudent(''); setPaynowAmount(totalOutstanding); setPaynowOpen(true) }}>
                  <CreditCard className="h-4 w-4" /> Pay Now
                </Button>
              </div>
            </div>
          </Card>

          {/* Invoices List */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" /> Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        inv.status === 'Paid' ? 'bg-emerald-100' : inv.status === 'Partial' ? 'bg-amber-100' : inv.status === 'Overdue' ? 'bg-red-100' : 'bg-blue-100'
                      )}>
                        {inv.status === 'Paid' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
                         inv.status === 'Overdue' ? <AlertCircle className="h-5 w-5 text-red-600" /> :
                         <Clock className="h-5 w-5 text-amber-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.description}</p>
                        <p className="text-xs text-muted-foreground">{inv.studentName} • {inv.invoiceNumber} • Due: {formatDate(inv.dueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold">{formatAmount(inv.amount)}</p>
                        {inv.paid > 0 && inv.paid < inv.amount && (
                          <p className="text-xs text-emerald-600">Paid: {formatAmount(inv.paid)}</p>
                        )}
                      </div>
                      <Badge className={cn('text-[10px]', statusColor(inv.status))}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal-600" /> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPayments.map(pay => (
                  <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pay.description}</p>
                        <p className="text-xs text-muted-foreground">{pay.studentName} • {pay.method} • {formatDate(pay.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">{formatAmount(pay.amount)}</p>
                      <p className="text-xs text-muted-foreground">{pay.receiptNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Communications Tab ──────────────────────────────────────────────── */}
        <TabsContent value="communications" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Messages & Announcements</h3>
              <p className="text-sm text-muted-foreground">{unreadCount} unread messages</p>
            </div>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4" /> Compose
            </Button>
          </div>

          {/* Messages List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Messages</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {mockMessages.map(msg => (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50',
                        !msg.read && 'bg-emerald-50/50 border-l-2 border-emerald-500',
                        selectedMessage?.id === msg.id && 'bg-muted/70'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                            {msg.sender.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={cn('text-sm truncate', !msg.read ? 'font-semibold' : 'font-medium')}>{msg.sender}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatDate(msg.date)}</span>
                          </div>
                          <p className="text-xs font-medium text-foreground/80 truncate">{msg.subject}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{msg.preview}</p>
                        </div>
                      </div>
                      <div className="mt-1 ml-12">
                        <Badge variant="outline" className="text-[9px]">
                          {msg.type === 'announcement' ? '📢 Announcement' : '✉️ Message'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Detail / Chat View */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {selectedMessage ? selectedMessage.subject : 'Select a message'}
                </CardTitle>
                {selectedMessage && (
                  <CardDescription>From: {selectedMessage.sender} ({selectedMessage.senderRole}) • {formatDate(selectedMessage.date)}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedMessage ? (
                  <div className="space-y-4">
                    {/* Full message */}
                    <div className="bg-muted/30 rounded-lg p-4">
                      <pre className="text-sm whitespace-pre-wrap font-sans">{selectedMessage.fullMessage}</pre>
                    </div>

                    {/* WhatsApp-style Chat */}
                    <div className="space-y-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Conversation</p>
                      {mockConversation.map(chat => (
                        <div key={chat.id} className={cn(
                          'flex',
                          chat.sender === 'parent' ? 'justify-end' : 'justify-start'
                        )}>
                          <div className={cn(
                            'max-w-[80%] rounded-xl px-4 py-2',
                            chat.sender === 'parent'
                              ? 'bg-emerald-500 text-white rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          )}>
                            <p className="text-sm">{chat.message}</p>
                            <p className={cn(
                              'text-[10px] mt-1',
                              chat.sender === 'parent' ? 'text-emerald-100' : 'text-muted-foreground'
                            )}>{chat.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply */}
                    <div className="flex gap-2 pt-2">
                      <Input placeholder="Type a reply..." className="flex-1 h-9" />
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => toast.success('Reply sent!')}>
                        <Send className="h-4 w-4" /> Send
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Select a message to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Calendar Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                ←
              </Button>
              <h3 className="text-base font-semibold min-w-[160px] text-center">
                {currentMonth.toLocaleDateString('en-ZW', { month: 'long', year: 'numeric' })}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                →
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentMonth(new Date(2026, 2, 1))}>
                Today
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {['All', 'Exams', 'Events', 'Meetings', 'Holidays'].map(f => (
                <Button
                  key={f}
                  variant={calendarFilter === f ? 'default' : 'outline'}
                  size="sm"
                  className={cn('text-xs h-7', calendarFilter === f && 'bg-emerald-600 hover:bg-emerald-700')}
                  onClick={() => setCalendarFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          {/* Monthly Grid */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                ))}
              </div>
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const events = day ? getEventsForDay(day) : []
                  const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'min-h-[80px] p-1 rounded-lg border transition-colors',
                        day ? 'bg-background hover:bg-muted/30' : 'bg-muted/10',
                        isToday && 'border-emerald-400 bg-emerald-50/30'
                      )}
                    >
                      {day && (
                        <>
                          <span className={cn(
                            'text-xs font-medium',
                            isToday ? 'text-emerald-600' : 'text-muted-foreground'
                          )}>{day}</span>
                          <div className="space-y-0.5 mt-0.5">
                            {events.slice(0, 2).map(ev => (
                              <div key={ev.id} className={cn('text-[9px] px-1 py-0.5 rounded truncate', eventTypeColor(ev.type))}>
                                {eventTypeIcon(ev.type)} {ev.title}
                              </div>
                            ))}
                            {events.length > 2 && (
                              <p className="text-[9px] text-muted-foreground px-1">+{events.length - 2} more</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events List */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {filteredCalendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-sm', eventTypeColor(ev.type))}>
                      {eventTypeIcon(ev.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{formatCalendarDay(ev.date)} • {ev.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 shrink-0" onClick={() => toast.success('Event added to your calendar!')}>
                      <Plus className="h-3 w-3" /> Add to Calendar
                    </Button>
                  </div>
                ))}
                {filteredCalendarEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No events found for this filter</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Reports Tab ────────────────────────────────────────────────── */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><BookOpen className="h-5 w-5" /> Term Reports & Report Cards</h3>
              <p className="text-emerald-100 text-sm mt-1">Download and view your children&apos;s academic reports</p>
            </div>
          </Card>

          {mockChildren.map(child => (
            <Card key={child.id} className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold">{child.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{child.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{child.class}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => toast.success(`Report card for ${child.name} downloaded!`)}>
                      <Download className="h-3 w-3" /> Download
                    </Button>
                    <Button size="sm" className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.info(`Opening report card preview for ${child.name}`)}>
                      <BookOpen className="h-3 w-3" /> Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Term Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Term Average</p>
                    <p className="text-lg font-bold text-emerald-600">{Math.round(child.grades.reduce((s, g) => s + g.mark, 0) / child.grades.length)}%</p>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-950/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    <p className="text-lg font-bold text-teal-600">{child.attendanceRate}%</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="text-lg font-bold text-amber-600">{formatAmount(child.outstandingFees)}</p>
                  </div>
                </div>

                {/* Subject Grades */}
                <h4 className="text-sm font-semibold mb-2">Term 1, 2026 Results</h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-4 gap-2 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <span>Subject</span><span className="text-center">Mark</span><span className="text-center">Grade</span><span className="text-center">Status</span>
                  </div>
                  {child.grades.map(g => (
                    <div key={g.subject} className="grid grid-cols-4 gap-2 px-3 py-2 rounded-lg bg-muted/30 items-center">
                      <span className="text-sm font-medium">{g.subject}</span>
                      <span className={cn('text-sm text-center font-semibold', g.mark >= 80 ? 'text-emerald-600' : g.mark >= 60 ? 'text-amber-600' : 'text-red-600')}>{g.mark}%</span>
                      <div className="flex justify-center"><Badge className={cn('text-xs', gradeColor(g.grade))}>{g.grade}</Badge></div>
                      <span className="text-xs text-center text-muted-foreground">{g.mark >= 50 ? 'Pass' : 'Fail'}</span>
                    </div>
                  ))}
                </div>

                {/* Teacher Comments */}
                <div className="mt-4 bg-muted/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2">Class Teacher Comment</h4>
                  <p className="text-sm text-muted-foreground italic">{child.attendanceRate >= 90 ? 'A dedicated and hardworking student. Keep up the good work!' : child.attendanceRate >= 80 ? 'Good potential but needs to improve attendance to achieve better results.' : 'Attendance is a concern. Parents are urged to ensure regular school attendance.'}</p>
                  <Separator className="my-3" />
                  <h4 className="text-sm font-semibold mb-2">Headmaster Comment</h4>
                  <p className="text-sm text-muted-foreground italic">Approved. {child.grades.reduce((s, g) => s + g.mark, 0) / child.grades.length >= 70 ? 'Commendable performance this term.' : 'More effort is expected next term.'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

      </Tabs>

      {/* Paynow Payment Dialog */}
      <PaynowDialog
        open={paynowOpen}
        onOpenChange={setPaynowOpen}
        students={mockChildren.map(c => ({ id: c.id, name: c.name, outstandingFees: c.outstandingFees }))}
        defaultStudentId={paynowStudent || undefined}
        defaultAmount={paynowAmount || undefined}
      />

      {/* SMS Dialog */}
      <SmsDialog open={smsOpen} onOpenChange={setSmsOpen} />

      {/* Compose Message Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={newMsgRecipient} onValueChange={setNewMsgRecipient}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="headmaster">Headmaster Ndlovu</SelectItem>
                  <SelectItem value="hove">Mr. Hove (Mathematics)</SelectItem>
                  <SelectItem value="mlambo">Mrs. Mlambo (English)</SelectItem>
                  <SelectItem value="gumbo">Mr. Gumbo (Shona)</SelectItem>
                  <SelectItem value="ncube">Mrs. Ncube (Physics)</SelectItem>
                  <SelectItem value="admin">School Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={newMsgSubject} onChange={e => setNewMsgSubject(e.target.value)} placeholder="Message subject" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={newMsgBody} onChange={e => setNewMsgBody(e.target.value)} placeholder="Type your message..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleSendMessage}>
              <Send className="h-4 w-4" /> Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
