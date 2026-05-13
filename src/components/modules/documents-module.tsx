'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  FolderOpen,
  Upload,
  Search,
  Grid3X3,
  List,
  Plus,
  Download,
  Eye,
  Share2,
  Trash2,
  FileSpreadsheet,
  FileImage,
  File,
  Clock,
  Tag,
  MoreVertical,
  ChevronRight,
  LayoutTemplate,
  Users,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  HardDrive,
  Folder,
  ArrowLeft,
  Settings,
  Save,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────
type FileType = 'pdf' | 'doc' | 'xls' | 'img' | 'ppt' | 'other'
type DisplayViewMode = 'grid' | 'list'
type PageViewMode = 'list' | 'upload' | 'detail' | 'settings'

interface Document {
  id: string
  name: string
  category: string
  description: string
  fileType: FileType
  size: string
  uploadedBy: string
  uploadedAt: string
  tags: string[]
  shared: boolean
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  fileType: FileType
  usageCount: number
}

interface SharedDoc {
  id: string
  name: string
  fileType: FileType
  sharedBy: string
  sharedWith: string[]
  permission: 'view' | 'edit' | 'admin'
  sharedAt: string
}

// ─── File type config ─────────────────────────────────────────────────────────
const fileTypeConfig: Record<FileType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pdf: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
  doc: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'DOC' },
  xls: { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'XLS' },
  img: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50', label: 'IMG' },
  ppt: { icon: File, color: 'text-orange-600', bg: 'bg-orange-50', label: 'PPT' },
  other: { icon: File, color: 'text-gray-600', bg: 'bg-gray-50', label: 'OTHER' },
}

const categories = ['All', 'Admissions', 'Academics', 'Finance', 'HR', 'Boarding', 'Legal', 'Correspondence', 'Reports']

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockDocuments: Document[] = [
  { id: '1', name: 'Form_1_Enrollment_Register_2025.pdf', category: 'Admissions', description: 'Official enrollment register for Form 1 students 2025', fileType: 'pdf', size: '2.4 MB', uploadedBy: 'Mrs. Moyo', uploadedAt: '2025-02-28', tags: ['enrollment', 'form-1'], shared: true },
  { id: '2', name: 'Term_1_Exam_Results_Form4.xlsx', category: 'Academics', description: 'Term 1 examination results for Form 4 classes', fileType: 'xls', size: '1.8 MB', uploadedBy: 'Mr. Ndlovu', uploadedAt: '2025-03-15', tags: ['exams', 'form-4', 'term-1'], shared: false },
  { id: '3', name: 'School_Fee_Structure_2025.pdf', category: 'Finance', description: 'Approved fee structure for the 2025 academic year', fileType: 'pdf', size: '540 KB', uploadedBy: 'Mr. Chikumbu', uploadedAt: '2025-01-10', tags: ['fees', '2025'], shared: true },
  { id: '4', name: 'Staff_Contract_Template.docx', category: 'HR', description: 'Standard employment contract template for teaching staff', fileType: 'doc', size: '320 KB', uploadedBy: 'Mrs. Dube', uploadedAt: '2025-01-05', tags: ['contract', 'template', 'hr'], shared: false },
  { id: '5', name: 'Boarding_House_Rules_2025.pdf', category: 'Boarding', description: 'Updated rules and regulations for boarding students', fileType: 'pdf', size: '890 KB', uploadedBy: 'Mr. Gumbo', uploadedAt: '2025-02-01', tags: ['boarding', 'rules'], shared: true },
  { id: '6', name: 'ZIMSEC_Registration_List.pdf', category: 'Academics', description: 'List of students registered for ZIMSEC O-Level examinations', fileType: 'pdf', size: '1.1 MB', uploadedBy: 'Mrs. Zhou', uploadedAt: '2025-03-01', tags: ['zimsec', 'o-level'], shared: false },
  { id: '7', name: 'BEAM_Application_Forms_2025.pdf', category: 'Finance', description: 'BEAM scholarship application forms for eligible students', fileType: 'pdf', size: '750 KB', uploadedBy: 'Ms. Ncube', uploadedAt: '2025-01-20', tags: ['beam', 'scholarship'], shared: true },
  { id: '8', name: 'SDC_Meeting_Minutes_Feb2025.docx', category: 'Correspondence', description: 'Minutes from the SDC meeting held on 15 February 2025', fileType: 'doc', size: '280 KB', uploadedBy: 'Mrs. Sithole', uploadedAt: '2025-02-20', tags: ['sdc', 'meeting'], shared: true },
  { id: '9', name: 'School_Inspiration_Day_Photos.zip', category: 'Academics', description: 'Photos from the annual Inspiration Day event', fileType: 'img', size: '45.2 MB', uploadedBy: 'Mr. Maposa', uploadedAt: '2025-03-10', tags: ['events', 'photos'], shared: false },
  { id: '10', name: 'Quarterly_Financial_Report_Q4.pdf', category: 'Finance', description: 'Financial report for Q4 2024 including budget vs actuals', fileType: 'pdf', size: '1.6 MB', uploadedBy: 'Mr. Chikumbu', uploadedAt: '2025-01-15', tags: ['finance', 'quarterly', 'report'], shared: true },
  { id: '11', name: 'Employment_Contract_Ndhlovu.pdf', category: 'HR', description: 'Signed employment contract for T. Ndlovu', fileType: 'pdf', size: '420 KB', uploadedBy: 'Mrs. Dube', uploadedAt: '2025-02-05', tags: ['contract', 'signed'], shared: false },
  { id: '12', name: 'Transfer_Certificate_Template.pdf', category: 'Legal', description: 'Standard transfer certificate template for outgoing students', fileType: 'pdf', size: '180 KB', uploadedBy: 'Mrs. Moyo', uploadedAt: '2025-01-08', tags: ['transfer', 'template'], shared: false },
  { id: '13', name: 'Term_1_Calendar_Events.xlsx', category: 'Academics', description: 'Calendar of events and key dates for Term 1 2025', fileType: 'xls', size: '340 KB', uploadedBy: 'Mrs. Zhou', uploadedAt: '2025-01-03', tags: ['calendar', 'events'], shared: true },
  { id: '14', name: 'Discipline_Policy_2025.pdf', category: 'Legal', description: 'School discipline policy document for 2025', fileType: 'pdf', size: '560 KB', uploadedBy: 'Mr. Gumbo', uploadedAt: '2025-01-12', tags: ['discipline', 'policy'], shared: true },
  { id: '15', name: 'Parent_Meeting_Invitation.docx', category: 'Correspondence', description: 'Invitation letter for the upcoming parents meeting', fileType: 'doc', size: '150 KB', uploadedBy: 'Mrs. Sithole', uploadedAt: '2025-03-05', tags: ['parents', 'meeting'], shared: false },
  { id: '16', name: 'Annual_School_Report_2024.pdf', category: 'Reports', description: 'Comprehensive annual school report for 2024', fileType: 'pdf', size: '3.8 MB', uploadedBy: 'Headmaster', uploadedAt: '2025-01-30', tags: ['annual', 'report'], shared: true },
]

const mockTemplates: Template[] = [
  { id: 't1', name: 'Transfer Certificate', description: 'Official student transfer certificate for school leaving', category: 'Admissions', fileType: 'pdf', usageCount: 23 },
  { id: 't2', name: 'Character Reference', description: 'Character reference letter template for students', category: 'Admissions', fileType: 'doc', usageCount: 15 },
  { id: 't3', name: 'Fee Statement', description: 'Student fee statement with balance and payment history', category: 'Finance', fileType: 'xls', usageCount: 42 },
  { id: 't4', name: 'Report Card Template', description: 'End of term report card for all grade levels', category: 'Academics', fileType: 'doc', usageCount: 58 },
  { id: 't5', name: 'Admission Letter', description: 'Formal admission acceptance letter for new students', category: 'Admissions', fileType: 'doc', usageCount: 35 },
  { id: 't6', name: 'Employment Contract', description: 'Standard teaching and non-teaching staff contract', category: 'HR', fileType: 'doc', usageCount: 12 },
  { id: 't7', name: 'Leave Application Form', description: 'Staff leave application form with approval sections', category: 'HR', fileType: 'doc', usageCount: 28 },
  { id: 't8', name: 'Expense Claim Form', description: 'Staff expense reimbursement claim template', category: 'Finance', fileType: 'xls', usageCount: 19 },
  { id: 't9', name: 'Incident Report Form', description: 'Discipline and safety incident report form', category: 'Legal', fileType: 'doc', usageCount: 31 },
  { id: 't10', name: 'Boarding Agreement', description: 'Boarding student agreement and consent form', category: 'Boarding', fileType: 'pdf', usageCount: 16 },
  { id: 't11', name: 'Parent Consent Form', description: 'General parent consent form for trips and activities', category: 'Correspondence', fileType: 'doc', usageCount: 44 },
  { id: 't12', name: 'BEAM Application Form', description: 'Government BEAM scholarship application template', category: 'Finance', fileType: 'pdf', usageCount: 22 },
]

const mockSharedDocs: SharedDoc[] = [
  { id: 's1', name: 'Form_1_Enrollment_Register_2025.pdf', fileType: 'pdf', sharedBy: 'Mrs. Moyo', sharedWith: ['Mr. Ndlovu', 'Mrs. Zhou', 'Headmaster'], permission: 'view', sharedAt: '2025-02-28' },
  { id: 's2', name: 'School_Fee_Structure_2025.pdf', fileType: 'pdf', sharedBy: 'Mr. Chikumbu', sharedWith: ['Mrs. Moyo', 'SDC Chair'], permission: 'view', sharedAt: '2025-01-10' },
  { id: 's3', name: 'Term_1_Exam_Results_Form4.xlsx', fileType: 'xls', sharedBy: 'Mr. Ndlovu', sharedWith: ['Mrs. Zhou', 'Headmaster'], permission: 'edit', sharedAt: '2025-03-15' },
  { id: 's4', name: 'SDC_Meeting_Minutes_Feb2025.docx', fileType: 'doc', sharedBy: 'Mrs. Sithole', sharedWith: ['SDC Members', 'Headmaster', 'Mrs. Dube'], permission: 'view', sharedAt: '2025-02-20' },
  { id: 's5', name: 'Quarterly_Financial_Report_Q4.pdf', fileType: 'pdf', sharedBy: 'Mr. Chikumbu', sharedWith: ['Headmaster', 'SDC Treasurer', 'Mrs. Moyo'], permission: 'view', sharedAt: '2025-01-15' },
  { id: 's6', name: 'Discipline_Policy_2025.pdf', fileType: 'pdf', sharedBy: 'Mr. Gumbo', sharedWith: ['All Staff'], permission: 'view', sharedAt: '2025-01-12' },
  { id: 's7', name: 'Boarding_House_Rules_2025.pdf', fileType: 'pdf', sharedBy: 'Mr. Gumbo', sharedWith: ['Boarding Staff', 'Parents'], permission: 'view', sharedAt: '2025-02-01' },
  { id: 's8', name: 'Annual_School_Report_2024.pdf', fileType: 'pdf', sharedBy: 'Headmaster', sharedWith: ['SDC Members', 'Staff', 'Parents'], permission: 'view', sharedAt: '2025-01-30' },
]

const categoryChartData = [
  { name: 'Admissions', count: 28, fill: '#10b981' },
  { name: 'Academics', count: 45, fill: '#14b8a6' },
  { name: 'Finance', count: 32, fill: '#f59e0b' },
  { name: 'HR', count: 18, fill: '#8b5cf6' },
  { name: 'Boarding', count: 12, fill: '#06b6d4' },
  { name: 'Legal', count: 8, fill: '#ef4444' },
  { name: 'Correspondence', count: 22, fill: '#ec4899' },
  { name: 'Reports', count: 15, fill: '#6366f1' },
]

const uploadTrendData = [
  { month: 'Sep', uploads: 12 },
  { month: 'Oct', uploads: 18 },
  { month: 'Nov', uploads: 15 },
  { month: 'Dec', uploads: 22 },
  { month: 'Jan', uploads: 35 },
  { month: 'Feb', uploads: 28 },
  { month: 'Mar', uploads: 19 },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function DocumentsModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<DisplayViewMode>('grid')
  const [pageViewMode, setPageViewMode] = useState<PageViewMode>('list')
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    filename: '',
    category: '',
    description: '',
    tags: '',
  })

  // Settings state
  const [docSettings, setDocSettings] = useState({
    numberingFormat: 'SCH-YYYY-NNN',
    storageProvider: 'LOCAL',
    maxFileSize: '50',
    versionControl: true,
    accessPermissions: 'ROLE_BASED',
    autoBackup: true,
    retentionPeriod: '365',
  })

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  // ─── Inline: Upload Document ─────────────────────────────────────────────
  if (pageViewMode === 'upload') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => setPageViewMode('list')} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button></div>
        <div className="max-w-xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Upload className="h-5 w-5 text-emerald-600" />Upload Document</CardTitle><CardDescription>Add a new document to the school repository</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Filename</Label><Input placeholder="e.g., Term_1_Results_2025.pdf" value={uploadForm.filename} onChange={e => setUploadForm(f => ({ ...f, filename: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Category</Label><Select value={uploadForm.category} onValueChange={v => setUploadForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Description</Label><Input placeholder="Brief description of the document" value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tags (comma separated)</Label><Input placeholder="e.g., enrollment, form-1, 2025" value={uploadForm.tags} onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))} /></div>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center"><Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Drag and drop files here, or click to browse</p><p className="text-xs text-muted-foreground/70 mt-1">Supports PDF, DOC, XLS, IMG, PPT (Max 50MB)</p></div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPageViewMode('list')}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { toast.success('Document uploaded successfully'); setPageViewMode('list') }}>Upload</Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    )
  }

  // ─── Inline: Document Detail ─────────────────────────────────────────────
  if (pageViewMode === 'detail' && selectedDocId) {
    const doc = mockDocuments.find(d => d.id === selectedDocId)
    if (!doc) return null
    const config = fileTypeConfig[doc.fileType]
    const IconComp = config.icon
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => setPageViewMode('list')} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button></div>
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3"><div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', config.bg)}><IconComp className={cn('h-6 w-6', config.color)} /></div><div><CardTitle className="text-xl">{doc.name}</CardTitle><CardDescription>{doc.category} &middot; {doc.fileType.toUpperCase()} &middot; {doc.size}</CardDescription></div></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Uploaded By:</span> <span className="font-medium">{doc.uploadedBy}</span></div>
                <div><span className="text-muted-foreground">Uploaded At:</span> <span className="font-medium">{doc.uploadedAt}</span></div>
                <div><span className="text-muted-foreground">Shared:</span> <Badge variant={doc.shared ? 'default' : 'secondary'} className="text-[10px]">{doc.shared ? 'Yes' : 'No'}</Badge></div>
                <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="text-[10px]">{config.label}</Badge></div>
              </div>
              <Separator />
              <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p><p className="text-sm">{doc.description}</p></div>
              {doc.tags.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Tags</p><div className="flex flex-wrap gap-1">{doc.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div></div>}
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="outline"><Download className="h-4 w-4 mr-2" />Download</Button>
              <Button variant="outline"><Share2 className="h-4 w-4 mr-2" />Share</Button>
              <Button variant="destructive" onClick={() => { toast.success('Document deleted'); setPageViewMode('list') }}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    )
  }

  // ─── Inline: Settings ────────────────────────────────────────────────────
  if (pageViewMode === 'settings') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => setPageViewMode('list')} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button></div>
        <div><h2 className="text-xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-5 w-5 text-gray-500" />Document Settings</h2><p className="text-sm text-muted-foreground mt-1">Configure document templates, numbering, storage, and access</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><LayoutTemplate className="h-4 w-4 text-emerald-600" />Default Templates</CardTitle><CardDescription>Document numbering and templates</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Numbering Format</Label><Input value={docSettings.numberingFormat} onChange={e => setDocSettings(s => ({ ...s, numberingFormat: e.target.value }))} /></div><div className="grid gap-2"><Label className="text-xs">Default Template</Label><Select value="TRANSFER"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TRANSFER">Transfer Certificate</SelectItem><SelectItem value="REPORT">Report Card</SelectItem><SelectItem value="ADMISSION">Admission Letter</SelectItem></SelectContent></Select></div></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><HardDrive className="h-4 w-4 text-teal-600" />Storage Settings</CardTitle><CardDescription>File storage and backup configuration</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Storage Provider</Label><Select value={docSettings.storageProvider} onValueChange={v => setDocSettings(s => ({ ...s, storageProvider: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOCAL">Local Server</SelectItem><SelectItem value="CLOUD">Cloud Storage</SelectItem><SelectItem value="HYBRID">Hybrid (Local + Cloud)</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label className="text-xs">Max File Size (MB)</Label><Input type="number" value={docSettings.maxFileSize} onChange={e => setDocSettings(s => ({ ...s, maxFileSize: e.target.value }))} /></div><div className="flex items-center justify-between"><div><Label className="text-xs">Auto Backup</Label><p className="text-[10px] text-muted-foreground">Automatically backup documents</p></div><Switch checked={docSettings.autoBackup} onCheckedChange={v => setDocSettings(s => ({ ...s, autoBackup: v }))} /></div></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-amber-600" />Access Permissions</CardTitle><CardDescription>Control who can access documents</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Permission Model</Label><Select value={docSettings.accessPermissions} onValueChange={v => setDocSettings(s => ({ ...s, accessPermissions: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ROLE_BASED">Role-Based</SelectItem><SelectItem value="INDIVIDUAL">Individual</SelectItem><SelectItem value="DEPARTMENT">Department-Based</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between"><div><Label className="text-xs">Version Control</Label><p className="text-[10px] text-muted-foreground">Track document versions</p></div><Switch checked={docSettings.versionControl} onCheckedChange={v => setDocSettings(s => ({ ...s, versionControl: v }))} /></div></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-violet-600" />Retention Policy</CardTitle><CardDescription>Document retention and archival</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Retention Period (days)</Label><Input type="number" value={docSettings.retentionPeriod} onChange={e => setDocSettings(s => ({ ...s, retentionPeriod: e.target.value }))} /></div><div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 text-xs text-violet-700">Documents older than the retention period will be automatically archived. Archived documents can still be accessed by administrators.</div></CardContent></Card>
        </div>
        <div className="flex justify-end"><Button onClick={() => { toast.success('Document settings saved successfully') }} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Save className="h-4 w-4 mr-2" />Save Settings</Button></div>
      </motion.div>
    )
  }

  const totalDocs = mockDocuments.length
  const totalCategories = categories.length - 1 // exclude 'All'
  const recentUploads = mockDocuments.filter(d => {
    const date = new Date(d.uploadedAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }).length
  const totalStorageMB = mockDocuments.reduce((acc, d) => {
    const sizeStr = d.size
    if (sizeStr.includes('MB')) return acc + parseFloat(sizeStr)
    if (sizeStr.includes('KB')) return acc + parseFloat(sizeStr) / 1024
    return acc
  }, 0)

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            Document Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Manage school documents, templates, and file sharing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPageViewMode('settings')} className="gap-1.5"><Settings className="h-3.5 w-3.5" /><span className="hidden sm:inline">Settings</span></Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setPageViewMode('upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Shared</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: 'Total Documents', value: String(totalDocs), trend: '+8 this month', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Folder, label: 'Categories', value: String(totalCategories), trend: '8 folders', color: 'text-teal-600', bg: 'bg-teal-50' },
              { icon: Clock, label: 'Recent Uploads', value: String(recentUploads), trend: 'Last 30 days', color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: HardDrive, label: 'Storage Used', value: `${totalStorageMB.toFixed(1)} MB`, trend: 'of 5.0 GB', color: 'text-violet-600', bg: 'bg-violet-50' },
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
            {/* Upload Trend */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upload Trend</CardTitle>
                <CardDescription>Monthly document uploads</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={uploadTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="uploads" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Documents by Category</CardTitle>
                <CardDescription>Distribution across folders</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="count"
                      nameKey="name"
                      paddingAngle={2}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {categoryChartData.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Documents & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Documents */}
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Documents</CardTitle>
                  <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => setActiveTab('documents')}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDocuments.slice(0, 6).map((doc) => {
                    const config = fileTypeConfig[doc.fileType]
                    const IconComp = config.icon
                    return (
                      <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', config.bg)}>
                          <IconComp className={cn('h-4 w-4', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.category} &middot; {doc.uploadedBy} &middot; {doc.size}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.shared && (
                            <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-50 text-emerald-700">Shared</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions & Category Summary */}
            <div className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: Upload, label: 'Upload Document', desc: 'Add a new file' },
                    { icon: LayoutTemplate, label: 'Browse Templates', desc: 'Use a document template' },
                    { icon: Share2, label: 'Shared Files', desc: 'View shared documents' },
                    { icon: Download, label: 'Export All', desc: 'Download document index' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                        <action.icon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.desc}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Used</span>
                      <span className="font-medium">{totalStorageMB.toFixed(1)} MB / 5.0 GB</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(totalStorageMB / 5120) * 100}%` }} />
                    </div>
                    <div className="space-y-2">
                      {[
                        { type: 'PDF', size: '38.2 MB', color: 'bg-red-400' },
                        { type: 'DOC', size: '12.5 MB', color: 'bg-blue-400' },
                        { type: 'XLS', size: '8.7 MB', color: 'bg-emerald-400' },
                        { type: 'IMG', size: '45.2 MB', color: 'bg-purple-400' },
                      ].map((item) => (
                        <div key={item.type} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className={cn('h-2 w-2 rounded-full', item.color)} />
                            <span>{item.type}</span>
                          </div>
                          <span className="text-muted-foreground">{item.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Documents Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          {/* Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents, tags, descriptions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </Badge>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Folder Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.filter(c => c !== 'All').map((cat) => (
              <button
                key={cat}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
              >
                <FolderOpen className="h-3 w-3" />
                {cat}
              </button>
            ))}
          </div>

          {/* Documents Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => {
                const config = fileTypeConfig[doc.fileType]
                const IconComp = config.icon
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', config.bg)}>
                            <IconComp className={cn('h-6 w-6', config.color)} />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedDocId(doc.id); setPageViewMode('detail') }}><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                              <DropdownMenuItem><Download className="mr-2 h-3.5 w-3.5" /> Download</DropdownMenuItem>
                              <DropdownMenuItem><Share2 className="mr-2 h-3.5 w-3.5" /> Share</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary" className="text-[10px] h-5">{doc.category}</Badge>
                          <Badge variant="outline" className="text-[10px] h-5">{config.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>{doc.size}</span>
                          <span>{doc.uploadedAt}</span>
                        </div>
                        {doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                                <Tag className="h-2.5 w-2.5" />{tag}
                              </span>
                            ))}
                            {doc.tags.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left text-xs font-medium text-muted-foreground p-3">Name</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Category</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Size</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Uploaded By</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3">Date</th>
                        <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => {
                        const config = fileTypeConfig[doc.fileType]
                        const IconComp = config.icon
                        return (
                          <tr key={doc.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', config.bg)}>
                                  <IconComp className={cn('h-4 w-4', config.color)} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate max-w-[200px]">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 hidden sm:table-cell">
                              <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{doc.size}</td>
                            <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{doc.uploadedBy}</td>
                            <td className="p-3 text-sm text-muted-foreground">{doc.uploadedAt}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedDocId(doc.id); setPageViewMode('detail') }}><Eye className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Share2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No documents found matching your criteria</p>
              <Button variant="outline" className="mt-3" onClick={() => { setSearchQuery(''); setSelectedCategory('All') }}>
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ─── Templates Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTemplates.map((template) => {
              const config = fileTypeConfig[template.fileType]
              const IconComp = config.icon
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', config.bg)}>
                          <IconComp className={cn('h-5 w-5', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] h-5">{template.category}</Badge>
                          <span className="text-xs text-muted-foreground">Used {template.usageCount}x</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <LayoutTemplate className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* ─── Shared Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="shared" className="space-y-4 mt-4">
          {/* Shared Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Share2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockSharedDocs.length}</p>
                  <p className="text-xs text-muted-foreground">Shared Documents</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                  <Eye className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockSharedDocs.filter(d => d.permission === 'view').length}</p>
                  <p className="text-xs text-muted-foreground">View Only</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockSharedDocs.filter(d => d.permission === 'edit').length}</p>
                  <p className="text-xs text-muted-foreground">Can Edit</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shared Documents List */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Shared Documents</CardTitle>
              <CardDescription>Documents shared with other users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSharedDocs.map((doc) => {
                  const config = fileTypeConfig[doc.fileType]
                  const IconComp = config.icon
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', config.bg)}>
                        <IconComp className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Shared by {doc.sharedBy}</span>
                          <span className="text-xs text-muted-foreground">&middot; {doc.sharedAt}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {doc.sharedWith.map((person, idx) => (
                            <Avatar key={idx} className="h-5 w-5 border border-background">
                              <AvatarFallback className="text-[8px] bg-muted">{person.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">
                            {doc.sharedWith.join(', ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] h-5',
                            doc.permission === 'view' ? 'bg-blue-50 text-blue-700' :
                            doc.permission === 'edit' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-amber-50 text-amber-700'
                          )}
                        >
                          {doc.permission === 'view' ? <Eye className="h-2.5 w-2.5 mr-1" /> :
                           doc.permission === 'edit' ? <Lock className="h-2.5 w-2.5 mr-1" /> :
                           <Shield className="h-2.5 w-2.5 mr-1" />}
                          {doc.permission.charAt(0).toUpperCase() + doc.permission.slice(1)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                            <DropdownMenuItem><Shield className="mr-2 h-3.5 w-3.5" /> Change Permission</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Revoke Access</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
