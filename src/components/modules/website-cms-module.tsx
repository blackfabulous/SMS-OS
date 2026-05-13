'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Clock, Users, Mail, Phone, Globe, BookOpen,
  Trophy, Camera, Building, Heart, Star, ArrowRight, ChevronRight,
  ExternalLink, GraduationCap, Target, Eye, Quote, Facebook,
  Twitter, Instagram, Youtube, Send, CheckCircle2, Award,
  UsersRound, FileText, DollarSign, Sparkles, Landmark,
  Shield, Leaf, HandHeart, ChevronDown, Play, X, ArrowLeft, Settings, Palette, Share2, Save,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const schoolInfo = {
  name: 'Mufakose High School',
  motto: 'Excellence Through Diligence',
  established: 1985,
  type: 'Government Secondary School',
  province: 'Harare Metropolitan',
  district: 'Harare District',
  address: '15 Mufakose Drive, Mufakose, Harare',
  phone: '+263 4 674 221',
  email: 'info@mufakosehigh.edu.zw',
  website: 'www.mufakosehigh.edu.zw',
  enrollment: 1247,
  teachers: 68,
  passRate: 87,
  clubs: 24,
  registration: 'MOE/SCH/HRE/0042',
  headmaster: 'Mr. Johannes M. Shumba',
  deputy: 'Mrs. Rumbidzai A. Moyo',
}

const events = [
  { id: 1, title: 'Independence Day Celebrations', date: '2025-04-18', time: '08:00', location: 'School Grounds', type: 'Holiday', description: 'Commemorating Zimbabwe\'s 45th Independence Anniversary with cultural performances and flag raising ceremony.', color: 'bg-red-500' },
  { id: 2, title: 'Inter-House Athletics', date: '2025-03-28', time: '09:00', location: 'Sports Field', type: 'Sports', description: 'Annual inter-house athletics competition featuring track and field events for all forms.', color: 'bg-emerald-500' },
  { id: 3, title: 'Prize Giving Ceremony', date: '2025-05-15', time: '10:00', location: 'Main Hall', type: 'Ceremony', description: 'Celebrating academic and extracurricular achievements of 2024 with special guest from MoPSE.', color: 'bg-amber-500' },
  { id: 4, title: 'ZIMSEC O-Level Registration Deadline', date: '2025-03-31', time: '16:00', location: 'Admin Office', type: 'Academic', description: 'Final date for O-Level candidate registration. All forms and fees must be submitted.', color: 'bg-blue-500' },
  { id: 5, title: 'Heroes Day Commemoration', date: '2025-08-11', time: '08:00', location: 'School Grounds', type: 'Holiday', description: 'Honouring Zimbabwe\'s national heroes with a special assembly and community service.', color: 'bg-red-500' },
  { id: 6, title: 'SDC Annual General Meeting', date: '2025-04-05', time: '14:00', location: 'Main Hall', type: 'Meeting', description: 'School Development Committee AGM to discuss school development plans and budget.', color: 'bg-purple-500' },
  { id: 7, title: 'Science Fair 2025', date: '2025-06-20', time: '09:00', location: 'Science Labs', type: 'Academic', description: 'Annual science fair showcasing student innovation and research projects.', color: 'bg-cyan-500' },
  { id: 8, title: 'Culture Day Celebrations', date: '2025-05-21', time: '10:00', location: 'School Amphitheatre', type: 'Cultural', description: 'Celebrating Zimbabwe\'s diverse cultural heritage through music, dance, and art.', color: 'bg-orange-500' },
  { id: 9, title: 'Sports Day: Soccer Finals', date: '2025-07-12', time: '14:00', location: 'Sports Field', type: 'Sports', description: 'Inter-school soccer finals. Mufakose High vs Churchill High.', color: 'bg-emerald-500' },
]

const news = [
  { id: 1, title: 'Outstanding ZIMSEC Results: 92% Pass Rate Achieved', excerpt: 'Mufakose High School celebrates its best O-Level results in a decade with a 92% pass rate, surpassing the national average by 24 points.', category: 'Academic', date: '2025-01-15', featured: true, image: 'academic' },
  { id: 2, title: 'New Computer Lab Inaugurated by MoPSE Officials', excerpt: 'A state-of-the-art computer laboratory with 40 workstations was officially opened, bringing digital learning to every student.', category: 'Infrastructure', date: '2025-02-10', featured: false, image: 'campus' },
  { id: 3, title: 'Athletics Team Wins Provincial Championship', excerpt: 'Our athletics team clinched the Harare Provincial Championship for the third consecutive year, qualifying for nationals.', category: 'Sports', date: '2025-03-05', featured: false, image: 'sports' },
  { id: 4, title: 'BEAM Programme Supports 180 Students This Term', excerpt: 'The Basic Education Assistance Module has enabled 180 vulnerable students to continue their education without financial barriers.', category: 'Welfare', date: '2025-02-20', featured: false, image: 'culture' },
  { id: 5, title: 'Partnership with University of Zimbabwe for Science Mentorship', excerpt: 'A new mentorship programme pairs UZ science students with our Form 5 and 6 learners for career guidance and lab sessions.', category: 'Partnership', date: '2025-01-28', featured: false, image: 'academic' },
  { id: 6, title: 'Community Outreach: Mufakose Cleanup Campaign', excerpt: 'Over 200 students and staff participated in the Mufakose suburb cleanup campaign, promoting environmental stewardship.', category: 'Community', date: '2025-03-12', featured: false, image: 'events' },
  { id: 7, title: 'Library Expansion: 2,000 New Books Donated', excerpt: 'The school library received a generous donation of 2,000 books from the Zimbabwe Book Development Council.', category: 'Infrastructure', date: '2025-02-05', featured: false, image: 'campus' },
]

const staffMembers = [
  { id: 1, name: 'Mr. Johannes M. Shumba', role: 'Headmaster', department: 'Administration', qualification: 'M.Ed (UZ), B.Ed (UZ)', subjects: ['Education Leadership'], since: 2010, color: 'from-emerald-600 to-teal-700' },
  { id: 2, name: 'Mrs. Rumbidzai A. Moyo', role: 'Deputy Headmaster', department: 'Administration', qualification: 'M.Sc (NUST), B.Sc (UZ)', subjects: ['Mathematics'], since: 2012, color: 'from-teal-600 to-cyan-700' },
  { id: 3, name: 'Mr. Tendai Gumbo', role: 'HOD Sciences', department: 'Sciences', qualification: 'B.Sc Hons (UZ), PGDE', subjects: ['Physics', 'Chemistry'], since: 2008, color: 'from-cyan-600 to-blue-700' },
  { id: 4, name: 'Mrs. Chido Ndlovu', role: 'HOD Languages', department: 'Languages', qualification: 'B.A Hons (UZ), M.A (UNISA)', subjects: ['English', 'Literature'], since: 2009, color: 'from-purple-600 to-violet-700' },
  { id: 5, name: 'Mr. Kudzai Chikumbu', role: 'HOD Mathematics', department: 'Mathematics', qualification: 'B.Sc (MSU), PGDE', subjects: ['Mathematics', 'Additional Maths'], since: 2011, color: 'from-amber-600 to-orange-700' },
  { id: 6, name: 'Mrs. Tariro Dube', role: 'HOD Humanities', department: 'Humanities', qualification: 'B.A (UZ), PGDE', subjects: ['History', 'Geography'], since: 2013, color: 'from-rose-600 to-pink-700' },
  { id: 7, name: 'Mr. Farai Banda', role: 'HOD Technical', department: 'Technical', qualification: 'B.Tech (GZU), PGDE', subjects: ['Computer Science', 'Accounts'], since: 2014, color: 'from-blue-600 to-indigo-700' },
  { id: 8, name: 'Mrs. Nyasha Mapfumo', role: 'HOD Commercials', department: 'Commercials', qualification: 'B.Com (NUST), PGDE', subjects: ['Business Studies', 'Economics'], since: 2012, color: 'from-emerald-600 to-green-700' },
  { id: 9, name: 'Mr. Blessing Sithole', role: 'Sports Director', department: 'Sports', qualification: 'B.Ed (UZ), Sports Diploma', subjects: ['Physical Education'], since: 2015, color: 'from-orange-600 to-red-700' },
  { id: 10, name: 'Mrs. Tanyaradzwa Chiweshe', role: 'Senior Teacher', department: 'Sciences', qualification: 'B.Sc (UZ), PGDE', subjects: ['Biology', 'Chemistry'], since: 2016, color: 'from-teal-600 to-emerald-700' },
  { id: 11, name: 'Mr. Simba Mahachi', role: 'Teacher', department: 'Languages', qualification: 'B.A (MSU), PGDE', subjects: ['Shona', 'History'], since: 2018, color: 'from-violet-600 to-purple-700' },
  { id: 12, name: 'Mrs. Grace Munyuki', role: 'Teacher', department: 'Mathematics', qualification: 'B.Sc (UZ), PGDE', subjects: ['Mathematics'], since: 2017, color: 'from-pink-600 to-rose-700' },
  { id: 13, name: 'Mr. Aaron Chikuni', role: 'School Bursar', department: 'Finance', qualification: 'B.Compt (UNISA), CA(Z)', subjects: ['Finance'], since: 2007, color: 'from-amber-600 to-yellow-700' },
  { id: 14, name: 'Mrs. Sithembile Ncube', role: 'Guidance Counsellor', department: 'Welfare', qualification: 'M.Ed Psych (UZ), B.Ed', subjects: ['Guidance & Counselling'], since: 2019, color: 'from-cyan-600 to-teal-700' },
]

const galleryImages = [
  { id: 1, title: 'School Main Entrance', category: 'Campus', color: 'from-emerald-400 to-teal-500' },
  { id: 2, title: 'Science Laboratory', category: 'Campus', color: 'from-blue-400 to-cyan-500' },
  { id: 3, title: 'Independence Day Celebrations', category: 'Events', color: 'from-red-400 to-orange-500' },
  { id: 4, title: 'Athletics Championship 2024', category: 'Sports', color: 'from-amber-400 to-yellow-500' },
  { id: 5, title: 'Form 6 Chemistry Class', category: 'Academics', color: 'from-purple-400 to-violet-500' },
  { id: 6, title: 'Traditional Dance Group', category: 'Culture', color: 'from-orange-400 to-red-500' },
  { id: 7, title: 'School Library', category: 'Campus', color: 'from-teal-400 to-emerald-500' },
  { id: 8, title: 'Prize Giving Ceremony', category: 'Events', color: 'from-yellow-400 to-amber-500' },
  { id: 9, title: 'Soccer Team Victory', category: 'Sports', color: 'from-green-400 to-teal-500' },
  { id: 10, title: 'Computer Lab Session', category: 'Academics', color: 'from-cyan-400 to-blue-500' },
  { id: 11, title: 'Culture Day Fashion Show', category: 'Culture', color: 'from-pink-400 to-rose-500' },
  { id: 12, title: 'School Assembly Grounds', category: 'Campus', color: 'from-emerald-400 to-green-500' },
  { id: 13, title: 'Netball Tournament', category: 'Sports', color: 'from-violet-400 to-purple-500' },
  { id: 14, title: 'Science Fair Projects', category: 'Academics', color: 'from-blue-400 to-indigo-500' },
  { id: 15, title: 'Mbira Ensemble', category: 'Culture', color: 'from-amber-400 to-orange-500' },
  { id: 16, title: 'Boarding Hostel', category: 'Campus', color: 'from-teal-400 to-cyan-500' },
]

const galleryCategories = ['All', 'Campus', 'Events', 'Sports', 'Academics', 'Culture']

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 2000
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <span>{count.toLocaleString()}{suffix}</span>
}

// ─── Section: Home ───────────────────────────────────────────────────────────
function HomeSection() {
  const { schoolName } = useAppStore()
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div {...fadeIn} className="relative rounded-2xl overflow-hidden min-h-[420px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-10 right-20 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
        <div className="relative z-10 p-8 md:p-12 max-w-3xl">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <Badge className="bg-yellow-400/20 text-yellow-200 border-yellow-400/30 mb-4 hover:bg-yellow-400/30">
              <Sparkles className="h-3 w-3 mr-1" /> Established {schoolInfo.established}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
              {schoolName || schoolInfo.name}
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100/90 font-light italic mb-8">
              &ldquo;{schoolInfo.motto}&rdquo;
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-emerald-900 font-bold shadow-lg shadow-yellow-500/25 transition-all hover:scale-105">
                <GraduationCap className="h-5 w-5 mr-2" /> Enroll Now
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 transition-all hover:scale-105">
                Explore <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Stats overlay */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="hidden md:flex absolute bottom-6 right-6 gap-3">
          {[
            { label: 'Students', value: schoolInfo.enrollment, icon: Users, suffix: '' },
            { label: 'Teachers', value: schoolInfo.teachers, icon: BookOpen, suffix: '' },
            { label: 'Pass Rate', value: schoolInfo.passRate, icon: Trophy, suffix: '%' },
            { label: 'Active Clubs', value: schoolInfo.clubs, icon: Star, suffix: '' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-center border border-white/10 min-w-[100px]">
              <stat.icon className="h-5 w-5 text-yellow-300 mx-auto mb-1" />
              <div className="text-xl font-bold text-white"><AnimatedCounter target={stat.value} suffix={stat.suffix} /></div>
              <div className="text-[11px] text-emerald-200/80">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Mobile stats */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 md:hidden gap-3">
        {[
          { label: 'Students', value: schoolInfo.enrollment, icon: Users, suffix: '' },
          { label: 'Teachers', value: schoolInfo.teachers, icon: BookOpen, suffix: '' },
          { label: 'Pass Rate', value: schoolInfo.passRate, icon: Trophy, suffix: '%' },
          { label: 'Active Clubs', value: schoolInfo.clubs, icon: Star, suffix: '' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                  <stat.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300"><AnimatedCounter target={stat.value} suffix={stat.suffix} /></div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Academic Excellence', desc: 'ZIMSEC O-Level & A-Level programmes with dedicated faculty', icon: BookOpen, gradient: 'from-emerald-500 to-teal-600' },
          { title: 'Sports & Culture', desc: '24 clubs and 8 competitive sports codes for holistic development', icon: Trophy, gradient: 'from-amber-500 to-orange-600' },
          { title: 'Modern Facilities', desc: 'Science labs, computer lab, library, and sports fields', icon: Building, gradient: 'from-cyan-500 to-blue-600' },
          { title: 'Community Impact', desc: 'BEAM programme, outreach, and SDC partnerships', icon: Heart, gradient: 'from-rose-500 to-pink-600' },
        ].map((item) => (
          <motion.div key={item.title} variants={staggerItem}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden h-full">
              <CardContent className="p-0">
                <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
                <div className="p-5">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Upcoming Events Preview */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upcoming Events</h2>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800">
            <Calendar className="h-3 w-3 mr-1" /> {events.length} Events
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.slice(0, 3).map((event) => (
            <Card key={event.id} className="border-0 shadow-md hover:shadow-lg transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className={`h-1.5 ${event.color}`} />
                <div className="p-4 flex gap-3">
                  <div className="shrink-0 text-center bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-2 min-w-[56px]">
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{new Date(event.date).getDate()}</div>
                    <div className="text-[10px] uppercase text-emerald-600/70 dark:text-emerald-400/70">{new Date(event.date).toLocaleString('en', { month: 'short' })}</div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" /> {event.time}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" /> {event.location}
                    </div>
                    <Badge variant="secondary" className="mt-2 text-[10px]">{event.type}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* MoPSE & ZIMSEC Badges */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { label: 'Registered with MoPSE', sub: schoolInfo.registration, icon: Landmark },
                { label: 'ZIMSEC Centre', sub: 'Centre No: ZM/HRE/0142', icon: FileText },
                { label: 'BEAM Beneficiary School', sub: '180 students supported', icon: Shield },
                { label: 'Green School Initiative', sub: 'Eco-club active since 2018', icon: Leaf },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── Section: About ──────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <div className="space-y-8">
      {/* History */}
      <motion.div {...fadeIn}>
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 md:p-8 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <h2 className="text-2xl md:text-3xl font-bold text-white relative z-10">Our History</h2>
            <p className="text-emerald-100/80 mt-1 relative z-10">Since {schoolInfo.established}</p>
          </div>
          <CardContent className="p-6 md:p-8">
            <p className="text-muted-foreground leading-relaxed">
              Founded in {schoolInfo.established}, <strong>{schoolInfo.name}</strong> has been a beacon of educational excellence in the Mufakose suburb of Harare for nearly four decades. Established under the Ministry of Primary and Secondary Education (MoPSE), the school has grown from a modest institution serving the local community to one of Harare&apos;s most respected government secondary schools.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Over the years, Mufakose High has produced thousands of graduates who have gone on to excel in various fields including medicine, engineering, law, education, and business. The school takes pride in its consistent ZIMSEC O-Level and A-Level results, which regularly exceed the national average.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mission, Vision, Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Our Mission', content: 'To provide quality, inclusive, and comprehensive education that develops learners intellectually, physically, morally, and socially, enabling them to become productive citizens of Zimbabwe.', icon: Target, gradient: 'from-emerald-500 to-teal-600' },
          { title: 'Our Vision', content: 'To be a leading centre of academic excellence, nurturing globally competitive learners rooted in Zimbabwean values and equipped for 21st-century challenges.', icon: Eye, gradient: 'from-teal-500 to-cyan-600' },
          { title: 'Our Values', content: 'Integrity, Diligence, Respect, Excellence, Innovation, Ubuntu/Hunhu, Inclusivity, Accountability, Environmental Stewardship, Community Service.', icon: Heart, gradient: 'from-cyan-500 to-blue-600' },
        ].map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all h-full group">
              <CardContent className="p-6">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Leadership Team */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <h2 className="text-xl font-bold mb-4">School Leadership</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.filter(s => s.department === 'Administration').map((leader) => (
            <Card key={leader.id} className="border-0 shadow-md hover:shadow-lg transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className={`h-24 bg-gradient-to-r ${leader.color} relative flex items-end`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10 p-4 w-full">
                    <div className="flex items-end gap-3">
                      <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {leader.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 pb-1">
                        <h4 className="text-white font-semibold text-sm truncate">{leader.name}</h4>
                        <p className="text-white/70 text-xs">{leader.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Award className="h-3 w-3" /> {leader.qualification}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Since {leader.since}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Facilities */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <h2 className="text-xl font-bold mb-4">Our Facilities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Science Labs', count: 3, icon: BookOpen, color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
            { name: 'Computer Lab', count: 1, icon: Monitor, color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' },
            { name: 'Library', count: 1, icon: BookOpen, color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
            { name: 'Sports Fields', count: 3, icon: Trophy, color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
            { name: 'Classrooms', count: 32, icon: Building, color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
            { name: 'Hostels', count: 2, icon: Users, color: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400' },
            { name: 'Assembly Hall', count: 1, icon: UsersRound, color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
            { name: 'Staff Houses', count: 8, icon: Building, color: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' },
          ].map((facility) => (
            <Card key={facility.name} className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className={`h-10 w-10 rounded-lg ${facility.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  <facility.icon className="h-5 w-5" />
                </div>
                <div className="text-lg font-bold">{facility.count}</div>
                <div className="text-xs text-muted-foreground">{facility.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Section: Events ─────────────────────────────────────────────────────────
function EventsSection() {
  const [filter, setFilter] = useState('All')
  const types = ['All', ...Array.from(new Set(events.map(e => e.type)))]
  const filtered = filter === 'All' ? events : events.filter(e => e.type === filter)

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {types.map((type) => (
            <Button key={type} size="sm" variant={filter === type ? 'default' : 'outline'} onClick={() => setFilter(type)}
              className={filter === type ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:border-emerald-300 dark:hover:border-emerald-700'}>
              {type}
            </Button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((event) => (
          <motion.div key={event.id} variants={staggerItem}>
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
              <div className={`relative h-32 bg-gradient-to-br ${event.color} to-transparent`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-3 left-3 bg-white/95 dark:bg-gray-900/95 rounded-lg p-2 text-center shadow-lg min-w-[52px]">
                  <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{new Date(event.date).getDate()}</div>
                  <div className="text-[10px] uppercase font-semibold text-emerald-600/80 dark:text-emerald-400/80">{new Date(event.date).toLocaleString('en', { month: 'short' })}</div>
                  <div className="text-[9px] text-muted-foreground">{new Date(event.date).getFullYear()}</div>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/90 dark:bg-gray-900/90 text-foreground shadow">{event.type}</Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Section: News ───────────────────────────────────────────────────────────
function NewsSection() {
  const [categoryFilter, setCategoryFilter] = useState('All')
  const categories = ['All', ...Array.from(new Set(news.map(n => n.category)))]
  const filtered = categoryFilter === 'All' ? news : news.filter(n => n.category === categoryFilter)
  const featured = news.find(n => n.featured)
  const [selectedArticle, setSelectedArticle] = useState<typeof news[0] | null>(null)

  // Inline detail view
  if (selectedArticle) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedArticle(null)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back to News</Button>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2">{selectedArticle.category}</Badge>
              <CardTitle className="text-xl">{selectedArticle.title}</CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3" /> {new Date(selectedArticle.date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedArticle.excerpt}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">This development marks another milestone in the school&apos;s ongoing commitment to providing quality education under the Ministry of Primary and Secondary Education framework. The school continues to work closely with MoPSE, ZIMSEC, and the local community to ensure all learners have access to the resources they need to succeed.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">For more information, please contact the school administration office at {schoolInfo.phone} or email {schoolInfo.email}.</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button key={cat} size="sm" variant={categoryFilter === cat ? 'default' : 'outline'}
            onClick={() => setCategoryFilter(cat)}
            className={categoryFilter === cat ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
            {cat}
          </Button>
        ))}
      </div>

      {/* Featured Article */}
      {featured && categoryFilter === 'All' && (
        <motion.div {...fadeIn}>
          <Card className="border-0 shadow-lg overflow-hidden group cursor-pointer" onClick={() => setSelectedArticle(featured)}>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="h-48 md:h-auto bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 relative">
                <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="h-20 w-20 text-white/20" /></div>
                <Badge className="absolute top-3 left-3 bg-yellow-400 text-emerald-900 font-bold"><Star className="h-3 w-3 mr-1" /> Featured</Badge>
              </div>
              <CardContent className="p-6 flex flex-col justify-center">
                <Badge variant="secondary" className="w-fit mb-3">{featured.category}</Badge>
                <h2 className="text-xl font-bold mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{featured.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{featured.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(featured.date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700">Read More <ArrowRight className="h-3 w-3 ml-1" /></Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      )}

      {/* News Grid */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(categoryFilter === 'All' ? news.filter(n => !n.featured) : filtered).map((article) => (
          <motion.div key={article.id} variants={staggerItem}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all group overflow-hidden cursor-pointer h-full flex flex-col" onClick={() => setSelectedArticle(article)}>
              <div className={`h-36 bg-gradient-to-br ${article.image === 'academic' ? 'from-blue-400 to-indigo-500' : article.image === 'sports' ? 'from-amber-400 to-orange-500' : article.image === 'campus' ? 'from-emerald-400 to-teal-500' : article.image === 'culture' ? 'from-rose-400 to-pink-500' : 'from-purple-400 to-violet-500'} relative`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-3 left-3"><Badge variant="secondary" className="bg-white/90 dark:bg-gray-900/90 shadow text-xs">{article.category}</Badge></div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">{article.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{article.excerpt}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-[11px] text-muted-foreground">{new Date(article.date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">Read <ChevronRight className="h-3 w-3" /></span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Section: Staff ──────────────────────────────────────────────────────────
function StaffSection() {
  const [deptFilter, setDeptFilter] = useState('All')
  const departments = ['All', ...Array.from(new Set(staffMembers.map(s => s.department)))]
  const filtered = deptFilter === 'All' ? staffMembers : staffMembers.filter(s => s.department === deptFilter)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {departments.map((dept) => (
          <Button key={dept} size="sm" variant={deptFilter === dept ? 'default' : 'outline'}
            onClick={() => setDeptFilter(dept)}
            className={deptFilter === dept ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
            {dept}
          </Button>
        ))}
      </div>

      {/* Staff Grid */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((staff) => (
          <motion.div key={staff.id} variants={staggerItem}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className={`h-28 bg-gradient-to-r ${staff.color} relative`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute -bottom-6 left-4">
                    <div className="h-14 w-14 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-lg font-bold border-2 border-white dark:border-gray-700" style={{ color: 'var(--foreground)' }}>
                      {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 dark:bg-gray-900/90 text-foreground text-[10px] shadow">{staff.department}</Badge>
                  </div>
                </div>
                <div className="p-4 pt-8">
                  <h4 className="font-semibold text-sm">{staff.name}</h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{staff.role}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Award className="h-3 w-3 shrink-0" />
                    <span className="truncate">{staff.qualification}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {staff.subjects.map((sub) => (
                      <Badge key={sub} variant="secondary" className="text-[10px]">{sub}</Badge>
                    ))}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Since {staff.since}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Section: Gallery ────────────────────────────────────────────────────────
function GallerySection() {
  const [catFilter, setCatFilter] = useState('All')
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null)
  const filtered = catFilter === 'All' ? galleryImages : galleryImages.filter(g => g.category === catFilter)

  // Inline detail view
  if (selectedImage) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedImage(null)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back to Gallery</Button>
        </div>
        <div className="max-w-3xl mx-auto">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`h-80 md:h-96 bg-gradient-to-br ${selectedImage.color} relative flex items-center justify-center`}>
              <div className="text-center text-white"><Camera className="h-16 w-16 mx-auto mb-4 opacity-40" /><p className="text-lg font-semibold">{selectedImage.title}</p><Badge variant="secondary" className="bg-white/20 text-white border-white/30 mt-2">{selectedImage.category}</Badge></div>
            </div>
          </Card>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {galleryCategories.map((cat) => (
          <Button key={cat} size="sm" variant={catFilter === cat ? 'default' : 'outline'}
            onClick={() => setCatFilter(cat)}
            className={catFilter === cat ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
            {cat === 'All' ? 'All Photos' : cat}
          </Button>
        ))}
      </div>

      {/* Gallery Grid - Masonry-like */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3">
        {filtered.map((image, i) => (
          <motion.div key={image.id} variants={staggerItem} className="break-inside-avoid">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all group cursor-pointer overflow-hidden p-0" onClick={() => setSelectedImage(image)}>
              <div className={`relative ${i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-56'} bg-gradient-to-br ${image.color} overflow-hidden`}>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity"><div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><Camera className="h-5 w-5 text-white" /></div></div>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-xs font-medium">{image.title}</p>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-[10px] mt-1">{image.category}</Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Section: Contact ────────────────────────────────────────────────────────
function ContactSection() {
  const [sent, setSent] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Form */}
        <motion.div {...fadeIn}>
          <Card className="border-0 shadow-md h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" /> Send us a Message
              </CardTitle>
              <CardDescription>Fill in the form and we&apos;ll get back to you within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground">Thank you for contacting us. We will respond shortly.</p>
                  <Button className="mt-4" variant="outline" onClick={() => setSent(false)}>Send Another</Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">First Name</label>
                      <Input placeholder="Tendai" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Last Name</label>
                      <Input placeholder="Moyo" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Email</label>
                    <Input type="email" placeholder="tendai@example.com" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Phone</label>
                    <Input placeholder="+263 77 123 4567" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Subject</label>
                    <Input placeholder="Admission Inquiry" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Message</label>
                    <Textarea placeholder="Write your message here..." rows={4} />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setSent(true)}>
                    <Send className="h-4 w-4 mr-2" /> Send Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Info */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Get in Touch</h3>
              <div className="space-y-4">
                {[
                  { icon: MapPin, label: 'Address', value: schoolInfo.address },
                  { icon: Phone, label: 'Phone', value: schoolInfo.phone },
                  { icon: Mail, label: 'Email', value: schoolInfo.email },
                  { icon: Globe, label: 'Website', value: schoolInfo.website },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 relative flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Mufakose, Harare</p>
                <p className="text-xs text-muted-foreground">Zimbabwe</p>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-white/80 dark:bg-gray-900/80 text-[10px]">
                  <ExternalLink className="h-3 w-3 mr-1" /> Open in Maps
                </Badge>
              </div>
            </div>
          </Card>

          {/* Social Links */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-3">Follow Us</h4>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-100 dark:hover:bg-blue-900/30' },
                  { icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-100 dark:hover:bg-sky-900/30' },
                  { icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-100 dark:hover:bg-pink-900/30' },
                  { icon: Youtube, label: 'YouTube', color: 'hover:bg-red-100 dark:hover:bg-red-900/30' },
                ].map((social) => (
                  <Button key={social.label} variant="outline" size="icon" className={`h-10 w-10 ${social.color}`}>
                    <social.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Office Hours */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-3">Office Hours</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Monday - Friday</span><span className="font-medium">07:30 - 16:30</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Saturday</span><span className="font-medium">08:00 - 12:00</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sunday & Holidays</span><span className="font-medium text-red-500">Closed</span></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Section: Admissions ─────────────────────────────────────────────────────
function AdmissionsSection() {
  return (
    <div className="space-y-8">
      {/* Admissions Banner */}
      <motion.div {...fadeIn}>
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 md:p-8 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="relative z-10">
              <Badge className="bg-yellow-400/20 text-yellow-200 border-yellow-400/30 mb-3">Now Accepting Applications for 2026</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Join Our School Family</h2>
              <p className="text-emerald-100/80 max-w-2xl">Begin your academic journey at {schoolInfo.name}. We welcome students from all backgrounds and are committed to providing quality education under the MoPSE framework.</p>
              <div className="flex gap-3 mt-4">
                <Button className="bg-yellow-500 hover:bg-yellow-400 text-emerald-900 font-bold shadow-lg">
                  <GraduationCap className="h-4 w-4 mr-2" /> Apply Now
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Download Application Form <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Admission Process */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <h2 className="text-xl font-bold mb-4">Admission Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: 1, title: 'Inquire', desc: 'Visit the school or call to learn about available spaces and requirements.', icon: Phone },
            { step: 2, title: 'Apply', desc: 'Complete the application form and submit with required documents.', icon: FileText },
            { step: 3, title: 'Assessment', desc: 'Students sit for an entrance assessment and interview.', icon: BookOpen },
            { step: 4, title: 'Enroll', desc: 'Upon acceptance, complete registration and pay required fees.', icon: CheckCircle2 },
          ].map((item) => (
            <Card key={item.step} className="border-0 shadow-md hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 text-6xl font-extrabold text-emerald-50 dark:text-emerald-950/30 leading-none select-none">{item.step}</div>
              <CardContent className="p-5 relative z-10">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Requirements & Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-md h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" /> Admission Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Completed application form (available at school office)',
                  'Certified copy of birth certificate',
                  'Latest school report card / transcript',
                  '2 passport-size photographs',
                  'Immunisation record / health card',
                  'Transfer letter from previous school',
                  'Parent/guardian ID copy',
                  'Proof of residence (utility bill or affidavit)',
                  'BEAM application letter (if applicable)',
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-md h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" /> Fee Structure (2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { item: 'Form 1-4 Tuition (Per Term)', amount: '$450.00' },
                  { item: 'Form 5-6 Tuition (Per Term)', amount: '$550.00' },
                  { item: 'Boarding Fees (Per Term)', amount: '$350.00' },
                  { item: 'ZIMSEC Registration (O-Level)', amount: '$85.00' },
                  { item: 'ZIMSEC Registration (A-Level)', amount: '$120.00' },
                  { item: 'Development Levy (Annual)', amount: '$200.00' },
                  { item: 'Computer Lab Fee (Per Term)', amount: '$50.00' },
                  { item: 'Sports & Culture Fee (Per Term)', amount: '$30.00' },
                ].map((fee, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{fee.item}</span>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{fee.amount}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 text-sm">
                  <HandHeart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium">BEAM Programme</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Eligible families can apply for the Basic Education Assistance Module (BEAM) which covers tuition and exam fees for vulnerable students.</p>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Fees may be paid in USD, ZiG, or a combination. Payment plans are available upon request. Contact the bursar&apos;s office for details.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* FAQ */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'What is the admission age for Form 1?', a: 'Students should be at least 12 years old by January of the admission year and have completed Grade 7.' },
            { q: 'Is boarding available?', a: 'Yes, we have two hostels (boys and girls) with limited spaces. Apply early as boarding places fill up quickly.' },
            { q: 'How do I apply for BEAM?', a: 'BEAM applications are processed through the school office. Visit the bursar with proof of need and the required documentation.' },
            { q: 'Can I pay fees in installments?', a: 'Yes, the school offers payment plans. Please discuss with the bursar\'s office to arrange a suitable schedule.' },
          ].map((faq, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-start gap-2">
                  <Quote className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> {faq.q}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed ml-6">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Section: Settings ────────────────────────────────────────────────────────
function SettingsSection() {
  const [themeSettings, setThemeSettings] = useState({ primaryColor: '#059669', secondaryColor: '#0d9488', fontFamily: 'INTER', borderRadius: 'ROUNDED', layout: 'STANDARD' })
  const [homepageSettings, setHomepageSettings] = useState({ bannerEnabled: true, showNewsTicker: true, eventCount: '3', showStats: true, showQuickLinks: true })
  const [analyticsSettings, setAnalyticsSettings] = useState({ googleAnalytics: '', facebookPixel: '', enableTracking: true, anonymizeIp: true })
  const [socialSettings, setSocialSettings] = useState({ facebook: 'https://facebook.com/mufakosehigh', twitter: 'https://twitter.com/mufakosehigh', instagram: 'https://instagram.com/mufakosehigh', youtube: 'https://youtube.com/@mufakosehigh', showSocialLinks: true })

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-5 w-5 text-gray-500" />Website Settings</h2><p className="text-sm text-muted-foreground mt-1">Configure theme, homepage layout, analytics, and social media</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4 text-emerald-600" />Theme Settings</CardTitle><CardDescription>Customize website appearance and colors</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label className="text-xs">Primary Color</Label><div className="flex gap-2"><Input value={themeSettings.primaryColor} onChange={e => setThemeSettings(s => ({ ...s, primaryColor: e.target.value }))} /><div className="h-9 w-9 rounded-md border" style={{ backgroundColor: themeSettings.primaryColor }} /></div></div><div className="grid gap-2"><Label className="text-xs">Secondary Color</Label><div className="flex gap-2"><Input value={themeSettings.secondaryColor} onChange={e => setThemeSettings(s => ({ ...s, secondaryColor: e.target.value }))} /><div className="h-9 w-9 rounded-md border" style={{ backgroundColor: themeSettings.secondaryColor }} /></div></div></div>
            <div className="grid gap-2"><Label className="text-xs">Font Family</Label><select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={themeSettings.fontFamily} onChange={e => setThemeSettings(s => ({ ...s, fontFamily: e.target.value }))}><option value="INTER">Inter (Modern)</option><option value="ROBOTO">Roboto (Clean)</option><option value="OPENSANS">Open Sans (Friendly)</option></select></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Building className="h-4 w-4 text-teal-600" />Homepage Layout</CardTitle><CardDescription>Control what appears on the homepage</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><Label className="text-xs">Hero Banner</Label><p className="text-[10px] text-muted-foreground">Show hero section with CTA</p></div><Switch checked={homepageSettings.bannerEnabled} onCheckedChange={v => setHomepageSettings(s => ({ ...s, bannerEnabled: v }))} /></div>
            <div className="flex items-center justify-between"><div><Label className="text-xs">News Ticker</Label><p className="text-[10px] text-muted-foreground">Scrolling news headlines</p></div><Switch checked={homepageSettings.showNewsTicker} onCheckedChange={v => setHomepageSettings(s => ({ ...s, showNewsTicker: v }))} /></div>
            <div className="flex items-center justify-between"><div><Label className="text-xs">School Statistics</Label><p className="text-[10px] text-muted-foreground">Show enrollment, pass rate stats</p></div><Switch checked={homepageSettings.showStats} onCheckedChange={v => setHomepageSettings(s => ({ ...s, showStats: v }))} /></div>
            <div className="grid gap-2"><Label className="text-xs">Events to Display</Label><Input type="number" min="1" max="6" value={homepageSettings.eventCount} onChange={e => setHomepageSettings(s => ({ ...s, eventCount: e.target.value }))} /></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-600" />Analytics Integration</CardTitle><CardDescription>Connect tracking and analytics</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label className="text-xs">Google Analytics ID</Label><Input placeholder="G-XXXXXXXXXX" value={analyticsSettings.googleAnalytics} onChange={e => setAnalyticsSettings(s => ({ ...s, googleAnalytics: e.target.value }))} /></div>
            <div className="grid gap-2"><Label className="text-xs">Facebook Pixel ID</Label><Input placeholder="Pixel ID" value={analyticsSettings.facebookPixel} onChange={e => setAnalyticsSettings(s => ({ ...s, facebookPixel: e.target.value }))} /></div>
            <div className="flex items-center justify-between"><div><Label className="text-xs">Enable Tracking</Label><p className="text-[10px] text-muted-foreground">Collect visitor analytics</p></div><Switch checked={analyticsSettings.enableTracking} onCheckedChange={v => setAnalyticsSettings(s => ({ ...s, enableTracking: v }))} /></div>
            <div className="flex items-center justify-between"><div><Label className="text-xs">Anonymize IP</Label><p className="text-[10px] text-muted-foreground">Privacy-compliant tracking</p></div><Switch checked={analyticsSettings.anonymizeIp} onCheckedChange={v => setAnalyticsSettings(s => ({ ...s, anonymizeIp: v }))} /></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Share2 className="h-4 w-4 text-violet-600" />Social Media Links</CardTitle><CardDescription>Connect your social profiles</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label className="text-xs">Facebook</Label><Input value={socialSettings.facebook} onChange={e => setSocialSettings(s => ({ ...s, facebook: e.target.value }))} placeholder="https://facebook.com/..." /></div>
            <div className="grid gap-2"><Label className="text-xs">Twitter / X</Label><Input value={socialSettings.twitter} onChange={e => setSocialSettings(s => ({ ...s, twitter: e.target.value }))} placeholder="https://twitter.com/..." /></div>
            <div className="grid gap-2"><Label className="text-xs">Instagram</Label><Input value={socialSettings.instagram} onChange={e => setSocialSettings(s => ({ ...s, instagram: e.target.value }))} placeholder="https://instagram.com/..." /></div>
            <div className="grid gap-2"><Label className="text-xs">YouTube</Label><Input value={socialSettings.youtube} onChange={e => setSocialSettings(s => ({ ...s, youtube: e.target.value }))} placeholder="https://youtube.com/..." /></div>
            <div className="flex items-center justify-between"><div><Label className="text-xs">Show Social Links</Label><p className="text-[10px] text-muted-foreground">Display on website footer</p></div><Switch checked={socialSettings.showSocialLinks} onCheckedChange={v => setSocialSettings(s => ({ ...s, showSocialLinks: v }))} /></div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end"><Button onClick={() => toast.success('Website settings saved successfully')} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Save className="h-4 w-4 mr-2" />Save Settings</Button></div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WebsiteCMSModule() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
      {/* School Header Banner */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 md:p-5 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-7 w-7 md:h-8 md:w-8 text-yellow-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-white truncate">Website CMS</h1>
              <p className="text-emerald-200/80 text-xs md:text-sm">Manage your public school website content</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1">
            {[
              { value: 'home', label: 'Home', icon: Building },
              { value: 'about', label: 'About', icon: Landmark },
              { value: 'events', label: 'Events', icon: Calendar },
              { value: 'news', label: 'News', icon: BookOpen },
              { value: 'staff', label: 'Staff', icon: Users },
              { value: 'gallery', label: 'Gallery', icon: Camera },
              { value: 'contact', label: 'Contact', icon: Mail },
              { value: 'admissions', label: 'Admissions', icon: GraduationCap },
              { value: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="home" className="mt-6"><HomeSection /></TabsContent>
        <TabsContent value="about" className="mt-6"><AboutSection /></TabsContent>
        <TabsContent value="events" className="mt-6"><EventsSection /></TabsContent>
        <TabsContent value="news" className="mt-6"><NewsSection /></TabsContent>
        <TabsContent value="staff" className="mt-6"><StaffSection /></TabsContent>
        <TabsContent value="gallery" className="mt-6"><GallerySection /></TabsContent>
        <TabsContent value="contact" className="mt-6"><ContactSection /></TabsContent>
        <TabsContent value="admissions" className="mt-6"><AdmissionsSection /></TabsContent>
        <TabsContent value="settings" className="mt-6"><SettingsSection /></TabsContent>
      </Tabs>
    </motion.div>
  )
}
