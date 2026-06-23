'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Package, ShoppingBag, FileText, Settings, Plus, Pencil, Trash2,
  AlertTriangle, DollarSign, TrendingUp, BarChart3, Shirt, BookOpen, Truck,
  Search, X, ChevronDown, Download, Eye, CheckCircle2, Clock, XCircle,
  LayoutGrid, List, Star, ArrowUpRight, ArrowDownRight, Minus, Tag, ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { StatGrid, ModuleStatCard, SectionCard } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'Uniforms' | 'Stationery' | 'Textbooks' | 'Sports Equipment' | 'Accessories' | 'Other'
type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'
type OrderStatus = 'Pending' | 'Processing' | 'Ready' | 'Collected' | 'Cancelled'
type Currency = 'USD' | 'ZiG'
type Gender = 'Boys' | 'Girls' | 'Unisex'
type Season = 'Summer' | 'Winter' | 'All Season'
type PaymentMethod = 'Cash' | 'EcoCash' | 'ZiG' | 'Bank Transfer'

interface Product {
  id: string
  name: string
  description: string
  category: Category
  price: number
  currency: Currency
  stock: number
  sizes: string[]
  colors: string[]
  active: boolean
  image?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  items: { productName: string; quantity: number; price: number; size?: string }[]
  total: number
  status: OrderStatus
  date: string
  paymentMethod: PaymentMethod
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const categoryColors: Record<Category, string> = {
  Uniforms: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Stationery: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Textbooks: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Sports Equipment': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Accessories: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300',
}

const categoryPieColors: Record<Category, string> = {
  Uniforms: '#10b981',
  Stationery: '#f59e0b',
  Textbooks: '#3b82f6',
  'Sports Equipment': '#ef4444',
  Accessories: '#8b5cf6',
  Other: '#6b7280',
}

const initialProducts: Product[] = [
  // Uniforms
  { id: '1', name: 'School Blazer', description: 'Official navy school blazer with embroidered badge', category: 'Uniforms', price: 65.00, currency: 'USD', stock: 45, sizes: ['30','32','34','36','38','40','42','44'], colors: ['Navy'], active: true },
  { id: '2', name: 'White Shirt (Boys)', description: 'Long-sleeve white cotton shirt for boys', category: 'Uniforms', price: 15.00, currency: 'USD', stock: 120, sizes: ['S','M','L','XL','XXL'], colors: ['White'], active: true },
  { id: '3', name: 'White Blouse (Girls)', description: 'Short-sleeve white polyester-cotton blouse', category: 'Uniforms', price: 18.00, currency: 'USD', stock: 95, sizes: ['S','M','L','XL','XXL'], colors: ['White'], active: true },
  { id: '4', name: 'Grey Trousers (Boys)', description: 'Grey poly-wool blend school trousers', category: 'Uniforms', price: 25.00, currency: 'USD', stock: 80, sizes: ['28','30','32','34','36','38'], colors: ['Grey'], active: true },
  { id: '5', name: 'Navy Skirt (Girls)', description: 'Pleated navy skirt for girls', category: 'Uniforms', price: 22.00, currency: 'USD', stock: 70, sizes: ['S','M','L','XL','XXL'], colors: ['Navy'], active: true },
  { id: '6', name: 'School Tie', description: 'Official striped school tie', category: 'Uniforms', price: 8.00, currency: 'USD', stock: 150, sizes: [], colors: ['Navy/Gold'], active: true },
  { id: '7', name: 'Navy Jersey', description: 'V-neck navy school jersey', category: 'Uniforms', price: 35.00, currency: 'USD', stock: 55, sizes: ['S','M','L','XL','XXL'], colors: ['Navy'], active: true },
  { id: '8', name: 'Track Suit', description: 'School track suit with logo', category: 'Uniforms', price: 45.00, currency: 'USD', stock: 40, sizes: ['S','M','L','XL','XXL'], colors: ['Navy/White'], active: true },
  { id: '9', name: 'School Hat', description: 'Wide-brim sun hat with school badge', category: 'Uniforms', price: 12.00, currency: 'USD', stock: 60, sizes: [], colors: ['Navy'], active: true },
  { id: '10', name: 'White Socks (pair)', description: 'Plain white school socks', category: 'Uniforms', price: 3.00, currency: 'USD', stock: 200, sizes: [], colors: ['White'], active: true },
  // Stationery
  { id: '11', name: 'Exercise Book (A4, 96pg)', description: 'A4 96-page exercise book with margin', category: 'Stationery', price: 2.50, currency: 'USD', stock: 300, sizes: [], colors: ['Blue','Green','Red','Yellow'], active: true },
  { id: '12', name: 'Exam Pad', description: 'A4 examination pad with 80 leaves', category: 'Stationery', price: 3.00, currency: 'USD', stock: 150, sizes: [], colors: ['White'], active: true },
  { id: '13', name: 'Scientific Calculator', description: 'Casio fx-991EX scientific calculator', category: 'Stationery', price: 15.00, currency: 'USD', stock: 25, sizes: [], colors: ['Black'], active: true },
  { id: '14', name: 'Geometry Set', description: 'Complete mathematical geometry set', category: 'Stationery', price: 8.00, currency: 'USD', stock: 45, sizes: [], colors: ['Blue'], active: true },
  { id: '15', name: 'School Bag', description: 'Durable school backpack with compartments', category: 'Stationery', price: 25.00, currency: 'USD', stock: 35, sizes: [], colors: ['Navy','Black'], active: true },
  // Textbooks
  { id: '16', name: 'O-Level Maths Textbook', description: 'ZIMSEC O-Level Mathematics textbook', category: 'Textbooks', price: 18.00, currency: 'USD', stock: 55, sizes: [], colors: [], active: true },
  { id: '17', name: 'O-Level English Textbook', description: 'ZIMSEC O-Level English Language textbook', category: 'Textbooks', price: 16.00, currency: 'USD', stock: 50, sizes: [], colors: [], active: true },
  { id: '18', name: 'O-Level Science Textbook', description: 'ZIMSEC O-Level Combined Science textbook', category: 'Textbooks', price: 20.00, currency: 'USD', stock: 40, sizes: [], colors: [], active: true },
  // Sports Equipment
  { id: '19', name: 'Soccer Ball', description: 'FIFA standard size 5 soccer ball', category: 'Sports Equipment', price: 22.00, currency: 'USD', stock: 15, sizes: ['Size 5'], colors: ['White/Black'], active: true },
  { id: '20', name: 'Netball', description: 'Official size netball', category: 'Sports Equipment', price: 18.00, currency: 'USD', stock: 10, sizes: [], colors: ['White'], active: true },
  // Accessories
  { id: '21', name: 'School Badge', description: 'Metal school badge for blazer', category: 'Accessories', price: 5.00, currency: 'USD', stock: 100, sizes: [], colors: ['Gold'], active: true },
  { id: '22', name: 'Name Tag', description: 'Custom embroidered name tag', category: 'Accessories', price: 3.50, currency: 'USD', stock: 80, sizes: [], colors: ['Navy'], active: true },
  // Other - low stock items
  { id: '23', name: 'Lab Coat', description: 'White laboratory coat for science practicals', category: 'Other', price: 20.00, currency: 'USD', stock: 4, sizes: ['S','M','L'], colors: ['White'], active: true },
  { id: '24', name: 'Art Smock', description: 'Protective art smock for practical lessons', category: 'Other', price: 12.00, currency: 'USD', stock: 0, sizes: ['S','M','L','XL'], colors: ['Navy'], active: false },
]

const initialOrders: Order[] = [
  { id: '1', orderNumber: 'SHP-2026-001', customerName: 'Tendai Moyo', phone: '+263 77 234 5678', items: [{ productName: 'School Blazer', quantity: 1, price: 65.00, size: '36' }, { productName: 'School Tie', quantity: 1, price: 8.00 }, { productName: 'White Shirt (Boys)', quantity: 2, price: 15.00, size: 'M' }], total: 103.00, status: 'Collected', date: '2026-02-15', paymentMethod: 'EcoCash' },
  { id: '2', orderNumber: 'SHP-2026-002', customerName: 'Chiedza Ncube', phone: '+263 71 345 6789', items: [{ productName: 'Navy Skirt (Girls)', quantity: 1, price: 22.00, size: 'S' }, { productName: 'White Blouse (Girls)', quantity: 2, price: 18.00, size: 'M' }, { productName: 'School Hat', quantity: 1, price: 12.00 }], total: 70.00, status: 'Ready', date: '2026-02-20', paymentMethod: 'Cash' },
  { id: '3', orderNumber: 'SHP-2026-003', customerName: 'Kudzai Chiweshe', phone: '+263 73 456 7890', items: [{ productName: 'Track Suit', quantity: 1, price: 45.00, size: 'L' }, { productName: 'White Socks (pair)', quantity: 3, price: 3.00 }], total: 54.00, status: 'Processing', date: '2026-03-01', paymentMethod: 'Bank Transfer' },
  { id: '4', orderNumber: 'SHP-2026-004', customerName: 'Rumbidzai Dube', phone: '+263 77 567 8901', items: [{ productName: 'O-Level Maths Textbook', quantity: 1, price: 18.00 }, { productName: 'O-Level English Textbook', quantity: 1, price: 16.00 }, { productName: 'Exercise Book (A4, 96pg)', quantity: 5, price: 2.50 }, { productName: 'Scientific Calculator', quantity: 1, price: 15.00 }], total: 67.50, status: 'Pending', date: '2026-03-02', paymentMethod: 'EcoCash' },
  { id: '5', orderNumber: 'SHP-2026-005', customerName: 'Tapiwa Gumbo', phone: '+263 71 678 9012', items: [{ productName: 'Grey Trousers (Boys)', quantity: 2, price: 25.00, size: '30' }, { productName: 'Navy Jersey', quantity: 1, price: 35.00, size: 'S' }, { productName: 'School Bag', quantity: 1, price: 25.00 }], total: 110.00, status: 'Collected', date: '2026-02-10', paymentMethod: 'Cash' },
  { id: '6', orderNumber: 'SHP-2026-006', customerName: 'Nyasha Mutasa', phone: '+263 73 789 0123', items: [{ productName: 'School Blazer', quantity: 1, price: 65.00, size: '38' }, { productName: 'Geometry Set', quantity: 1, price: 8.00 }, { productName: 'Exam Pad', quantity: 2, price: 3.00 }], total: 79.00, status: 'Processing', date: '2026-03-03', paymentMethod: 'ZiG' },
  { id: '7', orderNumber: 'SHP-2026-007', customerName: 'Farai Chikumbu', phone: '+263 77 890 1234', items: [{ productName: 'Soccer Ball', quantity: 1, price: 22.00 }, { productName: 'O-Level Science Textbook', quantity: 1, price: 20.00 }], total: 42.00, status: 'Cancelled', date: '2026-02-25', paymentMethod: 'Cash' },
  { id: '8', orderNumber: 'SHP-2026-008', customerName: 'Tafadzwa Hove', phone: '+263 71 901 2345', items: [{ productName: 'White Shirt (Boys)', quantity: 3, price: 15.00, size: 'L' }, { productName: 'School Tie', quantity: 1, price: 8.00 }, { productName: 'White Socks (pair)', quantity: 5, price: 3.00 }, { productName: 'School Badge', quantity: 1, price: 5.00 }], total: 73.00, status: 'Ready', date: '2026-03-01', paymentMethod: 'EcoCash' },
  { id: '9', orderNumber: 'SHP-2026-009', customerName: 'Mutsa Matarutse', phone: '+263 73 012 3456', items: [{ productName: 'White Blouse (Girls)', quantity: 2, price: 18.00, size: 'S' }, { productName: 'Navy Skirt (Girls)', quantity: 1, price: 22.00, size: 'M' }, { productName: 'School Hat', quantity: 1, price: 12.00 }, { productName: 'Name Tag', quantity: 1, price: 3.50 }], total: 73.50, status: 'Pending', date: '2026-03-04', paymentMethod: 'Bank Transfer' },
  { id: '10', orderNumber: 'SHP-2026-010', customerName: 'Blessing Mahachi', phone: '+263 77 123 4567', items: [{ productName: 'Track Suit', quantity: 1, price: 45.00, size: 'M' }, { productName: 'Navy Jersey', quantity: 1, price: 35.00, size: 'L' }, { productName: 'Lab Coat', quantity: 1, price: 20.00, size: 'M' }], total: 100.00, status: 'Processing', date: '2026-03-04', paymentMethod: 'Cash' },
]

const revenueData = [
  { month: 'Oct', revenue: 2450 },
  { month: 'Nov', revenue: 3100 },
  { month: 'Dec', revenue: 1800 },
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 3800 },
  { month: 'Mar', revenue: 2900 },
]

const categoryData: { name: Category; value: number; fill: string }[] = [
  { name: 'Uniforms', value: 915, fill: '#10b981' },
  { name: 'Stationery', value: 310, fill: '#f59e0b' },
  { name: 'Textbooks', value: 180, fill: '#3b82f6' },
  { name: 'Sports Equipment', value: 40, fill: '#ef4444' },
  { name: 'Accessories', value: 78, fill: '#8b5cf6' },
  { name: 'Other', value: 32, fill: '#6b7280' },
]

const revenueChartConfig = {
  revenue: { label: 'Revenue (USD)', color: '#10b981' },
} satisfies ChartConfig

const categoryChartConfig = {
  Uniforms: { label: 'Uniforms', color: '#10b981' },
  Stationery: { label: 'Stationery', color: '#f59e0b' },
  Textbooks: { label: 'Textbooks', color: '#3b82f6' },
  'Sports Equipment': { label: 'Sports Equipment', color: '#ef4444' },
  Accessories: { label: 'Accessories', color: '#8b5cf6' },
  Other: { label: 'Other', color: '#6b7280' },
} satisfies ChartConfig

const uniformTypes = [
  { type: 'Blazers', gender: 'Unisex' as Gender, season: 'Winter' as Season, sizes: ['30','32','34','36','38','40','42','44'], stockBySize: { '30': 4, '32': 6, '34': 8, '36': 10, '38': 7, '40': 5, '42': 3, '44': 2 } },
  { type: 'Shirts', gender: 'Boys' as Gender, season: 'All Season' as Season, sizes: ['S','M','L','XL','XXL'], stockBySize: { 'S': 20, 'M': 35, 'L': 30, 'XL': 25, 'XXL': 10 } },
  { type: 'Blouses', gender: 'Girls' as Gender, season: 'All Season' as Season, sizes: ['S','M','L','XL','XXL'], stockBySize: { 'S': 15, 'M': 25, 'L': 28, 'XL': 18, 'XXL': 9 } },
  { type: 'Trousers', gender: 'Boys' as Gender, season: 'All Season' as Season, sizes: ['28','30','32','34','36','38'], stockBySize: { '28': 10, '30': 18, '32': 20, '34': 15, '36': 10, '38': 7 } },
  { type: 'Skirts', gender: 'Girls' as Gender, season: 'All Season' as Season, sizes: ['S','M','L','XL','XXL'], stockBySize: { 'S': 12, 'M': 22, 'L': 18, 'XL': 12, 'XXL': 6 } },
  { type: 'Ties', gender: 'Unisex' as Gender, season: 'All Season' as Season, sizes: ['One Size'], stockBySize: { 'One Size': 150 } },
  { type: 'Socks', gender: 'Unisex' as Gender, season: 'All Season' as Season, sizes: ['One Size'], stockBySize: { 'One Size': 200 } },
  { type: 'Jerseys', gender: 'Unisex' as Gender, season: 'Winter' as Season, sizes: ['S','M','L','XL','XXL'], stockBySize: { 'S': 8, 'M': 15, 'L': 14, 'XL': 10, 'XXL': 8 } },
  { type: 'Tracksuits', gender: 'Unisex' as Gender, season: 'Winter' as Season, sizes: ['S','M','L','XL','XXL'], stockBySize: { 'S': 6, 'M': 10, 'L': 12, 'XL': 8, 'XXL': 4 } },
  { type: 'Hats', gender: 'Unisex' as Gender, season: 'Summer' as Season, sizes: ['One Size'], stockBySize: { 'One Size': 60 } },
]

// ─── Helper Functions ─────────────────────────────────────────────────────────
function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return 'Out of Stock'
  if (stock <= 10) return 'Low Stock'
  return 'In Stock'
}

function getStockStatusColor(status: StockStatus) {
  switch (status) {
    case 'In Stock': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'Low Stock': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'Out of Stock': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  }
}

function getOrderStatusColor(status: OrderStatus) {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'Processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    case 'Ready': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'Collected': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
    case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  }
}

function getOrderStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'Pending': return <Clock className="h-3 w-3" />
    case 'Processing': return <Package className="h-3 w-3" />
    case 'Ready': return <CheckCircle2 className="h-3 w-3" />
    case 'Collected': return <Truck className="h-3 w-3" />
    case 'Cancelled': return <XCircle className="h-3 w-3" />
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchoolShopModule() {
  const { schoolName } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'All'>('All')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [editProductOpen, setEditProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uniformGenderFilter, setUniformGenderFilter] = useState<Gender | 'All'>('All')
  const [uniformSeasonFilter, setUniformSeasonFilter] = useState<Season | 'All'>('All')

  // Settings state
  const [shopName, setShopName] = useState(`${schoolName} Shop`)
  const [shopDescription, setShopDescription] = useState('Official school uniform and supplies shop')
  const [paymentMethods, setPaymentMethods] = useState<Record<PaymentMethod, boolean>>({ Cash: true, EcoCash: true, ZiG: true, 'Bank Transfer': true })
  const [lowStockThreshold, setLowStockThreshold] = useState('10')
  const [taxRate, setTaxRate] = useState('15')
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [pickupEnabled, setPickupEnabled] = useState(true)
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [orderNotifications, setOrderNotifications] = useState(true)

  // Add product form
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('Uniforms')
  const [newPrice, setNewPrice] = useState('')
  const [newCurrency, setNewCurrency] = useState<Currency>('USD')
  const [newSizes, setNewSizes] = useState('')
  const [newColors, setNewColors] = useState('')
  const [newStock, setNewStock] = useState('')
  const [newActive, setNewActive] = useState(true)

  // Computed
  const activeProducts = products.filter(p => p.active)
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10)
  const outOfStockProducts = products.filter(p => p.stock === 0)
  const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0)
  const totalStockValue = products.reduce((s, p) => s + p.price * p.stock, 0)

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [products, searchQuery, categoryFilter])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => orderStatusFilter === 'All' || o.status === orderStatusFilter)
  }, [orders, orderStatusFilter])

  const filteredUniforms = useMemo(() => {
    return uniformTypes.filter(u => {
      const matchGender = uniformGenderFilter === 'All' || u.gender === uniformGenderFilter || u.gender === 'Unisex'
      const matchSeason = uniformSeasonFilter === 'All' || u.season === uniformSeasonFilter || u.season === 'All Season'
      return matchGender && matchSeason
    })
  }, [uniformGenderFilter, uniformSeasonFilter])

  // Today's sales
  const todayOrders = orders.filter(o => o.date === '2026-03-04' && o.status !== 'Cancelled')
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
  const weekOrders = orders.filter(o => o.status !== 'Cancelled')
  const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0)

  // Top sellers
  const topSellers = useMemo(() => {
    const sales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      o.items.forEach(item => {
        if (!sales[item.productName]) sales[item.productName] = { name: item.productName, quantity: 0, revenue: 0 }
        sales[item.productName].quantity += item.quantity
        sales[item.productName].revenue += item.price * item.quantity
      })
    })
    return Object.values(sales).sort((a, b) => b.quantity - a.quantity).slice(0, 8)
  }, [orders])

  // CRUD handlers
  const handleAddProduct = () => {
    if (!newName || !newPrice || !newStock) {
      toast.error('Please fill in all required fields')
      return
    }
    const sizes = newSizes ? newSizes.split(',').map(s => s.trim()).filter(Boolean) : []
    const colors = newColors ? newColors.split(',').map(s => s.trim()).filter(Boolean) : []
    const product: Product = {
      id: String(products.length + 1),
      name: newName,
      description: newDescription,
      category: newCategory,
      price: parseFloat(newPrice),
      currency: newCurrency,
      stock: parseInt(newStock),
      sizes,
      colors,
      active: newActive,
    }
    setProducts(prev => [...prev, product])
    resetAddForm()
    setAddProductOpen(false)
    toast.success(`"${product.name}" added to shop`)
  }

  const handleEditProduct = () => {
    if (!editingProduct || !editingProduct.name) return
    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p))
    setEditProductOpen(false)
    setEditingProduct(null)
    toast.success(`"${editingProduct.name}" updated`)
  }

  const handleDeleteProduct = () => {
    if (!deletingId) return
    const product = products.find(p => p.id === deletingId)
    setProducts(prev => prev.filter(p => p.id !== deletingId))
    setDeleteConfirmOpen(false)
    setDeletingId(null)
    toast.success(`"${product?.name}" removed from shop`)
  }

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    toast.success(`Order status updated to ${newStatus}`)
  }

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
    toast.success('Order deleted')
  }

  const resetAddForm = () => {
    setNewName('')
    setNewDescription('')
    setNewCategory('Uniforms')
    setNewPrice('')
    setNewCurrency('USD')
    setNewSizes('')
    setNewColors('')
    setNewStock('')
    setNewActive(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct({ ...product })
    setEditProductOpen(true)
  }

  const openDeleteConfirm = (id: string) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Price (USD)', 'Stock', 'Status', 'Sizes', 'Colors']
    const rows = products.map(p => [
      p.name, p.category, p.price.toFixed(2), p.stock,
      getStockStatus(p.stock), p.sizes.join('; '), p.colors.join('; ')
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shop-products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Products exported to CSV')
  }

  // ─── Animation variants
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

  const categories: (Category | 'All')[] = ['All', 'Uniforms', 'Stationery', 'Textbooks', 'Sports Equipment', 'Accessories', 'Other']

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs"><ShoppingBag className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" />Products</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 text-xs"><ShoppingCart className="h-3.5 w-3.5" />Orders</TabsTrigger>
          <TabsTrigger value="uniforms" className="gap-1.5 text-xs"><Shirt className="h-3.5 w-3.5" />Uniforms</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Reports</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" />Settings</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW TAB ═════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            {[
              { label: 'Total Products', value: products.length, icon: Package, accent: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', ic: 'text-emerald-600 dark:text-emerald-400', sub: `${activeProducts.length} active` },
              { label: 'Total Orders', value: orders.length, icon: ShoppingCart, accent: 'from-teal-400 to-cyan-500', bg: 'bg-teal-50 dark:bg-teal-950/40', ic: 'text-teal-600 dark:text-teal-400', sub: `${orders.filter(o => o.status === 'Pending').length} pending` },
              { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, accent: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/40', ic: 'text-amber-600 dark:text-amber-400', sub: 'All time' },
              { label: 'Stock Value', value: `$${totalStockValue.toFixed(2)}`, icon: TrendingUp, accent: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40', ic: 'text-cyan-600 dark:text-cyan-400', sub: `${lowStockProducts.length + outOfStockProducts.length} alerts` },
            ].map((stat, i) => (
              <ModuleStatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} accentGradient={stat.accent} bgColor={stat.bg} iconColor={stat.ic} hint={stat.sub} index={i} />
            ))}
          </StatGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Orders */}
            <SectionCard title="Recent Orders" icon={ShoppingCart} contentClassName="space-y-2 max-h-80 overflow-y-auto">
                {orders.slice(0, 6).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => { setSelectedOrder(order); setOrderDetailOpen(true) }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                        <ShoppingBag className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${order.total.toFixed(2)}</p>
                      <Badge className={cn('text-[10px]', getOrderStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </SectionCard>

            {/* Low Stock Alerts */}
            <SectionCard title="Low Stock Alerts" icon={AlertTriangle} contentClassName="space-y-2 max-h-80 overflow-y-auto">
                {[...lowStockProducts, ...outOfStockProducts].map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                      <Badge className={cn('text-[10px]', getStockStatusColor(getStockStatus(product.stock)))}>
                        {getStockStatus(product.stock)}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{product.stock} left</p>
                      <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">All stock levels are healthy ✓</div>
                )}
              </SectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <SectionCard title="Category Breakdown" description="Stock value by category">
                <ChartContainer config={categoryChartConfig} className="h-[260px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={55} strokeWidth={2} stroke="var(--background)">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </SectionCard>

            {/* Revenue Trend */}
            <SectionCard title="Revenue Trend" description="Last 6 months">
                <ChartContainer config={revenueChartConfig} className="h-[260px] w-full">
                  <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ChartContainer>
              </SectionCard>
          </div>
        </TabsContent>

        {/* ═══ PRODUCTS TAB ═════════════════════════════════════════════════════ */}
        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-9 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex gap-1 flex-wrap">
                {categories.map(cat => (
                  <Button key={cat} variant={categoryFilter === cat ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', categoryFilter === cat && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setCategoryFilter(cat)}>
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-lg overflow-hidden">
                <Button variant="ghost" size="icon" className={cn('h-8 w-8 rounded-none', viewMode === 'grid' && 'bg-emerald-50 dark:bg-emerald-900/30')} onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className={cn('h-8 w-8 rounded-none', viewMode === 'list' && 'bg-emerald-50 dark:bg-emerald-900/30')} onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              </div>
              <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Product</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5"><Label className="text-xs">Name *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Product name" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Product description" rows={2} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Category *</Label><Select value={newCategory} onValueChange={v => setNewCategory(v as Category)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['Uniforms','Stationery','Textbooks','Sports Equipment','Accessories','Other'] as Category[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-1.5"><Label className="text-xs">Currency</Label><Select value={newCurrency} onValueChange={v => setNewCurrency(v as Currency)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="ZiG">ZiG</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Price *</Label><Input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Stock *</Label><Input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} placeholder="0" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Sizes (comma-separated)</Label><Input value={newSizes} onChange={e => setNewSizes(e.target.value)} placeholder="S, M, L, XL" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Colors (comma-separated)</Label><Input value={newColors} onChange={e => setNewColors(e.target.value)} placeholder="Navy, White" /></div>
                    <div className="flex items-center gap-2"><Switch checked={newActive} onCheckedChange={setNewActive} /><Label className="text-xs">Active</Label></div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddProduct}>Add Product</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Product Grid/List */}
          {viewMode === 'grid' ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <motion.div key={product.id} variants={itemVariants}>
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
                    <div className={cn('h-32 flex items-center justify-center relative', product.category === 'Uniforms' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30' : product.category === 'Stationery' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30' : product.category === 'Textbooks' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30' : product.category === 'Sports Equipment' ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30' : product.category === 'Accessories' ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30' : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30')}>
                      {product.category === 'Uniforms' ? <Shirt className="h-12 w-12 text-emerald-400 dark:text-emerald-600 group-hover:scale-110 transition-transform" /> : product.category === 'Textbooks' ? <BookOpen className="h-12 w-12 text-blue-400 dark:text-blue-600 group-hover:scale-110 transition-transform" /> : <Package className="h-12 w-12 text-muted-foreground/40 group-hover:scale-110 transition-transform" />}
                      <Badge className={cn('absolute top-2 right-2 text-[10px]', categoryColors[product.category])}>
                        {product.category}
                      </Badge>
                      {!product.active && <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">Inactive</Badge>}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-emerald-600">${product.price.toFixed(2)}</span>
                        {product.currency === 'ZiG' && <Badge variant="outline" className="text-[10px]">ZiG</Badge>}
                      </div>
                      {/* Stock Level */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge className={cn('text-[10px]', getStockStatusColor(getStockStatus(product.stock)))}>{getStockStatus(product.stock)}</Badge>
                          <span className="text-xs text-muted-foreground">{product.stock} units</span>
                        </div>
                        <Progress value={Math.min((product.stock / 100) * 100, 100)} className={cn('h-1.5', getStockStatus(product.stock) === 'Out of Stock' ? '[&>div]:bg-red-500' : getStockStatus(product.stock) === 'Low Stock' ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')} />
                      </div>
                      {/* Sizes & Colors */}
                      {(product.sizes.length > 0 || product.colors.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.slice(0, 5).map(s => <Badge key={s} variant="outline" className="text-[9px] h-5">{s}</Badge>)}
                          {product.sizes.length > 5 && <Badge variant="outline" className="text-[9px] h-5">+{product.sizes.length - 5}</Badge>}
                          {product.colors.map(c => <Badge key={c} variant="outline" className="text-[9px] h-5">{c}</Badge>)}
                        </div>
                      )}
                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-1 border-t">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => openEditDialog(product)}><Pencil className="h-3 w-3" /> Edit</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-500 hover:text-red-700 flex-1" onClick={() => openDeleteConfirm(product.id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sizes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge className={cn('text-[10px]', categoryColors[product.category])}>{product.category}</Badge></TableCell>
                        <TableCell className="font-semibold">${product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell><Badge className={cn('text-[10px]', getStockStatusColor(getStockStatus(product.stock)))}>{getStockStatus(product.stock)}</Badge></TableCell>
                        <TableCell><div className="flex gap-1 flex-wrap">{product.sizes.slice(0, 3).map(s => <Badge key={s} variant="outline" className="text-[9px] h-5">{s}</Badge>)}{product.sizes.length > 3 && <span className="text-xs text-muted-foreground">+{product.sizes.length - 3}</span>}</div></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(product)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => openDeleteConfirm(product.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No products found matching your search.</p>
            </div>
          )}
        </TabsContent>

        {/* ═══ ORDERS TAB ═══════════════════════════════════════════════════════ */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-1 flex-wrap">
              {(['All', 'Pending', 'Processing', 'Ready', 'Collected', 'Cancelled'] as (OrderStatus | 'All')[]).map(status => (
                <Button key={status} variant={orderStatusFilter === status ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', orderStatusFilter === status && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setOrderStatusFilter(status)}>
                  {status}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{filteredOrders.length} orders</p>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedOrder(order); setOrderDetailOpen(true) }}>
                      <TableCell className="font-mono text-xs font-semibold">{order.orderNumber}</TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.phone}</TableCell>
                      <TableCell className="text-xs">{order.items.length} item{order.items.length > 1 ? 's' : ''}</TableCell>
                      <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] gap-1', getOrderStatusColor(order.status))}>
                          {getOrderStatusIcon(order.status)} {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedOrder(order); setOrderDetailOpen(true) }}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteOrder(order.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No orders found with this filter.</p>
            </div>
          )}
        </TabsContent>

        {/* ═══ UNIFORMS TAB ═════════════════════════════════════════════════════ */}
        <TabsContent value="uniforms" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 flex-wrap">
              {(['All', 'Boys', 'Girls', 'Unisex'] as (Gender | 'All')[]).map(g => (
                <Button key={g} variant={uniformGenderFilter === g ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', uniformGenderFilter === g && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setUniformGenderFilter(g)}>
                  {g}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['All', 'Summer', 'Winter', 'All Season'] as (Season | 'All')[]).map(s => (
                <Button key={s} variant={uniformSeasonFilter === s ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', uniformSeasonFilter === s && 'bg-teal-600 hover:bg-teal-700')} onClick={() => setUniformSeasonFilter(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUniforms.map(uniform => {
              const totalStock = Object.values(uniform.stockBySize).reduce((a, b) => a + b, 0)
              const maxStock = Math.max(...Object.values(uniform.stockBySize), 1)
              return (
                <motion.div key={uniform.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Shirt className="h-4 w-4 text-emerald-600" /> {uniform.type}
                        </CardTitle>
                        <div className="flex gap-1.5">
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{uniform.gender}</Badge>
                          <Badge variant="outline" className="text-[10px]">{uniform.season}</Badge>
                        </div>
                      </div>
                      <CardDescription>Total stock: {totalStock} units</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Size Matrix */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs h-8">Size</TableHead>
                              {uniform.sizes.map(size => <TableHead key={size} className="text-xs text-center h-8">{size}</TableHead>)}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-xs font-medium">Stock</TableCell>
                              {uniform.sizes.map(size => {
                                const stock = uniform.stockBySize[size] || 0
                                return (
                                  <TableCell key={size} className="text-center p-1">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={cn('text-sm font-semibold', stock === 0 ? 'text-red-500' : stock <= 5 ? 'text-amber-600' : 'text-emerald-600')}>
                                        {stock}
                                      </span>
                                      <div className="w-full max-w-[40px] bg-muted rounded-full h-1.5">
                                        <div className={cn('h-1.5 rounded-full', stock === 0 ? 'bg-red-400' : stock <= 5 ? 'bg-amber-400' : 'bg-emerald-400')} style={{ width: `${Math.max((stock / maxStock) * 100, 2)}%` }} />
                                      </div>
                                    </div>
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* ═══ REPORTS TAB ═══════════════════════════════════════════════════════ */}
        <TabsContent value="reports" className="space-y-4">
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Today's Sales", value: `$${todayRevenue.toFixed(2)}`, count: todayOrders.length, icon: DollarSign, color: 'emerald' },
              { label: 'This Week', value: `$${weekRevenue.toFixed(2)}`, count: weekOrders.length, icon: TrendingUp, color: 'teal' },
              { label: 'This Month', value: `$${totalRevenue.toFixed(2)}`, count: orders.filter(o => o.status !== 'Cancelled').length, icon: BarChart3, color: 'amber' },
            ].map(stat => (
              <Card key={stat.label} className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.count} orders</p>
                    </div>
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/30' : stat.color === 'teal' ? 'bg-teal-50 dark:bg-teal-900/30' : 'bg-amber-50 dark:bg-amber-900/30')}>
                      <stat.icon className={cn('h-5 w-5', stat.color === 'emerald' ? 'text-emerald-600' : stat.color === 'teal' ? 'text-teal-600' : 'text-amber-600')} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Selling Products */}
            <SectionCard title="Top Selling Products" icon={Star} contentClassName="space-y-3">
                {topSellers.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white', idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-muted text-muted-foreground')}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} sold</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">${item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </SectionCard>

            {/* Revenue by Category */}
            <SectionCard title="Revenue by Category" description="Stock value distribution">
                <ChartContainer config={categoryChartConfig} className="h-[260px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={55} strokeWidth={2} stroke="var(--background)">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </SectionCard>
          </div>

          {/* Stock Value Summary */}
          <SectionCard
            title="Stock Value Summary"
            icon={Package}
            actions={
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            }
            noPadding
          >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Total Stock</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Low/Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(['Uniforms','Stationery','Textbooks','Sports Equipment','Accessories','Other'] as Category[]).map(cat => {
                    const catProducts = products.filter(p => p.category === cat)
                    const catStock = catProducts.reduce((s, p) => s + p.stock, 0)
                    const catValue = catProducts.reduce((s, p) => s + p.price * p.stock, 0)
                    const catAlerts = catProducts.filter(p => p.stock <= 10).length
                    return (
                      <TableRow key={cat}>
                        <TableCell><Badge className={cn('text-[10px]', categoryColors[cat])}>{cat}</Badge></TableCell>
                        <TableCell>{catProducts.length}</TableCell>
                        <TableCell>{catStock}</TableCell>
                        <TableCell className="font-semibold">${catValue.toFixed(2)}</TableCell>
                        <TableCell>{catAlerts > 0 ? <Badge variant="destructive" className="text-[10px]">{catAlerts}</Badge> : <span className="text-xs text-muted-foreground">0</span>}</TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell>{products.length}</TableCell>
                    <TableCell>{products.reduce((s, p) => s + p.stock, 0)}</TableCell>
                    <TableCell>${totalStockValue.toFixed(2)}</TableCell>
                    <TableCell>{lowStockProducts.length + outOfStockProducts.length}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </SectionCard>
        </TabsContent>

        {/* ═══ SETTINGS TAB ══════════════════════════════════════════════════════ */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shop Details */}
            <SectionCard title="Shop Details" icon={ShoppingBag} contentClassName="space-y-4">
                <div className="space-y-1.5"><Label className="text-xs">Shop Name</Label><Input value={shopName} onChange={e => setShopName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea value={shopDescription} onChange={e => setShopDescription(e.target.value)} rows={2} /></div>
              </SectionCard>

            {/* Payment Methods */}
            <SectionCard title="Payment Methods" icon={DollarSign} contentClassName="space-y-3">
                {(['Cash', 'EcoCash', 'ZiG', 'Bank Transfer'] as PaymentMethod[]).map(method => (
                  <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', method === 'Cash' ? 'bg-emerald-50 dark:bg-emerald-900/30' : method === 'EcoCash' ? 'bg-green-50 dark:bg-green-900/30' : method === 'ZiG' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-blue-50 dark:bg-blue-900/30')}>
                        <DollarSign className={cn('h-4 w-4', method === 'Cash' ? 'text-emerald-600' : method === 'EcoCash' ? 'text-green-600' : method === 'ZiG' ? 'text-amber-600' : 'text-blue-600')} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{method}</p>
                        <p className="text-xs text-muted-foreground">{method === 'EcoCash' ? 'Mobile money' : method === 'ZiG' ? 'Zimbabwe Gold' : method === 'Bank Transfer' ? 'RTGS/Telegraphic' : 'Physical cash'}</p>
                      </div>
                    </div>
                    <Switch checked={paymentMethods[method]} onCheckedChange={v => setPaymentMethods(prev => ({ ...prev, [method]: v }))} />
                  </div>
                ))}
              </SectionCard>

            {/* Notifications & Thresholds */}
            <SectionCard title="Alerts & Thresholds" icon={AlertTriangle} contentClassName="space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Order Notifications</p><p className="text-xs text-muted-foreground">Get notified for new orders</p></div>
                  <Switch checked={orderNotifications} onCheckedChange={setOrderNotifications} />
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">Low Stock Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="max-w-[100px]" />
                    <span className="text-xs text-muted-foreground">units</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Products below this count trigger alerts</p>
                </div>
              </SectionCard>

            {/* Tax & Delivery */}
            <SectionCard title="Tax & Delivery" icon={FileText} contentClassName="space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Enable Tax</p><p className="text-xs text-muted-foreground">Apply VAT to shop items</p></div>
                  <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} />
                </div>
                {taxEnabled && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tax Rate (%)</Label>
                    <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="max-w-[120px]" />
                  </div>
                )}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Pickup</p><p className="text-xs text-muted-foreground">Collect at school</p></div>
                    <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Delivery</p><p className="text-xs text-muted-foreground">Deliver to customer</p></div>
                    <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
                  </div>
                </div>
              </SectionCard>
          </div>

          <div className="flex justify-end">
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => toast.success('Shop settings saved successfully')}>
              <CheckCircle2 className="h-4 w-4" /> Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ SHARED DIALOGS ══════════════════════════════════════════════════════ */}

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-emerald-600" /> Order Details</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold">{selectedOrder.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.date}</p>
                </div>
                <Badge className={cn('text-xs gap-1', getOrderStatusColor(selectedOrder.status))}>
                  {getOrderStatusIcon(selectedOrder.status)} {selectedOrder.status}
                </Badge>
              </div>
              <Separator />
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm font-medium">{selectedOrder.customerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium">{selectedOrder.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment</p><p className="text-sm font-medium">{selectedOrder.paymentMethod}</p></div>
              </div>
              <Separator />
              {/* Items */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Items</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">${item.price.toFixed(2)} × {item.quantity}</p>
                      <p className="text-xs font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-emerald-600">${selectedOrder.total.toFixed(2)}</span>
              </div>
              {/* Status Actions */}
              {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Collected' && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === 'Pending' && <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'Processing'); setSelectedOrder({ ...selectedOrder, status: 'Processing' }) }}><Package className="h-3.5 w-3.5" /> Start Processing</Button>}
                    {selectedOrder.status === 'Processing' && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'Ready'); setSelectedOrder({ ...selectedOrder, status: 'Ready' }) }}><CheckCircle2 className="h-3.5 w-3.5" /> Mark Ready</Button>}
                    {selectedOrder.status === 'Ready' && <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'Collected'); setSelectedOrder({ ...selectedOrder, status: 'Collected' }) }}><Truck className="h-3.5 w-3.5" /> Mark Collected</Button>}
                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 gap-1" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'Cancelled'); setSelectedOrder({ ...selectedOrder, status: 'Cancelled' }) }}><XCircle className="h-3.5 w-3.5" /> Cancel</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5"><Label className="text-xs">Name *</Label><Input value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Category</Label><Select value={editingProduct.category} onValueChange={v => setEditingProduct({ ...editingProduct, category: v as Category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['Uniforms','Stationery','Textbooks','Sports Equipment','Accessories','Other'] as Category[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-xs">Currency</Label><Select value={editingProduct.currency} onValueChange={v => setEditingProduct({ ...editingProduct, currency: v as Currency })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="ZiG">ZiG</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Price</Label><Input type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Stock</Label><Input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Sizes (comma-separated)</Label><Input value={editingProduct.sizes.join(', ')} onChange={e => setEditingProduct({ ...editingProduct, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Colors (comma-separated)</Label><Input value={editingProduct.colors.join(', ')} onChange={e => setEditingProduct({ ...editingProduct, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editingProduct.active} onCheckedChange={v => setEditingProduct({ ...editingProduct, active: v })} /><Label className="text-xs">Active</Label></div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleEditProduct}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this product? This action cannot be undone.</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteProduct}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
