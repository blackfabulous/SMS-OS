'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
  XCircle,
  ChevronRight,
  Star,
  Utensils,
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  stock: number
  maxStock: number
  status: 'Available' | 'Low Stock' | 'Out of Stock'
  image?: string
}

interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  reorderLevel: number
  unitCost: number
  supplier: string
  lastRestocked: string
}

interface CartItem extends MenuItem {
  quantity: number
}

interface SaleRecord {
  id: string
  items: { name: string; qty: number; price: number }[]
  total: number
  paymentMethod: 'Cash' | 'ziG' | 'Card'
  customerName: string
  customerType: 'Student' | 'Staff'
  timestamp: string
  receiptNo: string
}

const initialMenuItems: MenuItem[] = [
  { id: '1', name: 'Sadza & Relish', category: 'Hot Meals', price: 1.50, stock: 45, maxStock: 60, status: 'Available' },
  { id: '2', name: 'Sadza & Chicken', category: 'Hot Meals', price: 3.00, stock: 20, maxStock: 30, status: 'Available' },
  { id: '3', name: 'Sadza & Beef Stew', category: 'Hot Meals', price: 2.50, stock: 15, maxStock: 30, status: 'Available' },
  { id: '4', name: 'Rice & Chicken', category: 'Hot Meals', price: 3.00, stock: 18, maxStock: 25, status: 'Available' },
  { id: '5', name: 'Maputi (Puffed Maize)', category: 'Snacks', price: 0.50, stock: 80, maxStock: 100, status: 'Available' },
  { id: '6', name: 'Mahindi (Roasted Maize)', category: 'Snacks', price: 0.30, stock: 50, maxStock: 60, status: 'Available' },
  { id: '7', name: 'Bread & Margarine', category: 'Snacks', price: 0.75, stock: 35, maxStock: 50, status: 'Available' },
  { id: '8', name: 'Buns', category: 'Snacks', price: 0.50, stock: 40, maxStock: 50, status: 'Available' },
  { id: '9', name: 'Chips (French Fries)', category: 'Snacks', price: 1.00, stock: 5, maxStock: 30, status: 'Low Stock' },
  { id: '10', name: 'Mazoe Orange Drink', category: 'Beverages', price: 0.75, stock: 60, maxStock: 80, status: 'Available' },
  { id: '11', name: 'Mazoe Mango Drink', category: 'Beverages', price: 0.75, stock: 55, maxStock: 80, status: 'Available' },
  { id: '12', name: 'Tea & Sugar', category: 'Beverages', price: 0.30, stock: 70, maxStock: 100, status: 'Available' },
  { id: '13', name: 'Coffee', category: 'Beverages', price: 0.50, stock: 30, maxStock: 50, status: 'Available' },
  { id: '14', name: 'Maheu (Traditional Drink)', category: 'Beverages', price: 0.50, stock: 0, maxStock: 40, status: 'Out of Stock' },
  { id: '15', name: 'Boiled Eggs', category: 'Snacks', price: 0.50, stock: 3, maxStock: 30, status: 'Low Stock' },
  { id: '16', name: 'Kapenta & Sadza', category: 'Hot Meals', price: 2.00, stock: 12, maxStock: 20, status: 'Available' },
  { id: '17', name: 'Peanut Butter Sandwich', category: 'Snacks', price: 0.60, stock: 25, maxStock: 40, status: 'Available' },
  { id: '18', name: 'Muriwo (Vegetables) & Sadza', category: 'Hot Meals', price: 1.20, stock: 30, maxStock: 40, status: 'Available' },
]

const initialStockItems: StockItem[] = [
  { id: '1', name: 'Mealie Meal (10kg)', category: 'Grains', quantity: 25, unit: 'bags', reorderLevel: 10, unitCost: 8.50, supplier: 'National Foods', lastRestocked: '2026-02-25' },
  { id: '2', name: 'Rice (5kg)', category: 'Grains', quantity: 15, unit: 'bags', reorderLevel: 8, unitCost: 5.00, supplier: 'National Foods', lastRestocked: '2026-02-20' },
  { id: '3', name: 'Chicken Portions (kg)', category: 'Proteins', quantity: 30, unit: 'kg', reorderLevel: 15, unitCost: 4.50, supplier: 'Irvine\'s Poultry', lastRestocked: '2026-02-28' },
  { id: '4', name: 'Beef Stewing (kg)', category: 'Proteins', quantity: 20, unit: 'kg', reorderLevel: 10, unitCost: 6.00, supplier: 'Cold Storage', lastRestocked: '2026-02-27' },
  { id: '5', name: 'Cooking Oil (2L)', category: 'Cooking', quantity: 12, unit: 'bottles', reorderLevel: 8, unitCost: 3.50, supplier: 'Olivine Industries', lastRestocked: '2026-02-22' },
  { id: '6', name: 'Sugar (2kg)', category: 'Cooking', quantity: 18, unit: 'packs', reorderLevel: 10, unitCost: 3.00, supplier: 'Triangle Ltd', lastRestocked: '2026-02-24' },
  { id: '7', name: 'Mazoe Concentrate (2L)', category: 'Beverages', quantity: 20, unit: 'bottles', reorderLevel: 8, unitCost: 4.50, supplier: 'Delta Corp', lastRestocked: '2026-02-26' },
  { id: '8', name: 'Tea Bags (100pk)', category: 'Beverages', quantity: 8, unit: 'boxes', reorderLevel: 5, unitCost: 3.00, supplier: 'Tanganda Tea', lastRestocked: '2026-02-20' },
  { id: '9', name: 'Bread Loaves', category: 'Bakery', quantity: 40, unit: 'loaves', reorderLevel: 20, unitCost: 0.90, supplier: 'Baker\'s Inn', lastRestocked: '2026-03-01' },
  { id: '10', name: 'Buns (dozen)', category: 'Bakery', quantity: 15, unit: 'dozens', reorderLevel: 10, unitCost: 2.50, supplier: 'Baker\'s Inn', lastRestocked: '2026-03-01' },
  { id: '11', name: 'Eggs (tray of 30)', category: 'Proteins', quantity: 5, unit: 'trays', reorderLevel: 8, unitCost: 4.00, supplier: 'Irvine\'s Poultry', lastRestocked: '2026-02-28' },
  { id: '12', name: 'Kapenta (kg)', category: 'Proteins', quantity: 10, unit: 'kg', reorderLevel: 5, unitCost: 5.00, supplier: 'Lake Harvest', lastRestocked: '2026-02-25' },
  { id: '13', name: 'Vegetables (bundle)', category: 'Produce', quantity: 25, unit: 'bundles', reorderLevel: 10, unitCost: 0.50, supplier: 'Mbare Musika', lastRestocked: '2026-03-01' },
  { id: '14', name: 'Potatoes (pocket)', category: 'Produce', quantity: 8, unit: 'pockets', reorderLevel: 5, unitCost: 3.00, supplier: 'Mbare Musika', lastRestocked: '2026-02-27' },
  { id: '15', name: 'Peanut Butter (500g)', category: 'Cooking', quantity: 12, unit: 'jars', reorderLevel: 6, unitCost: 2.00, supplier: 'Olivine Industries', lastRestocked: '2026-02-22' },
  { id: '16', name: 'Coffee (200g)', category: 'Beverages', quantity: 6, unit: 'tins', reorderLevel: 4, unitCost: 3.50, supplier: 'Java Coffee', lastRestocked: '2026-02-18' },
  { id: '17', name: 'Margarine (500g)', category: 'Cooking', quantity: 10, unit: 'tubs', reorderLevel: 5, unitCost: 2.50, supplier: 'Olivine Industries', lastRestocked: '2026-02-20' },
  { id: '18', name: 'Maheu (case)', category: 'Beverages', quantity: 0, unit: 'cases', reorderLevel: 5, unitCost: 6.00, supplier: 'Delta Corp', lastRestocked: '2026-02-10' },
]

const mockSales: SaleRecord[] = [
  { id: '1', items: [{ name: 'Sadza & Chicken', qty: 1, price: 3.00 }, { name: 'Mazoe Orange Drink', qty: 1, price: 0.75 }], total: 3.75, paymentMethod: 'Cash', customerName: 'Tendai Moyo', customerType: 'Student', timestamp: '2026-03-01T10:30:00', receiptNo: 'RCP-001' },
  { id: '2', items: [{ name: 'Bread & Margarine', qty: 2, price: 0.75 }, { name: 'Tea & Sugar', qty: 1, price: 0.30 }], total: 1.80, paymentMethod: 'ziG', customerName: 'Chiedza Ncube', customerType: 'Student', timestamp: '2026-03-01T10:45:00', receiptNo: 'RCP-002' },
  { id: '3', items: [{ name: 'Sadza & Beef Stew', qty: 1, price: 2.50 }, { name: 'Maheu (Traditional Drink)', qty: 1, price: 0.50 }], total: 3.00, paymentMethod: 'Card', customerName: 'Mr. Zvambe', customerType: 'Staff', timestamp: '2026-03-01T12:00:00', receiptNo: 'RCP-003' },
  { id: '4', items: [{ name: 'Maputi (Puffed Maize)', qty: 3, price: 0.50 }, { name: 'Mazoe Mango Drink', qty: 1, price: 0.75 }], total: 2.25, paymentMethod: 'Cash', customerName: 'Rumbidzai Dube', customerType: 'Student', timestamp: '2026-03-01T12:15:00', receiptNo: 'RCP-004' },
  { id: '5', items: [{ name: 'Chips (French Fries)', qty: 1, price: 1.00 }, { name: 'Boiled Eggs', qty: 2, price: 0.50 }], total: 2.00, paymentMethod: 'Cash', customerName: 'Kudzai Chiweshe', customerType: 'Student', timestamp: '2026-03-01T12:30:00', receiptNo: 'RCP-005' },
  { id: '6', items: [{ name: 'Rice & Chicken', qty: 1, price: 3.00 }, { name: 'Mazoe Orange Drink', qty: 1, price: 0.75 }], total: 3.75, paymentMethod: 'ziG', customerName: 'Mrs. Chikumba', customerType: 'Staff', timestamp: '2026-03-01T12:45:00', receiptNo: 'RCP-006' },
  { id: '7', items: [{ name: 'Sadza & Relish', qty: 2, price: 1.50 }], total: 3.00, paymentMethod: 'Cash', customerName: 'Tafara Gumbo', customerType: 'Student', timestamp: '2026-03-01T13:00:00', receiptNo: 'RCP-007' },
  { id: '8', items: [{ name: 'Coffee', qty: 1, price: 0.50 }, { name: 'Buns', qty: 2, price: 0.50 }], total: 1.50, paymentMethod: 'Card', customerName: 'Mr. Hove', customerType: 'Staff', timestamp: '2026-03-01T07:30:00', receiptNo: 'RCP-008' },
]

const dailySalesData = [
  { day: 'Mon', sales: 85.50, items: 68 },
  { day: 'Tue', sales: 92.25, items: 74 },
  { day: 'Wed', sales: 78.00, items: 62 },
  { day: 'Thu', sales: 95.75, items: 79 },
  { day: 'Fri', sales: 110.50, items: 88 },
  { day: 'Sat', sales: 45.00, items: 35 },
]

const categoryChartData = [
  { name: 'Hot Meals', value: 45, fill: '#10b981' },
  { name: 'Snacks', value: 28, fill: '#f59e0b' },
  { name: 'Beverages', value: 27, fill: '#06b6d4' },
]

const salesChartConfig = {
  sales: { label: 'Sales (USD)', color: '#10b981' },
  items: { label: 'Items Sold', color: '#f59e0b' },
} satisfies ChartConfig

const categoryChartConfig = {
  'Hot Meals': { label: 'Hot Meals', color: '#10b981' },
  'Snacks': { label: 'Snacks', color: '#f59e0b' },
  'Beverages': { label: 'Beverages', color: '#06b6d4' },
} satisfies ChartConfig

// ─── Component ────────────────────────────────────────────────────────────────
export default function CanteenModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems)
  const [sales] = useState<SaleRecord[]>(mockSales)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchMenu, setSearchMenu] = useState('')
  const [searchStock, setSearchStock] = useState('')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [addStockOpen, setAddStockOpen] = useState(false)
  const [posSearch, setPosSearch] = useState('')
  const [posCategory, setPosCategory] = useState('All')
  const [customerName, setCustomerName] = useState('')
  const [customerType, setCustomerType] = useState<'Student' | 'Staff'>('Student')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'ziG' | 'Card'>('Cash')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<SaleRecord | null>(null)

  // New menu item form state
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('Hot Meals')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemStock, setNewItemStock] = useState('')

  // New stock item form state
  const [newStockName, setNewStockName] = useState('')
  const [newStockCategory, setNewStockCategory] = useState('Grains')
  const [newStockQty, setNewStockQty] = useState('')
  const [newStockUnit, setNewStockUnit] = useState('')
  const [newStockReorder, setNewStockReorder] = useState('')
  const [newStockCost, setNewStockCost] = useState('')
  const [newStockSupplier, setNewStockSupplier] = useState('')

  // Computed values
  const todaySales = sales.reduce((sum, s) => sum + s.total, 0)
  const todayItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((i, item) => i + item.qty, 0), 0)
  const lowStockItems = menuItems.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')
  const stockAlerts = stockItems.filter(s => s.quantity <= s.reorderLevel)
  const popularItems = [...menuItems].sort((a, b) => (b.maxStock - b.stock) - (a.maxStock - a.stock)).slice(0, 5)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
    item.category.toLowerCase().includes(searchMenu.toLowerCase())
  )

  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchStock.toLowerCase()) ||
    item.category.toLowerCase().includes(searchStock.toLowerCase())
  )

  const posFilteredItems = menuItems.filter(item =>
    item.status !== 'Out of Stock' &&
    (posCategory === 'All' || item.category === posCategory) &&
    (item.name.toLowerCase().includes(posSearch.toLowerCase()) ||
     item.category.toLowerCase().includes(posSearch.toLowerCase()))
  )

  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category)))]

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        if (existing.quantity >= item.stock) return prev
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.id !== itemId))
  }

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.id === itemId) {
          const newQty = c.quantity + delta
          const maxQty = menuItems.find(m => m.id === itemId)?.stock ?? 0
          if (newQty <= 0) return c
          if (newQty > maxQty) return c
          return { ...c, quantity: newQty }
        }
        return c
      })
    })
  }

  const processPayment = () => {
    if (cart.length === 0) return
    const receipt: SaleRecord = {
      id: String(sales.length + 1),
      items: cart.map(c => ({ name: c.name, qty: c.quantity, price: c.price })),
      total: cartTotal,
      paymentMethod,
      customerName: customerName || 'Walk-in',
      customerType,
      timestamp: new Date().toISOString(),
      receiptNo: `RCP-${String(sales.length + 1).padStart(3, '0')}`,
    }
    setLastReceipt(receipt)
    setShowReceipt(true)

    // Update stock
    setMenuItems(prev => prev.map(item => {
      const cartItem = cart.find(c => c.id === item.id)
      if (cartItem) {
        const newStock = item.stock - cartItem.quantity
        return {
          ...item,
          stock: newStock,
          status: newStock === 0 ? 'Out of Stock' : newStock <= 5 ? 'Low Stock' : 'Available',
        }
      }
      return item
    }))

    setCart([])
    setCustomerName('')
  }

  // Add menu item
  const handleAddMenuItem = () => {
    if (!newItemName || !newItemPrice || !newItemStock) return
    const stock = parseInt(newItemStock)
    const price = parseFloat(newItemPrice)
    const newItem: MenuItem = {
      id: String(menuItems.length + 1),
      name: newItemName,
      category: newItemCategory,
      price,
      stock,
      maxStock: stock,
      status: stock === 0 ? 'Out of Stock' : stock <= 5 ? 'Low Stock' : 'Available',
    }
    setMenuItems(prev => [...prev, newItem])
    setNewItemName('')
    setNewItemPrice('')
    setNewItemStock('')
    setAddMenuOpen(false)
  }

  // Add stock item
  const handleAddStockItem = () => {
    if (!newStockName || !newStockQty || !newStockUnit || !newStockCost || !newStockSupplier) return
    const newStock: StockItem = {
      id: String(stockItems.length + 1),
      name: newStockName,
      category: newStockCategory,
      quantity: parseInt(newStockQty),
      unit: newStockUnit,
      reorderLevel: parseInt(newStockReorder || '5'),
      unitCost: parseFloat(newStockCost),
      supplier: newStockSupplier,
      lastRestocked: new Date().toISOString().split('T')[0],
    }
    setStockItems(prev => [...prev, newStock])
    setNewStockName('')
    setNewStockQty('')
    setNewStockUnit('')
    setNewStockReorder('')
    setNewStockCost('')
    setNewStockSupplier('')
    setAddStockOpen(false)
  }

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== id))
  }

  const deleteStockItem = (id: string) => {
    setStockItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <Coffee className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Canteen & POS</h2>
            <p className="text-sm text-muted-foreground">Manage canteen menu, sales, and inventory</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="menu">Menu Items</TabsTrigger>
          <TabsTrigger value="pos">Point of Sale</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="reports">Sales Reports</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today&apos;s Sales</p>
                    <p className="text-2xl font-bold">${todaySales.toFixed(2)}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+12% vs yesterday</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Items Sold</p>
                    <p className="text-2xl font-bold">{todayItemsSold}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+8% vs yesterday</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <ShoppingCart className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low Stock Alerts</p>
                    <p className="text-2xl font-bold">{lowStockItems.length + stockAlerts.length}</p>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Needs attention</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weekly Revenue</p>
                    <p className="text-2xl font-bold">${dailySalesData.reduce((s, d) => s + d.sales, 0).toFixed(2)}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+5% vs last week</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                    <BarChart3 className="h-5 w-5 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Items + Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Popular Items Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {popularItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white',
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-muted text-muted-foreground'
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${item.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{item.maxStock - item.stock} sold</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {lowStockItems.length === 0 && stockAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">All stock levels are healthy</p>
                ) : (
                  <>
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.status === 'Out of Stock' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {item.status}
                          </Badge>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.stock}/{item.maxStock}</span>
                      </div>
                    ))}
                    {stockAlerts.filter(s => !lowStockItems.find(l => l.name.includes(s.name.split(' ')[0]))).slice(0, 3).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/60">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">Reorder</Badge>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.quantity}/{item.reorderLevel}</span>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Sales Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Daily Sales This Week</CardTitle>
              <CardDescription>Revenue and item count by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig} className="h-[280px] w-full">
                <BarChart data={dailySalesData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Menu Items Tab ───────────────────────────────────────────────── */}
        <TabsContent value="menu" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                className="pl-9 h-9"
                value={searchMenu}
                onChange={e => setSearchMenu(e.target.value)}
              />
            </div>
            <Dialog open={addMenuOpen} onOpenChange={setAddMenuOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Sadza & Chicken" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hot Meals">Hot Meals</SelectItem>
                          <SelectItem value="Snacks">Snacks</SelectItem>
                          <SelectItem value="Beverages">Beverages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Price (USD)</Label>
                      <Input type="number" step="0.01" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Stock</Label>
                    <Input type="number" value={newItemStock} onChange={e => setNewItemStock(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddMenuItem}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
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
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all',
                                item.stock / item.maxStock > 0.5 ? 'bg-emerald-500' :
                                item.stock / item.maxStock > 0.2 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${Math.max((item.stock / item.maxStock) * 100, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.stock}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'Available' ? 'default' : item.status === 'Low Stock' ? 'secondary' : 'destructive'}
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteMenuItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Point of Sale Tab ────────────────────────────────────────────── */}
        <TabsContent value="pos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Item Selection (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-9 h-9"
                    value={posSearch}
                    onChange={e => setPosSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={posCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      className={cn('h-9 text-xs', posCategory === cat && 'bg-emerald-600 hover:bg-emerald-700')}
                      onClick={() => setPosCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {posFilteredItems.map(item => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-white hover:shadow-md transition-shadow text-center"
                    onClick={() => addToCart(item)}
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      item.category === 'Hot Meals' ? 'bg-orange-50' :
                      item.category === 'Snacks' ? 'bg-amber-50' : 'bg-cyan-50'
                    )}>
                      <Utensils className={cn(
                        'h-5 w-5',
                        item.category === 'Hot Meals' ? 'text-orange-600' :
                        item.category === 'Snacks' ? 'text-amber-600' : 'text-cyan-600'
                      )} />
                    </div>
                    <span className="text-xs font-medium line-clamp-2">{item.name}</span>
                    <span className="text-sm font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                    {item.status === 'Low Stock' && (
                      <Badge variant="secondary" className="text-[9px]">Low Stock</Badge>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Cart & Payment (1/3) */}
            <div className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Cart
                    {cart.length > 0 && <Badge className="ml-auto">{cart.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Cart is empty. Select items to add.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeFromCart(item.id)}>
                              <X className="h-3 w-3" />
                            </Button>
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
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Customer Name</Label>
                    <Input
                      placeholder="Student/Staff name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Customer Type</Label>
                    <Select value={customerType} onValueChange={v => setCustomerType(v as 'Student' | 'Staff')}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                        size="sm"
                        className={cn('gap-1 h-9 text-xs', paymentMethod === 'Cash' && 'bg-emerald-600 hover:bg-emerald-700')}
                        onClick={() => setPaymentMethod('Cash')}
                      >
                        <Banknote className="h-3 w-3" /> Cash
                      </Button>
                      <Button
                        variant={paymentMethod === 'ziG' ? 'default' : 'outline'}
                        size="sm"
                        className={cn('gap-1 h-9 text-xs', paymentMethod === 'ziG' && 'bg-emerald-600 hover:bg-emerald-700')}
                        onClick={() => setPaymentMethod('ziG')}
                      >
                        <Wallet className="h-3 w-3" /> ziG
                      </Button>
                      <Button
                        variant={paymentMethod === 'Card' ? 'default' : 'outline'}
                        size="sm"
                        className={cn('gap-1 h-9 text-xs', paymentMethod === 'Card' && 'bg-emerald-600 hover:bg-emerald-700')}
                        onClick={() => setPaymentMethod('Card')}
                      >
                        <CreditCard className="h-3 w-3" /> Card
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                    disabled={cart.length === 0}
                    onClick={processPayment}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Process Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Receipt Dialog */}
          <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Printer className="h-4 w-4" /> Receipt
                </DialogTitle>
              </DialogHeader>
              {lastReceipt && (
                <div className="space-y-4 py-2">
                  <div className="text-center">
                    <p className="font-bold text-lg">ZimSchool Canteen</p>
                    <p className="text-xs text-muted-foreground">Receipt #{lastReceipt.receiptNo}</p>
                    <p className="text-xs text-muted-foreground">{new Date(lastReceipt.timestamp).toLocaleString('en-ZW')}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {lastReceipt.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x{item.qty}</span>
                        <span>${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${lastReceipt.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Payment</span>
                    <span>{lastReceipt.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Customer</span>
                    <span>{lastReceipt.customerName} ({lastReceipt.customerType})</span>
                  </div>
                  <Separator />
                  <p className="text-center text-xs text-muted-foreground">Thank you for your purchase!</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" className="gap-2" onClick={() => setShowReceipt(false)}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── Stock Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="pl-9 h-9"
                value={searchStock}
                onChange={e => setSearchStock(e.target.value)}
              />
            </div>
            <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Stock Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input value={newStockName} onChange={e => setNewStockName(e.target.value)} placeholder="e.g. Mealie Meal" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newStockCategory} onValueChange={setNewStockCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grains">Grains</SelectItem>
                          <SelectItem value="Proteins">Proteins</SelectItem>
                          <SelectItem value="Cooking">Cooking</SelectItem>
                          <SelectItem value="Beverages">Beverages</SelectItem>
                          <SelectItem value="Bakery">Bakery</SelectItem>
                          <SelectItem value="Produce">Produce</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" value={newStockQty} onChange={e => setNewStockQty(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input value={newStockUnit} onChange={e => setNewStockUnit(e.target.value)} placeholder="e.g. bags, kg" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reorder Level</Label>
                      <Input type="number" value={newStockReorder} onChange={e => setNewStockReorder(e.target.value)} placeholder="5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Unit Cost (USD)</Label>
                      <Input type="number" step="0.01" value={newStockCost} onChange={e => setNewStockCost(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier</Label>
                      <Input value={newStockSupplier} onChange={e => setNewStockSupplier(e.target.value)} placeholder="Supplier name" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddStockItem}>Add Stock</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Reorder Alert Banner */}
          {stockAlerts.length > 0 && (
            <Card className="border-0 shadow-md border-l-4 border-l-amber-400 bg-amber-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">{stockAlerts.length} items below reorder level</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {stockAlerts.map(s => s.name).join(', ')}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-100">
                  Generate Order <ChevronRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Last Restocked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStockItems.map(item => (
                    <TableRow key={item.id} className={cn(item.quantity <= item.reorderLevel && 'bg-red-50/40')}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.quantity <= item.reorderLevel && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                      <TableCell className={cn(item.quantity <= item.reorderLevel && 'font-bold text-red-600')}>
                        {item.quantity}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell>${item.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{item.supplier}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.lastRestocked}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Package className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteStockItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Sales Reports Tab ────────────────────────────────────────────── */}
        <TabsContent value="reports" className="space-y-4">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold mt-1">${todaySales.toFixed(2)}</p>
                <p className="text-xs text-emerald-600 mt-1">+12% vs yesterday</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weekly Revenue</p>
                <p className="text-2xl font-bold mt-1">${dailySalesData.reduce((s, d) => s + d.sales, 0).toFixed(2)}</p>
                <p className="text-xs text-emerald-600 mt-1">+5% vs last week</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Transaction</p>
                <p className="text-2xl font-bold mt-1">${(todaySales / Math.max(sales.length, 1)).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{sales.length} transactions today</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Daily Sales Trend</CardTitle>
                <CardDescription>Revenue by day this week (USD)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesChartConfig} className="h-[280px] w-full">
                  <BarChart data={dailySalesData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenue by Category</CardTitle>
                <CardDescription>Sales breakdown by food category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer config={categoryChartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={categoryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  {categoryChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-sm text-muted-foreground">{entry.name} ({entry.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Sellers Table */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Top Sellers This Week</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularItems.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white',
                          idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-muted text-muted-foreground'
                        )}>
                          {idx + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                      <TableCell>{item.maxStock - item.stock}</TableCell>
                      <TableCell className="font-semibold">${((item.maxStock - item.stock) * item.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.receiptNo}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{sale.customerName}</p>
                          <Badge variant="outline" className="text-[9px]">{sale.customerType}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          {sale.items.map((item, idx) => (
                            <span key={idx} className="text-xs text-muted-foreground">
                              {item.name} x{item.qty}{idx < sale.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">${sale.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sale.paymentMethod === 'Cash' ? 'default' : sale.paymentMethod === 'ziG' ? 'secondary' : 'outline'}
                          className="text-[10px]"
                        >
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(sale.timestamp).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
