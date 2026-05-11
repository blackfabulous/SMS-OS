'use client'

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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

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
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PARTIAL: 'bg-amber-100 text-amber-700 border-amber-200',
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
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

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoiceFilter, setInvoiceFilter] = useState('ALL')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [paymentSearch, setPaymentSearch] = useState('')

  // Dialogs
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
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
  }, [fetchDashboard])

  useEffect(() => {
    if (activeTab === 'invoices') fetchInvoices()
  }, [activeTab, fetchInvoices])

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments()
  }, [activeTab, fetchPayments])

  useEffect(() => {
    if (recordPaymentOpen || createInvoiceOpen) fetchStudents()
  }, [recordPaymentOpen, createInvoiceOpen, fetchStudents])

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
        setRecordPaymentOpen(false)
        setPaymentForm({ studentId: '', amount: '', paymentMethod: 'CASH', currency: 'USD', reference: '' })
        fetchDashboard()
        if (activeTab === 'payments') fetchPayments()
        if (activeTab === 'invoices') fetchInvoices()
      }
    } catch (err) {
      console.error('Failed to record payment:', err)
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
        setCreateInvoiceOpen(false)
        setInvoiceForm({ studentId: '', termId: '', dueDate: '', items: [{ description: '', amount: '', feeType: 'TUITION' }] })
        fetchDashboard()
        if (activeTab === 'invoices') fetchInvoices()
      }
    } catch (err) {
      console.error('Failed to create invoice:', err)
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

  // Debtor ageing (simulated from data)
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  const collectionRate = dashboard ? parseFloat(dashboard.collectionRate) : 0

  // ─── Render ────────────────────────────────────────────────────────────

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
          <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage fees, invoices, and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>Record a new fee payment for a student</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Student</Label>
                  <Select
                    value={paymentForm.studentId}
                    onValueChange={(v) => setPaymentForm((p) => ({ ...p, studentId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select student..." />
                    </SelectTrigger>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Currency</Label>
                    <Select
                      value={paymentForm.currency}
                      onValueChange={(v) => setPaymentForm((p) => ({ ...p, currency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ZiG">ZiG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentForm.paymentMethod}
                      onValueChange={(v) => setPaymentForm((p) => ({ ...p, paymentMethod: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Input
                      placeholder="Optional ref #"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordPayment}
                  disabled={submitting || !paymentForm.studentId || !paymentForm.amount}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>Generate a new fee invoice for a student</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="grid gap-4 py-4 pr-4">
                  <div className="grid gap-2">
                    <Label>Student</Label>
                    <Select
                      value={invoiceForm.studentId}
                      onValueChange={(v) => setInvoiceForm((p) => ({ ...p, studentId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Search and select student..." />
                      </SelectTrigger>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Term ID (optional)</Label>
                      <Input
                        placeholder="Term ID"
                        value={invoiceForm.termId}
                        onChange={(e) => setInvoiceForm((p) => ({ ...p, termId: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={invoiceForm.dueDate}
                        onChange={(e) => setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Line Items</Label>
                    <Button variant="outline" size="sm" onClick={addInvoiceItem}>
                      <Plus className="mr-1 h-3 w-3" /> Add Item
                    </Button>
                  </div>
                  {invoiceForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr_100px_120fr_32px] gap-2 items-end">
                      <div className="grid gap-1">
                        {index === 0 && <span className="text-xs text-muted-foreground">Description</span>}
                        <Input
                          placeholder="Fee description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        {index === 0 && <span className="text-xs text-muted-foreground">Amount</span>}
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => updateInvoiceItem(index, 'amount', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        {index === 0 && <span className="text-xs text-muted-foreground">Fee Type</span>}
                        <Select
                          value={item.feeType}
                          onValueChange={(v) => updateInvoiceItem(index, 'feeType', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-400 hover:text-red-600"
                        onClick={() => removeInvoiceItem(index)}
                        disabled={invoiceForm.items.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Total: </span>
                      <span className="text-lg font-bold">
                        {formatCurrency(
                          invoiceForm.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateInvoice}
                  disabled={submitting || !invoiceForm.studentId}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Payments
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Invoiced</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(dashboard?.totalInvoiced || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">All time</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Collected</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(dashboard?.totalCollected || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">{dashboard?.debtorCount || 0} debtors</span>
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Outstanding</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(dashboard?.totalOutstanding || 0)}</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Needs attention</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collection Rate</p>
                    <p className="text-2xl font-bold tracking-tight">{dashboard?.collectionRate || '0'}%</p>
                    <div className="flex items-center gap-1.5">
                      {collectionRate >= 80 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className={cn('text-xs font-medium', collectionRate >= 80 ? 'text-emerald-600' : 'text-red-500')}>
                        {collectionRate >= 80 ? 'On target' : 'Below target'}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
                    <CircleDollarSign className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 to-pink-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Collected vs Outstanding Donut */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Collection Overview</CardTitle>
                <CardDescription>Collected vs Outstanding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={donutChartConfig} className="h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Collected ({formatCurrency(dashboard?.totalCollected || 0)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-muted-foreground">Outstanding ({formatCurrency(dashboard?.totalOutstanding || 0)})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Collection Trend */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Collection Trend</CardTitle>
                <CardDescription>Monthly fee collection (USD)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={trendChartConfig} className="h-[220px] w-full">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-amount)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: 'var(--color-amount)' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments + Ageing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Payments */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => setActiveTab('payments')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[280px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Receipt #</TableHead>
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs">Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dashboard?.recentPayments || []).map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/30 cursor-pointer">
                          <TableCell className="font-mono text-xs">{payment.receiptNumber}</TableCell>
                          <TableCell className="text-sm">
                            {payment.student.firstName} {payment.student.lastName}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-right">
                            {formatCurrency(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!dashboard?.recentPayments || dashboard.recentPayments.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                            No recent payments
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Debtor Ageing */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Debtor Ageing</CardTitle>
                <CardDescription>Outstanding balance by age</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ageingData.map((item, index) => {
                    const colors = [
                      'from-emerald-400 to-teal-500',
                      'from-amber-400 to-yellow-500',
                      'from-orange-400 to-amber-500',
                      'from-red-400 to-rose-500',
                    ]
                    const percentages = dashboard?.totalOutstanding
                      ? (item.amount / dashboard.totalOutstanding) * 100
                      : 0
                    return (
                      <div key={item.period} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2.5 w-2.5 rounded-full bg-gradient-to-r', colors[index])} />
                            <span className="text-sm font-medium">{item.period}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{item.count} students</span>
                            <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', colors[index])}
                            style={{ width: `${Math.max(percentages, 2)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Invoices Tab ─────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Invoices</CardTitle>
                  <CardDescription>Manage fee invoices</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      className="pl-9 h-9 w-56"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                    />
                  </div>
                  <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                    <SelectTrigger className="h-9 w-36">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading invoices...</span>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const isExpanded = expandedInvoice === invoice.id
                        return (
                          <React.Fragment key={invoice.id}>
                            <TableRow
                              className="hover:bg-muted/30 cursor-pointer"
                              onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                            >
                              <TableCell>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                              <TableCell className="text-sm">
                                {invoice.student.firstName} {invoice.student.lastName}
                              </TableCell>
                              <TableCell className="text-sm font-semibold text-right">
                                {formatCurrency(invoice.totalAmount)}
                              </TableCell>
                              <TableCell className="text-sm text-right text-emerald-600">
                                {formatCurrency(invoice.amountPaid)}
                              </TableCell>
                              <TableCell className="text-sm text-right text-amber-600">
                                {formatCurrency(invoice.balance)}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn('text-[10px] px-2 py-0.5 border', statusColors[invoice.status] || statusColors.PENDING)}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(invoice.createdAt)}
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={8} className="bg-muted/20 p-4">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3"
                                  >
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2">Invoice Items</h4>
                                      <div className="rounded-lg border overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs">Description</TableHead>
                                              <TableHead className="text-xs">Fee Type</TableHead>
                                              <TableHead className="text-xs text-right">Amount</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {invoice.items.map((item) => (
                                              <TableRow key={item.id}>
                                                <TableCell className="text-sm">{item.description}</TableCell>
                                                <TableCell>
                                                  <Badge variant="secondary" className="text-[10px]">{item.feeType}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-right">{formatCurrency(item.amount)}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                    {invoice.payments && invoice.payments.length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-semibold mb-2">Payment History</h4>
                                        <div className="space-y-2">
                                          {invoice.payments.map((pay) => (
                                            <div key={pay.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white border">
                                              <span className="font-mono text-xs text-muted-foreground">{pay.receiptNumber}</span>
                                              <span className="text-emerald-600 font-semibold">{formatCurrency(pay.amount)}</span>
                                              <span className="text-xs text-muted-foreground">{formatDate(pay.createdAt)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>Due: {formatDate(invoice.dueDate)}</span>
                                      {invoice.term && (
                                        <>
                                          <Separator orientation="vertical" className="h-3" />
                                          <span>{invoice.term.name} - {invoice.term.academicYear?.name}</span>
                                        </>
                                      )}
                                    </div>
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                      {filteredInvoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                            No invoices found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Payments Tab ─────────────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Payments</CardTitle>
                  <CardDescription>Fee payment records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search payments..."
                      className="pl-9 h-9 w-56"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                    />
                  </div>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue placeholder="Filter method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Methods</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading payments...</span>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                              {payment.receiptNumber}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {payment.student.firstName} {payment.student.lastName}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-right">
                            {formatCurrency(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                'text-[10px] px-2 py-0.5 border',
                                payment.currency === 'USD'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              )}
                            >
                              {payment.currency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(payment.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredPayments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                            No payments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
