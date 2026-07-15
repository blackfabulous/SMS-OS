'use client'

import { ModulePageLayout, ModuleSettingsButton, StatGrid, ModuleStatCard, SectionCard } from '@/components/module-ui';
import React, { useState } from 'react'
import { useApiQuery, useApiMutation, useQueryClient } from '@/hooks/use-api-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bus,
  Car,
  Route,
  Users,
  MapPin,
  Plus,
  Search,
  Loader2,
  ShieldCheck,
  Calendar,
  DollarSign,
  ArrowLeft,
  Settings,
  Save,
  Navigation,
  Fuel,
  Clock,
  ToggleLeft,
  FileDown,
  Bell,
} from 'lucide-react'
import {
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add-route' | 'add-vehicle' | 'add-assignment' | 'detail-route' | 'detail-vehicle' | 'settings'

interface TransportRouteType {
  id: string
  name: string
  description: string | null
  fee: number
  capacity: number
  isActive: boolean
  assignments: Array<{
    id: string
    pickupPoint: string | null
    dropoffPoint: string | null
    status: string
    student: {
      id: string
      firstName: string
      lastName: string
      studentNumber: string
      gender: string
    }
  }>
}

interface Vehicle {
  id: string
  registrationNumber: string
  make: string | null
  model: string | null
  year: number | null
  capacity: number | null
  driverName: string | null
  isActive: boolean
}

interface TransportAssignment {
  id: string
  pickupPoint: string | null
  dropoffPoint: string | null
  startDate: string
  status: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentNumber: string
    gender: string
  }
  route: {
    id: string
    name: string
    fee: number
    description: string | null
  }
}

interface TransportData {
  routes: TransportRouteType[]
  vehicles: Vehicle[]
  stats: {
    totalRoutes: number
    totalVehicles: number
    studentsOnTransport: number
    totalFeeRevenue: number
  }
  routeStats: Array<{
    id: string
    name: string
    fee: number
    capacity: number
    studentCount: number
    occupancyRate: string
  }>
  assignments: TransportAssignment[]
}

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
}

interface StudentsResponse {
  data: Student[]
  total: number
  page: number
  totalPages: number
}

// ─── Chart Config ────────────────────────────────────────────────────────────

const routeChartConfig = {
  students: { label: 'Students', color: '#10b981' },
  capacity: { label: 'Capacity', color: '#d1d5db' },
} satisfies ChartConfig

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

const getCapacityColor = (current: number, capacity: number) => {
  const rate = capacity > 0 ? current / capacity : 0
  if (rate >= 1) return 'from-red-400 to-red-500'
  if (rate >= 0.8) return 'from-amber-400 to-amber-500'
  return 'from-emerald-400 to-teal-500'
}

// ─── Transport Module ────────────────────────────────────────────────────────

export default function TransportModule() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  // Forms
  const [assignForm, setAssignForm] = useState({ studentId: '', routeId: '', pickupPoint: '', dropoffPoint: '' })
  const [routeForm, setRouteForm] = useState({ name: '', description: '', fee: '0', capacity: '50' })
  const [vehicleForm, setVehicleForm] = useState({ registrationNumber: '', make: '', model: '', year: '', capacity: '', driverName: '' })

  // Settings
  const [settings, setSettings] = useState({
    defaultRoute: '',
    feeCalcMethod: 'FIXED',
    vehicleTracking: true,
    routeOptimization: false,
    scheduleDefault: '07:00',
    showInactiveRoutes: false,
    notifyDelay: true,
    notifyRouteChange: true,
    exportFormat: 'CSV',
  })

  const { toast } = useToast()

  // ─── Data & Mutations ──────────────────────────────────────────────────

  const {
    data,
    isPending: loading,
  } = useApiQuery<TransportData>(['transport'], '/api/transport')

  const {
    data: studentsData,
  } = useApiQuery<StudentsResponse>(['students', 'transport'], '/api/students?limit=200', { enabled: viewMode === 'add-assignment' })

  const students = studentsData?.data ?? []

  const { mutate: assignStudent, isPending: isAssigning } = useApiMutation<
    { action: 'assign'; studentId: string; routeId: string; pickupPoint?: string; dropoffPoint?: string },
    TransportAssignment
  >('/api/transport', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport'] })
      setAssignForm({ studentId: '', routeId: '', pickupPoint: '', dropoffPoint: '' })
      setViewMode('list')
      toast({ title: 'Route assigned', description: 'Student has been assigned to the transport route.' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message || 'Failed to assign route', variant: 'destructive' }),
  })

  const { mutate: addRoute, isPending: isAddingRoute } = useApiMutation<
    { action: 'addRoute'; name: string; description?: string; fee: number; capacity: number },
    TransportRouteType
  >('/api/transport', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport'] })
      setRouteForm({ name: '', description: '', fee: '0', capacity: '50' })
      setViewMode('list')
      toast({ title: 'Route added', description: 'New transport route has been created.' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message || 'Failed to add route', variant: 'destructive' }),
  })

  const { mutate: addVehicle, isPending: isAddingVehicle } = useApiMutation<
    { action: 'addVehicle'; registrationNumber: string; make?: string; model?: string; year?: number; capacity?: number; driverName?: string },
    Vehicle
  >('/api/transport', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport'] })
      setVehicleForm({ registrationNumber: '', make: '', model: '', year: '', capacity: '', driverName: '' })
      setViewMode('list')
      toast({ title: 'Vehicle added', description: 'New vehicle has been registered.' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message || 'Failed to add vehicle', variant: 'destructive' }),
  })

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleAssign = () => {
    if (!assignForm.studentId || !assignForm.routeId) return
    assignStudent({
      action: 'assign',
      studentId: assignForm.studentId,
      routeId: assignForm.routeId,
      pickupPoint: assignForm.pickupPoint || undefined,
      dropoffPoint: assignForm.dropoffPoint || undefined,
    })
  }

  const handleAddRoute = () => {
    if (!routeForm.name) return
    addRoute({
      action: 'addRoute',
      name: routeForm.name,
      description: routeForm.description || undefined,
      fee: parseFloat(routeForm.fee) || 0,
      capacity: parseInt(routeForm.capacity) || 50,
    })
  }

  const handleAddVehicle = () => {
    if (!vehicleForm.registrationNumber) return
    addVehicle({
      action: 'addVehicle',
      registrationNumber: vehicleForm.registrationNumber,
      make: vehicleForm.make || undefined,
      model: vehicleForm.model || undefined,
      year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
      capacity: vehicleForm.capacity ? parseInt(vehicleForm.capacity) : undefined,
      driverName: vehicleForm.driverName || undefined,
    })
  }

  const handleSaveSettings = () => {
    toast({ title: 'Settings saved', description: 'Transport settings have been updated.' })
  }

  // ─── Chart Data ────────────────────────────────────────────────────────

  const routeChartData = data
    ? data.routeStats.map((r) => ({
        name: r.name.length > 14 ? r.name.slice(0, 14) + '...' : r.name,
        students: r.studentCount,
        capacity: r.capacity,
      }))
    : []

  const filteredAssignments = (data?.assignments || []).filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      `${a.student.firstName} ${a.student.lastName}`.toLowerCase().includes(q) ||
      a.student.studentNumber.toLowerCase().includes(q) ||
      a.route.name.toLowerCase().includes(q)
    )
  })

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 bg-muted animate-pulse rounded" />
          <div className="h-10 w-44 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  const stats = data?.stats

  // ─── Inline Views ──────────────────────────────────────────────────────

  // Add Route Form
  if (viewMode === 'add-route') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">Add Transport Route</h2>
            <p className="text-sm text-muted-foreground">Create a new transport route for students</p>
          </div>
        </div>
        <Card className="border-0 shadow-md max-w-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label>Route Name *</Label>
              <Input placeholder="e.g., Budiriro Route" value={routeForm.name} onChange={(e) => setRouteForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="Route description and stops..." value={routeForm.description} onChange={(e) => setRouteForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Fee (USD)</Label>
                <Input type="number" min="0" placeholder="0.00" value={routeForm.fee} onChange={(e) => setRouteForm((p) => ({ ...p, fee: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-cyan-500" /> Capacity</Label>
                <Input type="number" min="1" placeholder="50" value={routeForm.capacity} onChange={(e) => setRouteForm((p) => ({ ...p, capacity: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleAddRoute} disabled={isAddingRoute || !routeForm.name} className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white">
                {isAddingRoute && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Route
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Add Vehicle Form
  if (viewMode === 'add-vehicle') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">Register Vehicle</h2>
            <p className="text-sm text-muted-foreground">Add a new vehicle to the school fleet</p>
          </div>
        </div>
        <Card className="border-0 shadow-md max-w-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label>Registration Number *</Label>
              <Input placeholder="e.g., ABE 1234" value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm((p) => ({ ...p, registrationNumber: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Make</Label>
                <Input placeholder="e.g., Toyota" value={vehicleForm.make} onChange={(e) => setVehicleForm((p) => ({ ...p, make: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Model</Label>
                <Input placeholder="e.g., Coaster" value={vehicleForm.model} onChange={(e) => setVehicleForm((p) => ({ ...p, model: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Year</Label>
                <Input type="number" placeholder="2024" value={vehicleForm.year} onChange={(e) => setVehicleForm((p) => ({ ...p, year: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-cyan-500" /> Seating Capacity</Label>
                <Input type="number" min="1" placeholder="50" value={vehicleForm.capacity} onChange={(e) => setVehicleForm((p) => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><Bus className="h-3.5 w-3.5 text-emerald-500" /> Driver Name</Label>
                <Input placeholder="Driver's full name" value={vehicleForm.driverName} onChange={(e) => setVehicleForm((p) => ({ ...p, driverName: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleAddVehicle} disabled={isAddingVehicle || !vehicleForm.registrationNumber} className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white">
                {isAddingVehicle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Register Vehicle
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Add Assignment Form
  if (viewMode === 'add-assignment') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">Assign Transport Route</h2>
            <p className="text-sm text-muted-foreground">Assign a student to a transport route</p>
          </div>
        </div>
        <Card className="border-0 shadow-md max-w-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label>Student *</Label>
              <Select value={assignForm.studentId} onValueChange={(v) => setAssignForm((p) => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Search and select student..." /></SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Route *</Label>
              <Select value={assignForm.routeId} onValueChange={(v) => setAssignForm((p) => ({ ...p, routeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select route..." /></SelectTrigger>
                <SelectContent>
                  {data?.routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({formatCurrency(r.fee)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> Pickup Point</Label>
                <Input placeholder="e.g., Budiriro 5" value={assignForm.pickupPoint} onChange={(e) => setAssignForm((p) => ({ ...p, pickupPoint: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-red-400" /> Dropoff Point</Label>
                <Input placeholder="e.g., School Gate" value={assignForm.dropoffPoint} onChange={(e) => setAssignForm((p) => ({ ...p, dropoffPoint: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleAssign} disabled={isAssigning || !assignForm.studentId || !assignForm.routeId} className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white">
                {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Assign Route
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Route Detail
  if (viewMode === 'detail-route' && selectedRouteId) {
    const route = data?.routes.find((r) => r.id === selectedRouteId)
    if (!route) return null
    const rate = route.capacity > 0 ? (route.assignments.length / route.capacity) * 100 : 0
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">{route.name}</h2>
            <p className="text-sm text-muted-foreground">Route details and assigned students</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fee</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(route.fee)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Occupancy</p>
              <p className="text-2xl font-bold mt-1">{route.assignments.length}/{route.capacity}</p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-2">
                <div className={cn('h-full rounded-full bg-gradient-to-r', getCapacityColor(route.assignments.length, route.capacity))} style={{ width: `${Math.min(rate, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <Badge className={cn('mt-2', route.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200')}>
                {route.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>
        </div>
        {route.description && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm">{route.description}</p>
            </CardContent>
          </Card>
        )}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Assigned Students ({route.assignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {route.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No students assigned to this route yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Dropoff</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {route.assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.student.firstName} {a.student.lastName}</TableCell>
                      <TableCell className="text-sm">{a.pickupPoint || '—'}</TableCell>
                      <TableCell className="text-sm">{a.dropoffPoint || '—'}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Settings View
  if (viewMode === 'settings') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-cyan-500" /> Transport Settings</h2>
            <p className="text-sm text-muted-foreground">Configure transport module preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Default Route & Fee */}
          <SectionCard title="Route Defaults" icon={Navigation} contentClassName="space-y-4">
              <div className="grid gap-2">
                <Label>Default Route for New Assignments</Label>
                <Select value={settings.defaultRoute} onValueChange={(v) => setSettings((p) => ({ ...p, defaultRoute: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select default route..." /></SelectTrigger>
                  <SelectContent>
                    {data?.routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Fee Calculation Method</Label>
                <Select value={settings.feeCalcMethod} onValueChange={(v) => setSettings((p) => ({ ...p, feeCalcMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed per Route</SelectItem>
                    <SelectItem value="DISTANCE">Distance-based</SelectItem>
                    <SelectItem value="ZONAL">Zonal Pricing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Default Departure Time</Label>
                <Input type="time" value={settings.scheduleDefault} onChange={(e) => setSettings((p) => ({ ...p, scheduleDefault: e.target.value }))} />
              </div>
            </SectionCard>

          {/* Vehicle & Tracking */}
          <SectionCard title="Vehicle & Tracking" icon={Bus} contentClassName="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Vehicle GPS Tracking</Label>
                  <p className="text-xs text-muted-foreground">Track vehicle locations in real-time</p>
                </div>
                <Switch checked={settings.vehicleTracking} onCheckedChange={(v) => setSettings((p) => ({ ...p, vehicleTracking: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Route Optimization</Label>
                  <p className="text-xs text-muted-foreground">Auto-optimize routes for efficiency</p>
                </div>
                <Switch checked={settings.routeOptimization} onCheckedChange={(v) => setSettings((p) => ({ ...p, routeOptimization: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Inactive Routes</Label>
                  <p className="text-xs text-muted-foreground">Display deactivated routes in lists</p>
                </div>
                <Switch checked={settings.showInactiveRoutes} onCheckedChange={(v) => setSettings((p) => ({ ...p, showInactiveRoutes: v }))} />
              </div>
            </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications" icon={Bell} contentClassName="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Delay Notifications</Label>
                  <p className="text-xs text-muted-foreground">Notify parents of transport delays</p>
                </div>
                <Switch checked={settings.notifyDelay} onCheckedChange={(v) => setSettings((p) => ({ ...p, notifyDelay: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Route Change Alerts</Label>
                  <p className="text-xs text-muted-foreground">Alert on route or schedule changes</p>
                </div>
                <Switch checked={settings.notifyRouteChange} onCheckedChange={(v) => setSettings((p) => ({ ...p, notifyRouteChange: v }))} />
              </div>
            </SectionCard>

          {/* Export */}
          <SectionCard title="Export Settings" icon={FileDown} contentClassName="space-y-4">
              <div className="grid gap-2">
                <Label>Default Export Format</Label>
                <Select value={settings.exportFormat} onValueChange={(v) => setSettings((p) => ({ ...p, exportFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EXCEL">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full">
                <FileDown className="mr-2 h-4 w-4" /> Export Transport Data
              </Button>
            </SectionCard>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </motion.div>
    )
  }

  // ─── Main List View ────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
<ModulePageLayout
        actions={<>
          <Button className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow-md" onClick={() => setViewMode('add-assignment')}>
            <Plus className="mr-2 h-4 w-4" /> Assign Route
          </Button>
          <ModuleSettingsButton onClick={() => setViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <StatGrid cols={4}>
            <ModuleStatCard icon={Route} label="Total Routes" value={stats?.totalRoutes || 0} accentGradient="from-cyan-400 to-teal-500" bgColor="bg-cyan-50 dark:bg-cyan-950/40" iconColor="text-cyan-600 dark:text-cyan-400" hint="Active routes" index={0} />
            <ModuleStatCard icon={Car} label="Vehicles" value={stats?.totalVehicles || 0} accentGradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600 dark:text-emerald-400" hint="In fleet" index={1} />
            <ModuleStatCard icon={Users} label="Students on Transport" value={stats?.studentsOnTransport || 0} accentGradient="from-teal-400 to-emerald-500" bgColor="bg-teal-50 dark:bg-teal-950/40" iconColor="text-teal-600 dark:text-teal-400" hint="Using school transport" index={2} />
            <ModuleStatCard icon={DollarSign} label="Fee Revenue" value={formatCurrency(stats?.totalFeeRevenue || 0)} accentGradient="from-amber-400 to-orange-500" bgColor="bg-amber-50 dark:bg-amber-950/40" iconColor="text-amber-600 dark:text-amber-400" hint="Total expected" index={3} />
          </StatGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Route Capacity" description="Students per route vs capacity">
                {routeChartData.length > 0 ? (
                  <ChartContainer config={routeChartConfig} className="h-[260px] w-full">
                    <BarChart data={routeChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="capacity" fill="var(--color-capacity)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No route data available</div>
                )}
              </SectionCard>
            <SectionCard title="Route Map" description="School transport route overview">
                <div className="h-[260px] flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-200">
                  <MapPin className="h-12 w-12 text-emerald-300 mb-3" />
                  <p className="text-sm font-medium text-emerald-600">Route Map View</p>
                  <p className="text-xs text-muted-foreground mt-1">Interactive map coming soon</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {data?.routes.slice(0, 4).map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-[10px]">{r.name}</Badge>
                    ))}
                  </div>
                </div>
              </SectionCard>
          </div>
        </TabsContent>

        {/* ─── Routes Tab ───────────────────────────────────────────────── */}
        <TabsContent value="routes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setViewMode('add-route')} className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Route
            </Button>
          </div>
          {data?.routes.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4"><Route className="h-8 w-8 text-muted-foreground" /></div>
                <p className="text-sm font-medium text-muted-foreground">No transport routes configured</p>
                <Button className="mt-4" onClick={() => setViewMode('add-route')}>Add First Route</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data?.routes.map((route) => {
                const r = route.capacity > 0 ? (route.assignments.length / route.capacity) * 100 : 0
                return (
                  <Card key={route.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer" onClick={() => { setSelectedRouteId(route.id); setViewMode('detail-route') }}>
                    <div className={cn('h-2', r >= 100 ? 'bg-gradient-to-r from-red-400 to-red-500' : r >= 80 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500')} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div><CardTitle className="text-base font-semibold">{route.name}</CardTitle>{route.description && <CardDescription>{route.description}</CardDescription>}</div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 border">{formatCurrency(route.fee)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">Capacity</span>
                          <span className="text-xs font-medium">{route.assignments.length}/{route.capacity}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full bg-gradient-to-r', getCapacityColor(route.assignments.length, route.capacity))} style={{ width: `${Math.min(r, 100)}%` }} />
                        </div>
                      </div>
                      {route.assignments.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Pickup Points:</p>
                          <div className="flex flex-wrap gap-1">
                            {route.assignments.filter((a) => a.pickupPoint).slice(0, 6).map((a) => (
                              <Badge key={a.id} variant="secondary" className="text-[10px] px-1.5 py-0">{a.pickupPoint}</Badge>
                            ))}
                            {route.assignments.filter((a) => a.pickupPoint).length > 6 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{route.assignments.filter((a) => a.pickupPoint).length - 6} more</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Vehicles Tab ─────────────────────────────────────────────── */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setViewMode('add-vehicle')} className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
          </div>
          <SectionCard title="Vehicle Registry" description="School fleet overview">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Registration</TableHead><TableHead>Vehicle</TableHead><TableHead>Capacity</TableHead><TableHead>Driver</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50"><Bus className="h-4 w-4 text-cyan-600" /></div>
                            <span className="font-mono text-sm font-semibold">{vehicle.registrationNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{vehicle.make || '\u2014'} {vehicle.model || ''}{vehicle.year && <span className="text-muted-foreground ml-1">({vehicle.year})</span>}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px] px-1.5 py-0">{vehicle.capacity || '\u2014'} seats</Badge></TableCell>
                        <TableCell className="text-sm">{vehicle.driverName || '\u2014'}</TableCell>
                        <TableCell><Badge className={cn('text-[10px] px-2 py-0.5 border', vehicle.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200')}>{vehicle.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {data?.vehicles.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No vehicles registered</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
        </TabsContent>

        {/* ─── Students Tab ─────────────────────────────────────────────── */}
        <TabsContent value="students" className="space-y-4">
          <SectionCard
            title="Students on Transport"
            description={`${filteredAssignments.length} students using school transport`}
            actions={
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            }
          >
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Student</TableHead><TableHead>Route</TableHead><TableHead>Pickup</TableHead><TableHead>Dropoff</TableHead><TableHead>Fee</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold">{a.student.firstName[0]}{a.student.lastName[0]}</div>
                            <div><p className="text-sm font-medium">{a.student.firstName} {a.student.lastName}</p><p className="text-xs text-muted-foreground">{a.student.studentNumber}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{a.route.name}</TableCell>
                        <TableCell><div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-emerald-500" /><span className="text-sm">{a.pickupPoint || '\u2014'}</span></div></TableCell>
                        <TableCell><div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-400" /><span className="text-sm">{a.dropoffPoint || '\u2014'}</span></div></TableCell>
                        <TableCell className="text-sm font-semibold">{formatCurrency(a.route.fee)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredAssignments.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">{search ? 'No students match your search' : 'No students assigned to transport yet'}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
        </TabsContent>
      </ModulePageLayout>
    </motion.div>
  )
}
