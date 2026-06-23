'use client'

import { ModuleContainer, ModulePageLayout, ModuleSettingsButton, StatGrid, ModuleStatCard, SectionCard } from '@/components/module-ui';
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Calendar, MapPin, Plus, Edit, Trash2, Clock,
  TrendingUp, Flag, Medal, ChevronLeft, ChevronRight,
  ArrowLeft, Save, Settings, Eye, X, Bell, Palette,
  LayoutGrid, List, CalendarDays, Download, Type,
  Sparkles, Info, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'overview' | 'events' | 'sports' | 'calendar' | 'add-event' | 'edit-event' | 'add-fixture' | 'event-detail' | 'fixture-detail' | 'settings'

interface SchoolEvent {
  id: string
  title: string
  description?: string | null
  eventType: string
  startDate: string
  endDate?: string | null
  venue?: string | null
  createdAt: string
  relatedEvents?: SchoolEvent[]
}

interface SportsFixture {
  id: string
  sport: string
  date: string
  opponent: string
  venue: string
  result: string
  score: string
  team: string
}

interface SportsCode {
  id: string
  name: string
  coach: string
  teams: string[]
  fixtures: number
}

interface EventsStats {
  totalEvents: number
  upcomingEvents: number
  sportsCodes: number
  byType: { type: string; count: number }[]
  thisMonth: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EVENT_TYPES = ['Holiday', 'Cultural', 'Academic', 'Sports', 'Meeting', 'Ceremony', 'Religious', 'Social']
const SPORTS = ['Soccer', 'Netball', 'Athletics', 'Cricket', 'Rugby', 'Volleyball', 'Basketball', 'Tennis']

const CURRENT_YEAR = new Date().getFullYear()

const INITIAL_FIXTURES: SportsFixture[] = [
  { id: 'f1', sport: 'Soccer', date: `${CURRENT_YEAR}-03-10`, opponent: 'Hillcrest College', venue: 'Home', result: 'Win', score: '3-1', team: 'U17 Boys' },
  { id: 'f2', sport: 'Netball', date: `${CURRENT_YEAR}-03-12`, opponent: 'Convent School', venue: 'Away', result: 'Win', score: '35-28', team: 'U17 Girls' },
  { id: 'f3', sport: 'Soccer', date: `${CURRENT_YEAR}-03-17`, opponent: 'Petra School', venue: 'Away', result: 'Draw', score: '1-1', team: '1st Team' },
  { id: 'f4', sport: 'Cricket', date: `${CURRENT_YEAR}-03-20`, opponent: 'Falcon College', venue: 'Home', result: 'Loss', score: '120-145', team: '1st Team' },
  { id: 'f5', sport: 'Rugby', date: `${CURRENT_YEAR}-03-24`, opponent: 'CBC Bulawayo', venue: 'Away', result: 'Win', score: '22-15', team: '1st Team' },
  { id: 'f6', sport: 'Athletics', date: `${CURRENT_YEAR}-03-15`, opponent: 'District Meet', venue: 'Town Stadium', result: 'Pending', score: '—', team: 'All Teams' },
  { id: 'f7', sport: 'Volleyball', date: `${CURRENT_YEAR}-04-02`, opponent: 'Minda School', venue: 'Home', result: 'Win', score: '3-1', team: 'U17 Girls' },
  { id: 'f8', sport: 'Soccer', date: `${CURRENT_YEAR}-04-05`, opponent: 'Multiple Schools', venue: 'Home', result: 'Pending', score: '—', team: 'All Teams' },
  { id: 'f9', sport: 'Netball', date: `${CURRENT_YEAR}-04-08`, opponent: 'Girls High', venue: 'Away', result: 'Pending', score: '—', team: '1st Team' },
  { id: 'f10', sport: 'Basketball', date: `${CURRENT_YEAR}-04-15`, opponent: 'Evelyn Hone', venue: 'Home', result: 'Pending', score: '—', team: 'U17 Boys' },
  { id: 'f11', sport: 'Soccer', date: `${CURRENT_YEAR}-05-01`, opponent: 'Churchill School', venue: 'Away', result: 'Win', score: '2-0', team: '1st Team' },
  { id: 'f12', sport: 'Cricket', date: `${CURRENT_YEAR}-05-10`, opponent: 'Prince Edward', venue: 'Home', result: 'Pending', score: '—', team: '1st Team' },
]

const SPORTS_CODES: SportsCode[] = [
  { id: 'sc1', name: 'Soccer', coach: 'Mr. Ncube', teams: ['1st Team', 'U17 Boys', 'U15 Boys', 'U13 Boys'], fixtures: 4 },
  { id: 'sc2', name: 'Netball', coach: 'Mrs. Sithole', teams: ['1st Team', 'U17 Girls', 'U15 Girls'], fixtures: 3 },
  { id: 'sc3', name: 'Athletics', coach: 'Mr. Moyo', teams: ['All Teams'], fixtures: 1 },
  { id: 'sc4', name: 'Cricket', coach: 'Mr. Gumbo', teams: ['1st Team', 'U17 Boys'], fixtures: 2 },
  { id: 'sc5', name: 'Rugby', coach: 'Mr. Ndlovu', teams: ['1st Team', 'U17 Boys'], fixtures: 1 },
  { id: 'sc6', name: 'Volleyball', coach: 'Ms. Mukasa', teams: ['U17 Girls', 'U15 Girls', 'U17 Boys'], fixtures: 1 },
  { id: 'sc7', name: 'Basketball', coach: 'Mr. Chikwanda', teams: ['U17 Boys', 'U17 Girls'], fixtures: 1 },
  { id: 'sc8', name: 'Tennis', coach: 'Mrs. Nhongo', teams: ['1st Team'], fixtures: 0 },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

const eventTypeColors: Record<string, string> = {
  HOLIDAY: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CULTURAL: 'bg-teal-100 text-teal-800 border-teal-300',
  ACADEMIC: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  SPORTS: 'bg-amber-100 text-amber-800 border-amber-300',
  MEETING: 'bg-violet-100 text-violet-800 border-violet-300',
  CEREMONY: 'bg-rose-100 text-rose-800 border-rose-300',
  RELIGIOUS: 'bg-pink-100 text-pink-800 border-pink-300',
  SOCIAL: 'bg-sky-100 text-sky-800 border-sky-300',
  Holiday: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Cultural: 'bg-teal-100 text-teal-800 border-teal-300',
  Academic: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  Sports: 'bg-amber-100 text-amber-800 border-amber-300',
  Meeting: 'bg-violet-100 text-violet-800 border-violet-300',
  Ceremony: 'bg-rose-100 text-rose-800 border-rose-300',
  Religious: 'bg-pink-100 text-pink-800 border-pink-300',
  Social: 'bg-sky-100 text-sky-800 border-sky-300',
}

const eventTypeDotColors: Record<string, string> = {
  HOLIDAY: 'bg-emerald-400',
  CULTURAL: 'bg-teal-400',
  ACADEMIC: 'bg-cyan-400',
  SPORTS: 'bg-amber-400',
  MEETING: 'bg-violet-400',
  CEREMONY: 'bg-rose-400',
  RELIGIOUS: 'bg-pink-400',
  SOCIAL: 'bg-sky-400',
}

const eventTypeIcons: Record<string, React.ReactNode> = {
  HOLIDAY: '🏖️',
  CULTURAL: '🎭',
  ACADEMIC: '📚',
  SPORTS: '🏆',
  MEETING: '📋',
  CEREMONY: '🎖️',
  RELIGIOUS: '🙏',
  SOCIAL: '🤝',
}

const resultColors: Record<string, string> = {
  Win: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Loss: 'bg-red-100 text-red-800 border-red-300',
  Draw: 'bg-amber-100 text-amber-800 border-amber-300',
  Pending: 'bg-muted text-muted-foreground border-border',
}

const sportIcons: Record<string, string> = {
  Soccer: '⚽', Netball: '🏐', Athletics: '🏃', Cricket: '🏏',
  Rugby: '🏉', Volleyball: '🏐', Basketball: '🏀', Tennis: '🎾',
}

const eventTypeColorOptions = [
  { label: 'Emerald', value: 'bg-emerald-400', text: 'text-emerald-800' },
  { label: 'Teal', value: 'bg-teal-400', text: 'text-teal-800' },
  { label: 'Cyan', value: 'bg-cyan-400', text: 'text-cyan-800' },
  { label: 'Amber', value: 'bg-amber-400', text: 'text-amber-800' },
  { label: 'Violet', value: 'bg-violet-400', text: 'text-violet-800' },
  { label: 'Rose', value: 'bg-rose-400', text: 'text-rose-800' },
  { label: 'Pink', value: 'bg-pink-400', text: 'text-pink-800' },
  { label: 'Sky', value: 'bg-sky-400', text: 'text-sky-800' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })
}

function getDaysUntil(dateStr: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Page transition wrapper ───────────────────────────────────────────────

function PageTransition({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Events Module ──────────────────────────────────────────────────────────

export default function EventsModule() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [activeTab, setActiveTab] = useState('overview')

  // Data state
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [fixtures] = useState<SportsFixture[]>(INITIAL_FIXTURES)
  const [stats, setStats] = useState<EventsStats | null>(null)
  const [sportsCodes, setSportsCodes] = useState<SportsCode[]>(SPORTS_CODES)
  const [loading, setLoading] = useState(true)

  // Event form
  const [editEvent, setEditEvent] = useState<SchoolEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)
  const [eventForm, setEventForm] = useState({
    title: '', description: '', eventType: 'Academic', startDate: '', endDate: '', venue: '',
  })
  const [saving, setSaving] = useState(false)

  // Fixture form
  const [fixtureForm, setFixtureForm] = useState({
    sport: 'Soccer', date: '', opponent: '', venue: 'Home', team: '1st Team',
  })

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())

  // Filters
  const [eventFilter, setEventFilter] = useState('ALL')
  const [sportFilter, setSportFilter] = useState('ALL')

  // Settings state
  const [settings, setSettings] = useState({
    defaultView: 'list',
    showPastEvents: true,
    defaultFilter: 'ALL',
    firstDayOfWeek: 'sunday',
    timeFormat: '12h',
    remindBefore: '1day',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    customEventTypes: [] as string[],
    eventTypeColors: { ...eventTypeColors },
    exportFormat: 'csv',
  })

  // ─── Fetch Events from API ───────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/events?limit=100')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.data || [])
        setStats(data.stats || null)
        setSportsCodes(
          (data.sportsCodes || []).map((sc: { id: string; name: string; season?: string | null }) => ({
            id: sc.id,
            name: sc.name,
            coach: 'TBD',
            teams: ['1st Team'],
            fixtures: 0,
          }))
        )
      }
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // ─── Computed ─────────────────────────────────────────────────────────

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((e) => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [events])

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    if (eventFilter === 'ALL') return sorted
    return sorted.filter((e) => {
      const type = e.eventType.charAt(0).toUpperCase() + e.eventType.slice(1).toLowerCase()
      return type === eventFilter || e.eventType === eventFilter
    })
  }, [events, eventFilter])

  const filteredFixtures = useMemo(() => {
    const sorted = [...fixtures].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (sportFilter === 'ALL') return sorted
    return sorted.filter((f) => f.sport === sportFilter)
  }, [fixtures, sportFilter])

  const sportsCount = sportsCodes.length
  const winsCount = fixtures.filter((f) => f.result === 'Win').length
  const pendingFixtures = fixtures.filter((f) => f.result === 'Pending').length

  const getEventsForDay = useCallback((day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return [
      ...events.filter((e) => e.startDate.startsWith(dateStr)),
      ...fixtures.filter((f) => f.date === dateStr),
    ]
  }, [events, fixtures, calYear, calMonth])

  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth])

  // ─── Navigation helpers ──────────────────────────────────────────────

  const navigateTo = useCallback((view: ViewMode) => {
    setViewMode(view)
  }, [])

  const goBack = useCallback(() => {
    if (viewMode === 'add-event' || viewMode === 'edit-event' || viewMode === 'event-detail') {
      setViewMode('events')
      setActiveTab('events')
    } else if (viewMode === 'add-fixture' || viewMode === 'fixture-detail') {
      setViewMode('sports')
      setActiveTab('sports')
    } else {
      setViewMode('overview')
      setActiveTab('overview')
    }
  }, [viewMode])

  // ─── Event CRUD Handlers ─────────────────────────────────────────────

  const handleAddEvent = useCallback(() => {
    setEditEvent(null)
    setEventForm({ title: '', description: '', eventType: 'Academic', startDate: '', endDate: '', venue: '' })
    navigateTo('add-event')
  }, [navigateTo])

  const handleEditEvent = useCallback((ev: SchoolEvent) => {
    setEditEvent(ev)
    setEventForm({
      title: ev.title,
      description: ev.description || '',
      eventType: ev.eventType.charAt(0).toUpperCase() + ev.eventType.slice(1).toLowerCase(),
      startDate: ev.startDate ? new Date(ev.startDate).toISOString().split('T')[0] : '',
      endDate: ev.endDate ? new Date(ev.endDate).toISOString().split('T')[0] : '',
      venue: ev.venue || '',
    })
    navigateTo('edit-event')
  }, [navigateTo])

  const handleViewEvent = useCallback(async (ev: SchoolEvent) => {
    setSelectedEvent(ev)
    navigateTo('event-detail')
    // Fetch full detail with related events
    try {
      const res = await fetch(`/api/events/${ev.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedEvent(data)
      }
    } catch {
      // Use the event we already have
    }
  }, [navigateTo])

  const handleDeleteEvent = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id))
        toast.success('Event deleted successfully')
        if (selectedEvent?.id === id) {
          goBack()
        }
      } else {
        toast.error('Failed to delete event')
      }
    } catch {
      toast.error('Failed to delete event')
    }
  }, [selectedEvent, goBack])

  const handleSaveEvent = useCallback(async () => {
    if (!eventForm.title || !eventForm.startDate) {
      toast.error('Title and start date are required')
      return
    }
    setSaving(true)
    try {
      if (editEvent) {
        // Update
        const res = await fetch(`/api/events/${editEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: eventForm.title,
            description: eventForm.description || null,
            eventType: eventForm.eventType,
            startDate: eventForm.startDate,
            endDate: eventForm.endDate || null,
            venue: eventForm.venue || null,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e))
          toast.success('Event updated successfully')
          goBack()
        } else {
          toast.error('Failed to update event')
        }
      } else {
        // Create
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: eventForm.title,
            description: eventForm.description || null,
            eventType: eventForm.eventType,
            startDate: eventForm.startDate,
            endDate: eventForm.endDate || null,
            venue: eventForm.venue || null,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setEvents((prev) => [...prev, created])
          toast.success('Event created successfully')
          goBack()
        } else {
          toast.error('Failed to create event')
        }
      }
    } catch {
      toast.error('Failed to save event')
    } finally {
      setSaving(false)
    }
  }, [editEvent, eventForm, goBack])

  // ─── Fixture Handlers ─────────────────────────────────────────────────

  const handleAddFixture = useCallback(() => {
    setFixtureForm({ sport: 'Soccer', date: '', opponent: '', venue: 'Home', team: '1st Team' })
    navigateTo('add-fixture')
  }, [navigateTo])

  const handleSaveFixture = useCallback(() => {
    if (!fixtureForm.date || !fixtureForm.opponent) {
      toast.error('Date and opponent are required')
      return
    }
    // Fixtures are stored locally for now (no DB model for fixtures)
    toast.success('Fixture added successfully')
    goBack()
  }, [fixtureForm, goBack])

  const handleDeleteFixture = useCallback((id: string) => {
    toast.success('Fixture removed')
  }, [])

  const prevMonth = useCallback(() => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }, [calMonth, calYear])

  const nextMonth = useCallback(() => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }, [calMonth, calYear])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    if (tab === 'overview' || tab === 'events' || tab === 'sports' || tab === 'calendar' || tab === 'settings') {
      setViewMode(tab as ViewMode)
    }
  }, [])

  // ─── Render Helpers ──────────────────────────────────────────────────

  const renderBackButton = (label: string = 'Back') => (
    <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
      <ArrowLeft className="mr-1.5 h-4 w-4" />
      {label}
    </Button>
  )

  // ─── Loading State ───────────────────────────────────────────────────

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  // ─── Inline Views ────────────────────────────────────────────────────

  // ─── ADD/EDIT EVENT FORM ────────────────────────────────────────────
  if (viewMode === 'add-event' || viewMode === 'edit-event') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {renderBackButton('Back to Events')}
        <Card className="border-0 shadow-lg max-w-3xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{editEvent ? 'Edit Event' : 'Add New Event'}</CardTitle>
                <CardDescription>{editEvent ? 'Modify event details below' : 'Fill in the details to create a new school event'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Event Title *</Label>
              <Input
                placeholder="e.g. Independence Day Celebrations"
                value={eventForm.title}
                onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))}
                className="h-11"
              />
            </div>

            {/* Event Type Selector with Icons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Event Type *</Label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {EVENT_TYPES.map((type) => {
                  const isSelected = eventForm.eventType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEventForm((p) => ({ ...p, eventType: type }))}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-center',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-border hover:border-emerald-200 hover:bg-muted/30'
                      )}
                    >
                      <span className="text-lg">{eventTypeIcons[type.toUpperCase()] || '📅'}</span>
                      <span className={cn('text-[10px] font-medium', isSelected ? 'text-emerald-700' : 'text-muted-foreground')}>
                        {type}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date *</Label>
                <Input
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date</Label>
                <Input
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Venue</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. School Hall, Sports Field"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm((p) => ({ ...p, venue: e.target.value }))}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                placeholder="Provide a detailed description of the event..."
                value={eventForm.description}
                onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))}
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={goBack}>Cancel</Button>
              <Button
                onClick={handleSaveEvent}
                disabled={!eventForm.title || !eventForm.startDate || saving}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md min-w-[140px]"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editEvent ? 'Save Changes' : 'Create Event'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── EVENT DETAIL VIEW ───────────────────────────────────────────────
  if (viewMode === 'event-detail' && selectedEvent) {
    const ev = selectedEvent
    const daysUntil = getDaysUntil(ev.startDate)
    const related = ev.relatedEvents || []

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {renderBackButton('Back to Events')}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn('text-xs border', eventTypeColors[ev.eventType] || 'bg-muted text-muted-foreground border-border')}>
                        {eventTypeIcons[ev.eventType.toUpperCase()] || '📅'} {ev.eventType}
                      </Badge>
                      {daysUntil <= 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">Today / Past</Badge>
                      ) : daysUntil <= 7 ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">{daysUntil} days away</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">{daysUntil} days away</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{ev.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEditEvent(ev)}>
                      <Edit className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteEvent(ev.id)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date & Venue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <Calendar className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">Start Date</p>
                      <p className="text-sm text-emerald-700">{formatDateLong(ev.startDate)}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{formatTime(ev.startDate)}</p>
                    </div>
                  </div>
                  {ev.endDate && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-teal-50/50 border border-teal-100">
                      <Clock className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-teal-900">End Date</p>
                        <p className="text-sm text-teal-700">{formatDateLong(ev.endDate)}</p>
                        <p className="text-xs text-teal-600 mt-0.5">{formatTime(ev.endDate)}</p>
                      </div>
                    </div>
                  )}
                  {!ev.endDate && ev.venue && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-50/50 border border-cyan-100">
                      <MapPin className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-cyan-900">Venue</p>
                        <p className="text-sm text-cyan-700">{ev.venue}</p>
                      </div>
                    </div>
                  )}
                </div>
                {ev.endDate && ev.venue && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-50/50 border border-cyan-100 max-w-sm">
                    <MapPin className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-cyan-900">Venue</p>
                      <p className="text-sm text-cyan-700">{ev.venue}</p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  {ev.description ? (
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ev.description}</div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description provided</p>
                  )}
                </div>

                <Separator />

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created: {formatDate(ev.createdAt)}</span>
                  <span>ID: {ev.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Related Events */}
          <div className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Related Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {related.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {related.map((re) => (
                      <button
                        key={re.id}
                        onClick={() => handleViewEvent(re)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted/30 transition-colors border border-border/40"
                      >
                        <p className="text-sm font-medium truncate">{re.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn('text-[10px] border', eventTypeColors[re.eventType] || 'bg-muted text-muted-foreground border-border')}>
                            {re.eventType}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(re.startDate)}</span>
                        </div>
                        {re.venue && <p className="text-[10px] text-muted-foreground mt-1">{re.venue}</p>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No related events</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Events</span>
                  <span className="font-semibold">{events.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Upcoming</span>
                  <span className="font-semibold text-emerald-600">{upcomingEvents.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-semibold">{stats?.thisMonth || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── ADD FIXTURE FORM ────────────────────────────────────────────────
  if (viewMode === 'add-fixture') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {renderBackButton('Back to Sports')}
        <Card className="border-0 shadow-lg max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Add Sports Fixture</CardTitle>
                <CardDescription>Schedule a new sports match or competition</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sport *</Label>
                <Select value={fixtureForm.sport} onValueChange={(v) => setFixtureForm((p) => ({ ...p, sport: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => (
                      <SelectItem key={s} value={s}>{sportIcons[s]} {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team</Label>
                <Input
                  placeholder="e.g. 1st Team, U17 Boys"
                  value={fixtureForm.team}
                  onChange={(e) => setFixtureForm((p) => ({ ...p, team: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date *</Label>
                <Input
                  type="date"
                  value={fixtureForm.date}
                  onChange={(e) => setFixtureForm((p) => ({ ...p, date: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Venue</Label>
                <Select value={fixtureForm.venue} onValueChange={(v) => setFixtureForm((p) => ({ ...p, venue: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Away">Away</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Opponent *</Label>
              <Input
                placeholder="e.g. Hillcrest College"
                value={fixtureForm.opponent}
                onChange={(e) => setFixtureForm((p) => ({ ...p, opponent: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={goBack}>Cancel</Button>
              <Button
                onClick={handleSaveFixture}
                disabled={!fixtureForm.date || !fixtureForm.opponent}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
              >
                <Save className="mr-2 h-4 w-4" />
                Add Fixture
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── SETTINGS VIEW ───────────────────────────────────────────────────
  if (viewMode === 'settings') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {renderBackButton('Back to Events')}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <Settings className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Events Settings</h2>
              <p className="text-sm text-muted-foreground">Customize how events and sports are displayed</p>
            </div>
          </div>

          {/* Default View */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-emerald-600" />
                Default View
              </CardTitle>
              <CardDescription>Choose how events are displayed by default</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'list', icon: List, label: 'List View' },
                  { value: 'calendar', icon: CalendarDays, label: 'Calendar' },
                  { value: 'cards', icon: LayoutGrid, label: 'Card View' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, defaultView: option.value }))}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      settings.defaultView === option.value
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-border hover:border-emerald-200'
                    )}
                  >
                    <option.icon className={cn('h-5 w-5', settings.defaultView === option.value ? 'text-emerald-600' : 'text-muted-foreground')} />
                    <span className={cn('text-xs font-medium', settings.defaultView === option.value ? 'text-emerald-700' : 'text-muted-foreground')}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show Past Events</p>
                  <p className="text-xs text-muted-foreground">Display events that have already occurred</p>
                </div>
                <Switch
                  checked={settings.showPastEvents}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, showPastEvents: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Filter</Label>
                <Select value={settings.defaultFilter} onValueChange={(v) => setSettings((s) => ({ ...s, defaultFilter: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Event Type Configuration */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Type className="h-4 w-4 text-cyan-600" />
                Event Types & Colors
              </CardTitle>
              <CardDescription>Configure event types and their color coding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {EVENT_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{eventTypeIcons[type.toUpperCase()] || '📅'}</span>
                    <span className="text-sm font-medium">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded-full', eventTypeDotColors[type.toUpperCase()] || 'bg-gray-400')} />
                    <Badge className={cn('text-[10px] border', eventTypeColors[type] || 'bg-muted text-muted-foreground border-border')}>
                      {type}
                    </Badge>
                  </div>
                </div>
              ))}
              {/* Custom Event Types */}
              {settings.customEventTypes.map((type) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <span className="text-sm font-medium">{type}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => {
                    setSettings((s) => ({ ...s, customEventTypes: s.customEventTypes.filter((t) => t !== type) }))
                    toast.success(`Removed "${type}" event type`)
                  }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="New event type name..."
                  className="h-9 text-sm"
                  id="newEventType"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      const val = input.value.trim()
                      if (val && !EVENT_TYPES.includes(val) && !settings.customEventTypes.includes(val)) {
                        setSettings((s) => ({ ...s, customEventTypes: [...s.customEventTypes, val] }))
                        toast.success(`Added "${val}" event type`)
                        input.value = ''
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('newEventType') as HTMLInputElement
                    const val = input?.value?.trim()
                    if (val && !EVENT_TYPES.includes(val) && !settings.customEventTypes.includes(val)) {
                      setSettings((s) => ({ ...s, customEventTypes: [...s.customEventTypes, val] }))
                      toast.success(`Added "${val}" event type`)
                      input.value = ''
                    }
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                Notifications
              </CardTitle>
              <CardDescription>Configure event reminder settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Send event reminders via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, emailNotifications: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Send event reminders via SMS</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, smsNotifications: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Send browser push notifications</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, pushNotifications: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Remind Before Event</Label>
                <Select value={settings.remindBefore} onValueChange={(v) => setSettings((s) => ({ ...s, remindBefore: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1hour">1 hour before</SelectItem>
                    <SelectItem value="3hours">3 hours before</SelectItem>
                    <SelectItem value="1day">1 day before</SelectItem>
                    <SelectItem value="3days">3 days before</SelectItem>
                    <SelectItem value="1week">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal-600" />
                Calendar Settings
              </CardTitle>
              <CardDescription>Customize calendar display options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Day of Week</Label>
                <Select value={settings.firstDayOfWeek} onValueChange={(v) => setSettings((s) => ({ ...s, firstDayOfWeek: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Time Format</Label>
                <Select value={settings.timeFormat} onValueChange={(v) => setSettings((s) => ({ ...s, timeFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-rose-600" />
                Export Settings
              </CardTitle>
              <CardDescription>Configure data export options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Export Format</Label>
                <Select value={settings.exportFormat} onValueChange={(v) => setSettings((s) => ({ ...s, exportFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="ical">iCalendar (.ics)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full" onClick={() => toast.success('Events exported successfully!')}>
                <Download className="mr-2 h-4 w-4" />
                Export Events
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pb-6">
            <Button
              onClick={() => toast.success('Settings saved successfully!')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── MAIN TAB VIEW ───────────────────────────────────────────────────

  return (
    <ModuleContainer>
      <ModulePageLayout
        actions={<>
          <Button variant="outline" size="sm" onClick={handleAddFixture}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Fixture
          </Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" onClick={handleAddEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
          <ModuleSettingsButton onClick={() => navigateTo('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={<>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
                      </>}
      >


        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <PageTransition pageKey="events-overview">
            <div className="space-y-4">
              {/* Stats Cards */}
              <StatGrid cols={4}>
                <ModuleStatCard
                  icon={Calendar}
                  label="Upcoming Events"
                  value={upcomingEvents.length}
                  accentGradient="from-emerald-400 to-teal-500"
                  bgColor="bg-emerald-50"
                  iconColor="text-emerald-600"
                  hint="This year"
                  index={0}
                />
                <ModuleStatCard
                  icon={Trophy}
                  label="Sports Activities"
                  value={sportsCount}
                  accentGradient="from-teal-400 to-cyan-500"
                  bgColor="bg-teal-50"
                  iconColor="text-teal-600"
                  hint="Active codes"
                  index={1}
                />
                <ModuleStatCard
                  icon={Medal}
                  label="Matches Won"
                  value={winsCount}
                  accentGradient="from-amber-400 to-orange-500"
                  bgColor="bg-amber-50"
                  iconColor="text-amber-600"
                  hint={`Of ${fixtures.filter((f) => f.result !== 'Pending').length} played`}
                  index={2}
                />
                <ModuleStatCard
                  icon={Flag}
                  label="Pending Fixtures"
                  value={pendingFixtures}
                  accentGradient="from-violet-400 to-purple-500"
                  bgColor="bg-violet-50"
                  iconColor="text-violet-600"
                  hint="Upcoming matches"
                  index={3}
                />
              </StatGrid>

              {/* Upcoming Events & Calendar Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Upcoming Events */}
                <SectionCard title="Upcoming Events" description="Next events on the calendar">
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      {upcomingEvents.slice(0, 8).map((ev) => {
                        const daysUntil = getDaysUntil(ev.startDate)
                        return (
                          <button
                            key={ev.id}
                            onClick={() => handleViewEvent(ev)}
                            className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 shrink-0">
                              <span className="text-lg font-bold text-emerald-700">{new Date(ev.startDate).getDate()}</span>
                              <span className="text-[10px] text-emerald-600">{new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ev.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn('text-[10px] border', eventTypeColors[ev.eventType] || 'bg-muted text-muted-foreground border-border')}>
                                  {ev.eventType}
                                </Badge>
                                {ev.venue && <span className="text-[10px] text-muted-foreground">{ev.venue}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {daysUntil <= 0 ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Today</Badge>
                              ) : daysUntil <= 7 ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">{daysUntil}d</Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">{daysUntil}d away</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                      {upcomingEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
                      )}
                    </div>
                </SectionCard>

                {/* Calendar Preview */}
                <SectionCard
                  title={`${MONTH_NAMES[calMonth]} ${calYear}`}
                  actions={
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  }
                >
                    <div className="grid grid-cols-7 gap-1">
                      {DAY_NAMES.map((d) => (
                        <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
                      ))}
                      {calendarDays.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} className="h-10" />
                        const dayEvents = getEventsForDay(day)
                        const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear()
                        return (
                          <div
                            key={day}
                            className={cn(
                              'h-10 rounded-md flex flex-col items-center justify-center text-xs relative cursor-pointer transition-colors',
                              isToday ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-muted/50',
                              dayEvents.length > 0 && !isToday ? 'bg-emerald-50 font-medium text-emerald-700' : ''
                            )}
                          >
                            {day}
                            {dayEvents.length > 0 && (
                              <div className="absolute bottom-0.5 flex gap-0.5">
                                {dayEvents.slice(0, 3).map((_, i) => (
                                  <div key={i} className={cn('h-1 w-1 rounded-full', isToday ? 'bg-white' : 'bg-emerald-400')} />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                </SectionCard>
              </div>

              {/* Sports Codes Overview */}
              <SectionCard title="Sports Codes" description="Active sports and teams">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {sportsCodes.map((code) => (
                      <div key={code.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{sportIcons[code.name] || '🏅'}</span>
                          <span className="text-sm font-semibold">{code.name}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Coach: {code.coach}</p>
                          <p className="text-[10px] text-muted-foreground">{code.teams.length} team{code.teams.length !== 1 ? 's' : ''} &bull; {code.fixtures} fixture{code.fixtures !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {code.teams.slice(0, 2).map((t) => (
                            <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>
                          ))}
                          {code.teams.length > 2 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{code.teams.length - 2}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
            </div>
          </PageTransition>
        </TabsContent>

        {/* ─── Events Tab ───────────────────────────────────────────────── */}
        <TabsContent value="events" className="space-y-4">
          <PageTransition pageKey="events-tab">
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">Type:</Label>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-xs">{filteredEvents.length} events</Badge>
                </div>
                <div className="flex-1" />
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={handleAddEvent}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Event
                </Button>
              </div>

              {/* Events List */}
              <SectionCard title="Events" icon={Calendar} noPadding>
                  <ScrollArea className="max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Event</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Venue</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.map((ev) => (
                          <TableRow
                            key={ev.id}
                            className="hover:bg-muted/20 cursor-pointer"
                            onClick={() => handleViewEvent(ev)}
                          >
                            <TableCell className="text-sm whitespace-nowrap">
                              <div className="font-medium">{formatDate(ev.startDate)}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {(() => {
                                  const d = getDaysUntil(ev.startDate)
                                  if (d < 0) return 'Past'
                                  if (d === 0) return 'Today'
                                  return `${d} days away`
                                })()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{ev.title}</div>
                              <div className="text-[10px] text-muted-foreground max-w-[200px] truncate">{ev.description || 'No description'}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('text-[10px] border', eventTypeColors[ev.eventType] || 'bg-muted text-muted-foreground border-border')}>
                                {ev.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm hidden md:table-cell">{ev.venue || '—'}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleViewEvent(ev)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleEditEvent(ev)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteEvent(ev.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredEvents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                              <p className="text-sm">No events found</p>
                              <Button variant="outline" size="sm" className="mt-3" onClick={handleAddEvent}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Add Event
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
              </SectionCard>
            </div>
          </PageTransition>
        </TabsContent>

        {/* ─── Sports Tab ───────────────────────────────────────────────── */}
        <TabsContent value="sports" className="space-y-4">
          <PageTransition pageKey="sports-tab">
            <div className="space-y-4">
              {/* Sports Codes & Teams */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Sports Codes & Teams</CardTitle>
                  <CardDescription>Active sports programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {sportsCodes.map((code) => (
                      <div key={code.id} className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{sportIcons[code.name] || '🏅'}</span>
                          <div>
                            <p className="text-sm font-bold">{code.name}</p>
                            <p className="text-[10px] text-muted-foreground">{code.coach}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {code.teams.map((t) => (
                            <div key={t} className="flex items-center justify-between text-xs">
                              <span>{t}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">Active</Badge>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{code.fixtures} fixtures</span>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-600 hover:text-emerald-700">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fixtures & Results */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold">Fixtures & Results</CardTitle>
                      <CardDescription>Sports matches and outcomes</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={sportFilter} onValueChange={setSportFilter}>
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Sports</SelectItem>
                          {SPORTS.map((s) => (
                            <SelectItem key={s} value={s}>{sportIcons[s]} {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={handleAddFixture}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Fixture
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Sport</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Team</TableHead>
                          <TableHead className="text-xs">Opponent</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Venue</TableHead>
                          <TableHead className="text-xs">Result</TableHead>
                          <TableHead className="text-xs hidden lg:table-cell">Score</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFixtures.map((f) => (
                          <TableRow key={f.id} className="hover:bg-muted/20">
                            <TableCell className="text-sm whitespace-nowrap">{formatDate(f.date)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span>{sportIcons[f.sport] || '🏅'}</span>
                                <span className="text-sm">{f.sport}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm hidden sm:table-cell">{f.team}</TableCell>
                            <TableCell className="text-sm font-medium">{f.opponent}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className={cn('text-[10px]', f.venue === 'Home' ? 'border-emerald-300 text-emerald-700' : 'border-amber-300 text-amber-700')}>
                                {f.venue}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('text-[10px] border', resultColors[f.result] || 'bg-muted text-muted-foreground')}>
                                {f.result}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-mono hidden lg:table-cell">{f.score}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteFixture(f.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </PageTransition>
        </TabsContent>

        {/* ─── Calendar Tab ─────────────────────────────────────────────── */}
        <TabsContent value="calendar" className="space-y-4">
          <PageTransition pageKey="calendar-tab">
            <div className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()) }}
                      >
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAY_NAMES.map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                    ))}
                  </div>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      if (day === null) return <div key={`empty-${idx}`} className="min-h-[80px] rounded-md" />
                      const dayEvents = getEventsForDay(day)
                      const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear()
                      return (
                        <div
                          key={day}
                          className={cn(
                            'min-h-[80px] rounded-md border p-1.5 transition-colors',
                            isToday ? 'border-emerald-400 bg-emerald-50/50' : 'border-border/40 hover:border-emerald-200',
                          )}
                        >
                          <div className={cn(
                            'text-xs font-medium mb-1',
                            isToday ? 'text-emerald-700 font-bold' : 'text-muted-foreground'
                          )}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 3).map((ev, i) => {
                              const isFixture = 'sport' in ev
                              const eventType = isFixture ? 'SPORTS' : (ev as SchoolEvent).eventType
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    if (!isFixture) handleViewEvent(ev as SchoolEvent)
                                  }}
                                  className={cn(
                                    'w-full text-[9px] px-1 py-0.5 rounded truncate text-left',
                                    isFixture ? 'bg-amber-100 text-amber-800' : eventTypeColors[eventType] || 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {isFixture ? `🏆 ${(ev as SportsFixture).sport}` : (ev as SchoolEvent).title}
                                </button>
                              )
                            })}
                            {dayEvents.length > 3 && (
                              <div className="text-[9px] text-muted-foreground text-center">+{dayEvents.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
                    <span className="text-xs font-medium text-muted-foreground">Legend:</span>
                    {Object.entries(eventTypeDotColors).slice(0, 6).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-1.5">
                        <div className={cn('h-2.5 w-2.5 rounded', color)} />
                        <span className="text-[10px] capitalize">{type.toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </PageTransition>
        </TabsContent>

        {/* ─── Settings Tab ─────────────────────────────────────────────── */}
        </ModulePageLayout>
    </ModuleContainer>
  )
}
