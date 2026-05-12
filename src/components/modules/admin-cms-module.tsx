'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, FileText, Image, Users, Search, Settings, Plus, Pencil, Trash2, Eye, Upload, Megaphone, Palette, BarChart3, Shield, Code, ExternalLink,
  LayoutDashboard, Newspaper, Camera, UserCheck, CheckCircle2, Clock, ToggleLeft, Star, GripVertical, Save, X, ChevronRight, AlertCircle, Tag, Link2, Hash, FileCode, MapPin, Phone, Mail, Share2, Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WebPage {
  id: string; title: string; slug: string; content: string; heroImage: string; status: 'published' | 'draft'; showInNav: boolean; sortOrder: number; lastModified: string
}
interface NewsArticle {
  id: string; title: string; excerpt: string; content: string; featuredImage: string; category: string; author: string; status: 'published' | 'draft'; date: string; featured: boolean
}
interface GalleryImage {
  id: string; title: string; description: string; imageUrl: string; category: string; featured: boolean; uploadedAt: string
}
interface StaffProfile {
  id: string; name: string; role: string; department: string; bio: string; subjects: string[]; qualifications: string; photo: string; showOnWebsite: boolean; email: string
}
interface SeoSettings {
  id: string; pageSlug: string; pageTitle: string; metaTitle: string; metaDescription: string; keywords: string[]; canonicalUrl: string; ogTitle: string; ogDescription: string; ogImage: string; schemaMarkup: string; sitemapEnabled: boolean; priority: string
}
interface WebsiteSettings {
  siteTitle: string; tagline: string; email: string; phone: string; address: string; facebook: string; twitter: string; instagram: string; youtube: string; footerContent: string; mapsEmbed: string; maintenanceMode: boolean
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockPages: WebPage[] = [
  { id: '1', title: 'About Us', slug: 'about', content: 'Mufakose High School has been a beacon of academic excellence in Harare since 1985. Our mission is to develop well-rounded individuals who contribute positively to Zimbabwe\'s growth.', heroImage: '/images/about-hero.jpg', status: 'published', showInNav: true, sortOrder: 1, lastModified: '2025-03-10' },
  { id: '2', title: 'Contact', slug: 'contact', content: 'Get in touch with Mufakose High School. We are located at 45 Moyo Drive, Mufakose, Harare. Office hours: Mon-Fri 7:30 AM - 4:30 PM.', heroImage: '/images/contact-hero.jpg', status: 'published', showInNav: true, sortOrder: 2, lastModified: '2025-03-08' },
  { id: '3', title: 'Admissions', slug: 'admissions', content: 'Admissions for 2026 are now open! We welcome students from all backgrounds. Apply online or visit our registrar\'s office for enrollment information.', heroImage: '/images/admissions-hero.jpg', status: 'published', showInNav: true, sortOrder: 3, lastModified: '2025-03-12' },
  { id: '4', title: 'Academics', slug: 'academics', content: 'Our academic programme follows the Zimbabwe Curriculum Framework, offering both ZIMSEC O-Level and A-Level programmes with a wide range of subjects.', heroImage: '/images/academics-hero.jpg', status: 'published', showInNav: true, sortOrder: 4, lastModified: '2025-02-28' },
  { id: '5', title: 'Sports & Culture', slug: 'sports', content: 'We offer a vibrant sports and cultural programme including soccer, netball, athletics, debate, and traditional dance, reflecting the rich heritage of Zimbabwe.', heroImage: '/images/sports-hero.jpg', status: 'draft', showInNav: true, sortOrder: 5, lastModified: '2025-03-05' },
  { id: '6', title: 'Gallery', slug: 'gallery', content: 'Explore our school through photos capturing campus life, events, sports achievements, and the Mufakose spirit.', heroImage: '/images/gallery-hero.jpg', status: 'published', showInNav: false, sortOrder: 6, lastModified: '2025-03-01' },
]

const mockNews: NewsArticle[] = [
  { id: '1', title: 'Mufakose High Tops ZIMSEC O-Level Results', excerpt: 'Our students achieved a 92% pass rate in the 2024 ZIMSEC O-Level examinations.', content: 'Full article content...', featuredImage: '/images/news/zimsec-results.jpg', category: 'Academic', author: 'Mr. T. Ndlovu', status: 'published', date: '2025-02-15', featured: true },
  { id: '2', title: 'Inter-House Athletics Championship 2025', excerpt: 'Mhangura House clinched the 2025 Inter-House Athletics Championship trophy.', content: 'Full article content...', featuredImage: '/images/news/athletics.jpg', category: 'Sports', author: 'Mrs. S. Zhou', status: 'published', date: '2025-03-01', featured: true },
  { id: '3', title: 'SDC Fundraiser Raises $12,000 for Science Lab', excerpt: 'The SDC fundraiser gala exceeded its target, raising funds for a new science laboratory.', content: 'Full article content...', featuredImage: '/images/news/fundraiser.jpg', category: 'Community', author: 'Mrs. R. Dube', status: 'published', date: '2025-02-20', featured: false },
  { id: '4', title: 'Term 1 Examination Schedule Released', excerpt: 'The examination schedule for Term 1 2025 has been released.', content: 'Full article content...', featuredImage: '/images/news/exams.jpg', category: 'Academic', author: 'Mr. T. Ndlovu', status: 'published', date: '2025-03-05', featured: false },
  { id: '5', title: 'Debate Team Wins Provincial Championship', excerpt: 'Our debate team has won the Harare Provincial Championship for the second year running.', content: 'Full article content...', featuredImage: '/images/news/debate.jpg', category: 'Achievement', author: 'Ms. P. Ncube', status: 'published', date: '2025-02-25', featured: true },
  { id: '6', title: 'New Computer Lab Officially Opened', excerpt: 'The newly upgraded computer lab was officially opened by the District Schools Inspector.', content: 'Full article content...', featuredImage: '/images/news/computer-lab.jpg', category: 'General', author: 'Mrs. S. Zhou', status: 'published', date: '2025-01-30', featured: false },
  { id: '7', title: 'Independence Day Celebrations at Mufakose High', excerpt: 'Students and staff celebrated Zimbabwe\'s 45th Independence Day with cultural performances.', content: 'Full article content...', featuredImage: '/images/news/independence.jpg', category: 'Community', author: 'Mr. K. Gumbo', status: 'draft', date: '2025-04-18', featured: false },
  { id: '8', title: 'Netball Team Qualifies for Nationals', excerpt: 'Our girls\' netball team has qualified for the ZSSU National Championships.', content: 'Full article content...', featuredImage: '/images/news/netball.jpg', category: 'Sports', author: 'Mrs. R. Dube', status: 'draft', date: '2025-03-15', featured: false },
]

const mockGallery: GalleryImage[] = [
  { id: '1', title: 'Main School Building', description: 'The iconic main administration block of Mufakose High School', imageUrl: 'https://picsum.photos/seed/school1/600/400', category: 'Campus', featured: true, uploadedAt: '2025-01-15' },
  { id: '2', title: 'Science Laboratory', description: 'State-of-the-art science lab for practical experiments', imageUrl: 'https://picsum.photos/seed/science2/600/400', category: 'Campus', featured: true, uploadedAt: '2025-01-20' },
  { id: '3', title: 'Inter-House Athletics 2025', description: 'Students competing in the 100m sprint at the annual athletics meet', imageUrl: 'https://picsum.photos/seed/athletics3/600/400', category: 'Sports', featured: true, uploadedAt: '2025-03-01' },
  { id: '4', title: 'Prize Giving Ceremony', description: 'Top students receiving academic awards at the annual prize giving', imageUrl: 'https://picsum.photos/seed/prize4/600/400', category: 'Events', featured: false, uploadedAt: '2025-02-10' },
  { id: '5', title: 'Computer Lab Session', description: 'Students working on programming projects in the new lab', imageUrl: 'https://picsum.photos/seed/computer5/600/400', category: 'Academics', featured: false, uploadedAt: '2025-02-05' },
  { id: '6', title: 'Traditional Dance Group', description: 'The school cultural ensemble performing at Heritage Day celebrations', imageUrl: 'https://picsum.photos/seed/dance6/600/400', category: 'Culture', featured: true, uploadedAt: '2025-01-25' },
  { id: '7', title: 'School Library', description: 'The well-stocked library with over 4,000 volumes', imageUrl: 'https://picsum.photos/seed/library7/600/400', category: 'Campus', featured: false, uploadedAt: '2025-01-18' },
  { id: '8', title: 'Soccer Team 2025', description: 'The Mufakose High soccer team ready for the season opener', imageUrl: 'https://picsum.photos/seed/soccer8/600/400', category: 'Sports', featured: false, uploadedAt: '2025-02-15' },
  { id: '9', title: 'Form 1 Orientation Day', description: 'New Form 1 students during their orientation programme', imageUrl: 'https://picsum.photos/seed/orient9/600/400', category: 'Events', featured: false, uploadedAt: '2025-01-10' },
  { id: '10', title: 'Chemistry Practical', description: 'A-Level students conducting advanced chemistry experiments', imageUrl: 'https://picsum.photos/seed/chem10/600/400', category: 'Academics', featured: false, uploadedAt: '2025-02-20' },
  { id: '11', title: 'Mbira Ensemble', description: 'Students performing traditional mbira music at the culture festival', imageUrl: 'https://picsum.photos/seed/mbira11/600/400', category: 'Culture', featured: false, uploadedAt: '2025-03-02' },
  { id: '12', title: 'Campus Aerial View', description: 'Beautiful aerial view of the entire Mufakose High School campus', imageUrl: 'https://picsum.photos/seed/aerial12/600/400', category: 'Campus', featured: true, uploadedAt: '2025-01-05' },
]

const mockStaffProfiles: StaffProfile[] = [
  { id: '1', name: 'Mr. T. Ndlovu', role: 'Headmaster', department: 'Administration', bio: 'Visionary leader with 20+ years in education. Passionate about academic excellence and holistic student development.', subjects: [], qualifications: 'M.Ed (UZ), B.Ed (ZOU)', photo: '', showOnWebsite: true, email: 't.ndlovu@mufakosehigh.co.zw' },
  { id: '2', name: 'Mrs. S. Zhou', role: 'Deputy Headmistress', department: 'Administration', bio: 'Dedicated educator focused on curriculum development and teacher support programmes.', subjects: [], qualifications: 'M.Sc (NUST), B.Ed (UZ)', photo: '', showOnWebsite: true, email: 's.zhou@mufakosehigh.co.zw' },
  { id: '3', name: 'Mr. K. Gumbo', role: 'Senior Teacher', department: 'Sciences', bio: 'Experienced science educator with a passion for practical learning and ZIMSEC exam preparation.', subjects: ['Physics', 'Chemistry'], qualifications: 'B.Sc (UZ), PGDE (ZOU)', photo: '', showOnWebsite: true, email: 'k.gumbo@mufakosehigh.co.zw' },
  { id: '4', name: 'Ms. P. Ncube', role: 'Teacher', department: 'Languages', bio: 'Dynamic English and Shona teacher who inspires a love for literature and language.', subjects: ['English Language', 'Shona'], qualifications: 'B.A (UZ), PGDE (MSU)', photo: '', showOnWebsite: true, email: 'p.ncube@mufakosehigh.co.zw' },
  { id: '5', name: 'Mrs. R. Dube', role: 'Teacher', department: 'Mathematics', bio: 'Mathematics specialist with a track record of producing top ZIMSEC results.', subjects: ['Mathematics', 'Additional Maths'], qualifications: 'B.Sc (UZ), M.Ed (MSU)', photo: '', showOnWebsite: true, email: 'r.dube@mufakosehigh.co.zw' },
  { id: '6', name: 'Mr. J. Moyo', role: 'Teacher', department: 'Humanities', bio: 'History and Geography educator passionate about Zimbabwean heritage and environmental awareness.', subjects: ['History', 'Geography'], qualifications: 'B.A (UZ), PGDE (ZOU)', photo: '', showOnWebsite: true, email: 'j.moyo@mufakosehigh.co.zw' },
  { id: '7', name: 'Mrs. L. Sithole', role: 'Teacher', department: 'Commercial', bio: 'Accounts and Business Studies teacher preparing students for careers in finance and entrepreneurship.', subjects: ['Accounts', 'Business Studies'], qualifications: 'B.Com (NUST), PGDE (UZ)', photo: '', showOnWebsite: true, email: 'l.sithole@mufakosehigh.co.zw' },
  { id: '8', name: 'Mr. A. Maposa', role: 'Teacher', department: 'Technical', bio: 'Computer Science and Design teacher driving digital literacy at Mufakose High.', subjects: ['Computer Science', 'Design & Technology'], qualifications: 'B.Tech (NUST), PGDE (ZOU)', photo: '', showOnWebsite: false, email: 'a.maposa@mufakosehigh.co.zw' },
  { id: '9', name: 'Mrs. N. Chikumbu', role: 'Bursar', department: 'Finance', bio: 'Experienced school bursar managing financial operations with transparency and efficiency.', subjects: [], qualifications: 'B.Compt (UNISA), CIA', photo: '', showOnWebsite: false, email: 'n.chikumbu@mufakosehigh.co.zw' },
  { id: '10', name: 'Mr. D. Banda', role: 'Sports Director', department: 'Sports', bio: 'Former national athlete turned coach, developing champions across multiple sports codes.', subjects: ['Physical Education'], qualifications: 'B.Ed (UZ), Sports Management Cert', photo: '', showOnWebsite: true, email: 'd.banda@mufakosehigh.co.zw' },
]

const mockSeoSettings: SeoSettings[] = [
  { id: '1', pageSlug: 'home', pageTitle: 'Home', metaTitle: 'Mufakose High School | Excellence in Education', metaDescription: 'Mufakose High School is a leading secondary school in Harare, Zimbabwe offering ZIMSEC O-Level and A-Level education with a proud tradition of academic excellence.', keywords: ['mufakose high school', 'zimbabwe school', 'harare school', 'zimsec'], canonicalUrl: 'https://mufakosehigh.co.zw', ogTitle: 'Mufakose High School - Excellence in Education', ogDescription: 'Leading secondary school in Harare, Zimbabwe with a proud tradition of academic excellence since 1985.', ogImage: '/images/og-home.jpg', schemaMarkup: '{"@type":"EducationalOrganization","name":"Mufakose High School","address":{"@type":"PostalAddress","addressLocality":"Harare","addressCountry":"ZW"}}', sitemapEnabled: true, priority: '1.0' },
  { id: '2', pageSlug: 'about', pageTitle: 'About Us', metaTitle: 'About Mufakose High School | Our History & Mission', metaDescription: 'Learn about Mufakose High School\'s history, mission, values and our commitment to developing well-rounded Zimbabwean citizens since 1985.', keywords: ['about mufakose', 'school history', 'school mission', 'zimbabwe education'], canonicalUrl: 'https://mufakosehigh.co.zw/about', ogTitle: 'About Mufakose High School', ogDescription: 'Our history, mission and values since 1985.', ogImage: '/images/og-about.jpg', schemaMarkup: '{"@type":"AboutPage","name":"About Mufakose High School"}', sitemapEnabled: true, priority: '0.8' },
  { id: '3', pageSlug: 'admissions', pageTitle: 'Admissions', metaTitle: 'Admissions | Mufakose High School', metaDescription: 'Apply for admission to Mufakose High School. Information on enrollment requirements, application process, and important dates for 2026 intake.', keywords: ['admissions', 'enrollment', 'apply', 'zimbabwe school admissions'], canonicalUrl: 'https://mufakosehigh.co.zw/admissions', ogTitle: 'Admissions - Mufakose High School', ogDescription: 'Apply for admission. 2026 intake now open.', ogImage: '/images/og-admissions.jpg', schemaMarkup: '{"@type":"WebPage","name":"Admissions"}', sitemapEnabled: true, priority: '0.9' },
  { id: '4', pageSlug: 'academics', pageTitle: 'Academics', metaTitle: 'Academics | Mufakose High School', metaDescription: 'Explore our academic programmes including ZIMSEC O-Level and A-Level subjects, curriculum, and our track record of academic excellence.', keywords: ['academics', 'zimsec', 'o-level', 'a-level', 'curriculum'], canonicalUrl: 'https://mufakosehigh.co.zw/academics', ogTitle: 'Academics - Mufakose High School', ogDescription: 'ZIMSEC O-Level and A-Level programmes.', ogImage: '/images/og-academics.jpg', schemaMarkup: '{"@type":"WebPage","name":"Academics"}', sitemapEnabled: true, priority: '0.8' },
  { id: '5', pageSlug: 'contact', pageTitle: 'Contact', metaTitle: 'Contact Us | Mufakose High School', metaDescription: 'Get in touch with Mufakose High School. Find our address, phone numbers, email, and office hours. Located in Mufakose, Harare, Zimbabwe.', keywords: ['contact', 'phone', 'email', 'address', 'harare'], canonicalUrl: 'https://mufakosehigh.co.zw/contact', ogTitle: 'Contact Us - Mufakose High School', ogDescription: 'Get in touch with us today.', ogImage: '/images/og-contact.jpg', schemaMarkup: '{"@type":"ContactPage","name":"Contact Us"}', sitemapEnabled: true, priority: '0.7' },
]

const mockWebsiteSettings: WebsiteSettings = {
  siteTitle: 'Mufakose High School',
  tagline: 'Excellence in Education Since 1985',
  email: 'info@mufakosehigh.co.zw',
  phone: '+263 4 667 891',
  address: '45 Moyo Drive, Mufakose, Harare, Zimbabwe',
  facebook: 'https://facebook.com/mufakosehigh',
  twitter: 'https://twitter.com/mufakosehigh',
  instagram: 'https://instagram.com/mufakosehigh',
  youtube: 'https://youtube.com/@mufakosehigh',
  footerContent: '© 2025 Mufakose High School. All rights reserved. A Ministry of Primary and Secondary Education registered institution.',
  mapsEmbed: '<iframe src="https://maps.google.com/maps?q=-17.8,31.0&z=15&output=embed" width="100%" height="300" style="border:0" loading="lazy"></iframe>',
  maintenanceMode: false,
}

const heroBranding = {
  headline: 'Excellence in Education, Strength in Character',
  subheadline: 'Building tomorrow\'s leaders through quality education since 1985',
  ctaText: 'Apply for 2026 Intake',
  bgImage: '/images/hero-bg.jpg',
  logo: '/images/school-logo.png',
  primaryColor: '#059669',
  secondaryColor: '#0d9488',
  motto: 'Simba Revedu / Our Strength',
}

const recentChanges = [
  { id: '1', action: 'Updated', item: 'Admissions page', user: 'Mr. T. Ndlovu', time: '2 hours ago', type: 'page' },
  { id: '2', action: 'Published', item: 'ZIMSEC Results news article', user: 'Mr. T. Ndlovu', time: '5 hours ago', type: 'news' },
  { id: '3', action: 'Uploaded', item: 'Inter-House Athletics photos', user: 'Mrs. S. Zhou', time: '1 day ago', type: 'gallery' },
  { id: '4', action: 'Edited', item: 'SEO settings for Home page', user: 'Mr. A. Maposa', time: '2 days ago', type: 'seo' },
  { id: '5', action: 'Updated', item: 'Staff profile - Mr. K. Gumbo', user: 'Mrs. S. Zhou', time: '3 days ago', type: 'staff' },
  { id: '6', action: 'Drafted', item: 'Sports & Culture page', user: 'Mr. D. Banda', time: '4 days ago', type: 'page' },
]

const newsCategories = ['All', 'General', 'Academic', 'Sports', 'Community', 'Achievement']
const galleryCategories = ['All', 'Campus', 'Events', 'Sports', 'Academics', 'Culture', 'General']
const staffDepartments = ['All', 'Administration', 'Sciences', 'Languages', 'Mathematics', 'Humanities', 'Commercial', 'Technical', 'Sports', 'Finance']

const animProps = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } }

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminCMSModule() {
  const { schoolName } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')

  // Page state
  const [pages, setPages] = useState(mockPages)
  const [pageDialogOpen, setPageDialogOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<WebPage | null>(null)
  const [pageForm, setPageForm] = useState({ title: '', slug: '', content: '', heroImage: '', status: 'draft' as 'published' | 'draft', showInNav: true, sortOrder: 0 })
  const [deletePageDialogOpen, setDeletePageDialogOpen] = useState(false)
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null)

  // News state
  const [news, setNews] = useState(mockNews)
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('All')
  const [newsDialogOpen, setNewsDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null)
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', featuredImage: '', category: 'General', author: '', status: 'draft' as 'published' | 'draft', featured: false })

  // Gallery state
  const [gallery, setGallery] = useState(mockGallery)
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState('All')
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false)
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', imageUrl: '', category: 'Campus', featured: false })
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([])
  const [deleteGalleryDialogOpen, setDeleteGalleryDialogOpen] = useState(false)
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null)

  // Staff state
  const [staffProfiles, setStaffProfiles] = useState(mockStaffProfiles)
  const [staffDeptFilter, setStaffDeptFilter] = useState('All')
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null)
  const [staffForm, setStaffForm] = useState({ bio: '', subjects: '', qualifications: '', showOnWebsite: true })

  // SEO state
  const [seoSettings, setSeoSettings] = useState(mockSeoSettings)
  const [seoEditOpen, setSeoEditOpen] = useState(false)
  const [editingSeo, setEditingSeo] = useState<SeoSettings | null>(null)
  const [seoForm, setSeoForm] = useState({ metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '', schemaMarkup: '', sitemapEnabled: true, priority: '0.5' })

  // Website settings
  const [websiteSettings, setWebsiteSettings] = useState(mockWebsiteSettings)
  const [heroData, setHeroData] = useState(heroBranding)

  // ─── Computed values ──────────────────────────────────────────────────────
  const publishedCount = pages.filter(p => p.status === 'published').length
  const draftCount = pages.filter(p => p.status === 'draft').length
  const newsCount = news.length
  const galleryCount = gallery.length

  const filteredNews = useMemo(() => {
    return newsCategoryFilter === 'All' ? news : news.filter(n => n.category === newsCategoryFilter)
  }, [news, newsCategoryFilter])

  const filteredGallery = useMemo(() => {
    return galleryCategoryFilter === 'All' ? gallery : gallery.filter(g => g.category === galleryCategoryFilter)
  }, [gallery, galleryCategoryFilter])

  const filteredStaff = useMemo(() => {
    return staffDeptFilter === 'All' ? staffProfiles : staffProfiles.filter(s => s.department === staffDeptFilter)
  }, [staffProfiles, staffDeptFilter])

  // ─── Page CRUD ────────────────────────────────────────────────────────────
  const openNewPage = () => {
    setEditingPage(null)
    setPageForm({ title: '', slug: '', content: '', heroImage: '', status: 'draft', showInNav: true, sortOrder: pages.length + 1 })
    setPageDialogOpen(true)
  }
  const openEditPage = (page: WebPage) => {
    setEditingPage(page)
    setPageForm({ title: page.title, slug: page.slug, content: page.content, heroImage: page.heroImage, status: page.status, showInNav: page.showInNav, sortOrder: page.sortOrder })
    setPageDialogOpen(true)
  }
  const savePage = () => {
    if (!pageForm.title) { toast.error('Title is required'); return }
    if (editingPage) {
      setPages(prev => prev.map(p => p.id === editingPage.id ? { ...p, ...pageForm, lastModified: new Date().toISOString().split('T')[0] } : p))
      toast.success('Page updated successfully')
    } else {
      setPages(prev => [...prev, { id: Date.now().toString(), ...pageForm, lastModified: new Date().toISOString().split('T')[0] }])
      toast.success('Page created successfully')
    }
    setPageDialogOpen(false)
  }
  const confirmDeletePage = (id: string) => { setDeletingPageId(id); setDeletePageDialogOpen(true) }
  const deletePage = () => {
    setPages(prev => prev.filter(p => p.id !== deletingPageId))
    setDeletePageDialogOpen(false)
    toast.success('Page deleted')
  }

  // ─── News CRUD ────────────────────────────────────────────────────────────
  const openNewNews = () => { setEditingNews(null); setNewsForm({ title: '', excerpt: '', content: '', featuredImage: '', category: 'General', author: '', status: 'draft', featured: false }); setNewsDialogOpen(true) }
  const openEditNews = (article: NewsArticle) => { setEditingNews(article); setNewsForm({ title: article.title, excerpt: article.excerpt, content: article.content, featuredImage: article.featuredImage, category: article.category, author: article.author, status: article.status, featured: article.featured }); setNewsDialogOpen(true) }
  const saveNews = () => {
    if (!newsForm.title) { toast.error('Title is required'); return }
    if (editingNews) {
      setNews(prev => prev.map(n => n.id === editingNews.id ? { ...n, ...newsForm } : n))
      toast.success('News article updated')
    } else {
      setNews(prev => [...prev, { id: Date.now().toString(), ...newsForm, date: new Date().toISOString().split('T')[0] }])
      toast.success('News article created')
    }
    setNewsDialogOpen(false)
  }
  const deleteNews = (id: string) => { setNews(prev => prev.filter(n => n.id !== id)); toast.success('News article deleted') }

  // ─── Gallery CRUD ─────────────────────────────────────────────────────────
  const openNewGallery = () => { setGalleryForm({ title: '', description: '', imageUrl: '', category: 'Campus', featured: false }); setGalleryDialogOpen(true) }
  const saveGallery = () => {
    if (!galleryForm.title) { toast.error('Title is required'); return }
    setGallery(prev => [...prev, { id: Date.now().toString(), ...galleryForm, uploadedAt: new Date().toISOString().split('T')[0] }])
    setGalleryDialogOpen(false)
    toast.success('Image added to gallery')
  }
  const confirmDeleteGallery = (id: string) => { setDeletingGalleryId(id); setDeleteGalleryDialogOpen(true) }
  const deleteGallery = () => {
    setGallery(prev => prev.filter(g => g.id !== deletingGalleryId))
    setDeleteGalleryDialogOpen(false)
    setSelectedGalleryIds(prev => prev.filter(id => id !== deletingGalleryId))
    toast.success('Image deleted')
  }
  const toggleGallerySelect = (id: string) => {
    setSelectedGalleryIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  const bulkDeleteGallery = () => {
    setGallery(prev => prev.filter(g => !selectedGalleryIds.includes(g.id)))
    toast.success(`${selectedGalleryIds.length} images deleted`)
    setSelectedGalleryIds([])
  }

  // ─── Staff CRUD ───────────────────────────────────────────────────────────
  const openEditStaff = (staff: StaffProfile) => {
    setEditingStaff(staff)
    setStaffForm({ bio: staff.bio, subjects: staff.subjects.join(', '), qualifications: staff.qualifications, showOnWebsite: staff.showOnWebsite })
    setStaffDialogOpen(true)
  }
  const saveStaff = () => {
    if (editingStaff) {
      setStaffProfiles(prev => prev.map(s => s.id === editingStaff.id ? { ...s, bio: staffForm.bio, subjects: staffForm.subjects.split(',').map(s => s.trim()).filter(Boolean), qualifications: staffForm.qualifications, showOnWebsite: staffForm.showOnWebsite } : s))
      toast.success('Staff profile updated')
    }
    setStaffDialogOpen(false)
  }
  const toggleStaffVisibility = (id: string) => {
    setStaffProfiles(prev => prev.map(s => s.id === id ? { ...s, showOnWebsite: !s.showOnWebsite } : s))
    toast.success('Staff visibility updated')
  }

  // ─── SEO ──────────────────────────────────────────────────────────────────
  const openEditSeo = (seo: SeoSettings) => {
    setEditingSeo(seo)
    setSeoForm({ metaTitle: seo.metaTitle, metaDescription: seo.metaDescription, keywords: seo.keywords.join(', '), canonicalUrl: seo.canonicalUrl, ogTitle: seo.ogTitle, ogDescription: seo.ogDescription, ogImage: seo.ogImage, schemaMarkup: seo.schemaMarkup, sitemapEnabled: seo.sitemapEnabled, priority: seo.priority })
    setSeoEditOpen(true)
  }
  const saveSeo = () => {
    if (editingSeo) {
      setSeoSettings(prev => prev.map(s => s.id === editingSeo.id ? { ...s, ...seoForm, keywords: seoForm.keywords.split(',').map(k => k.trim()).filter(Boolean) } : s))
      toast.success('SEO settings saved')
    }
    setSeoEditOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...animProps} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-emerald-600" />
            Website CMS
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your public school website content, branding, and SEO</p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
          <Globe className="h-3 w-3" /> mufakosehigh.co.zw
        </Badge>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 min-w-[800px]">
            <TabsTrigger value="overview" className="gap-1.5 text-xs"><LayoutDashboard className="h-3.5 w-3.5" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="hero" className="gap-1.5 text-xs"><Palette className="h-3.5 w-3.5" /><span className="hidden sm:inline">Hero</span></TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /><span className="hidden sm:inline">Pages</span></TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5 text-xs"><Newspaper className="h-3.5 w-3.5" /><span className="hidden sm:inline">News</span></TabsTrigger>
            <TabsTrigger value="gallery" className="gap-1.5 text-xs"><Camera className="h-3.5 w-3.5" /><span className="hidden sm:inline">Gallery</span></TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5 text-xs"><UserCheck className="h-3.5 w-3.5" /><span className="hidden sm:inline">Staff</span></TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5 text-xs"><Search className="h-3.5 w-3.5" /><span className="hidden sm:inline">SEO</span></TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" /><span className="hidden sm:inline">Settings</span></TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: 'Published Pages', value: publishedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              { icon: FileText, label: 'Draft Pages', value: draftCount, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { icon: Newspaper, label: 'News Articles', value: newsCount, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
              { icon: Camera, label: 'Gallery Images', value: galleryCount, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
            ].map((stat) => (
              <motion.div key={stat.label} {...animProps}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.bg)}><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Changes */}
            <motion.div {...animProps} className="lg:col-span-2">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3"><CardTitle className="text-base">Recent Changes</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentChanges.map((change) => {
                      const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
                        page: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                        news: { icon: Newspaper, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
                        gallery: { icon: Camera, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
                        seo: { icon: Search, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                        staff: { icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                      }
                      const cfg = typeConfig[change.type] || typeConfig.page
                      return (
                        <div key={change.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', cfg.bg)}><cfg.icon className={cn('h-4 w-4', cfg.color)} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm"><span className="font-medium">{change.action}</span> {change.item}</p>
                            <p className="text-xs text-muted-foreground">{change.user} &middot; {change.time}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div {...animProps}>
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: FileText, label: 'Add Page', desc: 'Create a new website page', action: () => { setActiveTab('pages'); setTimeout(openNewPage, 100) } },
                    { icon: Newspaper, label: 'Add News', desc: 'Publish a news article', action: () => { setActiveTab('news'); setTimeout(openNewNews, 100) } },
                    { icon: Camera, label: 'Upload Image', desc: 'Add to gallery', action: () => { setActiveTab('gallery'); setTimeout(openNewGallery, 100) } },
                    { icon: Palette, label: 'Edit Hero', desc: 'Update hero section', action: () => setActiveTab('hero') },
                  ].map((qa) => (
                    <button key={qa.label} onClick={qa.action} className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors text-left group">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                        <qa.icon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div><p className="text-sm font-medium">{qa.label}</p><p className="text-xs text-muted-foreground">{qa.desc}</p></div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ═══════════ HERO & BRANDING TAB ═══════════ */}
        <TabsContent value="hero" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hero Section */}
            <motion.div {...animProps}>
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-emerald-600" /> Hero Section</CardTitle><CardDescription>Manage the main hero banner on your homepage</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Background Image</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click or drag to upload hero background</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Recommended: 1920x1080px, JPG/PNG</p>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Headline</Label><Input value={heroData.headline} onChange={e => setHeroData(prev => ({ ...prev, headline: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Subheadline</Label><Textarea value={heroData.subheadline} onChange={e => setHeroData(prev => ({ ...prev, subheadline: e.target.value }))} rows={2} /></div>
                  <div className="space-y-2"><Label>CTA Button Text</Label><Input value={heroData.ctaText} onChange={e => setHeroData(prev => ({ ...prev, ctaText: e.target.value }))} /></div>
                </CardContent>
                <CardFooter><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Hero section updated')}><Save className="h-4 w-4 mr-2" />Save Hero</Button></CardFooter>
              </Card>
            </motion.div>

            {/* School Branding */}
            <motion.div {...animProps} className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-600" /> School Branding</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>School Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border-2 border-dashed border-emerald-300">
                        <Shield className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload Logo</Button>
                        <p className="text-xs text-muted-foreground">PNG, SVG (min 200x200px)</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>School Motto</Label><Input value={heroData.motto} onChange={e => setHeroData(prev => ({ ...prev, motto: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Primary Color</Label><div className="flex gap-2"><Input value={heroData.primaryColor} onChange={e => setHeroData(prev => ({ ...prev, primaryColor: e.target.value }))} /><div className="h-9 w-9 rounded-md border" style={{ backgroundColor: heroData.primaryColor }} /></div></div>
                    <div className="space-y-2"><Label>Secondary Color</Label><div className="flex gap-2"><Input value={heroData.secondaryColor} onChange={e => setHeroData(prev => ({ ...prev, secondaryColor: e.target.value }))} /><div className="h-9 w-9 rounded-md border" style={{ backgroundColor: heroData.secondaryColor }} /></div></div>
                  </div>
                </CardContent>
                <CardFooter><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Branding updated')}><Save className="h-4 w-4 mr-2" />Save Branding</Button></CardFooter>
              </Card>

              {/* Hero Preview */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base">Hero Preview</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${heroData.primaryColor}, ${heroData.secondaryColor})` }}>
                    <div className="p-8 text-white text-center min-h-[200px] flex flex-col items-center justify-center">
                      <Shield className="h-10 w-10 mb-3 opacity-80" />
                      <h3 className="text-xl font-bold mb-2">{heroData.headline}</h3>
                      <p className="text-sm opacity-80 mb-4 max-w-md">{heroData.subheadline}</p>
                      <div className="inline-flex px-5 py-2 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm">{heroData.ctaText}</div>
                      <p className="text-xs opacity-60 mt-3 italic">{heroData.motto}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ═══════════ PAGES TAB ═══════════ */}
        <TabsContent value="pages" className="space-y-4 mt-4">
          <motion.div {...animProps} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">{publishedCount} published</Badge>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{draftCount} drafts</Badge>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openNewPage}><Plus className="h-4 w-4 mr-2" />Add Page</Button>
          </motion.div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 w-8"></th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Title</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Slug</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">In Nav</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Order</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Modified</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {pages.sort((a, b) => a.sortOrder - b.sortOrder).map((page) => (
                      <tr key={page.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3"><GripVertical className="h-4 w-4 text-muted-foreground/40" /></td>
                        <td className="p-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-500 shrink-0" /><span className="text-sm font-medium">{page.title}</span></div></td>
                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">/{page.slug}</td>
                        <td className="p-3 hidden md:table-cell"><Badge variant={page.status === 'published' ? 'default' : 'secondary'} className={page.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}>{page.status}</Badge></td>
                        <td className="p-3 hidden lg:table-cell">{page.showInNav ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground/40" />}</td>
                        <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{page.sortOrder}</td>
                        <td className="p-3 text-sm text-muted-foreground">{page.lastModified}</td>
                        <td className="p-3 text-right"><div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPage(page)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => confirmDeletePage(page.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit Page Dialog */}
          <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingPage ? 'Edit Page' : 'Add New Page'}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={pageForm.title} onChange={e => setPageForm(p => ({ ...p, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} placeholder="Page title" /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={pageForm.slug} onChange={e => setPageForm(p => ({ ...p, slug: e.target.value }))} placeholder="page-url-slug" /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={pageForm.content} onChange={e => setPageForm(p => ({ ...p, content: e.target.value }))} rows={6} placeholder="Page content..." /></div>
                <div className="space-y-2"><Label>Hero Image URL</Label><Input value={pageForm.heroImage} onChange={e => setPageForm(p => ({ ...p, heroImage: e.target.value }))} placeholder="/images/page-hero.jpg" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Status</Label><Select value={pageForm.status} onValueChange={v => setPageForm(p => ({ ...p, status: v as 'published' | 'draft' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={pageForm.sortOrder} onChange={e => setPageForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} /></div>
                </div>
                <div className="flex items-center gap-3"><Switch checked={pageForm.showInNav} onCheckedChange={v => setPageForm(p => ({ ...p, showInNav: v }))} /><Label>Show in Navigation</Label></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setPageDialogOpen(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={savePage}>{editingPage ? 'Update' : 'Create'} Page</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Page Dialog */}
          <Dialog open={deletePageDialogOpen} onOpenChange={setDeletePageDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader><DialogTitle>Delete Page</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Are you sure you want to delete this page? This action cannot be undone.</p>
              <DialogFooter><Button variant="outline" onClick={() => setDeletePageDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deletePage}>Delete</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════ NEWS TAB ═══════════ */}
        <TabsContent value="news" className="space-y-4 mt-4">
          <motion.div {...animProps} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {newsCategories.map(cat => (
                <button key={cat} onClick={() => setNewsCategoryFilter(cat)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', newsCategoryFilter === cat ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>{cat}</button>
              ))}
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openNewNews}><Plus className="h-4 w-4 mr-2" />Add Article</Button>
          </motion.div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Title</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Author</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Date</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredNews.map((article) => (
                      <tr key={article.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3"><div className="flex items-center gap-2">{article.featured && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />}<span className="text-sm font-medium truncate max-w-[200px]">{article.title}</span></div><p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.excerpt}</p></td>
                        <td className="p-3 hidden sm:table-cell"><Badge variant="outline" className="text-[10px]">{article.category}</Badge></td>
                        <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{article.author}</td>
                        <td className="p-3 hidden md:table-cell"><Badge variant={article.status === 'published' ? 'default' : 'secondary'} className={article.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}>{article.status}</Badge></td>
                        <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{article.date}</td>
                        <td className="p-3 text-right"><div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditNews(article)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deleteNews(article.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit News Dialog */}
          <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingNews ? 'Edit Article' : 'Add News Article'}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={newsForm.title} onChange={e => setNewsForm(n => ({ ...n, title: e.target.value }))} placeholder="Article title" /></div>
                <div className="space-y-2"><Label>Excerpt</Label><Textarea value={newsForm.excerpt} onChange={e => setNewsForm(n => ({ ...n, excerpt: e.target.value }))} rows={2} placeholder="Brief summary..." /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={newsForm.content} onChange={e => setNewsForm(n => ({ ...n, content: e.target.value }))} rows={5} placeholder="Full article content..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Category</Label><Select value={newsForm.category} onValueChange={v => setNewsForm(n => ({ ...n, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['General', 'Academic', 'Sports', 'Community', 'Achievement'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Author</Label><Input value={newsForm.author} onChange={e => setNewsForm(n => ({ ...n, author: e.target.value }))} placeholder="Author name" /></div>
                </div>
                <div className="space-y-2"><Label>Featured Image URL</Label><Input value={newsForm.featuredImage} onChange={e => setNewsForm(n => ({ ...n, featuredImage: e.target.value }))} placeholder="/images/news/image.jpg" /></div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={newsForm.status === 'published'} onCheckedChange={v => setNewsForm(n => ({ ...n, status: v ? 'published' : 'draft' }))} /><Label>Published</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={newsForm.featured} onCheckedChange={v => setNewsForm(n => ({ ...n, featured: v }))} /><Label>Featured</Label></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setNewsDialogOpen(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveNews}>{editingNews ? 'Update' : 'Create'}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════ GALLERY TAB ═══════════ */}
        <TabsContent value="gallery" className="space-y-4 mt-4">
          <motion.div {...animProps} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {galleryCategories.map(cat => (
                <button key={cat} onClick={() => setGalleryCategoryFilter(cat)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', galleryCategoryFilter === cat ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>{cat}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {selectedGalleryIds.length > 0 && <Button variant="destructive" size="sm" onClick={bulkDeleteGallery}><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete ({selectedGalleryIds.length})</Button>}
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openNewGallery}><Plus className="h-4 w-4 mr-2" />Upload Image</Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGallery.map((img) => (
              <motion.div key={img.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                <Card className={cn('border-0 shadow-md hover:shadow-lg transition-all overflow-hidden group cursor-pointer', selectedGalleryIds.includes(img.id) && 'ring-2 ring-emerald-500')}>
                  <div className="relative aspect-[4/3] bg-muted">
                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => confirmDeleteGallery(img.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    {img.featured && <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]"><Star className="h-2.5 w-2.5 mr-0.5" />Featured</Badge>}
                    <button className="absolute top-2 right-2" onClick={() => toggleGallerySelect(img.id)}>
                      <div className={cn('h-5 w-5 rounded border-2 flex items-center justify-center transition-colors', selectedGalleryIds.includes(img.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white/80 border-gray-300')} >
                        {selectedGalleryIds.includes(img.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{img.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{img.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-[10px] h-5">{img.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{img.uploadedAt}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Upload Image Dialog */}
          <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Upload Image</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={galleryForm.title} onChange={e => setGalleryForm(g => ({ ...g, title: e.target.value }))} placeholder="Image title" /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={galleryForm.description} onChange={e => setGalleryForm(g => ({ ...g, description: e.target.value }))} placeholder="Brief description" /></div>
                <div className="space-y-2"><Label>Image URL</Label><Input value={galleryForm.imageUrl} onChange={e => setGalleryForm(g => ({ ...g, imageUrl: e.target.value }))} placeholder="https://example.com/image.jpg" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Category</Label><Select value={galleryForm.category} onValueChange={v => setGalleryForm(g => ({ ...g, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Campus', 'Events', 'Sports', 'Academics', 'Culture', 'General'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="flex items-end gap-2 pb-0.5"><Switch checked={galleryForm.featured} onCheckedChange={v => setGalleryForm(g => ({ ...g, featured: v }))} /><Label>Featured</Label></div>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Or drag and drop an image here</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP (Max 5MB)</p>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setGalleryDialogOpen(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveGallery}>Upload</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Gallery Dialog */}
          <Dialog open={deleteGalleryDialogOpen} onOpenChange={setDeleteGalleryDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader><DialogTitle>Delete Image</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Are you sure you want to delete this image? This action cannot be undone.</p>
              <DialogFooter><Button variant="outline" onClick={() => setDeleteGalleryDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deleteGallery}>Delete</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════ STAFF PROFILES TAB ═══════════ */}
        <TabsContent value="staff" className="space-y-4 mt-4">
          <motion.div {...animProps} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {staffDepartments.map(dept => (
                <button key={dept} onClick={() => setStaffDeptFilter(dept)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', staffDeptFilter === dept ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>{dept}</button>
              ))}
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
              {staffProfiles.filter(s => s.showOnWebsite).length} shown on website
            </Badge>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => (
              <motion.div key={staff.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card className={cn('border-0 shadow-md hover:shadow-lg transition-shadow', !staff.showOnWebsite && 'opacity-60')}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 border-2 border-emerald-200 dark:border-emerald-800">
                        <AvatarFallback className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold">{staff.name.split(' ').map(n => n[0]).join('').replace('.', '').slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{staff.name}</p>
                          {staff.showOnWebsite && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] h-5"><Eye className="h-2.5 w-2.5 mr-0.5" />Public</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{staff.role}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{staff.department}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{staff.bio}</p>
                    {staff.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">{staff.subjects.map(s => <Badge key={s} variant="secondary" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">{s}</Badge>)}</div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">{staff.qualifications}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Switch checked={staff.showOnWebsite} onCheckedChange={() => toggleStaffVisibility(staff.id)} className="scale-75" />
                        <span className="text-xs text-muted-foreground">{staff.showOnWebsite ? 'Visible' : 'Hidden'}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditStaff(staff)}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Edit Staff Dialog */}
          <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Edit Staff Profile - {editingStaff?.name}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Bio</Label><Textarea value={staffForm.bio} onChange={e => setStaffForm(s => ({ ...s, bio: e.target.value }))} rows={4} placeholder="Staff biography for public display" /></div>
                <div className="space-y-2"><Label>Subjects (comma separated)</Label><Input value={staffForm.subjects} onChange={e => setStaffForm(s => ({ ...s, subjects: e.target.value }))} placeholder="Physics, Chemistry" /></div>
                <div className="space-y-2"><Label>Qualifications</Label><Input value={staffForm.qualifications} onChange={e => setStaffForm(s => ({ ...s, qualifications: e.target.value }))} placeholder="B.Ed, M.Sc" /></div>
                <div className="flex items-center gap-2"><Switch checked={staffForm.showOnWebsite} onCheckedChange={v => setStaffForm(s => ({ ...s, showOnWebsite: v }))} /><Label>Show on Website</Label></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setStaffDialogOpen(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveStaff}>Save Profile</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════ SEO SETTINGS TAB ═══════════ */}
        <TabsContent value="seo" className="space-y-6 mt-4">
          <motion.div {...animProps}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Search, label: 'Pages Optimized', value: seoSettings.filter(s => s.sitemapEnabled).length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                { icon: FileCode, label: 'Schema Markups', value: seoSettings.length, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
                { icon: Hash, label: 'Total Keywords', value: seoSettings.reduce((a, s) => a + s.keywords.length, 0), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                { icon: Link2, label: 'Canonical URLs', value: seoSettings.filter(s => s.canonicalUrl).length, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
              ].map((stat) => (
                <Card key={stat.label} className="border-0 shadow-md"><CardContent className="p-4">
                  <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-xl font-bold mt-1">{stat.value}</p></div>
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', stat.bg)}><stat.icon className={cn('h-4 w-4', stat.color)} /></div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </motion.div>

          {/* Per-Page SEO Cards */}
          <div className="space-y-4">
            {seoSettings.map((seo) => (
              <motion.div key={seo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{seo.pageTitle}</h4>
                          <Badge variant="outline" className="text-[10px]">/{seo.pageSlug}</Badge>
                          {seo.sitemapEnabled && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] h-5"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Sitemap</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-md">{seo.metaTitle}</p>
                        <p className="text-xs text-muted-foreground/70 line-clamp-1">{seo.metaDescription}</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-fit" onClick={() => openEditSeo(seo)}><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit SEO</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional SEO Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schema Markup Editor */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4 text-emerald-600" /> Schema Markup Templates</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: 'EducationalOrganization', desc: 'School organization schema', status: 'Active' },
                  { type: 'Event', desc: 'School events schema', status: 'Active' },
                  { type: 'Article', desc: 'News articles schema', status: 'Active' },
                  { type: 'BreadcrumbList', desc: 'Navigation breadcrumbs', status: 'Draft' },
                ].map(schema => (
                  <div key={schema.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div><p className="text-sm font-medium">{schema.type}</p><p className="text-xs text-muted-foreground">{schema.desc}</p></div>
                    <Badge variant={schema.status === 'Active' ? 'default' : 'secondary'} className={schema.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px]' : 'text-[10px]'}>{schema.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cache & Integration */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-600" /> Cache & Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Clear Page Cache</p><p className="text-xs text-muted-foreground">Regenerate all cached pages</p></div><Button variant="outline" size="sm" onClick={() => toast.success('Page cache cleared')}>Clear</Button></div>
                  <Separator />
                  <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Clear Image Cache</p><p className="text-xs text-muted-foreground">Regenerate image thumbnails</p></div><Button variant="outline" size="sm" onClick={() => toast.success('Image cache cleared')}>Clear</Button></div>
                  <Separator />
                  <div className="space-y-2"><Label className="text-sm font-medium">Cache Duration</Label><Select defaultValue="3600"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1800">30 minutes</SelectItem><SelectItem value="3600">1 hour</SelectItem><SelectItem value="7200">2 hours</SelectItem><SelectItem value="86400">24 hours</SelectItem></SelectContent></Select></div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Google Integrations</p>
                  <div className="space-y-2"><Label className="text-xs">Analytics Tracking ID</Label><Input placeholder="G-XXXXXXXXXX" /></div>
                  <div className="space-y-2"><Label className="text-xs">Search Console Verification</Label><Input placeholder="Verification meta tag" /></div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Integration settings saved')}><Save className="h-4 w-4 mr-2" />Save Integration</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Robots.txt & Sitemap */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileCode className="h-4 w-4 text-emerald-600" /> Robots.txt & Sitemap Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Robots.txt Directives</Label>
                  <Textarea rows={8} defaultValue={`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://mufakosehigh.co.zw/sitemap.xml`} className="font-mono text-xs" />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => toast.success('Robots.txt updated')}><Save className="h-3.5 w-3.5 mr-1.5" />Save robots.txt</Button>
                </div>
                <div className="space-y-3">
                  <Label>Sitemap Page Priority</Label>
                  {seoSettings.map(seo => (
                    <div key={seo.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2"><span className="text-sm">/{seo.pageSlug}</span></div>
                      <div className="flex items-center gap-2"><Switch checked={seo.sitemapEnabled} onCheckedChange={() => { setSeoSettings(prev => prev.map(s => s.id === seo.id ? { ...s, sitemapEnabled: !s.sitemapEnabled } : s)); toast.success('Sitemap setting updated') }} className="scale-75" /><Badge variant="outline" className="text-[10px]">Priority: {seo.priority}</Badge></div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => toast.success('Sitemap regenerated')}><Zap className="h-3.5 w-3.5 mr-1.5" />Regenerate Sitemap</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Edit Dialog */}
          <Dialog open={seoEditOpen} onOpenChange={setSeoEditOpen}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>SEO Settings - {editingSeo?.pageTitle}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Separator className="mb-2" />
                <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wide">Basic SEO</p>
                <div className="space-y-2"><Label>Meta Title</Label><Input value={seoForm.metaTitle} onChange={e => setSeoForm(s => ({ ...s, metaTitle: e.target.value }))} /><p className="text-xs text-muted-foreground">{seoForm.metaTitle.length}/60 characters</p></div>
                <div className="space-y-2"><Label>Meta Description</Label><Textarea value={seoForm.metaDescription} onChange={e => setSeoForm(s => ({ ...s, metaDescription: e.target.value }))} rows={2} /><p className="text-xs text-muted-foreground">{seoForm.metaDescription.length}/160 characters</p></div>
                <div className="space-y-2"><Label>Keywords (comma separated)</Label><Input value={seoForm.keywords} onChange={e => setSeoForm(s => ({ ...s, keywords: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Canonical URL</Label><Input value={seoForm.canonicalUrl} onChange={e => setSeoForm(s => ({ ...s, canonicalUrl: e.target.value }))} /></div>
                <Separator />
                <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wide">Open Graph</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>OG Title</Label><Input value={seoForm.ogTitle} onChange={e => setSeoForm(s => ({ ...s, ogTitle: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>OG Image URL</Label><Input value={seoForm.ogImage} onChange={e => setSeoForm(s => ({ ...s, ogImage: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>OG Description</Label><Textarea value={seoForm.ogDescription} onChange={e => setSeoForm(s => ({ ...s, ogDescription: e.target.value }))} rows={2} /></div>
                <Separator />
                <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wide">Schema Markup (JSON-LD)</p>
                <div className="space-y-2"><Textarea value={seoForm.schemaMarkup} onChange={e => setSeoForm(s => ({ ...s, schemaMarkup: e.target.value }))} rows={5} className="font-mono text-xs" /></div>
                <Separator />
                <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wide">Sitemap</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={seoForm.sitemapEnabled} onCheckedChange={v => setSeoForm(s => ({ ...s, sitemapEnabled: v }))} /><Label>Include in Sitemap</Label></div>
                  <div className="space-y-1"><Label className="text-xs">Priority</Label><Select value={seoForm.priority} onValueChange={v => setSeoForm(s => ({ ...s, priority: v }))}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{['1.0', '0.9', '0.8', '0.7', '0.6', '0.5'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setSeoEditOpen(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveSeo}>Save SEO</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════ SETTINGS TAB ═══════════ */}
        <TabsContent value="settings" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Website Info */}
            <motion.div {...animProps}>
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-emerald-600" /> Website Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Website Title</Label><Input value={websiteSettings.siteTitle} onChange={e => setWebsiteSettings(s => ({ ...s, siteTitle: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Tagline</Label><Input value={websiteSettings.tagline} onChange={e => setWebsiteSettings(s => ({ ...s, tagline: e.target.value }))} /></div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Website info updated')}><Save className="h-4 w-4 mr-2" />Save</Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info */}
            <motion.div {...animProps}>
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Email</Label><Input value={websiteSettings.email} onChange={e => setWebsiteSettings(s => ({ ...s, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={websiteSettings.phone} onChange={e => setWebsiteSettings(s => ({ ...s, phone: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Address</Label><Textarea value={websiteSettings.address} onChange={e => setWebsiteSettings(s => ({ ...s, address: e.target.value }))} rows={2} /></div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Contact info updated')}><Save className="h-4 w-4 mr-2" />Save</Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Media */}
            <motion.div {...animProps}>
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Share2 className="h-4 w-4 text-emerald-600" /> Social Media Links</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/...' },
                    { key: 'twitter' as const, label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
                    { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/...' },
                    { key: 'youtube' as const, label: 'YouTube', placeholder: 'https://youtube.com/...' },
                  ].map(social => (
                    <div key={social.key} className="space-y-2"><Label>{social.label}</Label><Input value={websiteSettings[social.key]} onChange={e => setWebsiteSettings(s => ({ ...s, [social.key]: e.target.value }))} placeholder={social.placeholder} /></div>
                  ))}
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Social media links updated')}><Save className="h-4 w-4 mr-2" />Save</Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Footer & Maps & Maintenance */}
            <motion.div {...animProps}>
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-emerald-600" /> Footer & Advanced</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Footer Content</Label><Textarea value={websiteSettings.footerContent} onChange={e => setWebsiteSettings(s => ({ ...s, footerContent: e.target.value }))} rows={3} /></div>
                  <div className="space-y-2"><Label>Google Maps Embed Code</Label><Textarea value={websiteSettings.mapsEmbed} onChange={e => setWebsiteSettings(s => ({ ...s, mapsEmbed: e.target.value }))} rows={3} className="font-mono text-xs" /></div>
                  <Separator />
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div><p className="text-sm font-medium">Maintenance Mode</p><p className="text-xs text-muted-foreground">Take the website offline for updates</p></div>
                    <Switch checked={websiteSettings.maintenanceMode} onCheckedChange={v => { setWebsiteSettings(s => ({ ...s, maintenanceMode: v })); toast.success(v ? 'Maintenance mode enabled' : 'Maintenance mode disabled') }} />
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Settings saved')}><Save className="h-4 w-4 mr-2" />Save All</Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
