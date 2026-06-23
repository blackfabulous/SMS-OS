'use client'

import {
  ModulePageLayout,
  ModuleSettingsButton,
  ModuleContainer,
  StatGrid,
  ModuleStatCard,
  SectionCard,
  TableShell,
} from '@/components/module-ui';
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coffee,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Trash2,
  Minus,
  X,
  Printer,
  CreditCard,
  Banknote,
  Wallet,
  Package,
  BarChart3,
  Clock,
  CheckCircle2,
  Star,
  Utensils,
  ArrowLeft,
  Settings,
  Save,
  Bell,
  Eye,
  Loader2,
  Receipt,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add-item' | 'edit-item' | 'add-stock' | 'item-detail' | 'settings'

interface CanteenItem {
  id: string
  name: string
  category: string
  price: number
  costPrice?: number
  stockQuantity: number
  reorderLevel: number
  isActive: boolean
  image?: string
}

interface CanteenTransaction {
  id: string
  transactionNumber: string
  buyerType: string
  buyerName: string
  totalAmount: number
  paymentMethod: string
  status: string
  createdAt: string
  items: Array<{
    id: string
    itemId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    item: { id: string; name: string; category: string }
  }>
}

interface CartItem {
  id: string
  name: string
  category: string
  price: number
  stockQuantity: number
  quantity: number
}

interface CanteenStats {
  totalItems: number
  lowStockItems: number
  todayRevenue: number
  todayTransactions: number
  categoryBreakdown: Array<{ category: string; count: number }>
}

// ─── Chart Config ─────────────────────────────────────────────────────────

const salesChartConfig = {
  sales: { label: 'Sales (USD)', color: '#10b981' },
  items: { label: 'Items Sold', color: '#f59e0b' },
} satisfies ChartConfig

const categoryChartConfig = {
  count: { label: 'Items', color: '#10b981' },
} satisfies ChartConfig

// ─── Component ────────────────────────────────────────────────────────────

export default function CanteenModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)


  // Data from API
  const [menuItems, setMenuItems] = useState<CanteenItem[]>([])
  const [transactions, setTransactions] = useState<CanteenTransaction[]>([])
  const [stats, setStats] = useState<CanteenStats | null>(null)
  const [selectedItem, setSelectedItem] = useState<CanteenItem | null>(null)

  // Search & filters
  const [searchMenu, setSearchMenu] = useState('')
  const [searchStock, setSearchStock] = useState('')
  const [posSearch, setPosSearch] = useState('')
  const [posCategory, setPosCategory] = useState('All')

  // POS state
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerType, setCustomerType] = useState<'Student' | 'Staff'>('Student')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'ziG' | 'Card'>('Cash')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<CanteenTransaction | null>(null)

  // Add Item form
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Hot Meals',
    price: '',
    costPrice: '',
    stockQuantity: '',
    reorderLevel: '5',
    description: '',
  })

  // Settings
  const [settings, setSettings] = useState({
    defaultCategory: 'Hot Meals',
    priceDisplayTax: false,
    lowStockThreshold: '5',
    receiptFormat: 'Detailed',
    cashEnabled: true,
    zigEnabled: true,
    cardEnabled: false,
    emailReceipt: false,
    autoDeductStock: true,
    showCostPrice: false,
  })

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/canteen')
      if (res.ok) {
        const d = await res.json()
        setMenuItems(d.data || [])
        setStats(d.stats || null)
      }
    } catch (err) {
      console.error('Failed to fetch canteen items:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/canteen?type=sales&limit=50')
      if (res.ok) {
        const d = await res.json()
        setTransactions(d.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    }
  }, [])

  useEffect(() => {
    fetchMenuItems()
    fetchTransactions()
  }, [fetchMenuItems, fetchTransactions])

  // ─── Computed values ───────────────────────────────────────────────────

  const lowStockItems = menuItems.filter(i => i.stockQuantity <= i.reorderLevel)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category)))]

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
    item.category.toLowerCase().includes(searchMenu.toLowerCase())
  )

  const posFilteredItems = menuItems.filter(item =>
    item.isActive &&
    item.stockQuantity > 0 &&
    (posCategory === 'All' || item.category === posCategory) &&
    (item.name.toLowerCase().includes(posSearch.toLowerCase()) ||
     item.category.toLowerCase().includes(posSearch.toLowerCase()))
  )

  const categoryChartData = stats?.categoryBreakdown?.map((c, i) => ({
    name: c.category,
    value: c.count,
    fill: ['#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6'][i % 5],
  })) || []

  // ─── Cart operations ───────────────────────────────────────────────────

  const addToCart = (item: CanteenItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        if (existing.quantity >= item.stockQuantity) return prev
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { id: item.id, name: item.name, category: item.category, price: item.price, stockQuantity: item.stockQuantity, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.id !== itemId))
  }

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id === itemId) {
        const newQty = c.quantity + delta
        const maxQty = menuItems.find(m => m.id === itemId)?.stockQuantity ?? 0
        if (newQty <= 0) return c
        if (newQty > maxQty) return c
        return { ...c, quantity: newQty }
      }
      return c
    }))
  }

  const processPayment = async () => {
    if (cart.length === 0) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/canteen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transaction',
          buyerType: customerType === 'Student' ? 'STUDENT' : 'STAFF',
          buyerName: customerName || 'Walk-in',
          paymentMethod: paymentMethod === 'Cash' ? 'CASH' : paymentMethod === 'ziG' ? 'ZIG' : 'CARD',
          items: cart.map(c => ({ itemId: c.id, quantity: c.quantity, unitPrice: c.price })),
        }),
      })
      if (res.ok) {
        const tx = await res.json()
        setLastReceipt(tx)
        setShowReceipt(true)
        toast.success('Payment processed successfully')
        setCart([])
        setCustomerName('')
        fetchMenuItems()
        fetchTransactions()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to process payment')
      }
    } catch {
      toast.error('Failed to process payment')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Item CRUD ─────────────────────────────────────────────────────────

  const handleAddItem = async () => {
    if (!itemForm.name || !itemForm.price) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/canteen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addItem',
          name: itemForm.name,
          category: itemForm.category.toUpperCase().replace(/\s+/g, '_'),
          price: parseFloat(itemForm.price),
          costPrice: parseFloat(itemForm.costPrice) || 0,
          stockQuantity: parseInt(itemForm.stockQuantity) || 0,
          reorderLevel: parseInt(itemForm.reorderLevel) || 5,
        }),
      })
      if (res.ok) {
        toast.success('Item added successfully')
        setItemForm({ name: '', category: 'Hot Meals', price: '', costPrice: '', stockQuantity: '', reorderLevel: '5', description: '' })
        setViewMode('list')
        fetchMenuItems()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add item')
      }
    } catch {
      toast.error('Failed to add item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/canteen?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Item deleted')
        fetchMenuItems()
      }
    } catch {
      toast.error('Failed to delete item')
    }
  }

  const handleSaveSettings = () => {
    toast.success('Canteen settings have been updated')
  }

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
      </div>
    )
  }

  // ─── Inline Views ──────────────────────────────────────────────────────

  const AddItemInlineForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-lg font-semibold">Add Menu Item</h2>
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid gap-6 max-w-2xl">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Item Name *</Label>
              <Input placeholder="e.g. Sadza & Chicken" value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hot Meals">Hot Meals</SelectItem>
                    <SelectItem value="Snacks">Snacks</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Price (USD) *</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Cost Price (USD)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={itemForm.costPrice} onChange={e => setItemForm(p => ({ ...p, costPrice: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Initial Stock</Label>
                <Input type="number" placeholder="0" value={itemForm.stockQuantity} onChange={e => setItemForm(p => ({ ...p, stockQuantity: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Reorder Level</Label>
                <Input type="number" placeholder="5" value={itemForm.reorderLevel} onChange={e => setItemForm(p => ({ ...p, reorderLevel: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Description (optional)</Label>
              <Textarea placeholder="Brief description..." rows={3} value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleAddItem} disabled={submitting || !itemForm.name || !itemForm.price} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const ItemDetailView = () => {
    if (!selectedItem) return null
    const isLow = selectedItem.stockQuantity <= selectedItem.reorderLevel
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedItem(null) }} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-lg font-semibold">Item Details</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn('flex h-16 w-16 items-center justify-center rounded-xl shrink-0',
                    selectedItem.category === 'HOT_MEALS' || selectedItem.category === 'Hot Meals' ? 'bg-orange-50' :
                    selectedItem.category === 'SNACKS' || selectedItem.category === 'Snacks' ? 'bg-amber-50' : 'bg-cyan-50'
                  )}>
                    <Utensils className={cn('h-8 w-8',
                      selectedItem.category === 'HOT_MEALS' || selectedItem.category === 'Hot Meals' ? 'text-orange-600' :
                      selectedItem.category === 'SNACKS' || selectedItem.category === 'Snacks' ? 'text-amber-600' : 'text-cyan-600'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">{selectedItem.category.replace(/_/g, ' ')}</Badge>
                      <Badge className={cn('text-xs border', isLow ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </Badge>
                      {!selectedItem.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Item Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Selling Price</p><p className="text-sm font-semibold">${selectedItem.price.toFixed(2)}</p></div>
                  {settings.showCostPrice && selectedItem.costPrice != null && <div><p className="text-xs text-muted-foreground">Cost Price</p><p className="text-sm font-semibold">${selectedItem.costPrice.toFixed(2)}</p></div>}
                  <div><p className="text-xs text-muted-foreground">Stock Quantity</p><p className="text-sm font-semibold">{selectedItem.stockQuantity}</p></div>
                  <div><p className="text-xs text-muted-foreground">Reorder Level</p><p className="text-sm font-semibold">{selectedItem.reorderLevel}</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => {
                  setItemForm({ name: selectedItem.name, category: selectedItem.category.replace(/_/g, ' '), price: String(selectedItem.price), costPrice: String(selectedItem.costPrice || ''), stockQuantity: String(selectedItem.stockQuantity), reorderLevel: String(selectedItem.reorderLevel), description: '' })
                  setViewMode('edit-item')
                }}>
                  <Edit className="h-4 w-4" /> Edit Item
                </Button>
                <Button className="w-full justify-start gap-2 text-red-600 hover:text-red-700" variant="outline" onClick={() => handleDeleteItem(selectedItem.id)}>
                  <Trash2 className="h-4 w-4" /> Delete Item
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Stock Level</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', isLow ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: `${Math.min((selectedItem.stockQuantity / Math.max(selectedItem.reorderLevel * 4, 1)) * 100, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{selectedItem.stockQuantity} in stock</span>
                    <span className="text-muted-foreground">Reorder at {selectedItem.reorderLevel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    )
  }

  const CanteenSettingsView = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-lg font-semibold">Canteen Settings</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Eye className="h-4 w-4 text-emerald-600" /> Display Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Default Category</Label>
              <Select value={settings.defaultCategory} onValueChange={v => setSettings(p => ({ ...p, defaultCategory: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hot Meals">Hot Meals</SelectItem>
                  <SelectItem value="Snacks">Snacks</SelectItem>
                  <SelectItem value="Beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Cost Price</Label>
              <Switch checked={settings.showCostPrice} onCheckedChange={v => setSettings(p => ({ ...p, showCostPrice: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Price Includes Tax</Label>
              <Switch checked={settings.priceDisplayTax} onCheckedChange={v => setSettings(p => ({ ...p, priceDisplayTax: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Low Stock Alert Threshold</Label>
              <Input type="number" min="1" value={settings.lowStockThreshold} onChange={e => setSettings(p => ({ ...p, lowStockThreshold: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Auto-Deduct Stock</Label>
                <p className="text-xs text-muted-foreground">Reduce stock on sale</p>
              </div>
              <Switch checked={settings.autoDeductStock} onCheckedChange={v => setSettings(p => ({ ...p, autoDeductStock: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-teal-600" /> Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-600" /> <Label className="text-sm">Cash</Label></div>
              <Switch checked={settings.cashEnabled} onCheckedChange={v => setSettings(p => ({ ...p, cashEnabled: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-amber-600" /> <Label className="text-sm">ZiG (Zimbabwe Gold)</Label></div>
              <Switch checked={settings.zigEnabled} onCheckedChange={v => setSettings(p => ({ ...p, zigEnabled: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-cyan-600" /> <Label className="text-sm">Card / EcoCash</Label></div>
              <Switch checked={settings.cardEnabled} onCheckedChange={v => setSettings(p => ({ ...p, cardEnabled: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4 text-purple-600" /> Receipt Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Receipt Format</Label>
              <Select value={settings.receiptFormat} onValueChange={v => setSettings(p => ({ ...p, receiptFormat: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Detailed">Detailed</SelectItem>
                  <SelectItem value="Simple">Simple</SelectItem>
                  <SelectItem value="Compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Email Receipt</Label>
              <Switch checked={settings.emailReceipt} onCheckedChange={v => setSettings(p => ({ ...p, emailReceipt: v }))} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSaveSettings} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
      </div>
    </motion.div>
  )

  // ─── Main Render ───────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AnimatePresence mode="wait">
        {viewMode === 'add-item' && <AddItemInlineForm key="add-item" />}
        {viewMode === 'edit-item' && (
          <motion.div key="edit-item" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h2 className="text-lg font-semibold">Edit Menu Item</h2>
            </div>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="grid gap-6 max-w-2xl">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Item Name *</Label>
                    <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Category</Label>
                      <Select value={itemForm.category} onValueChange={v => setItemForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hot Meals">Hot Meals</SelectItem>
                          <SelectItem value="Snacks">Snacks</SelectItem>
                          <SelectItem value="Beverages">Beverages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Price (USD) *</Label>
                      <Input type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Stock Quantity</Label>
                      <Input type="number" value={itemForm.stockQuantity} onChange={e => setItemForm(p => ({ ...p, stockQuantity: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Reorder Level</Label>
                      <Input type="number" value={itemForm.reorderLevel} onChange={e => setItemForm(p => ({ ...p, reorderLevel: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button onClick={async () => {
                      if (!selectedItem || !itemForm.name || !itemForm.price) return
                      setSubmitting(true)
                      try {
                        const res = await fetch('/api/canteen', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: selectedItem.id,
                            name: itemForm.name,
                            category: itemForm.category.toUpperCase().replace(/\s+/g, '_'),
                            price: parseFloat(itemForm.price),
                            costPrice: parseFloat(itemForm.costPrice) || 0,
                            stockQuantity: parseInt(itemForm.stockQuantity) || 0,
                            reorderLevel: parseInt(itemForm.reorderLevel) || 5,
                          }),
                        })
                        if (res.ok) {
                          toast.success('Item updated successfully')
                          setViewMode('list')
                          fetchMenuItems()
                        }
                      } catch { toast.error('Failed to update item') }
                      finally { setSubmitting(false) }
                    }} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {viewMode === 'item-detail' && <ItemDetailView key="item-detail" />}
        {viewMode === 'settings' && <CanteenSettingsView key="settings" />}
      </AnimatePresence>

      {viewMode === 'list' && (
        <ModuleContainer>
<ModulePageLayout
        actions={<>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
            setItemForm({ name: '', category: settings.defaultCategory, price: '', costPrice: '', stockQuantity: '', reorderLevel: settings.lowStockThreshold, description: '' })
            setViewMode('add-item')
          }}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
            <TabsTrigger value="pos">Point of Sale</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="reports">Sales</TabsTrigger>
          </>}
      >


            {/* ─── Overview Tab ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-4">
              <StatGrid cols={4}>
                <ModuleStatCard
                  icon={DollarSign}
                  label="Today's Sales"
                  value={`$${(stats?.todayRevenue || 0).toFixed(2)}`}
                  hint={`${stats?.todayTransactions || 0} transactions`}
                  accentGradient="from-emerald-400 to-teal-500"
                  bgColor="bg-emerald-50 dark:bg-emerald-950/40"
                  iconColor="text-emerald-600"
                  index={0}
                />
                <ModuleStatCard
                  icon={ShoppingCart}
                  label="Menu Items"
                  value={stats?.totalItems || 0}
                  hint="Active items"
                  accentGradient="from-teal-400 to-cyan-500"
                  bgColor="bg-teal-50 dark:bg-teal-950/40"
                  iconColor="text-teal-600"
                  index={1}
                />
                <ModuleStatCard
                  icon={AlertTriangle}
                  label="Low Stock"
                  value={stats?.lowStockItems || 0}
                  hint="Needs attention"
                  accentGradient="from-amber-400 to-orange-500"
                  bgColor="bg-amber-50 dark:bg-amber-950/40"
                  iconColor="text-amber-600"
                  index={2}
                />
                <ModuleStatCard
                  icon={BarChart3}
                  label="Categories"
                  value={stats?.categoryBreakdown?.length || 0}
                  hint="Item groups"
                  accentGradient="from-cyan-400 to-blue-500"
                  bgColor="bg-cyan-50 dark:bg-cyan-950/40"
                  iconColor="text-cyan-600"
                  index={3}
                />
              </StatGrid>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectionCard title="Low Stock Items" icon={Star} contentClassName="space-y-2 max-h-64 overflow-y-auto">
                  {lowStockItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">All stock levels are healthy</p>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.stockQuantity === 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                            {item.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.stockQuantity}/{item.reorderLevel}</span>
                      </div>
                    ))
                  )}
                </SectionCard>

                <SectionCard title="Items by Category" description="Distribution across categories">
                  {categoryChartData.length > 0 ? (
                    <ChartContainer config={categoryChartConfig} className="h-[220px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data available</div>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="Recent Transactions" noPadding>
                <TableShell maxHeight="16rem">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 10).map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.transactionNumber}</TableCell>
                          <TableCell className="text-sm">{tx.buyerName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{tx.paymentMethod}</Badge></TableCell>
                          <TableCell className="text-sm font-semibold">${tx.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-4">No transactions yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableShell>
              </SectionCard>
            </TabsContent>

            {/* ─── Menu Items Tab ───────────────────────────────────────────── */}
            <TabsContent value="menu" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search menu items..." className="pl-9 h-9" value={searchMenu} onChange={e => setSearchMenu(e.target.value)} />
                </div>
              </div>
              <SectionCard noPadding>
                <TableShell>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price (USD)</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMenuItems.map(item => (
                        <TableRow key={item.id} className="cursor-pointer" onClick={() => { setSelectedItem(item); setViewMode('item-detail') }}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{item.category.replace(/_/g, ' ')}</Badge></TableCell>
                          <TableCell>${item.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div className={cn('h-2 rounded-full transition-all', item.stockQuantity > item.reorderLevel * 2 ? 'bg-emerald-500' : item.stockQuantity > item.reorderLevel ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.max((item.stockQuantity / Math.max(item.reorderLevel * 4, 1)) * 100, 2)}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{item.stockQuantity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.stockQuantity === 0 ? 'destructive' : item.stockQuantity <= item.reorderLevel ? 'secondary' : 'default'} className="text-[10px]">
                              {item.stockQuantity === 0 ? 'Out of Stock' : item.stockQuantity <= item.reorderLevel ? 'Low Stock' : 'Available'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedItem(item); setViewMode('item-detail') }}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setItemForm({ name: item.name, category: item.category.replace(/_/g, ' '), price: String(item.price), costPrice: String(item.costPrice || ''), stockQuantity: String(item.stockQuantity), reorderLevel: String(item.reorderLevel), description: '' })
                                setSelectedItem(item)
                                setViewMode('edit-item')
                              }}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredMenuItems.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No items found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableShell>
              </SectionCard>
            </TabsContent>

            {/* ─── Point of Sale Tab ────────────────────────────────────────── */}
            <TabsContent value="pos" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search items..." className="pl-9 h-9" value={posSearch} onChange={e => setPosSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {categories.map(cat => (
                        <Button key={cat} variant={posCategory === cat ? 'default' : 'outline'} size="sm" className={cn('h-9 text-xs', posCategory === cat && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setPosCategory(cat)}>{cat}</Button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {posFilteredItems.map(item => (
                      <motion.button key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-background hover:shadow-md transition-shadow text-center" onClick={() => addToCart(item)}>
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg',
                          item.category === 'HOT_MEALS' || item.category === 'Hot Meals' ? 'bg-orange-50' :
                          item.category === 'SNACKS' || item.category === 'Snacks' ? 'bg-amber-50' : 'bg-cyan-50'
                        )}>
                          <Utensils className={cn('h-5 w-5',
                            item.category === 'HOT_MEALS' || item.category === 'Hot Meals' ? 'text-orange-600' :
                            item.category === 'SNACKS' || item.category === 'Snacks' ? 'text-amber-600' : 'text-cyan-600'
                          )} />
                        </div>
                        <span className="text-xs font-medium line-clamp-2">{item.name}</span>
                        <span className="text-sm font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                        {item.stockQuantity <= item.reorderLevel && <Badge variant="secondary" className="text-[9px]">Low Stock</Badge>}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <SectionCard
                    title="Cart"
                    icon={ShoppingCart}
                    actions={cart.length > 0 ? <Badge>{cart.length}</Badge> : undefined}
                    contentClassName="space-y-3"
                  >
                      {cart.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Cart is empty</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {cart.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeFromCart(item.id)}><X className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {cart.length > 0 && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total</span>
                            <span className="text-xl font-bold text-emerald-600">${cartTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                  </SectionCard>

                  <SectionCard title="Payment" contentClassName="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Customer Name</Label>
                        <Input placeholder="Student/Staff name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Customer Type</Label>
                        <Select value={customerType} onValueChange={v => setCustomerType(v as 'Student' | 'Staff')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Payment Method</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {settings.cashEnabled && (
                            <Button variant={paymentMethod === 'Cash' ? 'default' : 'outline'} size="sm" className={cn('h-9 text-xs gap-1', paymentMethod === 'Cash' && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setPaymentMethod('Cash')}>
                              <Banknote className="h-3.5 w-3.5" /> Cash
                            </Button>
                          )}
                          {settings.zigEnabled && (
                            <Button variant={paymentMethod === 'ziG' ? 'default' : 'outline'} size="sm" className={cn('h-9 text-xs gap-1', paymentMethod === 'ziG' && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setPaymentMethod('ziG')}>
                              <Wallet className="h-3.5 w-3.5" /> ZiG
                            </Button>
                          )}
                          {settings.cardEnabled && (
                            <Button variant={paymentMethod === 'Card' ? 'default' : 'outline'} size="sm" className={cn('h-9 text-xs gap-1', paymentMethod === 'Card' && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setPaymentMethod('Card')}>
                              <CreditCard className="h-3.5 w-3.5" /> Card
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={cart.length === 0 || submitting} onClick={processPayment}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Process Payment
                      </Button>
                  </SectionCard>
                </div>
              </div>
            </TabsContent>

            {/* ─── Stock Tab ─────────────────────────────────────────────────── */}
            <TabsContent value="stock" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search stock..." className="pl-9 h-9" value={searchStock} onChange={e => setSearchStock(e.target.value)} />
                </div>
              </div>
              <SectionCard noPadding>
                <TableShell>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock Qty</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.filter(item => item.name.toLowerCase().includes(searchStock.toLowerCase()) || item.category.toLowerCase().includes(searchStock.toLowerCase())).map(item => (
                        <TableRow key={item.id} className="cursor-pointer" onClick={() => { setSelectedItem(item); setViewMode('item-detail') }}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{item.category.replace(/_/g, ' ')}</Badge></TableCell>
                          <TableCell className="text-sm">{item.stockQuantity}</TableCell>
                          <TableCell className="text-sm">{item.reorderLevel}</TableCell>
                          <TableCell>
                            <Badge variant={item.stockQuantity === 0 ? 'destructive' : item.stockQuantity <= item.reorderLevel ? 'secondary' : 'default'} className="text-[10px]">
                              {item.stockQuantity === 0 ? 'Out' : item.stockQuantity <= item.reorderLevel ? 'Low' : 'OK'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableShell>
              </SectionCard>
            </TabsContent>

            {/* ─── Sales Reports Tab ─────────────────────────────────────────── */}
            <TabsContent value="reports" className="space-y-4">
              <SectionCard title="Sales Transactions" description={`${transactions.length} transactions recorded`} noPadding>
                <TableShell maxHeight="500px">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map(tx => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-xs">{tx.transactionNumber}</TableCell>
                            <TableCell className="text-sm">{tx.buyerName}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{tx.buyerType}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{tx.paymentMethod}</Badge></TableCell>
                            <TableCell className="text-sm">{tx.items.length} item{tx.items.length !== 1 ? 's' : ''}</TableCell>
                            <TableCell className="text-sm font-semibold">${tx.totalAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('en-ZW')}</TableCell>
                          </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No transactions recorded yet</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                </TableShell>
              </SectionCard>
            </TabsContent>
          </ModulePageLayout>
        </ModuleContainer>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReceipt(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <Receipt className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <h3 className="text-lg font-bold">Payment Successful</h3>
              <p className="text-xs text-muted-foreground">{lastReceipt.transactionNumber}</p>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-2 mb-4">
              {lastReceipt.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{item.item.name} x{item.quantity}</span>
                  <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-3" />
            <div className="flex items-center justify-between font-bold text-lg mb-1">
              <span>Total</span>
              <span className="text-emerald-600">${lastReceipt.totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-4">Paid via {lastReceipt.paymentMethod}</p>
            <Button className="w-full" onClick={() => setShowReceipt(false)}>Close</Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
