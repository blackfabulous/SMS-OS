'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  Mail,
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Plus,
  Loader2,
  Filter,
  User,
  Users,
  GraduationCap,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
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
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CommunicationRecord {
  id: string
  channel: string
  subject?: string
  message: string
  status: string
  sentAt?: string
  createdAt: string
  parent?: {
    firstName: string
    lastName: string
    phone: string
    email?: string
  }
}

interface CommStats {
  totalMessages: number
  sms: number
  whatsapp: number
  email: number
  delivered: number
  pending: number
  failed: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const channelConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  SMS: { label: 'SMS', icon: Smartphone, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  WHATSAPP: { label: 'WhatsApp', icon: Phone, color: 'bg-teal-100 text-teal-700 border-teal-200' },
  EMAIL: { label: 'Email', icon: Mail, color: 'bg-amber-100 text-amber-700 border-amber-200' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  SENT: { label: 'Sent', color: 'bg-emerald-100 text-emerald-700' },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-100 text-teal-700' },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' },
}

const channelChartConfig = {
  count: { label: 'Messages', color: '#10b981' },
} satisfies ChartConfig

const CHANNEL_COLORS = ['#10b981', '#14b8a6', '#f59e0b']

// Message templates
const messageTemplates = [
  { id: 'fee_reminder', name: 'Fee Reminder', message: 'Dear Parent, this is a reminder that school fees for Term {term} are due by {date}. Please ensure timely payment. Thank you.' },
  { id: 'absence_alert', name: 'Absence Alert', message: 'Dear Parent, we noticed that {student_name} was absent from school today. Please contact the school if there are any concerns.' },
  { id: 'event_notice', name: 'Event Notice', message: 'Dear Parent, you are invited to {event_name} on {date} at {venue}. We look forward to seeing you.' },
  { id: 'general', name: 'General Notice', message: 'Dear Parent, {message}' },
  { id: 'exam_notice', name: 'Exam Schedule', message: 'Dear Parent, the {exam_type} examinations will commence on {start_date}. Please ensure your child is well prepared.' },
  { id: 'results_notice', name: 'Results Available', message: 'Dear Parent, {term} examination results for {student_name} are now available. Please collect from the school office.' },
]

// Complaint data (simulated)
const complaints = [
  { id: '1', parent: 'Mai Moyo', subject: 'Late bus pickup', priority: 'HIGH', assignedTo: 'Mr. Dube', status: 'OPEN', date: '2025-03-01', sla: '48h' },
  { id: '2', parent: 'Baba Chido', subject: 'Fee discrepancy', priority: 'MEDIUM', assignedTo: 'Mrs. Ncube', status: 'IN_PROGRESS', date: '2025-02-28', sla: '72h' },
  { id: '3', parent: 'Mai Tendai', subject: 'Bullying report', priority: 'CRITICAL', assignedTo: 'Mr. Dube', status: 'RESOLVED', date: '2025-02-25', sla: '24h' },
  { id: '4', parent: 'Baba Zvinavashe', subject: 'Textbook shortage', priority: 'LOW', assignedTo: 'Mrs. Ncube', status: 'OPEN', date: '2025-03-03', sla: '7d' },
]

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
}

// ─── Communication Module ───────────────────────────────────────────────────

export default function CommunicationModule() {
  const [messages, setMessages] = useState<CommunicationRecord[]>([])
  const [stats, setStats] = useState<CommStats | null>(null)
  const [channelDistribution, setChannelDistribution] = useState<Array<{ channel: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [composeOpen, setComposeOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [channelFilter, setChannelFilter] = useState('ALL')

  // Compose form
  const [composeForm, setComposeForm] = useState({
    channel: 'SMS',
    recipientGroup: 'ALL_PARENTS',
    subject: '',
    message: '',
    templateId: '',
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (channelFilter !== 'ALL') params.set('channel', channelFilter)
      const res = await fetch(`/api/communication?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.data || [])
        setStats(data.stats || null)
        setChannelDistribution(data.channelDistribution || [])
      }
    } catch (err) {
      console.error('Failed to fetch communications:', err)
    } finally {
      setLoading(false)
    }
  }, [channelFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSend = async () => {
    if (!composeForm.message) return
    try {
      setSending(true)
      const res = await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm),
      })
      if (res.ok) {
        setComposeOpen(false)
        setComposeForm({ channel: 'SMS', recipientGroup: 'ALL_PARENTS', subject: '', message: '', templateId: '' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = messageTemplates.find((t) => t.id === templateId)
    if (template) {
      setComposeForm((p) => ({ ...p, message: template.message, templateId }))
    }
  }

  // Channel donut chart data
  const channelPieData = channelDistribution.map((c, i) => ({
    name: c.channel,
    value: c.count,
    fill: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
  }))

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
          <h1 className="text-2xl font-bold tracking-tight">Communication & CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage school communications and parent engagement</p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
              <Send className="mr-2 h-4 w-4" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>Send a message to parents via SMS, WhatsApp, or Email</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Channel</Label>
                  <Select value={composeForm.channel} onValueChange={(v) => setComposeForm((p) => ({ ...p, channel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Recipients</Label>
                  <Select value={composeForm.recipientGroup} onValueChange={(v) => setComposeForm((p) => ({ ...p, recipientGroup: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_PARENTS">All Parents</SelectItem>
                      <SelectItem value="FEE_RESPONSIBLE">Fee Responsible</SelectItem>
                      <SelectItem value="BY_GRADE">By Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {composeForm.channel === 'EMAIL' && (
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Input placeholder="Email subject" value={composeForm.subject} onChange={(e) => setComposeForm((p) => ({ ...p, subject: e.target.value }))} />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Template</Label>
                <Select value={composeForm.templateId} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="Select a template (optional)" /></SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  className="min-h-[120px] resize-none"
                  value={composeForm.message}
                  onChange={(e) => setComposeForm((p) => ({ ...p, message: e.target.value }))}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Use {'{student_name}'}, {'{term}'}, {'{date}'} as placeholders</span>
                  <span>{composeForm.message.length} chars</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending || !composeForm.message} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="compose" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Compose</TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Sent Messages</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Templates</TabsTrigger>
          <TabsTrigger value="complaints" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Complaints</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Messages Sent</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.totalMessages || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">All channels</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SMS</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.sms || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Text messages</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Smartphone className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">WhatsApp</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.whatsapp || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">WhatsApp</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <Phone className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.email || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-rose-600" />
                      <span className="text-xs font-medium text-rose-600">Emails sent</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
                    <Mail className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 to-pink-500" />
            </Card>
          </div>

          {/* Channel Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Channel Distribution</CardTitle>
                <CardDescription>Messages by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={channelChartConfig} className="h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={channelPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {channelPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  {channelDistribution.map((c, i) => (
                    <div key={c.channel} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
                      <span className="text-sm text-muted-foreground">{c.channel} ({c.count})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Stats */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Delivery Status</CardTitle>
                <CardDescription>Message delivery breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium">Delivered</p>
                        <p className="text-xs text-muted-foreground">Successfully sent</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-emerald-600">{stats?.delivered || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium">Pending</p>
                        <p className="text-xs text-muted-foreground">Queued for delivery</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-amber-600">{stats?.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">Failed</p>
                        <p className="text-xs text-muted-foreground">Delivery failed</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-red-600">{stats?.failed || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Compose Tab (inline) ─────────────────────────────────────── */}
        <TabsContent value="compose" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Compose Message</CardTitle>
              <CardDescription>Send messages to parents and guardians</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Channel</Label>
                  <Select value={composeForm.channel} onValueChange={(v) => setComposeForm((p) => ({ ...p, channel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">📱 SMS</SelectItem>
                      <SelectItem value="WHATSAPP">💬 WhatsApp</SelectItem>
                      <SelectItem value="EMAIL">📧 Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Recipients</Label>
                  <Select value={composeForm.recipientGroup} onValueChange={(v) => setComposeForm((p) => ({ ...p, recipientGroup: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_PARENTS">All Parents</SelectItem>
                      <SelectItem value="FEE_RESPONSIBLE">Fee Responsible</SelectItem>
                      <SelectItem value="BY_GRADE">By Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Template</Label>
                  <Select value={composeForm.templateId} onValueChange={applyTemplate}>
                    <SelectTrigger><SelectValue placeholder="Choose template..." /></SelectTrigger>
                    <SelectContent>
                      {messageTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {composeForm.channel === 'EMAIL' && (
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Input placeholder="Email subject" value={composeForm.subject} onChange={(e) => setComposeForm((p) => ({ ...p, subject: e.target.value }))} />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  className="min-h-[150px] resize-none"
                  value={composeForm.message}
                  onChange={(e) => setComposeForm((p) => ({ ...p, message: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{composeForm.message.length} characters</span>
                <Button onClick={handleSend} disabled={sending || !composeForm.message} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Sent Messages Tab ────────────────────────────────────────── */}
        <TabsContent value="sent" className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {['ALL', 'SMS', 'WHATSAPP', 'EMAIL'].map((ch) => (
              <Button
                key={ch}
                variant={channelFilter === ch ? 'default' : 'outline'}
                size="sm"
                className={cn('h-8 text-xs', channelFilter === ch && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
                onClick={() => setChannelFilter(ch)}
              >
                {ch === 'ALL' ? 'All' : ch}
              </Button>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Recipient</TableHead>
                    <TableHead className="text-xs">Channel</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Message</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => {
                    const ch = channelConfig[msg.channel] || channelConfig.SMS
                    const st = statusConfig[msg.status] || statusConfig.PENDING
                    const ChIcon = ch.icon
                    return (
                      <TableRow key={msg.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm">
                          {msg.parent ? `${msg.parent.firstName} ${msg.parent.lastName}` : 'Group Message'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', ch.color)}>
                            <ChIcon className="mr-1 h-3 w-3" />
                            {ch.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{msg.subject || '—'}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{msg.message}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', st.color)}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</TableCell>
                      </TableRow>
                    )
                  })}
                  {messages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>No messages sent yet</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Templates Tab ────────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Message Templates</CardTitle>
              <CardDescription>Pre-defined templates for common communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {messageTemplates.map((template) => (
                  <div key={template.id} className="p-4 rounded-xl border hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{template.name}</p>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => {
                        setComposeForm((p) => ({ ...p, message: template.message, templateId: template.id }))
                        setActiveTab('compose')
                      }}>
                        Use Template
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">{template.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Complaints Tab ───────────────────────────────────────────── */}
        <TabsContent value="complaints" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Parent Complaints</CardTitle>
              <CardDescription>Complaint log with priority, assignment, and SLA tracking</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Parent</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Assigned To</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">SLA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{complaint.parent}</TableCell>
                      <TableCell className="text-sm">{complaint.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityColors[complaint.priority])}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{complaint.assignedTo}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', complaint.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : complaint.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{complaint.sla}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
