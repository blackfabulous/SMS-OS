'use client'

import { ModulePageLayout, ModuleSettingsButton } from '@/components/module-ui';
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  UsersRound,
  Search,
  GraduationCap,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Plus,
  Filter,
  ChevronRight,
  Trophy,
  Star,
  Heart,
  Send,
  BarChart3,
  Eye,
  TrendingUp,
  Globe,
  Building,
  MessageSquare,
  ExternalLink,
  MoreVertical,
  Clock,
  PartyPopper,
  ArrowLeft,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AlumniProfile {
  id: string
  name: string
  graduationYear: number
  occupation: string
  company: string
  location: string
  email: string
  phone: string
  photo: string
  notable: boolean
  contributionTotal: number
  tags: string[]
}

interface Contribution {
  id: string
  alumniName: string
  amount: number
  date: string
  campaign: string
  method: string
}

interface Campaign {
  id: string
  name: string
  description: string
  target: number
  raised: number
  donors: number
  endDate: string
  status: 'active' | 'completed' | 'upcoming'
}

interface AlumniEvent {
  id: string
  name: string
  date: string
  location: string
  type: 'reunion' | 'networking' | 'fundraiser' | 'career' | 'social'
  attendees: number
  maxAttendees: number
  description: string
}

interface Newsletter {
  id: string
  title: string
  sentDate: string
  recipients: number
  openRate: number
  clickRate: number
  status: 'draft' | 'sent' | 'scheduled'
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockAlumni: AlumniProfile[] = [
  { id: '1', name: 'Tendai Moyo', graduationYear: 2005, occupation: 'Medical Doctor', company: 'Parirenyatwa Hospital', location: 'Harare, Zimbabwe', email: 'tendai.moyo@email.co.zw', phone: '+263 772 123 456', photo: 'TM', notable: true, contributionTotal: 5000, tags: ['medicine', 'healthcare'] },
  { id: '2', name: 'Chido Ndlovu', graduationYear: 2010, occupation: 'Software Engineer', company: 'Cassava Smartech', location: 'Harare, Zimbabwe', email: 'chido.ndlovu@email.co.zw', phone: '+263 713 234 567', photo: 'CN', notable: false, contributionTotal: 1200, tags: ['technology', 'it'] },
  { id: '3', name: 'Kudzai Chikumbu', graduationYear: 2008, occupation: 'Chartered Accountant', company: 'Deloitte Zimbabwe', location: 'Harare, Zimbabwe', email: 'kudzai.c@email.co.zw', phone: '+263 774 345 678', photo: 'KC', notable: true, contributionTotal: 8500, tags: ['finance', 'accounting'] },
  { id: '4', name: 'Rumbidzai Dube', graduationYear: 2012, occupation: 'Lawyer', company: 'Atherstone & Cook', location: 'Bulawayo, Zimbabwe', email: 'rumbi.dube@email.co.zw', phone: '+263 715 456 789', photo: 'RD', notable: false, contributionTotal: 3000, tags: ['law', 'legal'] },
  { id: '5', name: 'Tapiwa Gumbo', graduationYear: 2003, occupation: 'Professor', company: 'University of Zimbabwe', location: 'Harare, Zimbabwe', email: 'tapiwa.gumbo@email.co.zw', phone: '+263 776 567 890', photo: 'TG', notable: true, contributionTotal: 12000, tags: ['education', 'academia'] },
  { id: '6', name: 'Nyasha Sithole', graduationYear: 2015, occupation: 'Entrepreneur', company: 'Sithole Agribusiness', location: 'Mutare, Zimbabwe', email: 'nyasha.s@email.co.zw', phone: '+263 717 678 901', photo: 'NS', notable: false, contributionTotal: 2500, tags: ['agriculture', 'business'] },
  { id: '7', name: 'Munyaradzi Zhou', graduationYear: 2007, occupation: 'Civil Engineer', company: 'ZINWA', location: 'Harare, Zimbabwe', email: 'munya.zhou@email.co.zw', phone: '+263 778 789 012', photo: 'MZ', notable: false, contributionTotal: 4000, tags: ['engineering', 'infrastructure'] },
  { id: '8', name: 'Tatenda Maposa', graduationYear: 2018, occupation: 'Data Scientist', company: 'Econet Wireless', location: 'Harare, Zimbabwe', email: 'tatenda.m@email.co.zw', phone: '+263 719 890 123', photo: 'TM', notable: false, contributionTotal: 800, tags: ['technology', 'data'] },
  { id: '9', name: 'Rutendo Ncube', graduationYear: 2006, occupation: 'Architect', company: 'Pearl Properties', location: 'Harare, Zimbabwe', email: 'rutendo.n@email.co.zw', phone: '+263 770 901 234', photo: 'RN', notable: false, contributionTotal: 3500, tags: ['architecture', 'design'] },
  { id: '10', name: 'Farai Machirori', graduationYear: 2001, occupation: 'Bank Executive', company: 'CBZ Bank', location: 'Harare, Zimbabwe', email: 'farai.m@email.co.zw', phone: '+263 771 012 345', photo: 'FM', notable: true, contributionTotal: 15000, tags: ['banking', 'finance'] },
  { id: '11', name: 'Sibusisiwe Bhebhe', graduationYear: 2014, occupation: 'Pharmacist', company: 'Wellness Pharmacy', location: 'Bulawayo, Zimbabwe', email: 'sibu.b@email.co.zw', phone: '+263 712 123 456', photo: 'SB', notable: false, contributionTotal: 1500, tags: ['pharmacy', 'healthcare'] },
  { id: '12', name: 'Tawanda Chidavaenzi', graduationYear: 2009, occupation: 'Marketing Director', company: 'Delta Corporation', location: 'Harare, Zimbabwe', email: 'tawanda.c@email.co.zw', phone: '+263 773 234 567', photo: 'TC', notable: false, contributionTotal: 6000, tags: ['marketing', 'corporate'] },
  { id: '13', name: 'Petronella Mataruse', graduationYear: 2016, occupation: 'Veterinarian', company: 'Matopo Vet Clinic', location: 'Matebeleland South, Zimbabwe', email: 'petro.m@email.co.zw', phone: '+263 714 345 678', photo: 'PM', notable: false, contributionTotal: 900, tags: ['veterinary', 'agriculture'] },
  { id: '14', name: 'Zviko Mapuranga', graduationYear: 2011, occupation: 'Journalist', company: 'The Herald', location: 'Harare, Zimbabwe', email: 'zviko.m@email.co.zw', phone: '+263 775 456 789', photo: 'ZM', notable: false, contributionTotal: 2000, tags: ['media', 'journalism'] },
  { id: '15', name: 'Nhamo Chigwedere', graduationYear: 2000, occupation: 'School Principal', company: 'Prince Edward School', location: 'Harare, Zimbabwe', email: 'nhamo.c@email.co.zw', phone: '+263 776 567 890', photo: 'NC', notable: true, contributionTotal: 20000, tags: ['education', 'leadership'] },
  { id: '16', name: 'Blessing Mahachi', graduationYear: 2019, occupation: 'Graphic Designer', company: 'Freelance', location: 'Gweru, Zimbabwe', email: 'blessing.m@email.co.zw', phone: '+263 717 678 901', photo: 'BM', notable: false, contributionTotal: 500, tags: ['design', 'creative'] },
]

const mockCampaigns: Campaign[] = [
  { id: 'c1', name: 'Science Lab Renovation', description: 'Upgrading the school science laboratories with modern equipment', target: 50000, raised: 32500, donors: 42, endDate: '2025-06-30', status: 'active' },
  { id: 'c2', name: 'Library Book Drive', description: 'Adding 2000 new books to the school library collection', target: 15000, raised: 15000, donors: 35, endDate: '2025-02-28', status: 'completed' },
  { id: 'c3', name: 'Sports Equipment Fund', description: 'New equipment for soccer, netball, and athletics teams', target: 25000, raised: 8700, donors: 18, endDate: '2025-08-31', status: 'active' },
  { id: 'c4', name: 'Scholarship Endowment', description: 'Establishing a scholarship fund for underprivileged students', target: 100000, raised: 45000, donors: 65, endDate: '2025-12-31', status: 'active' },
  { id: 'c5', name: 'Computer Lab Upgrade', description: 'Purchasing 30 new computers for the IT lab', target: 30000, raised: 0, donors: 0, endDate: '2025-09-30', status: 'upcoming' },
]

const mockContributions: Contribution[] = [
  { id: 'cn1', alumniName: 'Nhamo Chigwedere', amount: 5000, date: '2025-03-01', campaign: 'Scholarship Endowment', method: 'Bank Transfer' },
  { id: 'cn2', alumniName: 'Farai Machirori', amount: 3000, date: '2025-02-28', campaign: 'Science Lab Renovation', method: 'EcoCash' },
  { id: 'cn3', alumniName: 'Tapiwa Gumbo', amount: 2500, date: '2025-02-25', campaign: 'Scholarship Endowment', method: 'Bank Transfer' },
  { id: 'cn4', alumniName: 'Kudzai Chikumbu', amount: 2000, date: '2025-02-20', campaign: 'Science Lab Renovation', method: 'PayPal' },
  { id: 'cn5', alumniName: 'Tawanda Chidavaenzi', amount: 1500, date: '2025-02-18', campaign: 'Sports Equipment Fund', method: 'EcoCash' },
  { id: 'cn6', alumniName: 'Munyaradzi Zhou', amount: 1000, date: '2025-02-15', campaign: 'Science Lab Renovation', method: 'Bank Transfer' },
  { id: 'cn7', alumniName: 'Rutendo Ncube', amount: 800, date: '2025-02-12', campaign: 'Sports Equipment Fund', method: 'EcoCash' },
  { id: 'cn8', alumniName: 'Tendai Moyo', amount: 2000, date: '2025-02-10', campaign: 'Scholarship Endowment', method: 'PayPal' },
  { id: 'cn9', alumniName: 'Rumbidzai Dube', amount: 750, date: '2025-02-08', campaign: 'Library Book Drive', method: 'Bank Transfer' },
  { id: 'cn10', alumniName: 'Nyasha Sithole', amount: 500, date: '2025-02-05', campaign: 'Sports Equipment Fund', method: 'EcoCash' },
]

const mockEvents: AlumniEvent[] = [
  { id: 'e1', name: 'Class of 2005 - 20 Year Reunion', date: '2025-07-15', location: 'School Main Hall', type: 'reunion', attendees: 45, maxAttendees: 80, description: 'Celebrating 20 years since graduation. Dinner, speeches, and campus tour.' },
  { id: 'e2', name: 'Alumni Career Day 2025', date: '2025-05-20', location: 'School Auditorium', type: 'career', attendees: 30, maxAttendees: 50, description: 'Alumni sharing career paths and mentoring current students.' },
  { id: 'e3', name: 'Scholarship Fundraiser Gala', date: '2025-08-10', location: 'Rainbow Towers, Harare', type: 'fundraiser', attendees: 120, maxAttendees: 200, description: 'Annual black-tie fundraiser for the scholarship endowment fund.' },
  { id: 'e4', name: 'Alumni Networking Mixer', date: '2025-06-05', location: 'Miekles Hotel, Harare', type: 'networking', attendees: 55, maxAttendees: 75, description: 'Casual networking event for alumni across all graduation years.' },
  { id: 'e5', name: 'Sports Day Alumni vs Students', date: '2025-04-12', location: 'School Sports Fields', type: 'social', attendees: 80, maxAttendees: 100, description: 'Annual friendly matches: alumni vs current students in soccer and netball.' },
  { id: 'e6', name: 'Class of 2010 - 15 Year Reunion', date: '2025-09-20', location: 'School Grounds', type: 'reunion', attendees: 25, maxAttendees: 60, description: '15 year reunion celebration with family activities and campus tour.' },
]

const mockNewsletters: Newsletter[] = [
  { id: 'n1', title: 'Q1 2025 Alumni Update', sentDate: '2025-03-01', recipients: 245, openRate: 68, clickRate: 24, status: 'sent' },
  { id: 'n2', title: 'Scholarship Fund Progress Report', sentDate: '2025-02-15', recipients: 245, openRate: 72, clickRate: 31, status: 'sent' },
  { id: 'n3', title: 'Reunion Season Announcement', sentDate: '2025-01-20', recipients: 230, openRate: 65, clickRate: 28, status: 'sent' },
  { id: 'n4', title: 'Q2 2025 Alumni Newsletter', sentDate: '', recipients: 250, openRate: 0, clickRate: 0, status: 'draft' },
  { id: 'n5', title: 'Sports Day Invitation', sentDate: '2025-04-01', recipients: 250, openRate: 0, clickRate: 0, status: 'scheduled' },
]

const graduationYearData = [
  { year: '2000', count: 8 },
  { year: '2001', count: 6 },
  { year: '2002', count: 9 },
  { year: '2003', count: 12 },
  { year: '2004', count: 10 },
  { year: '2005', count: 15 },
  { year: '2006', count: 13 },
  { year: '2007', count: 11 },
  { year: '2008', count: 14 },
  { year: '2009', count: 10 },
  { year: '2010', count: 16 },
  { year: '2011', count: 12 },
  { year: '2012', count: 14 },
  { year: '2013', count: 11 },
  { year: '2014', count: 13 },
  { year: '2015', count: 15 },
  { year: '2016', count: 10 },
  { year: '2017', count: 12 },
  { year: '2018', count: 14 },
  { year: '2019', count: 11 },
]

const contributionChartData = [
  { month: 'Sep', amount: 2800 },
  { month: 'Oct', amount: 3200 },
  { month: 'Nov', amount: 4500 },
  { month: 'Dec', amount: 6200 },
  { month: 'Jan', amount: 4100 },
  { month: 'Feb', amount: 5800 },
  { month: 'Mar', amount: 3300 },
]

const locationChartData = [
  { name: 'Harare', value: 45, fill: '#10b981' },
  { name: 'Bulawayo', value: 18, fill: '#14b8a6' },
  { name: 'Mutare', value: 8, fill: '#06b6d4' },
  { name: 'Gweru', value: 6, fill: '#8b5cf6' },
  { name: 'Diaspora', value: 15, fill: '#f59e0b' },
  { name: 'Other', value: 8, fill: '#ec4899' },
]

const eventTypeColors: Record<string, { color: string; bg: string }> = {
  reunion: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  networking: { color: 'text-teal-700', bg: 'bg-teal-50' },
  fundraiser: { color: 'text-amber-700', bg: 'bg-amber-50' },
  career: { color: 'text-violet-700', bg: 'bg-violet-50' },
  social: { color: 'text-pink-700', bg: 'bg-pink-50' },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AlumniModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [occupationFilter, setOccupationFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'detail' | 'settings'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState({ name: '', date: '', location: '', type: 'reunion', description: '' })

  // Settings state
  const [settings, setSettings] = useState({
    directoryPublic: true,
    eventNotifications: true,
    donationTracking: true,
    membershipTiers: false,
    emailDigest: 'weekly',
  })

  // Derived data
  const totalAlumni = mockAlumni.length
  const totalContributions = mockContributions.reduce((a, c) => a + c.amount, 0)
  const notableAlumni = mockAlumni.filter(a => a.notable)
  const upcomingReunions = mockEvents.filter(e => e.type === 'reunion')

  // Unique values for filters
  const graduationYears = [...new Set(mockAlumni.map(a => a.graduationYear))].sort((a, b) => b - a)
  const occupations = [...new Set(mockAlumni.map(a => a.occupation))].sort()
  const locations = [...new Set(mockAlumni.map(a => a.location))].sort()

  // Filter alumni
  const filteredAlumni = useMemo(() => {
    return mockAlumni.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.company.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesYear = yearFilter === 'all' || a.graduationYear === parseInt(yearFilter)
      const matchesOccupation = occupationFilter === 'all' || a.occupation === occupationFilter
      const matchesLocation = locationFilter === 'all' || a.location === locationFilter
      return matchesSearch && matchesYear && matchesOccupation && matchesLocation
    })
  }, [searchQuery, yearFilter, occupationFilter, locationFilter])

  // Get selected alumni for detail view
  const selectedAlumni = mockAlumni.find(a => a.id === selectedId)
  const selectedEvent = mockEvents.find(e => e.id === selectedId)

  // Settings view
  if (viewMode === 'settings') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-600" />
            Alumni Settings
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Configure the alumni network module</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">Directory & Privacy</CardTitle><CardDescription>Control alumni directory visibility</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Public Directory</p><p className="text-xs text-muted-foreground">Make alumni directory visible to all</p></div>
                <Switch checked={settings.directoryPublic} onCheckedChange={(v) => setSettings({...settings, directoryPublic: v})} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Membership Tiers</p><p className="text-xs text-muted-foreground">Enable paid membership tiers</p></div>
                <Switch checked={settings.membershipTiers} onCheckedChange={(v) => setSettings({...settings, membershipTiers: v})} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">Notifications</CardTitle><CardDescription>Event and communication preferences</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Event Notifications</p><p className="text-xs text-muted-foreground">Notify alumni of upcoming events</p></div>
                <Switch checked={settings.eventNotifications} onCheckedChange={(v) => setSettings({...settings, eventNotifications: v})} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Email Digest</p><p className="text-xs text-muted-foreground">Frequency of alumni email digests</p></div>
                <Select value={settings.emailDigest} onValueChange={(v) => setSettings({...settings, emailDigest: v})}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">Donation Tracking</CardTitle><CardDescription>Configure donation and campaign settings</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Enable Donation Tracking</p><p className="text-xs text-muted-foreground">Track and display alumni contributions</p></div>
                <Switch checked={settings.donationTracking} onCheckedChange={(v) => setSettings({...settings, donationTracking: v})} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { toast.success('Settings saved successfully'); setViewMode('list') }}>Save Settings</Button>
        </div>
      </div>
    )
  }

  // Add event view
  if (viewMode === 'add') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Events</Button>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            Create Alumni Event
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Add a new alumni event or reunion</p>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input placeholder="e.g., Class of 2010 Reunion" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reunion">Reunion</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="fundraiser">Fundraiser</SelectItem>
                    <SelectItem value="career">Career Day</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="e.g., School Main Hall" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the event" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { toast.success('Event created successfully'); setViewMode('list') }}>Create Event</Button>
        </div>
      </div>
    )
  }

  // Detail view for alumni
  if (viewMode === 'detail' && selectedAlumni) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Directory</Button>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className={cn('h-20 w-20', selectedAlumni.notable ? 'border-2 border-amber-300' : '')}>
                <AvatarFallback className={cn('text-xl font-semibold', selectedAlumni.notable ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white')}>
                  {selectedAlumni.photo}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{selectedAlumni.name}</h2>
                  {selectedAlumni.notable && <Badge className="bg-amber-100 text-amber-700"><Star className="h-3 w-3 mr-1" />Notable</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">Class of {selectedAlumni.graduationYear}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Occupation</p><p className="text-sm font-medium">{selectedAlumni.occupation}</p></div></div>
                <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Company</p><p className="text-sm font-medium">{selectedAlumni.company}</p></div></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Location</p><p className="text-sm font-medium">{selectedAlumni.location}</p></div></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{selectedAlumni.email}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium">{selectedAlumni.phone}</p></div></div>
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Contributions</p><p className="text-sm font-medium text-emerald-600">${selectedAlumni.contributionTotal.toLocaleString()}</p></div></div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {selectedAlumni.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Mail className="h-4 w-4" /> Send Email</Button>
          <Button variant="outline" className="gap-2"><Phone className="h-4 w-4" /> Call</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
<ModulePageLayout
        actions={<>
          <ModuleSettingsButton onClick={() => { setViewMode('settings'); setSelectedId(null) }} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview"><span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="directory"><span className="hidden sm:inline">Directory</span></TabsTrigger>
            <TabsTrigger value="contributions"><span className="hidden sm:inline">Contributions</span></TabsTrigger>
            <TabsTrigger value="events"><span className="hidden sm:inline">Events</span></TabsTrigger>
            <TabsTrigger value="communications"><span className="hidden sm:inline">Communications</span></TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: UsersRound, label: 'Total Alumni', value: String(totalAlumni), trend: '+12 this year', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: DollarSign, label: 'Total Contributions', value: `$${(totalContributions).toLocaleString()}`, trend: '+18% YoY', color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: Star, label: 'Notable Alumni', value: String(notableAlumni.length), trend: 'Distinguished', color: 'text-violet-600', bg: 'bg-violet-50' },
              { icon: PartyPopper, label: 'Upcoming Reunions', value: String(upcomingReunions.length), trend: 'This year', color: 'text-pink-600', bg: 'bg-pink-50' },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.trend}</p>
                    </div>
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.bg)}>
                      <stat.icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graduation Years Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Alumni by Graduation Year</CardTitle>
                <CardDescription>Distribution across graduating classes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={graduationYearData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} name="Alumni" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Location Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Alumni by Location</CardTitle>
                <CardDescription>Geographic distribution of alumni</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={locationChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      nameKey="name"
                      paddingAngle={2}
                    >
                      {locationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {locationChartData.map((loc) => (
                    <div key={loc.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: loc.fill }} />
                      <span className="text-muted-foreground">{loc.name} ({loc.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notable Alumni & Upcoming Reunions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notable Alumni */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Notable Alumni</CardTitle>
                  <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">
                    <Star className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notableAlumni.map((alumni) => (
                    <div key={alumni.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10 border-2 border-amber-200">
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-semibold">
                          {alumni.photo}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{alumni.name}</p>
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        </div>
                        <p className="text-xs text-muted-foreground">{alumni.occupation} at {alumni.company}</p>
                        <p className="text-xs text-muted-foreground">Class of {alumni.graduationYear}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{alumni.location.split(',')[0]}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Reunions */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Upcoming Reunions</CardTitle>
                  <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => setActiveTab('events')}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingReunions.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg border hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{event.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                          </div>
                        </div>
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {event.attendees}/{event.maxAttendees}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Progress value={(event.attendees / event.maxAttendees) * 100} className="h-1.5" />
                      </div>
                    </div>
                  ))}
                  {upcomingReunions.length === 0 && (
                    <div className="text-center py-6">
                      <PartyPopper className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming reunions scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Directory Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="directory" className="space-y-4 mt-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, occupation, company..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Grad Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {graduationYears.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {filteredAlumni.length} alumni{filteredAlumni.length !== 1 ? '' : ''} found
            </Badge>
            {(yearFilter !== 'all' || locationFilter !== 'all' || searchQuery) && (
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { setSearchQuery(''); setYearFilter('all'); setLocationFilter('all') }}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Alumni Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAlumni.map((alumni) => (
              <motion.div
                key={alumni.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  'border-0 shadow-md hover:shadow-lg transition-shadow group',
                  alumni.notable && 'ring-1 ring-amber-200'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className={cn('h-12 w-12', alumni.notable ? 'border-2 border-amber-300' : '')}>
                        <AvatarFallback className={cn(
                          'text-sm font-semibold',
                          alumni.notable
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                            : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                        )}>
                          {alumni.photo}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">{alumni.name}</p>
                          {alumni.notable && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />Class of {alumni.graduationYear}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{alumni.occupation}</span>
                      </p>
                      <p className="text-xs flex items-center gap-1.5">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{alumni.company}</span>
                      </p>
                      <p className="text-xs flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{alumni.location}</span>
                      </p>
                    </div>

                    {alumni.contributionTotal > 0 && (
                      <div className="mt-3 pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Contributions</span>
                          <span className="font-medium text-emerald-600">${alumni.contributionTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5">
                      {alumni.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => { setViewMode('detail'); setSelectedId(alumni.id) }}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredAlumni.length === 0 && (
            <div className="text-center py-12">
              <UsersRound className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No alumni found matching your criteria</p>
              <Button variant="outline" className="mt-3" onClick={() => { setSearchQuery(''); setYearFilter('all'); setLocationFilter('all') }}>
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ─── Contributions Tab ────────────────────────────────────────────────── */}
        <TabsContent value="contributions" className="space-y-6 mt-4">
          {/* Contribution Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalContributions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Contributions</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                  <Heart className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockContributions.length}</p>
                  <p className="text-xs text-muted-foreground">Recent Donations</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${Math.round(totalContributions / mockContributions.length).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Avg. Donation</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contribution Chart & Recent Donations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Contributions</CardTitle>
                <CardDescription>Donation trend over the past months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={contributionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} name="Amount" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Donations</CardTitle>
                <CardDescription>Latest alumni contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {mockContributions.map((contrib) => (
                      <div key={contrib.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                            {contrib.alumniName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{contrib.alumniName}</p>
                          <p className="text-xs text-muted-foreground">{contrib.campaign} &middot; {contrib.method}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600">${contrib.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{contrib.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Active Campaigns */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Fundraising Campaigns</CardTitle>
              <CardDescription>Active and upcoming fundraising initiatives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 rounded-lg border hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{campaign.description}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] shrink-0 ml-2',
                          campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          campaign.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-700'
                        )}
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">${campaign.raised.toLocaleString()} raised</span>
                        <span className="font-medium">${campaign.target.toLocaleString()} goal</span>
                      </div>
                      <Progress value={(campaign.raised / campaign.target) * 100} className="h-2" />
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{campaign.donors} donors</span>
                        <span>Ends {campaign.endDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Events Tab ────────────────────────────────────────────────────────── */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alumni Events</h3>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setViewMode('add'); setNewEvent({ name: '', date: '', location: '', type: 'reunion', description: '' }) }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Event
                </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockEvents.map((event) => {
              const typeStyle = eventTypeColors[event.type] || eventTypeColors.social
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{event.name}</p>
                            <Badge variant="secondary" className={cn('text-[10px]', typeStyle.bg, typeStyle.color)}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {[1, 2, 3].map(i => (
                              <Avatar key={i} className="h-5 w-5 border-2 border-background">
                                <AvatarFallback className="text-[7px] bg-muted">
                                  {String.fromCharCode(64 + i + event.attendees)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{event.attendees}/{event.maxAttendees} attending</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs">RSVP</Button>
                      </div>
                      <Progress value={(event.attendees / event.maxAttendees) * 100} className="h-1.5 mt-2" />
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* ─── Communications Tab ────────────────────────────────────────────────── */}
        <TabsContent value="communications" className="space-y-6 mt-4">
          {/* Comms Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { icon: Mail, label: 'Total Subscribers', value: '250', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Send, label: 'Newsletters Sent', value: '3', color: 'text-teal-600', bg: 'bg-teal-50' },
              { icon: Eye, label: 'Avg. Open Rate', value: '68%', color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: MessageSquare, label: 'Click Rate', value: '28%', color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', stat.bg)}>
                    <stat.icon className={cn('h-4 w-4', stat.color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Newsletter Management */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Newsletter Management</CardTitle>
                  <CardDescription>Manage alumni newsletters and email campaigns</CardDescription>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Newsletter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Newsletter</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Sent Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Recipients</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Open Rate</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Click Rate</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockNewsletters.map((nl) => (
                      <tr key={nl.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{nl.title}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{nl.sentDate || '—'}</td>
                        <td className="p-3 text-sm text-muted-foreground">{nl.recipients}</td>
                        <td className="p-3 hidden md:table-cell">
                          {nl.openRate > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-muted rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${nl.openRate}%` }} />
                              </div>
                              <span className="text-xs font-medium">{nl.openRate}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          {nl.clickRate > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-muted rounded-full h-1.5">
                                <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${nl.clickRate}%` }} />
                              </div>
                              <span className="text-xs font-medium">{nl.clickRate}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px]',
                              nl.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                              nl.status === 'scheduled' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-50 text-gray-700'
                            )}
                          >
                            {nl.status.charAt(0).toUpperCase() + nl.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                              <DropdownMenuItem><Send className="mr-2 h-3.5 w-3.5" /> Send</DropdownMenuItem>
                              <DropdownMenuItem><ExternalLink className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Email Engagement</CardTitle>
                <CardDescription>Open and click rates over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { newsletter: 'Q1 Update', openRate: 68, clickRate: 24 },
                    { newsletter: 'Scholarship', openRate: 72, clickRate: 31 },
                    { newsletter: 'Reunion', openRate: 65, clickRate: 28 },
                    { newsletter: 'Avg. Industry', openRate: 45, clickRate: 15 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="newsletter" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="openRate" fill="#10b981" name="Open Rate %" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="clickRate" fill="#14b8a6" name="Click Rate %" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Compose</CardTitle>
                <CardDescription>Send a quick message to alumni</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Alumni (250)</SelectItem>
                      <SelectItem value="notable">Notable Alumni (5)</SelectItem>
                      <SelectItem value="recent">Class of 2015-2020 (60)</SelectItem>
                      <SelectItem value="contributors">Contributors (45)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Enter email subject" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Type your message here..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                    <Send className="h-4 w-4 mr-2" /> Send Email
                  </Button>
                  <Button variant="outline">Save Draft</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </ModulePageLayout>
    </div>
  )
}
