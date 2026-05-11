'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  GraduationCap,
  Users,
  Search,
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  FileCheck,
  BarChart3,
  DollarSign,
  Banknote,
  BedDouble,
  Bus,
  Library,
  Package,
  Heart,
  Scale,
  HeartPulse,
  Building,
  MessageSquare,
  Settings,
  UserPlus,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'student' | 'staff'
  title: string
  subtitle: string
  description: string
  module: string
}

// Module icon mapping
const moduleIcons: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  students: GraduationCap,
  staff: Users,
  admissions: UserPlus,
  academics: BookOpen,
  attendance: CalendarCheck,
  examinations: FileCheck,
  reports: BarChart3,
  finance: DollarSign,
  payroll: Banknote,
  boarding: BedDouble,
  transport: Bus,
  library: Library,
  inventory: Package,
  welfare: Heart,
  discipline: Scale,
  health: HeartPulse,
  sdc: Building,
  communication: MessageSquare,
  settings: Settings,
}

// Quick navigation items
const quickNavItems = [
  { id: 'dashboard', label: 'Dashboard', keywords: 'home overview main' },
  { id: 'students', label: 'Students', keywords: 'learner pupil enrollment' },
  { id: 'staff', label: 'Staff', keywords: 'teacher employee personnel' },
  { id: 'finance', label: 'Finance', keywords: 'fees payments billing invoices' },
  { id: 'attendance', label: 'Attendance', keywords: 'present absent register' },
  { id: 'academics', label: 'Academics', keywords: 'class subject curriculum grade' },
  { id: 'examinations', label: 'Examinations', keywords: 'exam ZIMSEC results test' },
  { id: 'admissions', label: 'Admissions', keywords: 'enroll apply new student' },
  { id: 'payroll', label: 'Payroll', keywords: 'salary wage payslip' },
  { id: 'boarding', label: 'Boarding', keywords: 'hostel dormitory resident' },
  { id: 'transport', label: 'Transport', keywords: 'bus route vehicle' },
  { id: 'library', label: 'Library', keywords: 'book catalog lending' },
  { id: 'inventory', label: 'Inventory', keywords: 'asset equipment supply' },
  { id: 'welfare', label: 'Welfare', keywords: 'BEAM support vulnerable' },
  { id: 'discipline', label: 'Discipline', keywords: 'incident behavior misconduct' },
  { id: 'health', label: 'Health', keywords: 'medical clinic sick' },
  { id: 'sdc', label: 'SDC', keywords: 'committee development parent' },
  { id: 'communication', label: 'Communication', keywords: 'message email SMS' },
  { id: 'reports', label: 'Reports', keywords: 'report EMIS export' },
  { id: 'settings', label: 'Settings', keywords: 'configuration system admin' },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const { setActiveModule } = useAppStore()

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false)
    setQuery('')
    setResults([])
    callback()
  }, [])

  const navigateToModule = useCallback((moduleId: string) => {
    setActiveModule(moduleId)
  }, [setActiveModule])

  // Filter quick nav by query
  const filteredNav = query.length >= 1
    ? quickNavItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords.toLowerCase().includes(query.toLowerCase())
      )
    : quickNavItems.slice(0, 8)

  const studentResults = results.filter((r) => r.type === 'student')
  const staffResults = results.filter((r) => r.type === 'staff')

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex-1 max-w-md flex items-center gap-2 rounded-md border-0 bg-muted/40 h-9 px-3 text-sm text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search students, staff, records...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search students, staff, modules..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? 'Searching...' : query.length < 2 ? 'Type at least 2 characters to search...' : 'No results found.'}
          </CommandEmpty>

          {/* Search results - Students */}
          {studentResults.length > 0 && (
            <>
              <CommandGroup heading="Students">
                {studentResults.map((result) => {
                  const Icon = GraduationCap
                  return (
                    <CommandItem
                      key={result.id}
                      value={`student-${result.title}-${result.subtitle}`}
                      onSelect={() => handleSelect(() => navigateToModule('students'))}
                    >
                      <Icon className="mr-2 h-4 w-4 text-emerald-600" />
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.description}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">{result.subtitle}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Search results - Staff */}
          {staffResults.length > 0 && (
            <>
              <CommandGroup heading="Staff">
                {staffResults.map((result) => {
                  const Icon = Users
                  return (
                    <CommandItem
                      key={result.id}
                      value={`staff-${result.title}-${result.subtitle}`}
                      onSelect={() => handleSelect(() => navigateToModule('staff'))}
                    >
                      <Icon className="mr-2 h-4 w-4 text-teal-600" />
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.description}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">{result.subtitle}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Quick navigation */}
          <CommandGroup heading="Navigate to">
            {filteredNav.map((item) => {
              const Icon = moduleIcons[item.id] || LayoutDashboard
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.keywords}`}
                  onSelect={() => handleSelect(() => navigateToModule(item.id))}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
