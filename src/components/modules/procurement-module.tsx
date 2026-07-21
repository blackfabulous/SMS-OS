'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
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
import {
  ShoppingCart,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Star,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Package,
  Send,
  Eye,
  Filter,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { apiFetch, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseOrder {
  id: string
  poNumber: string
  vendor: string
  description: string
  items: { name: string; qty: number; unitCost: number }[]
  totalAmount: number
  status: 'Draft' | 'Pending' | 'Approved' | 'Received' | 'Cancelled'
  requestedBy: string
  requestedDate: string
  approvedBy?: string
  approvedDate?: string
}

interface Vendor {
  id: string
  name: string
  category: string
  contactPerson: string
  phone: string
  email: string
  address: string
  rating: number
  totalOrders: number
  status: 'Active' | 'Inactive'
}

interface Requisition {
  id: string
  reqNumber: string
  requestedBy: string
  department: string
  items: { name: string; qty: number; estimatedCost: number }[]
  totalEstimate: number
  justification: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled'
  requestDate: string
  approvedBy?: string
  approvedDate?: string
  comments?: string
}

interface BudgetCategory {
  category: string
  allocated: number
  spent: number
  remaining: number
}

// ─── Mappings ─────────────────────────────────────────────────────────────────

const mapDbPO = (po: any): PurchaseOrder => {
  const mapStatus = (s: string): PurchaseOrder['status'] => {
    switch (s?.toUpperCase()) {
      case 'DRAFT': return 'Draft'
      case 'PENDING': return 'Pending'
      case 'APPROVED': return 'Approved'
      case 'RECEIVED': return 'Received'
      case 'CANCELLED': return 'Cancelled'
      default: return 'Draft'
    }
  }

  return {
    id: po.id,
    poNumber: po.orderNumber,
    vendor: po.supplier?.name || 'Unknown',
    description: po.description || '',
    items: (po.items || []).map((item: any) => ({
      name: item.description,
      qty: item.quantity,
      unitCost: item.unitPrice,
    })),
    totalAmount: po.totalAmount,
    status: mapStatus(po.status),
    requestedBy: po.requestedBy || 'System',
    requestedDate: po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : '',
    approvedBy: po.approvedBy || undefined,
    approvedDate: po.updatedAt ? new Date(po.updatedAt).toISOString().split('T')[0] : undefined,
  }
}

const mapDbVendor = (v: any): Vendor => {
  return {
    id: v.id,
    name: v.name,
    category: 'General',
    contactPerson: v.contactPerson || '',
    phone: v.phone || '',
    email: v.email || '',
    address: v.address || '',
    rating: 4.0,
    totalOrders: v.purchaseOrders?.length || 0,
    status: v.isActive ? 'Active' : 'Inactive',
  }
}

const mapDbRequisition = (r: any): Requisition => {
  const mapStatus = (s: string): Requisition['status'] => {
    switch (s?.toUpperCase()) {
      case 'PENDING': return 'Pending'
      case 'APPROVED': return 'Approved'
      case 'REJECTED': return 'Rejected'
      case 'FULFILLED': return 'Fulfilled'
      default: return 'Pending'
    }
  }

  return {
    id: r.id,
    reqNumber: `REQ-${r.id.slice(-6).toUpperCase()}`,
    requestedBy: r.requestedBy || 'Unknown',
    department: r.department || 'General',
    items: [],
    totalEstimate: r.estimatedCost || 0,
    justification: `${r.title}: ${r.description || ''}`,
    status: mapStatus(r.status),
    requestDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
    approvedBy: r.approvedBy || undefined,
    approvedDate: r.updatedAt ? new Date(r.updatedAt).toISOString().split('T')[0] : undefined,
    comments: r.comments || '',
  }
}

const budgetData: BudgetCategory[] = [
  { category: 'Canteen Supplies', allocated: 5000, spent: 3200, remaining: 1800 },
  { category: 'Stationery & Books', allocated: 3000, spent: 1800, remaining: 1200 },
  { category: 'Cleaning Supplies', allocated: 1500, spent: 900, remaining: 600 },
  { category: 'Maintenance Materials', allocated: 2500, spent: 1200, remaining: 1300 },
  { category: 'IT Equipment', allocated: 4000, spent: 3500, remaining: 500 },
  { category: 'Sports Equipment', allocated: 2000, spent: 600, remaining: 1400 },
  { category: 'Lab Supplies', allocated: 1500, spent: 800, remaining: 700 },
  { category: 'Office Supplies', allocated: 1000, spent: 650, remaining: 350 },
]

const budgetChartConfig = {
  allocated: { label: 'Allocated', color: '#10b981' },
  spent: { label: 'Spent', color: '#f59e0b' },
} satisfies ChartConfig

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProcurementModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [searchPO, setSearchPO] = useState('')
  const [searchVendor, setSearchVendor] = useState('')
  const [searchReq, setSearchReq] = useState('')
  const [addPOOpen, setAddPOOpen] = useState(false)
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [poStatusFilter, setPoStatusFilter] = useState('All')
  const [reqStatusFilter, setReqStatusFilter] = useState('All')

  // New PO form
  const [newPOVendor, setNewPOVendor] = useState('')
  const [newPODescription, setNewPODescription] = useState('')
  const [newPOItemName, setNewPOItemName] = useState('')
  const [newPOItemQty, setNewPOItemQty] = useState('')
  const [newPOItemCost, setNewPOItemCost] = useState('')
  const [newPOItems, setNewPOItems] = useState<{ name: string; qty: number; unitCost: number }[]>([])

  // New Vendor form
  const [newVendorName, setNewVendorName] = useState('')
  const [newVendorCategory, setNewVendorCategory] = useState('Grains & Cereals')
  const [newVendorContact, setNewVendorContact] = useState('')
  const [newVendorPhone, setNewVendorPhone] = useState('')
  const [newVendorEmail, setNewVendorEmail] = useState('')
  const [newVendorAddress, setNewVendorAddress] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const poData = await apiFetch<{ data: unknown[]; stats?: Record<string, number> }>('/api/procurement')
      setPurchaseOrders((poData.data || []).map(mapDbPO))
      if (poData.stats) setStats(poData.stats)

      const vendorData = await apiFetch<{ data: unknown[] }>('/api/procurement?type=vendors')
      setVendors((vendorData.data || []).map(mapDbVendor))

      const reqData = await apiFetch<{ data: unknown[] }>('/api/procurement?type=requisitions')
      setRequisitions((reqData.data || []).map(mapDbRequisition))
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error loading procurement data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Computed stats
  const totalPOs = purchaseOrders.length
  const pendingApprovals = purchaseOrders.filter(p => p.status === 'Pending').length
  const totalBudget = budgetData.reduce((s, b) => s + b.allocated, 0)
  
  // Real PO spent sum vs mock fallback
  const realSpent = purchaseOrders
    .filter(p => p.status === 'Approved' || p.status === 'Received')
    .reduce((s, p) => s + p.totalAmount, 0)
  const totalSpent = realSpent > 0 ? realSpent : budgetData.reduce((s, b) => s + b.spent, 0)
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100)
  const activeVendorCount = vendors.filter(v => v.status === 'Active').length

  const filteredPOs = purchaseOrders.filter(po =>
    (poStatusFilter === 'All' || po.status === poStatusFilter) &&
    (po.poNumber.toLowerCase().includes(searchPO.toLowerCase()) ||
     po.vendor.toLowerCase().includes(searchPO.toLowerCase()) ||
     po.description.toLowerCase().includes(searchPO.toLowerCase()))
  )

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchVendor.toLowerCase()) ||
    v.category.toLowerCase().includes(searchVendor.toLowerCase())
  )

  const filteredRequisitions = requisitions.filter(r =>
    (reqStatusFilter === 'All' || r.status === reqStatusFilter) &&
    (r.reqNumber.toLowerCase().includes(searchReq.toLowerCase()) ||
     r.requestedBy.toLowerCase().includes(searchReq.toLowerCase()) ||
     r.department.toLowerCase().includes(searchReq.toLowerCase()))
  )

  // Add PO item to list
  const addPOItem = () => {
    if (!newPOItemName || !newPOItemQty || !newPOItemCost) return
    setNewPOItems(prev => [...prev, {
      name: newPOItemName,
      qty: parseInt(newPOItemQty),
      unitCost: parseFloat(newPOItemCost),
    }])
    setNewPOItemName('')
    setNewPOItemQty('')
    setNewPOItemCost('')
  }

  // Remove PO item from list
  const removePOItem = (index: number) => {
    setNewPOItems(prev => prev.filter((_, i) => i !== index))
  }

  // Create new PO
  const handleCreatePO = async () => {
    if (!newPOVendor || newPOItems.length === 0) {
      toast.error('Please select a vendor and add at least one item')
      return
    }
    const selectedVendor = vendors.find(v => v.name === newPOVendor)
    if (!selectedVendor) {
      toast.error('Selected vendor is invalid')
      return
    }

    try {
      setSubmitting(true)
      await apiPost('/api/procurement', {
        action: 'createPO',
        title: newPODescription || `Purchase Order for ${newPOVendor}`,
        description: newPODescription,
        supplierId: selectedVendor.id,
        requestedBy: 'Admin User',
        items: newPOItems.map(item => ({
          description: item.name,
          quantity: item.qty,
          unitPrice: item.unitCost,
          totalPrice: item.qty * item.unitCost,
        })),
      })

      toast.success('Purchase order created successfully')
      setNewPOVendor('')
      setNewPODescription('')
      setNewPOItems([])
      setAddPOOpen(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to create purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  // Create new Vendor
  const handleAddVendor = async () => {
    if (!newVendorName || !newVendorContact) {
      toast.error('Vendor name and contact person are required')
      return
    }

    try {
      setSubmitting(true)
      await apiPost('/api/procurement', {
        action: 'addVendor',
        name: newVendorName,
        contactPerson: newVendorContact,
        phone: newVendorPhone,
        email: newVendorEmail,
        address: newVendorAddress,
      })

      toast.success('Vendor added successfully')
      setNewVendorName('')
      setNewVendorCategory('Grains & Cereals')
      setNewVendorContact('')
      setNewVendorPhone('')
      setNewVendorEmail('')
      setNewVendorAddress('')
      setAddVendorOpen(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to add vendor')
    } finally {
      setSubmitting(false)
    }
  }

  // PO Status actions
  const updatePOStatus = async (id: string, status: PurchaseOrder['status']) => {
    const dbStatus = status.toUpperCase()
    try {
      await apiPut('/api/procurement', {
        id,
        type: 'purchaseOrder',
        status: dbStatus,
        approvedBy: dbStatus === 'APPROVED' ? 'Admin User' : undefined,
      })

      toast.success(`Purchase order marked as ${status.toLowerCase()}`)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to update status')
    }
  }

  // Requisition status actions
  const updateReqStatus = async (id: string, status: Requisition['status'], comments?: string) => {
    const dbStatus = status.toUpperCase()
    try {
      await apiPut('/api/procurement', {
        id,
        type: 'requisition',
        status: dbStatus,
        comments,
      })

      toast.success(`Requisition marked as ${status.toLowerCase()}`)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to update requisition status')
    }
  }

  const deleteVendor = async (id: string) => {
    try {
      await apiDelete(`/api/procurement?id=${id}&type=vendor`)

      toast.success('Vendor deactivated successfully')
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete vendor')
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <Edit className="h-3.5 w-3.5 text-muted-foreground" />
      case 'Pending': return <Clock className="h-3.5 w-3.5 text-amber-500" />
      case 'Approved': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      case 'Received': return <Package className="h-3.5 w-3.5 text-teal-500" />
      case 'Fulfilled': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      case 'Rejected': return <XCircle className="h-3.5 w-3.5 text-red-500" />
      case 'Cancelled': return <XCircle className="h-3.5 w-3.5 text-red-500" />
      default: return null
    }
  }

  const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Draft': return 'outline'
      case 'Pending': return 'secondary'
      case 'Approved': return 'default'
      case 'Received': return 'default'
      case 'Fulfilled': return 'default'
      case 'Rejected': return 'destructive'
      case 'Cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={cn('h-3.5 w-3.5', i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
    ))
  }

  const budgetChartData = budgetData.map(b => ({
    category: b.category.split(' ')[0],
    allocated: b.allocated,
    spent: b.spent,
  }))

  if (loading) {
    return (
      <ModuleContainer>
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <StatGrid cols={4}>
          {[1, 2, 3, 4].map((i) => (<div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />))}
        </StatGrid>
      </ModuleContainer>
    )
  }

  return (
    <ModuleContainer>
      <ModulePageLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={
          <>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          </>
        }
      >
        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Row */}
          <StatGrid cols={4}>
            <ModuleStatCard
              icon={FileText}
              label="Purchase Orders"
              value={totalPOs}
              accentGradient="from-emerald-400 to-teal-500"
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              trend={{ value: "+3 this month", positive: true }}
              index={0}
            />
            <ModuleStatCard
              icon={Clock}
              label="Pending Approvals"
              value={pendingApprovals}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              trend={{ value: "Awaiting action" }}
              index={1}
            />
            <ModuleStatCard
              icon={DollarSign}
              label="Budget Utilization"
              value={`${budgetUtilization}%`}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              hint={`$${totalSpent.toLocaleString()} / $${totalBudget.toLocaleString()}`}
              index={2}
            />
            <ModuleStatCard
              icon={Users}
              label="Active Vendors"
              value={activeVendorCount}
              accentGradient="from-cyan-400 to-blue-500"
              bgColor="bg-cyan-50 dark:bg-cyan-950/40"
              iconColor="text-cyan-600 dark:text-cyan-400"
              hint={`${vendors.length} total`}
              index={3}
            />
          </StatGrid>

          {/* Recent POs + Pending Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Recent Purchase Orders">
              <div className="space-y-3">
                {purchaseOrders.slice(0, 5).map(po => (
                  <div key={po.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      {statusIcon(po.status)}
                      <div>
                        <p className="text-sm font-medium">{po.poNumber}</p>
                        <p className="text-xs text-muted-foreground">{po.vendor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${po.totalAmount.toFixed(2)}</p>
                      <Badge variant={statusBadgeVariant(po.status)} className="text-[10px]">{po.status}</Badge>
                    </div>
                  </div>
                ))}
                {purchaseOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No purchase orders found</p>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title={
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Pending Approvals
                </span>
              }
            >
              <div className="space-y-3">
                {purchaseOrders.filter(p => p.status === 'Pending').length === 0 &&
                 requisitions.filter(r => r.status === 'Pending').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
                ) : (
                  <>
                    {purchaseOrders.filter(p => p.status === 'Pending').map(po => (
                      <div key={po.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium">{po.poNumber}</p>
                            <p className="text-xs text-muted-foreground">{po.vendor} - ${po.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => updatePOStatus(po.id, 'Approved')}>
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </Button>
                      </div>
                    ))}
                    {requisitions.filter(r => r.status === 'Pending').map(req => (
                      <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/60 dark:bg-orange-950/30">
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium">{req.reqNumber}</p>
                            <p className="text-xs text-muted-foreground">{req.department} - ${req.totalEstimate.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => updateReqStatus(req.id, 'Approved', 'Approved')}>
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => updateReqStatus(req.id, 'Rejected', 'Rejected')}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Budget Overview */}
          <SectionCard title="Budget Utilization by Category">
            <div className="space-y-3">
              {budgetData.map(b => (
                <div key={b.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{b.category}</span>
                    <span className="text-xs text-muted-foreground">${b.spent.toLocaleString()} / ${b.allocated.toLocaleString()} ({Math.round(b.spent / b.allocated * 100)}%)</span>
                  </div>
                  <Progress value={(b.spent / b.allocated) * 100} className={cn('h-2', b.spent / b.allocated > 0.85 ? '[&>div]:bg-red-500' : b.spent / b.allocated > 0.6 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')} />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ─── Purchase Orders Tab ──────────────────────────────────────────── */}
        <TabsContent value="orders" className="space-y-4">
          <ModuleToolbar
            search={searchPO}
            onSearch={setSearchPO}
            searchPlaceholder="Search purchase orders..."
            filters={
              <Select value={poStatusFilter} onValueChange={setPoStatusFilter}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            }
            actions={
              <Dialog open={addPOOpen} onOpenChange={setAddPOOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" /> Create PO
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vendor</Label>
                        <Select value={newPOVendor} onValueChange={setNewPOVendor}>
                          <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                          <SelectContent>
                            {vendors.filter(v => v.status === 'Active').map(v => (
                              <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={newPODescription} onChange={e => setNewPODescription(e.target.value)} placeholder="Order description" />
                      </div>
                    </div>

                    <Separator />
                    <p className="text-sm font-medium">Items</p>

                    {/* Item list */}
                    {newPOItems.length > 0 && (
                      <div className="space-y-2">
                        {newPOItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                            <span className="text-sm">{item.name} x{item.qty} @ ${item.unitCost.toFixed(2)}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">${(item.qty * item.unitCost).toFixed(2)}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removePOItem(idx)}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add item row */}
                    <div className="grid grid-cols-[1fr_80px_80px_40px] gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Item</Label>
                        <Input value={newPOItemName} onChange={e => setNewPOItemName(e.target.value)} placeholder="Item name" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" value={newPOItemQty} onChange={e => setNewPOItemQty(e.target.value)} placeholder="0" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit $</Label>
                        <Input type="number" step="0.01" value={newPOItemCost} onChange={e => setNewPOItemCost(e.target.value)} placeholder="0.00" className="h-8 text-sm" />
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={addPOItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {newPOItems.length > 0 && (
                      <div className="flex justify-end p-2 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Total: ${newPOItems.reduce((s, i) => s + i.qty * i.unitCost, 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreatePO} disabled={!newPOVendor || newPOItems.length === 0 || submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create PO
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          />

          <TableShell
            isEmpty={filteredPOs.length === 0}
            empty={
              <KitEmptyState
                icon={FileText}
                title="No purchase orders found"
                description="Create a purchase order to get started."
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs font-semibold">{po.poNumber}</TableCell>
                    <TableCell className="font-medium">{po.vendor}</TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{po.description}</TableCell>
                    <TableCell className="font-semibold">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(po.status)}
                        <Badge variant={statusBadgeVariant(po.status)} className="text-[10px]">{po.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{po.requestedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{po.requestedDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {po.status === 'Draft' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updatePOStatus(po.id, 'Pending')}>
                            <Send className="h-3 w-3" /> Submit
                          </Button>
                        )}
                        {po.status === 'Pending' && (
                          <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => updatePOStatus(po.id, 'Approved')}>
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </Button>
                        )}
                        {po.status === 'Approved' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updatePOStatus(po.id, 'Received')}>
                            <Package className="h-3 w-3" /> Mark Received
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        {/* ─── Vendors Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="vendors" className="space-y-4">
          <ModuleToolbar
            search={searchVendor}
            onSearch={setSearchVendor}
            searchPlaceholder="Search vendors..."
            actions={
              <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" /> Add Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Vendor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vendor Name</Label>
                        <Input value={newVendorName} onChange={e => setNewVendorName(e.target.value)} placeholder="e.g. National Foods" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={newVendorCategory} onValueChange={setNewVendorCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Grains & Cereals">Grains & Cereals</SelectItem>
                            <SelectItem value="Poultry & Eggs">Poultry & Eggs</SelectItem>
                            <SelectItem value="Cooking Supplies">Cooking Supplies</SelectItem>
                            <SelectItem value="Beverages">Beverages</SelectItem>
                            <SelectItem value="Bakery Products">Bakery Products</SelectItem>
                            <SelectItem value="Fresh Produce">Fresh Produce</SelectItem>
                            <SelectItem value="Meat Products">Meat Products</SelectItem>
                            <SelectItem value="Fish Products">Fish Products</SelectItem>
                            <SelectItem value="Stationery">Stationery</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input value={newVendorContact} onChange={e => setNewVendorContact(e.target.value)} placeholder="Contact name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={newVendorPhone} onChange={e => setNewVendorPhone(e.target.value)} placeholder="+263 ..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={newVendorEmail} onChange={e => setNewVendorEmail(e.target.value)} placeholder="email@example.co.zw" />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={newVendorAddress} onChange={e => setNewVendorAddress(e.target.value)} placeholder="Harare, Zimbabwe" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddVendor} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Vendor
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          />

          {filteredVendors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
              <KitEmptyState
                icon={Users}
                title="No vendors found"
                description="Add a vendor to get started."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVendors.map(vendor => (
                <Card key={vendor.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 shrink-0">
                          <Building2 className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{vendor.name}</p>
                          <Badge variant="outline" className="text-[10px] mt-1">{vendor.category}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">{vendor.status}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteVendor(vendor.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        <span>{vendor.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{vendor.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 truncate">
                        <span>{vendor.email}</span>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {renderStars(vendor.rating)}
                        <span className="text-xs text-muted-foreground ml-1">({vendor.rating})</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{vendor.totalOrders} orders</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Budget Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="budget" className="space-y-4">
          {/* Summary Cards */}
          <StatGrid cols={3}>
            <ModuleStatCard
              icon={DollarSign}
              label="Total Budget"
              value={`$${totalBudget.toLocaleString()}`}
              accentGradient="from-teal-400 to-emerald-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600 dark:text-teal-400"
              hint="For current fiscal year"
              index={0}
            />
            <ModuleStatCard
              icon={TrendingUp}
              label="Total Spent"
              value={`$${totalSpent.toLocaleString()}`}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              hint={`${budgetUtilization}% utilized`}
              index={1}
            />
            <ModuleStatCard
              icon={Package}
              label="Remaining"
              value={`$${(totalBudget - totalSpent).toLocaleString()}`}
              accentGradient="from-emerald-400 to-cyan-500"
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              hint={`${100 - budgetUtilization}% available`}
              index={2}
            />
          </StatGrid>

          {/* Budget Chart */}
          <SectionCard
            title="Budget Allocation vs Spending"
            description="By category (USD)"
          >
            <ChartContainer config={budgetChartConfig} className="h-[320px] w-full">
              <BarChart data={budgetChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="allocated" fill="var(--color-allocated)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ChartContainer>
          </SectionCard>

          {/* Detailed Budget Table */}
          <SectionCard title="Budget Breakdown by Category">
            <TableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetData.map(b => (
                    <TableRow key={b.category}>
                      <TableCell className="font-medium">{b.category}</TableCell>
                      <TableCell>${b.allocated.toLocaleString()}</TableCell>
                      <TableCell className="text-amber-600 font-medium">${b.spent.toLocaleString()}</TableCell>
                      <TableCell className={cn('font-medium', b.remaining < b.allocated * 0.2 ? 'text-red-600' : 'text-emerald-600')}>
                        ${b.remaining.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(b.spent / b.allocated) * 100} className={cn('h-2 w-20', b.spent / b.allocated > 0.85 ? '[&>div]:bg-red-500' : b.spent / b.allocated > 0.6 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')} />
                          <span className="text-xs font-medium">{Math.round(b.spent / b.allocated * 100)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </SectionCard>
        </TabsContent>

        {/* ─── Requisitions Tab ─────────────────────────────────────────────── */}
        <TabsContent value="requisitions" className="space-y-4">
          <ModuleToolbar
            search={searchReq}
            onSearch={setSearchReq}
            searchPlaceholder="Search requisitions..."
            filters={
              <Select value={reqStatusFilter} onValueChange={setReqStatusFilter}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
            }
          />

          {filteredRequisitions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
              <KitEmptyState
                icon={FileText}
                title="No requisitions found"
                description="No requisitions match the selected filters."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequisitions.map(req => (
                <Card key={req.id} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                          req.status === 'Pending' ? 'bg-amber-50' :
                          req.status === 'Approved' ? 'bg-emerald-50' :
                          req.status === 'Fulfilled' ? 'bg-teal-50' : 'bg-red-50'
                        )}>
                          {statusIcon(req.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{req.reqNumber}</p>
                            <Badge variant={statusBadgeVariant(req.status)} className="text-[10px]">{req.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.requestedBy} &middot; {req.department} &middot; {req.requestDate}
                          </p>
                          <p className="text-sm mt-1">{req.justification}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-lg font-bold">${req.totalEstimate.toFixed(2)}</p>
                        {req.status === 'Pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => updateReqStatus(req.id, 'Approved', 'Approved by Admin')}>
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => updateReqStatus(req.id, 'Rejected', 'Rejected - insufficient budget')}>
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        )}
                        {req.status === 'Approved' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateReqStatus(req.id, 'Fulfilled')}>
                            <Package className="h-3 w-3" /> Mark Fulfilled
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    {req.items && req.items.length > 0 && (
                      <div className="mt-3 pl-13">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {req.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                              <span>{item.name} x{item.qty}</span>
                              <span className="font-medium">${(item.estimatedCost * item.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {req.comments && (
                      <div className="mt-2 pl-13">
                        <p className="text-xs text-muted-foreground italic">&quot;{req.comments}&quot;</p>
                        {req.approvedBy && <p className="text-xs text-muted-foreground">By {req.approvedBy} on {req.approvedDate}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
