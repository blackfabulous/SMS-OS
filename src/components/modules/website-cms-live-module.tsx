'use client'

/**
 * Website CMS — real, DB-backed editor for the public marketing site.
 * Every tab reads from and writes to /api/website-cms (Partner / SiteTheme /
 * NewsArticle / GalleryImage). Replaces the previous mock module.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Globe, Palette, Newspaper, Camera, Handshake, Plus, Trash2, Save,
  Loader2, ExternalLink, Eye, EyeOff, GripVertical, RefreshCw,
  Info, GraduationCap, HelpCircle, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ModuleContainer, SectionCard, ModuleToolbar, ModulePageLayout } from '@/components/module-ui'

// ─── Types mirroring the API payloads ───────────────────────────────────────
interface Partner { id: string; name: string; logoUrl: string | null; websiteUrl: string | null; category: string; sortOrder: number; isActive: boolean }
interface NewsItem { id: string; title: string; slug: string; excerpt: string | null; content: string; category: string; isPublished: boolean; isFeatured: boolean }
interface GalleryItem { id: string; title: string | null; imageUrl: string; category: string; isFeatured: boolean }
interface StaffItem { id: string; title: string | null; firstName: string; lastName: string; position: string; department: string | null; qualifications: string | null; photo: string | null; showOnWebsite: boolean; websiteBio: string | null; websiteOrder: number }
interface FaqItem { id: string; question: string; answer: string; category: string; sortOrder: number; isActive: boolean }
interface SeoItem {
  id: string; pageSlug: string
  metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null
  ogTitle: string | null; ogDescription: string | null; ogImage: string | null
  canonicalUrl: string | null; schemaMarkup: string | null; robotsDirective: string
}
interface ThemeRow {
  primaryColor: string; secondaryColor: string; accentColor: string; darkColor: string
  headingFont: string; bodyFont: string; radius: string
  heroImageUrl: string; heroBadge: string | null; heroHeadline: string | null; heroMotto: string | null; heroSubtitle: string | null
  heroPrimaryLabel: string; heroPrimaryHref: string; heroSecondaryLabel: string; heroSecondaryHref: string
  overlayFrom: string; overlayTo: string; overlayOpacity: number
  statsJson: string; valuesJson: string; testimonialsJson: string
  aboutHistory: string | null; missionText: string | null; visionText: string | null
  showStats: boolean; showPartners: boolean; showValues: boolean; showGallery: boolean; showTestimonials: boolean; showNews: boolean; showEvents: boolean
}

const ICON_OPTIONS = ['ShieldCheck', 'Lightbulb', 'Heart', 'Target', 'GraduationCap', 'Users', 'Award', 'BookOpen', 'Microscope', 'Globe2', 'Trophy', 'HeartHandshake', 'Sparkles']

async function api(method: string, body?: unknown) {
  const res = await fetch('/api/website-cms', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.success === false) throw new Error(json?.error || `Request failed (${res.status})`)
  return json.data
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export default function WebsiteCMSLiveModule() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('hero')
  const [theme, setTheme] = useState<ThemeRow | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [seo, setSeo] = useState<SeoItem[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/website-cms?section=all')
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to load')
      const d = json.data
      setTheme(d.theme ?? null)
      setPartners(d.partners ?? [])
      setNews(d.news ?? [])
      setGallery(d.gallery ?? [])
      setStaff(d.staff ?? [])
      setFaqs(d.faqs ?? [])
      setSeo(d.seo ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load CMS data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading website content…</div>
  }

  return (
    <ModuleContainer>
      <ModuleToolbar
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
            <a href="/" target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> View site</Button></a>
          </div>
        }
      />

      <ModulePageLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={
          <>
            <TabsTrigger value="hero">Hero &amp; Theme</TabsTrigger>
            <TabsTrigger value="content">Home Content</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </>
        }
      >

        <TabsContent value="hero" className="mt-4"><HeroThemeTab theme={theme} onSaved={setTheme} /></TabsContent>
        <TabsContent value="content" className="mt-4"><HomeContentTab theme={theme} onSaved={setTheme} /></TabsContent>
        <TabsContent value="about" className="mt-4"><AboutTab theme={theme} onSaved={setTheme} /></TabsContent>
        <TabsContent value="staff" className="mt-4"><StaffTab staff={staff} reload={load} /></TabsContent>
        <TabsContent value="faqs" className="mt-4"><FaqsTab faqs={faqs} reload={load} /></TabsContent>
        <TabsContent value="partners" className="mt-4"><PartnersTab partners={partners} reload={load} /></TabsContent>
        <TabsContent value="news" className="mt-4"><NewsTab news={news} reload={load} /></TabsContent>
        <TabsContent value="gallery" className="mt-4"><GalleryTab gallery={gallery} reload={load} /></TabsContent>
        <TabsContent value="seo" className="mt-4"><SeoTab seo={seo} reload={load} /></TabsContent>
      </ModulePageLayout>
    </ModuleContainer>
  )
}

// ─── Hero & Theme ────────────────────────────────────────────────────────────
const THEME_FALLBACK: ThemeRow = {
  primaryColor: '#047857', secondaryColor: '#0f766e', accentColor: '#facc15', darkColor: '#022c22',
  headingFont: 'Geist', bodyFont: 'Geist', radius: '0.75rem',
  heroImageUrl: '/images/campus-hero.jpg', heroBadge: '', heroHeadline: '', heroMotto: '', heroSubtitle: '',
  heroPrimaryLabel: 'Apply for Admission', heroPrimaryHref: '/admissions/apply', heroSecondaryLabel: 'Discover Our School', heroSecondaryHref: '/about',
  overlayFrom: '#022c22', overlayTo: '#134e4a', overlayOpacity: 80,
  statsJson: '[]', valuesJson: '[]', testimonialsJson: '[]',
  aboutHistory: '', missionText: '', visionText: '',
  showStats: true, showPartners: true, showValues: true, showGallery: true, showTestimonials: true, showNews: true, showEvents: true,
}

function HeroThemeTab({ theme, onSaved }: { theme: ThemeRow | null; onSaved: (t: ThemeRow) => void }) {
  const [form, setForm] = useState<ThemeRow>({ ...THEME_FALLBACK, ...(theme ?? {}) })
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof ThemeRow>(k: K, v: ThemeRow[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      // statsJson/values/testimonials live on the Home Content tab; about prose on the About tab.
      const { statsJson, valuesJson, testimonialsJson, aboutHistory, missionText, visionText, ...rest } = form
      void statsJson; void valuesJson; void testimonialsJson; void aboutHistory; void missionText; void visionText
      const saved = await api('PUT', { action: 'updateTheme', data: rest })
      onSaved(saved)
      toast.success('Theme & hero saved — refresh the site to see changes')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed') } finally { setSaving(false) }
  }

  const colorField = (label: string, key: keyof ThemeRow) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={String(form[key])} onChange={(e) => set(key, e.target.value as ThemeRow[typeof key])} className="h-9 w-12 cursor-pointer rounded border" />
        <Input value={String(form[key])} onChange={(e) => set(key, e.target.value as ThemeRow[typeof key])} className="font-mono text-xs" />
      </div>
    </div>
  )

  const toggles: [keyof ThemeRow, string][] = [
    ['showStats', 'Stats'], ['showPartners', 'Partners'], ['showValues', 'Why-Choose-Us'], ['showGallery', 'Gallery'],
    ['showTestimonials', 'Testimonials'], ['showNews', 'News'], ['showEvents', 'Events'],
  ]

  return (
    <div className="space-y-4">
      <SectionCard title="Hero section" description="The full-screen banner at the top of the home page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Background image URL</Label><Input value={form.heroImageUrl} onChange={(e) => set('heroImageUrl', e.target.value)} placeholder="/images/campus-hero.jpg" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Badge / eyebrow</Label><Input value={form.heroBadge ?? ''} onChange={(e) => set('heroBadge', e.target.value)} placeholder="Harare · Est. 1985" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Headline (blank = school name)</Label><Input value={form.heroHeadline ?? ''} onChange={(e) => set('heroHeadline', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Motto (blank = school motto)</Label><Input value={form.heroMotto ?? ''} onChange={(e) => set('heroMotto', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Subtitle</Label><Input value={form.heroSubtitle ?? ''} onChange={(e) => set('heroSubtitle', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Primary button label</Label><Input value={form.heroPrimaryLabel} onChange={(e) => set('heroPrimaryLabel', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Primary button link</Label><Input value={form.heroPrimaryHref} onChange={(e) => set('heroPrimaryHref', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Secondary button label</Label><Input value={form.heroSecondaryLabel} onChange={(e) => set('heroSecondaryLabel', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Secondary button link</Label><Input value={form.heroSecondaryHref} onChange={(e) => set('heroSecondaryHref', e.target.value)} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Colour overlay" description="Tints the hero image so text stays readable.">
        <div className="grid gap-4 sm:grid-cols-3">
          {colorField('Overlay from', 'overlayFrom')}
          {colorField('Overlay to', 'overlayTo')}
          <div className="space-y-1.5"><Label className="text-xs">Overlay opacity ({form.overlayOpacity}%)</Label><Input type="range" min={0} max={100} value={form.overlayOpacity} onChange={(e) => set('overlayOpacity', Number(e.target.value))} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Brand theme" description="Colours, fonts and corner radius applied across the public site.">
        <div className="grid gap-4 sm:grid-cols-4">
          {colorField('Primary', 'primaryColor')}
          {colorField('Secondary', 'secondaryColor')}
          {colorField('Accent', 'accentColor')}
          {colorField('Dark', 'darkColor')}
          <div className="space-y-1.5"><Label className="text-xs">Heading font</Label><Input value={form.headingFont} onChange={(e) => set('headingFont', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Body font</Label><Input value={form.bodyFont} onChange={(e) => set('bodyFont', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Corner radius</Label><Input value={form.radius} onChange={(e) => set('radius', e.target.value)} placeholder="0.75rem" /></div>
        </div>
      </SectionCard>

      <SectionCard title="Home section visibility" description="Show or hide each block on the home page.">
        <div className="flex flex-wrap gap-4">
          {toggles.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <Switch checked={Boolean(form[key])} onCheckedChange={(v) => set(key, v as ThemeRow[typeof key])} />
              {label}
            </label>
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save hero &amp; theme
        </Button>
      </div>
    </div>
  )
}

// ─── Home Content (stats / values / testimonials) ─────────────────────────────
function parseArr<T>(raw: string | undefined): T[] { try { const v = JSON.parse(raw || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }

function HomeContentTab({ theme, onSaved }: { theme: ThemeRow | null; onSaved: (t: ThemeRow) => void }) {
  const [stats, setStats] = useState(() => parseArr<{ value: string; label: string }>(theme?.statsJson))
  const [values, setValues] = useState(() => parseArr<{ icon: string; title: string; desc: string }>(theme?.valuesJson))
  const [testimonials, setTestimonials] = useState(() => parseArr<{ quote: string; name: string; role: string }>(theme?.testimonialsJson))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const saved = await api('PUT', { action: 'updateTheme', data: { statsJson: JSON.stringify(stats), valuesJson: JSON.stringify(values), testimonialsJson: JSON.stringify(testimonials) } })
      onSaved(saved)
      toast.success('Home content saved')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Statistics (shown in the hero)" description="Use tokens {students}, {staff} or {years} to pull live numbers.">
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={s.value} onChange={(e) => setStats((a) => a.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="96% or {students}" className="w-40" />
              <Input value={s.label} onChange={(e) => setStats((a) => a.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Label" />
              <Button variant="ghost" size="icon" onClick={() => setStats((a) => a.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setStats((a) => [...a, { value: '', label: '' }])} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add stat</Button>
        </div>
      </SectionCard>

      <SectionCard title="Why-Choose-Us values">
        <div className="space-y-3">
          {values.map((v, i) => (
            <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[10rem_1fr_auto]">
              <select value={v.icon} onChange={(e) => setValues((a) => a.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} className="h-9 rounded-md border bg-background px-2 text-sm">
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <Input value={v.title} onChange={(e) => setValues((a) => a.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Title" />
              <Button variant="ghost" size="icon" onClick={() => setValues((a) => a.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              <Textarea value={v.desc} onChange={(e) => setValues((a) => a.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="Description" rows={2} className="sm:col-span-3" />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setValues((a) => [...a, { icon: 'ShieldCheck', title: '', desc: '' }])} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add value</Button>
        </div>
      </SectionCard>

      <SectionCard title="Testimonials">
        <div className="space-y-3">
          {testimonials.map((t, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <Textarea value={t.quote} onChange={(e) => setTestimonials((a) => a.map((x, j) => j === i ? { ...x, quote: e.target.value } : x))} placeholder="Quote" rows={2} />
              <div className="flex items-center gap-2">
                <Input value={t.name} onChange={(e) => setTestimonials((a) => a.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name" />
                <Input value={t.role} onChange={(e) => setTestimonials((a) => a.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} placeholder="Role" />
                <Button variant="ghost" size="icon" onClick={() => setTestimonials((a) => a.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setTestimonials((a) => [...a, { quote: '', name: '', role: '' }])} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add testimonial</Button>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save home content
        </Button>
      </div>
    </div>
  )
}

// ─── Partners ─────────────────────────────────────────────────────────────────
function PartnersTab({ partners, reload }: { partners: Partner[]; reload: () => void }) {
  const [draft, setDraft] = useState({ name: '', logoUrl: '', websiteUrl: '', category: 'ACCREDITATION' })
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!draft.name.trim()) { toast.error('Name is required'); return }
    setBusy(true)
    try {
      await api('POST', { action: 'createPartner', data: { ...draft, sortOrder: partners.length } })
      setDraft({ name: '', logoUrl: '', websiteUrl: '', category: 'ACCREDITATION' })
      toast.success('Partner added'); reload()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const toggle = async (p: Partner) => { try { await api('PUT', { action: 'updatePartner', id: p.id, data: { isActive: !p.isActive } }); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }
  const remove = async (p: Partner) => { if (!confirm(`Delete "${p.name}"?`)) return; try { await api('DELETE', { action: 'deletePartner', id: p.id }); toast.success('Deleted'); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }

  return (
    <div className="space-y-4">
      <SectionCard title="Add partner / accreditation" description="Leave the logo URL blank to show a text badge.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. ZIMSEC" />
          <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="ACCREDITATION">Accreditation</option><option value="PARTNER">Partner</option><option value="AFFILIATION">Affiliation</option>
          </select>
          <Input value={draft.logoUrl} onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))} placeholder="Logo image URL (optional)" />
          <Input value={draft.websiteUrl} onChange={(e) => setDraft((d) => ({ ...d, websiteUrl: e.target.value }))} placeholder="Website URL (optional)" />
          <div className="sm:col-span-2"><Button onClick={add} disabled={busy} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add partner</Button></div>
        </div>
      </SectionCard>

      <div className="space-y-2">
        {partners.length === 0 && <p className="text-sm text-muted-foreground">No partners yet.</p>}
        {partners.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            {p.logoUrl
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.logoUrl} alt={p.name} className="h-8 w-auto object-contain" />
              : <span className="font-semibold uppercase tracking-wide text-sm">{p.name}</span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggle(p)} title={p.isActive ? 'Active' : 'Hidden'}>{p.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── News ─────────────────────────────────────────────────────────────────────
function NewsTab({ news, reload }: { news: NewsItem[]; reload: () => void }) {
  const [draft, setDraft] = useState({ title: '', excerpt: '', content: '', category: 'GENERAL', isPublished: true })
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!draft.title.trim() || !draft.content.trim()) { toast.error('Title and content are required'); return }
    setBusy(true)
    try {
      await api('POST', { action: 'createNews', data: { ...draft, slug: slugify(draft.title) } })
      setDraft({ title: '', excerpt: '', content: '', category: 'GENERAL', isPublished: true })
      toast.success('Article created'); reload()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const togglePublish = async (n: NewsItem) => { try { await api('PUT', { action: 'updateNews', id: n.id, data: { isPublished: !n.isPublished } }); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }
  const remove = async (n: NewsItem) => { if (!confirm(`Delete "${n.title}"?`)) return; try { await api('DELETE', { action: 'deleteNews', id: n.id }); toast.success('Deleted'); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }

  return (
    <div className="space-y-4">
      <SectionCard title="Publish news article">
        <div className="space-y-3">
          <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Headline" />
          <div className="flex gap-3">
            <Input value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} placeholder="Category" className="w-48" />
            <label className="flex items-center gap-2 text-sm"><Switch checked={draft.isPublished} onCheckedChange={(v) => setDraft((d) => ({ ...d, isPublished: v }))} /> Publish now</label>
          </div>
          <Textarea value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))} placeholder="Short excerpt" rows={2} />
          <Textarea value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} placeholder="Full article content" rows={5} />
          <Button onClick={add} disabled={busy} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create article</Button>
        </div>
      </SectionCard>

      <div className="space-y-2">
        {news.length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
        {news.map((n) => (
          <div key={n.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{n.title}</p>
              <div className="mt-1 flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{n.category}</Badge><Badge variant={n.isPublished ? 'default' : 'secondary'} className="text-[10px]">{n.isPublished ? 'Published' : 'Draft'}</Badge></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => togglePublish(n)} title={n.isPublished ? 'Unpublish' : 'Publish'}>{n.isPublished ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => remove(n)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Gallery ────────────────────────────────────────────────────────────────
function GalleryTab({ gallery, reload }: { gallery: GalleryItem[]; reload: () => void }) {
  const [draft, setDraft] = useState({ title: '', imageUrl: '', category: 'GENERAL' })
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!draft.title.trim() || !draft.imageUrl.trim()) { toast.error('Title and image URL are required'); return }
    setBusy(true)
    try {
      await api('POST', { action: 'uploadGalleryImage', data: { ...draft, sortOrder: gallery.length } })
      setDraft({ title: '', imageUrl: '', category: 'GENERAL' })
      toast.success('Image added'); reload()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const remove = async (g: GalleryItem) => { if (!confirm('Delete this image?')) return; try { await api('DELETE', { action: 'deleteGalleryImage', id: g.id }); toast.success('Deleted'); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }

  return (
    <div className="space-y-4">
      <SectionCard title="Add gallery image">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" />
          <Input value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} placeholder="Category" />
          <Input value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} placeholder="Image URL" className="sm:col-span-2" />
          <div className="sm:col-span-2"><Button onClick={add} disabled={busy} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add image</Button></div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {gallery.length === 0 && <p className="text-sm text-muted-foreground">No images yet.</p>}
        {gallery.map((g) => (
          <figure key={g.id} className="group relative overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.imageUrl} alt={g.title ?? ''} className="aspect-square w-full object-cover" />
            <button onClick={() => remove(g)} className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1.5 opacity-0 transition group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-white" /></button>
          </figure>
        ))}
      </div>
    </div>
  )
}

// ─── About page prose ─────────────────────────────────────────────────────────
function AboutTab({ theme, onSaved }: { theme: ThemeRow | null; onSaved: (t: ThemeRow) => void }) {
  const [aboutHistory, setAboutHistory] = useState(theme?.aboutHistory ?? '')
  const [missionText, setMissionText] = useState(theme?.missionText ?? '')
  const [visionText, setVisionText] = useState(theme?.visionText ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const saved = await api('PUT', { action: 'updateTheme', data: { aboutHistory, missionText, visionText } })
      onSaved(saved)
      toast.success('About page content saved')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Heritage / history" description="The “A proud heritage” story on the About page. Leave blank to use the built-in default. Each blank line starts a new paragraph.">
        <Textarea value={aboutHistory} onChange={(e) => setAboutHistory(e.target.value)} rows={6} placeholder="Our school was established in…" />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Mission statement" description="Blank = built-in default.">
          <Textarea value={missionText} onChange={(e) => setMissionText(e.target.value)} rows={4} placeholder="To provide holistic, quality education…" />
        </SectionCard>
        <SectionCard title="Vision statement" description="Blank = built-in default.">
          <Textarea value={visionText} onChange={(e) => setVisionText(e.target.value)} rows={4} placeholder="To be a leading centre of excellence…" />
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save About content
        </Button>
      </div>
    </div>
  )
}

// ─── Staff (public team section) ──────────────────────────────────────────────
function StaffTab({ staff, reload }: { staff: StaffItem[]; reload: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Record<string, { websiteBio: string; websiteOrder: number }>>({})

  const fullName = (s: StaffItem) => [s.title, s.firstName, s.lastName].filter(Boolean).join(' ')
  const draftFor = (s: StaffItem) => edit[s.id] ?? { websiteBio: s.websiteBio ?? '', websiteOrder: s.websiteOrder }
  const setDraft = (id: string, patch: Partial<{ websiteBio: string; websiteOrder: number }>) =>
    setEdit((e) => ({ ...e, [id]: { ...(e[id] ?? { websiteBio: '', websiteOrder: 0 }), ...patch } }))

  const update = async (s: StaffItem, data: Partial<{ showOnWebsite: boolean; websiteBio: string; websiteOrder: number }>) => {
    setBusyId(s.id)
    try {
      await api('PUT', { action: 'updateStaffWebsite', id: s.id, data })
      toast.success('Updated'); reload()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusyId(null) }
  }

  const featured = staff.filter((s) => s.showOnWebsite)

  return (
    <div className="space-y-4">
      <SectionCard title="Public team section" description={`Choose which active staff appear in the “Our leadership & staff” section of the About page, set a short public bio and the display order. ${featured.length} shown.`}>
        <div className="space-y-3">
          {staff.length === 0 && <p className="text-sm text-muted-foreground">No active staff records yet — add staff in the HR module first.</p>}
          {staff.map((s) => {
            const d = draftFor(s)
            const dirty = d.websiteBio !== (s.websiteBio ?? '') || d.websiteOrder !== s.websiteOrder
            return (
              <div key={s.id} className={`rounded-xl border p-4 transition-colors ${s.showOnWebsite ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20' : 'bg-card'}`}>
                <div className="flex items-start gap-3">
                  {s.photo
                    ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.photo} alt={fullName(s)} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">{`${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase()}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{fullName(s)}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.position}{s.department ? ` · ${s.department}` : ''}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={s.showOnWebsite} disabled={busyId === s.id} onCheckedChange={(v) => update(s, { showOnWebsite: v })} />
                    Show
                  </label>
                </div>
                {s.showOnWebsite && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem]">
                    <Textarea value={d.websiteBio} onChange={(e) => setDraft(s.id, { websiteBio: e.target.value })} rows={2} placeholder="Short public bio (optional)" className="text-sm" />
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Order</Label>
                        <Input type="number" value={d.websiteOrder} onChange={(e) => setDraft(s.id, { websiteOrder: Number(e.target.value) })} className="h-8 text-sm" />
                      </div>
                      <Button size="sm" disabled={!dirty || busyId === s.id} onClick={() => update(s, { websiteBio: d.websiteBio, websiteOrder: d.websiteOrder })} className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                        {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────
function FaqsTab({ faqs, reload }: { faqs: FaqItem[]; reload: () => void }) {
  const [draft, setDraft] = useState({ question: '', answer: '', category: 'GENERAL' })
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!draft.question.trim() || !draft.answer.trim()) { toast.error('Question and answer are required'); return }
    setBusy(true)
    try {
      await api('POST', { action: 'createFaq', data: { ...draft, sortOrder: faqs.length } })
      setDraft({ question: '', answer: '', category: 'GENERAL' })
      toast.success('FAQ added'); reload()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const toggle = async (f: FaqItem) => { try { await api('PUT', { action: 'updateFaq', id: f.id, data: { isActive: !f.isActive } }); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }
  const move = async (f: FaqItem, delta: number) => { try { await api('PUT', { action: 'updateFaq', id: f.id, data: { sortOrder: f.sortOrder + delta } }); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }
  const remove = async (f: FaqItem) => { if (!confirm('Delete this FAQ?')) return; try { await api('DELETE', { action: 'deleteFaq', id: f.id }); toast.success('Deleted'); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }

  return (
    <div className="space-y-4">
      <SectionCard title="Add a question" description="Shown as an accordion on the About page. Use new lines in the answer for separate paragraphs.">
        <div className="space-y-3">
          <Input value={draft.question} onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))} placeholder="e.g. What are your school fees?" />
          <Textarea value={draft.answer} onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))} placeholder="Answer…" rows={3} />
          <div className="flex items-center gap-3">
            <Input value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} placeholder="Category" className="w-48" />
            <Button onClick={add} disabled={busy} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add FAQ</Button>
          </div>
        </div>
      </SectionCard>

      <div className="space-y-2">
        {faqs.length === 0 && <p className="text-sm text-muted-foreground">No FAQs yet.</p>}
        {faqs.map((f, i) => (
          <div key={f.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <div className="flex flex-col">
              <button onClick={() => move(f, -1)} disabled={i === 0} className="text-muted-foreground/60 hover:text-foreground disabled:opacity-30">▲</button>
              <button onClick={() => move(f, 1)} disabled={i === faqs.length - 1} className="text-muted-foreground/60 hover:text-foreground disabled:opacity-30">▼</button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{f.question}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{f.answer}</p>
              <div className="mt-1 flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{f.category}</Badge><Badge variant={f.isActive ? 'default' : 'secondary'} className="text-[10px]">{f.isActive ? 'Visible' : 'Hidden'}</Badge></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggle(f)} title={f.isActive ? 'Hide' : 'Show'}>{f.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => remove(f)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SEO (per-page meta / Open Graph / robots) ────────────────────────────────
const ROBOTS_OPTIONS = ['index, follow', 'index, nofollow', 'noindex, follow', 'noindex, nofollow']
const COMMON_PAGES = ['home', 'about', 'academics', 'admissions', 'news', 'events', 'gallery', 'contact']

function SeoTab({ seo, reload }: { seo: SeoItem[]; reload: () => void }) {
  const [newSlug, setNewSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, Partial<SeoItem>>>({})

  const existingSlugs = new Set(seo.map((s) => s.pageSlug))
  const draftFor = (s: SeoItem): SeoItem => ({ ...s, ...drafts[s.id] })
  const setField = (id: string, k: keyof SeoItem, v: string) => setDrafts((d) => ({ ...d, [id]: { ...d[id], [k]: v } }))

  const add = async () => {
    const slug = newSlug.trim().toLowerCase()
    if (!slug) { toast.error('Enter a page slug (e.g. "about")'); return }
    setBusy(true)
    try {
      await api('POST', { action: 'createSeo', data: { pageSlug: slug, robotsDirective: 'index, follow' } })
      setNewSlug(''); toast.success(`SEO entry for "${slug}" added`); reload()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const save = async (s: SeoItem) => {
    const d = draftFor(s)
    setBusy(true)
    try {
      await api('PUT', { action: 'updateSeo', id: s.id, data: {
        metaTitle: d.metaTitle, metaDescription: d.metaDescription, metaKeywords: d.metaKeywords,
        ogTitle: d.ogTitle, ogDescription: d.ogDescription, ogImage: d.ogImage,
        canonicalUrl: d.canonicalUrl, robotsDirective: d.robotsDirective,
      } })
      setDrafts((dd) => { const n = { ...dd }; delete n[s.id]; return n })
      toast.success(`SEO for "${s.pageSlug}" saved`); reload()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const remove = async (s: SeoItem) => { if (!confirm(`Delete SEO settings for "${s.pageSlug}"?`)) return; try { await api('DELETE', { action: 'deleteSeo', id: s.id }); toast.success('Deleted'); reload() } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } }

  const field = (s: SeoItem, label: string, key: keyof SeoItem, opts?: { area?: boolean; placeholder?: string; hint?: string }) => {
    const d = draftFor(s)
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}{opts?.hint && <span className="ml-1 text-muted-foreground">· {opts.hint}</span>}</Label>
        {opts?.area
          ? <Textarea value={(d[key] as string) ?? ''} onChange={(e) => setField(s.id, key, e.target.value)} rows={2} placeholder={opts?.placeholder} />
          : <Input value={(d[key] as string) ?? ''} onChange={(e) => setField(s.id, key, e.target.value)} placeholder={opts?.placeholder} />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Per-page SEO"
        description={<span>Control the meta tags, social-share (Open Graph) cards and indexing for each public page. The slug matches the URL path — e.g. <code className="rounded bg-muted px-1">about</code> for /about, <code className="rounded bg-muted px-1">home</code> for the landing page.</span>}
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">New page slug</Label>
            <Input list="seo-slugs" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="about" className="w-48" />
            <datalist id="seo-slugs">{COMMON_PAGES.filter((p) => !existingSlugs.has(p)).map((p) => <option key={p} value={p} />)}</datalist>
          </div>
          <Button onClick={add} disabled={busy} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add page</Button>
        </div>
      </SectionCard>

      {seo.length === 0 && <p className="text-sm text-muted-foreground">No SEO settings yet — add a page above. Pages without an entry use the built-in defaults.</p>}

      {seo.map((s) => {
        const d = draftFor(s)
        const dirty = !!drafts[s.id]
        const titleLen = (d.metaTitle ?? '').length
        const descLen = (d.metaDescription ?? '').length
        return (
          <SectionCard
            key={s.id}
            title={
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-600" /> /{s.pageSlug === 'home' ? '' : s.pageSlug}
              </span>
            }
            actions={
              <Button variant="ghost" size="icon" onClick={() => remove(s)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {field(s, 'Meta title', 'metaTitle', { placeholder: 'Page title for search results', hint: `${titleLen}/60` })}
              <div className="space-y-1.5">
                <Label className="text-xs">Robots</Label>
                <select value={d.robotsDirective} onChange={(e) => setField(s.id, 'robotsDirective', e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  {ROBOTS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">{field(s, 'Meta description', 'metaDescription', { area: true, placeholder: 'Shown under the title in search results', hint: `${descLen}/160` })}</div>
              {field(s, 'Meta keywords', 'metaKeywords', { placeholder: 'comma, separated, keywords' })}
              {field(s, 'Canonical URL', 'canonicalUrl', { placeholder: 'https://…' })}
              {field(s, 'OG title', 'ogTitle', { placeholder: 'Title for social shares (blank = meta title)' })}
              {field(s, 'OG image URL', 'ogImage', { placeholder: 'https://…/share.jpg' })}
              <div className="sm:col-span-2">{field(s, 'OG description', 'ogDescription', { area: true, placeholder: 'Description for social shares' })}</div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={() => save(s)} disabled={!dirty || busy} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save SEO
                </Button>
              </div>
            </div>
          </SectionCard>
        )
      })}
    </div>
  )
}