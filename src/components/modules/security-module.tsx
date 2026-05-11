'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  AlertTriangle,
  DoorOpen,
  Clock,
  Plus,
  Search,
  MapPin,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Car,
  FileText,
  Lock,
  Unlock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Visitor {
  id: string
  name: string
  idNumber: string
  purpose: string
  hostPerson: string
  vehicleReg: string
  timeIn: string
  timeOut: string | null
  status: 'On Campus' | 'Checked Out'
  phone: string
}

interface AccessPoint {
  id: string
  name: string
  type: string
  status: 'Active' | 'Restricted' | 'Locked'
  authorizedRoles: string[]
  lastActivity: string
  todayCount: number
}

interface SecurityIncident {
  id: string
  type: 'Unauthorized Access' | 'Property Damage' | 'Theft' | 'Disturbance' | 'Other'
  location: string
  date: string
  description: string
  status: 'Open' | 'Under Investigation' | 'Resolved' | 'Closed'
  reporter: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockVisitors: Visitor[] = [
  { id: '1', name: 'Mrs. Chido Ndlovu', idNumber: '63-123456A78', purpose: 'Parent-Teacher Meeting', hostPerson: 'Mr. Moyo (Deputy Head)', vehicleReg: 'ABZ 1234', timeIn: '08:30', timeOut: null, status: 'On Campus', phone: '+263 77 123 4567' },
  { id: '2', name: 'Mr. James Smith', idNumber: '12-987654B32', purpose: 'Delivery - Textbooks', hostPerson: 'Mrs. Dube (Bursar)', vehicleReg: 'DEF 5678', timeIn: '09:15', timeOut: '10:00', status: 'Checked Out', phone: '+263 71 987 6543' },
  { id: '3', name: 'Dr. Grace Mutasa', idNumber: '45-555666C44', purpose: 'MOESD Inspector Visit', hostPerson: 'Mr. Hove (Headmaster)', vehicleReg: 'GVT 0001', timeIn: '10:00', timeOut: null, status: 'On Campus', phone: '+263 73 555 6667' },
  { id: '4', name: 'Ms. Tariro Gumbo', idNumber: '78-222333D55', purpose: 'SDC Committee Meeting', hostPerson: 'Mr. Chikumbu (SDC Chair)', vehicleReg: '', timeIn: '14:00', timeOut: null, status: 'On Campus', phone: '+263 77 222 3334' },
  { id: '5', name: 'Mr. Peter Zvambe', idNumber: '23-444555E66', purpose: 'Plumbing Repairs', hostPerson: 'Mr. Tafara (Maintenance)', vehicleReg: 'WRK 9012', timeIn: '07:45', timeOut: '12:30', status: 'Checked Out', phone: '+263 78 444 5556' },
  { id: '6', name: 'Mrs. Rumbi Kazembe', idNumber: '56-777888F77', purpose: 'Collect Sick Child', hostPerson: 'Sister Bvirindi (Sick Bay)', vehicleReg: 'JKL 3456', timeIn: '11:20', timeOut: '11:45', status: 'Checked Out', phone: '+263 77 777 8889' },
  { id: '7', name: 'Mr. Tendai Machingaidze', idNumber: '89-111222G88', purpose: 'Internet Installation', hostPerson: 'Mr. Kufa (IT Dept)', vehicleReg: 'TEL 7890', timeIn: '13:00', timeOut: null, status: 'On Campus', phone: '+263 71 111 2223' },
  { id: '8', name: 'Ms. Netsai Shumba', idNumber: '34-333444H99', purpose: 'Library Book Donation', hostPerson: 'Mrs. Mlambo (Librarian)', vehicleReg: '', timeIn: '09:30', timeOut: '10:15', status: 'Checked Out', phone: '+263 73 333 4445' },
]

const mockAccessPoints: AccessPoint[] = [
  { id: '1', name: 'Main Gate', type: 'Gate', status: 'Active', authorizedRoles: ['All Staff', 'Registered Visitors', 'Students'], lastActivity: '2 min ago', todayCount: 47 },
  { id: '2', name: 'Admin Block Entrance', type: 'Door', status: 'Active', authorizedRoles: ['Admin Staff', 'Management', 'Visitors with Pass'], lastActivity: '5 min ago', todayCount: 23 },
  { id: '3', name: 'Dormitory Gate', type: 'Gate', status: 'Restricted', authorizedRoles: ['Boarding Staff', 'Boarding Students', 'Prefects on Duty'], lastActivity: '15 min ago', todayCount: 31 },
  { id: '4', name: 'Staff Room', type: 'Door', status: 'Active', authorizedRoles: ['Teaching Staff', 'Management'], lastActivity: '8 min ago', todayCount: 18 },
  { id: '5', name: 'Computer Lab', type: 'Door', status: 'Locked', authorizedRoles: ['IT Staff', 'Teachers with Booking', 'IT Club Students'], lastActivity: '1 hour ago', todayCount: 12 },
  { id: '6', name: 'Science Lab', type: 'Door', status: 'Active', authorizedRoles: ['Science Teachers', 'Lab Technician', 'Students with Teacher'], lastActivity: '10 min ago', todayCount: 9 },
  { id: '7', name: 'Kitchen / Canteen Area', type: 'Door', status: 'Active', authorizedRoles: ['Canteen Staff', 'Maintenance', 'Bursar'], lastActivity: '3 min ago', todayCount: 15 },
  { id: '8', name: 'Sports Field Gate', type: 'Gate', status: 'Active', authorizedRoles: ['Sports Staff', 'Students with Permission', 'PE Teachers'], lastActivity: '20 min ago', todayCount: 22 },
]

const mockIncidents: SecurityIncident[] = [
  { id: '1', type: 'Unauthorized Access', location: 'Dormitory Gate', date: '2026-02-28', description: 'Unknown individual attempted to enter dormitory area without identification. Security personnel turned them away.', status: 'Resolved', reporter: 'Guard Chikuni', severity: 'Medium' },
  { id: '2', type: 'Property Damage', location: 'Form 2B Classroom', date: '2026-02-27', description: 'Window broken in Form 2B classroom. Suspected vandalism during lunch break.', status: 'Under Investigation', reporter: 'Mr. Gumbo (Class Teacher)', severity: 'Low' },
  { id: '3', type: 'Theft', location: 'Boys Hostel - Room 4', date: '2026-02-25', description: 'Student reported missing mobile phone from dormitory room. Two suspects identified.', status: 'Under Investigation', reporter: 'Tafara Moyo (Student)', severity: 'High' },
  { id: '4', type: 'Disturbance', location: 'Tuck Shop Area', date: '2026-02-24', description: 'Altercation between Form 4 and Form 5 students at tuck shop. No injuries reported. Prefects intervened.', status: 'Resolved', reporter: 'Prefect Chimurenga', severity: 'Medium' },
  { id: '5', type: 'Other', location: 'Main Gate', date: '2026-02-22', description: 'Suspicious package found near main gate. Police notified. Package contained school textbooks from a supplier.', status: 'Closed', reporter: 'Guard Dhliwayo', severity: 'Low' },
  { id: '6', type: 'Unauthorized Access', location: 'Computer Lab', date: '2026-03-01', description: 'Students found in computer lab after hours without teacher supervision. Lab was locked but window left open.', status: 'Open', reporter: 'Mr. Kufa (IT Dept)', severity: 'Medium' },
  { id: '7', type: 'Theft', location: 'Staff Room', date: '2026-03-01', description: 'Petty cash box tampered with. Approximately $15 USD missing from staff tea fund.', status: 'Open', reporter: 'Mrs. Chikumba (Staff Rep)', severity: 'High' },
  { id: '8', type: 'Property Damage', location: 'Sports Field', date: '2026-02-20', description: 'Goal posts damaged during weekend. Appears to be from unauthorized use of sports field.', status: 'Closed', reporter: 'Mr. Banda (Sports Dept)', severity: 'Low' },
]

const visitorTimeline = [
  { time: '07:45', event: 'Mr. Peter Zvambe checked in - Plumbing Repairs', type: 'check-in' as const },
  { time: '08:30', event: 'Mrs. Chido Ndlovu checked in - PTA Meeting', type: 'check-in' as const },
  { time: '09:15', event: 'Mr. James Smith checked in - Textbook Delivery', type: 'check-in' as const },
  { time: '09:30', event: 'Ms. Netsai Shumba checked in - Book Donation', type: 'check-in' as const },
  { time: '10:00', event: 'Dr. Grace Mutasa checked in - MOESD Inspection', type: 'check-in' as const },
  { time: '10:00', event: 'Mr. James Smith checked out', type: 'check-out' as const },
  { time: '10:15', event: 'Ms. Netsai Shumba checked out', type: 'check-out' as const },
  { time: '11:20', event: 'Mrs. Rumbi Kazembe checked in - Sick Child', type: 'check-in' as const },
  { time: '11:45', event: 'Mrs. Rumbi Kazembe checked out', type: 'check-out' as const },
  { time: '12:30', event: 'Mr. Peter Zvambe checked out', type: 'check-out' as const },
  { time: '13:00', event: 'Mr. Tendai Machingaidze checked in - Internet Installation', type: 'check-in' as const },
  { time: '14:00', event: 'Ms. Tariro Gumbo checked in - SDC Meeting', type: 'check-in' as const },
]

const securityAlerts = [
  { id: '1', title: 'Dormitory Gate - Restricted Mode Active', description: 'After-hours access requires master key or prefect on duty', severity: 'info' as const, time: '18:00 Today' },
  { id: '2', title: 'Computer Lab - After-Hours Access Detected', description: 'Students found in lab without supervision. Incident #6 filed.', severity: 'warning' as const, time: '17:30 Today' },
  { id: '3', title: 'Missing Petty Cash - Staff Room', description: 'Theft incident reported. $15 USD missing from tea fund.', severity: 'critical' as const, time: '16:00 Today' },
  { id: '4', title: 'Main Gate - High Visitor Volume', description: '7 visitors processed today. Normal for PTA meeting days.', severity: 'info' as const, time: '14:30 Today' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function SecurityModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [visitors, setVisitors] = useState<Visitor[]>(mockVisitors)
  const [incidents, setIncidents] = useState<SecurityIncident[]>(mockIncidents)
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>(mockAccessPoints)
  const [searchVisitor, setSearchVisitor] = useState('')
  const [searchIncident, setSearchIncident] = useState('')
  const [addVisitorOpen, setAddVisitorOpen] = useState(false)
  const [addIncidentOpen, setAddIncidentOpen] = useState(false)

  // Form state for new visitor
  const [newVisitorName, setNewVisitorName] = useState('')
  const [newVisitorId, setNewVisitorId] = useState('')
  const [newVisitorPurpose, setNewVisitorPurpose] = useState('')
  const [newVisitorHost, setNewVisitorHost] = useState('')
  const [newVisitorVehicle, setNewVisitorVehicle] = useState('')
  const [newVisitorPhone, setNewVisitorPhone] = useState('')

  // Form state for new incident
  const [newIncidentType, setNewIncidentType] = useState<SecurityIncident['type']>('Other')
  const [newIncidentLocation, setNewIncidentLocation] = useState('')
  const [newIncidentDesc, setNewIncidentDesc] = useState('')
  const [newIncidentReporter, setNewIncidentReporter] = useState('')
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<SecurityIncident['severity']>('Medium')

  // Computed values
  const visitorsToday = visitors.length
  const currentlyOnCampus = visitors.filter(v => v.status === 'On Campus').length
  const incidentsThisMonth = incidents.length
  const openIncidents = incidents.filter(i => i.status === 'Open' || i.status === 'Under Investigation').length

  const activeVisitors = visitors.filter(v => v.status === 'On Campus')
  const checkedOutVisitors = visitors.filter(v => v.status === 'Checked Out')

  const filteredVisitors = visitors.filter(v =>
    v.name.toLowerCase().includes(searchVisitor.toLowerCase()) ||
    v.purpose.toLowerCase().includes(searchVisitor.toLowerCase()) ||
    v.idNumber.toLowerCase().includes(searchVisitor.toLowerCase())
  )

  const filteredIncidents = incidents.filter(i =>
    i.type.toLowerCase().includes(searchIncident.toLowerCase()) ||
    i.location.toLowerCase().includes(searchIncident.toLowerCase()) ||
    i.description.toLowerCase().includes(searchIncident.toLowerCase())
  )

  const handleAddVisitor = () => {
    if (!newVisitorName || !newVisitorId || !newVisitorPurpose || !newVisitorHost) return
    const newVisitor: Visitor = {
      id: String(visitors.length + 1),
      name: newVisitorName,
      idNumber: newVisitorId,
      purpose: newVisitorPurpose,
      hostPerson: newVisitorHost,
      vehicleReg: newVisitorVehicle,
      timeIn: new Date().toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit', hour12: false }),
      timeOut: null,
      status: 'On Campus',
      phone: newVisitorPhone,
    }
    setVisitors(prev => [newVisitor, ...prev])
    setNewVisitorName('')
    setNewVisitorId('')
    setNewVisitorPurpose('')
    setNewVisitorHost('')
    setNewVisitorVehicle('')
    setNewVisitorPhone('')
    setAddVisitorOpen(false)
  }

  const handleAddIncident = () => {
    if (!newIncidentLocation || !newIncidentDesc || !newIncidentReporter) return
    const newIncident: SecurityIncident = {
      id: String(incidents.length + 1),
      type: newIncidentType,
      location: newIncidentLocation,
      date: new Date().toISOString().split('T')[0],
      description: newIncidentDesc,
      status: 'Open',
      reporter: newIncidentReporter,
      severity: newIncidentSeverity,
    }
    setIncidents(prev => [newIncident, ...prev])
    setNewIncidentType('Other')
    setNewIncidentLocation('')
    setNewIncidentDesc('')
    setNewIncidentReporter('')
    setNewIncidentSeverity('Medium')
    setAddIncidentOpen(false)
  }

  const checkoutVisitor = (id: string) => {
    setVisitors(prev => prev.map(v =>
      v.id === id ? { ...v, timeOut: new Date().toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit', hour12: false }), status: 'Checked Out' as const } : v
    ))
  }

  const toggleAccessPoint = (id: string) => {
    setAccessPoints(prev => prev.map(ap => {
      if (ap.id === id) {
        const nextStatus: AccessPoint['status'] = ap.status === 'Active' ? 'Restricted' : ap.status === 'Restricted' ? 'Locked' : 'Active'
        return { ...ap, status: nextStatus }
      }
      return ap
    }))
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'Low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const incidentStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-700'
      case 'Under Investigation': return 'bg-amber-100 text-amber-700'
      case 'Resolved': return 'bg-emerald-100 text-emerald-700'
      case 'Closed': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const accessStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <Unlock className="h-4 w-4 text-emerald-600" />
      case 'Restricted': return <AlertCircle className="h-4 w-4 text-amber-600" />
      case 'Locked': return <Lock className="h-4 w-4 text-red-600" />
    }
  }

  const accessStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'border-emerald-200 bg-emerald-50/50'
      case 'Restricted': return 'border-amber-200 bg-amber-50/50'
      case 'Locked': return 'border-red-200 bg-red-50/50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Security & Visitor Management</h2>
            <p className="text-sm text-muted-foreground">Manage campus security, visitor access, and incident reports</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visitors">Visitor Log</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visitors Today</p>
                    <p className="text-2xl font-bold">{visitorsToday}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+3 vs yesterday</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Currently On Campus</p>
                    <p className="text-2xl font-bold">{currentlyOnCampus}</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Active visitors</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Eye className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incidents This Month</p>
                    <p className="text-2xl font-bold">{incidentsThisMonth}</p>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">{openIncidents} open</span>
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Access Points</p>
                    <p className="text-2xl font-bold">{accessPoints.length}</p>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">{accessPoints.filter(a => a.status === 'Active').length} active</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                    <DoorOpen className="h-5 w-5 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visitor Timeline + Security Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Today&apos;s Visitor Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {visitorTimeline.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs',
                        entry.type === 'check-in' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {entry.type === 'check-in' ? <Users className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      </div>
                      {idx < visitorTimeline.length - 1 && <div className="w-px h-6 bg-border" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm">{entry.event}</p>
                      <p className="text-xs text-muted-foreground">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {securityAlerts.map(alert => (
                  <div key={alert.id} className={cn(
                    'rounded-lg border p-3',
                    alert.severity === 'critical' ? 'border-red-200 bg-red-50/50' :
                    alert.severity === 'warning' ? 'border-amber-200 bg-amber-50/50' :
                    'border-emerald-200 bg-emerald-50/50'
                  )}>
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5',
                        alert.severity === 'critical' ? 'bg-red-200' :
                        alert.severity === 'warning' ? 'bg-amber-200' :
                        'bg-emerald-200'
                      )}>
                        {alert.severity === 'critical' ? <AlertTriangle className="h-3.5 w-3.5 text-red-700" /> :
                         alert.severity === 'warning' ? <AlertCircle className="h-3.5 w-3.5 text-amber-700" /> :
                         <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Active Visitors Quick View */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                Currently On Campus ({currentlyOnCampus})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeVisitors.map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.purpose}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">In: {v.timeIn}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => checkoutVisitor(v.id)}>
                      Check Out
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Visitor Log Tab ──────────────────────────────────────────────── */}
        <TabsContent value="visitors" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search visitors..."
                className="pl-9 h-9"
                value={searchVisitor}
                onChange={e => setSearchVisitor(e.target.value)}
              />
            </div>
            <Dialog open={addVisitorOpen} onOpenChange={setAddVisitorOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> Register Visitor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Register New Visitor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={newVisitorName} onChange={e => setNewVisitorName(e.target.value)} placeholder="Visitor's full name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ID Number</Label>
                      <Input value={newVisitorId} onChange={e => setNewVisitorId(e.target.value)} placeholder="e.g. 63-123456A78" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={newVisitorPhone} onChange={e => setNewVisitorPhone(e.target.value)} placeholder="+263 7X XXX XXXX" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose of Visit</Label>
                    <Input value={newVisitorPurpose} onChange={e => setNewVisitorPurpose(e.target.value)} placeholder="e.g. Parent-Teacher Meeting" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Host Person</Label>
                      <Input value={newVisitorHost} onChange={e => setNewVisitorHost(e.target.value)} placeholder="Staff member hosting" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle Registration</Label>
                      <Input value={newVisitorVehicle} onChange={e => setNewVisitorVehicle(e.target.value)} placeholder="e.g. ABZ 1234 (optional)" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddVisitor}>Register & Check In</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Visitors */}
          {activeVisitors.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Active Visitors ({activeVisitors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeVisitors.map(v => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{v.name}</p>
                            <p className="text-xs text-muted-foreground">{v.idNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{v.purpose}</TableCell>
                        <TableCell className="text-sm">{v.hostPerson}</TableCell>
                        <TableCell className="text-sm">{v.timeIn}</TableCell>
                        <TableCell>
                          {v.vehicleReg ? (
                            <Badge variant="outline" className="text-xs gap-1"><Car className="h-3 w-3" />{v.vehicleReg}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Walk-in</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => checkoutVisitor(v.id)}>
                            Check Out
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Visitor History */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Visitor History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-sm">{v.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{v.idNumber}</TableCell>
                      <TableCell className="text-sm">{v.purpose}</TableCell>
                      <TableCell className="text-sm">{v.hostPerson}</TableCell>
                      <TableCell className="text-sm">{v.timeIn}</TableCell>
                      <TableCell className="text-sm">{v.timeOut ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={v.status === 'On Campus' ? 'default' : 'secondary'} className="text-[10px]">
                          {v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Access Control Tab ───────────────────────────────────────────── */}
        <TabsContent value="access" className="space-y-4">
          {/* Access Points Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessPoints.map(ap => (
              <Card key={ap.id} className={cn('border shadow-md', accessStatusColor(ap.status))}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {accessStatusIcon(ap.status)}
                      <div>
                        <p className="text-sm font-semibold">{ap.name}</p>
                        <p className="text-xs text-muted-foreground">{ap.type}</p>
                      </div>
                    </div>
                    <Badge variant={
                      ap.status === 'Active' ? 'default' :
                      ap.status === 'Restricted' ? 'secondary' :
                      'destructive'
                    } className="text-[10px]">
                      {ap.status}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">Authorized Personnel</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ap.authorizedRoles.map((role, idx) => (
                          <Badge key={idx} variant="outline" className="text-[9px] h-5">{role}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {ap.lastActivity}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3 text-emerald-600" />
                        <span className="font-medium">{ap.todayCount}</span>
                        <span className="text-muted-foreground">today</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 h-7 text-xs"
                    onClick={() => toggleAccessPoint(ap.id)}
                  >
                    {ap.status === 'Active' ? 'Set Restricted' : ap.status === 'Restricted' ? 'Lock' : 'Activate'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Access Rules Summary */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Access Rules Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-emerald-50/50">
                  <p className="text-sm font-medium text-emerald-800">School Hours (07:00 - 17:00)</p>
                  <p className="text-xs text-muted-foreground mt-1">All access points active. Visitors must sign in at Main Gate. Students require hall passes for Admin Block.</p>
                </div>
                <div className="p-3 rounded-lg border bg-amber-50/50">
                  <p className="text-sm font-medium text-amber-800">After Hours (17:00 - 07:00)</p>
                  <p className="text-xs text-muted-foreground mt-1">Dormitory gate restricted. Computer Lab locked. Main Gate requires security escort for visitors.</p>
                </div>
                <div className="p-3 rounded-lg border bg-red-50/50">
                  <p className="text-sm font-medium text-red-800">Emergency Protocol</p>
                  <p className="text-xs text-muted-foreground mt-1">All gates lock down. Only emergency services and senior management allowed. Assembly point at sports field.</p>
                </div>
                <div className="p-3 rounded-lg border bg-cyan-50/50">
                  <p className="text-sm font-medium text-cyan-800">Weekend & Holidays</p>
                  <p className="text-xs text-muted-foreground mt-1">Main Gate active with reduced security. Dormitory gate on schedule. All other points locked unless pre-authorized.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Incidents Tab ────────────────────────────────────────────────── */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                className="pl-9 h-9"
                value={searchIncident}
                onChange={e => setSearchIncident(e.target.value)}
              />
            </div>
            <Dialog open={addIncidentOpen} onOpenChange={setAddIncidentOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> Report Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Security Incident</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Incident Type</Label>
                      <Select value={newIncidentType} onValueChange={v => setNewIncidentType(v as SecurityIncident['type'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unauthorized Access">Unauthorized Access</SelectItem>
                          <SelectItem value="Property Damage">Property Damage</SelectItem>
                          <SelectItem value="Theft">Theft</SelectItem>
                          <SelectItem value="Disturbance">Disturbance</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select value={newIncidentSeverity} onValueChange={v => setNewIncidentSeverity(v as SecurityIncident['severity'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={newIncidentLocation} onChange={e => setNewIncidentLocation(e.target.value)} placeholder="e.g. Main Gate, Form 2B Classroom" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newIncidentDesc} onChange={e => setNewIncidentDesc(e.target.value)} placeholder="Describe the incident in detail..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reporter</Label>
                    <Input value={newIncidentReporter} onChange={e => setNewIncidentReporter(e.target.value)} placeholder="Name of person reporting" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddIncident}>Submit Report</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Incident Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-red-600">{incidents.filter(i => i.status === 'Open').length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Open</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-amber-600">{incidents.filter(i => i.status === 'Under Investigation').length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Investigating</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-emerald-600">{incidents.filter(i => i.status === 'Resolved').length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Resolved</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-muted-foreground">{incidents.filter(i => i.status === 'Closed').length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Closed</p>
              </CardContent>
            </Card>
          </div>

          {/* Incidents Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map(inc => (
                    <TableRow key={inc.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{inc.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {inc.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{inc.date}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] border', severityColor(inc.severity))}>
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', incidentStatusColor(inc.status))}>
                          {inc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{inc.reporter}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{inc.description}</TableCell>
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
