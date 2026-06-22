import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  GraduationCap, Users, Award, BookOpen, ArrowRight, CheckCircle2,
  Microscope, Globe2, Trophy, HeartHandshake, CalendarDays, MapPin, Sparkles,
  ShieldCheck, Lightbulb, Heart, Target, Quote, ImageIcon, Star,
  School, Monitor, ChevronDown, type LucideIcon,
} from 'lucide-react'
import { db } from '@/lib/db'
import {
  getSchool, getPublishedNews, getUpcomingEvents, getGalleryImages,
  getPartners, getSiteTheme, SITE_FALLBACK,
} from '@/lib/public-data'
import { resolveTheme, hexToRgb } from '@/lib/site-theme'
import { PartnerCarousel } from './_components/partner-carousel'

export const dynamic = 'force-dynamic'

// Consistent vertical rhythm for every full section on the page.
const SECTION = 'py-20 sm:py-24'

// Icon name → component, for the admin-editable "values" cards and stats.
const ICONS: Record<string, LucideIcon> = {
  ShieldCheck, Lightbulb, Heart, Target, GraduationCap, Users, Award,
  CalendarDays, BookOpen, Microscope, Globe2, Trophy, HeartHandshake, Sparkles,
}
const STAT_ICONS: LucideIcon[] = [GraduationCap, Users, Award, CalendarDays]

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  const desc = school?.motto
    ? `${name} — ${school.motto}. A ${school?.levelType?.toLowerCase() ?? ''} school in ${school?.province ?? 'Zimbabwe'} committed to academic excellence, character and opportunity.`.replace(/\s+/g, ' ').trim()
    : `${name} — academic excellence, character and opportunity in ${school?.province ?? 'Zimbabwe'}.`
  return {
    title: `${name} — Excellence in Education`,
    description: desc,
    openGraph: { title: name, description: desc, type: 'website' },
  }
}

function formatEventDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FALLBACK_NEWS = [
  { title: 'Top ZIMSEC Results Place Us Among the Region’s Best', excerpt: 'Our O- and A-Level candidates posted a record pass rate, with distinctions across the sciences, commercials and humanities.', category: 'Academics' },
  { title: 'New Science & Innovation Block Officially Opened', excerpt: 'A modern laboratory complex now supports practical learning in Physics, Chemistry, Biology and Computer Science.', category: 'Campus' },
  { title: 'Community Outreach: Mufakose Cleanup Campaign', excerpt: 'Over 200 students and staff joined our quarterly environmental stewardship drive across the suburb.', category: 'Community' },
]

export default async function HomePage() {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name

  // Counts are wrapped so a database hiccup falls back to 0 (rendered as the
  // built-in placeholder) instead of crashing the whole page.
  const safeCount = (p: Promise<number>) => p.catch(() => 0)

  const [studentCount, staffCount, news, events, gallery, partners, themeRow] = await Promise.all([
    school ? safeCount(db.student.count({ where: { schoolId: school.id, enrollmentStatus: 'ACTIVE' } })) : Promise.resolve(0),
    school ? safeCount(db.staff.count({ where: { schoolId: school.id, isActive: true } })) : Promise.resolve(0),
    getPublishedNews(4),
    getUpcomingEvents(4),
    getGalleryImages(6),
    getPartners(),
    getSiteTheme(),
  ])

  const theme = resolveTheme(themeRow)
  const established = school?.establishedYear
  const yearsOfService = established ? new Date().getFullYear() - established : null

  // Hero copy: theme overrides → school record → site fallback.
  const headline = theme.heroHeadline || name
  const motto = theme.heroMotto || school?.motto || SITE_FALLBACK.motto
  const badge = theme.heroBadge || `${school?.province ?? 'Zimbabwe'} · Est. ${established ?? '1985'}`

  // Resolve stat value tokens ({students}/{staff}/{years}) against live data.
  const resolveStat = (v: string) =>
    v
      .replace('{students}', studentCount > 0 ? `${studentCount}+` : '1,200+')
      .replace('{staff}', staffCount > 0 ? `${staffCount}+` : '80+')
      .replace('{years}', yearsOfService ? `${yearsOfService}+` : '35+')
  const stats = theme.stats.map((s, i) => ({ ...s, value: resolveStat(s.value), icon: STAT_ICONS[i % STAT_ICONS.length] }))

  const programmes = [
    { icon: Microscope, title: 'Sciences & STEM', desc: 'Physics, Chemistry, Biology, Computer Science and Mathematics in fully-equipped laboratories.' },
    { icon: Globe2, title: 'Languages & Humanities', desc: 'English, Shona, History, Geography and Religious Studies that build critical, global thinkers.' },
    { icon: BookOpen, title: 'Commercials', desc: 'Accounting, Business Studies and Economics preparing learners for enterprise and finance.' },
    { icon: Trophy, title: 'Sport & Co-curricular', desc: 'Soccer, netball, athletics, debate, drama and clubs that develop the whole learner.' },
  ]

  const displayNews = news.length > 0
    ? news.map((n) => ({ title: n.title, excerpt: n.excerpt ?? '', category: n.category, slug: n.slug }))
    : FALLBACK_NEWS

  // Hero colour overlay built from the editable theme colours + opacity.
  // Directional wash (darker on the left where the text sits) for depth.
  const op = Math.min(100, Math.max(0, theme.overlayOpacity)) / 100
  const cFrom = hexToRgb(theme.overlayFrom)
  const cTo = hexToRgb(theme.overlayTo)
  const overlayStyle = {
    backgroundImage: `linear-gradient(105deg, rgb(${cFrom} / ${op.toFixed(2)}) 0%, rgb(${cFrom} / ${(op * 0.74).toFixed(2)}) 40%, rgb(${cTo} / ${(op * 0.4).toFixed(2)}) 100%)`,
  }
  // Brand CSS variables for theme-driven accents on this page.
  const brandVars = {
    '--bp': theme.primaryColor,
    '--bs': theme.secondaryColor,
    '--ba': theme.accentColor,
  } as CSSProperties

  return (
    <div style={brandVars}>
      <style>{`
        @keyframes heroRise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
        @keyframes heroFade { from { opacity: 0; } to { opacity: 1; } }
        .hero-rise { animation: heroRise .9s cubic-bezier(.16,1,.3,1) both; }
        .hero-fade { animation: heroFade 1.4s ease both; }
        @media (prefers-reduced-motion: reduce) { .hero-rise, .hero-fade { animation: none; } }
      `}</style>

      {/* ───────── Hero ───────── */}
      <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden">
        <Image
          src={theme.heroImageUrl}
          alt={`${name} campus`}
          fill
          priority
          sizes="100vw"
          className="hero-fade scale-105 object-cover object-center"
        />
        {/* Layered overlay: themed directional wash → bottom anchor → vignette */}
        <div className="absolute inset-0" style={overlayStyle} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(120% 120% at 72% 28%, transparent 38%, rgba(0,0,0,0.5) 100%)' }} />

        {/* Space offset for the fixed header */}
        <div className="h-16 sm:h-20 w-full shrink-0 relative z-10" />

        {/* ── Main content (vertically centred) ── */}
        <div className="relative z-10 flex flex-1 items-center">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="hero-rise inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                {badge}
              </span>

              <h1 className="hero-rise mt-6 text-balance text-5xl font-bold leading-[0.95] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent" style={{ animationDelay: '.08s', textShadow: '0 2px 30px rgba(0,0,0,0.1)' }}>
                {headline}
              </h1>

              <div className="hero-rise mt-6 flex items-start gap-4" style={{ animationDelay: '.16s' }}>
                <span className="mt-1.5 h-12 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                <p className="text-lg font-light italic leading-snug text-white/95 sm:text-2xl">{motto}</p>
              </div>

              <p className="hero-rise mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg" style={{ animationDelay: '.24s' }}>
                {theme.heroSubtitle}
              </p>

              <div className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '.32s' }}>
                <Link
                  href={theme.heroPrimaryHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-emerald-950 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  style={{ backgroundColor: theme.accentColor, boxShadow: `0 10px 40px -8px rgb(${hexToRgb(theme.accentColor)} / 0.55)` }}
                >
                  {theme.heroPrimaryLabel}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href={theme.heroSecondaryHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-medium text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/5 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
                >
                  {theme.heroSecondaryLabel}
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Down Chevron Indicator & Statistics bar at the absolute bottom */}
        <div className="relative z-10 w-full shrink-0 flex flex-col items-center">
          {/* Bouncing Chevron Down */}
          <div className="mb-4 animate-bounce">
            <ChevronDown className="h-7 w-7 text-white/70 hover:text-white transition-colors cursor-pointer" />
          </div>

          {/* Statistics Bar */}
          {theme.showStats && stats.length > 0 && (
            <div className="w-full bg-black/45 backdrop-blur-md border-t border-white/10 py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                  {stats.map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <s.icon className="h-6.5 w-6.5 shrink-0" style={{ color: theme.accentColor }} />
                      <div>
                        <div className="text-xl font-bold tracking-tight text-white sm:text-2xl">{s.value}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Slim Zimbabwe flag accent */}
          <div className="flex h-1.5 w-full">
            <span className="flex-1 bg-green-600" />
            <span className="flex-1" style={{ backgroundColor: theme.accentColor }} />
            <span className="flex-1 bg-red-600" />
            <span className="flex-1 bg-black" />
          </div>
        </div>
      </section>

      {/* ───────── Partner / accreditation carousel (where stats used to be) ───────── */}
      {theme.showPartners && partners.length > 0 && (
        <section className="border-b border-border/60 bg-muted/30 py-12">
          <div className="mx-auto mb-8 flex max-w-md items-center gap-4 px-4 sm:px-6">
            <span className="h-px flex-1 bg-border" />
            <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Accredited &amp; in partnership with
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>
          <PartnerCarousel partners={partners.map((p) => ({ id: p.id, name: p.name, logoUrl: p.logoUrl, websiteUrl: p.websiteUrl }))} />
        </section>
      )}

      {/* ───────── About strip ───────── */}
      <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${SECTION}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.primaryColor }}>
              <span className="h-px w-8" style={{ backgroundColor: theme.primaryColor }} /> Who we are
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">A community built on excellence and character</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {name} has educated generations of leaders, professionals and innovators. Our approach
              blends academic rigour with discipline, faith and service — guided by experienced,
              caring teachers and a strong School Development Committee.
            </p>
            <ul className="mt-7 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {['ZIMSEC-aligned curriculum from ECD to A-Level', 'Modern laboratories, library and ICT facilities', 'A safe, disciplined and inclusive environment', 'Strong sporting and co-curricular tradition'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `rgb(${hexToRgb(theme.primaryColor)} / 0.12)` }}>
                    <CheckCircle2 className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  </span>
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/about" className="group mt-9 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: theme.primaryColor }}>
              Read our story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-black/5" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, boxShadow: `0 30px 60px -20px rgb(${hexToRgb(theme.primaryColor)} / 0.45)` }}>
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(80% 80% at 75% 15%, rgba(255,255,255,0.18), transparent 60%)' }} />
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative flex h-full flex-col justify-center gap-5 p-10 text-white">
                <Quote className="h-12 w-12" style={{ color: theme.accentColor }} />
                <p className="max-w-sm text-xl font-medium italic leading-snug text-white/95">
                  Education is the most powerful weapon you can use to change the world.
                </p>
                <p className="text-sm font-semibold uppercase tracking-widest text-white/60">Our guiding belief</p>
              </div>
            </div>
            {stats[2] && (
              <div className="absolute -bottom-7 -left-5 hidden rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 dark:bg-card sm:block">
                <p className="text-4xl font-extrabold" style={{ color: theme.primaryColor }}>{stats[2].value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{stats[2].label}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Why choose us ───────── */}
      {theme.showValues && theme.values.length > 0 && (
        <section className={`relative overflow-hidden border-y border-white/5 ${SECTION}`} style={{ backgroundColor: theme.darkColor }}>
          {/* ambient brand glows for depth */}
          <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: `rgb(${hexToRgb(theme.primaryColor)} / 0.25)` }} />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: `rgb(${hexToRgb(theme.accentColor)} / 0.12)` }} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accentColor }}>Why families choose us</span>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">More than a school — a foundation for life</h2>
              <p className="mt-4 text-white/60">Commitments that shape every learner who walks through our gates.</p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {theme.values.map((v, i) => {
                const Icon = ICONS[v.icon] ?? ShieldCheck
                return (
                  <div key={v.title} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/[0.07]">
                    <span className="pointer-events-none absolute right-5 top-4 text-5xl font-black text-white/5 transition-colors group-hover:text-white/10">0{i + 1}</span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10" style={{ backgroundColor: `rgb(${hexToRgb(theme.accentColor)} / 0.15)`, color: theme.accentColor }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-white">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{v.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ───────── Academics showcase ───────── */}
      <section className={`bg-muted/40 ${SECTION}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.primaryColor }}>Academics</span>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Programmes that open doors</h2>
            <p className="mt-4 text-muted-foreground">From the sciences to the arts, our curriculum prepares every learner for university, enterprise and life.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {programmes.map((p) => (
              <div key={p.title} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-xl">
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }} />
                <span className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `rgb(${hexToRgb(theme.primaryColor)} / 0.1)`, color: theme.primaryColor }}>
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/academics" className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
              Explore all programmes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Gallery preview ───────── */}
      {theme.showGallery && (
        <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${SECTION}`}>
          <div className="flex flex-col items-end justify-between gap-4 sm:flex-row">
            <div>
              <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.primaryColor }}>
                <span className="h-px w-8" style={{ backgroundColor: theme.primaryColor }} /> Life at school
              </span>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">A glimpse of campus life</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">From the classroom to the sports field — moments that capture the spirit of our community.</p>
            </div>
            <Link href="/gallery" className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold" style={{ color: theme.primaryColor }}>
              View full gallery <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          {gallery.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {gallery.map((img, i) => (
                <Link
                  key={img.id}
                  href="/gallery"
                  className={`group relative overflow-hidden rounded-2xl ring-1 ring-black/5 ${i === 0 ? 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2' : ''}`}
                >
                  { }
                  <img
                    src={img.imageUrl}
                    alt={img.title ?? 'School gallery image'}
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${i === 0 ? 'aspect-square sm:aspect-auto' : 'aspect-square'}`}
                    loading="lazy"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
                  {img.title && (
                    <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {img.title}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {[
                { title: 'Main Campus', icon: School, gradient: 'from-emerald-500 to-teal-600', span: 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2 sm:aspect-auto' },
                { title: 'Science Lab', icon: Microscope, gradient: 'from-teal-500 to-cyan-600', span: 'aspect-square' },
                { title: 'IT Centre', icon: Monitor, gradient: 'from-cyan-500 to-sky-600', span: 'aspect-square' },
                { title: 'Main Library', icon: BookOpen, gradient: 'from-sky-500 to-indigo-600', span: 'aspect-square' },
                { title: 'Sports Field', icon: Trophy, gradient: 'from-emerald-600 to-green-700', span: 'aspect-square' },
                { title: 'Creative Arts', icon: Sparkles, gradient: 'from-amber-500 to-orange-600', span: 'aspect-square' },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div
                    key={i}
                    className={`group relative flex flex-col justify-end overflow-hidden rounded-[1.25rem] border border-white/10 shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${f.span}`}
                  >
                    {/* Background visual mesh/gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-85 transition-opacity duration-300 group-hover:opacity-95`} />
                    <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    {/* Inner content */}
                    <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white sm:p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Facility</p>
                        <p className="mt-0.5 text-xs font-bold sm:text-sm">{f.title}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ───────── Testimonials ───────── */}
      {theme.showTestimonials && theme.testimonials.length > 0 && (
        <section className={`bg-muted/40 ${SECTION}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.primaryColor }}>In their words</span>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Trusted by parents, loved by learners</h2>
            </div>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {theme.testimonials.map((t) => (
                <figure key={t.name} className="relative flex flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <Quote className="absolute right-6 top-6 h-12 w-12" style={{ color: `rgb(${hexToRgb(theme.primaryColor)} / 0.08)` }} />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" style={{ color: theme.accentColor }} />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">“{t.quote}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-offset-2 ring-offset-card" style={{ backgroundColor: theme.primaryColor, '--tw-ring-color': `rgb(${hexToRgb(theme.primaryColor)} / 0.25)` } as CSSProperties}>
                      {t.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </span>
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── News (separate section) ───────── */}
      {theme.showNews && (
        <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${SECTION}`}>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.primaryColor }}>Latest news</span>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">What’s happening</h2>
            </div>
            <Link href="/news" className="group hidden items-center gap-1.5 text-sm font-semibold sm:inline-flex" style={{ color: theme.primaryColor }}>
              All news <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {displayNews.map((n, i) => {
              const hasImage = 'featuredImage' in n && !!n.featuredImage
              const imageUrl = hasImage ? (n as any).featuredImage : null

              const gradients = [
                { from: '#047857', via: '#0f766e', to: '#022c22', icon: GraduationCap },
                { from: '#0369a1', via: '#0e7490', to: '#0c4a6e', icon: Microscope },
                { from: '#4f46e5', via: '#4338ca', to: '#311042', icon: BookOpen },
                { from: '#be123c', via: '#9f1239', to: '#4c0519', icon: Trophy },
              ]
              const config = gradients[i % gradients.length]
              const FallbackIcon = config.icon
              const isFeatured = i === 0

              const card = isFeatured ? (
                <article className="group flex h-full flex-col md:flex-row overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/65 backdrop-blur-md shadow-md hover:shadow-2xl hover:border-emerald-500/30 hover:-translate-y-1.5 transition-all duration-500">
                  <div className="relative md:w-1/2 min-h-[240px] md:h-auto overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={n.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${config.from} 0%, ${config.via} 50%, ${config.to} 100%)` }}
                      >
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle at center, white 0%, transparent 60%)' }} />
                        <FallbackIcon className="h-16 w-16 text-white/80 filter drop-shadow-lg" />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-white/92 dark:bg-zinc-900/92 px-3 py-1 text-[11px] font-semibold tracking-wider text-emerald-800 dark:text-emerald-400 border border-emerald-500/10 shadow-sm backdrop-blur-sm z-20">
                      {n.category}
                    </span>
                  </div>
                  <div className="flex md:w-1/2 flex-col justify-between p-6 sm:p-8">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Featured Article</span>
                      <h3 className="mt-3 text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-3">
                        {n.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                        {n.excerpt}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Read full story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </article>
              ) : (
                <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/65 backdrop-blur-md shadow-md hover:shadow-2xl hover:border-emerald-500/30 hover:-translate-y-1.5 transition-all duration-500">
                  <div className="relative h-48 w-full overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={n.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${config.from} 0%, ${config.via} 50%, ${config.to} 100%)` }}
                      >
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle at center, white 0%, transparent 60%)' }} />
                        <FallbackIcon className="h-12 w-12 text-white/80 filter drop-shadow-lg" />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-white/92 dark:bg-zinc-900/92 px-3 py-1 text-[11px] font-semibold tracking-wider text-emerald-800 dark:text-emerald-400 border border-emerald-500/10 shadow-sm backdrop-blur-sm z-20">
                      {n.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2">
                        {n.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {n.excerpt}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </article>
              )

              return 'slug' in n && n.slug
                ? <Link key={i} href={`/news/${n.slug}`} className={cn('h-full', isFeatured ? 'lg:col-span-2 md:col-span-2' : 'col-span-1')}>{card}</Link>
                : <div key={i} className={cn('h-full', isFeatured ? 'lg:col-span-2 md:col-span-2' : 'col-span-1')}>{card}</div>
            })}
          </div>
        </section>
      )}

      {/* ───────── Events (separate section) ───────── */}
      {theme.showEvents && (
        <section className={`border-t border-border/60 bg-muted/40 ${SECTION}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.primaryColor }}>Upcoming</span>
                <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">School events</h2>
              </div>
              <Link href="/events" className="group hidden items-center gap-1.5 text-sm font-semibold sm:inline-flex" style={{ color: theme.primaryColor }}>
                View calendar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            {events.length > 0 ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {events.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}`} className="group flex gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-md" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
                      <span className="text-2xl font-bold leading-none">{new Date(e.startDate).getDate()}</span>
                      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{new Date(e.startDate).toLocaleDateString('en-GB', { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{e.title}</h3>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" /> {formatEventDate(e.startDate)}
                      </p>
                      {e.venue && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {e.venue}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-8 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                No upcoming events scheduled. Please check back soon.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ───────── CTA ───────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${theme.darkColor}, ${theme.primaryColor} 55%, ${theme.secondaryColor})` }}>
        <div className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: `rgb(${hexToRgb(theme.accentColor)} / 0.18)` }} />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: `rgb(${hexToRgb(theme.secondaryColor)} / 0.4)` }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className={`relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8 ${SECTION}`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" style={{ color: theme.accentColor }} /> Admissions open
          </span>
          <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to join the {name} family?
          </h2>
          <p className="max-w-xl text-white/80">
            Applications for the new term are open. Begin your child’s journey towards excellence today.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/admissions/apply" className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-semibold text-emerald-950 transition-all hover:-translate-y-0.5" style={{ backgroundColor: theme.accentColor, boxShadow: `0 10px 40px -8px rgb(${hexToRgb(theme.accentColor)} / 0.55)` }}>
              Start Your Application <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/10">
              Contact Admissions
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
