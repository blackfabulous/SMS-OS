'use client'

import {
  ModulePageLayout,
  ModuleSettingsButton,
  ModuleContainer,
  StatGrid,
  ModuleStatCard,
  SectionCard,
} from '@/components/module-ui';
import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
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

// ─── API mapping (live data ↔ /api/documents) ───────────────────────────────
const FILETYPE_FROM_API: Record<string, FileType> = { PDF: 'pdf', DOC: 'doc', DOCX: 'doc', XLS: 'xls', XLSX: 'xls', CSV: 'xls', IMG: 'img', PNG: 'img', JPG: 'img', JPEG: 'img', ZIP: 'img', PPT: 'ppt', PPTX: 'ppt' }
function normalizeFileType(t: string | null | undefined): FileType {
  if (!t) return 'other'
  return FILETYPE_FROM_API[t.toUpperCase()] || 'other'
}
function fileTypeFromName(name: string): string {
  const ext = (name.split('.').pop() || '').toUpperCase()
  return ext || 'PDF'
}
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function parseTags(s: string | null | undefined): string[] {
  return s ? s.split(/[,|]/).map((x) => x.trim()).filter(Boolean) : []
}
interface ApiDocument { id: string; title: string; fileName: string | null; category: string; description: string | null; fileType: string; fileSize: number; uploadedBy: string | null; tags: string | null; createdAt: string }
interface DocStats { totalDocuments: number; templates: number; categories: number; totalSize: number }
function apiToDocument(d: ApiDocument): Document {
  return { id: d.id, name: d.fileName || d.title, category: d.category, description: d.description ?? '', fileType: normalizeFileType(d.fileType), size: formatBytes(d.fileSize), uploadedBy: d.uploadedBy ?? '—', uploadedAt: (d.createdAt ?? '').slice(0, 10), tags: parseTags(d.tags), shared: false }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

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
  const [documents, setDocuments] = useState<Document[]>([])
  const [docStats, setDocStats] = useState<DocStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/documents?limit=200')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load documents')
      setDocuments((json.data || []).map(apiToDocument))
      setDocStats(json.stats || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleUpload = async () => {
    if (!uploadForm.filename) { toast.error('Filename is required'); return }
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: uploadForm.filename, fileName: uploadForm.filename, category: uploadForm.category || 'GENERAL', description: uploadForm.description, tags: uploadForm.tags, fileType: fileTypeFromName(uploadForm.filename), fileSize: 0 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add document')
      await fetchDocuments()
      setUploadForm({ filename: '', category: '', description: '', tags: '' })
      setPageViewMode('list')
      toast.success('Document added successfully')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add document')
    }
  }

  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete document')
      await fetchDocuments()
      setPageViewMode('list')
      toast.success('Document deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete document')
    }
  }

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [documents, searchQuery, selectedCategory])

  const categoryChartData = useMemo(() => {
    const palette = ['#10b981', '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899', '#6366f1']
    const counts = new Map<string, number>()
    documents.forEach((d) => counts.set(d.category, (counts.get(d.category) || 0) + 1))
    return Array.from(counts.entries()).map(([name, count], i) => ({ name, count, fill: palette[i % palette.length] }))
  }, [documents])

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
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleUpload}>Upload</Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    )
  }

  // ─── Inline: Document Detail ─────────────────────────────────────────────
  if (pageViewMode === 'detail' && selectedDocId) {
    const doc = documents.find(d => d.id === selectedDocId)
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
              <Button variant="destructive" onClick={() => handleDeleteDoc(doc.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
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
          <SectionCard title="Default Templates" description="Document numbering and templates" icon={LayoutTemplate}><div className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Numbering Format</Label><Input value={docSettings.numberingFormat} onChange={e => setDocSettings(s => ({ ...s, numberingFormat: e.target.value }))} /></div><div className="grid gap-2"><Label className="text-xs">Default Template</Label><Select value="TRANSFER"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TRANSFER">Transfer Certificate</SelectItem><SelectItem value="REPORT">Report Card</SelectItem><SelectItem value="ADMISSION">Admission Letter</SelectItem></SelectContent></Select></div></div></SectionCard>
          <SectionCard title="Storage Settings" description="File storage and backup configuration" icon={HardDrive}><div className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Storage Provider</Label><Select value={docSettings.storageProvider} onValueChange={v => setDocSettings(s => ({ ...s, storageProvider: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOCAL">Local Server</SelectItem><SelectItem value="CLOUD">Cloud Storage</SelectItem><SelectItem value="HYBRID">Hybrid (Local + Cloud)</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label className="text-xs">Max File Size (MB)</Label><Input type="number" value={docSettings.maxFileSize} onChange={e => setDocSettings(s => ({ ...s, maxFileSize: e.target.value }))} /></div><div className="flex items-center justify-between"><div><Label className="text-xs">Auto Backup</Label><p className="text-[10px] text-muted-foreground">Automatically backup documents</p></div><Switch checked={docSettings.autoBackup} onCheckedChange={v => setDocSettings(s => ({ ...s, autoBackup: v }))} /></div></div></SectionCard>
          <SectionCard title="Access Permissions" description="Control who can access documents" icon={Shield}><div className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Permission Model</Label><Select value={docSettings.accessPermissions} onValueChange={v => setDocSettings(s => ({ ...s, accessPermissions: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ROLE_BASED">Role-Based</SelectItem><SelectItem value="INDIVIDUAL">Individual</SelectItem><SelectItem value="DEPARTMENT">Department-Based</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between"><div><Label className="text-xs">Version Control</Label><p className="text-[10px] text-muted-foreground">Track document versions</p></div><Switch checked={docSettings.versionControl} onCheckedChange={v => setDocSettings(s => ({ ...s, versionControl: v }))} /></div></div></SectionCard>
          <SectionCard title="Retention Policy" description="Document retention and archival" icon={Clock}><div className="space-y-4"><div className="grid gap-2"><Label className="text-xs">Retention Period (days)</Label><Input type="number" value={docSettings.retentionPeriod} onChange={e => setDocSettings(s => ({ ...s, retentionPeriod: e.target.value }))} /></div><div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 text-xs text-violet-700">Documents older than the retention period will be automatically archived. Archived documents can still be accessed by administrators.</div></div></SectionCard>
        </div>
        <div className="flex justify-end"><Button onClick={() => { toast.success('Document settings saved successfully') }} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Save className="h-4 w-4 mr-2" />Save Settings</Button></div>
      </motion.div>
    )
  }

  const totalDocs = docStats?.totalDocuments ?? documents.length
  const totalCategories = docStats?.categories ?? (categories.length - 1)
  const recentUploads = documents.filter(d => {
    const date = new Date(d.uploadedAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }).length
  const totalStorageMB = (docStats?.totalSize ?? 0) / (1024 * 1024)

  if (loading && documents.length === 0) {
    return <ModuleContainer><div className="py-20 text-center text-sm text-muted-foreground">Loading documents…</div></ModuleContainer>
  }

  return (
    <ModuleContainer>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error} · <button onClick={() => fetchDocuments()} className="underline underline-offset-2">retry</button>
        </div>
      )}
<ModulePageLayout
        actions={<>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setPageViewMode('upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <ModuleSettingsButton onClick={() => setPageViewMode('settings')} />
        </>}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={<>
            <TabsTrigger value="overview"><span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="documents"><span className="hidden sm:inline">Documents</span></TabsTrigger>
            <TabsTrigger value="templates"><span className="hidden sm:inline">Templates</span></TabsTrigger>
            <TabsTrigger value="shared"><span className="hidden sm:inline">Shared</span></TabsTrigger>
          </>}
      >


        {/* ─── Overview Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats Cards */}
          <StatGrid cols={4}>
            {[
              { icon: FileText, label: 'Total Documents', value: String(totalDocs), hint: '+8 this month', accentGradient: 'from-emerald-400 to-teal-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-600' },
              { icon: Folder, label: 'Categories', value: String(totalCategories), hint: '8 folders', accentGradient: 'from-teal-400 to-cyan-500', bgColor: 'bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-600' },
              { icon: Clock, label: 'Recent Uploads', value: String(recentUploads), hint: 'Last 30 days', accentGradient: 'from-amber-400 to-orange-500', bgColor: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-600' },
              { icon: HardDrive, label: 'Storage Used', value: `${totalStorageMB.toFixed(1)} MB`, hint: 'of 5.0 GB', accentGradient: 'from-violet-400 to-purple-500', bgColor: 'bg-violet-50 dark:bg-violet-950/40', iconColor: 'text-violet-600' },
            ].map((stat, i) => (
              <ModuleStatCard
                key={stat.label}
                index={i}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                accentGradient={stat.accentGradient}
                bgColor={stat.bgColor}
                iconColor={stat.iconColor}
              />
            ))}
          </StatGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Trend */}
            <SectionCard title="Upload Trend" description="Monthly document uploads" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={uploadTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="uploads" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* Category Distribution */}
            <SectionCard title="Documents by Category" description="Distribution across folders" icon={Folder}>
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
            </SectionCard>
          </div>

          {/* Recent Documents & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Documents */}
            <SectionCard
              className="lg:col-span-2"
              title="Recent Documents"
              icon={FileText}
              actions={
                <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => setActiveTab('documents')}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              }
            >
                <div className="space-y-3">
                  {documents.slice(0, 6).map((doc) => {
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
            </SectionCard>

            {/* Quick Actions & Category Summary */}
            <div className="space-y-4">
              <SectionCard title="Quick Actions" icon={Plus}>
                <div className="space-y-2">
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
                </div>
              </SectionCard>

              <SectionCard title="Storage Usage" icon={HardDrive}>
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
              </SectionCard>
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
            <SectionCard noPadding>
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
            </SectionCard>
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
          <StatGrid cols={3}>
            <ModuleStatCard
              index={0}
              icon={Share2}
              label="Shared Documents"
              value={mockSharedDocs.length}
              accentGradient="from-emerald-400 to-teal-500"
              bgColor="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600"
            />
            <ModuleStatCard
              index={1}
              icon={Eye}
              label="View Only"
              value={mockSharedDocs.filter(d => d.permission === 'view').length}
              accentGradient="from-teal-400 to-cyan-500"
              bgColor="bg-teal-50 dark:bg-teal-950/40"
              iconColor="text-teal-600"
            />
            <ModuleStatCard
              index={2}
              icon={Shield}
              label="Can Edit"
              value={mockSharedDocs.filter(d => d.permission === 'edit').length}
              accentGradient="from-amber-400 to-orange-500"
              bgColor="bg-amber-50 dark:bg-amber-950/40"
              iconColor="text-amber-600"
            />
          </StatGrid>

          {/* Shared Documents List */}
          <SectionCard title="Shared Documents" description="Documents shared with other users and their permissions" icon={Share2}>
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
          </SectionCard>
        </TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}
