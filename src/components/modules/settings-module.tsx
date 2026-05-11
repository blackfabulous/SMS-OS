'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'

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
}

// ─── Settings Module ─────────────────────────────────────────────────────────

export default function SettingsModule() {
  const [school, setSchool] = useState<SchoolProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Form state
  const [form, setForm] = useState<Partial<SchoolProfile>>({})

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

  useEffect(() => {
    fetchSchool()
  }, [fetchSchool])

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

  // Audit logs (simulated)
  const auditLogs = [
    { id: '1', action: 'CREATE', entity: 'Student', user: 'Admin User', date: '2025-03-05 10:15', details: 'Created student Tendai Moyo' },
    { id: '2', action: 'UPDATE', entity: 'FeeInvoice', user: 'Clerk User', date: '2025-03-05 09:30', details: 'Updated invoice INV2024001' },
    { id: '3', action: 'PAYMENT', entity: 'FeePayment', user: 'Clerk User', date: '2025-03-05 09:15', details: 'Recorded payment $450' },
    { id: '4', action: 'LOGIN', entity: 'User', user: 'Mr. Dube', date: '2025-03-05 07:45', details: 'User logged in' },
    { id: '5', action: 'CREATE', entity: 'Attendance', user: 'Mrs. Ncube', date: '2025-03-04 08:30', details: 'Bulk attendance recorded' },
  ]

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
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <School className="mr-1.5 h-3.5 w-3.5" />
            School Profile
          </TabsTrigger>
          <TabsTrigger value="academic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Academic Setup
          </TabsTrigger>
          <TabsTrigger value="fees" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Fee Structure
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Database className="mr-1.5 h-3.5 w-3.5" />
            System
          </TabsTrigger>
        </TabsList>

        {/* ─── School Profile Tab ────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic Info */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
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
                <CardTitle className="text-base font-semibold">Leadership & Contact</CardTitle>
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
                <CardTitle className="text-base font-semibold">Banking & Statutory</CardTitle>
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

            {/* Registration Status */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Registration & SDC</CardTitle>
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

          {/* Audit Log */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Audit Log
              </CardTitle>
              <CardDescription>Recent system activity</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
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
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 border-amber-200' : log.action === 'PAYMENT' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
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
