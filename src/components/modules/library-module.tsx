'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Library,
  BookOpen,
  Search,
  Plus,
  Loader2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  X,
} from 'lucide-react'
import {
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

interface BookTransaction {
  id: string
  transactionType: string
  issueDate: string
  dueDate: string | null
  returnDate: string | null
  fine: number
  conditionOnReturn: string | null
  daysOverdue?: number
  calculatedFine?: number
  book: {
    id: string
    title: string
    author: string | null
    isbn: string | null
  }
  student: {
    id: string
    firstName: string
    lastName: string
    studentNumber: string
  }
}

interface LibraryBook {
  id: string
  isbn: string | null
  title: string
  author: string | null
  publisher: string | null
  category: string | null
  shelfLocation: string | null
  totalCopies: number
  availableCopies: number
  isActive: boolean
  transactions: BookTransaction[]
}

interface LibraryData {
  books: LibraryBook[]
  transactions: BookTransaction[]
  stats: {
    totalBooks: number
    totalCopies: number
    availableCopies: number
    issuedCount: number
    overdueCount: number
  }
  overdue: Array<BookTransaction & { daysOverdue: number; calculatedFine: number }>
  categories: Array<{ category: string; count: number }>
}

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const categoryChartConfig = {
  count: { label: 'Books', color: '#10b981' },
} satisfies ChartConfig

const statusChartConfig = {
  available: { label: 'Available', color: '#10b981' },
  issued: { label: 'Issued', color: '#f59e0b' },
  overdue: { label: 'Overdue', color: '#ef4444' },
} satisfies ChartConfig

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const categoryColors = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']

// ─── Library Module ──────────────────────────────────────────────────────────

export default function LibraryModule() {
  const [data, setData] = useState<LibraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Dialogs
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Issue form
  const [issueForm, setIssueForm] = useState({
    bookId: '',
    studentId: '',
    dueDate: '',
  })

  // Return form
  const [returnForm, setReturnForm] = useState({
    transactionId: '',
    conditionOnReturn: 'GOOD',
    fine: '0',
  })

  // Add Book form
  const [addBookForm, setAddBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    category: '',
    shelfLocation: '',
    totalCopies: '1',
  })

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter && categoryFilter !== 'ALL') params.set('category', categoryFilter)
      const res = await fetch(`/api/library?${params}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (err) {
      console.error('Failed to fetch library data:', err)
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?limit=200')
      if (res.ok) {
        const d = await res.json()
        setStudents(d.data || d || [])
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (issueDialogOpen || returnDialogOpen) fetchStudents()
  }, [issueDialogOpen, returnDialogOpen, fetchStudents])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleIssueBook = async () => {
    if (!issueForm.bookId || !issueForm.studentId) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue',
          bookId: issueForm.bookId,
          studentId: issueForm.studentId,
          dueDate: issueForm.dueDate || undefined,
        }),
      })
      if (res.ok) {
        setIssueDialogOpen(false)
        setIssueForm({ bookId: '', studentId: '', dueDate: '' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to issue book:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturnBook = async () => {
    if (!returnForm.transactionId) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'return',
          transactionId: returnForm.transactionId,
          conditionOnReturn: returnForm.conditionOnReturn,
          fine: parseFloat(returnForm.fine) || 0,
        }),
      })
      if (res.ok) {
        setReturnDialogOpen(false)
        setReturnForm({ transactionId: '', conditionOnReturn: 'GOOD', fine: '0' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to return book:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddBook = async () => {
    if (!addBookForm.title) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addBook',
          isbn: addBookForm.isbn || undefined,
          title: addBookForm.title,
          author: addBookForm.author || undefined,
          publisher: addBookForm.publisher || undefined,
          category: addBookForm.category || undefined,
          shelfLocation: addBookForm.shelfLocation || undefined,
          totalCopies: parseInt(addBookForm.totalCopies) || 1,
        }),
      })
      if (res.ok) {
        setAddBookDialogOpen(false)
        setAddBookForm({ isbn: '', title: '', author: '', publisher: '', category: '', shelfLocation: '', totalCopies: '1' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add book:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Chart Data ────────────────────────────────────────────────────────

  const categoryChartData = data
    ? data.categories.map((c) => ({
        name: c.category.length > 12 ? c.category.slice(0, 12) + '...' : c.category,
        count: c.count,
        fill: categoryColors[data.categories.indexOf(c) % categoryColors.length],
      }))
    : []

  const statusData = data
    ? [
        { name: 'Available', value: data.stats.availableCopies, fill: 'var(--color-available)' },
        { name: 'Issued', value: data.stats.issuedCount, fill: 'var(--color-issued)' },
        { name: 'Overdue', value: data.stats.overdueCount, fill: 'var(--color-overdue)' },
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

  const stats = data?.stats

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
          <h1 className="text-2xl font-bold tracking-tight">Library Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage books, lending, and returns</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={addBookDialogOpen} onOpenChange={setAddBookDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Plus className="mr-2 h-4 w-4" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogDescription>Add a new book to the library catalog</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="grid gap-4 py-4 pr-4">
                  <div className="grid gap-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Book title"
                      value={addBookForm.title}
                      onChange={(e) => setAddBookForm((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>ISBN</Label>
                      <Input
                        placeholder="ISBN number"
                        value={addBookForm.isbn}
                        onChange={(e) => setAddBookForm((p) => ({ ...p, isbn: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Author</Label>
                      <Input
                        placeholder="Author name"
                        value={addBookForm.author}
                        onChange={(e) => setAddBookForm((p) => ({ ...p, author: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Publisher</Label>
                      <Input
                        placeholder="Publisher"
                        value={addBookForm.publisher}
                        onChange={(e) => setAddBookForm((p) => ({ ...p, publisher: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select
                        value={addBookForm.category}
                        onValueChange={(v) => setAddBookForm((p) => ({ ...p, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fiction">Fiction</SelectItem>
                          <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                          <SelectItem value="Textbook">Textbook</SelectItem>
                          <SelectItem value="Reference">Reference</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="History">History</SelectItem>
                          <SelectItem value="Literature">Literature</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Shelf Location</Label>
                      <Input
                        placeholder="e.g., A3-S2"
                        value={addBookForm.shelfLocation}
                        onChange={(e) => setAddBookForm((p) => ({ ...p, shelfLocation: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Total Copies</Label>
                      <Input
                        type="number"
                        min="1"
                        value={addBookForm.totalCopies}
                        onChange={(e) => setAddBookForm((p) => ({ ...p, totalCopies: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddBookDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBook}
                  disabled={submitting || !addBookForm.title}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Book
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Issue Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Issue Book</DialogTitle>
                <DialogDescription>Issue a book to a student</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Book</Label>
                  <Select
                    value={issueForm.bookId}
                    onValueChange={(v) => setIssueForm((p) => ({ ...p, bookId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select book..." />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {data?.books.filter((b) => b.availableCopies > 0).map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.title} {b.author ? `by ${b.author}` : ''} ({b.availableCopies} available)
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Student</Label>
                  <Select
                    value={issueForm.studentId}
                    onValueChange={(v) => setIssueForm((p) => ({ ...p, studentId: v }))}
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
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={issueForm.dueDate}
                    onChange={(e) => setIssueForm((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Default: 14 days from today</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleIssueBook}
                  disabled={submitting || !issueForm.bookId || !issueForm.studentId}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Issue Book
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="catalog" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Catalog
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Overdue
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Books</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.totalBooks || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">{stats?.totalCopies || 0} copies</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Library className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-green-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.availableCopies || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Ready to issue</span>
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Issued</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.issuedCount || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Currently out</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <ArrowRightLeft className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overdue</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.overdueCount || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-500">Needs attention</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <Clock className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400 to-rose-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Donut */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Book Status</CardTitle>
                <CardDescription>Distribution of book copies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={statusChartConfig} className="h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Available ({stats?.availableCopies || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-muted-foreground">Issued ({stats?.issuedCount || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Overdue ({stats?.overdueCount || 0})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Books by Category</CardTitle>
                <CardDescription>Distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ChartContainer config={categoryChartConfig} className="h-[220px] w-full">
                    <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    No category data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Catalog Tab ──────────────────────────────────────────────── */}
        <TabsContent value="catalog" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Book Catalog</CardTitle>
                  <CardDescription>{data?.books.length || 0} books in the library</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, author, ISBN..."
                      className="pl-9 h-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      {data?.categories.map((c) => (
                        <SelectItem key={c.category} value={c.category}>
                          {c.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead className="text-center">Copies</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.books.map((book) => (
                      <TableRow key={book.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                              <BookOpen className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{book.title}</p>
                              {book.shelfLocation && (
                                <p className="text-[10px] text-muted-foreground">Shelf: {book.shelfLocation}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{book.author || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {book.category || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{book.isbn || '—'}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{book.availableCopies}</span>
                          <span className="text-xs text-muted-foreground">/{book.totalCopies}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            'text-[10px] px-2 py-0.5 border',
                            book.availableCopies > 0
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          )}>
                            {book.availableCopies > 0 ? 'Available' : 'All Issued'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {book.availableCopies > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                              onClick={() => {
                                setIssueForm((p) => ({ ...p, bookId: book.id }))
                                setIssueDialogOpen(true)
                              }}
                            >
                              Issue
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.books.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                          {search || categoryFilter !== 'ALL' ? 'No books match your filters' : 'No books in the library yet'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Overdue Tab ──────────────────────────────────────────────── */}
        <TabsContent value="overdue" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Overdue Books</CardTitle>
              <CardDescription>
                {data?.overdue.length || 0} books past due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.overdue.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{t.book.title}</p>
                            <p className="text-xs text-muted-foreground">{t.book.author || '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-700 text-[10px] font-semibold">
                              {t.student.firstName[0]}{t.student.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm">{t.student.firstName} {t.student.lastName}</p>
                              <p className="text-xs text-muted-foreground">{t.student.studentNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-red-600 font-medium">{formatDate(t.dueDate!)}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-2 py-0.5 border">
                            {t.daysOverdue} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-amber-600">
                          ${t.calculatedFine.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-teal-600 hover:text-teal-700"
                            onClick={() => {
                              setReturnForm({
                                transactionId: t.id,
                                conditionOnReturn: 'GOOD',
                                fine: t.calculatedFine.toFixed(2),
                              })
                              setReturnDialogOpen(true)
                            }}
                          >
                            Return
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.overdue.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                            <p>No overdue books!</p>
                            <p className="text-xs mt-1">All issued books are within due dates</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Return Book Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>Process a book return and record any fines</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Condition on Return</Label>
              <Select
                value={returnForm.conditionOnReturn}
                onValueChange={(v) => setReturnForm((p) => ({ ...p, conditionOnReturn: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Fine Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={returnForm.fine}
                onChange={(e) => setReturnForm((p) => ({ ...p, fine: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Including late fees and damage charges</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReturnBook}
              disabled={submitting || !returnForm.transactionId}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Return Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
