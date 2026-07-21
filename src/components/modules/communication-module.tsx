'use client'

import { ModulePageLayout, ModuleSettingsButton, ModuleContainer, StatGrid, ModuleStatCard, SectionCard, TableShell, KitEmptyState } from '@/components/module-ui';
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Settings,
  ArrowLeft,
  Server,
  Globe,
  Bell,
  Zap,
  Palette,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import { cn } from '@/lib/utils'
import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
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
import { Textarea } from '@/components/ui/textarea'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'compose' | 'message-detail' | 'settings'

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
  sent?: number
}

interface CommResponse {
  data: CommunicationRecord[]
  stats: CommStats
  channelDistribution: Array<{ channel: string; count: number }>
  total: number
  page: number
  totalPages: number
}

interface SendCommunicationPayload {
  channel: string
  recipientGroup: string
  subject: string
  message: string
  parentId?: string
  gradeId?: string
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
  LOW: 'bg-muted text-muted-foreground border-border',
}

// ─── Communication Module ───────────────────────────────────────────────────

export default function CommunicationModule() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [selectedMessage, setSelectedMessage] = useState<CommunicationRecord | null>(null)

  // Compose form
  const [composeForm, setComposeForm] = useState({
    channel: 'SMS',
    recipientGroup: 'ALL_PARENTS',
    subject: '',
    message: '',
    templateId: '',
  })

  // Settings state
  const [commSettings, setCommSettings] = useState({
    defaultChannel: 'SMS',
    smsGateway: 'ECOCASH',
    smsSenderId: 'ZimSchool',
    emailFromName: '',
    emailFromAddress: '',
    emailTemplate: 'DEFAULT',
    pushNotifications: true,
    deliveryReports: true,
    retryFailed: true,
    maxRetries: '3',
    queueBatchSize: '50',
    quietHoursEnabled: false,
    quietHoursStart: '20:00',
    quietHoursEnd: '07:00',
  })

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (channelFilter !== 'ALL') params.set('channel', channelFilter)
    return `/api/communication?${params.toString()}`
  }, [channelFilter])

  const {
    data: commData,
    isPending: loading,
    error: queryError,
  } = useApiQuery<CommResponse>(['communications', channelFilter], queryUrl)

  const messages = commData?.data ?? []
  const stats = commData?.stats ?? null
  const channelDistribution = commData?.channelDistribution ?? []

  const { mutate: send, isPending: sending } = useApiMutation<SendCommunicationPayload, unknown>('/api/communication', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] })
      setComposeForm({ channel: 'SMS', recipientGroup: 'ALL_PARENTS', subject: '', message: '', templateId: '' })
      setViewMode('list')
      toast.success('Message sent successfully', {
        description: `${composeForm.channel} message sent to ${composeForm.recipientGroup === 'ALL_PARENTS' ? 'all parents' : composeForm.recipientGroup}`,
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message')
    },
  })

  useEffect(() => {
    if (queryError) toast.error(queryError.message || 'Failed to fetch communications')
  }, [queryError])

  const handleSend = () => {
    if (!composeForm.message) return
    send({
      channel: composeForm.channel,
      recipientGroup: composeForm.recipientGroup,
      subject: composeForm.subject,
      message: composeForm.message,
    })
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

  // ─── Inline: Compose Message ───────────────────────────────────────────

  if (viewMode === 'compose') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div className="max-w-3xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Send className="h-5 w-5 text-emerald-600" />
                Compose Message
              </CardTitle>
              <CardDescription>Send a message to parents via SMS, WhatsApp, or Email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel & Recipients */}
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

              {/* Subject (email only) */}
              {composeForm.channel === 'EMAIL' && (
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Input placeholder="Email subject" value={composeForm.subject} onChange={(e) => setComposeForm((p) => ({ ...p, subject: e.target.value }))} />
                </div>
              )}

              {/* Message */}
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  className="min-h-[200px] resize-none"
                  value={composeForm.message}
                  onChange={(e) => setComposeForm((p) => ({ ...p, message: e.target.value }))}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Use {'{student_name}'}, {'{term}'}, {'{date}'} as placeholders</span>
                  <span>{composeForm.message.length} chars {composeForm.channel === 'SMS' && `(${Math.ceil(composeForm.message.length / 160)} SMS)`}</span>
                </div>
              </div>

              {/* Preview */}
              {composeForm.message && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{composeForm.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{composeForm.channel}</Badge>
                      <Badge variant="outline" className="text-[10px]">{composeForm.recipientGroup === 'ALL_PARENTS' ? 'All Parents' : composeForm.recipientGroup === 'FEE_RESPONSIBLE' ? 'Fee Responsible' : 'By Grade'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
                <Button onClick={handleSend} disabled={sending || !composeForm.message} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  // ─── Inline: Message Detail ────────────────────────────────────────────

  if (viewMode === 'message-detail' && selectedMessage) {
    const msg = selectedMessage
    const ch = channelConfig[msg.channel] || channelConfig.SMS
    const st = statusConfig[msg.status] || statusConfig.PENDING
    const ChIcon = ch.icon
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedMessage(null) }} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Message Detail</CardTitle>
                  <CardDescription>{msg.subject || 'No subject'}</CardDescription>
                </div>
                <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100">
                  <p className="text-[10px] text-muted-foreground uppercase">Channel</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ChIcon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{ch.label}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-100">
                  <p className="text-[10px] text-muted-foreground uppercase">Recipient</p>
                  <p className="text-sm font-semibold mt-1">{msg.parent ? `${msg.parent.firstName} ${msg.parent.lastName}` : 'Group Message'}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100">
                  <p className="text-[10px] text-muted-foreground uppercase">Sent At</p>
                  <p className="text-sm font-semibold mt-1">{msg.sentAt ? formatDate(msg.sentAt) : 'Pending'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100">
                  <p className="text-[10px] text-muted-foreground uppercase">Created</p>
                  <p className="text-sm font-semibold mt-1">{formatDate(msg.createdAt)}</p>
                </div>
              </div>
              {msg.parent && (
                <div className="p-4 rounded-xl border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Recipient Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-muted-foreground" />{msg.parent.phone}</div>
                    {msg.parent.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{msg.parent.email}</div>}
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Message Content</p>
                <div className="p-4 rounded-xl bg-muted/30 text-sm whitespace-pre-wrap">{msg.message}</div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" size="sm"><Send className="mr-2 h-3 w-3" />Resend</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  // ─── Inline: Settings ──────────────────────────────────────────────────

  if (viewMode === 'settings') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" /> Communication Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure messaging channels, gateways, and preferences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Channels */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" /> Default Channels
              </CardTitle>
              <CardDescription>Set preferred communication channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Default Channel</Label>
                <Select value={commSettings.defaultChannel} onValueChange={(v) => setCommSettings(s => ({ ...s, defaultChannel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">📱 SMS</SelectItem>
                    <SelectItem value="WHATSAPP">💬 WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">📧 Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Push Notifications</Label>
                  <p className="text-[10px] text-muted-foreground">Send push notifications for urgent messages</p>
                </div>
                <Switch checked={commSettings.pushNotifications} onCheckedChange={(v) => setCommSettings(s => ({ ...s, pushNotifications: v }))} />
              </div>
            </CardContent>
          </Card>

          {/* SMS Gateway Configuration */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-teal-600" /> SMS Gateway
              </CardTitle>
              <CardDescription>Configure SMS provider settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">SMS Gateway Provider</Label>
                <Select value={commSettings.smsGateway} onValueChange={(v) => setCommSettings(s => ({ ...s, smsGateway: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECOCASH">EcoCash SMS</SelectItem>
                    <SelectItem value="TELECEL">Telecel SMS</SelectItem>
                    <SelectItem value="NETONE">NetOne SMS</SelectItem>
                    <SelectItem value="TWILIO">Twilio</SelectItem>
                    <SelectItem value="AFRICAS_TALKING">Africa&apos;s Talking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Sender ID</Label>
                <Input value={commSettings.smsSenderId} onChange={(e) => setCommSettings(s => ({ ...s, smsSenderId: e.target.value }))} placeholder="ZimSchool" maxLength={11} />
                <p className="text-[10px] text-muted-foreground">Max 11 characters. Must be approved by carrier.</p>
              </div>
            </CardContent>
          </Card>

          {/* Email Template Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-600" /> Email Settings
              </CardTitle>
              <CardDescription>Configure email sender and templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">From Name</Label>
                  <Input value={commSettings.emailFromName} onChange={(e) => setCommSettings(s => ({ ...s, emailFromName: e.target.value }))} placeholder="School Name" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">From Email</Label>
                  <Input type="email" value={commSettings.emailFromAddress} onChange={(e) => setCommSettings(s => ({ ...s, emailFromAddress: e.target.value }))} placeholder="info@school.co.zw" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Email Template</Label>
                <Select value={commSettings.emailTemplate} onValueChange={(v) => setCommSettings(s => ({ ...s, emailTemplate: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">Default (School Branded)</SelectItem>
                    <SelectItem value="MINIMAL">Minimal (Plain Text)</SelectItem>
                    <SelectItem value="FORMAL">Formal (Letter Style)</SelectItem>
                    <SelectItem value="MODERN">Modern (Card Layout)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Communication Preferences */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-purple-600" /> Preferences
              </CardTitle>
              <CardDescription>Delivery reports and retry settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Delivery Reports</Label>
                  <p className="text-[10px] text-muted-foreground">Track message delivery status</p>
                </div>
                <Switch checked={commSettings.deliveryReports} onCheckedChange={(v) => setCommSettings(s => ({ ...s, deliveryReports: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Auto-Retry Failed</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically retry failed messages</p>
                </div>
                <Switch checked={commSettings.retryFailed} onCheckedChange={(v) => setCommSettings(s => ({ ...s, retryFailed: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Max Retries</Label>
                  <Input type="number" min="1" max="5" value={commSettings.maxRetries} onChange={(e) => setCommSettings(s => ({ ...s, maxRetries: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Batch Size</Label>
                  <Input type="number" min="10" max="200" value={commSettings.queueBatchSize} onChange={(e) => setCommSettings(s => ({ ...s, queueBatchSize: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600" /> Quiet Hours
              </CardTitle>
              <CardDescription>Restrict message sending during certain hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Enable Quiet Hours</Label>
                  <p className="text-[10px] text-muted-foreground">Queue messages outside permitted hours</p>
                </div>
                <Switch checked={commSettings.quietHoursEnabled} onCheckedChange={(v) => setCommSettings(s => ({ ...s, quietHoursEnabled: v }))} />
              </div>
              {commSettings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Start</Label>
                    <Input type="time" value={commSettings.quietHoursStart} onChange={(e) => setCommSettings(s => ({ ...s, quietHoursStart: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">End</Label>
                    <Input type="time" value={commSettings.quietHoursEnd} onChange={(e) => setCommSettings(s => ({ ...s, quietHoursEnd: e.target.value }))} />
                  </div>
                </div>
              )}
              <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 text-xs text-cyan-700 dark:text-cyan-400">
                Messages queued during quiet hours will be sent automatically when the quiet period ends.
              </div>
            </CardContent>
          </Card>

          {/* Message Queue */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" /> Message Queue
              </CardTitle>
              <CardDescription>Current queue status and processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 text-center">
                  <p className="text-lg font-bold text-amber-600">{stats?.pending || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Queued</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 text-center">
                  <p className="text-lg font-bold text-emerald-600">{stats?.delivered || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Delivered</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 text-center">
                  <p className="text-lg font-bold text-red-600">{stats?.failed || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Failed</p>
                </div>
              </div>
              <Button variant="outline" className="w-full text-sm" onClick={() => { toast.info('Processing queued messages...') }}>
                <Zap className="mr-2 h-4 w-4" /> Process Queue Now
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => { toast.success('Communication settings saved successfully') }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            Save Settings
          </Button>
        </div>
      </motion.div>
    )
  }

  // ─── Main List View ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />))}
        </div>
      </div>
    )
  }

  return (
    <ModuleContainer>
<ModulePageLayout
        actions={<>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" onClick={() => setViewMode('compose')}>
            <Send className="mr-2 h-4 w-4" /> Compose Message
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sent">Sent Messages</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard icon={MessageSquare} label="Messages Sent" value={stats?.totalMessages || 0} accentGradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600" hint="All channels" index={0} />
            <ModuleStatCard icon={Smartphone} label="SMS" value={stats?.sms || 0} accentGradient="from-teal-400 to-cyan-500" bgColor="bg-teal-50 dark:bg-teal-950/40" iconColor="text-teal-600" hint="Text messages" index={1} />
            <ModuleStatCard icon={Phone} label="WhatsApp" value={stats?.whatsapp || 0} accentGradient="from-amber-400 to-orange-500" bgColor="bg-amber-50 dark:bg-amber-950/40" iconColor="text-amber-600" hint="WhatsApp" index={2} />
            <ModuleStatCard icon={Mail} label="Email" value={stats?.email || 0} accentGradient="from-rose-400 to-pink-500" bgColor="bg-rose-50 dark:bg-rose-950/40" iconColor="text-rose-600" hint="Emails sent" index={3} />
          </StatGrid>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Channel Distribution" description="Messages by channel">
              <div className="flex items-center justify-center">
                <ChartContainer config={channelChartConfig} className="h-[220px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={channelPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                      {channelPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
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
            </SectionCard>
            <SectionCard title="Delivery Status" description="Message delivery breakdown">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="text-sm font-medium">Delivered</p><p className="text-xs text-muted-foreground">Successfully sent</p></div></div>
                  <span className="text-xl font-bold text-emerald-600">{stats?.delivered || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-amber-600" /><div><p className="text-sm font-medium">Pending</p><p className="text-xs text-muted-foreground">Queued for delivery</p></div></div>
                  <span className="text-xl font-bold text-amber-600">{stats?.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-3"><XCircle className="h-5 w-5 text-red-600" /><div><p className="text-sm font-medium">Failed</p><p className="text-xs text-muted-foreground">Delivery failed</p></div></div>
                  <span className="text-xl font-bold text-red-600">{stats?.failed || 0}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── Sent Messages Tab ────────────────────────────────────────── */}
        <TabsContent value="sent" className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {['ALL', 'SMS', 'WHATSAPP', 'EMAIL'].map((ch) => (
              <Button key={ch} variant={channelFilter === ch ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', channelFilter === ch && 'bg-emerald-600 hover:bg-emerald-700 text-white')} onClick={() => setChannelFilter(ch)}>
                {ch === 'ALL' ? 'All' : ch}
              </Button>
            ))}
          </div>
          <SectionCard title="Sent Messages" description="All outbound communications" icon={MessageSquare} noPadding>
            <TableShell isEmpty={messages.length === 0} empty={<KitEmptyState icon={MessageSquare} title="No messages sent yet" />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Recipient</TableHead>
                    <TableHead className="text-xs">Channel</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Message</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => {
                    const ch = channelConfig[msg.channel] || channelConfig.SMS
                    const st = statusConfig[msg.status] || statusConfig.PENDING
                    const ChIcon = ch.icon
                    return (
                      <TableRow key={msg.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedMessage(msg); setViewMode('message-detail') }}>
                        <TableCell className="text-sm">{msg.parent ? `${msg.parent.firstName} ${msg.parent.lastName}` : 'Group Message'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', ch.color)}>
                            <ChIcon className="mr-1 h-3 w-3" />{ch.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{msg.subject || '—'}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{msg.message}</TableCell>
                        <TableCell><Badge className={cn('text-[10px]', st.color)}>{st.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedMessage(msg); setViewMode('message-detail') }}>View</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Templates Tab ────────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          <SectionCard title="Message Templates" description="Pre-defined templates for common communications" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {messageTemplates.map((template) => (
                <div key={template.id} className="p-4 rounded-xl border hover:shadow-md transition-shadow space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{template.name}</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => {
                      setComposeForm((p) => ({ ...p, message: template.message, templateId: template.id }))
                      setViewMode('compose')
                    }}>
                      Use Template
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{template.message}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ─── Complaints Tab ───────────────────────────────────────────── */}
        <TabsContent value="complaints" className="space-y-4">
          <SectionCard title="Parent Complaints" description="Complaint log with priority, assignment, and SLA tracking" icon={AlertTriangle} noPadding>
            <TableShell>
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
            </TableShell>
          </SectionCard>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
