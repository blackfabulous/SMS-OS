'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  GraduationCap,
  DollarSign,
  Users,
  Home,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  School,
  Upload,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Sparkles,
  Flag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ElementType
}

const STEPS: WizardStep[] = [
  { id: 1, title: 'School Information', description: 'Basic school details', icon: Building2 },
  { id: 2, title: 'Academic Setup', description: 'Terms, grades, subjects', icon: GraduationCap },
  { id: 3, title: 'Fee Structure', description: 'Fee types and amounts', icon: DollarSign },
  { id: 4, title: 'Staff Setup', description: 'Key staff members', icon: Users },
  { id: 5, title: 'Infrastructure', description: 'Hostels, classrooms', icon: Home },
  { id: 6, title: 'Review & Complete', description: 'Verify and submit', icon: CheckCircle2 },
]

const ZIMBABWE_PROVINCES = [
  'Bulawayo', 'Harare', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
]

const DEFAULT_SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', department: 'Mathematics', isCore: true },
  { code: 'ENG', name: 'English Language', department: 'Languages', isCore: true },
  { code: 'SHO', name: 'Shona', department: 'Languages', isCore: true },
  { code: 'PHY', name: 'Physics', department: 'Sciences', isCore: false },
  { code: 'CHEM', name: 'Chemistry', department: 'Sciences', isCore: false },
  { code: 'BIO', name: 'Biology', department: 'Sciences', isCore: false },
  { code: 'HIST', name: 'History', department: 'Humanities', isCore: false },
  { code: 'GEO', name: 'Geography', department: 'Humanities', isCore: false },
  { code: 'ACC', name: 'Accounts', department: 'Commercial', isCore: false },
  { code: 'CS', name: 'Computer Science', department: 'Commercial', isCore: false },
]

const DEFAULT_PRIMARY_SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', department: 'Core', isCore: true },
  { code: 'ENG', name: 'English', department: 'Core', isCore: true },
  { code: 'SHO', name: 'Shona', department: 'Core', isCore: true },
  { code: 'SCI', name: 'Science', department: 'Core', isCore: true },
  { code: 'SS', name: 'Social Studies', department: 'Core', isCore: true },
  { code: 'RE', name: 'Religious Education', department: 'Core', isCore: true },
  { code: 'PE', name: 'Physical Education', department: 'Core', isCore: true },
  { code: 'ART', name: 'Art & Design', department: 'Creative', isCore: false },
  { code: 'MUSIC', name: 'Music', department: 'Creative', isCore: false },
  { code: 'ICT', name: 'Information Communication Tech', department: 'Core', isCore: true },
]

const SECONDARY_GRADES = [
  { name: 'Form 1', level: 'SECONDARY', sequence: 1 },
  { name: 'Form 2', level: 'SECONDARY', sequence: 2 },
  { name: 'Form 3', level: 'SECONDARY', sequence: 3 },
  { name: 'Form 4', level: 'SECONDARY', sequence: 4 },
  { name: 'Form 5', level: 'A_LEVEL', sequence: 5 },
  { name: 'Form 6', level: 'A_LEVEL', sequence: 6 },
]

const PRIMARY_GRADES = [
  { name: 'ECD A', level: 'ECD', sequence: 1 },
  { name: 'ECD B', level: 'ECD', sequence: 2 },
  { name: 'Grade 1', level: 'PRIMARY', sequence: 3 },
  { name: 'Grade 2', level: 'PRIMARY', sequence: 4 },
  { name: 'Grade 3', level: 'PRIMARY', sequence: 5 },
  { name: 'Grade 4', level: 'PRIMARY', sequence: 6 },
  { name: 'Grade 5', level: 'PRIMARY', sequence: 7 },
  { name: 'Grade 6', level: 'PRIMARY', sequence: 8 },
  { name: 'Grade 7', level: 'PRIMARY', sequence: 9 },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function SetupWizardModule() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupResult, setSetupResult] = useState<{ schoolName: string; summary: Record<string, number> } | null>(null)

  // Step 1: School Info
  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [schoolType, setSchoolType] = useState('GOVERNMENT')
  const [schoolLevel, setSchoolLevel] = useState('SECONDARY')
  const [ownershipType, setOwnershipType] = useState('GOVERNMENT')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [emisNumber, setEmisNumber] = useState('')
  const [motto, setMotto] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [physicalAddress, setPhysicalAddress] = useState('')

  // Step 2: Academic
  const [yearName, setYearName] = useState(`${new Date().getFullYear()} Academic Year`)
  const [yearStart, setYearStart] = useState(`${new Date().getFullYear()}-01-13`)
  const [yearEnd, setYearEnd] = useState(`${new Date().getFullYear()}-12-05`)
  const [terms, setTerms] = useState([
    { name: 'Term 1', termNumber: 1, startDate: `${new Date().getFullYear()}-01-13`, endDate: `${new Date().getFullYear()}-04-10` },
    { name: 'Term 2', termNumber: 2, startDate: `${new Date().getFullYear()}-05-05`, endDate: `${new Date().getFullYear()}-08-08` },
    { name: 'Term 3', termNumber: 3, startDate: `${new Date().getFullYear()}-09-01`, endDate: `${new Date().getFullYear()}-12-05` },
  ])
  const [grades, setGrades] = useState(SECONDARY_GRADES)
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS)
  const [classes, setClasses] = useState<{ gradeName: string; name: string; stream: string; capacity: number }[]>([])
  const [addClassOpen, setAddClassOpen] = useState(false)
  const [newClassGrade, setNewClassGrade] = useState('')
  const [newClassStream, setNewClassStream] = useState('A')
  const [newClassCapacity, setNewClassCapacity] = useState('40')

  // Step 3: Fees
  const [feeItems, setFeeItems] = useState<{ gradeName: string; feeType: string; amount: string; currency: string }[]>([])

  // Step 4: Staff
  const [headmaster, setHeadmaster] = useState({ firstName: '', lastName: '', phone: '', email: '' })
  const [deputy, setDeputy] = useState({ firstName: '', lastName: '', phone: '', email: '' })
  const [bursar, setBursar] = useState({ firstName: '', lastName: '', phone: '', email: '' })
  const [seniorTeachers, setSeniorTeachers] = useState<{ firstName: string; lastName: string; subjectSpecialisation: string; phone: string }[]>([])
  const [addTeacherOpen, setAddTeacherOpen] = useState(false)
  const [newTeacher, setNewTeacher] = useState({ firstName: '', lastName: '', subjectSpecialisation: '', phone: '' })

  // Step 5: Infrastructure
  const [hostels, setHostels] = useState<{ name: string; gender: string; capacity: string }[]>([])
  const [addHostelOpen, setAddHostelOpen] = useState(false)
  const [newHostel, setNewHostel] = useState({ name: '', gender: 'Mixed', capacity: '50' })
  const [classroomCount, setClassroomCount] = useState('20')
  const [facilities, setFacilities] = useState<string[]>([])
  const [facilityOptions] = useState([
    'Science Lab', 'Computer Lab', 'Library', 'Sports Field', 'Swimming Pool',
    'Chapel', 'Assembly Hall', 'Sick Bay', 'Tuck Shop', 'Staff Room',
    'Admin Block', 'Kitchen', 'Dining Hall', 'Workshop', 'Farm',
  ])

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleLevelChange = useCallback((level: string) => {
    setSchoolLevel(level)
    if (level === 'PRIMARY' || level === 'COMBINED') {
      setGrades(level === 'COMBINED' ? [...PRIMARY_GRADES, ...SECONDARY_GRADES] : PRIMARY_GRADES)
      setSubjects(DEFAULT_PRIMARY_SUBJECTS)
    } else {
      setGrades(SECONDARY_GRADES)
      setSubjects(DEFAULT_SUBJECTS)
    }
    // Reset classes and fees when level changes
    setClasses([])
    setFeeItems([])
  }, [])

  const generateDefaultClasses = useCallback(() => {
    const defaultClasses = grades.map(g => ({
      gradeName: g.name,
      name: `${g.name} A`,
      stream: 'A',
      capacity: 40,
    }))
    setClasses(defaultClasses)
    toast.success(`Generated ${defaultClasses.length} default classes`)
  }, [grades])

  const generateDefaultFees = useCallback(() => {
    const feeTypes = ['Tuition Fee', 'Activity Fee', 'Levy']
    const defaultFees = grades.flatMap(g =>
      feeTypes.map(ft => ({
        gradeName: g.name,
        feeType: ft,
        amount: ft === 'Tuition Fee' ? '450' : ft === 'Activity Fee' ? '50' : '100',
        currency: 'USD',
      }))
    )
    setFeeItems(defaultFees)
    toast.success(`Generated ${defaultFees.length} fee items`)
  }, [grades])

  const addClass = useCallback(() => {
    if (!newClassGrade) return
    setClasses(prev => [...prev, {
      gradeName: newClassGrade,
      name: `${newClassGrade} ${newClassStream}`,
      stream: newClassStream,
      capacity: parseInt(newClassCapacity) || 40,
    }])
    setAddClassOpen(false)
    setNewClassGrade('')
    setNewClassStream('A')
    setNewClassCapacity('40')
  }, [newClassGrade, newClassStream, newClassCapacity])

  const removeClass = useCallback((index: number) => {
    setClasses(prev => prev.filter((_, i) => i !== index))
  }, [])

  const addTeacher = useCallback(() => {
    if (!newTeacher.firstName || !newTeacher.lastName) return
    setSeniorTeachers(prev => [...prev, { ...newTeacher }])
    setAddTeacherOpen(false)
    setNewTeacher({ firstName: '', lastName: '', subjectSpecialisation: '', phone: '' })
  }, [newTeacher])

  const removeTeacher = useCallback((index: number) => {
    setSeniorTeachers(prev => prev.filter((_, i) => i !== index))
  }, [])

  const addHostel = useCallback(() => {
    if (!newHostel.name) return
    setHostels(prev => [...prev, { ...newHostel }])
    setAddHostelOpen(false)
    setNewHostel({ name: '', gender: 'Mixed', capacity: '50' })
  }, [newHostel])

  const removeHostel = useCallback((index: number) => {
    setHostels(prev => prev.filter((_, i) => i !== index))
  }, [])

  const toggleFacility = useCallback((facility: string) => {
    setFacilities(prev =>
      prev.includes(facility)
        ? prev.filter(f => f !== facility)
        : [...prev, facility]
    )
  }, [])

  const toggleSubject = useCallback((code: string) => {
    setSubjects(prev =>
      prev.some(s => s.code === code)
        ? prev.filter(s => s.code !== code)
        : [...prev, (schoolLevel === 'PRIMARY' ? DEFAULT_PRIMARY_SUBJECTS : DEFAULT_SUBJECTS).find(s => s.code === code)!]
    )
  }, [schoolLevel])

  // ─── Validation ────────────────────────────────────────────────────────────
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: return !!(schoolName && schoolCode && province && district)
      case 2: return !!(yearName && terms.length > 0 && grades.length > 0 && subjects.length > 0)
      case 3: return feeItems.length > 0
      case 4: return !!(headmaster.firstName && headmaster.lastName)
      case 5: return true
      case 6: return true
      default: return false
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const payload = {
        school: {
          name: schoolName,
          code: schoolCode,
          type: schoolType,
          district,
          province,
          emisNumber: emisNumber || undefined,
          motto: motto || undefined,
          levelType: schoolLevel,
          ownershipType,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          physicalAddress: physicalAddress || undefined,
        },
        academic: {
          yearName,
          startDate: yearStart,
          endDate: yearEnd,
          terms,
          grades,
          subjects,
          classes,
        },
        fees: { grades: feeItems.map(f => ({ ...f, amount: parseFloat(f.amount) || 0 })) },
        staff: {
          headmaster: headmaster.firstName ? headmaster : undefined,
          deputy: deputy.firstName ? deputy : undefined,
          bursar: bursar.firstName ? bursar : undefined,
          seniorTeachers,
        },
        infrastructure: {
          hostels: hostels.map(h => ({ ...h, capacity: parseInt(h.capacity) || 50 })),
          classrooms: parseInt(classroomCount) || 20,
          facilities,
        },
      }

      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setSetupComplete(true)
        setSetupResult({ schoolName: data.schoolName, summary: data.summary })
        toast.success('School setup completed!', { description: `${data.schoolName} has been configured successfully.` })
      } else {
        toast.error('Setup failed', { description: data.error || 'Unknown error' })
      }
    } catch {
      toast.error('Setup failed', { description: 'Could not connect to server' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercent = (currentStep / 6) * 100

  // ─── Step Content Renderers ───────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">School Name <span className="text-red-500">*</span></Label>
          <Input placeholder="e.g., Mufakose High School" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">School Code <span className="text-red-500">*</span></Label>
          <Input placeholder="e.g., MHS001" value={schoolCode} onChange={e => setSchoolCode(e.target.value.toUpperCase())} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>School Type</Label>
          <Select value={schoolType} onValueChange={setSchoolType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GOVERNMENT">Government</SelectItem>
              <SelectItem value="MISSION">Mission</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="COUNCIL">Council</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">Level <span className="text-red-500">*</span></Label>
          <Select value={schoolLevel} onValueChange={handleLevelChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIMARY">Primary School</SelectItem>
              <SelectItem value="SECONDARY">Secondary School</SelectItem>
              <SelectItem value="COMBINED">Combined School</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ownership</Label>
          <Select value={ownershipType} onValueChange={setOwnershipType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GOVERNMENT">Government</SelectItem>
              <SelectItem value="CHURCH">Church</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="LOCAL_AUTHORITY">Local Authority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">Province <span className="text-red-500">*</span></Label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
            <SelectContent>
              {ZIMBABWE_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">District <span className="text-red-500">*</span></Label>
          <Input placeholder="e.g., Harare" value={district} onChange={e => setDistrict(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>EMIS Number</Label>
          <Input placeholder="e.g., E1234" value={emisNumber} onChange={e => setEmisNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>School Motto</Label>
          <Input placeholder="e.g., Knowledge is Power" value={motto} onChange={e => setMotto(e.target.value)} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label><Mail className="h-3 w-3 inline mr-1" />Contact Email</Label>
          <Input placeholder="info@school.co.zw" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label><Phone className="h-3 w-3 inline mr-1" />Contact Phone</Label>
          <Input placeholder="+263 4 XXXXXX" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label><MapPin className="h-3 w-3 inline mr-1" />Physical Address</Label>
          <Input placeholder="School address" value={physicalAddress} onChange={e => setPhysicalAddress(e.target.value)} />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Academic Year */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Academic Year</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Year Name</Label>
            <Input value={yearName} onChange={e => setYearName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={yearStart} onChange={e => setYearStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={yearEnd} onChange={e => setYearEnd(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Terms */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Terms ({terms.length})</h4>
        <div className="space-y-3">
          {terms.map((term, idx) => (
            <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/30 rounded-lg p-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input className="h-8 text-sm" value={term.name} onChange={e => {
                  const updated = [...terms]; updated[idx] = { ...updated[idx], name: e.target.value }; setTerms(updated)
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start</Label>
                <Input className="h-8 text-sm" type="date" value={term.startDate} onChange={e => {
                  const updated = [...terms]; updated[idx] = { ...updated[idx], startDate: e.target.value }; setTerms(updated)
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End</Label>
                <Input className="h-8 text-sm" type="date" value={term.endDate} onChange={e => {
                  const updated = [...terms]; updated[idx] = { ...updated[idx], endDate: e.target.value }; setTerms(updated)
                }} />
              </div>
              <div className="flex items-end">
                <Badge variant="outline" className="text-xs">Term {term.termNumber}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grades */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Grades ({grades.length})</h4>
        <div className="flex flex-wrap gap-2">
          {grades.map(g => (
            <Badge key={g.name} variant="secondary" className="px-3 py-1.5">
              {g.name} <span className="text-[10px] text-muted-foreground ml-1">({g.level})</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Subjects ({subjects.length})</h4>
        <div className="flex flex-wrap gap-2">
          {(schoolLevel === 'PRIMARY' ? DEFAULT_PRIMARY_SUBJECTS : DEFAULT_SUBJECTS).map(s => (
            <button
              key={s.code}
              onClick={() => toggleSubject(s.code)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                subjects.some(sub => sub.code === s.code)
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-muted/30 text-muted-foreground border-transparent hover:border-muted'
              )}
            >
              {s.name}
              {s.isCore && <span className="ml-1 text-[9px] opacity-60">(Core)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Classes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Classes ({classes.length})</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={generateDefaultClasses}>
              <Sparkles className="h-3 w-3" /> Auto-generate
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setAddClassOpen(true)}>
              <Plus className="h-3 w-3" /> Add Class
            </Button>
          </div>
        </div>
        {classes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {classes.map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <span className="text-xs font-medium">{cls.name}</span>
                <button onClick={() => removeClass(idx)} className="text-muted-foreground hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No classes configured. Click &quot;Auto-generate&quot; to create default classes.</p>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Fee Structure</h4>
          <p className="text-xs text-muted-foreground">Define fee types and amounts per grade</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={generateDefaultFees}>
          <Sparkles className="h-3 w-3" /> Auto-generate defaults
        </Button>
      </div>

      {feeItems.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {feeItems.map((fee, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2 bg-muted/30 rounded-lg p-3 items-center">
              <span className="text-xs font-medium truncate">{fee.gradeName}</span>
              <span className="text-xs text-muted-foreground">{fee.feeType}</span>
              <div className="flex items-center gap-1">
                <Input className="h-7 text-xs w-20" value={fee.amount} onChange={e => {
                  const updated = [...feeItems]; updated[idx] = { ...updated[idx], amount: e.target.value }; setFeeItems(updated)
                }} />
                <Select value={fee.currency} onValueChange={v => {
                  const updated = [...feeItems]; updated[idx] = { ...updated[idx], currency: v }; setFeeItems(updated)
                }}>
                  <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ZiG">ZiG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button onClick={() => setFeeItems(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-500 justify-self-end">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/20 rounded-lg">
          <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No fee items configured</p>
          <p className="text-xs text-muted-foreground">Click &quot;Auto-generate defaults&quot; to create standard fee structures</p>
        </div>
      )}

      {feeItems.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Fee Items</p>
          <p className="text-lg font-bold text-emerald-600">{feeItems.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Total per grade: ${feeItems.filter(f => f.gradeName === grades[0]?.name).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Headmaster */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <School className="h-4 w-4 text-emerald-600" /> Headmaster <span className="text-red-500 text-xs">*required</span>
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">First Name</Label><Input className="h-8 text-sm" value={headmaster.firstName} onChange={e => setHeadmaster(p => ({ ...p, firstName: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Last Name</Label><Input className="h-8 text-sm" value={headmaster.lastName} onChange={e => setHeadmaster(p => ({ ...p, lastName: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Phone</Label><Input className="h-8 text-sm" value={headmaster.phone} onChange={e => setHeadmaster(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-8 text-sm" value={headmaster.email} onChange={e => setHeadmaster(p => ({ ...p, email: e.target.value }))} /></div>
        </div>
      </div>

      {/* Deputy */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold">Deputy Head</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">First Name</Label><Input className="h-8 text-sm" value={deputy.firstName} onChange={e => setDeputy(p => ({ ...p, firstName: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Last Name</Label><Input className="h-8 text-sm" value={deputy.lastName} onChange={e => setDeputy(p => ({ ...p, lastName: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Phone</Label><Input className="h-8 text-sm" value={deputy.phone} onChange={e => setDeputy(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-8 text-sm" value={deputy.email} onChange={e => setDeputy(p => ({ ...p, email: e.target.value }))} /></div>
        </div>
      </div>

      {/* Bursar */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold">Bursar</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">First Name</Label><Input className="h-8 text-sm" value={bursar.firstName} onChange={e => setBursar(p => ({ ...p, firstName: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Last Name</Label><Input className="h-8 text-sm" value={bursar.lastName} onChange={e => setBursar(p => ({ ...p, lastName: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Phone</Label><Input className="h-8 text-sm" value={bursar.phone} onChange={e => setBursar(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-8 text-sm" value={bursar.email} onChange={e => setBursar(p => ({ ...p, email: e.target.value }))} /></div>
        </div>
      </div>

      {/* Senior Teachers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Senior Teachers ({seniorTeachers.length})</h4>
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setAddTeacherOpen(true)}>
            <Plus className="h-3 w-3" /> Add Teacher
          </Button>
        </div>
        {seniorTeachers.length > 0 ? (
          <div className="space-y-2">
            {seniorTeachers.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">{t.firstName} {t.lastName}</p>
                  <p className="text-xs text-muted-foreground">{t.subjectSpecialisation} {t.phone && `• ${t.phone}`}</p>
                </div>
                <button onClick={() => removeTeacher(idx)} className="text-muted-foreground hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">No senior teachers added yet</p>
        )}
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      {/* Hostels */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Hostels ({hostels.length})</h4>
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setAddHostelOpen(true)}>
            <Plus className="h-3 w-3" /> Add Hostel
          </Button>
        </div>
        {hostels.length > 0 ? (
          <div className="space-y-2">
            {hostels.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.gender} • Capacity: {h.capacity}</p>
                </div>
                <button onClick={() => removeHostel(idx)} className="text-muted-foreground hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">No hostels — skip if day school</p>
        )}
      </div>

      {/* Classrooms */}
      <div className="space-y-2">
        <Label>Number of Classrooms</Label>
        <Input type="number" value={classroomCount} onChange={e => setClassroomCount(e.target.value)} className="w-32" />
      </div>

      {/* Facilities */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Facilities ({facilities.length} selected)</h4>
        <div className="flex flex-wrap gap-2">
          {facilityOptions.map(f => (
            <button
              key={f}
              onClick={() => toggleFacility(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                facilities.includes(f)
                  ? 'bg-teal-100 text-teal-700 border-teal-300'
                  : 'bg-muted/30 text-muted-foreground border-transparent hover:border-muted'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">Review Your Setup</h3>
        <p className="text-sm text-muted-foreground">Verify all details before completing the setup</p>
      </div>

      {/* School Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" /> School Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{schoolName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span className="font-mono">{schoolCode || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{schoolType} • {schoolLevel}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{district}, {province}</span></div>
          {motto && <div className="flex justify-between"><span className="text-muted-foreground">Motto</span><span className="italic">&quot;{motto}&quot;</span></div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{terms.length}</p><p className="text-xs text-muted-foreground">Terms</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-teal-600">{grades.length}</p><p className="text-xs text-muted-foreground">Grades</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{subjects.length}</p><p className="text-xs text-muted-foreground">Subjects</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-violet-600">{classes.length}</p><p className="text-xs text-muted-foreground">Classes</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{feeItems.length}</p><p className="text-xs text-muted-foreground">Fee Items</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-teal-600">{1 + (deputy.firstName ? 1 : 0) + (bursar.firstName ? 1 : 0) + seniorTeachers.length}</p><p className="text-xs text-muted-foreground">Staff</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{hostels.length}</p><p className="text-xs text-muted-foreground">Hostels</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-violet-600">{facilities.length}</p><p className="text-xs text-muted-foreground">Facilities</p></CardContent></Card>
      </div>

      {!isStepValid(1) && (
        <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Some required fields are missing. Please go back and complete Step 1 (School Name, Code, Province, District) and Step 4 (Headmaster).</span>
        </div>
      )}
    </div>
  )

  // ─── Completion Screen ─────────────────────────────────────────────────────
  if (setupComplete) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}>
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold mt-6">School Setup Complete!</h2>
          <p className="text-muted-foreground mt-2">{setupResult?.schoolName} has been configured successfully.</p>

          {setupResult?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto mt-6">
              {Object.entries(setupResult.summary).map(([key, value]) => (
                <Card key={key} className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">{value}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mt-8">
            <Flag className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">You can now start enrolling students and managing your school!</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <School className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Multi-School Setup Wizard</h2>
            <p className="text-sm text-muted-foreground">Configure a new school in 6 easy steps</p>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium">Step {currentStep} of 6</span>
            <span className="text-xs text-muted-foreground">{Math.round(progressPercent)}% complete</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex items-center justify-between mt-3">
            {STEPS.map(step => (
              <button
                key={step.id}
                onClick={() => { if (step.id <= currentStep) setCurrentStep(step.id) }}
                className={cn(
                  'flex flex-col items-center gap-1 transition-all',
                  step.id === currentStep ? 'text-emerald-600' : step.id < currentStep ? 'text-emerald-400' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                  step.id === currentStep ? 'border-emerald-500 bg-emerald-50' : step.id < currentStep ? 'border-emerald-400 bg-emerald-100' : 'border-muted'
                )}>
                  {step.id < currentStep ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-[10px] font-medium hidden md:block">{step.title}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(STEPS[currentStep - 1].icon, { className: 'h-5 w-5 text-emerald-600' })}
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
              {currentStep === 6 && renderStep6()}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
          disabled={currentStep === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        {currentStep < 6 ? (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 gap-1"
            onClick={() => setCurrentStep(s => Math.min(6, s + 1))}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting || !isStepValid(1)}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isSubmitting ? 'Creating School...' : 'Complete Setup'}
          </Button>
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={newClassGrade} onValueChange={setNewClassGrade}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {grades.map(g => <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stream</Label>
              <Select value={newClassStream} onValueChange={setNewClassStream}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D'].map(s => <SelectItem key={s} value={s}>Stream {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={newClassCapacity} onChange={e => setNewClassCapacity(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClassOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addClass}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Teacher Dialog */}
      <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Senior Teacher</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>First Name</Label><Input value={newTeacher.firstName} onChange={e => setNewTeacher(p => ({ ...p, firstName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={newTeacher.lastName} onChange={e => setNewTeacher(p => ({ ...p, lastName: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Subject Specialisation</Label><Input value={newTeacher.subjectSpecialisation} onChange={e => setNewTeacher(p => ({ ...p, subjectSpecialisation: e.target.value }))} placeholder="e.g., Mathematics" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={newTeacher.phone} onChange={e => setNewTeacher(p => ({ ...p, phone: e.target.value }))} placeholder="+263..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTeacherOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addTeacher}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hostel Dialog */}
      <Dialog open={addHostelOpen} onOpenChange={setAddHostelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Hostel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Hostel Name</Label><Input value={newHostel.name} onChange={e => setNewHostel(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Mufakose Boys Hostel" /></div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={newHostel.gender} onValueChange={v => setNewHostel(p => ({ ...p, gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Boys</SelectItem>
                  <SelectItem value="Female">Girls</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={newHostel.capacity} onChange={e => setNewHostel(p => ({ ...p, capacity: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHostelOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addHostel}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
