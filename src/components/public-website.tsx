'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  School, GraduationCap, Users, BookOpen, Trophy, Calendar, MapPin,
  Clock, Mail, Phone, Globe, Star, ArrowRight, ChevronRight,
  Target, Eye, Heart, Award, UsersRound, FileText, DollarSign,
  Sparkles, Landmark, Shield, Leaf, HandHeart, ChevronDown,
  Facebook, Twitter, Instagram, Youtube, Send, CheckCircle2,
  Menu, X, Zap, Lock, EyeOff, AlertCircle, Building,
  ClipboardCheck, BarChart3, Monitor, Bus, BedDouble, Library,
  Package, Coffee, Scale, HeartPulse, MessageSquare, Settings,
  Quote, Camera, Play, ChevronUp, ExternalLink, PhoneCall,
  Clock4, GraduationCapIcon, UserCheck, ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

// ─── Props ────────────────────────────────────────────────────────────────────
interface PublicWebsiteProps {
  onLogin: () => void
}

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 },
}

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 },
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
]

const galleryCategories = ['All', 'Campus', 'Events', 'Sports', 'Academics', 'Culture']

const testimonials = [
  { id: 1, name: 'Tendai Moyo', role: 'Form 6 Student, 2024', quote: 'Mufakose High has shaped me into a confident learner. The teachers go above and beyond, and the science labs are world-class. I\'m proud to be a student here.', avatar: 'TM', color: 'from-emerald-500 to-teal-600' },
  { id: 2, name: 'Mrs. Chipo Ndlovu', role: 'Parent', quote: 'As a parent, I\'m impressed by the dedication of the staff. My daughter\'s academic performance improved dramatically since joining Form 3. The BEAM programme has been a blessing.', avatar: 'CN', color: 'from-amber-500 to-orange-600' },
  { id: 3, name: 'Mr. Kudzai Banda', role: 'Alumni, Class of 2010', quote: 'The foundation I received at Mufakose High prepared me for university and beyond. The values of diligence and excellence still guide me today as an engineer.', avatar: 'KB', color: 'from-cyan-500 to-blue-600' },
  { id: 4, name: 'Rumbidzai Dube', role: 'Form 4 Student, 2024', quote: 'The extracurricular activities are amazing! From debate club to athletics, there\'s something for everyone. I\'ve discovered talents I never knew I had.', avatar: 'RD', color: 'from-rose-500 to-pink-600' },
  { id: 5, name: 'Mr. Aaron Chikuni', role: 'School Bursar', quote: 'Our financial systems ensure every ZiG and USD is accounted for. We believe transparency builds trust with parents and the community.', avatar: 'AC', color: 'from-purple-500 to-violet-600' },
  { id: 6, name: 'Mrs. Sithembile Ncube', role: 'Guidance Counsellor', quote: 'Every child matters at Mufakose High. Our guidance programme ensures no student falls through the cracks. We nurture minds and hearts.', avatar: 'SN', color: 'from-teal-500 to-emerald-600' },
]

const oLevelSubjects = [
  'English Language', 'Shona', 'Mathematics', 'Biology', 'Chemistry',
  'Physics', 'History', 'Geography', 'Literature in English',
  'Computer Science', 'Accounts', 'Business Studies', 'Economics',
  'Technical Graphics', 'Food & Nutrition', 'Fashion & Fabrics',
  'Art', 'Music', 'Physical Education',
]

const aLevelSubjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Accounting',
  'Business Studies', 'Economics', 'History', 'Geography',
  'Literature in English', 'Computer Science', 'Divinity',
  'Sociology', 'Psychology',
]

const admissionSteps = [
  { step: 1, title: 'Obtain Application Form', description: 'Download from our website or collect from the school admin office during working hours.', icon: ClipboardList },
  { step: 2, title: 'Submit Documents', description: 'Submit completed form with birth certificate, previous school reports, and passport photos.', icon: FileText },
  { step: 3, title: 'Entrance Assessment', description: 'Applicants sit for an entrance assessment in English and Mathematics.', icon: BookOpen },
  { step: 4, title: 'Interview', description: 'Shortlisted candidates and their parents/guardians attend an interview with the headmaster.', icon: Users },
  { step: 5, title: 'Acceptance & Enrollment', description: 'Successful candidates receive an offer letter. Complete registration by paying required fees.', icon: CheckCircle2 },
]

const whyChooseUs = [
  { title: 'ZIMSEC Excellence', description: 'Consistently above-national-average pass rates at O-Level and A-Level, with dedicated exam preparation.', icon: Award, gradient: 'from-emerald-500 to-teal-600' },
  { title: 'Qualified Faculty', description: '68 dedicated teachers with degrees from UZ, NUST, MSU, and international universities.', icon: GraduationCap, gradient: 'from-amber-500 to-orange-600' },
  { title: 'Modern Facilities', description: 'Science labs, computer lab, library with 8,000+ volumes, and sports fields for holistic development.', icon: Building, gradient: 'from-cyan-500 to-blue-600' },
  { title: 'BEAM Programme', description: 'Supporting 180 vulnerable students through the Basic Education Assistance Module, ensuring no one is left behind.', icon: HandHeart, gradient: 'from-rose-500 to-pink-600' },
  { title: 'Holistic Development', description: '24 active clubs, 8 competitive sports codes, and rich cultural programmes for all-round student growth.', icon: Trophy, gradient: 'from-purple-500 to-violet-600' },
  { title: 'Community Impact', description: 'Strong SDC partnerships, outreach programmes, and environmental stewardship initiatives.', icon: Leaf, gradient: 'from-green-500 to-emerald-600' },
]

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Academics', href: '#academics' },
  { label: 'Admissions', href: '#admissions' },
  { label: 'News', href: '#news' },
  { label: 'Events', href: '#events' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
]

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, inView])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Section Wrapper with InView ─────────────────────────────────────────────
function Section({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ─── Login Dialog ────────────────────────────────────────────────────────────
function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('admin@zimschool.co.zw')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [shakeForm, setShakeForm] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError('')

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setShakeForm(true)
        setTimeout(() => setShakeForm(false), 600)
        setLoginError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error)
        toast.error('Sign in failed', { description: result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error })
      } else {
        toast.success('Welcome back!', { description: 'Successfully signed in to ZimSchool Pro' })
        try { await getSession() } catch {}
        router.push('/')
        setTimeout(() => { window.location.reload() }, 300)
      }
    } catch {
      setShakeForm(true)
      setTimeout(() => setShakeForm(false), 600)
      setLoginError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <School className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Staff Login</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Sign in to ZimSchool Pro
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleLogin} className={`space-y-4 ${shakeForm ? 'animate-shake' : ''}`}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email or Username</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="login-email" type="email" placeholder="admin@zimschool.co.zw" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-11" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600 transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" defaultChecked />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</Label>
          </div>
          <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-200/50 transition-all" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </div>
            ) : (
              <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Sign In</div>
            )}
          </Button>
          {loginError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{loginError}</p>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Demo Credentials</p>
            <div className="space-y-1">
              {[
                { email: 'admin@zimschool.co.zw', role: 'Administrator', icon: Shield, color: 'text-emerald-600' },
                { email: 'teacher@zimschool.co.zw', role: 'Teacher', icon: UserCheck, color: 'text-teal-600' },
                { email: 'bursar@zimschool.co.zw', role: 'Bursar', icon: DollarSign, color: 'text-amber-600' },
              ].map((cred) => (
                <div key={cred.role} className="flex items-center gap-2 text-xs">
                  <cred.icon className={`h-3 w-3 ${cred.color}`} />
                  <span className="font-medium">{cred.role}:</span>
                  <code className="text-muted-foreground font-mono">{cred.email}</code>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground mt-1">Password: password123</p>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ onLogin }: { onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-emerald-100/50 dark:border-emerald-900/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md transition-transform hover:scale-105`}>
              <School className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-base md:text-lg leading-tight ${scrolled ? 'text-foreground' : 'text-white'}`}>
                {schoolInfo.name}
              </h1>
              <p className={`text-[10px] ${scrolled ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-200'}`}>
                {schoolInfo.motto}
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/50 ${
                  scrolled ? 'text-foreground hover:text-emerald-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Staff Login Button */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              onClick={onLogin}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-200/50 transition-all hover:scale-105"
            >
              <Lock className="h-4 w-4 mr-2" /> Staff Login
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled ? 'text-foreground hover:bg-emerald-50' : 'text-white hover:bg-white/10'
            }`}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white dark:bg-gray-900 border-t border-emerald-100 dark:border-emerald-900/50 shadow-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <Separator className="my-2" />
              <Button
                onClick={() => { setMobileOpen(false); onLogin() }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
              >
                <Lock className="h-4 w-4 mr-2" /> Staff Login
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function HeroSection({ onLogin }: { onLogin: () => void }) {
  const { schoolName } = useAppStore()

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-teal-900 to-emerald-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
      <div className="absolute top-20 right-40 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-20 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl" />

      {/* Floating elements */}
      <div className="absolute top-1/4 right-1/4 h-4 w-4 rounded-full bg-yellow-400/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
      <div className="absolute top-1/3 right-1/3 h-3 w-3 rounded-full bg-emerald-300/20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      <div className="absolute bottom-1/3 left-1/3 h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Badge className="bg-yellow-400/20 text-yellow-200 border-yellow-400/30 mb-6 hover:bg-yellow-400/30 text-sm px-4 py-1.5">
              <Sparkles className="h-4 w-4 mr-2" /> Established {schoolInfo.established} &bull; MoPSE Registered
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1]">
              {schoolName || schoolInfo.name}
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100/90 font-light italic mb-4">
              &ldquo;{schoolInfo.motto}&rdquo;
            </p>
            <p className="text-base md:text-lg text-emerald-200/70 mb-8 max-w-xl leading-relaxed">
              A leading centre of academic excellence in Harare, offering quality ZIMSEC O-Level and A-Level education rooted in Zimbabwean values.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-emerald-900 font-bold shadow-lg shadow-yellow-500/25 transition-all hover:scale-105 text-base px-8">
                <GraduationCap className="h-5 w-5 mr-2" /> Enroll Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 transition-all hover:scale-105 text-base px-8"
                onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Students', value: schoolInfo.enrollment, icon: Users, suffix: '', gradient: 'from-emerald-500/20 to-teal-500/20' },
                { label: 'Teachers', value: schoolInfo.teachers, icon: BookOpen, suffix: '', gradient: 'from-teal-500/20 to-cyan-500/20' },
                { label: 'Pass Rate', value: schoolInfo.passRate, icon: Trophy, suffix: '%', gradient: 'from-amber-500/20 to-yellow-500/20' },
                { label: 'Active Clubs', value: schoolInfo.clubs, icon: Star, suffix: '', gradient: 'from-rose-500/20 to-pink-500/20' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
                  className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/15 transition-all hover:scale-105`}
                >
                  <stat.icon className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-emerald-200/80 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile Stats */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12 lg:hidden"
        >
          {[
            { label: 'Students', value: schoolInfo.enrollment, icon: Users, suffix: '' },
            { label: 'Teachers', value: schoolInfo.teachers, icon: BookOpen, suffix: '' },
            { label: 'Pass Rate', value: schoolInfo.passRate, icon: Trophy, suffix: '%' },
            { label: 'Active Clubs', value: schoolInfo.clubs, icon: Star, suffix: '' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-md border-white/10">
                <CardContent className="p-4 text-center">
                  <stat.icon className="h-5 w-5 text-yellow-300 mx-auto mb-1" />
                  <div className="text-xl font-bold text-white"><AnimatedCounter target={stat.value} suffix={stat.suffix} /></div>
                  <div className="text-xs text-emerald-200/80">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Zimbabwe flag stripe */}
        <div className="mt-12 flex justify-center">
          <div className="flex h-1.5 w-48 overflow-hidden rounded-full">
            <div className="flex-1 bg-green-500" />
            <div className="flex-1 bg-yellow-400" />
            <div className="flex-1 bg-red-500" />
            <div className="flex-1 bg-black" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── About Section ───────────────────────────────────────────────────────────
function AboutSectionComponent() {
  return (
    <Section id="about" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <School className="h-3 w-3 mr-1" /> About Us
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Discover Our <span className="text-emerald-600">Legacy</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Nearly four decades of educational excellence in the heart of Mufakose, Harare
          </p>
        </motion.div>

        {/* History Card */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="mb-16">
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 md:p-10 relative">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
              <div className="relative z-10">
                <Badge className="bg-yellow-400/20 text-yellow-200 border-yellow-400/30 mb-3">
                  <Sparkles className="h-3 w-3 mr-1" /> Since {schoolInfo.established}
                </Badge>
                <h3 className="text-3xl md:text-4xl font-bold text-white">Our History</h3>
              </div>
            </div>
            <CardContent className="p-8 md:p-10">
              <p className="text-muted-foreground leading-relaxed text-base">
                Founded in {schoolInfo.established}, <strong>{schoolInfo.name}</strong> has been a beacon of educational excellence in the Mufakose suburb of Harare for nearly four decades. Established under the Ministry of Primary and Secondary Education (MoPSE), the school has grown from a modest institution serving the local community to one of Harare&apos;s most respected government secondary schools.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4 text-base">
                Over the years, Mufakose High has produced thousands of graduates who have gone on to excel in various fields including medicine, engineering, law, education, and business. The school takes pride in its consistent ZIMSEC O-Level and A-Level results, which regularly exceed the national average.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { label: 'Years of Excellence', value: new Date().getFullYear() - schoolInfo.established, suffix: '+' },
                  { label: 'Graduates', value: 8500, suffix: '+' },
                  { label: 'Province', value: 'Harare', suffix: '' },
                  { label: 'Registration', value: schoolInfo.registration, suffix: '' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {typeof item.value === 'number' ? <AnimatedCounter target={item.value} suffix={item.suffix} /> : item.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mission, Vision, Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { title: 'Our Mission', content: 'To provide quality, inclusive, and comprehensive education that develops learners intellectually, physically, morally, and socially, enabling them to become productive citizens of Zimbabwe.', icon: Target, gradient: 'from-emerald-500 to-teal-600' },
            { title: 'Our Vision', content: 'To be a leading centre of academic excellence, nurturing globally competitive learners rooted in Zimbabwean values and equipped for 21st-century challenges.', icon: Eye, gradient: 'from-teal-500 to-cyan-600' },
            { title: 'Our Values', content: 'Integrity, Diligence, Respect, Excellence, Innovation, Ubuntu/Hunhu, Inclusivity, Accountability, Environmental Stewardship, Community Service.', icon: Heart, gradient: 'from-cyan-500 to-blue-600' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all h-full group">
                <CardContent className="p-6">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Leadership Team */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">School Leadership</h3>
            <p className="text-muted-foreground">Meet the dedicated leaders guiding our school</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: schoolInfo.headmaster, role: 'Headmaster', qualification: 'M.Ed (UZ), B.Ed (UZ)', since: 2010, color: 'from-emerald-600 to-teal-700' },
              { name: schoolInfo.deputy, role: 'Deputy Headmaster', qualification: 'M.Sc (NUST), B.Sc (UZ)', since: 2012, color: 'from-teal-600 to-cyan-700' },
            ].map((leader, i) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`h-28 bg-gradient-to-r ${leader.color} relative flex items-end`}>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="relative z-10 p-5 w-full">
                        <div className="flex items-end gap-4">
                          <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white font-bold text-xl shrink-0">
                            {leader.name.split(' ').filter(n => n.length > 1).map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0 pb-1">
                            <h4 className="text-white font-semibold truncate">{leader.name}</h4>
                            <p className="text-white/70 text-sm">{leader.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="h-4 w-4 text-emerald-500" /> {leader.qualification}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 text-emerald-500" /> Since {leader.since}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Facilities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Our Facilities</h3>
            <p className="text-muted-foreground">World-class infrastructure for quality learning</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Science Labs', count: 3, icon: BookOpen, color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
              { name: 'Computer Lab', count: 1, icon: Monitor, color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' },
              { name: 'Library', count: 1, icon: Library, color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
              { name: 'Sports Fields', count: 3, icon: Trophy, color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
              { name: 'Classrooms', count: 32, icon: Building, color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
              { name: 'Hostels', count: 2, icon: BedDouble, color: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400' },
              { name: 'Assembly Hall', count: 1, icon: UsersRound, color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
              { name: 'Staff Houses', count: 8, icon: Building, color: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' },
            ].map((facility, i) => (
              <motion.div
                key={facility.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-all group cursor-pointer">
                  <CardContent className="p-5 text-center">
                    <div className={`h-12 w-12 rounded-xl ${facility.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <facility.icon className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold">{facility.count}</div>
                    <div className="text-xs text-muted-foreground mt-1">{facility.name}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

// ─── Academics Section ───────────────────────────────────────────────────────
function AcademicsSection() {
  return (
    <Section id="academics" className="py-20 md:py-28 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <BookOpen className="h-3 w-3 mr-1" /> Academics
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Academic <span className="text-emerald-600">Programmes</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            ZIMSEC-accredited O-Level and A-Level programmes designed for academic excellence
          </p>
        </motion.div>

        {/* Programme Tabs */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Tabs defaultValue="olevel" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12">
              <TabsTrigger value="olevel" className="text-sm font-semibold">O-Level (Form 1-4)</TabsTrigger>
              <TabsTrigger value="alevel" className="text-sm font-semibold">A-Level (Form 5-6)</TabsTrigger>
            </TabsList>

            <TabsContent value="olevel">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <GraduationCap className="h-6 w-6" /> ZIMSEC O-Level
                    </h3>
                    <p className="text-emerald-100/80 mt-1">Forms 1 through 4</p>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Our O-Level programme follows the Zimbabwe School Examinations Council curriculum, providing a solid academic foundation across a wide range of subjects. Students are prepared for the ZIMSEC O-Level examinations at the end of Form 4.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400"><AnimatedCounter target={92} suffix="%" /></div>
                        <div className="text-xs text-muted-foreground mt-1">2024 Pass Rate</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                        <div className="text-3xl font-bold text-amber-700 dark:text-amber-400"><AnimatedCounter target={19} /></div>
                        <div className="text-xs text-muted-foreground mt-1">Subjects Offered</div>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-3 text-sm">Subjects Offered:</h4>
                    <div className="flex flex-wrap gap-2">
                      {oLevelSubjects.map((subject) => (
                        <Badge key={subject} variant="secondary" className="text-xs">{subject}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-500" /> O-Level Performance Trend
                      </h4>
                      <div className="space-y-3">
                        {[
                          { year: '2024', rate: 92, color: 'bg-emerald-500' },
                          { year: '2023', rate: 88, color: 'bg-teal-500' },
                          { year: '2022', rate: 85, color: 'bg-cyan-500' },
                          { year: '2021', rate: 82, color: 'bg-blue-500' },
                          { year: '2020', rate: 79, color: 'bg-violet-500' },
                        ].map((item) => (
                          <div key={item.year} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-12">{item.year}</span>
                            <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${item.rate}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className={`h-full ${item.color} rounded-full flex items-center justify-end pr-3`}
                              >
                                <span className="text-xs font-bold text-white">{item.rate}%</span>
                              </motion.div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                          <Landmark className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">ZIMSEC Centre Status</h4>
                          <p className="text-sm text-muted-foreground mt-1">Centre No: ZM/HRE/0142</p>
                          <p className="text-sm text-muted-foreground">Fully registered examination centre for both O-Level and A-Level examinations</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alevel">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-700 p-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <GraduationCap className="h-6 w-6" /> ZIMSEC A-Level
                    </h3>
                    <p className="text-teal-100/80 mt-1">Forms 5 and 6</p>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Our A-Level programme prepares students for university education with in-depth study in specialized subject combinations. Students choose three or four subjects aligned with their career aspirations.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30">
                        <div className="text-3xl font-bold text-teal-700 dark:text-teal-400"><AnimatedCounter target={84} suffix="%" /></div>
                        <div className="text-xs text-muted-foreground mt-1">2024 Pass Rate</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30">
                        <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-400"><AnimatedCounter target={14} /></div>
                        <div className="text-xs text-muted-foreground mt-1">Subjects Offered</div>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-3 text-sm">Subjects Offered:</h4>
                    <div className="flex flex-wrap gap-2">
                      {aLevelSubjects.map((subject) => (
                        <Badge key={subject} variant="secondary" className="text-xs">{subject}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-4">Popular Subject Combinations</h4>
                      <div className="space-y-3">
                        {[
                          { name: 'Sciences', subjects: 'Mathematics, Physics, Chemistry', icon: BookOpen, color: 'text-blue-600' },
                          { name: 'Medical Sciences', subjects: 'Biology, Chemistry, Mathematics', icon: HeartPulse, color: 'text-rose-600' },
                          { name: 'Commercials', subjects: 'Accounting, Business Studies, Economics', icon: DollarSign, color: 'text-amber-600' },
                          { name: 'Arts & Humanities', subjects: 'History, Literature, Divinity', icon: Scale, color: 'text-purple-600' },
                        ].map((combo) => (
                          <div key={combo.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                            <combo.icon className={`h-5 w-5 ${combo.color} shrink-0`} />
                            <div>
                              <p className="font-semibold text-sm">{combo.name}</p>
                              <p className="text-xs text-muted-foreground">{combo.subjects}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-3">University Pathways</h4>
                      <p className="text-sm text-muted-foreground mb-4">Our A-Level graduates have been admitted to top universities including:</p>
                      <div className="flex flex-wrap gap-2">
                        {['University of Zimbabwe', 'NUST', 'MSU', 'GZU', 'CUT', 'Bindura University', 'Africa University', 'Lupane State'].map((uni) => (
                          <Badge key={uni} variant="outline" className="text-xs">{uni}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Section>
  )
}

// ─── Why Choose Us ───────────────────────────────────────────────────────────
function WhyChooseUsSection() {
  return (
    <Section id="why-choose" className="py-20 md:py-28 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <Star className="h-3 w-3 mr-1" /> Why Choose Us
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Why Families Choose <span className="text-emerald-600">Mufakose High</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            A holistic approach to education that nurtures mind, body, and character
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyChooseUs.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all h-full group overflow-hidden">
                <CardContent className="p-0">
                  <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
                  <div className="p-6">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── Admissions Section ──────────────────────────────────────────────────────
function AdmissionsSection() {
  return (
    <Section id="admissions" className="py-20 md:py-28 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <GraduationCap className="h-3 w-3 mr-1" /> Admissions
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Join Our <span className="text-emerald-600">School</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Begin your journey to academic excellence at Mufakose High School
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Application Process */}
          <motion.div {...fadeInLeft} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg overflow-hidden h-full">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ClipboardList className="h-6 w-6" /> Application Process
                </h3>
                <p className="text-emerald-100/80 mt-1">5 simple steps to enrollment</p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {admissionSteps.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
                          {step.step}
                        </div>
                        {i < admissionSteps.length - 1 && <div className="w-0.5 flex-1 bg-emerald-200 dark:bg-emerald-800 mt-2" />}
                      </div>
                      <div className="pb-6">
                        <h4 className="font-semibold text-base">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Requirements & Fees */}
          <motion.div {...fadeInRight} transition={{ delay: 0.2 }} className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-500" /> Admission Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {[
                    'Completed application form',
                    'Certified copy of birth certificate',
                    'Latest school report / transcript',
                    '2 passport-size photographs',
                    'Transfer letter from previous school',
                    'Immunisation record',
                    'Non-refundable application fee of USD 20',
                  ].map((req) => (
                    <li key={req} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" /> Fees Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[
                    { label: 'O-Level (per term)', usd: '$350', zig: 'ZiG 5,250' },
                    { label: 'A-Level (per term)', usd: '$450', zig: 'ZiG 6,750' },
                    { label: 'Boarding (per term)', usd: '$200', zig: 'ZiG 3,000' },
                    { label: 'Application Fee', usd: '$20', zig: 'ZiG 300' },
                    { label: 'Development Levy (annual)', usd: '$100', zig: 'ZiG 1,500' },
                  ].map((fee) => (
                    <div key={fee.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-sm font-medium">{fee.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-emerald-600">{fee.usd}</span>
                        <Badge variant="outline" className="text-[10px]">{fee.zig}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-2">
                    <HandHeart className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">BEAM programme available for qualifying families. Contact the bursar&apos;s office for details.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-600 to-teal-700 overflow-hidden">
            <CardContent className="p-8 md:p-10 relative">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10 text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Join Mufakose High?</h3>
                <p className="text-emerald-100/80 mb-6 max-w-xl mx-auto">Applications are now open for 2025 enrollment. Start your journey to academic excellence today.</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-emerald-900 font-bold shadow-lg transition-all hover:scale-105">
                    <GraduationCap className="h-5 w-5 mr-2" /> Apply Now
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Phone className="h-5 w-5 mr-2" /> Contact Us
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Section>
  )
}

// ─── Events Section ──────────────────────────────────────────────────────────
function EventsSectionComponent() {
  const [filter, setFilter] = useState('All')
  const types = ['All', ...Array.from(new Set(events.map(e => e.type)))]
  const filtered = filter === 'All' ? events : events.filter(e => e.type === filter)

  return (
    <Section id="events" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-12">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <Calendar className="h-3 w-3 mr-1" /> Events
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Upcoming <span className="text-emerald-600">Events</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Stay updated with our school calendar and community activities
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {types.map((type) => (
            <Button
              key={type}
              size="sm"
              variant={filter === type ? 'default' : 'outline'}
              onClick={() => setFilter(type)}
              className={filter === type ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:border-emerald-300 dark:hover:border-emerald-700'}
            >
              {type}
            </Button>
          ))}
        </div>

        <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <motion.div key={event.id} variants={staggerItem}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                <div className={`relative h-36 bg-gradient-to-br ${event.color} to-transparent`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 rounded-xl p-2.5 text-center shadow-lg min-w-[56px]">
                    <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{new Date(event.date).getDate()}</div>
                    <div className="text-[10px] uppercase font-semibold text-emerald-600/80 dark:text-emerald-400/80">{new Date(event.date).toLocaleString('en', { month: 'short' })}</div>
                    <div className="text-[9px] text-muted-foreground">{new Date(event.date).getFullYear()}</div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 dark:bg-gray-900/90 text-foreground shadow">{event.type}</Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-base mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

// ─── News Section ────────────────────────────────────────────────────────────
function NewsSectionComponent() {
  const [categoryFilter, setCategoryFilter] = useState('All')
  const categories = ['All', ...Array.from(new Set(news.map(n => n.category)))]
  const filtered = categoryFilter === 'All' ? news : news.filter(n => n.category === categoryFilter)
  const featured = news.find(n => n.featured)
  const [selectedArticle, setSelectedArticle] = useState<typeof news[0] | null>(null)

  return (
    <Section id="news" className="py-20 md:py-28 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-12">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <MessageSquare className="h-3 w-3 mr-1" /> News
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Latest <span className="text-emerald-600">News</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Stay informed about school developments and achievements
          </p>
        </motion.div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(cat)}
              className={categoryFilter === cat ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Featured Article */}
        {featured && categoryFilter === 'All' && (
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="mb-8">
            <Card className="border-0 shadow-xl overflow-hidden group cursor-pointer" onClick={() => setSelectedArticle(featured)}>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-56 md:h-auto bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="h-24 w-24 text-white/15" />
                  </div>
                  <Badge className="absolute top-4 left-4 bg-yellow-400 text-emerald-900 font-bold">
                    <Star className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                </div>
                <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                  <Badge variant="secondary" className="w-fit mb-3">{featured.category}</Badge>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{featured.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{featured.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(featured.date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700">
                      Read More <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )}

        {/* News Grid */}
        <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(categoryFilter === 'All' ? news.filter(n => !n.featured) : filtered).map((article) => (
            <motion.div key={article.id} variants={staggerItem}>
              <Card
                className="border-0 shadow-lg hover:shadow-xl transition-all group overflow-hidden cursor-pointer h-full flex flex-col"
                onClick={() => setSelectedArticle(article)}
              >
                <div className={`h-40 bg-gradient-to-br ${
                  article.image === 'academic' ? 'from-blue-400 to-indigo-500' :
                  article.image === 'sports' ? 'from-amber-400 to-orange-500' :
                  article.image === 'campus' ? 'from-emerald-400 to-teal-500' :
                  article.image === 'culture' ? 'from-rose-400 to-pink-500' :
                  'from-purple-400 to-violet-500'
                } relative`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-gray-900/90 shadow text-xs">{article.category}</Badge>
                  </div>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{article.excerpt}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{new Date(article.date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">Read <ChevronRight className="h-3 w-3" /></span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Article Dialog */}
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedArticle && (
              <>
                <DialogHeader>
                  <Badge variant="secondary" className="w-fit mb-2">{selectedArticle.category}</Badge>
                  <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> {new Date(selectedArticle.date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </DialogHeader>
                <div className="mt-4">
                  <p className="text-muted-foreground leading-relaxed">{selectedArticle.excerpt}</p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    This development marks another milestone in the school&apos;s ongoing commitment to providing quality education under the Ministry of Primary and Secondary Education framework. The school continues to work closely with MoPSE, ZIMSEC, and the local community to ensure all learners have access to the resources they need to succeed.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    For more information, please contact the school administration office at {schoolInfo.phone} or email {schoolInfo.email}.
                  </p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Section>
  )
}

// ─── Gallery Section ─────────────────────────────────────────────────────────
function GallerySection() {
  const [categoryFilter, setCategoryFilter] = useState('All')
  const filtered = categoryFilter === 'All' ? galleryImages : galleryImages.filter(img => img.category === categoryFilter)
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null)

  return (
    <Section id="gallery" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-12">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <Camera className="h-3 w-3 mr-1" /> Gallery
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Our <span className="text-emerald-600">Gallery</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            A visual journey through the life and spirit of Mufakose High School
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {galleryCategories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(cat)}
              className={categoryFilter === cat ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {cat}
            </Button>
          ))}
        </div>

        <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((image) => (
            <motion.div key={image.id} variants={staggerItem}>
              <Card
                className="border-0 shadow-lg hover:shadow-xl transition-all group cursor-pointer overflow-hidden"
                onClick={() => setSelectedImage(image)}
              >
                <CardContent className="p-0">
                  <div className={`h-40 md:h-48 bg-gradient-to-br ${image.color} relative`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Camera className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-xs font-medium">{image.title}</p>
                      <Badge variant="secondary" className="text-[9px] mt-1 bg-white/20 text-white border-white/20">{image.category}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Lightbox Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            {selectedImage && (
              <div className={`h-64 md:h-96 bg-gradient-to-br ${selectedImage.color} relative flex items-center justify-center`}>
                <div className="text-center">
                  <Camera className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white text-lg font-semibold">{selectedImage.title}</p>
                  <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/20">{selectedImage.category}</Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Section>
  )
}

// ─── Testimonials Section ────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <Section id="testimonials" className="py-20 md:py-28 bg-gradient-to-b from-emerald-900 to-teal-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge className="bg-yellow-400/20 text-yellow-200 border-yellow-400/30 mb-4 px-4 py-1.5">
            <Quote className="h-3 w-3 mr-1" /> Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">
            What People <span className="text-yellow-400">Say</span>
          </h2>
          <p className="text-emerald-200/80 max-w-2xl mx-auto text-base md:text-lg">
            Hear from our students, parents, and alumni about their experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-md border-white/10 h-full hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-yellow-400/30 mb-4" />
                  <p className="text-emerald-100/90 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-emerald-200/60 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── Contact Section ─────────────────────────────────────────────────────────
function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    toast.success('Message sent!', { description: 'We will get back to you shortly.' })
    setTimeout(() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }) }, 3000)
  }

  return (
    <Section id="contact" className="py-20 md:py-28 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 mb-4 px-4 py-1.5">
            <Mail className="h-3 w-3 mr-1" /> Contact
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Get In <span className="text-emerald-600">Touch</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            We&apos;d love to hear from you. Reach out to us with any questions.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div {...fadeInLeft} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-bold mb-6">Send us a Message</h3>
                {submitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold mb-2">Message Sent!</h4>
                    <p className="text-muted-foreground">We&apos;ll get back to you shortly.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input placeholder="Your name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input placeholder="+263 7XX XXX XXX" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input placeholder="e.g. Enrollment inquiry" value={formData.subject} onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea placeholder="Write your message here..." className="min-h-[120px]" value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} required />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg transition-all hover:scale-[1.02]">
                      <Send className="h-4 w-4 mr-2" /> Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info & Map */}
          <motion.div {...fadeInRight} transition={{ delay: 0.2 }} className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-5">
                  {[
                    { icon: MapPin, label: 'Address', value: schoolInfo.address, color: 'text-emerald-500' },
                    { icon: Phone, label: 'Phone', value: schoolInfo.phone, color: 'text-teal-500' },
                    { icon: Mail, label: 'Email', value: schoolInfo.email, color: 'text-cyan-500' },
                    { icon: Globe, label: 'Website', value: schoolInfo.website, color: 'text-blue-500' },
                    { icon: Clock4, label: 'Office Hours', value: 'Mon-Fri: 07:30 - 16:30', color: 'text-amber-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-medium text-sm">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-56 md:h-64 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30 relative flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Mufakose, Harare</p>
                  <p className="text-xs text-muted-foreground mt-1">15 Mufakose Drive</p>
                  <Badge variant="outline" className="mt-3 text-[10px]">Map loads in production</Badge>
                </div>
              </div>
            </Card>

            {/* Social Media */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Follow Us</h4>
                <div className="flex items-center gap-3">
                  {[
                    { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30' },
                    { icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-950/30' },
                    { icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/30' },
                    { icon: Youtube, label: 'YouTube', color: 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30' },
                  ].map((social) => (
                    <button
                      key={social.label}
                      className={`h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all hover:scale-110 ${social.color}`}
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* School Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                <School className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">{schoolInfo.name}</h3>
                <p className="text-xs text-emerald-400">{schoolInfo.motto}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              A leading government secondary school in Harare, Zimbabwe. Committed to academic excellence and holistic student development since {schoolInfo.established}.
            </p>
            <div className="flex items-center gap-2">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'YouTube' },
              ].map((social) => (
                <button
                  key={social.label}
                  className="h-8 w-8 rounded-lg bg-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-emerald-400 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Academics */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-emerald-400 uppercase tracking-wider">Academics</h4>
            <ul className="space-y-2">
              {['O-Level Programme', 'A-Level Programme', 'ZIMSEC Registration', 'Exam Results', 'E-Learning Portal', 'Library Services', 'Career Guidance'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-emerald-400 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> {schoolInfo.address}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" /> {schoolInfo.phone}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-emerald-500 shrink-0" /> {schoolInfo.email}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Globe className="h-4 w-4 text-emerald-500 shrink-0" /> {schoolInfo.website}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-1 w-24 overflow-hidden rounded-full">
                <div className="flex-1 bg-green-500" />
                <div className="flex-1 bg-yellow-400" />
                <div className="flex-1 bg-red-500" />
                <div className="flex-1 bg-black" />
              </div>
              <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()} {schoolInfo.name}. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Landmark className="h-3 w-3" /> MoPSE: {schoolInfo.registration}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> ZIMSEC Centre
              </span>
              <span>Powered by ZimSchool Pro</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PublicWebsite({ onLogin }: PublicWebsiteProps) {
  const [loginOpen, setLoginOpen] = useState(false)

  const handleLoginClick = () => {
    setLoginOpen(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <Navbar onLogin={handleLoginClick} />
      <HeroSection onLogin={handleLoginClick} />
      <AboutSectionComponent />
      <WhyChooseUsSection />
      <AcademicsSection />
      <AdmissionsSection />
      <TestimonialsSection />
      <EventsSectionComponent />
      <NewsSectionComponent />
      <GallerySection />
      <ContactSection />
      <Footer />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

      {/* Scroll to top */}
      <ScrollToTop />
    </div>
  )
}

// ─── Scroll to Top Button ────────────────────────────────────────────────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
