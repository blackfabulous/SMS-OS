'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  GraduationCap,
  DollarSign,
  Shield,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Flag,
  Eye,
  EyeOff,
  User,
  BookOpen,
  Bus,
  BedDouble,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleContainer } from '@/components/module-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { useApiMutation } from '@/hooks/use-api-query'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ElementType
}

interface SetupPayload {
  school: Record<string, unknown>
  academic: Record<string, unknown>
  fees: Record<string, unknown>
  admin: Record<string, unknown>
}

interface SetupResult {
  success: boolean
  schoolName: string
  summary: Record<string, number>
}

const STEPS: WizardStep[] = [
  { id: 1, title: 'School Information', description: 'Basic school details & contact', icon: Building2 },
  { id: 2, title: 'Academic Structure', description: 'Grades, streams & terms', icon: GraduationCap },
  { id: 3, title: 'Fee Structure', description: 'Tuition, boarding & transport', icon: DollarSign },
  { id: 4, title: 'Admin Account', description: 'Create administrator login', icon: Shield },
  { id: 5, title: 'Review & Submit', description: 'Verify and complete setup', icon: CheckCircle2 },
]

const ZIMBABWE_PROVINCES = [
  'Bulawayo', 'Harare', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
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

const STREAMS = ['A', 'B', 'C']

const FEE_TYPES = [
  { key: 'tuition', label: 'Tuition Fee', icon: BookOpen },
  { key: 'boarding', label: 'Boarding Fee', icon: BedDouble },
  { key: 'transport', label: 'Transport Fee', icon: Bus },
  { key: 'other', label: 'Other Fees', icon: DollarSign },
]

// ─── Animation Variants ───────────────────────────────────────────────────────
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SetupWizardModule() {
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupResult, setSetupResult] = useState<{ schoolName: string; summary: Record<string, number> } | null>(null)

  const { mutate: submitSetup, isPending: isSubmitting } = useApiMutation<SetupPayload, SetupResult>('/api/school', {
    onSuccess: (data) => {
      setSetupComplete(true)
      setSetupResult({ schoolName: data.schoolName, summary: data.summary })
      toast.success('School setup completed!', { description: `${data.schoolName} has been configured successfully.` })
    },
    onError: (error) => {
      toast.error('Setup failed', { description: error.message })
    },
  })

  // Step 1: School Info
  const [schoolName, setSchoolName] = useState('')
  const [emisNumber, setEmisNumber] = useState('')
  const [motto, setMotto] = useState('')
  const [schoolType, setSchoolType] = useState<'PRIMARY' | 'SECONDARY' | 'COMBINED'>('SECONDARY')
  const [province, setProvince] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [principalName, setPrincipalName] = useState('')

  // Step 2: Academic Structure
  const [yearStart, setYearStart] = useState(`${new Date().getFullYear()}-01-13`)
  const [terms, setTerms] = useState([
    { name: 'Term 1', termNumber: 1, startDate: `${new Date().getFullYear()}-01-13`, endDate: `${new Date().getFullYear()}-04-10` },
    { name: 'Term 2', termNumber: 2, startDate: `${new Date().getFullYear()}-05-05`, endDate: `${new Date().getFullYear()}-08-08` },
    { name: 'Term 3', termNumber: 3, startDate: `${new Date().getFullYear()}-09-01`, endDate: `${new Date().getFullYear()}-12-05` },
  ])
  const [grades, setGrades] = useState(SECONDARY_GRADES)
  const [streamsPerGrade, setStreamsPerGrade] = useState(1) // 1=A, 2=A+B, 3=A+B+C
  const [addStreamOpen, setAddStreamOpen] = useState(false)

  // Step 3: Fee Structure
  const [feeData, setFeeData] = useState<Record<string, Record<string, { usd: string; zig: string }>>>({})

  // Step 4: Admin Account
  const [adminEmail, setAdminEmail] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ─── Derived Data ─────────────────────────────────────────────────────────
  const activeStreams = STREAMS.slice(0, streamsPerGrade)

  const generateClasses = useCallback(() => {
    return grades.flatMap(g =>
      activeStreams.map(stream => ({
        gradeName: g.name,
        name: `${g.name} ${stream}`,
        stream,
        capacity: 40,
      }))
    )
  }, [grades, activeStreams])

  const classes = generateClasses()

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleTypeChange = useCallback((type: 'PRIMARY' | 'SECONDARY' | 'COMBINED') => {
    setSchoolType(type)
    if (type === 'PRIMARY') {
      setGrades(PRIMARY_GRADES)
    } else if (type === 'SECONDARY') {
      setGrades(SECONDARY_GRADES)
    } else {
      setGrades([...PRIMARY_GRADES, ...SECONDARY_GRADES])
    }
    setFeeData({})
  }, [])

  const generateDefaultFees = useCallback(() => {
    const defaults: Record<string, Record<string, { usd: string; zig: string }>> = {}
    for (const g of grades) {
      defaults[g.name] = {
        tuition: { usd: g.level === 'A_LEVEL' ? '600' : g.level === 'SECONDARY' ? '450' : '300', zig: g.level === 'A_LEVEL' ? '15000' : g.level === 'SECONDARY' ? '11250' : '7500' },
        boarding: { usd: '200', zig: '5000' },
        transport: { usd: '80', zig: '2000' },
        other: { usd: '50', zig: '1250' },
      }
    }
    setFeeData(defaults)
    toast.success(`Generated fee structure for ${grades.length} grades`)
  }, [grades])

  const updateFeeAmount = useCallback((gradeName: string, feeKey: string, currency: 'usd' | 'zig', value: string) => {
    setFeeData(prev => ({
      ...prev,
      [gradeName]: {
        ...prev[gradeName],
        [feeKey]: {
          ...prev[gradeName]?.[feeKey],
          [currency]: value,
        },
      },
    }))
  }, [])

  // ─── Validation ────────────────────────────────────────────────────────────
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: return !!(schoolName && emisNumber && province && contactPhone && principalName)
      case 2: return terms.length === 3 && grades.length > 0
      case 3: return Object.keys(feeData).length > 0
      case 4: return !!(adminEmail && adminName && adminPassword && adminPassword.length >= 8 && adminPassword === adminConfirmPassword)
      case 5: return true
      default: return false
    }
  }

  const getStepErrors = (step: number): string[] => {
    const errors: string[] = []
    switch (step) {
      case 1: {
        if (!schoolName) errors.push('School name is required')
        if (!emisNumber) errors.push('EMIS number is required')
        if (!province) errors.push('Province is required')
        if (!contactPhone) errors.push('Contact phone is required')
        if (!principalName) errors.push('Principal name is required')
        break
      }
      case 2: {
        if (terms.length !== 3) errors.push('Three terms are required')
        if (grades.length === 0) errors.push('At least one grade is required')
        break
      }
      case 3: {
        if (Object.keys(feeData).length === 0) errors.push('Fee structure must be configured')
        break
      }
      case 4: {
        if (!adminEmail) errors.push('Admin email is required')
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) errors.push('Invalid email format')
        if (!adminName) errors.push('Admin name is required')
        if (!adminPassword) errors.push('Password is required')
        else if (adminPassword.length < 8) errors.push('Password must be at least 8 characters')
        if (adminPassword !== adminConfirmPassword) errors.push('Passwords do not match')
        break
      }
    }
    return errors
  }

  const goToStep = useCallback((step: number) => {
    if (step < currentStep || isStepValid(currentStep)) {
      setDirection(step > currentStep ? 1 : -1)
      setCurrentStep(step)
    }
  }, [currentStep, isStepValid])

  const nextStep = useCallback(() => {
    if (currentStep < 5 && isStepValid(currentStep)) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, isStepValid])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const feeItems: { gradeName: string; feeType: string; amount: number; currency: string }[] = []
    for (const [gradeName, fees] of Object.entries(feeData)) {
      for (const [feeKey, amounts] of Object.entries(fees)) {
        const usdVal = parseFloat(amounts.usd) || 0
        const zigVal = parseFloat(amounts.zig) || 0
        if (usdVal > 0) {
          feeItems.push({ gradeName, feeType: FEE_TYPES.find(f => f.key === feeKey)?.label || feeKey, amount: usdVal, currency: 'USD' })
        }
        if (zigVal > 0) {
          feeItems.push({ gradeName, feeType: FEE_TYPES.find(f => f.key === feeKey)?.label || feeKey, amount: zigVal, currency: 'ZiG' })
        }
      }
    }

    const payload: SetupPayload = {
      school: {
        name: schoolName,
        code: emisNumber,
        emisNumber,
        motto: motto || undefined,
        levelType: schoolType,
        province,
        contactEmail: contactEmail || undefined,
        contactPhone,
        headName: principalName,
        schoolType: 'GOVERNMENT',
        ownershipType: 'GOVERNMENT',
      },
      academic: {
        yearName: `${new Date().getFullYear()} Academic Year`,
        startDate: yearStart,
        endDate: `${new Date().getFullYear()}-12-05`,
        terms,
        grades,
        classes,
        subjects: [],
      },
      fees: { grades: feeItems },
      admin: {
        email: adminEmail,
        name: adminName,
        password: adminPassword,
      },
    }

    submitSetup(payload)
  }

  const progressPercent = (currentStep / 5) * 100

  // ─── Step Content Renderers ───────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* School Basic Info */}
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> School Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">School Name <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g., Mufakose High School" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">EMIS Number <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g., E1234" value={emisNumber} onChange={e => setEmisNumber(e.target.value.toUpperCase())} className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>School Motto</Label>
          <Input placeholder="e.g., Knowledge is Power" value={motto} onChange={e => setMotto(e.target.value)} className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">School Type <span className="text-red-500">*</span></Label>
          <Select value={schoolType} onValueChange={v => handleTypeChange(v as 'PRIMARY' | 'SECONDARY' | 'COMBINED')}>
            <SelectTrigger className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIMARY">Primary School</SelectItem>
              <SelectItem value="SECONDARY">Secondary School</SelectItem>
              <SelectItem value="COMBINED">Combined School</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-emerald-100 dark:bg-emerald-900/30" />

      {/* Location */}
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Location
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Province <span className="text-red-500">*</span></Label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {ZIMBABWE_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Principal Name <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g., Mr. J. Moyo" value={principalName} onChange={e => setPrincipalName(e.target.value)} className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
          </div>
        </div>
      </div>

      <Separator className="bg-emerald-100 dark:bg-emerald-900/30" />

      {/* Contact */}
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <Phone className="h-4 w-4" /> Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Contact Phone <span className="text-red-500">*</span></Label>
            <Input placeholder="+263 4 XXXXXX" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Contact Email</Label>
            <Input placeholder="info@school.co.zw" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Grade Levels */}
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Grade Levels
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Based on your school type (<span className="font-medium text-emerald-600">{schoolType}</span>), these grades are configured:
        </p>
        <div className="flex flex-wrap gap-2">
          {grades.map(g => (
            <Badge key={g.name} variant="secondary" className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
              {g.name} <span className="text-[10px] opacity-60 ml-1">({g.level})</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Streams */}
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Streams per Grade
        </h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {([1, 2, 3] as const).map(count => (
            <button
              key={count}
              onClick={() => setStreamsPerGrade(count)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-center',
                streamsPerGrade === count
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md shadow-emerald-100 dark:shadow-emerald-900/20'
                  : 'border-muted hover:border-emerald-200 dark:hover:border-emerald-800'
              )}
            >
              <p className="text-2xl font-bold text-emerald-600">{count}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {count === 1 ? 'Single stream' : count === 2 ? 'A & B streams' : 'A, B & C streams'}
              </p>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {activeStreams.map(s => (
            <Badge key={s} className="bg-teal-100 text-teal-700 border border-teal-300 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800">
              Stream {s}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This will create <span className="font-semibold text-emerald-600">{grades.length * streamsPerGrade}</span> classes total
        </p>
      </div>

      {/* Academic Year */}
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">Academic Year Start</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Year Start Date</Label>
            <Input type="date" value={yearStart} onChange={e => setYearStart(e.target.value)} className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
          </div>
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Input value={`${new Date().getFullYear()} Academic Year`} disabled className="bg-muted/50" />
          </div>
        </div>
      </div>

      {/* Terms */}
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">Three Terms</h4>
        <div className="space-y-3">
          {terms.map((term, idx) => (
            <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Term Name</Label>
                <Input className="h-8 text-sm border-emerald-200 focus:border-emerald-500" value={term.name} onChange={e => {
                  const updated = [...terms]; updated[idx] = { ...updated[idx], name: e.target.value }; setTerms(updated)
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Start Date</Label>
                <Input className="h-8 text-sm border-emerald-200 focus:border-emerald-500" type="date" value={term.startDate} onChange={e => {
                  const updated = [...terms]; updated[idx] = { ...updated[idx], startDate: e.target.value }; setTerms(updated)
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">End Date</Label>
                <Input className="h-8 text-sm border-emerald-200 focus:border-emerald-500" type="date" value={term.endDate} onChange={e => {
                  const updated = [...terms]; updated[idx] = { ...updated[idx], endDate: e.target.value }; setTerms(updated)
                }} />
              </div>
              <div className="flex items-end">
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
                  Term {term.termNumber}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Fee Structure</h4>
          <p className="text-xs text-muted-foreground">Define fee amounts per grade in USD and ZiG</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30" onClick={generateDefaultFees}>
          <Sparkles className="h-3 w-3" /> Auto-generate defaults
        </Button>
      </div>

      {Object.keys(feeData).length > 0 ? (
        <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1">
          {grades.map(grade => (
            <div key={grade.name} className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
              <h5 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">{grade.name}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FEE_TYPES.map(ft => {
                  const FeeIcon = ft.icon
                  return (
                    <div key={ft.key} className="bg-white dark:bg-background rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <FeeIcon className="h-3 w-3" /> {ft.label}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">USD</Label>
                          <Input
                            className="h-7 text-xs border-emerald-200 focus:border-emerald-500"
                            placeholder="0.00"
                            value={feeData[grade.name]?.[ft.key]?.usd || ''}
                            onChange={e => updateFeeAmount(grade.name, ft.key, 'usd', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">ZiG</Label>
                          <Input
                            className="h-7 text-xs border-emerald-200 focus:border-emerald-500"
                            placeholder="0.00"
                            value={feeData[grade.name]?.[ft.key]?.zig || ''}
                            onChange={e => updateFeeAmount(grade.name, ft.key, 'zig', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800">
          <DollarSign className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No fee structure configured</p>
          <p className="text-xs text-muted-foreground mt-1">Click &quot;Auto-generate defaults&quot; to create standard fee structures</p>
        </div>
      )}

      {Object.keys(feeData).length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Fee Items</p>
              <p className="text-2xl font-bold text-emerald-600">
                {Object.values(feeData).reduce((sum, fees) => {
                  return sum + Object.values(fees).filter(a => (parseFloat(a.usd) || 0) > 0 || (parseFloat(a.zig) || 0) > 0).length
                }, 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">First Grade Total (USD)</p>
              <p className="text-xl font-bold text-teal-600">
                ${grades[0] && feeData[grades[0].name]
                  ? Object.values(feeData[grades[0].name]).reduce((s, a) => s + (parseFloat(a.usd) || 0), 0).toFixed(2)
                  : '0.00'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Administrator Account
        </h4>
        <p className="text-xs text-muted-foreground mb-4">Create the initial admin user who will manage the school system</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-6 border border-emerald-100 dark:border-emerald-900/30 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><User className="h-3 w-3" /> Full Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g., John Moyo"
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email Address <span className="text-red-500">*</span></Label>
            <Input
              placeholder="admin@school.co.zw"
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Password <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                placeholder="Min. 8 characters"
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Confirm Password <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                placeholder="Re-enter password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={adminConfirmPassword}
                onChange={e => setAdminConfirmPassword(e.target.value)}
                className={cn(
                  'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10',
                  adminConfirmPassword && adminPassword !== adminConfirmPassword && 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Password strength indicator */}
        {adminPassword && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    adminPassword.length >= level * 3
                      ? level <= 1 ? 'bg-red-400'
                        : level <= 2 ? 'bg-amber-400'
                          : level <= 3 ? 'bg-emerald-400'
                            : 'bg-teal-500'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <p className={cn(
              'text-xs',
              adminPassword.length < 4 ? 'text-red-500' :
                adminPassword.length < 8 ? 'text-amber-500' :
                  adminPassword.length < 12 ? 'text-emerald-500' : 'text-teal-500'
            )}>
              {adminPassword.length < 4 ? 'Weak' :
                adminPassword.length < 8 ? 'Fair (minimum 8 characters required)' :
                  adminPassword.length < 12 ? 'Good' : 'Strong'}
            </p>
          </div>
        )}

        {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
          <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Passwords do not match</span>
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          This account will have full administrative access to the school management system.
        </p>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">Review Your Setup</h3>
        <p className="text-sm text-muted-foreground">Verify all details before completing the setup</p>
      </div>

      {/* School Summary */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" /> School Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{schoolName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">EMIS Number</span><span className="font-mono">{emisNumber || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{schoolType}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Province</span><span>{province || '—'}</span></div>
          {motto && <div className="flex justify-between"><span className="text-muted-foreground">Motto</span><span className="italic">&quot;{motto}&quot;</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span>{principalName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{contactPhone || '—'}</span></div>
          {contactEmail && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{contactEmail}</span></div>}
        </CardContent>
      </Card>

      {/* Academic Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-teal-600" /> Academic Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Grades</span><span>{grades.length} grade levels</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Streams</span><span>{streamsPerGrade} per grade ({activeStreams.join(', ')})</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Classes</span><span>{grades.length * streamsPerGrade}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Terms</span><span>3 terms</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Year Starts</span><span>{yearStart}</span></div>
        </CardContent>
      </Card>

      {/* Fee Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-600" /> Fee Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Grades with Fees</span><span>{Object.keys(feeData).length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fee Types</span><span>{FEE_TYPES.length} (Tuition, Boarding, Transport, Other)</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Currencies</span><span>USD + ZiG</span></div>
          {grades[0] && feeData[grades[0].name] && (
            <div className="flex justify-between"><span className="text-muted-foreground">First Grade Total</span><span className="font-medium text-emerald-600">
              ${Object.values(feeData[grades[0].name]).reduce((s, a) => s + (parseFloat(a.usd) || 0), 0).toFixed(2)} / ZiG {Object.values(feeData[grades[0].name]).reduce((s, a) => s + (parseFloat(a.zig) || 0), 0).toFixed(2)}
            </span></div>
          )}
        </CardContent>
      </Card>

      {/* Admin Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-600" /> Admin Account
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{adminName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{adminEmail || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Password</span><span className="text-muted-foreground">{'•'.repeat(Math.min(adminPassword.length, 12))}</span></div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {[1, 2, 3, 4].some(s => !isStepValid(s)) && (
        <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Some required fields are missing. Please go back and complete the highlighted steps.</span>
        </div>
      )}
    </div>
  )

  const stepRenderers: Record<number, () => React.JSX.Element> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
  }

  // ─── Completion Screen ─────────────────────────────────────────────────────
  if (setupComplete) {
    return (
      <ModuleContainer>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}>
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-bold mt-6">
            School Setup Complete!
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-muted-foreground mt-2">
            {setupResult?.schoolName} has been configured successfully.
          </motion.p>

          {setupResult?.summary && Object.keys(setupResult.summary).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto mt-6">
              {Object.entries(setupResult.summary).map(([key, value]) => (
                <Card key={key} className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">{value}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center justify-center gap-2 mt-8">
            <Flag className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">You can now start enrolling students and managing your school!</span>
          </motion.div>
        </motion.div>
      </ModuleContainer>
    )
  }

  return (
    <ModuleContainer>

      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2 bg-emerald-100 dark:bg-emerald-900/30 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500" />
          <p className="text-xs text-muted-foreground text-right">Step {currentStep} of 5 — {Math.round(progressPercent)}% complete</p>
        </div>
      </motion.div>

      {/* Step Navigation */}
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            const isClickable = step.id <= currentStep || (step.id === currentStep + 1 && isStepValid(currentStep))
            const hasErrors = step.id < currentStep && !isStepValid(step.id)

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <div className={cn(
                    'h-0.5 flex-1 min-w-[20px] transition-colors',
                    currentStep > step.id ? 'bg-emerald-400' : 'bg-muted'
                  )} />
                )}
                <button
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-medium whitespace-nowrap',
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300'
                      : isCompleted
                        ? hasErrors
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : isClickable
                          ? 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                          : 'bg-muted/20 text-muted-foreground/50 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : isCompleted
                        ? hasErrors
                          ? 'bg-red-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'bg-muted-foreground/20 text-muted-foreground/60'
                  )}>
                    {isCompleted && !hasErrors ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                  </div>
                  <span className="hidden md:inline">{step.title}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {stepRenderers[currentStep]?.()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!isStepValid(currentStep) && currentStep < 5 && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Complete required fields to continue
              </span>
            )}
          </div>

          {currentStep < 5 ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className="gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || [1, 2, 3, 4].some(s => !isStepValid(s))}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Step Errors Detail */}
      {currentStep < 5 && getStepErrors(currentStep).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Required fields missing:
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
              {getStepErrors(currentStep).map((err, i) => (
                <li key={i} className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  {err}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Add Stream Dialog (kept for potential future use) */}
      <Dialog open={addStreamOpen} onOpenChange={setAddStreamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Streams</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select how many streams each grade will have. Each stream becomes a separate class.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([1, 2, 3] as const).map(count => (
                <button
                  key={count}
                  onClick={() => { setStreamsPerGrade(count); setAddStreamOpen(false) }}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    streamsPerGrade === count
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-muted hover:border-emerald-200'
                  )}
                >
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{count === 1 ? 'Stream A' : count === 2 ? 'A & B' : 'A, B & C'}</p>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleContainer>
  )
}
