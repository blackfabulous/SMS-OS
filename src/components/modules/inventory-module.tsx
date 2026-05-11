'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Wrench,
  Search,
  Plus,
  Loader2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  DollarSign,
  Tag,
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

interface MaintenanceRequest {
  id: string
  category: string
  description: string
  priority: string
  status: string
  estimatedCost: number | null
  actualCost: number | null
  createdAt: string
  asset: {
    id: string
    name: string
    assetTag: string
    location: string | null
  } | null
}

interface Asset {
  id: string
  assetTag: string
  name: string
  category: string
  location: string | null
  purchaseCost: number
  purchaseDate: string | null
  condition: string
  custodian: string | null
  isDisposed: boolean
  maintenanceRequests: MaintenanceRequest[]
}

interface InventoryData {
  assets: Asset[]
  maintenanceRequests: MaintenanceRequest[]
  stats: {
    totalAssets: number
    goodCondition: number
    fairCondition: number
    poorCondition: number
    pendingMaintenance: number
    totalAssetValue: number
  }
  categoryBreakdown: Array<{
    category: string
    count: number
    value: number
  }>
  maintenanceByStatus: Array<{
    status: string
    count: number
  }>
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const categoryChartConfig = {
  count: { label: 'Assets', color: '#10b981' },
} satisfies ChartConfig

const conditionChartConfig = {
  good: { label: 'Good/New', color: '#10b981' },
  fair: { label: 'Fair', color: '#f59e0b' },
  poor: { label: 'Poor', color: '#ef4444' },
} satisfies ChartConfig

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

const conditionColors: Record<string, string> = {
  NEW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  GOOD: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAIR: 'bg-amber-100 text-amber-700 border-amber-200',
  POOR: 'bg-red-100 text-red-700 border-red-200',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}

const maintenanceStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
}

const categoryColors = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// ─── Inventory Module ────────────────────────────────────────────────────────

export default function InventoryModule() {
  const [data, setData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState('ALL')

  // Dialogs
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Add Asset form
  const [addAssetForm, setAddAssetForm] = useState({
    name: '',
    category: '',
    location: '',
    purchaseCost: '',
    condition: 'GOOD',
  })

  // Maintenance form
  const [maintenanceForm, setMaintenanceForm] = useState({
    assetId: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL',
  })

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/inventory')
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (err) {
      console.error('Failed to fetch inventory data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleAddAsset = async () => {
    if (!addAssetForm.name || !addAssetForm.category) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addAsset',
          name: addAssetForm.name,
          category: addAssetForm.category,
          location: addAssetForm.location || undefined,
          purchaseCost: addAssetForm.purchaseCost ? parseFloat(addAssetForm.purchaseCost) : undefined,
          condition: addAssetForm.condition,
        }),
      })
      if (res.ok) {
        setAddAssetDialogOpen(false)
        setAddAssetForm({ name: '', category: '', location: '', purchaseCost: '', condition: 'GOOD' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to add asset:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestMaintenance = async () => {
    if (!maintenanceForm.description) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'requestMaintenance',
          assetId: maintenanceForm.assetId || undefined,
          description: maintenanceForm.description,
          priority: maintenanceForm.priority,
          category: maintenanceForm.category,
        }),
      })
      if (res.ok) {
        setMaintenanceDialogOpen(false)
        setMaintenanceForm({ assetId: '', description: '', priority: 'MEDIUM', category: 'GENERAL' })
        fetchData()
      }
    } catch (err) {
      console.error('Failed to request maintenance:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Chart Data ────────────────────────────────────────────────────────

  const categoryChartData = data
    ? data.categoryBreakdown.map((c) => ({
        name: c.category.length > 12 ? c.category.slice(0, 12) + '...' : c.category,
        count: c.count,
        fill: categoryColors[data.categoryBreakdown.indexOf(c) % categoryColors.length],
      }))
    : []

  const conditionData = data
    ? [
        { name: 'Good/New', value: data.stats.goodCondition, fill: 'var(--color-good)' },
        { name: 'Fair', value: data.stats.fairCondition, fill: 'var(--color-fair)' },
        { name: 'Poor', value: data.stats.poorCondition, fill: 'var(--color-poor)' },
      ]
    : []

  // Filtered assets
  const filteredAssets = (data?.assets || []).filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.assetTag.toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q) ||
      (a.custodian || '').toLowerCase().includes(q)
    )
  }).filter((a) => {
    if (conditionFilter === 'ALL') return true
    if (conditionFilter === 'GOOD') return a.condition === 'GOOD' || a.condition === 'NEW'
    return a.condition === conditionFilter
  })

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-52 bg-muted animate-pulse rounded" />
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
          <h1 className="text-2xl font-bold tracking-tight">Inventory & Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">Track school assets, supplies, and maintenance</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <Wrench className="mr-2 h-4 w-4" />
                Request Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Maintenance</DialogTitle>
                <DialogDescription>Submit a maintenance or repair request</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Asset (optional)</Label>
                  <Select
                    value={maintenanceForm.assetId}
                    onValueChange={(v) => setMaintenanceForm((p) => ({ ...p, assetId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset..." />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {data?.assets.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.assetTag} - {a.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select
                      value={maintenanceForm.category}
                      onValueChange={(v) => setMaintenanceForm((p) => ({ ...p, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="PLUMBING">Plumbing</SelectItem>
                        <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                        <SelectItem value="CARPENTRY">Carpentry</SelectItem>
                        <SelectItem value="PAINTING">Painting</SelectItem>
                        <SelectItem value="IT_EQUIPMENT">IT Equipment</SelectItem>
                        <SelectItem value="FURNITURE">Furniture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select
                      value={maintenanceForm.priority}
                      onValueChange={(v) => setMaintenanceForm((p) => ({ ...p, priority: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Description *</Label>
                  <Input
                    placeholder="Describe the maintenance needed..."
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestMaintenance}
                  disabled={submitting || !maintenanceForm.description}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addAssetDialogOpen} onOpenChange={setAddAssetDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>Register a new school asset or equipment</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Asset Name *</Label>
                  <Input
                    placeholder="e.g., Dell Desktop Computer"
                    value={addAssetForm.name}
                    onChange={(e) => setAddAssetForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category *</Label>
                    <Select
                      value={addAssetForm.category}
                      onValueChange={(v) => setAddAssetForm((p) => ({ ...p, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                        <SelectItem value="Lab Equipment">Lab Equipment</SelectItem>
                        <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                        <SelectItem value="Kitchen Equipment">Kitchen Equipment</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Building">Building</SelectItem>
                        <SelectItem value="Vehicle">Vehicle</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Condition</Label>
                    <Select
                      value={addAssetForm.condition}
                      onValueChange={(v) => setAddAssetForm((p) => ({ ...p, condition: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="POOR">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., Room 12, Lab B"
                      value={addAssetForm.location}
                      onChange={(e) => setAddAssetForm((p) => ({ ...p, location: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Purchase Cost (USD)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={addAssetForm.purchaseCost}
                      onChange={(e) => setAddAssetForm((p) => ({ ...p, purchaseCost: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddAssetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAsset}
                  disabled={submitting || !addAssetForm.name || !addAssetForm.category}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Asset
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
          <TabsTrigger value="assets" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Assets
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Maintenance
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Assets</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.totalAssets || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">{formatCurrency(stats?.totalAssetValue || 0)} value</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Package className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-emerald-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Good Condition</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.goodCondition || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Good or New</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-green-500" />
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fair Condition</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.fairCondition || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Needs monitoring</span>
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Maintenance</p>
                    <p className="text-2xl font-bold tracking-tight">{stats?.pendingMaintenance || 0}</p>
                    <div className="flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-orange-600" />
                      <span className="text-xs font-medium text-orange-600">{stats?.poorCondition || 0} in poor condition</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                    <Wrench className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 to-red-500" />
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Condition Donut */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Asset Condition</CardTitle>
                <CardDescription>Distribution by condition status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={conditionChartConfig} className="h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={conditionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {conditionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Good ({stats?.goodCondition || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-muted-foreground">Fair ({stats?.fairCondition || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Poor ({stats?.poorCondition || 0})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Assets by Category</CardTitle>
                <CardDescription>Count and value by category</CardDescription>
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

        {/* ─── Assets Tab ───────────────────────────────────────────────── */}
        <TabsContent value="assets" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Asset Registry</CardTitle>
                  <CardDescription>{filteredAssets.length} assets tracked</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search assets..."
                      className="pl-9 h-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger className="h-9 w-36">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="GOOD">Good/New</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
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
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Custodian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50">
                              <Tag className="h-3.5 w-3.5 text-teal-600" />
                            </div>
                            <span className="font-mono text-xs font-semibold">{asset.assetTag}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{asset.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {asset.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{asset.location || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px] px-2 py-0.5 border', conditionColors[asset.condition] || conditionColors.GOOD)}>
                            {asset.condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {formatCurrency(asset.purchaseCost)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {asset.custodian || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAssets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                          {search || conditionFilter !== 'ALL' ? 'No assets match your filters' : 'No assets registered yet'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Maintenance Tab ──────────────────────────────────────────── */}
        <TabsContent value="maintenance" className="space-y-4">
          {/* Maintenance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(data?.maintenanceByStatus || []).map((ms) => (
              <div key={ms.status} className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">{ms.status.replace('_', ' ')}</p>
                <p className="text-xl font-bold mt-1">{ms.count}</p>
              </div>
            ))}
            {(!data?.maintenanceByStatus || data.maintenanceByStatus.length === 0) && (
              <>
                <div className="rounded-xl border p-4 bg-amber-50/50">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold mt-1 text-amber-600">0</p>
                </div>
                <div className="rounded-xl border p-4 bg-cyan-50/50">
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-xl font-bold mt-1 text-cyan-600">0</p>
                </div>
                <div className="rounded-xl border p-4 bg-emerald-50/50">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold mt-1 text-emerald-600">0</p>
                </div>
                <div className="rounded-xl border p-4 bg-gray-50/50">
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                  <p className="text-xl font-bold mt-1 text-gray-600">0</p>
                </div>
              </>
            )}
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Maintenance Requests</CardTitle>
              <CardDescription>{data?.maintenanceRequests.length || 0} total requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.maintenanceRequests.map((mr) => (
                      <TableRow key={mr.id} className="hover:bg-muted/30">
                        <TableCell>
                          {mr.asset ? (
                            <div>
                              <p className="text-sm font-medium">{mr.asset.name}</p>
                              <p className="text-[10px] text-muted-foreground">{mr.asset.assetTag}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">General Request</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {mr.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{mr.description}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px] px-2 py-0.5 border', priorityColors[mr.priority] || priorityColors.MEDIUM)}>
                            {mr.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px] px-2 py-0.5 border', maintenanceStatusColors[mr.status] || maintenanceStatusColors.PENDING)}>
                            {mr.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(mr.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {data?.maintenanceRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                            <p>No maintenance requests</p>
                            <p className="text-xs mt-1">All assets are in good condition</p>
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
    </motion.div>
  )
}
