'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Users,
  UserPlus,
  Calendar,
  FileText,
  Copy,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  DollarSign,
  CreditCard,
  Settings,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Globe,
  Radio,
  CalendarDays,
  Timer,
  Hash,
  ToggleLeft,
  Variable,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  Link2,
  Key,
  Server,
  Save,
  X,
  Info,
  AlertCircle,
  BarChart3,
} from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { toast } from 'sonner'

// ─── Chart Configs ──────────────────────────────────────────────────────────

const volumeChartConfig = {
  sms: { label: 'SMS', color: '#10b981' },
  whatsapp: { label: 'WhatsApp', color: '#14b8a6' },
  email: { label: 'Email', color: '#f59e0b' },
} satisfies ChartConfig

const channelPieConfig = {
  value: { label: 'Messages', color: '#10b981' },
} satisfies ChartConfig

const CHANNEL_PIE_COLORS = ['#10b981', '#14b8a6', '#f59e0b']

// ─── Mock Data ──────────────────────────────────────────────────────────────

const messageVolumeData = [
  { day: 'Mon', sms: 32, whatsapp: 48, email: 5 },
  { day: 'Tue', sms: 28, whatsapp: 52, email: 8 },
  { day: 'Wed', sms: 45, whatsapp: 61, email: 12 },
  { day: 'Thu', sms: 38, whatsapp: 55, email: 6 },
  { day: 'Fri', sms: 42, whatsapp: 68, email: 10 },
  { day: 'Sat', sms: 12, whatsapp: 22, email: 3 },
  { day: 'Sun', sms: 5, whatsapp: 10, email: 1 },
]

const channelUsageData = [
  { name: 'SMS', value: 202, fill: '#10b981' },
  { name: 'WhatsApp', value: 316, fill: '#14b8a6' },
  { name: 'Email', value: 45, fill: '#f59e0b' },
]

const recentActivity = [
  { id: '1', type: 'sms', message: 'Fee reminder sent to 45 parents', time: '2 min ago', status: 'delivered', icon: Smartphone },
  { id: '2', type: 'whatsapp', message: 'Meeting notice delivered to SDC members', time: '15 min ago', status: 'delivered', icon: Phone },
  { id: '3', type: 'sms', message: 'Attendance alert for Tendai Moyo sent', time: '32 min ago', status: 'delivered', icon: Smartphone },
  { id: '4', type: 'whatsapp', message: 'Exam schedule broadcast to Form 4 parents', time: '1 hour ago', status: 'delivered', icon: Phone },
  { id: '5', type: 'email', message: 'Term calendar emailed to all parents', time: '2 hours ago', status: 'pending', icon: Mail },
  { id: '6', type: 'sms', message: 'Payment received confirmation to Chido Ndlovu', time: '3 hours ago', status: 'delivered', icon: Smartphone },
  { id: '7', type: 'whatsapp', message: 'Emergency alert: Water cut-off notice', time: '4 hours ago', status: 'failed', icon: Phone },
  { id: '8', type: 'sms', message: 'Holiday notice sent to BEAM beneficiaries', time: '5 hours ago', status: 'delivered', icon: Smartphone },
]

// History data - 30 entries
const historyData = [
  { id: 'h1', date: '2025-03-04 08:15', recipients: 45, channel: 'SMS', subject: 'Fee Reminder - Term 1 2025', status: 'Delivered', deliveryRate: 97.8, phone: '+263 773 123 456' },
  { id: 'h2', date: '2025-03-04 07:30', recipients: 12, channel: 'WhatsApp', subject: 'SDC Meeting Notice - 10 Mar', status: 'Delivered', deliveryRate: 100, phone: '+263 712 345 678' },
  { id: 'h3', date: '2025-03-03 16:45', recipients: 1, channel: 'SMS', subject: 'Absence Alert - Tendai Moyo', status: 'Delivered', deliveryRate: 100, phone: '+263 782 456 789' },
  { id: 'h4', date: '2025-03-03 14:20', recipients: 68, channel: 'WhatsApp', subject: 'Exam Schedule - Mid-Term', status: 'Delivered', deliveryRate: 95.6, phone: '+263 773 234 567' },
  { id: 'h5', date: '2025-03-03 11:00', recipients: 520, channel: 'Email', subject: 'Term 1 Calendar 2025', status: 'Pending', deliveryRate: 78.2, phone: '+263 712 567 890' },
  { id: 'h6', date: '2025-03-02 09:30', recipients: 1, channel: 'SMS', subject: 'Payment Confirmed - $350.00', status: 'Delivered', deliveryRate: 100, phone: '+263 782 678 901' },
  { id: 'h7', date: '2025-03-02 08:00', recipients: 120, channel: 'WhatsApp', subject: 'Emergency: Water Cut-off Notice', status: 'Failed', deliveryRate: 42.5, phone: '+263 773 789 012' },
  { id: 'h8', date: '2025-03-01 15:30', recipients: 35, channel: 'SMS', subject: 'Holiday Notice - Independence Day', status: 'Delivered', deliveryRate: 94.3, phone: '+263 712 890 123' },
  { id: 'h9', date: '2025-03-01 12:00', recipients: 22, channel: 'WhatsApp', subject: 'Sports Day Registration Open', status: 'Delivered', deliveryRate: 100, phone: '+263 782 901 234' },
  { id: 'h10', date: '2025-02-28 10:15', recipients: 45, channel: 'SMS', subject: 'Fee Reminder - Outstanding Balance', status: 'Delivered', deliveryRate: 93.3, phone: '+263 773 012 345' },
  { id: 'h11', date: '2025-02-28 09:00', recipients: 85, channel: 'WhatsApp', subject: 'Parent-Teacher Meeting Invite', status: 'Delivered', deliveryRate: 98.8, phone: '+263 712 123 456' },
  { id: 'h12', date: '2025-02-27 16:30', recipients: 15, channel: 'Email', subject: 'BEAM Application Forms', status: 'Delivered', deliveryRate: 86.7, phone: '+263 782 234 567' },
  { id: 'h13', date: '2025-02-27 14:00', recipients: 3, channel: 'SMS', subject: 'Late Arrival Alert - Form 2B', status: 'Delivered', deliveryRate: 100, phone: '+263 773 345 678' },
  { id: 'h14', date: '2025-02-27 11:30', recipients: 45, channel: 'WhatsApp', subject: 'Results Available - Form 3', status: 'Delivered', deliveryRate: 95.6, phone: '+263 712 456 789' },
  { id: 'h15', date: '2025-02-26 08:45', recipients: 68, channel: 'SMS', subject: 'Fee Reminder - Term 1', status: 'Delivered', deliveryRate: 91.2, phone: '+263 782 567 890' },
  { id: 'h16', date: '2025-02-26 07:30', recipients: 520, channel: 'WhatsApp', subject: 'School Closure - Staff Development', status: 'Delivered', deliveryRate: 97.3, phone: '+263 773 678 901' },
  { id: 'h17', date: '2025-02-25 15:00', recipients: 8, channel: 'SMS', subject: 'Outstanding Balance Alert', status: 'Failed', deliveryRate: 62.5, phone: '+263 712 789 012' },
  { id: 'h18', date: '2025-02-25 12:30', recipients: 45, channel: 'WhatsApp', subject: 'ZIMSEC Registration Reminder', status: 'Delivered', deliveryRate: 100, phone: '+263 782 890 123' },
  { id: 'h19', date: '2025-02-24 10:00', recipients: 12, channel: 'Email', subject: 'SDC Minutes - February Meeting', status: 'Delivered', deliveryRate: 91.7, phone: '+263 773 901 234' },
  { id: 'h20', date: '2025-02-24 08:00', recipients: 35, channel: 'SMS', subject: 'Attendance Alert - 3+ Absences', status: 'Delivered', deliveryRate: 94.3, phone: '+263 712 012 345' },
  { id: 'h21', date: '2025-02-23 14:30', recipients: 520, channel: 'WhatsApp', subject: 'Mid-Term Break Notice', status: 'Delivered', deliveryRate: 96.5, phone: '+263 782 123 456' },
  { id: 'h22', date: '2025-02-23 11:00', recipients: 1, channel: 'SMS', subject: 'Payment Confirmed - $200.00', status: 'Delivered', deliveryRate: 100, phone: '+263 773 234 567' },
  { id: 'h23', date: '2025-02-22 16:00', recipients: 22, channel: 'WhatsApp', subject: 'Inter-House Athletics Day', status: 'Delivered', deliveryRate: 100, phone: '+263 712 345 678' },
  { id: 'h24', date: '2025-02-22 09:30', recipients: 85, channel: 'Email', subject: 'Report Cards - Term 1 Progress', status: 'Pending', deliveryRate: 72.9, phone: '+263 782 456 789' },
  { id: 'h25', date: '2025-02-21 13:00', recipients: 45, channel: 'SMS', subject: 'Fee Reminder - EcoCash Payment', status: 'Delivered', deliveryRate: 88.9, phone: '+263 773 567 890' },
  { id: 'h26', date: '2025-02-21 08:15', recipients: 15, channel: 'WhatsApp', subject: 'Boarding Parents Meeting', status: 'Delivered', deliveryRate: 100, phone: '+263 712 678 901' },
  { id: 'h27', date: '2025-02-20 14:45', recipients: 3, channel: 'SMS', subject: 'Emergency Alert - Storm Warning', status: 'Delivered', deliveryRate: 100, phone: '+263 782 789 012' },
  { id: 'h28', date: '2025-02-20 10:30', recipients: 520, channel: 'WhatsApp', subject: 'Africa Day Holiday Notice', status: 'Delivered', deliveryRate: 94.2, phone: '+263 773 890 123' },
  { id: 'h29', date: '2025-02-19 09:00', recipients: 68, channel: 'Email', subject: 'School Uniform Policy Update', status: 'Delivered', deliveryRate: 83.8, phone: '+263 712 901 234' },
  { id: 'h30', date: '2025-02-19 07:45', recipients: 45, channel: 'SMS', subject: 'Term Calendar Update', status: 'Delivered', deliveryRate: 95.6, phone: '+263 782 012 345' },
]

// Templates data - 12 templates
const templatesData = [
  {
    id: 't1', name: 'Fee Reminder', category: 'Finance', channels: ['SMS', 'WhatsApp'],
    subject: 'Outstanding Fee Balance',
    body: 'Dear Parent, the outstanding fee balance for {student_name} in {class} is USD {amount}. Please pay via EcoCash or at the school bursar by {date}. Thank you.',
    usageCount: 342, lastUsed: '2025-03-04',
  },
  {
    id: 't2', name: 'Payment Received', category: 'Finance', channels: ['SMS', 'WhatsApp'],
    subject: 'Payment Confirmation',
    body: 'Dear Parent, we have received your payment of USD {amount} for {student_name}. Receipt #{receipt_no}. Balance: USD {balance}. Thank you for your payment.',
    usageCount: 256, lastUsed: '2025-03-03',
  },
  {
    id: 't3', name: 'Outstanding Balance Alert', category: 'Finance', channels: ['SMS'],
    subject: 'Urgent: Outstanding Fees',
    body: 'URGENT: {student_name} ({class}) has an outstanding balance of USD {amount}. Payment is overdue by {days_overdue} days. Please settle immediately to avoid penalties.',
    usageCount: 128, lastUsed: '2025-03-02',
  },
  {
    id: 't4', name: 'Exam Schedule', category: 'Academics', channels: ['SMS', 'WhatsApp', 'Email'],
    subject: 'Examination Timetable',
    body: 'Dear Parent, the {exam_type} examinations for {class} will commence on {date}. Please ensure {student_name} is well prepared. Timetable available at the school office.',
    usageCount: 189, lastUsed: '2025-03-03',
  },
  {
    id: 't5', name: 'Results Available', category: 'Academics', channels: ['WhatsApp', 'Email'],
    subject: 'Examination Results Ready',
    body: 'Dear Parent, {exam_type} results for {student_name} ({class}) are now available. Please collect from the school office or view on the parent portal.',
    usageCount: 145, lastUsed: '2025-02-27',
  },
  {
    id: 't6', name: 'Parent-Teacher Meeting', category: 'Academics', channels: ['WhatsApp', 'Email'],
    subject: 'Parent-Teacher Consultation',
    body: 'Dear Parent, you are invited to a parent-teacher meeting on {date} at {time} in the school hall. Your child {student_name} in {class} would benefit from your attendance.',
    usageCount: 98, lastUsed: '2025-02-28',
  },
  {
    id: 't7', name: 'Absence Notification', category: 'Attendance', channels: ['SMS', 'WhatsApp'],
    subject: 'Student Absence Alert',
    body: 'Dear Parent, {student_name} in {class} was absent from school today ({date}). Please notify the school of the reason. Contact: +263 773 800 900.',
    usageCount: 412, lastUsed: '2025-03-04',
  },
  {
    id: 't8', name: 'Late Arrival Alert', category: 'Attendance', channels: ['SMS'],
    subject: 'Late Arrival Notice',
    body: 'Dear Parent, {student_name} arrived late at school today at {time}. Punctuality is important for academic success. Please ensure timely arrival.',
    usageCount: 67, lastUsed: '2025-02-27',
  },
  {
    id: 't9', name: 'Holiday Notice', category: 'General', channels: ['SMS', 'WhatsApp', 'Email'],
    subject: 'School Holiday Notice',
    body: 'Dear Parent, school will be closed from {date} to {end_date} for {holiday_name}. Students resume on {resume_date}. Have a safe holiday!',
    usageCount: 234, lastUsed: '2025-03-01',
  },
  {
    id: 't10', name: 'School Closure', category: 'General', channels: ['SMS', 'WhatsApp'],
    subject: 'School Closure Notice',
    body: 'URGENT: School will be closed on {date} due to {reason}. Please make arrangements for {student_name}. We will notify you when school reopens.',
    usageCount: 45, lastUsed: '2025-02-26',
  },
  {
    id: 't11', name: 'Emergency Alert', category: 'General', channels: ['SMS', 'WhatsApp'],
    subject: 'Emergency Notification',
    body: 'EMERGENCY: {message}. All parents are advised to {action}. Contact the school at +263 773 800 900 for more information. Student safety is our priority.',
    usageCount: 23, lastUsed: '2025-02-20',
  },
  {
    id: 't12', name: 'Term Calendar', category: 'General', channels: ['WhatsApp', 'Email'],
    subject: 'Term Calendar 2025',
    body: 'Dear Parent, the Term {term} calendar is now available. Key dates: Opening - {date}, Mid-term - {mid_date}, Closing - {end_date}. Full calendar on the parent portal.',
    usageCount: 178, lastUsed: '2025-02-19',
  },
]

// ─── Helper Functions ───────────────────────────────────────────────────────

const channelConfig: Record<string, { label: string; icon: React.ElementType; badgeClass: string }> = {
  SMS: { label: 'SMS', icon: Smartphone, badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  WhatsApp: { label: 'WhatsApp', icon: Phone, badgeClass: 'bg-teal-100 text-teal-700 border-teal-200' },
  Email: { label: 'Email', icon: Mail, badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
}

const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ElementType }> = {
  Delivered: { label: 'Delivered', badgeClass: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  Pending: { label: 'Pending', badgeClass: 'bg-amber-100 text-amber-700', icon: Clock },
  Failed: { label: 'Failed', badgeClass: 'bg-red-100 text-red-700', icon: XCircle },
}

const categoryConfig: Record<string, { label: string; badgeClass: string }> = {
  Finance: { label: 'Finance', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  Academics: { label: 'Academics', badgeClass: 'bg-teal-100 text-teal-700 border-teal-200' },
  Attendance: { label: 'Attendance', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  General: { label: 'General', badgeClass: 'bg-violet-100 text-violet-700 border-violet-200' },
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function NotificationCenterModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)
  const [templateDetailOpen, setTemplateDetailOpen] = useState<string | null>(null)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyChannelFilter, setHistoryChannelFilter] = useState('All')
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All')
  const [deliveryDetailOpen, setDeliveryDetailOpen] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Compose form state
  const [composeChannel, setComposeChannel] = useState('SMS')
  const [composeRecipients, setComposeRecipients] = useState('all_parents')
  const [composeTemplate, setComposeTemplate] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [scheduleToggle, setScheduleToggle] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  // Settings state
  const [settingsTab, setSettingsTab] = useState('gateway')

  // Computed recipient count
  const recipientCounts: Record<string, number> = {
    all_parents: 520,
    form4_parents: 68,
    sdc_members: 12,
    staff: 45,
    beam_beneficiaries: 35,
  }
  const currentRecipientCount = recipientCounts[composeRecipients] || 0
  const smsCreditsNeeded = composeChannel === 'SMS'
    ? currentRecipientCount
    : composeChannel === 'All'
    ? currentRecipientCount
    : 0

  // Filtered history
  const filteredHistory = useMemo(() => {
    return historyData.filter((h) => {
      const matchSearch = !historySearch ||
        h.subject.toLowerCase().includes(historySearch.toLowerCase()) ||
        h.phone.includes(historySearch)
      const matchChannel = historyChannelFilter === 'All' || h.channel === historyChannelFilter
      const matchStatus = historyStatusFilter === 'All' || h.status === historyStatusFilter
      return matchSearch && matchChannel && matchStatus
    })
  }, [historySearch, historyChannelFilter, historyStatusFilter])

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = templatesData.find((t) => t.id === templateId)
    if (template) {
      setComposeMessage(template.body)
      setComposeSubject(template.subject)
      setComposeTemplate(templateId)
    }
  }

  // Handle send
  const handleSend = () => {
    setConfirmSendOpen(true)
  }

  const confirmSend = async () => {
    setSending(true)
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500))
    setSending(false)
    setConfirmSendOpen(false)
    setComposeMessage('')
    setComposeSubject('')
    setComposeTemplate('')
    setComposeChannel('SMS')
    setComposeRecipients('all_parents')
    setScheduleToggle(false)
    setScheduleDate('')
    setScheduleTime('')
    toast.success('Message sent successfully!', {
      description: `Message delivered to ${currentRecipientCount} recipients via ${composeChannel}`,
    })
  }

  // Copy template
  const copyTemplate = (body: string) => {
    navigator.clipboard.writeText(body)
    toast.success('Template copied to clipboard')
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">SMS, WhatsApp & Email notifications powered by Africa&apos;s Talking</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Africa&apos;s Talking: Connected
          </Badge>
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1 px-3 py-1">
            <Phone className="h-3 w-3" />
            WhatsApp: Active
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="compose" className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Messages Sent Today</p>
                    <p className="text-2xl font-bold tracking-tight">45</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+12% vs yesterday</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Send className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Rate</p>
                    <p className="text-2xl font-bold tracking-tight">94.2%</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+2.1% this week</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SMS Credits Remaining</p>
                    <p className="text-2xl font-bold tracking-tight">2,350</p>
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">~52 days left</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">WhatsApp Messages</p>
                    <p className="text-2xl font-bold tracking-tight">128</p>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Primary channel</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Phone className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-emerald-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Message Volume Trend */}
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Message Volume (7 Days)</CardTitle>
                <CardDescription>SMS, WhatsApp & Email trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={volumeChartConfig} className="h-[250px] w-full">
                  <LineChart data={messageVolumeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="sms" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                    <Line type="monotone" dataKey="whatsapp" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3, fill: '#14b8a6' }} />
                    <Line type="monotone" dataKey="email" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Channel Usage Pie */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Channel Usage</CardTitle>
                <CardDescription>Messages by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={channelPieConfig} className="h-[200px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={channelUsageData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {channelUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHANNEL_PIE_COLORS[index % CHANNEL_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex items-center justify-center gap-4 mt-2">
                  {channelUsageData.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHANNEL_PIE_COLORS[i] }} />
                      <span className="text-xs text-muted-foreground">{c.name} ({c.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row: Recent Activity + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Activity Feed */}
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription>Latest notification activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[340px]">
                  <div className="space-y-3">
                    {recentActivity.map((activity, idx) => {
                      const IconComp = activity.icon
                      const statusConf = statusConfig[activity.status === 'delivered' ? 'Delivered' : activity.status === 'pending' ? 'Pending' : 'Failed']
                      const StatusIcon = statusConf.icon
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                        >
                          <div className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            activity.type === 'sms' ? 'bg-emerald-50 text-emerald-600' :
                            activity.type === 'whatsapp' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                          )}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', statusConf.badgeClass)}>
                                <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
                                {statusConf.label}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions + Integration Status */}
            <div className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Send, label: 'Send Bulk SMS', color: 'bg-emerald-50 text-emerald-600', action: () => { setActiveTab('compose'); setComposeChannel('SMS') } },
                      { icon: MessageSquare, label: 'Compose Message', color: 'bg-teal-50 text-teal-600', action: () => setActiveTab('compose') },
                      { icon: FileText, label: 'View Templates', color: 'bg-amber-50 text-amber-600', action: () => setActiveTab('templates') },
                      { icon: CreditCard, label: 'Check Credits', color: 'bg-violet-50 text-violet-600', action: () => setActiveTab('settings') },
                    ].map((qa) => (
                      <button
                        key={qa.label}
                        onClick={qa.action}
                        className="flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/20 hover:bg-white"
                      >
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', qa.color)}>
                          <qa.icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{qa.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Africa's Talking Integration */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Integration Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium">Africa&apos;s Talking</p>
                        <p className="text-xs text-muted-foreground">SMS Gateway</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-100">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-teal-600" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp Business</p>
                        <p className="text-xs text-muted-foreground">API Connected</p>
                      </div>
                    </div>
                    <Badge className="bg-teal-100 text-teal-700 text-[10px]">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium">SMTP Server</p>
                        <p className="text-xs text-muted-foreground">Email Gateway</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">EcoCash</p>
                        <p className="text-xs text-muted-foreground">Payment Reminders</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Pending</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Compose Tab ───────────────────────────────────────────────── */}
        <TabsContent value="compose" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Compose Form */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Compose Message</CardTitle>
                  <CardDescription>Create and send notifications to parents, staff, and guardians</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Channel & Recipients Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Channel</Label>
                      <Select value={composeChannel} onValueChange={setComposeChannel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMS">📱 SMS</SelectItem>
                          <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
                          <SelectItem value="Email">📧 Email</SelectItem>
                          <SelectItem value="All">📢 All Channels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Recipient Group</Label>
                      <Select value={composeRecipients} onValueChange={setComposeRecipients}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_parents">All Parents (520)</SelectItem>
                          <SelectItem value="form4_parents">Form 4 Parents (68)</SelectItem>
                          <SelectItem value="sdc_members">SDC Members (12)</SelectItem>
                          <SelectItem value="staff">Staff (45)</SelectItem>
                          <SelectItem value="beam_beneficiaries">BEAM Beneficiaries (35)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Individual Recipient Search */}
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Individual Recipient (Optional)</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by name or phone (+263...)" className="pl-9" />
                    </div>
                  </div>

                  {/* Template Selector */}
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Message Template</Label>
                    <Select value={composeTemplate} onValueChange={applyTemplate}>
                      <SelectTrigger><SelectValue placeholder="Choose a template (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="t1">Fee Reminder</SelectItem>
                        <SelectItem value="t2">Payment Received</SelectItem>
                        <SelectItem value="t3">Outstanding Balance Alert</SelectItem>
                        <SelectItem value="t4">Exam Schedule</SelectItem>
                        <SelectItem value="t5">Results Available</SelectItem>
                        <SelectItem value="t6">Parent-Teacher Meeting</SelectItem>
                        <SelectItem value="t7">Absence Notification</SelectItem>
                        <SelectItem value="t8">Late Arrival Alert</SelectItem>
                        <SelectItem value="t9">Holiday Notice</SelectItem>
                        <SelectItem value="t10">School Closure</SelectItem>
                        <SelectItem value="t11">Emergency Alert</SelectItem>
                        <SelectItem value="t12">Term Calendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject (for Email) */}
                  {(composeChannel === 'Email' || composeChannel === 'All') && (
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Subject</Label>
                      <Input
                        placeholder="Email subject line"
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Message Text Area */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Message</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
                              <Variable className="h-3 w-3 mr-1" />
                              Variables
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="w-64">
                            <p className="text-xs font-medium mb-1">Available placeholders:</p>
                            <p className="text-xs text-muted-foreground">
                              {'{student_name}'}, {'{class}'}, {'{amount}'}, {'{date}'}, {'{term}'}, {'{receipt_no}'}, {'{balance}'}, {'{days_overdue}'}, {'{exam_type}'}, {'{event_name}'}, {'{venue}'}, {'{time}'}, {'{message}'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      placeholder="Type your message here... Use {student_name}, {class}, {amount}, {date} as placeholders"
                      className="min-h-[180px] resize-none"
                      value={composeMessage}
                      onChange={(e) => setComposeMessage(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-xs font-medium',
                          composeMessage.length > 160 ? 'text-red-500' : 'text-muted-foreground'
                        )}>
                          {composeMessage.length} / 160 chars (SMS)
                        </span>
                        {composeMessage.length > 160 && (
                          <span className="text-xs text-amber-600">
                            ⚠ {Math.ceil(composeMessage.length / 160)} SMS credits per recipient
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        WhatsApp: {composeMessage.length} chars
                      </span>
                    </div>
                  </div>

                  {/* Schedule Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
                    <div className="flex items-center gap-3">
                      <Timer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Schedule for Later</p>
                        <p className="text-xs text-muted-foreground">Set a date and time to send the message</p>
                      </div>
                    </div>
                    <Switch
                      checked={scheduleToggle}
                      onCheckedChange={setScheduleToggle}
                    />
                  </div>
                  {scheduleToggle && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="grid gap-2">
                        <Label className="text-sm">Date</Label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm">Time</Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t pt-4">
                  <div />
                  <Button
                    onClick={handleSend}
                    disabled={!composeMessage || sending}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {scheduleToggle ? 'Schedule Message' : 'Send Message'}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Sidebar: Preview & Cost */}
            <div className="space-y-4">
              {/* Preview Panel */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Message Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl bg-muted/30 border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', channelConfig[composeChannel === 'All' ? 'SMS' : composeChannel]?.badgeClass)}>
                        {composeChannel === 'All' ? 'All Channels' : composeChannel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-muted/50">
                        To: {currentRecipientCount} recipients
                      </Badge>
                    </div>
                    {(composeChannel === 'Email' || composeChannel === 'All') && composeSubject && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                        <p className="text-sm font-medium">{composeSubject}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Message:</p>
                      <div className="text-sm bg-white dark:bg-background rounded-lg p-3 border">
                        {composeMessage
                          ? composeMessage
                              .replace('{student_name}', 'Tendai Moyo')
                              .replace('{class}', 'Form 3A')
                              .replace('{amount}', '350.00')
                              .replace('{date}', '15 Mar 2025')
                              .replace('{term}', 'Term 1')
                              .replace('{receipt_no}', 'RCP-2025-0456')
                              .replace('{balance}', '150.00')
                              .replace('{days_overdue}', '14')
                              .replace('{exam_type}', 'Mid-Term')
                              .replace('{event_name}', 'SDC Meeting')
                              .replace('{venue}', 'School Hall')
                              .replace('{time}', '2:00 PM')
                              .replace('{message}', 'your attention is required')
                              .replace('{action}', 'collect children promptly')
                          : (
                            <span className="text-muted-foreground italic">Your message preview will appear here...</span>
                          )
                        }
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Placeholders replaced with sample data for preview
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Calculator */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cost Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Channel</span>
                    <span className="font-medium">{composeChannel}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recipients</span>
                    <span className="font-medium">{currentRecipientCount}</span>
                  </div>
                  {(composeChannel === 'SMS' || composeChannel === 'All') && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">SMS Credits per Recipient</span>
                        <span className="font-medium">{Math.ceil(Math.max(composeMessage.length, 1) / 160)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total SMS Credits</span>
                        <span className="font-bold text-emerald-600">
                          {currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Cost (USD)</span>
                        <span className="font-bold text-emerald-600">
                          ${(currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160) * 0.02).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  {composeChannel === 'WhatsApp' && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">WhatsApp Messages</span>
                        <span className="font-bold text-teal-600">{currentRecipientCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost (WhatsApp API)</span>
                        <span className="font-bold text-teal-600">${(currentRecipientCount * 0.005).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {composeChannel === 'Email' && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Emails</span>
                        <span className="font-bold text-amber-600">{currentRecipientCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost (SMTP)</span>
                        <span className="font-bold text-amber-600">Free</span>
                      </div>
                    </>
                  )}
                  {composeChannel === 'All' && (
                    <>
                      <Separator />
                      <div className="p-3 rounded-lg bg-muted/30 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span>SMS Credits</span>
                          <span className="font-medium">{currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>WhatsApp</span>
                          <span className="font-medium">{currentRecipientCount} msgs</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Emails</span>
                          <span className="font-medium">{currentRecipientCount} free</span>
                        </div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credits After Send</span>
                    <span className={cn(
                      'font-bold',
                      2350 - (composeChannel === 'SMS' || composeChannel === 'All'
                        ? currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160)
                        : 0) < 500 ? 'text-red-600' : 'text-emerald-600'
                    )}>
                      {2350 - (composeChannel === 'SMS' || composeChannel === 'All'
                        ? currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160)
                        : 0)}
                    </span>
                  </div>
                  <Progress
                    value={((2350 - (composeChannel === 'SMS' || composeChannel === 'All'
                      ? currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160)
                      : 0)) / 5000) * 100}
                    className="h-2"
                  />
                  <p className="text-[10px] text-muted-foreground text-center">2,350 / 5,000 credits remaining</p>
                </CardContent>
              </Card>

              {/* EcoCash Notice */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">EcoCash Payment Reminders</p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Include EcoCash merchant code in fee reminders. Parents can pay directly via mobile money.
                        Merchant: 0773 800 900
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── History Tab ───────────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by subject or phone number..."
                    className="pl-9"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={historyChannelFilter} onValueChange={setHistoryChannelFilter}>
                    <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Channel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Channels</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                    <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Recipients</TableHead>
                      <TableHead className="text-xs font-semibold">Channel</TableHead>
                      <TableHead className="text-xs font-semibold">Subject / Preview</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Delivery Rate</TableHead>
                      <TableHead className="text-xs font-semibold">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((h) => {
                      const ch = channelConfig[h.channel] || channelConfig.SMS
                      const st = statusConfig[h.status] || statusConfig.Pending
                      const ChIcon = ch.icon
                      const StIcon = st.icon
                      return (
                        <TableRow key={h.id} className="hover:bg-muted/30 cursor-pointer">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{h.date}</TableCell>
                          <TableCell className="text-sm font-medium">{h.recipients}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', ch.badgeClass)}>
                              <ChIcon className="mr-1 h-3 w-3" />
                              {ch.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[220px] truncate">{h.subject}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px] gap-0.5', st.badgeClass)}>
                              <StIcon className="h-3 w-3" />
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Progress
                                value={h.deliveryRate}
                                className={cn(
                                  'h-1.5 w-16',
                                  h.deliveryRate >= 95 ? '[&>div]:bg-emerald-500' :
                                  h.deliveryRate >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                                )}
                              />
                              <span className={cn(
                                'text-xs font-medium',
                                h.deliveryRate >= 95 ? 'text-emerald-600' :
                                h.deliveryRate >= 80 ? 'text-amber-600' : 'text-red-600'
                              )}>
                                {h.deliveryRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-emerald-600"
                              onClick={() => setDeliveryDetailOpen(h.id)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p>No messages found matching your filters</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {filteredHistory.length} of {historyData.length} messages
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Delivered: {historyData.filter(h => h.status === 'Delivered').length}</span>
                <span>Pending: {historyData.filter(h => h.status === 'Pending').length}</span>
                <span>Failed: {historyData.filter(h => h.status === 'Failed').length}</span>
              </div>
            </CardFooter>
          </Card>

          {/* Delivery Detail Dialog */}
          <Dialog open={!!deliveryDetailOpen} onOpenChange={() => setDeliveryDetailOpen(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Delivery Details</DialogTitle>
                <DialogDescription>Per-recipient delivery breakdown</DialogDescription>
              </DialogHeader>
              {deliveryDetailOpen && (() => {
                const msg = historyData.find(h => h.id === deliveryDetailOpen)
                if (!msg) return null
                const delivered = Math.round(msg.recipients * msg.deliveryRate / 100)
                const failed = Math.round(msg.recipients * (100 - msg.deliveryRate) / 100 * 0.6)
                const pending = msg.recipients - delivered - failed
                const sampleRecipients = [
                  { name: 'Mai Moyo', phone: '+263 773 123 456', status: 'Delivered', time: msg.date },
                  { name: 'Baba Ndlovu', phone: '+263 712 345 678', status: 'Delivered', time: msg.date },
                  { name: 'Mai Chikumbu', phone: '+263 782 456 789', status: 'Delivered', time: msg.date },
                  { name: 'Baba Dube', phone: '+263 773 567 890', status: msg.deliveryRate < 90 ? 'Failed' : 'Delivered', time: msg.date },
                  { name: 'Mai Gumbo', phone: '+263 712 678 901', status: pending > 0 ? 'Pending' : 'Delivered', time: msg.date },
                  { name: 'Baba Zvinavashe', phone: '+263 782 789 012', status: msg.deliveryRate < 85 ? 'Failed' : 'Delivered', time: msg.date },
                ]
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-50 text-center">
                        <p className="text-lg font-bold text-emerald-600">{delivered}</p>
                        <p className="text-xs text-emerald-600">Delivered</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 text-center">
                        <p className="text-lg font-bold text-amber-600">{pending}</p>
                        <p className="text-xs text-amber-600">Pending</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-50 text-center">
                        <p className="text-lg font-bold text-red-600">{failed}</p>
                        <p className="text-xs text-red-600">Failed</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium mb-2">{msg.subject}</p>
                      {sampleRecipients.map((r, i) => {
                        const stConf = statusConfig[r.status] || statusConfig.Pending
                        return (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {r.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{r.name}</p>
                                <p className="text-xs text-muted-foreground">{r.phone}</p>
                              </div>
                            </div>
                            <Badge className={cn('text-[10px]', stConf.badgeClass)}>{r.status}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── Templates Tab ─────────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          {/* Header with Create */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Message Templates</h2>
              <p className="text-sm text-muted-foreground">{templatesData.length} templates organized by category</p>
            </div>
            <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create Message Template</DialogTitle>
                  <DialogDescription>Design a reusable template with variable placeholders</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Template Name</Label>
                    <Input placeholder="e.g., Sports Day Notice" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Academics">Academics</SelectItem>
                          <SelectItem value="Attendance">Attendance</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Channels</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select channels" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms_whatsapp">SMS + WhatsApp</SelectItem>
                          <SelectItem value="all">All Channels</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="whatsapp_email">WhatsApp + Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Input placeholder="Template subject line" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Message Body</Label>
                    <Textarea
                      placeholder="Dear Parent, ... Use {student_name}, {class}, {amount}, {date} as placeholders"
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateTemplateOpen(false)}>Cancel</Button>
                  <Button onClick={() => { setCreateTemplateOpen(false); toast.success('Template created successfully') }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Template Categories */}
          {['Finance', 'Academics', 'Attendance', 'General'].map((category) => {
            const categoryTemplates = templatesData.filter((t) => t.category === category)
            const catConf = categoryConfig[category]
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs px-2.5 py-0.5', catConf.badgeClass)}>
                    {catConf.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{categoryTemplates.length} templates</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {categoryTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
                        <CardContent className="p-4 flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-sm font-semibold">{template.name}</p>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 shrink-0', catConf.badgeClass)}>
                              {category}
                            </Badge>
                          </div>
                          {/* Channel badges */}
                          <div className="flex items-center gap-1.5 mb-3">
                            {template.channels.map((ch) => {
                              const chConf = channelConfig[ch]
                              const ChIcon = chConf.icon
                              return (
                                <Badge key={ch} variant="outline" className={cn('text-[10px] px-1.5 py-0', chConf.badgeClass)}>
                                  <ChIcon className="mr-0.5 h-2.5 w-2.5" />
                                  {chConf.label}
                                </Badge>
                              )
                            })}
                          </div>
                          {/* Subject */}
                          <p className="text-xs font-medium text-muted-foreground mb-1">Subject: {template.subject}</p>
                          {/* Body preview */}
                          <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{template.body}</p>
                          {/* Usage stats */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span>Used {template.usageCount}x</span>
                              <span>Last: {template.lastUsed}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600"
                                      onClick={() => { applyTemplate(template.id); setActiveTab('compose') }}
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Use Template</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-teal-600"
                                      onClick={() => copyTemplate(template.body)}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </TabsContent>

        {/* ─── Settings Tab ──────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* SMS Gateway Config */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    SMS Gateway - Africa&apos;s Talking
                  </CardTitle>
                  <CardDescription>Configure Africa&apos;s Talking SMS integration for Zimbabwe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm">API Key</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" defaultValue="atsk_xxxxxxxxxxxxxxxxxxxx" className="pl-9" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">Username</Label>
                      <Input defaultValue="zimschool_pro" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm">Sender ID</Label>
                      <Input defaultValue="ZimSchool" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">Shortcode</Label>
                      <Input defaultValue="22045" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-700">API connection verified - Last checked 5 min ago</span>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2" onClick={() => toast.info('Testing connection...')}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => toast.success('SMS gateway settings saved')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp Business API Config */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5 text-teal-600" />
                    WhatsApp Business API
                  </CardTitle>
                  <CardDescription>WhatsApp Business integration for parent communications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm">Phone Number ID</Label>
                      <Input defaultValue="105xxxxxxxxxxxx" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">Business Account ID</Label>
                      <Input defaultValue="1234567890" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm">Access Token</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" defaultValue="EAAxxxxxxxxxxxxxxxxx" className="pl-9" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">Webhook Verify Token</Label>
                      <Input type="password" defaultValue="zimschool_verify_xxxx" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 border border-teal-100">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                    <span className="text-xs text-teal-700">WhatsApp Business API connected - +263 773 800 900</span>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => toast.success('WhatsApp settings saved')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email SMTP Config */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-600" />
                    Email SMTP Configuration
                  </CardTitle>
                  <CardDescription>SMTP settings for email notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm">SMTP Host</Label>
                      <div className="relative">
                        <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input defaultValue="smtp.zimschool.co.zw" className="pl-9" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">Port</Label>
                      <Input defaultValue="587" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm">Username</Label>
                      <Input defaultValue="notifications@zimschool.co.zw" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">Password</Label>
                      <Input type="password" defaultValue="smtp_password_xxxx" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm">From Name</Label>
                      <Input defaultValue="ZimSchool Pro" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">From Email</Label>
                      <Input defaultValue="notifications@zimschool.co.zw" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => toast.success('SMTP settings saved')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Notification Rules */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    Auto-Notification Rules
                  </CardTitle>
                  <CardDescription>Automated notifications triggered by school events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      id: 'rule1',
                      name: 'Fee Reminder',
                      description: 'Send fee reminder 7 days before due date',
                      channel: 'SMS + WhatsApp',
                      icon: DollarSign,
                      enabled: true,
                      color: 'bg-emerald-50 text-emerald-600',
                    },
                    {
                      id: 'rule2',
                      name: 'Attendance Alert',
                      description: 'Alert parents after 3+ consecutive absences',
                      channel: 'SMS + WhatsApp',
                      icon: AlertTriangle,
                      enabled: true,
                      color: 'bg-amber-50 text-amber-600',
                    },
                    {
                      id: 'rule3',
                      name: 'Exam Reminder',
                      description: 'Send exam reminder 3 days before exam date',
                      channel: 'WhatsApp + Email',
                      icon: FileText,
                      enabled: true,
                      color: 'bg-teal-50 text-teal-600',
                    },
                    {
                      id: 'rule4',
                      name: 'Payment Confirmation',
                      description: 'Auto-confirm when fee payment is recorded',
                      channel: 'SMS',
                      icon: CheckCircle2,
                      enabled: true,
                      color: 'bg-emerald-50 text-emerald-600',
                    },
                    {
                      id: 'rule5',
                      name: 'Report Card Available',
                      description: 'Notify parents when term results are published',
                      channel: 'WhatsApp + Email',
                      icon: BarChart3,
                      enabled: false,
                      color: 'bg-violet-50 text-violet-600',
                    },
                    {
                      id: 'rule6',
                      name: 'EcoCash Payment Link',
                      description: 'Include EcoCash payment link in fee reminders',
                      channel: 'SMS + WhatsApp',
                      icon: DollarSign,
                      enabled: false,
                      color: 'bg-amber-50 text-amber-600',
                    },
                  ].map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', rule.color)}>
                          <rule.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                          <Badge variant="outline" className="text-[10px] mt-1">{rule.channel}</Badge>
                        </div>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toast.success(`${rule.name} ${rule.enabled ? 'disabled' : 'enabled'}`)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* SMS Credit Balance */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">SMS Credit Balance</span>
                  </div>
                  <p className="text-4xl font-bold mb-1">2,350</p>
                  <p className="text-sm opacity-80 mb-4">of 5,000 credits</p>
                  <Progress value={47} className="h-2 bg-white/20 [&>div]:bg-white" />
                  <p className="text-xs opacity-70 mt-2">Expires: Dec 2025</p>
                  <Button
                    className="w-full mt-4 bg-white text-emerald-700 hover:bg-white/90 font-semibold"
                    onClick={() => toast.info('Redirecting to Africa\'s Talking dashboard to purchase credits...')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Purchase Credits (USD)
                  </Button>
                </CardContent>
              </Card>

              {/* Delivery Report Settings */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Delivery Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Daily Digest</p>
                      <p className="text-xs text-muted-foreground">Email summary at 5:00 PM</p>
                    </div>
                    <Switch defaultChecked onCheckedChange={() => toast.success('Setting updated')} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Failure Alerts</p>
                      <p className="text-xs text-muted-foreground">Immediate notification on failures</p>
                    </div>
                    <Switch defaultChecked onCheckedChange={() => toast.success('Setting updated')} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Weekly Report</p>
                      <p className="text-xs text-muted-foreground">Comprehensive weekly analytics</p>
                    </div>
                    <Switch defaultChecked onCheckedChange={() => toast.success('Setting updated')} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Report Email</p>
                      <p className="text-xs text-muted-foreground">admin@zimschool.co.zw</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600">Change</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Opt-Out Management */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Opt-Out Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50 text-center">
                      <p className="text-lg font-bold text-emerald-600">520</p>
                      <p className="text-[10px] text-emerald-600">Subscribed</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-50 text-center">
                      <p className="text-lg font-bold text-red-600">8</p>
                      <p className="text-[10px] text-red-600">Opted Out</p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 text-center">
                      <p className="text-lg font-bold text-amber-600">3</p>
                      <p className="text-[10px] text-amber-600">Pending</p>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Parents can opt out by replying &quot;STOP&quot; to SMS or WhatsApp messages.
                    Opted-out contacts are excluded from all bulk communications.
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: 'Mai Chimbwido', phone: '+263 773 456 789', channel: 'SMS', date: '2025-02-15' },
                      { name: 'Baba Hunzvi', phone: '+263 712 567 890', channel: 'WhatsApp', date: '2025-02-20' },
                      { name: 'Mai Mugaragumbo', phone: '+263 782 678 901', channel: 'SMS', date: '2025-03-01' },
                    ].map((opt, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50/50 border border-red-100">
                        <div>
                          <p className="text-xs font-medium">{opt.name}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                            {opt.channel}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-600" onClick={() => toast.success('Contact re-subscribed')}>
                            Re-subscribe
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Message Send</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send a {composeChannel} message to {currentRecipientCount} recipients.
              {smsCreditsNeeded > 0 && (
                <span className="block mt-2">
                  This will use approximately <strong>{currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160)} SMS credits</strong> (USD ${(currentRecipientCount * Math.ceil(Math.max(composeMessage.length, 1) / 160) * 0.02).toFixed(2)}).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', channelConfig[composeChannel === 'All' ? 'SMS' : composeChannel]?.badgeClass)}>
                {composeChannel}
              </Badge>
              <Badge variant="outline" className="text-xs">{currentRecipientCount} recipients</Badge>
              {scheduleToggle && scheduleDate && (
                <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  Scheduled: {scheduleDate} {scheduleTime}
                </Badge>
              )}
            </div>
            <p className="text-sm line-clamp-3">{composeMessage}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSend}
              disabled={sending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm Send
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
