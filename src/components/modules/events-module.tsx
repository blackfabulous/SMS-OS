'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  Star,
  Flag,
  Target,
  ChevronLeft,
  ChevronRight,
  Medal,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SchoolEvent {
  id: string
  name: string
  date: string
  type: string
  venue: string
  description: string
  organizer: string
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

// ─── Mock Data ──────────────────────────────────────────────────────────────

const EVENT_TYPES = ['Holiday', 'Cultural', 'Academic', 'Sports', 'Meeting', 'Ceremony', 'Religious', 'Social']
const SPORTS = ['Soccer', 'Netball', 'Athletics', 'Cricket', 'Rugby', 'Volleyball', 'Basketball', 'Tennis']

const CURRENT_YEAR = new Date().getFullYear()

const INITIAL_EVENTS: SchoolEvent[] = [
  { id: 'ev1', name: 'Independence Day Celebrations', date: `${CURRENT_YEAR}-04-18`, type: 'Holiday', venue: 'School Hall', description: 'National Independence Day celebrations', organizer: 'School Administration' },
  { id: 'ev2', name: 'Heroes Day', date: `${CURRENT_YEAR}-08-11`, type: 'Holiday', venue: 'School Grounds', description: 'Commemoration of national heroes', organizer: 'School Administration' },
  { id: 'ev3', name: 'Defence Forces Day', date: `${CURRENT_YEAR}-08-12`, type: 'Holiday', venue: 'School Grounds', description: 'Honouring the Zimbabwe Defence Forces', organizer: 'School Administration' },
  { id: 'ev4', name: 'Inter-House Athletics', date: `${CURRENT_YEAR}-03-15`, type: 'Sports', venue: 'School Sports Field', description: 'Annual inter-house athletics competition with track and field events', organizer: 'Sports Department' },
  { id: 'ev5', name: 'Speech & Prize Giving Day', date: `${CURRENT_YEAR}-06-28`, type: 'Ceremony', venue: 'School Hall', description: 'End of term prize giving ceremony', organizer: 'School Administration' },
  { id: 'ev6', name: 'SDC Annual General Meeting', date: `${CURRENT_YEAR}-02-20`, type: 'Meeting', venue: 'Staff Room', description: 'Annual general meeting for the School Development Committee', organizer: 'SDC' },
  { id: 'ev7', name: 'Culture Day', date: `${CURRENT_YEAR}-05-21`, type: 'Cultural', venue: 'School Grounds', description: 'Celebration of Zimbabwean cultural heritage with traditional dances, food and attire', organizer: 'Cultural Committee' },
  { id: 'ev8', name: 'Career Guidance Day', date: `${CURRENT_YEAR}-07-10`, type: 'Academic', venue: 'School Hall', description: 'Career guidance and counseling for Form 4 and Form 6 students', organizer: 'Guidance & Counseling Dept' },
  { id: 'ev9', name: 'Inter-Schools Soccer Tournament', date: `${CURRENT_YEAR}-04-05`, type: 'Sports', venue: 'Sports Field', description: 'Annual soccer tournament with 8 participating schools', organizer: 'Sports Department' },
  { id: 'ev10', name: 'World Teachers Day', date: `${CURRENT_YEAR}-10-05`, type: 'Ceremony', venue: 'Staff Room', description: 'Celebrating our dedicated teaching staff', organizer: 'School Administration' },
  { id: 'ev11', name: 'Christmas Carols Night', date: `${CURRENT_YEAR}-12-15`, type: 'Religious', venue: 'School Hall', description: 'End of year Christmas carols and celebration', organizer: 'Chaplaincy' },
  { id: 'ev12', name: 'Science Fair', date: `${CURRENT_YEAR}-05-08`, type: 'Academic', venue: 'Science Labs', description: 'Student science projects exhibition and competition', organizer: 'Science Department' },
  { id: 'ev13', name: 'Africa Day', date: `${CURRENT_YEAR}-05-25`, type: 'Holiday', venue: 'School Grounds', description: 'Celebrating African unity and heritage', organizer: 'School Administration' },
  { id: 'ev14', name: 'Netball Inter-Schools', date: `${CURRENT_YEAR}-03-22`, type: 'Sports', venue: 'Netball Courts', description: 'Inter-schools netball competition', organizer: 'Sports Department' },
  { id: 'ev15', name: 'Open Day', date: `${CURRENT_YEAR}-09-12`, type: 'Social', venue: 'School Grounds', description: 'Open day for prospective students and parents', organizer: 'Admissions Office' },
]

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
  Holiday: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Cultural: 'bg-teal-100 text-teal-800 border-teal-300',
  Academic: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  Sports: 'bg-amber-100 text-amber-800 border-amber-300',
  Meeting: 'bg-violet-100 text-violet-800 border-violet-300',
  Ceremony: 'bg-rose-100 text-rose-800 border-rose-300',
  Religious: 'bg-pink-100 text-pink-800 border-pink-300',
  Social: 'bg-sky-100 text-sky-800 border-sky-300',
}

const resultColors: Record<string, string> = {
  Win: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Loss: 'bg-red-100 text-red-800 border-red-300',
  Draw: 'bg-amber-100 text-amber-800 border-amber-300',
  Pending: 'bg-gray-100 text-gray-700 border-gray-300',
}

const sportIcons: Record<string, string> = {
  Soccer: '⚽',
  Netball: '🏐',
  Athletics: '🏃',
  Cricket: '🏏',
  Rugby: '🏉',
  Volleyball: '🏐',
  Basketball: '🏀',
  Tennis: '🎾',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getDaysUntil(dateStr: string) {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Calendar Helper ────────────────────────────────────────────────────────

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

// ─── Events Module ──────────────────────────────────────────────────────────

export default function EventsModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [events, setEvents] = useState<SchoolEvent[]>(INITIAL_EVENTS)
  const [fixtures, setFixtures] = useState<SportsFixture[]>(INITIAL_FIXTURES)

  // Event dialog
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<SchoolEvent | null>(null)
  const [eventForm, setEventForm] = useState({
    name: '', date: '', type: 'Academic', venue: '', description: '', organizer: '',
  })

  // Fixture dialog
  const [fixtureDialogOpen, setFixtureDialogOpen] = useState(false)
  const [fixtureForm, setFixtureForm] = useState({
    sport: 'Soccer', date: '', opponent: '', venue: 'Home', team: '1st Team',
  })

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())

  // Filters
  const [eventFilter, setEventFilter] = useState('ALL')
  const [sportFilter, setSportFilter] = useState('ALL')

  // ─── Computed ─────────────────────────────────────────────────────────

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events])

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'ALL') return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return events
      .filter((e) => e.type === eventFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, eventFilter])

  const filteredFixtures = useMemo(() => {
    if (sportFilter === 'ALL') return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return fixtures
      .filter((f) => f.sport === sportFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [fixtures, sportFilter])

  const sportsCount = new Set(fixtures.map((f) => f.sport)).size
  const winsCount = fixtures.filter((f) => f.result === 'Win').length
  const pendingFixtures = fixtures.filter((f) => f.result === 'Pending').length

  // Calendar events for a specific day
  const getEventsForDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return [
      ...events.filter((e) => e.date === dateStr),
      ...fixtures.filter((f) => f.date === dateStr),
    ]
  }

  const calendarDays = getCalendarDays(calYear, calMonth)

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleAddEvent = () => {
    setEditEvent(null)
    setEventForm({ name: '', date: '', type: 'Academic', venue: '', description: '', organizer: '' })
    setEventDialogOpen(true)
  }

  const handleEditEvent = (ev: SchoolEvent) => {
    setEditEvent(ev)
    setEventForm({ name: ev.name, date: ev.date, type: ev.type, venue: ev.venue, description: ev.description, organizer: ev.organizer })
    setEventDialogOpen(true)
  }

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSaveEvent = () => {
    if (!eventForm.name || !eventForm.date) return
    if (editEvent) {
      setEvents((prev) => prev.map((e) => e.id === editEvent.id ? { ...e, ...eventForm } : e))
    } else {
      setEvents((prev) => [...prev, { id: `ev${Date.now()}`, ...eventForm }])
    }
    setEventDialogOpen(false)
  }

  const handleAddFixture = () => {
    setFixtureForm({ sport: 'Soccer', date: '', opponent: '', venue: 'Home', team: '1st Team' })
    setFixtureDialogOpen(true)
  }

  const handleSaveFixture = () => {
    if (!fixtureForm.date || !fixtureForm.opponent) return
    setFixtures((prev) => [...prev, {
      id: `f${Date.now()}`,
      sport: fixtureForm.sport,
      date: fixtureForm.date,
      opponent: fixtureForm.opponent,
      venue: fixtureForm.venue,
      result: 'Pending',
      score: '—',
      team: fixtureForm.team,
    }])
    setFixtureDialogOpen(false)
  }

  const handleDeleteFixture = (id: string) => {
    setFixtures((prev) => prev.filter((f) => f.id !== id))
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events & Sports</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage school events, sports fixtures and activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddFixture}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Fixture
          </Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" onClick={handleAddEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Events
          </TabsTrigger>
          <TabsTrigger value="sports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Sports
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="events-overview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming Events</p>
                        <p className="text-2xl font-bold tracking-tight">{upcomingEvents.length}</p>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-600">This year</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sports Activities</p>
                        <p className="text-2xl font-bold tracking-tight">{sportsCount}</p>
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-teal-600" />
                          <span className="text-xs font-medium text-teal-600">Active codes</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                        <Trophy className="h-5 w-5 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-500" />
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Matches Won</p>
                        <p className="text-2xl font-bold tracking-tight">{winsCount}</p>
                        <div className="flex items-center gap-1.5">
                          <Medal className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-medium text-amber-600">Of {fixtures.filter((f) => f.result !== 'Pending').length} played</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                        <Medal className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Fixtures</p>
                        <p className="text-2xl font-bold tracking-tight">{pendingFixtures}</p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-violet-600" />
                          <span className="text-xs font-medium text-violet-600">Upcoming matches</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                        <Flag className="h-5 w-5 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 to-purple-500" />
                </Card>
              </div>

              {/* Upcoming Events & Calendar Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Upcoming Events */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
                    <CardDescription>Next events on the calendar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      {upcomingEvents.slice(0, 8).map((ev) => {
                        const daysUntil = getDaysUntil(ev.date)
                        return (
                          <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 shrink-0">
                              <span className="text-lg font-bold text-emerald-700">{new Date(ev.date).getDate()}</span>
                              <span className="text-[10px] text-emerald-600">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ev.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn('text-[10px] border', eventTypeColors[ev.type] || 'bg-gray-100 text-gray-700 border-gray-300')}>
                                  {ev.type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{ev.venue}</span>
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
                          </div>
                        )
                      })}
                      {upcomingEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Calendar Preview */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        {MONTH_NAMES[calMonth]} {calYear}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>

              {/* Sports Codes Overview */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Sports Codes</CardTitle>
                  <CardDescription>Active sports and teams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SPORTS_CODES.map((code) => (
                      <div key={code.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{sportIcons[code.name] || '🏅'}</span>
                          <span className="text-sm font-semibold">{code.name}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Coach: {code.coach}</p>
                          <p className="text-[10px] text-muted-foreground">{code.teams.length} team{code.teams.length !== 1 ? 's' : ''} • {code.fixtures} fixture{code.fixtures !== 1 ? 's' : ''}</p>
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
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Events Tab ───────────────────────────────────────────────── */}
        <TabsContent value="events" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="events-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Filters */}
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

              {/* Events List */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Event</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Venue</TableHead>
                          <TableHead className="text-xs">Organizer</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.map((ev) => (
                          <TableRow key={ev.id} className="hover:bg-muted/20">
                            <TableCell className="text-sm whitespace-nowrap">
                              <div className="font-medium">{formatDate(ev.date)}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {(() => {
                                  const d = getDaysUntil(ev.date)
                                  if (d < 0) return 'Past'
                                  if (d === 0) return 'Today'
                                  return `${d} days away`
                                })()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{ev.name}</div>
                              <div className="text-[10px] text-muted-foreground max-w-[200px] truncate">{ev.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('text-[10px] border', eventTypeColors[ev.type] || 'bg-gray-100 text-gray-700 border-gray-300')}>
                                {ev.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{ev.venue}</TableCell>
                            <TableCell className="text-sm">{ev.organizer}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleEditEvent(ev)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteEvent(ev.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Sports Tab ───────────────────────────────────────────────── */}
        <TabsContent value="sports" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="sports-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Sports Codes & Teams */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Sports Codes & Teams</CardTitle>
                  <CardDescription>Active sports programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {SPORTS_CODES.map((code) => (
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Fixtures & Results</CardTitle>
                      <CardDescription>Sports matches and outcomes</CardDescription>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={handleAddFixture}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Fixture
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-6 pb-3">
                    <Select value={sportFilter} onValueChange={setSportFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Sports</SelectItem>
                        {SPORTS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Sport</TableHead>
                          <TableHead className="text-xs">Team</TableHead>
                          <TableHead className="text-xs">Opponent</TableHead>
                          <TableHead className="text-xs">Venue</TableHead>
                          <TableHead className="text-xs">Result</TableHead>
                          <TableHead className="text-xs">Score</TableHead>
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
                            <TableCell className="text-sm">{f.team}</TableCell>
                            <TableCell className="text-sm font-medium">{f.opponent}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px]', f.venue === 'Home' ? 'border-emerald-300 text-emerald-700' : 'border-amber-300 text-amber-700')}>
                                {f.venue}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('text-[10px] border', resultColors[f.result] || 'bg-gray-100 text-gray-700')}>
                                {f.result}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-mono">{f.score}</TableCell>
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
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Calendar Tab ─────────────────────────────────────────────── */}
        <TabsContent value="calendar" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
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
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    'text-[9px] px-1 py-0.5 rounded truncate',
                                    isFixture ? 'bg-amber-100 text-amber-800' : eventTypeColors[(ev as SchoolEvent).type]?.replace('border-', '').split(' ')[0] || 'bg-gray-100 text-gray-700'
                                  )}
                                  style={{
                                    backgroundColor: isFixture ? undefined : undefined,
                                  }}
                                >
                                  {isFixture ? `🏆 ${(ev as SportsFixture).sport}` : (ev as SchoolEvent).name}
                                </div>
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
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-300" />
                      <span className="text-[10px]">Holiday</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded bg-amber-100 border border-amber-300" />
                      <span className="text-[10px]">Sports</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded bg-cyan-100 border border-cyan-300" />
                      <span className="text-[10px]">Academic</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded bg-teal-100 border border-teal-300" />
                      <span className="text-[10px]">Cultural</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded bg-rose-100 border border-rose-300" />
                      <span className="text-[10px]">Ceremony</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded bg-violet-100 border border-violet-300" />
                      <span className="text-[10px]">Meeting</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* ─── Add/Edit Event Dialog ──────────────────────────────────────── */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>
              {editEvent ? 'Modify event details' : 'Create a new school event'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid gap-2">
                <Label>Event Name *</Label>
                <Input
                  placeholder="e.g. Independence Day Celebrations"
                  value={eventForm.name}
                  onChange={(e) => setEventForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={eventForm.type} onValueChange={(v) => setEventForm((p) => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Venue</Label>
                  <Input
                    placeholder="e.g. School Hall"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm((p) => ({ ...p, venue: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Organizer</Label>
                  <Input
                    placeholder="e.g. Sports Department"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm((p) => ({ ...p, organizer: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Event description..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveEvent}
              disabled={!eventForm.name || !eventForm.date}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {editEvent ? 'Save Changes' : 'Add Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Fixture Dialog ─────────────────────────────────────────── */}
      <Dialog open={fixtureDialogOpen} onOpenChange={setFixtureDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Fixture</DialogTitle>
            <DialogDescription>Schedule a new sports match</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Sport</Label>
                <Select value={fixtureForm.sport} onValueChange={(v) => setFixtureForm((p) => ({ ...p, sport: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => (
                      <SelectItem key={s} value={s}>{sportIcons[s]} {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Team</Label>
                <Input
                  placeholder="e.g. 1st Team"
                  value={fixtureForm.team}
                  onChange={(e) => setFixtureForm((p) => ({ ...p, team: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={fixtureForm.date}
                  onChange={(e) => setFixtureForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Venue</Label>
                <Select value={fixtureForm.venue} onValueChange={(v) => setFixtureForm((p) => ({ ...p, venue: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Away">Away</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Opponent *</Label>
              <Input
                placeholder="e.g. Hillcrest College"
                value={fixtureForm.opponent}
                onChange={(e) => setFixtureForm((p) => ({ ...p, opponent: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixtureDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveFixture}
              disabled={!fixtureForm.date || !fixtureForm.opponent}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              Add Fixture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
