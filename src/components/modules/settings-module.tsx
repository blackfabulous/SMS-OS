'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  School,
  BookOpen,
  DollarSign,
  Users,
  Database,
  Save,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  HardDrive,
  FileText,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Activity,
  Download,
  FileSpreadsheet,
  Printer,
  Globe,
  Search,
  Wand2,
  Palette,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Flag,
  Landmark,
  Building2,
  Info,
  CircleDollarSign,
  BadgeCheck,
  FileSignature,
  Scale,
  UsersRound,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { exportToCSV, printReport, buildHTMLTable } from '@/lib/export-utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsRegistryPanel } from '@/components/modules/settings-registry-panel'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

// ─── School Profile Interface ────────────────────────────────────────────────

interface SchoolProfile {
  id: string
  name: string
  code: string
  motto?: string
  zimsecCentreNumber?: string
  mopseDistrict?: string
  province: string
  schoolType: string
  ownershipType: string
  levelType: string
  registrationStatus: string
  headName?: string
  deputyHeadName?: string
  contactEmail?: string
  contactPhone?: string
  physicalAddress?: string
  gpsLatitude?: string
  gpsLongitude?: string
  catchmentArea?: string
  responsibleAuthority?: string
  establishedYear?: number
  bankName?: string
  bankAccountNumber?: string
  bankBranch?: string
  taxNumber?: string
  nssaNumber?: string
  zimdefNumber?: string
  sdcChairperson?: string
  sdcSecretary?: string
  sdcTreasurer?: string
}

interface AuditLog {
  id: string
  timestamp: string
  user: string
  module: string
  action: string
  details: string
  ipAddress: string
}

// ─── Action Color Config ──────────────────────────────────────────────────────

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  LOGIN: 'bg-gray-50 text-gray-700 border-gray-200',
}

// ─── Settings Module ─────────────────────────────────────────────────────────

export default function SettingsModule() {
  const [school, setSchool] = useState<SchoolProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Setup Wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardComplete, setWizardComplete] = useState(false)
  const [showWizardOnLogin, setShowWizardOnLogin] = useState(true)
  const [wizardData, setWizardData] = useState({
    schoolName: '',
    motto: '',
    schoolType: 'Secondary',
    ownership: 'Government',
    province: 'Harare',
    district: '',
    emisNumber: '',
    primaryColor: '#10b981',
    secondaryColor: '#14b8a6',
    academicYearName: '2025',
    yearStartDate: '2025-01-14',
    yearEndDate: '2025-12-05',
    term1Start: '2025-01-14', term1End: '2025-04-04',
    term2Start: '2025-05-06', term2End: '2025-08-01',
    term3Start: '2025-09-02', term3End: '2025-12-05',
    gradeLevels: [] as string[],
    subjects: [] as string[],
    feeCurrency: 'USD',
    paymentTerms: 'Per Term',
    headmasterName: '',
    deputyHeadName: '',
    bursarName: '',
  })

  // Form state
  const [form, setForm] = useState<Partial<SchoolProfile>>({})

  // Audit Trail state
  const [auditData, setAuditData] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditUsers, setAuditUsers] = useState<string[]>([])
  const [auditModules, setAuditModules] = useState<string[]>([])
  const [auditActions, setAuditActions] = useState<string[]>([])
  const [auditFilterUser, setAuditFilterUser] = useState('ALL')
  const [auditFilterModule, setAuditFilterModule] = useState('ALL')
  const [auditFilterAction, setAuditFilterAction] = useState('ALL')
  const [auditFilterStartDate, setAuditFilterStartDate] = useState('')
  const [auditFilterEndDate, setAuditFilterEndDate] = useState('')
  const [auditSearch, setAuditSearch] = useState('')

  const fetchSchool = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/school')
      if (res.ok) {
        const data = await res.json()
        setSchool(data)
        setForm(data)
      }
    } catch (err) {
      console.error('Failed to fetch school:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAuditData = useCallback(async () => {
    try {
      setAuditLoading(true)
      const params = new URLSearchParams()
      if (auditFilterUser !== 'ALL') params.set('user', auditFilterUser)
      if (auditFilterModule !== 'ALL') params.set('module', auditFilterModule)
      if (auditFilterAction !== 'ALL') params.set('action', auditFilterAction)
      if (auditFilterStartDate) params.set('startDate', auditFilterStartDate)
      if (auditFilterEndDate) params.set('endDate', auditFilterEndDate)

      const res = await fetch(`/api/audit?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAuditData(data.data || [])
        setAuditUsers(data.users || [])
        setAuditModules(data.modules || [])
        setAuditActions(data.actions || [])
      }
    } catch (err) {
      console.error('Failed to fetch audit data:', err)
    } finally {
      setAuditLoading(false)
    }
  }, [auditFilterUser, auditFilterModule, auditFilterAction, auditFilterStartDate, auditFilterEndDate])

  useEffect(() => {
    fetchSchool()
  }, [fetchSchool])

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditData()
    }
  }, [activeTab, fetchAuditData])

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setSchool(data)
        setForm(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateForm = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Academic setup data (simulated)
  const academicYears = [
    { id: '1', name: '2025', terms: 3, isCurrent: true },
    { id: '2', name: '2024', terms: 3, isCurrent: false },
  ]

  const terms = [
    { id: '1', name: 'Term 1', dates: 'Jan 14 - Apr 4', isCurrent: true },
    { id: '2', name: 'Term 2', dates: 'May 6 - Aug 1', isCurrent: false },
    { id: '3', name: 'Term 3', dates: 'Sep 2 - Dec 5', isCurrent: false },
  ]

  const grades = [
    { id: '1', name: 'Form 1', level: 'JUNIOR', classes: 3, students: 120 },
    { id: '2', name: 'Form 2', level: 'JUNIOR', classes: 3, students: 115 },
    { id: '3', name: 'Form 3', level: 'JUNIOR', classes: 3, students: 108 },
    { id: '4', name: 'Form 4', level: 'SENIOR', classes: 3, students: 95 },
    { id: '5', name: 'Form 5', level: 'SENIOR', classes: 2, students: 72 },
    { id: '6', name: 'Form 6', level: 'SENIOR', classes: 2, students: 58 },
  ]

  // Fee structure (simulated)
  const feeStructure = [
    { grade: 'Form 1', tuition: 450, levy: 100, development: 50, sports: 30, total: 630 },
    { grade: 'Form 2', tuition: 450, levy: 100, development: 50, sports: 30, total: 630 },
    { grade: 'Form 3', tuition: 500, levy: 100, development: 50, sports: 30, total: 680 },
    { grade: 'Form 4', tuition: 550, levy: 120, development: 60, sports: 40, total: 770 },
    { grade: 'Form 5', tuition: 600, levy: 150, development: 80, sports: 40, total: 870 },
    { grade: 'Form 6', tuition: 600, levy: 150, development: 80, sports: 40, total: 870 },
  ]

  // Users (placeholder)
  const users = [
    { id: '1', name: 'Admin User', email: 'admin@zimschool.co.zw', role: 'Super Admin', lastLogin: '2025-03-05 08:30', status: 'Active' },
    { id: '2', name: 'Mr. Dube', email: 'dube@zimschool.co.zw', role: 'Headmaster', lastLogin: '2025-03-05 07:45', status: 'Active' },
    { id: '3', name: 'Mrs. Ncube', email: 'ncube@zimschool.co.zw', role: 'Deputy Head', lastLogin: '2025-03-04 16:20', status: 'Active' },
    { id: '4', name: 'Clerk User', email: 'clerk@zimschool.co.zw', role: 'Clerk', lastLogin: '2025-03-04 09:15', status: 'Active' },
  ]

  // Audit logs (simulated for system tab - kept minimal)
  const auditLogs = [
    { id: '1', action: 'CREATE', entity: 'Student', user: 'Admin User', date: '2025-03-05 10:15', details: 'Created student Tendai Moyo' },
    { id: '2', action: 'UPDATE', entity: 'FeeInvoice', user: 'Clerk User', date: '2025-03-05 09:30', details: 'Updated invoice INV2024001' },
    { id: '3', action: 'PAYMENT', entity: 'FeePayment', user: 'Clerk User', date: '2025-03-05 09:15', details: 'Recorded payment $450' },
    { id: '4', action: 'LOGIN', entity: 'User', user: 'Mr. Dube', date: '2025-03-05 07:45', details: 'User logged in' },
    { id: '5', action: 'CREATE', entity: 'Attendance', user: 'Mrs. Ncube', date: '2025-03-04 08:30', details: 'Bulk attendance recorded' },
  ]

  // Filter audit data by search
  const filteredAuditData = auditData.filter((log) => {
    if (!auditSearch) return true
    const q = auditSearch.toLowerCase()
    return (
      log.details.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.ipAddress.includes(q)
    )
  })

  const formatAuditTimestamp = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure school profile, academic setup, and system preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 flex flex-wrap">
          <TabsTrigger value="setup-wizard" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            Setup Wizard
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <School className="mr-1.5 h-3.5 w-3.5" />
            School Profile
          </TabsTrigger>
          <TabsTrigger value="academic" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Academic Setup
          </TabsTrigger>
          <TabsTrigger value="fees" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Fee Structure
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Database className="mr-1.5 h-3.5 w-3.5" />
            System
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* ─── Advanced (registry-driven) Tab ───────────────────────────── */}
        <TabsContent value="advanced" className="space-y-4">
          <SettingsRegistryPanel />
        </TabsContent>

        {/* ─── Setup Wizard Tab ─────────────────────────────────────────── */}
        <TabsContent value="setup-wizard" className="space-y-4">
          <SetupWizard
            step={wizardStep}
            setStep={setWizardStep}
            data={wizardData}
            setData={setWizardData}
            complete={wizardComplete}
            setComplete={setWizardComplete}
            showOnLogin={showWizardOnLogin}
            setShowOnLogin={setShowWizardOnLogin}
          />
        </TabsContent>

        {/* ─── School Profile Tab ────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic Info */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <School className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>School Name</Label>
                    <Input value={form.name || ''} onChange={(e) => updateForm('name', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>School Code</Label>
                    <Input value={form.code || ''} onChange={(e) => updateForm('code', e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Motto</Label>
                  <Input value={form.motto || ''} onChange={(e) => updateForm('motto', e.target.value)} placeholder="School motto" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Province</Label>
                    <Select value={form.province || 'Harare'} onValueChange={(v) => updateForm('province', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central', 'Mashonaland East', 'Mashonaland West', 'Masvingo', 'Midlands', 'Matabeleland North', 'Matabeleland South'].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>District</Label>
                    <Input value={form.mopseDistrict || ''} onChange={(e) => updateForm('mopseDistrict', e.target.value)} placeholder="MoPSE District" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>School Type</Label>
                    <Select value={form.schoolType || 'GOVERNMENT'} onValueChange={(v) => updateForm('schoolType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="COUNCIL">Council</SelectItem>
                        <SelectItem value="MISSION">Mission</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Ownership</Label>
                    <Select value={form.ownershipType || 'GOVERNMENT'} onValueChange={(v) => updateForm('ownershipType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="CHURCH">Church</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="TRUST">Trust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Level</Label>
                    <Select value={form.levelType || 'SECONDARY'} onValueChange={(v) => updateForm('levelType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIMARY">Primary</SelectItem>
                        <SelectItem value="SECONDARY">Secondary</SelectItem>
                        <SelectItem value="COMBINED">Combined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>ZIMSEC Centre #</Label>
                    <Input value={form.zimsecCentreNumber || ''} onChange={(e) => updateForm('zimsecCentreNumber', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Established Year</Label>
                    <Input type="number" value={form.establishedYear || ''} onChange={(e) => updateForm('establishedYear', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leadership & Contact */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/30">
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Leadership & Contact</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Head Name</Label>
                    <Input value={form.headName || ''} onChange={(e) => updateForm('headName', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Deputy Head Name</Label>
                    <Input value={form.deputyHeadName || ''} onChange={(e) => updateForm('deputyHeadName', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Contact Phone</Label>
                    <Input value={form.contactPhone || ''} onChange={(e) => updateForm('contactPhone', e.target.value)} placeholder="+263..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contact Email</Label>
                    <Input value={form.contactEmail || ''} onChange={(e) => updateForm('contactEmail', e.target.value)} placeholder="school@email.co.zw" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Physical Address</Label>
                  <Textarea value={form.physicalAddress || ''} onChange={(e) => updateForm('physicalAddress', e.target.value)} className="min-h-[60px] resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>GPS Latitude</Label>
                    <Input value={form.gpsLatitude || ''} onChange={(e) => updateForm('gpsLatitude', e.target.value)} placeholder="-17.8292" />
                  </div>
                  <div className="grid gap-2">
                    <Label>GPS Longitude</Label>
                    <Input value={form.gpsLongitude || ''} onChange={(e) => updateForm('gpsLongitude', e.target.value)} placeholder="31.0539" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Catchment Area</Label>
                    <Input value={form.catchmentArea || ''} onChange={(e) => updateForm('catchmentArea', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Responsible Authority</Label>
                    <Input value={form.responsibleAuthority || ''} onChange={(e) => updateForm('responsibleAuthority', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Details */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Banking & Statutory</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Bank Name</Label>
                    <Input value={form.bankName || ''} onChange={(e) => updateForm('bankName', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Account Number</Label>
                    <Input value={form.bankAccountNumber || ''} onChange={(e) => updateForm('bankAccountNumber', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Bank Branch</Label>
                    <Input value={form.bankBranch || ''} onChange={(e) => updateForm('bankBranch', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tax Number</Label>
                    <Input value={form.taxNumber || ''} onChange={(e) => updateForm('taxNumber', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>NSSA Number</Label>
                    <Input value={form.nssaNumber || ''} onChange={(e) => updateForm('nssaNumber', e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>ZIMDEF Number</Label>
                  <Input value={form.zimdefNumber || ''} onChange={(e) => updateForm('zimdefNumber', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* School Branding */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                    <Palette className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">School Branding</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30">
                    <School className="h-8 w-8" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      <Upload className="mr-1.5 h-3 w-3" /> Upload Logo
                    </Button>
                    <p className="text-[10px] text-muted-foreground">Recommended: 512x512px PNG with transparency</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500 border-2 border-white shadow-sm" />
                      <Input placeholder="#10b981" className="emerald-focus" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-teal-500 border-2 border-white shadow-sm" />
                      <Input placeholder="#14b8a6" className="emerald-focus" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Font Style</Label>
                    <Select defaultValue="sans">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sans">Sans Serif</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="mono">Monospace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Report Header Style</Label>
                    <Select defaultValue="centered">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centered">Centered Logo</SelectItem>
                        <SelectItem value="left">Left Aligned</SelectItem>
                        <SelectItem value="banner">Full Width Banner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                  <div className="flex items-start gap-2">
                    <Palette className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-400">Brand Preview</p>
                      <p className="text-[11px] text-purple-600/80 dark:text-purple-400/70 mt-0.5">Your school branding will be applied to all generated reports, receipts, invoices, and certificates.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Status */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Registration & SDC</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Registration Status</Label>
                  <Select value={form.registrationStatus || 'REGISTERED'} onValueChange={(v) => updateForm('registrationStatus', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGISTERED">Registered</SelectItem>
                      <SelectItem value="PROVISIONAL">Provisional</SelectItem>
                      <SelectItem value="NOT_REGISTERED">Not Registered</SelectItem>
                      <SelectItem value="DEREGISTERED">Deregistered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>SDC Chairperson</Label>
                    <Input value={form.sdcChairperson || ''} onChange={(e) => updateForm('sdcChairperson', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>SDC Secretary</Label>
                    <Input value={form.sdcSecretary || ''} onChange={(e) => updateForm('sdcSecretary', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>SDC Treasurer</Label>
                    <Input value={form.sdcTreasurer || ''} onChange={(e) => updateForm('sdcTreasurer', e.target.value)} />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">
                      {school?.id ? 'School profile loaded from database' : 'New school profile — fill in details and save'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Academic Setup Tab ─────────────────────────────────────────── */}
        <TabsContent value="academic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Academic Years */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Academic Years</CardTitle>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700">
                    <Plus className="mr-1 h-3 w-3" /> Add Year
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {academicYears.map((year) => (
                    <div key={year.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium">{year.name}</p>
                          <p className="text-xs text-muted-foreground">{year.terms} terms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {year.isCurrent && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Current</Badge>}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Terms (2025)</CardTitle>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700">
                    <Plus className="mr-1 h-3 w-3" /> Add Term
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {terms.map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{term.name}</p>
                        <p className="text-xs text-muted-foreground">{term.dates}</p>
                      </div>
                      {term.isCurrent && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Current</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grades */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Grades & Classes</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700">
                  <Plus className="mr-1 h-3 w-3" /> Add Grade
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Grade</TableHead>
                    <TableHead className="text-xs">Level</TableHead>
                    <TableHead className="text-xs text-right">Classes</TableHead>
                    <TableHead className="text-xs text-right">Students</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{grade.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', grade.level === 'SENIOR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                          {grade.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right">{grade.classes}</TableCell>
                      <TableCell className="text-sm text-right">{grade.students}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Fee Structure Tab ──────────────────────────────────────────── */}
        <TabsContent value="fees" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Structure by Grade</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700">
                  <Plus className="mr-1 h-3 w-3" /> Add Fee Head
                </Button>
              </div>
              <CardDescription>Fee amounts in USD per term</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Grade</TableHead>
                    <TableHead className="text-xs text-right">Tuition</TableHead>
                    <TableHead className="text-xs text-right">Levy</TableHead>
                    <TableHead className="text-xs text-right">Development</TableHead>
                    <TableHead className="text-xs text-right">Sports</TableHead>
                    <TableHead className="text-xs text-right font-bold">Total</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructure.map((fee) => (
                    <TableRow key={fee.grade} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{fee.grade}</TableCell>
                      <TableCell className="text-sm text-right font-mono">${fee.tuition}</TableCell>
                      <TableCell className="text-sm text-right font-mono">${fee.levy}</TableCell>
                      <TableCell className="text-sm text-right font-mono">${fee.development}</TableCell>
                      <TableCell className="text-sm text-right font-mono">${fee.sports}</TableCell>
                      <TableCell className="text-sm text-right font-bold font-mono text-emerald-600">${fee.total}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── User Management Tab ────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">System Users</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700">
                  <Plus className="mr-1 h-3 w-3" /> Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Last Login</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                            {user.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', user.role === 'Super Admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : user.role === 'Headmaster' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{user.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Audit Trail Tab ──────────────────────────────────────────── */}
        <TabsContent value="audit" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Activity className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Events</p>
                    <p className="text-lg font-bold">{filteredAuditData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Updates</p>
                    <p className="text-lg font-bold">{filteredAuditData.filter(l => l.action === 'UPDATE').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Plus className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Creates</p>
                    <p className="text-lg font-bold">{filteredAuditData.filter(l => l.action === 'CREATE').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
                    <Clock className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Logins</p>
                    <p className="text-lg font-bold">{filteredAuditData.filter(l => l.action === 'LOGIN').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-600" />
                    Audit Trail
                  </CardTitle>
                  <CardDescription>Complete system activity log with filtering and export</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => {
                    const csvData = filteredAuditData.map(log => ({
                      'Timestamp': formatAuditTimestamp(log.timestamp),
                      'User': log.user,
                      'Module': log.module,
                      'Action': log.action,
                      'Details': log.details,
                      'IP Address': log.ipAddress,
                    }))
                    exportToCSV(csvData, `audit_trail_${new Date().toISOString().slice(0, 10)}`)
                  }}>
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => {
                    const headers = ['Timestamp', 'User', 'Module', 'Action', 'Details', 'IP Address']
                    const rows = filteredAuditData.map(log => [
                      formatAuditTimestamp(log.timestamp),
                      log.user,
                      log.module,
                      log.action,
                      log.details,
                      log.ipAddress,
                    ])
                    printReport('Audit Trail Report', buildHTMLTable(headers, rows))
                  }}>
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search audit logs..."
                    className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={auditFilterUser} onValueChange={setAuditFilterUser}>
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      {auditUsers.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={auditFilterModule} onValueChange={setAuditFilterModule}>
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Modules</SelectItem>
                      {auditModules.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={auditFilterAction} onValueChange={setAuditFilterAction}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Actions</SelectItem>
                      {auditActions.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="h-8 w-[140px] text-xs"
                      value={auditFilterStartDate}
                      onChange={(e) => setAuditFilterStartDate(e.target.value)}
                      placeholder="From"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="date"
                      className="h-8 w-[140px] text-xs"
                      value={auditFilterEndDate}
                      onChange={(e) => setAuditFilterEndDate(e.target.value)}
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              {/* Audit Table */}
              {auditLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading audit data...</span>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Timestamp</TableHead>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs">Module</TableHead>
                        <TableHead className="text-xs">Action</TableHead>
                        <TableHead className="text-xs">Details</TableHead>
                        <TableHead className="text-xs">IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Activity className="h-8 w-8 opacity-40" />
                              <p className="text-sm">No audit records found</p>
                              <p className="text-xs">Try adjusting your filters</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAuditData.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/30">
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {formatAuditTimestamp(log.timestamp)}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[9px] font-semibold">
                                  {log.user.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span>{log.user}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {log.module}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px] px-2 py-0', actionColors[log.action] || 'bg-gray-50 text-gray-700 border-gray-200')}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                              {log.details}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {log.ipAddress}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Footer */}
              {filteredAuditData.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredAuditData.length} of {auditData.length} records
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {Object.entries(actionColors).map(([action, colorClass]) => (
                      <span key={action} className="flex items-center gap-1">
                        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', colorClass)}>
                          {action}
                        </Badge>
                        {filteredAuditData.filter(l => l.action === action).length}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Zimbabwe Compliance Tab ───────────────────────────────────────── */}
        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Overview Banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
<Card className="border-0 shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 text-white relative">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Flag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Zimbabwe Regulatory Compliance</h3>
                    <p className="text-xs text-emerald-100 mt-0.5">Configure statutory compliance settings for ZIMRA, NSSA, ZIMDEF, and MoPSE</p>
                  </div>
                </div>
                {/* Zimbabwe flag stripes */}
                <div className="flex mt-3 gap-0.5 h-1 rounded-full overflow-hidden">
                  <div className="flex-1 bg-green-400/60" />
                  <div className="flex-1 bg-yellow-400/60" />
                  <div className="flex-1 bg-red-400/60" />
                  <div className="flex-1 bg-black/40" />
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ZIMRA Tax Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
<Card className="border-0 shadow-md h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
<Landmark className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">ZIMRA Tax Compliance</CardTitle>
                      <CardDescription className="text-[11px]">Zimbabwe Revenue Authority</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><CircleDollarSign className="h-3 w-3 text-muted-foreground" /> Tax Number (BPN)</Label>
                      <Input value={form.taxNumber || ''} onChange={(e) => updateForm('taxNumber', e.target.value)} placeholder="e.g. 123456789" className="emerald-focus" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><FileSignature className="h-3 w-3 text-muted-foreground" /> VAT Registration</Label>
                      <Input placeholder="VAT number" className="emerald-focus" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Tax Filing Frequency</Label>
                      <Select defaultValue="quarterly">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Withholding Tax Rate (%)</Label>
                      <Input type="number" placeholder="10" className="emerald-focus" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Auto-generate tax reports</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Withholding tax on payments</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">ZIMRA Compliance Note</p>
                        <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">Schools must file tax returns quarterly. Ensure your Business Partner Number (BPN) is correctly configured.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* NSSA Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
<Card className="border-0 shadow-md h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">NSSA Compliance</CardTitle>
                      <CardDescription className="text-[11px]">National Social Security Authority</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><FileSignature className="h-3 w-3 text-muted-foreground" /> NSSA Employer Number</Label>
                      <Input value={form.nssaNumber || ''} onChange={(e) => updateForm('nssaNumber', e.target.value)} placeholder="e.g. NSSA-001234" className="emerald-focus" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><UsersRound className="h-3 w-3 text-muted-foreground" /> Registered Employees</Label>
                      <Input type="number" placeholder="0" className="emerald-focus" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Employee Contribution (%)</Label>
                      <Input type="number" placeholder="4.5" className="emerald-focus" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Employer Contribution (%)</Label>
                      <Input type="number" placeholder="4.5" className="emerald-focus" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">Auto-deduct NSSA from payroll</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">Generate NSSA returns</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">NSSA Compliance Note</p>
                        <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Employers must remit NSSA contributions by the 15th of each month. Both employer and employee contribute 4.5% each.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ZIMDEF Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
<Card className="border-0 shadow-md h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/30">
<BookOpen className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">ZIMDEF Compliance</CardTitle>
                      <CardDescription className="text-[11px]">Zimbabwe Manpower Development Fund</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><FileSignature className="h-3 w-3 text-muted-foreground" /> ZIMDEF Number</Label>
                      <Input value={form.zimdefNumber || ''} onChange={(e) => updateForm('zimdefNumber', e.target.value)} placeholder="e.g. ZDF-001234" className="emerald-focus" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><CircleDollarSign className="h-3 w-3 text-muted-foreground" /> Levy Rate (%)</Label>
                      <Input type="number" placeholder="1" className="emerald-focus" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Levy Basis</Label>
                      <Select defaultValue="payroll">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payroll">Payroll Amount</SelectItem>
                          <SelectItem value="turnover">Annual Turnover</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Filing Frequency</Label>
                      <Select defaultValue="quarterly">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-teal-500" />
                      <span className="text-sm font-medium">Auto-compute ZIMDEF levy</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-teal-700 dark:text-teal-400">ZIMDEF Compliance Note</p>
                        <p className="text-[11px] text-teal-600/80 dark:text-teal-400/70 mt-0.5">Employers with 5+ employees must contribute 1% of payroll to ZIMDEF. Levy is payable quarterly to the Ministry of Higher Education.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* MoPSE Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
<Card className="border-0 shadow-md h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">MoPSE Registration</CardTitle>
                      <CardDescription className="text-[11px]">Ministry of Primary & Secondary Education</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><FileSignature className="h-3 w-3 text-muted-foreground" /> EMIS Number</Label>
                      <Input value={form.mopseDistrict || ''} onChange={(e) => updateForm('mopseDistrict', e.target.value)} placeholder="EMIS registration #" className="emerald-focus" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" /> MoPSE District</Label>
                      <Input value={form.mopseDistrict || ''} onChange={(e) => updateForm('mopseDistrict', e.target.value)} placeholder="District name" className="emerald-focus" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Registration Status</Label>
                      <Select value={form.registrationStatus || 'REGISTERED'} onValueChange={(v) => updateForm('registrationStatus', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REGISTERED">Registered</SelectItem>
                          <SelectItem value="PROVISIONAL">Provisional</SelectItem>
                          <SelectItem value="NOT_REGISTERED">Not Registered</SelectItem>
                          <SelectItem value="DEREGISTERED">Deregistered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">School Category</Label>
                      <Select defaultValue="secondary">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary School</SelectItem>
                          <SelectItem value="secondary">Secondary School</SelectItem>
                          <SelectItem value="combined">Combined School</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">Submit termly returns to MoPSE</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">Sync enrollment data to EMIS</span>
                    </div>
                    <Switch />
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">MoPSE Compliance Note</p>
                        <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">All schools must be registered with MoPSE and submit termly statistical returns via the EMIS portal. Registration must be renewed as per ministry guidelines.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Compliance Status Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
<Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-600" />
                  Compliance Status Summary
                </CardTitle>
                <CardDescription>Overview of your school's regulatory compliance standing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { name: 'ZIMRA Tax', icon: Landmark, status: 'Partially Configured', color: 'amber', configured: !!form.taxNumber },
                    { name: 'NSSA', icon: Shield, status: 'Partially Configured', color: 'emerald', configured: !!form.nssaNumber },
                    { name: 'ZIMDEF', icon: BookOpen, status: 'Partially Configured', color: 'teal', configured: !!form.zimdefNumber },
                    { name: 'MoPSE', icon: Building2, status: form.registrationStatus === 'REGISTERED' ? 'Registered' : 'Not Verified', color: 'emerald', configured: form.registrationStatus === 'REGISTERED' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', item.color === 'amber' ? 'bg-amber-50 dark:bg-amber-950/30' : item.color === 'teal' ? 'bg-teal-50 dark:bg-teal-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30')}>
                        <item.icon className={cn('h-4 w-4', item.color === 'amber' ? 'text-amber-600' : item.color === 'teal' ? 'text-teal-600' : 'text-emerald-600')} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-1">
                          <div className={cn('h-1.5 w-1.5 rounded-full', item.configured ? 'bg-emerald-500' : 'bg-amber-400')} />
                          <span className="text-[10px] text-muted-foreground">{item.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── System Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Info */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-emerald-600" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Version</span><span className="font-medium">ZimSchool Pro v2.1.0</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Database</span><span className="font-medium">SQLite</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Server</span><span className="font-medium">Next.js 16</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Last Backup</span><span className="font-medium">Never</span></div>
                <Separator />
                <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Database className="mr-2 h-4 w-4" />
                  Backup Database
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Database className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Seed Database</p>
                    <p className="text-xs text-muted-foreground">Populate with sample data</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 border-amber-200 text-amber-700 hover:bg-amber-50">
                  <AlertCircle className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Reset Database</p>
                    <p className="text-xs text-muted-foreground">Clear all data (use with caution)</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Audit Log (compact) */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => setActiveTab('audit')}>
                  View Full Audit Trail →
                </Button>
              </div>
              <CardDescription>Quick view of recent system activity</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Entity</TableHead>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Details</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' : log.action === 'PAYMENT' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.entity}</TableCell>
                        <TableCell className="text-sm">{log.user}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.details}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ─── Setup Wizard Component ──────────────────────────────────────────────────
interface WizardData {
  schoolName: string
  motto: string
  schoolType: string
  ownership: string
  province: string
  district: string
  emisNumber: string
  primaryColor: string
  secondaryColor: string
  academicYearName: string
  yearStartDate: string
  yearEndDate: string
  term1Start: string
  term1End: string
  term2Start: string
  term2End: string
  term3Start: string
  term3End: string
  gradeLevels: string[]
  subjects: string[]
  feeCurrency: string
  paymentTerms: string
  headmasterName: string
  deputyHeadName: string
  bursarName: string
}

const allGradeLevels = ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6']
const allSubjects = ['English', 'Mathematics', 'Shona', 'Ndebele', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Accounts', 'Commerce', 'Computer Science', 'Art', 'Music', 'Physical Education', 'Religious & Moral Education', 'Agriculture', 'Social Studies', 'Heritage Studies', 'Family & Religious Studies', 'Literature in English']

const feeCategories = [
  { name: 'Tuition', primaryDefault: 300, secondaryDefault: 450 },
  { name: 'Boarding', primaryDefault: 0, secondaryDefault: 400 },
  { name: 'Transport', primaryDefault: 60, secondaryDefault: 80 },
  { name: 'Exam Fees', primaryDefault: 30, secondaryDefault: 50 },
  { name: 'IT Levy', primaryDefault: 25, secondaryDefault: 40 },
  { name: 'Sports Fee', primaryDefault: 20, secondaryDefault: 30 },
  { name: 'Development Levy', primaryDefault: 40, secondaryDefault: 60 },
]

const colorOptions = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
]

function SetupWizard({
  step,
  setStep,
  data,
  setData,
  complete,
  setComplete,
  showOnLogin,
  setShowOnLogin,
}: {
  step: number
  setStep: (s: number) => void
  data: WizardData
  setData: React.Dispatch<React.SetStateAction<WizardData>>
  complete: boolean
  setComplete: (c: boolean) => void
  showOnLogin: boolean
  setShowOnLogin: (s: boolean) => void
}) {
  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const updateData = (field: string, value: string | string[]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const toggleGradeLevel = (level: string) => {
    setData(prev => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(level)
        ? prev.gradeLevels.filter(l => l !== level)
        : [...prev.gradeLevels, level]
    }))
  }

  const toggleSubject = (subject: string) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      setComplete(true)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Onboarding Setup Wizard</h3>
              <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {['School Info', 'Academic', 'Fees', 'Users', 'Complete'].map((label, i) => (
                <button
                  key={label}
                  onClick={() => i + 1 <= step && setStep(i + 1)}
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    i + 1 === step ? 'text-emerald-600' : i + 1 < step ? 'text-emerald-500 cursor-pointer hover:text-emerald-700' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <School className="h-5 w-5 text-emerald-600" />
                  Step 1 — School Information
                </CardTitle>
                <CardDescription>Enter your school&apos;s basic information to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>School Name *</Label>
                    <Input value={data.schoolName} onChange={e => updateData('schoolName', e.target.value)} placeholder="e.g. Churchill High School" />
                  </div>
                  <div className="grid gap-2">
                    <Label>School Motto</Label>
                    <Input value={data.motto} onChange={e => updateData('motto', e.target.value)} placeholder="e.g. Education for Life" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>School Type *</Label>
                    <Select value={data.schoolType} onValueChange={v => updateData('schoolType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                        <SelectItem value="Combined">Combined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Ownership *</Label>
                    <Select value={data.ownership} onValueChange={v => updateData('ownership', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Mission">Mission</SelectItem>
                        <SelectItem value="Council">Council</SelectItem>
                        <SelectItem value="Trust">Trust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>EMIS Number</Label>
                    <Input value={data.emisNumber} onChange={e => updateData('emisNumber', e.target.value)} placeholder="e.g. EM-2025-001" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Province *</Label>
                    <Select value={data.province} onValueChange={v => updateData('province', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central', 'Mashonaland East', 'Mashonaland West', 'Masvingo', 'Midlands', 'Matabeleland North', 'Matabeleland South'].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>District</Label>
                    <Input value={data.district} onChange={e => updateData('district', e.target.value)} placeholder="e.g. Harare District" />
                  </div>
                </div>

                {/* School Colors */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> School Colors</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Primary Color</Label>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map(c => (
                          <button
                            key={c.value}
                            className={cn('h-8 w-8 rounded-lg border-2 transition-all', data.primaryColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                            style={{ backgroundColor: c.value }}
                            onClick={() => updateData('primaryColor', c.value)}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Secondary Color</Label>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map(c => (
                          <button
                            key={`sec-${c.value}`}
                            className={cn('h-8 w-8 rounded-lg border-2 transition-all', data.secondaryColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                            style={{ backgroundColor: c.value }}
                            onClick={() => updateData('secondaryColor', c.value)}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo Upload Placeholder */}
                <div className="grid gap-2">
                  <Label>School Logo</Label>
                  <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center hover:border-emerald-300 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click or drag to upload school logo</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  Step 2 — Academic Setup
                </CardTitle>
                <CardDescription>Configure academic year, terms, grade levels, and subjects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Academic Year Name</Label>
                    <Input value={data.academicYearName} onChange={e => updateData('academicYearName', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Year Start Date</Label>
                    <Input type="date" value={data.yearStartDate} onChange={e => updateData('yearStartDate', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Year End Date</Label>
                    <Input type="date" value={data.yearEndDate} onChange={e => updateData('yearEndDate', e.target.value)} />
                  </div>
                </div>

                {/* Term Dates */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Term Dates</Label>
                  {[
                    { num: 1, startField: 'term1Start', endField: 'term1End' },
                    { num: 2, startField: 'term2Start', endField: 'term2End' },
                    { num: 3, startField: 'term3Start', endField: 'term3End' },
                  ].map(term => (
                    <div key={term.num} className="grid grid-cols-3 gap-3 items-end">
                      <div>
                        <Label className="text-xs text-muted-foreground">Term {term.num}</Label>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[10px]">Start</Label>
                        <Input type="date" value={data[term.startField as keyof WizardData] as string} onChange={e => updateData(term.startField, e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[10px]">End</Label>
                        <Input type="date" value={data[term.endField as keyof WizardData] as string} onChange={e => updateData(term.endField, e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grade Levels */}
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Grade Levels Offered</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {allGradeLevels.map(level => (
                      <button
                        key={level}
                        className={cn(
                          'p-2 rounded-lg border text-xs font-medium transition-all',
                          data.gradeLevels.includes(level)
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-muted hover:border-emerald-200 hover:bg-muted/30'
                        )}
                        onClick={() => toggleGradeLevel(level)}
                      >
                        <CheckCircle2 className={cn('h-3.5 w-3.5 mb-1 mx-auto', data.gradeLevels.includes(level) ? 'text-emerald-600' : 'text-muted-foreground/30')} />
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{data.gradeLevels.length} grade level(s) selected</p>
                </div>

                {/* Subjects */}
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Subjects Offered</Label>
                  <div className="flex flex-wrap gap-2">
                    {allSubjects.map(subject => (
                      <button
                        key={subject}
                        className={cn(
                          'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                          data.subjects.includes(subject)
                            ? 'border-teal-300 bg-teal-50 text-teal-700'
                            : 'border-muted hover:border-teal-200 hover:bg-muted/30'
                        )}
                        onClick={() => toggleSubject(subject)}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{data.subjects.length} subject(s) selected</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Step 3 — Fee Structure
                </CardTitle>
                <CardDescription>Set up fee categories, amounts, and payment terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Currency</Label>
                    <Select value={data.feeCurrency} onValueChange={v => updateData('feeCurrency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD Only</SelectItem>
                        <SelectItem value="ZiG">ZiG Only</SelectItem>
                        <SelectItem value="Both">Both USD &amp; ZiG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Payment Terms</Label>
                    <Select value={data.paymentTerms} onValueChange={v => updateData('paymentTerms', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Per Term">Per Term</SelectItem>
                        <SelectItem value="Per Year">Per Year</SelectItem>
                        <SelectItem value="Per Semester">Per Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Fee Categories &amp; Default Amounts (per term, USD)</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs text-right">Primary Default</TableHead>
                        <TableHead className="text-xs text-right">Secondary Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeCategories.map(cat => (
                        <TableRow key={cat.name} className="hover:bg-muted/30">
                          <TableCell className="text-sm font-medium">{cat.name}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              defaultValue={cat.primaryDefault}
                              className="h-8 w-24 ml-auto text-right font-mono text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              defaultValue={cat.secondaryDefault}
                              className="h-8 w-24 ml-auto text-right font-mono text-xs"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground">Amounts can be adjusted per grade level later in Settings → Fee Structure</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Step 4 — User Setup
                </CardTitle>
                <CardDescription>Configure key staff members and their roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pre-filled Admin */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold">AU</div>
                    <div>
                      <p className="text-sm font-semibold">Admin User</p>
                      <p className="text-xs text-muted-foreground">admin@zimschool.co.zw</p>
                    </div>
                    <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-[10px]">Super Admin (Pre-filled)</Badge>
                  </div>
                </div>

                <Separator />

                {/* Headmaster */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Headmaster / Headmistress</Label>
                    <Input value={data.headmasterName} onChange={e => updateData('headmasterName', e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="flex items-end">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Role: Headmaster</Badge>
                  </div>
                </div>

                {/* Deputy Head */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Deputy Head</Label>
                    <Input value={data.deputyHeadName} onChange={e => updateData('deputyHeadName', e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="flex items-end">
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px]">Role: Deputy Head</Badge>
                  </div>
                </div>

                {/* Bursar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Bursar / Finance Officer</Label>
                    <Input value={data.bursarName} onChange={e => updateData('bursarName', e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="flex items-end">
                    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-[10px]">Role: Bursar</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Additional users can be added later through User Management in Settings.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Step 5 — Setup Complete!
                </CardTitle>
                <CardDescription>Review your configuration and start using ZimSchool Pro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {complete ? (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mx-auto mb-4 shadow-lg shadow-emerald-200"
                    >
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">Welcome to ZimSchool Pro!</h3>
                    <p className="text-sm text-muted-foreground mb-6">Your school has been configured successfully. You&apos;re all set to go.</p>
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md px-8">
                      Start Using ZimSchool Pro
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">School Information</h4>
                        <p className="text-sm"><span className="font-medium">Name:</span> {data.schoolName || 'Not set'}</p>
                        <p className="text-sm"><span className="font-medium">Type:</span> {data.schoolType}</p>
                        <p className="text-sm"><span className="font-medium">Ownership:</span> {data.ownership}</p>
                        <p className="text-sm"><span className="font-medium">Province:</span> {data.province}</p>
                        <p className="text-sm"><span className="font-medium">EMIS:</span> {data.emisNumber || 'Not set'}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Academic Setup</h4>
                        <p className="text-sm"><span className="font-medium">Year:</span> {data.academicYearName}</p>
                        <p className="text-sm"><span className="font-medium">Grade Levels:</span> {data.gradeLevels.length} selected</p>
                        <p className="text-sm"><span className="font-medium">Subjects:</span> {data.subjects.length} selected</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Fee Structure</h4>
                        <p className="text-sm"><span className="font-medium">Currency:</span> {data.feeCurrency}</p>
                        <p className="text-sm"><span className="font-medium">Payment Terms:</span> {data.paymentTerms}</p>
                        <p className="text-sm"><span className="font-medium">Categories:</span> {feeCategories.length} configured</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">User Setup</h4>
                        <p className="text-sm"><span className="font-medium">Admin:</span> Admin User (configured)</p>
                        <p className="text-sm"><span className="font-medium">Headmaster:</span> {data.headmasterName || 'Not set'}</p>
                        <p className="text-sm"><span className="font-medium">Deputy Head:</span> {data.deputyHeadName || 'Not set'}</p>
                        <p className="text-sm"><span className="font-medium">Bursar:</span> {data.bursarName || 'Not set'}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Show on login checkbox */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="show-wizard-login"
                        checked={showOnLogin}
                        onCheckedChange={(checked) => setShowOnLogin(checked === true)}
                      />
                      <label htmlFor="show-wizard-login" className="text-sm cursor-pointer">Show this wizard on next login</label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {!complete && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-1.5"
            >
              {step === totalSteps ? 'Complete Setup' : 'Next'}
              {step < totalSteps && <ChevronRight className="h-4 w-4" />}
              {step === totalSteps && <CheckCircle2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
