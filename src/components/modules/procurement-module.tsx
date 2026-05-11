'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

// ─── Mock Data ────────────────────────────────────────────────────────────────

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

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1', poNumber: 'PO-2026-001', vendor: 'National Foods', description: 'Mealie meal and rice supply',
    items: [{ name: 'Mealie Meal 10kg', qty: 50, unitCost: 8.50 }, { name: 'Rice 5kg', qty: 30, unitCost: 5.00 }],
    totalAmount: 575.00, status: 'Received', requestedBy: 'Mrs. Chikumba', requestedDate: '2026-02-15', approvedBy: 'Mr. Zvambe', approvedDate: '2026-02-16',
  },
  {
    id: '2', poNumber: 'PO-2026-002', vendor: "Irvine's Poultry", description: 'Chicken and eggs supply',
    items: [{ name: 'Chicken Portions (kg)', qty: 100, unitCost: 4.50 }, { name: 'Eggs (tray of 30)', qty: 40, unitCost: 4.00 }],
    totalAmount: 610.00, status: 'Approved', requestedBy: 'Mrs. Chikumba', requestedDate: '2026-02-20', approvedBy: 'Mr. Zvambe', approvedDate: '2026-02-21',
  },
  {
    id: '3', poNumber: 'PO-2026-003', vendor: 'Olivine Industries', description: 'Cooking oil and margarine',
    items: [{ name: 'Cooking Oil 2L', qty: 40, unitCost: 3.50 }, { name: 'Margarine 500g', qty: 30, unitCost: 2.50 }],
    totalAmount: 215.00, status: 'Pending', requestedBy: 'Mr. Hove', requestedDate: '2026-02-25',
  },
  {
    id: '4', poNumber: 'PO-2026-004', vendor: 'Delta Corp', description: 'Beverages supply',
    items: [{ name: 'Mazoe Concentrate 2L', qty: 60, unitCost: 4.50 }, { name: 'Maheu (case)', qty: 20, unitCost: 6.00 }],
    totalAmount: 390.00, status: 'Draft', requestedBy: 'Mrs. Chikumba', requestedDate: '2026-03-01',
  },
  {
    id: '5', poNumber: 'PO-2026-005', vendor: "Baker's Inn", description: 'Bread and buns supply',
    items: [{ name: 'Bread Loaves', qty: 200, unitCost: 0.90 }, { name: 'Buns (dozen)', qty: 50, unitCost: 2.50 }],
    totalAmount: 305.00, status: 'Received', requestedBy: 'Mrs. Chikumba', requestedDate: '2026-02-10', approvedBy: 'Mr. Zvambe', approvedDate: '2026-02-11',
  },
  {
    id: '6', poNumber: 'PO-2026-006', vendor: 'Mbare Musika', description: 'Fresh vegetables',
    items: [{ name: 'Vegetables (bundle)', qty: 100, unitCost: 0.50 }, { name: 'Potatoes (pocket)', qty: 30, unitCost: 3.00 }],
    totalAmount: 140.00, status: 'Approved', requestedBy: 'Mr. Hove', requestedDate: '2026-02-28', approvedBy: 'Mrs. Dube', approvedDate: '2026-02-28',
  },
  {
    id: '7', poNumber: 'PO-2026-007', vendor: 'Cold Storage', description: 'Beef supply',
    items: [{ name: 'Beef Stewing (kg)', qty: 80, unitCost: 6.00 }],
    totalAmount: 480.00, status: 'Cancelled', requestedBy: 'Mrs. Chikumba', requestedDate: '2026-02-18',
  },
  {
    id: '8', poNumber: 'PO-2026-008', vendor: 'Java Coffee', description: 'Coffee and tea supply',
    items: [{ name: 'Coffee 200g', qty: 20, unitCost: 3.50 }, { name: 'Tea Bags 100pk', qty: 15, unitCost: 3.00 }],
    totalAmount: 117.50, status: 'Pending', requestedBy: 'Mr. Hove', requestedDate: '2026-02-27',
  },
]

const initialVendors: Vendor[] = [
  { id: '1', name: 'National Foods', category: 'Grains & Cereals', contactPerson: 'James Mutasa', phone: '+263 4 665 800', email: 'orders@nationalfoods.co.zw', address: '10 Birmingham Rd, Harare', rating: 4.5, totalOrders: 12, status: 'Active' },
  { id: '2', name: "Irvine's Poultry", category: 'Poultry & Eggs', contactPerson: 'Sarah Chikuni', phone: '+263 4 575 251', email: 'supply@irvines.co.zw', address: '5 Mutare Rd, Harare', rating: 4.0, totalOrders: 8, status: 'Active' },
  { id: '3', name: 'Olivine Industries', category: 'Cooking Supplies', contactPerson: 'Peter Gondo', phone: '+263 4 662 041', email: 'orders@olivine.co.zw', address: '15 Hillside Rd, Harare', rating: 4.2, totalOrders: 10, status: 'Active' },
  { id: '4', name: 'Delta Corp', category: 'Beverages', contactPerson: 'Grace Mlambo', phone: '+263 4 770 601', email: 'supply@deltacorp.co.zw', address: '55 Kenneth Kaunda Ave, Harare', rating: 3.8, totalOrders: 6, status: 'Active' },
  { id: '5', name: "Baker's Inn", category: 'Bakery Products', contactPerson: 'Thomas Ncube', phone: '+263 4 730 671', email: 'orders@bakersinn.co.zw', address: '30 Coventry Rd, Harare', rating: 4.7, totalOrders: 15, status: 'Active' },
  { id: '6', name: 'Mbare Musika', category: 'Fresh Produce', contactPerson: 'Agnes Moyo', phone: '+263 772 123 456', email: 'mbare@market.co.zw', address: 'Mbare, Harare', rating: 3.5, totalOrders: 20, status: 'Active' },
  { id: '7', name: 'Cold Storage', category: 'Meat Products', contactPerson: 'David Banda', phone: '+263 4 666 111', email: 'orders@coldstorage.co.zw', address: '20 Seke Rd, Harare', rating: 3.9, totalOrders: 4, status: 'Active' },
  { id: '8', name: 'Java Coffee', category: 'Beverages', contactPerson: 'Lucy Chapungu', phone: '+263 4 300 522', email: 'supply@javacoffee.co.zw', address: '12 Leopold Takawira Ave, Harare', rating: 4.3, totalOrders: 5, status: 'Active' },
  { id: '9', name: 'Tanganda Tea', category: 'Beverages', contactPerson: 'Martin Juru', phone: '+263 4 776 181', email: 'orders@tanganda.co.zw', address: '8 Samora Machel Ave, Harare', rating: 4.1, totalOrders: 3, status: 'Inactive' },
  { id: '10', name: 'Lake Harvest', category: 'Fish Products', contactPerson: 'Ngoni Munyuki', phone: '+263 64 22273', email: 'supply@lakeharvest.co.zw', address: 'Kariba', rating: 4.0, totalOrders: 7, status: 'Active' },
]

const initialRequisitions: Requisition[] = [
  {
    id: '1', reqNumber: 'REQ-2026-001', requestedBy: 'Mrs. Chikumba', department: 'Canteen',
    items: [{ name: 'Mealie Meal 10kg', qty: 50, estimatedCost: 8.50 }, { name: 'Rice 5kg', qty: 30, estimatedCost: 5.00 }],
    totalEstimate: 575.00, justification: 'Monthly grain supply for canteen operations', status: 'Fulfilled',
    requestDate: '2026-02-10', approvedBy: 'Mr. Zvambe', approvedDate: '2026-02-11', comments: 'Approved for immediate supply',
  },
  {
    id: '2', reqNumber: 'REQ-2026-002', requestedBy: 'Mr. Hove', department: 'Administration',
    items: [{ name: 'A4 Paper (ream)', qty: 20, estimatedCost: 5.00 }, { name: 'Printer Cartridges', qty: 5, estimatedCost: 25.00 }],
    totalEstimate: 225.00, justification: 'Office supplies for Term 1 operations', status: 'Approved',
    requestDate: '2026-02-25', approvedBy: 'Mrs. Dube', approvedDate: '2026-02-26',
  },
  {
    id: '3', reqNumber: 'REQ-2026-003', requestedBy: 'Mrs. Chikumba', department: 'Canteen',
    items: [{ name: 'Cooking Oil 2L', qty: 40, estimatedCost: 3.50 }],
    totalEstimate: 140.00, justification: 'Running low on cooking oil, need urgent restock', status: 'Pending',
    requestDate: '2026-02-28',
  },
  {
    id: '4', reqNumber: 'REQ-2026-004', requestedBy: 'Mr. Hove', department: 'Maintenance',
    items: [{ name: 'Paint (20L)', qty: 5, estimatedCost: 35.00 }, { name: 'Paint Brushes', qty: 10, estimatedCost: 3.00 }],
    totalEstimate: 205.00, justification: 'Classroom repainting for Block B', status: 'Rejected',
    requestDate: '2026-02-20', approvedBy: 'Mr. Zvambe', approvedDate: '2026-02-21', comments: 'Budget reallocated to textbooks. Resubmit in Term 2.',
  },
  {
    id: '5', reqNumber: 'REQ-2026-005', requestedBy: 'Mrs. Chikumba', department: 'Canteen',
    items: [{ name: 'Mazoe Concentrate 2L', qty: 60, estimatedCost: 4.50 }, { name: 'Maheu (case)', qty: 20, estimatedCost: 6.00 }],
    totalEstimate: 390.00, justification: 'Beverage supply for March', status: 'Pending',
    requestDate: '2026-03-01',
  },
  {
    id: '6', reqNumber: 'REQ-2026-006', requestedBy: 'Mrs. Dube', department: 'Academics',
    items: [{ name: 'Exercise Books (pack of 50)', qty: 30, estimatedCost: 15.00 }, { name: 'Pens (box of 50)', qty: 20, estimatedCost: 8.00 }],
    totalEstimate: 610.00, justification: 'Stationery supplies for examination period', status: 'Pending',
    requestDate: '2026-03-01',
  },
]

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
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders)
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors)
  const [requisitions, setRequisitions] = useState<Requisition[]>(initialRequisitions)
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

  // Computed stats
  const totalPOs = purchaseOrders.length
  const pendingApprovals = purchaseOrders.filter(p => p.status === 'Pending').length
  const totalBudget = budgetData.reduce((s, b) => s + b.allocated, 0)
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0)
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
  const handleCreatePO = () => {
    if (!newPOVendor || newPOItems.length === 0) return
    const totalAmount = newPOItems.reduce((s, i) => s + i.qty * i.unitCost, 0)
    const newPO: PurchaseOrder = {
      id: String(purchaseOrders.length + 1),
      poNumber: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      vendor: newPOVendor,
      description: newPODescription,
      items: newPOItems,
      totalAmount,
      status: 'Draft',
      requestedBy: 'Admin User',
      requestedDate: new Date().toISOString().split('T')[0],
    }
    setPurchaseOrders(prev => [...prev, newPO])
    setNewPOVendor('')
    setNewPODescription('')
    setNewPOItems([])
    setAddPOOpen(false)
  }

  // Create new Vendor
  const handleAddVendor = () => {
    if (!newVendorName || !newVendorContact) return
    const newVendor: Vendor = {
      id: String(vendors.length + 1),
      name: newVendorName,
      category: newVendorCategory,
      contactPerson: newVendorContact,
      phone: newVendorPhone,
      email: newVendorEmail,
      address: newVendorAddress,
      rating: 0,
      totalOrders: 0,
      status: 'Active',
    }
    setVendors(prev => [...prev, newVendor])
    setNewVendorName('')
    setNewVendorCategory('Grains & Cereals')
    setNewVendorContact('')
    setNewVendorPhone('')
    setNewVendorEmail('')
    setNewVendorAddress('')
    setAddVendorOpen(false)
  }

  // PO Status actions
  const updatePOStatus = (id: string, status: PurchaseOrder['status']) => {
    setPurchaseOrders(prev => prev.map(po =>
      po.id === id ? { ...po, status, approvedBy: status === 'Approved' ? 'Admin User' : po.approvedBy, approvedDate: status === 'Approved' ? new Date().toISOString().split('T')[0] : po.approvedDate } : po
    ))
  }

  // Requisition status actions
  const updateReqStatus = (id: string, status: Requisition['status'], comments?: string) => {
    setRequisitions(prev => prev.map(r =>
      r.id === id ? { ...r, status, approvedBy: status === 'Approved' || status === 'Rejected' ? 'Admin User' : r.approvedBy, approvedDate: status === 'Approved' || status === 'Rejected' ? new Date().toISOString().split('T')[0] : r.approvedDate, comments: comments || r.comments } : r
    ))
  }

  const deleteVendor = (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id))
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
            <ShoppingCart className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Procurement</h2>
            <p className="text-sm text-muted-foreground">Manage purchase orders, vendors, and budgets</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purchase Orders</p>
                    <p className="text-2xl font-bold">{totalPOs}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+3 this month</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Approvals</p>
                    <p className="text-2xl font-bold">{pendingApprovals}</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Awaiting action</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Budget Utilization</p>
                    <p className="text-2xl font-bold">{budgetUtilization}%</p>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <DollarSign className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Vendors</p>
                    <p className="text-2xl font-bold">{activeVendorCount}</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-cyan-600" />
                      <span className="text-xs font-medium text-cyan-600">{vendors.length} total</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                    <Users className="h-5 w-5 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent POs + Pending Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Recent Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>
          </div>

          {/* Budget Overview */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Budget Utilization by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {budgetData.map(b => (
                <div key={b.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{b.category}</span>
                    <span className="text-xs text-muted-foreground">${b.spent.toLocaleString()} / ${b.allocated.toLocaleString()} ({Math.round(b.spent / b.allocated * 100)}%)</span>
                  </div>
                  <Progress value={(b.spent / b.allocated) * 100} className={cn('h-2', b.spent / b.allocated > 0.85 ? '[&>div]:bg-red-500' : b.spent / b.allocated > 0.6 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Purchase Orders Tab ──────────────────────────────────────────── */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search purchase orders..."
                  className="pl-9 h-9"
                  value={searchPO}
                  onChange={e => setSearchPO(e.target.value)}
                />
              </div>
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
            </div>
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
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreatePO} disabled={!newPOVendor || newPOItems.length === 0}>Create PO</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Vendors Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="vendors" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                className="pl-9 h-9"
                value={searchVendor}
                onChange={e => setSearchVendor(e.target.value)}
              />
            </div>
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
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddVendor}>Add Vendor</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
        </TabsContent>

        {/* ─── Budget Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="budget" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Budget</p>
                <p className="text-2xl font-bold mt-1">${totalBudget.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">For current fiscal year</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spent</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">${totalSpent.toLocaleString()}</p>
                <p className="text-xs text-amber-600 mt-1">{budgetUtilization}% utilized</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remaining</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">${(totalBudget - totalSpent).toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-1">{100 - budgetUtilization}% available</p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Budget Allocation vs Spending</CardTitle>
              <CardDescription>By category (USD)</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Detailed Budget Table */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Budget Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Requisitions Tab ─────────────────────────────────────────────── */}
        <TabsContent value="requisitions" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search requisitions..."
                  className="pl-9 h-9"
                  value={searchReq}
                  onChange={e => setSearchReq(e.target.value)}
                />
              </div>
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
            </div>
          </div>

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
        </TabsContent>
      </Tabs>
    </div>
  )
}
