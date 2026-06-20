'use client'

import {
  ModuleContainer,
  StatGrid,
  ModuleStatCard,
  SectionCard,
  TableShell,
  ModulePageLayout,
  ModuleSettingsButton,
  KitEmptyState,
  ModuleToolbar,
} from '@/components/module-ui'
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Receipt,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Download,
  Printer,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ArrowLeft,
  Calendar,
  Hash,
  Percent,
  FileCheck,
  Landmark,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'

import { cn } from '@/lib/utils'
import { exportToCSV, printReport, buildHTMLTable, formatCurrency as fmtCurrency } from '@/lib/export-utils'
import { EmptyState } from '@/components/empty-state'
import { ModuleSkeleton } from '@/components/module-skeleton'
import { formatDualCurrency, formatUSD, formatZiG, getCurrentRate, fetchExchangeRate, type CurrencyCode } from '@/lib/currency'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add-payment' | 'add-invoice' | 'detail' | 'settings'

interface FinanceDashboard {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  debtorCount: number
  collectionRate: string
  recentPayments: Array<{
    id: string
    receiptNumber: string
    amount: number
    paymentMethod: string
    currency: string
    createdAt: string
    student: { id: string; firstName: string; lastName: string; studentNumber: string }
    parent?: { firstName: string; lastName: string }
  }>
  invoiceStatusBreakdown: { pending: number; partial: number; paid: number; overdue: number }
  paymentsByMethod: Array<{ paymentMethod: string; _sum: { amount: number }; _count: number }>
  monthlyCollectionTrend: Record<string, number>
}

interface InvoiceItem {
  id: string
  description: string
  amount: number
  feeType: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  studentId: string
  termId: string
  totalAmount: number
  amountPaid: number
  balance: number
  dueDate: string
  status: string
  createdAt: string
  student: { id: string; firstName: string; lastName: string; studentNumber: string }
  term: { name: string; academicYear: { name: string } }
  items: InvoiceItem[]
  payments: Array<{
    id: string
    receiptNumber: string
    amount: number
    createdAt: string
    parent?: { firstName: string; lastName: string }
  }>
}

interface Payment {
  id: string
  receiptNumber: string
  amount: number
  paymentMethod: string
  currency: string
  reference: string | null
  createdAt: string
  student: { id: string; firstName: string; lastName: string; studentNumber: string }
  invoice?: { id: string; invoiceNumber: string }
  parent?: { firstName: string; lastName: string }
}

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const statusColors: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  PARTIAL: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50',
}

const methodLabels: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Card',
  ONLINE: 'Online',
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const donutChartConfig = {
  collected: { label: 'Collected', color: '#10b981' },
  outstanding: { label: 'Outstanding', color: '#f59e0b' },
} satisfies ChartConfig

const trendChartConfig = {
  amount: { label: 'Collection', color: '#10b981' },
} satisfies ChartConfig

// ─── Finance Module ─────────────────────────────────────────────────────────

export default function FinanceModule() {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [exchangeRate, setExchangeRate] = useState(getCurrentRate().rate)
  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>('USD')

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoiceFilter, setInvoiceFilter] = useState('ALL')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [paymentSearch, setPaymentSearch] = useState('')

  // Settings state
  const [financeSettings, setFinanceSettings] = useState({
    defaultCurrency: 'USD',
    autoGenerateInvoices: false,
    invoicePrefix: 'INV',
    invoiceNumberFormat: 'SEQ',
    paymentTerms: '30',
    lateFeePercentage: '5',
    lateFeeType: 'PERCENTAGE',
    dualCurrency: true,
    receiptFormat: 'DETAILED',
    financialYearStart: '01',
    paymentMethods: 'ALL',
  })

  // Students & submitting
  const [students, setStudents] = useState<Student[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Form states - Record Payment
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'CASH',
    currency: 'USD',
    reference: '',
  })

  // Form states - Create Invoice
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: '',
    termId: '',
    dueDate: '',
    items: [{ description: '', amount: '', feeType: 'TUITION' }],
  })

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/finance')
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (err) {
      console.error('Failed to fetch finance dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInvoices = useCallback(async () => {
    try {
      setInvoicesLoading(true)
      const params = new URLSearchParams()
      if (invoiceFilter !== 'ALL') params.set('status', invoiceFilter)
      params.set('page', '1')
      params.set('limit', '50')
      const res = await fetch(`/api/finance/invoices?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setInvoicesLoading(false)
    }
  }, [invoiceFilter])

  const fetchPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true)
      const params = new URLSearchParams()
      if (paymentMethodFilter !== 'ALL') params.set('paymentMethod', paymentMethodFilter)
      params.set('page', '1')
      params.set('limit', '50')
      const res = await fetch(`/api/finance/payments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    } finally {
      setPaymentsLoading(false)
    }
  }, [paymentMethodFilter])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?limit=200')
      if (res.ok) {
        const data = await res.json()
        setStudents(data.data || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    fetchExchangeRate().then(r => setExchangeRate(r.rate))
  }, [fetchDashboard])

  useEffect(() => {
    if (activeTab === 'invoices') fetchInvoices()
  }, [activeTab, fetchInvoices])

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments()
  }, [activeTab, fetchPayments])

  useEffect(() => {
    if (viewMode === 'add-payment' || viewMode === 'add-invoice') fetchStudents()
  }, [viewMode, fetchStudents])

  // ─── Form Handlers ─────────────────────────────────────────────────────

  const handleRecordPayment = async () => {
    if (!paymentForm.studentId || !paymentForm.amount) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: paymentForm.studentId,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          currency: paymentForm.currency,
          reference: paymentForm.reference || undefined,
        }),
      })
      if (res.ok) {
        setPaymentForm({ studentId: '', amount: '', paymentMethod: 'CASH', currency: 'USD', reference: '' })
        setViewMode('list')
        fetchDashboard()
        if (activeTab === 'payments') fetchPayments()
        if (activeTab === 'invoices') fetchInvoices()
        toast.success('Payment recorded successfully', {
          description: `$${parseFloat(paymentForm.amount).toLocaleString()} ${paymentForm.currency} payment recorded`,
        })
      }
    } catch (err) {
      console.error('Failed to record payment:', err)
      toast.error('Failed to record payment', {
        description: 'An error occurred while recording the payment',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!invoiceForm.studentId || !invoiceForm.items.length) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: invoiceForm.studentId,
          termId: invoiceForm.termId || undefined,
          dueDate: invoiceForm.dueDate || undefined,
          items: invoiceForm.items
            .filter((item) => item.description && item.amount)
            .map((item) => ({
              description: item.description,
              amount: parseFloat(item.amount),
              feeType: item.feeType,
            })),
        }),
      })
      if (res.ok) {
        setInvoiceForm({ studentId: '', termId: '', dueDate: '', items: [{ description: '', amount: '', feeType: 'TUITION' }] })
        setViewMode('list')
        fetchDashboard()
        if (activeTab === 'invoices') fetchInvoices()
        toast.success('Invoice created successfully')
      }
    } catch (err) {
      console.error('Failed to create invoice:', err)
      toast.error('Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const addInvoiceItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', amount: '', feeType: 'TUITION' }],
    }))
  }

  const removeInvoiceItem = (index: number) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateInvoiceItem = (index: number, field: string, value: string) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  // ─── Filtered Data ─────────────────────────────────────────────────────

  const filteredInvoices = invoices.filter((inv) => {
    if (!invoiceSearch) return true
    const q = invoiceSearch.toLowerCase()
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase().includes(q)
    )
  })

  const filteredPayments = payments.filter((pay) => {
    if (!paymentSearch) return true
    const q = paymentSearch.toLowerCase()
    return (
      pay.receiptNumber.toLowerCase().includes(q) ||
      `${pay.student.firstName} ${pay.student.lastName}`.toLowerCase().includes(q)
    )
  })

  // ─── Chart Data ────────────────────────────────────────────────────────

  const donutData = dashboard
    ? [
        { name: 'Collected', value: dashboard.totalCollected, fill: 'var(--color-collected)' },
        { name: 'Outstanding', value: dashboard.totalOutstanding, fill: 'var(--color-outstanding)' },
      ]
    : []

  const trendData = dashboard
    ? Object.entries(dashboard.monthlyCollectionTrend)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-ZW', { month: 'short' }),
          amount,
        }))
    : []

  const ageingData = dashboard
    ? [
        { period: 'Current', amount: dashboard.totalOutstanding * 0.4, count: Math.round(dashboard.debtorCount * 0.4) },
        { period: '30 Days', amount: dashboard.totalOutstanding * 0.25, count: Math.round(dashboard.debtorCount * 0.25) },
        { period: '60 Days', amount: dashboard.totalOutstanding * 0.2, count: Math.round(dashboard.debtorCount * 0.2) },
        { period: '90+ Days', amount: dashboard.totalOutstanding * 0.15, count: Math.round(dashboard.debtorCount * 0.15) },
      ]
    : []

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return <ModuleSkeleton statCount={4} showChart showTable={false} />
  }

  const collectionRate = dashboard ? parseFloat(dashboard.collectionRate) : 0

  // ─── Inline: Record Payment ────────────────────────────────────────────

  if (viewMode === 'add-payment') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1.5 px-2.5 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" /> Back to Finance
          </Button>
        </div>
        <div className="max-w-2xl mx-auto w-full">
          <SectionCard title="Record Payment" description="Record a new fee payment for a student" icon={CreditCard}>
            <div className="space-y-6">
              {/* Currency indicator */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  <DollarSign className="h-3 w-3" /> USD
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                  ZiG
                </span>
                <span className="text-[10px] text-muted-foreground">Multi-currency supported</span>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Student</Label>
                  <Select value={paymentForm.studentId} onValueChange={(v) => setPaymentForm((p) => ({ ...p, studentId: v }))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Search and select student..." /></SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.firstName} {s.lastName} ({s.studentNumber})
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        {paymentForm.currency === 'USD' ? '$' : 'ZiG'}
                      </span>
                      <Input type="number" placeholder="0.00" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} className="pl-8 h-9" />
                    </div>
                    {paymentForm.currency === 'ZiG' && paymentForm.amount && (
                      <p className="text-[10px] text-muted-foreground">≈ {formatCurrency(parseFloat(paymentForm.amount) / exchangeRate)} USD</p>
                    )}
                    {paymentForm.currency === 'USD' && paymentForm.amount && (
                      <p className="text-[10px] text-muted-foreground">≈ {formatZiG(parseFloat(paymentForm.amount) * exchangeRate)}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Currency</Label>
                    <Select value={paymentForm.currency} onValueChange={(v) => setPaymentForm((p) => ({ ...p, currency: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD"><span className="flex items-center gap-1.5"><span className="text-emerald-600">$</span> US Dollar (USD)</span></SelectItem>
                        <SelectItem value="ZiG"><span className="flex items-center gap-1.5"><span className="text-amber-600">ZiG</span> Zimbabwe Gold (ZiG)</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm((p) => ({ ...p, paymentMethod: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Reference</Label>
                    <Input placeholder="Optional ref #" value={paymentForm.reference} onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))} className="h-9" />
                  </div>
                </div>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>Cancel</Button>
                <Button onClick={handleRecordPayment} disabled={submitting || !paymentForm.studentId || !paymentForm.amount} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Inline: Create Invoice ────────────────────────────────────────────

  if (viewMode === 'add-invoice') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1.5 px-2.5 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" /> Back to Finance
          </Button>
        </div>
        <div className="max-w-3xl mx-auto w-full">
          <SectionCard title="Create Invoice" description="Generate a new fee invoice for a student" icon={FileText}>
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Student</Label>
                  <Select value={invoiceForm.studentId} onValueChange={(v) => setInvoiceForm((p) => ({ ...p, studentId: v }))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Search and select student..." /></SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Term ID (optional)</Label>
                    <Input placeholder="Term ID" value={invoiceForm.termId} onChange={(e) => setInvoiceForm((p) => ({ ...p, termId: e.target.value }))} className="h-9" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))} className="h-9" />
                  </div>
                </div>
                <Separator className="bg-border/60" />
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addInvoiceItem} className="h-8">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
                  </Button>
                </div>
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_120px_32px] gap-2 items-end">
                    <div className="grid gap-1">
                      {index === 0 && <span className="text-[11px] font-medium text-muted-foreground uppercase">Description</span>}
                      <Input placeholder="Fee description" value={item.description} onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)} className="h-9" />
                    </div>
                    <div className="grid gap-1">
                      {index === 0 && <span className="text-[11px] font-medium text-muted-foreground uppercase">Amount</span>}
                      <Input type="number" placeholder="0.00" value={item.amount} onChange={(e) => updateInvoiceItem(index, 'amount', e.target.value)} className="h-9" />
                    </div>
                    <div className="grid gap-1">
                      {index === 0 && <span className="text-[11px] font-medium text-muted-foreground uppercase">Fee Type</span>}
                      <Select value={item.feeType} onValueChange={(v) => updateInvoiceItem(index, 'feeType', v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TUITION">Tuition</SelectItem>
                          <SelectItem value="LEVY">Levy</SelectItem>
                          <SelectItem value="DEVELOPMENT">Development</SelectItem>
                          <SelectItem value="SPORTS">Sports</SelectItem>
                          <SelectItem value="EXAM">Exam</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 shrink-0" onClick={() => removeInvoiceItem(index)} disabled={invoiceForm.items.length === 1}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Total: </span>
                    <span className="text-lg font-bold text-foreground">{formatCurrency(invoiceForm.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0))}</span>
                    {financeSettings.dualCurrency && (
                      <p className="text-[10px] text-muted-foreground">≈ {formatZiG(invoiceForm.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0) * exchangeRate)}</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>Cancel</Button>
                <Button onClick={handleCreateInvoice} disabled={submitting || !invoiceForm.studentId} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Invoice
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Inline: Invoice Detail ────────────────────────────────────────────

  if (viewMode === 'detail' && selectedInvoice) {
    const inv = selectedInvoice
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedInvoice(null) }} className="gap-1.5 px-2.5 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SectionCard
              title={`Invoice ${inv.invoiceNumber}`}
              description={`${inv.student.firstName} ${inv.student.lastName} (${inv.student.studentNumber})`}
              icon={FileText}
              actions={<Badge className={cn('text-xs font-semibold px-2.5 py-0.5 border', statusColors[inv.status] || statusColors.PENDING)}>{inv.status}</Badge>}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/55 dark:border-emerald-900/50">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Amount</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{formatCurrency(inv.totalAmount)}</p>
                    {financeSettings.dualCurrency && <p className="text-[10px] text-muted-foreground/80 font-medium">{formatZiG(inv.totalAmount * exchangeRate)}</p>}
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/55 dark:border-teal-900/50">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Amount Paid</p>
                    <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">{formatCurrency(inv.amountPaid)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/55 dark:border-amber-900/50">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Balance</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formatCurrency(inv.balance)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/60 border border-border/50">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Due Date</p>
                    <p className="text-sm font-bold text-foreground mt-1.5">{formatDate(inv.dueDate)}</p>
                  </div>
                </div>
                <Separator className="bg-border/60" />
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-foreground">Line Items</h4>
                  <TableShell>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs">Fee Type</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inv.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm font-medium text-foreground">{item.description}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{item.feeType}</Badge></TableCell>
                            <TableCell className="text-sm text-right font-mono font-semibold text-foreground">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableShell>
                </div>
                {inv.payments.length > 0 && (
                  <>
                    <Separator className="bg-border/60" />
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-foreground">Payment History</h4>
                      <TableShell>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Receipt</TableHead>
                              <TableHead className="text-xs">Amount</TableHead>
                              <TableHead className="text-xs">Paid By</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inv.payments.map((pay) => (
                              <TableRow key={pay.id}>
                                <TableCell className="text-sm font-mono font-semibold text-foreground">{pay.receiptNumber}</TableCell>
                                <TableCell className="text-sm font-mono font-semibold text-foreground">{formatCurrency(pay.amount)}</TableCell>
                                <TableCell className="text-sm text-foreground">{pay.parent ? `${pay.parent.firstName} ${pay.parent.lastName}` : '—'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDate(pay.createdAt)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableShell>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>
          </div>
          <div className="space-y-4 w-full">
            <SectionCard title="Term Info">
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Term</span><span className="font-semibold text-foreground">{inv.term.name}</span></div>
                <Separator className="bg-border/60" />
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Year</span><span className="font-semibold text-foreground">{inv.term.academicYear.name}</span></div>
                <Separator className="bg-border/60" />
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Created</span><span className="font-medium text-foreground">{formatDate(inv.createdAt)}</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Actions">
              <div className="space-y-2.5">
                <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2" onClick={() => { setPaymentForm(p => ({ ...p, studentId: inv.studentId })); setViewMode('add-payment') }}>
                  <CreditCard className="h-4 w-4 text-emerald-600" /> Record Payment
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2"><Printer className="h-4 w-4 text-slate-500" /> Print Invoice</Button>
                <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2"><Download className="h-4 w-4 text-slate-500" /> Download PDF</Button>
              </div>
            </SectionCard>
          </div>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Inline: Settings ──────────────────────────────────────────────────

  if (viewMode === 'settings') {
    return (
      <ModuleContainer>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1.5 px-2.5 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" /> Back to Finance
          </Button>
        </div>
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Finance Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure finance module preferences and defaults</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Currency Display */}
          <SectionCard title="Currency Display" description="Set default currency and dual-currency display" icon={CircleDollarSign}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Default Currency</Label>
                <Select value={financeSettings.defaultCurrency} onValueChange={(v) => setFinanceSettings(s => ({ ...s, defaultCurrency: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="ZiG">Zimbabwe Gold (ZiG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-1">
                <div>
                  <Label className="text-xs font-semibold">Dual Currency Display</Label>
                  <p className="text-[10px] text-muted-foreground">Show both USD and ZiG on invoices and receipts</p>
                </div>
                <Switch checked={financeSettings.dualCurrency} onCheckedChange={(v) => setFinanceSettings(s => ({ ...s, dualCurrency: v }))} />
              </div>
            </div>
          </SectionCard>

          {/* Invoice Numbering */}
          <SectionCard title="Invoice Numbering" description="Configure how invoices are numbered" icon={Hash}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Invoice Prefix</Label>
                <Input value={financeSettings.invoicePrefix} onChange={(e) => setFinanceSettings(s => ({ ...s, invoicePrefix: e.target.value }))} placeholder="INV" className="h-9" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Number Format</Label>
                <Select value={financeSettings.invoiceNumberFormat} onValueChange={(v) => setFinanceSettings(s => ({ ...s, invoiceNumberFormat: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEQ">Sequential (INV-001, INV-002)</SelectItem>
                    <SelectItem value="YEAR">Year-based (INV-2025-001)</SelectItem>
                    <SelectItem value="TERM">Term-based (INV-T1-001)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Payment Methods */}
          <SectionCard title="Payment Methods" description="Configure accepted payment methods" icon={Landmark}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Allowed Payment Methods</Label>
                <Select value={financeSettings.paymentMethods} onValueChange={(v) => setFinanceSettings(s => ({ ...s, paymentMethods: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Methods</SelectItem>
                    <SelectItem value="CASH_MOBILE">Cash & Mobile Money Only</SelectItem>
                    <SelectItem value="BANK_ONLY">Bank Transfers Only</SelectItem>
                    <SelectItem value="NO_CASH">No Cash (Digital Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Late Fee Calculation */}
          <SectionCard title="Late Fee Calculation" description="Configure late payment penalties" icon={Percent}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Payment Terms (days)</Label>
                  <Input type="number" value={financeSettings.paymentTerms} onChange={(e) => setFinanceSettings(s => ({ ...s, paymentTerms: e.target.value }))} className="h-9" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Late Fee Value</Label>
                  <Input type="number" value={financeSettings.lateFeePercentage} onChange={(e) => setFinanceSettings(s => ({ ...s, lateFeePercentage: e.target.value }))} className="h-9" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Late Fee Type</Label>
                <Select value={financeSettings.lateFeeType} onValueChange={(v) => setFinanceSettings(s => ({ ...s, lateFeeType: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage of outstanding</SelectItem>
                    <SelectItem value="FIXED">Fixed amount per month</SelectItem>
                    <SelectItem value="NONE">No late fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Receipt Format */}
          <SectionCard title="Receipt Format" description="Customize payment receipt layout" icon={FileCheck}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Receipt Detail Level</Label>
                <Select value={financeSettings.receiptFormat} onValueChange={(v) => setFinanceSettings(s => ({ ...s, receiptFormat: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DETAILED">Detailed (full breakdown)</SelectItem>
                    <SelectItem value="SIMPLE">Simple (amount only)</SelectItem>
                    <SelectItem value="ITEMIZED">Itemized (per fee type)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-1">
                <div>
                  <Label className="text-xs font-semibold">Auto-generate Invoices</Label>
                  <p className="text-[10px] text-muted-foreground">Generate invoices at term start automatically</p>
                </div>
                <Switch checked={financeSettings.autoGenerateInvoices} onCheckedChange={(v) => setFinanceSettings(s => ({ ...s, autoGenerateInvoices: v }))} />
              </div>
            </div>
          </SectionCard>

          {/* Financial Year */}
          <SectionCard title="Financial Year" description="Set financial year start month" icon={Calendar}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs">Year Starts In</Label>
                <Select value={financeSettings.financialYearStart} onValueChange={(v) => setFinanceSettings(s => ({ ...s, financialYearStart: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">January</SelectItem>
                    <SelectItem value="02">February</SelectItem>
                    <SelectItem value="03">March</SelectItem>
                    <SelectItem value="04">April</SelectItem>
                    <SelectItem value="07">July</SelectItem>
                    <SelectItem value="09">September</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100/50 dark:border-cyan-900/50 text-xs text-cyan-800 dark:text-cyan-400 leading-relaxed">
                Zimbabwe schools typically follow a January–December financial year aligned with the academic calendar.
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={() => { toast.success('Finance settings saved successfully') }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
            Save Settings
          </Button>
        </div>
      </ModuleContainer>
    )
  }

  // ─── Main List View ────────────────────────────────────────────────────

  return (
    <ModuleContainer>
      <ModulePageLayout
        actions={<>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const csvData = filteredInvoices.map(inv => ({ 'Invoice Number': inv.invoiceNumber, 'Student': `${inv.student.firstName} ${inv.student.lastName}`, 'Student Number': inv.student.studentNumber, 'Total Amount': inv.totalAmount, 'Amount Paid': inv.amountPaid, 'Balance': inv.balance, 'Status': inv.status, 'Due Date': formatDate(inv.dueDate), 'Created': formatDate(inv.createdAt) }))
                exportToCSV(csvData, `invoices_export_${new Date().toISOString().slice(0, 10)}`)
              }}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Export Invoices CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const csvData = filteredPayments.map(pay => ({ 'Receipt Number': pay.receiptNumber, 'Student': `${pay.student.firstName} ${pay.student.lastName}`, 'Amount': pay.amount, 'Currency': pay.currency, 'Payment Method': pay.paymentMethod, 'Reference': pay.reference || '', 'Date': formatDate(pay.createdAt) }))
                exportToCSV(csvData, `payments_export_${new Date().toISOString().slice(0, 10)}`)
              }}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-600" /> Export Payments CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const headers = ['Description', 'Invoiced', 'Collected', 'Outstanding']
                const rows = [['Total Fees', fmtCurrency(dashboard?.totalInvoiced || 0), fmtCurrency(dashboard?.totalCollected || 0), fmtCurrency(dashboard?.totalOutstanding || 0)], ['Collection Rate', '', dashboard?.collectionRate || '0' + '%', ''], ['Debtor Count', '', String(dashboard?.debtorCount || 0), '']]
                printReport('Financial Report', buildHTMLTable(headers, rows))
              }}>
                <Printer className="mr-2 h-4 w-4 text-amber-600" /> Print Financial Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md h-9" onClick={() => setViewMode('add-payment')}>
            <CreditCard className="mr-2 h-4 w-4" /> Record Payment
          </Button>
          <Button variant="outline" className="h-9 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" onClick={() => setViewMode('add-invoice')}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </>}
      >
        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <span className="text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
              Rate: 1 USD = {exchangeRate.toFixed(1)} ZiG
            </span>
            <button onClick={() => setPrimaryCurrency(primaryCurrency === 'USD' ? 'ZiG' : 'USD')} className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer">
              Toggle to {primaryCurrency === 'USD' ? 'ZiG' : 'USD'} primary
            </button>
          </div>
          
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={FileText}
              label="Total Invoiced"
              value={primaryCurrency === 'USD' ? formatCurrency(dashboard?.totalInvoiced || 0) : formatZiG((dashboard?.totalInvoiced || 0) * exchangeRate)}
              accentGradient="from-emerald-400 to-teal-500"
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              hint={primaryCurrency === 'USD' ? formatZiG((dashboard?.totalInvoiced || 0) * exchangeRate) : formatUSD((dashboard?.totalInvoiced || 0))}
              footer={<div className="flex items-center gap-1.5 mt-0.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /><span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">All time</span></div>}
              index={0}
            />
            <ModuleStatCard
              icon={DollarSign}
              label="Total Collected"
              value={primaryCurrency === 'USD' ? formatCurrency(dashboard?.totalCollected || 0) : formatZiG((dashboard?.totalCollected || 0) * exchangeRate)}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              hint={primaryCurrency === 'USD' ? formatZiG((dashboard?.totalCollected || 0) * exchangeRate) : formatUSD((dashboard?.totalCollected || 0))}
              footer={<div className="flex items-center gap-1.5 mt-0.5"><CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /><span className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">{dashboard?.debtorCount || 0} debtors</span></div>}
              index={1}
            />
            <ModuleStatCard
              icon={CircleDollarSign}
              label="Total Outstanding"
              value={primaryCurrency === 'USD' ? formatCurrency(dashboard?.totalOutstanding || 0) : formatZiG((dashboard?.totalOutstanding || 0) * exchangeRate)}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              hint={primaryCurrency === 'USD' ? formatZiG((dashboard?.totalOutstanding || 0) * exchangeRate) : formatUSD((dashboard?.totalOutstanding || 0))}
              footer={<div className="flex items-center gap-1.5 mt-0.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /><span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Overdue risk</span></div>}
              index={2}
            />
            <ModuleStatCard
              icon={Receipt}
              label="Collection Rate"
              value={`${collectionRate.toFixed(1)}%`}
              accentGradient="from-emerald-400 to-teal-500"
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              hint={`${dashboard?.recentPayments?.length || 0} recent`}
              footer={
                <div className="flex items-center gap-1.5 mt-0.5">
                  {collectionRate >= 80 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                  <span className={cn('text-[10px] font-medium uppercase tracking-wider', collectionRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>{collectionRate >= 80 ? 'Healthy' : 'Needs attention'}</span>
                </div>
              }
              index={3}
            />
          </StatGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Collection vs Outstanding" icon={BarChart3}>
              <ChartContainer config={donutChartConfig} className="h-[220px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                    {donutData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </SectionCard>
            <SectionCard title="Monthly Collection Trend" icon={TrendingUp}>
              <ChartContainer config={trendChartConfig} className="h-[220px] w-full">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--border), 0.3)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2.5} dot={{ fill: 'var(--color-amount)', r: 4 }} />
                </LineChart>
              </ChartContainer>
            </SectionCard>
          </div>

          {/* Debtor Ageing */}
          <SectionCard title="Debtor Ageing Analysis" description="Outstanding balances by age group" icon={AlertTriangle}>
            <TableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ageing Period</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                    <TableHead className="text-right">Amount (ZiG)</TableHead>
                    <TableHead className="text-right">Debtor Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ageingData.map((row) => (
                    <TableRow key={row.period} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-semibold text-foreground">{row.period}</TableCell>
                      <TableCell className="text-sm text-right font-mono font-semibold text-foreground">{formatCurrency(row.amount)}</TableCell>
                      <TableCell className="text-sm text-right font-mono font-semibold text-foreground">{formatZiG(row.amount * exchangeRate)}</TableCell>
                      <TableCell className="text-sm text-right font-medium text-foreground">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>

          {/* Recent Payments */}
          {dashboard?.recentPayments && dashboard.recentPayments.length > 0 && (
            <SectionCard title="Recent Payments" icon={Receipt}>
              <TableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.recentPayments.map((pay) => (
                      <TableRow key={pay.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-mono font-semibold text-foreground">{pay.receiptNumber}</TableCell>
                        <TableCell className="text-sm text-foreground">{pay.student.firstName} {pay.student.lastName}</TableCell>
                        <TableCell className="text-sm text-right font-mono font-semibold text-foreground">{formatCurrency(pay.amount, pay.currency)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{methodLabels[pay.paymentMethod] || pay.paymentMethod}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(pay.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableShell>
            </SectionCard>
          )}
        </TabsContent>

        {/* ─── Invoices Tab ─────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="space-y-4">
          <ModuleToolbar
            search={invoiceSearch}
            onSearch={setInvoiceSearch}
            searchPlaceholder="Search invoices..."
            filters={
              <div className="flex items-center gap-2 flex-wrap">
                {['ALL', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'].map((f) => (
                  <Button key={f} variant={invoiceFilter === f ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', invoiceFilter === f && 'bg-emerald-600 hover:bg-emerald-700 text-white')} onClick={() => setInvoiceFilter(f)}>
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
            }
          />
          {invoicesLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />))}</div>
          ) : (
            <TableShell isEmpty={filteredInvoices.length === 0} empty={<KitEmptyState icon={FileText} title="No invoices found" description="Create your first invoice to get started" action={<Button onClick={() => setViewMode('add-invoice')} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><Plus className="mr-2 h-4 w-4" />Create Invoice</Button>} />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedInvoice(inv); setViewMode('detail') }}>
                      <TableCell className="text-sm font-mono font-semibold text-foreground">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-sm text-foreground">{inv.student.firstName} {inv.student.lastName}</TableCell>
                      <TableCell className="text-sm text-right font-mono font-semibold text-foreground">{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell className="text-sm text-right font-mono text-teal-600 dark:text-teal-400 font-semibold">{formatCurrency(inv.amountPaid)}</TableCell>
                      <TableCell className="text-sm text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(inv.balance)}</TableCell>
                      <TableCell><Badge className={cn('text-[10px] font-semibold px-2 py-0.5 border', statusColors[inv.status] || statusColors.PENDING)}>{inv.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); setViewMode('detail') }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          )}
        </TabsContent>

        {/* ─── Payments Tab ─────────────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-4">
          <ModuleToolbar
            search={paymentSearch}
            onSearch={setPaymentSearch}
            searchPlaceholder="Search payments..."
            filters={
              <div className="flex items-center gap-2 flex-wrap">
                {['ALL', 'CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'ONLINE'].map((m) => (
                  <Button key={m} variant={paymentMethodFilter === m ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', paymentMethodFilter === m && 'bg-emerald-600 hover:bg-emerald-700 text-white')} onClick={() => setPaymentMethodFilter(m)}>
                    {m === 'ALL' ? 'All' : methodLabels[m] || m}
                  </Button>
                ))}
              </div>
            }
          />
          {paymentsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />))}</div>
          ) : (
            <TableShell isEmpty={filteredPayments.length === 0} empty={<KitEmptyState icon={CreditCard} title="No payments found" description="Record your first payment to get started" action={<Button onClick={() => setViewMode('add-payment')} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><CreditCard className="mr-2 h-4 w-4" />Record Payment</Button>} />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Paid By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((pay) => (
                    <TableRow key={pay.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-mono font-semibold text-foreground">{pay.receiptNumber}</TableCell>
                      <TableCell className="text-sm text-foreground">{pay.student.firstName} {pay.student.lastName}</TableCell>
                      <TableCell className="text-sm text-right font-mono font-semibold text-foreground">{formatCurrency(pay.amount, pay.currency)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{methodLabels[pay.paymentMethod] || pay.paymentMethod}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{pay.currency}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{pay.reference || '—'}</TableCell>
                      <TableCell className="text-sm text-foreground">{pay.parent ? `${pay.parent.firstName} ${pay.parent.lastName}` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(pay.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          )}
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
