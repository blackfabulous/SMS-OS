'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ArrowLeft,
  Settings,
  Eye,
  Save,
  Bell,
  RefreshCw,
  Calendar,
  DollarSign,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add-book' | 'issue-book' | 'return-book' | 'detail' | 'settings'

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null)
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
    description: '',
  })

  // Settings
  const [settings, setSettings] = useState({
    defaultView: 'Table',
    finePerDay: '0.50',
    maxFine: '10.00',
    loanPeriodDays: '14',
    autoRenewal: false,
    overdueEmailNotification: true,
    overdueSmsNotification: false,
    overdueReminderDays: '3',
    showIsbnColumn: true,
    showShelfLocation: true,
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
    if (viewMode === 'issue-book' || viewMode === 'return-book') fetchStudents()
  }, [viewMode, fetchStudents])

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
        toast.success('Book issued successfully')
        setIssueForm({ bookId: '', studentId: '', dueDate: '' })
        setViewMode('list')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to issue book')
      }
    } catch {
      toast.error('Failed to issue book')
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
        toast.success('Book returned successfully')
        setReturnForm({ transactionId: '', conditionOnReturn: 'GOOD', fine: '0' })
        setViewMode('list')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to return book')
      }
    } catch {
      toast.error('Failed to return book')
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
        toast.success('Book added successfully')
        setAddBookForm({ isbn: '', title: '', author: '', publisher: '', category: '', shelfLocation: '', totalCopies: '1', description: '' })
        setViewMode('list')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add book')
      }
    } catch {
      toast.error('Failed to add book')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveSettings = () => {
    toast.success('Library settings have been updated')
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

  // ─── Inline Views ──────────────────────────────────────────────────────

  const AddBookInlineForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-lg font-semibold">Add New Book</h2>
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid gap-6 max-w-2xl">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Title *</Label>
              <Input placeholder="Book title" value={addBookForm.title} onChange={(e) => setAddBookForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">ISBN</Label>
                <Input placeholder="ISBN number" value={addBookForm.isbn} onChange={(e) => setAddBookForm((p) => ({ ...p, isbn: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Author</Label>
                <Input placeholder="Author name" value={addBookForm.author} onChange={(e) => setAddBookForm((p) => ({ ...p, author: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Publisher</Label>
                <Input placeholder="Publisher" value={addBookForm.publisher} onChange={(e) => setAddBookForm((p) => ({ ...p, publisher: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={addBookForm.category} onValueChange={(v) => setAddBookForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Shelf Location</Label>
                <Input placeholder="e.g., A3-S2" value={addBookForm.shelfLocation} onChange={(e) => setAddBookForm((p) => ({ ...p, shelfLocation: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Total Copies</Label>
                <Input type="number" min="1" value={addBookForm.totalCopies} onChange={(e) => setAddBookForm((p) => ({ ...p, totalCopies: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Description (optional)</Label>
              <Textarea placeholder="Brief description of the book..." value={addBookForm.description} onChange={(e) => setAddBookForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleAddBook} disabled={submitting || !addBookForm.title} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Book
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const IssueBookInlineForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-lg font-semibold">Issue Book</h2>
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid gap-6 max-w-2xl">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Book *</Label>
              <Select value={issueForm.bookId} onValueChange={(v) => setIssueForm((p) => ({ ...p, bookId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select book..." /></SelectTrigger>
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
              <Label className="text-sm font-medium">Student *</Label>
              <Select value={issueForm.studentId} onValueChange={(v) => setIssueForm((p) => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Search and select student..." /></SelectTrigger>
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
              <Label className="text-sm font-medium">Due Date</Label>
              <Input type="date" value={issueForm.dueDate} onChange={(e) => setIssueForm((p) => ({ ...p, dueDate: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Default: {settings.loanPeriodDays} days from today</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleIssueBook} disabled={submitting || !issueForm.bookId || !issueForm.studentId} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Issue Book
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const ReturnBookInlineForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-lg font-semibold">Return Book</h2>
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid gap-6 max-w-2xl">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Condition on Return</Label>
              <Select value={returnForm.conditionOnReturn} onValueChange={(v) => setReturnForm((p) => ({ ...p, conditionOnReturn: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Fine (USD)</Label>
              <Input type="number" step="0.01" min="0" value={returnForm.fine} onChange={(e) => setReturnForm((p) => ({ ...p, fine: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Auto-calculated at ${settings.finePerDay}/day overdue</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleReturnBook} disabled={submitting || !returnForm.transactionId} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Return Book
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const BookDetailView = () => {
    if (!selectedBook) return null
    const activeTransactions = selectedBook.transactions.filter(t => t.transactionType === 'ISSUE' && !t.returnDate)
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedBook(null) }} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-lg font-semibold">Book Details</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
                    <BookOpen className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold">{selectedBook.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">by {selectedBook.author || 'Unknown Author'}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedBook.category && <Badge variant="secondary">{selectedBook.category}</Badge>}
                      {selectedBook.isbn && <Badge variant="outline" className="font-mono text-xs">ISBN: {selectedBook.isbn}</Badge>}
                      <Badge className={cn('text-xs border', selectedBook.availableCopies > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200')}>
                        {selectedBook.availableCopies > 0 ? `${selectedBook.availableCopies} Available` : 'All Issued'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Book Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Publisher</p>
                    <p className="text-sm font-medium">{selectedBook.publisher || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shelf Location</p>
                    <p className="text-sm font-medium font-mono">{selectedBook.shelfLocation || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Copies</p>
                    <p className="text-sm font-medium">{selectedBook.totalCopies}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Available Copies</p>
                    <p className="text-sm font-medium">{selectedBook.availableCopies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {activeTransactions.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Active Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeTransactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                            {t.student.firstName[0]}{t.student.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{t.student.firstName} {t.student.lastName}</p>
                            <p className="text-xs text-muted-foreground">{t.student.studentNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Due: {t.dueDate ? formatDate(t.dueDate) : '—'}</p>
                          <p className="text-xs text-muted-foreground">Issued: {formatDate(t.issueDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedBook.availableCopies > 0 && (
                  <Button className="w-full justify-start gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white" onClick={() => {
                    setIssueForm((p) => ({ ...p, bookId: selectedBook.id }))
                    setViewMode('issue-book')
                  }}>
                    <ArrowRightLeft className="h-4 w-4" /> Issue This Book
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Loans</span>
                    <span className="text-sm font-semibold">{selectedBook.transactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Currently Out</span>
                    <span className="text-sm font-semibold">{activeTransactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Utilization</span>
                    <span className="text-sm font-semibold">{selectedBook.totalCopies > 0 ? Math.round(((selectedBook.totalCopies - selectedBook.availableCopies) / selectedBook.totalCopies) * 100) : 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    )
  }

  const LibrarySettingsView = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-lg font-semibold">Library Settings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-600" /> Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Default View</Label>
              <Select value={settings.defaultView} onValueChange={(v) => setSettings((p) => ({ ...p, defaultView: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Table">Table View</SelectItem>
                  <SelectItem value="Cards">Card View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show ISBN Column</Label>
              <Switch checked={settings.showIsbnColumn} onCheckedChange={(v) => setSettings((p) => ({ ...p, showIsbnColumn: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Shelf Location</Label>
              <Switch checked={settings.showShelfLocation} onCheckedChange={(v) => setSettings((p) => ({ ...p, showShelfLocation: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" /> Fine Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Fine Per Day (USD)</Label>
              <Input type="number" step="0.01" min="0" value={settings.finePerDay} onChange={(e) => setSettings((p) => ({ ...p, finePerDay: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm">Maximum Fine (USD)</Label>
              <Input type="number" step="0.01" min="0" value={settings.maxFine} onChange={(e) => setSettings((p) => ({ ...p, maxFine: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" /> Loan Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Default Loan Period (days)</Label>
              <Input type="number" min="1" value={settings.loanPeriodDays} onChange={(e) => setSettings((p) => ({ ...p, loanPeriodDays: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Auto-Renewal</Label>
                <p className="text-xs text-muted-foreground">Automatically renew if no waitlist</p>
              </div>
              <Switch checked={settings.autoRenewal} onCheckedChange={(v) => setSettings((p) => ({ ...p, autoRenewal: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-500" /> Overdue Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Email Notifications</Label>
              <Switch checked={settings.overdueEmailNotification} onCheckedChange={(v) => setSettings((p) => ({ ...p, overdueEmailNotification: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">SMS Notifications</Label>
              <Switch checked={settings.overdueSmsNotification} onCheckedChange={(v) => setSettings((p) => ({ ...p, overdueSmsNotification: v }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm">Remind Before Due (days)</Label>
              <Input type="number" min="1" value={settings.overdueReminderDays} onChange={(e) => setSettings((p) => ({ ...p, overdueReminderDays: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
      </div>
    </motion.div>
  )

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <AnimatePresence mode="wait">
        {viewMode === 'add-book' && <AddBookInlineForm key="add-book" />}
        {viewMode === 'issue-book' && <IssueBookInlineForm key="issue-book" />}
        {viewMode === 'return-book' && <ReturnBookInlineForm key="return-book" />}
        {viewMode === 'detail' && <BookDetailView key="detail" />}
        {viewMode === 'settings' && <LibrarySettingsView key="settings" />}
      </AnimatePresence>

      {viewMode === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Library Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage books, lending, and returns</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewMode('settings')} className="gap-1">
                <Settings className="h-4 w-4" /> Settings
              </Button>
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setViewMode('add-book')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Book
              </Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md" onClick={() => setViewMode('issue-book')}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Issue Book
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="catalog" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Catalog</TabsTrigger>
              <TabsTrigger value="overdue" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Overdue</TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Transactions
              </TabsTrigger>
            </TabsList>

            {/* ─── Overview Tab ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-4">
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
                          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
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
                      <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No category data</div>
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
                        <Input placeholder="Search by title, author, ISBN..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-9 w-40">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Categories</SelectItem>
                          {data?.categories.map((c) => (
                            <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
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
                          {settings.showIsbnColumn && <TableHead>ISBN</TableHead>}
                          <TableHead className="text-center">Copies</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.books.map((book) => (
                          <TableRow key={book.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedBook(book); setViewMode('detail') }}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                                  <BookOpen className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{book.title}</p>
                                  {settings.showShelfLocation && book.shelfLocation && (
                                    <p className="text-[10px] text-muted-foreground">Shelf: {book.shelfLocation}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{book.author || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{book.category || '—'}</Badge>
                            </TableCell>
                            {settings.showIsbnColumn && <TableCell className="font-mono text-xs text-muted-foreground">{book.isbn || '—'}</TableCell>}
                            <TableCell className="text-center">
                              <span className="text-sm font-medium">{book.availableCopies}</span>
                              <span className="text-xs text-muted-foreground">/{book.totalCopies}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('text-[10px] px-2 py-0.5 border', book.availableCopies > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200')}>
                                {book.availableCopies > 0 ? 'Available' : 'All Issued'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-600 hover:text-teal-700" onClick={() => { setSelectedBook(book); setViewMode('detail') }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {book.availableCopies > 0 && (
                                  <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => {
                                    setIssueForm((p) => ({ ...p, bookId: book.id }))
                                    setViewMode('issue-book')
                                  }}>
                                    Issue
                                  </Button>
                                )}
                              </div>
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
                  <CardDescription>{data?.overdue.length || 0} books past due date</CardDescription>
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
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-2 py-0.5 border">{t.daysOverdue} days</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-amber-600">${t.calculatedFine.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-600 hover:text-teal-700" onClick={() => {
                                setReturnForm({ transactionId: t.id, conditionOnReturn: 'GOOD', fine: t.calculatedFine.toFixed(2) })
                                setViewMode('return-book')
                              }}>
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

            {/* ─── Transactions Tab ──────────────────────────────────────────── */}
            <TabsContent value="transactions" className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                  <CardDescription>{data?.transactions.length || 0} total transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Fine</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.transactions.slice(0, 50).map((t) => (
                          <TableRow key={t.id} className="hover:bg-muted/30">
                            <TableCell className="text-sm font-medium">{t.book.title}</TableCell>
                            <TableCell className="text-sm">{t.student.firstName} {t.student.lastName}</TableCell>
                            <TableCell>
                              <Badge className={cn('text-[10px] border', t.transactionType === 'ISSUE' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')}>
                                {t.transactionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(t.transactionType === 'ISSUE' ? t.issueDate : (t.returnDate || t.issueDate))}</TableCell>
                            <TableCell className="text-sm">{t.dueDate ? formatDate(t.dueDate) : '—'}</TableCell>
                            <TableCell className="text-sm font-semibold">{t.fine > 0 ? `$${t.fine.toFixed(2)}` : '—'}</TableCell>
                          </TableRow>
                        ))}
                        {data?.transactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No transactions yet</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  )
}
