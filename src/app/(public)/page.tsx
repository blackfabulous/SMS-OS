import type { Metadata } from 'next'
import Link from 'next/link'
import {
  GraduationCap, Users, Award, BookOpen, ArrowRight, CheckCircle2,
  Microscope, Globe2, Trophy, HeartHandshake, CalendarDays, MapPin, Sparkles,
} from 'lucide-react'
import { db } from '@/lib/db'
import { getSchool, getPublishedNews, getUpcomingEvents, SITE_FALLBACK } from '@/lib/public-data'

export const dynamic = 'force-dynamic'

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
  const motto = school?.motto ?? SITE_FALLBACK.motto

  const [studentCount, staffCount, news, events] = await Promise.all([
    school ? db.student.count({ where: { schoolId: school.id, enrollmentStatus: 'ACTIVE' } }) : Promise.resolve(0),
    school ? db.staff.count({ where: { schoolId: school.id, isActive: true } }) : Promise.resolve(0),
    getPublishedNews(3),
    getUpcomingEvents(4),
  ])

  const established = school?.establishedYear
  const yearsOfService = established ? new Date().getFullYear() - established : null

  const stats = [
    { icon: GraduationCap, value: studentCount > 0 ? `${studentCount}+` : '1,200+', label: 'Students Enrolled' },
    { icon: Users, value: staffCount > 0 ? `${staffCount}+` : '80+', label: 'Qualified Staff' },
    { icon: Award, value: '96%', label: 'ZIMSEC Pass Rate' },
    { icon: CalendarDays, value: yearsOfService ? `${yearsOfService}` : '35+', label: 'Years of Service' },
  ]

  const programmes = [
    { icon: Microscope, title: 'Sciences & STEM', desc: 'Physics, Chemistry, Biology, Computer Science and Mathematics in fully-equipped laboratories.' },
    { icon: Globe2, title: 'Languages & Humanities', desc: 'English, Shona, History, Geography and Religious Studies that build critical, global thinkers.' },
    { icon: BookOpen, title: 'Commercials', desc: 'Accounting, Business Studies and Economics preparing learners for enterprise and finance.' },
    { icon: Trophy, title: 'Sport & Co-curricular', desc: 'Soccer, netball, athletics, debate, drama and clubs that develop the whole learner.' },
  ]

  const displayNews = news.length > 0
    ? news.map((n) => ({ title: n.title, excerpt: n.excerpt ?? '', category: n.category, slug: n.slug }))
    : FALLBACK_NEWS

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-emerald-100 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {school?.province ?? 'Zimbabwe'} · Est. {established ?? '1985'}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {name}
            </h1>
            <p className="mt-4 text-lg font-medium text-emerald-100/90 sm:text-xl">“{motto}”</p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-emerald-50/80 sm:text-lg">
              We nurture confident, disciplined and curious young Zimbabweans — combining rigorous
              academics with character, sport and service so every learner leaves ready to thrive.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admissions/apply"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-7 py-3.5 text-base font-bold text-emerald-950 shadow-lg shadow-yellow-500/25 transition-all hover:-translate-y-0.5 hover:bg-yellow-300"
              >
                Apply for Admission
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Discover Our School
              </Link>
            </div>
          </div>
        </div>

        {/* Zimbabwe flag accent */}
        <div className="relative flex h-2 w-full">
          <span className="flex-1 bg-green-500" />
          <span className="flex-1 bg-yellow-400" />
          <span className="flex-1 bg-red-500" />
          <span className="flex-1 bg-black" />
        </div>
      </section>

      {/* ───────── Stats band ───────── */}
      <section className="border-b border-border/60 bg-emerald-50/40 dark:bg-emerald-950/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2 px-4 py-4 text-center">
              <s.icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{s.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── About strip ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Who we are</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A community built on excellence and character</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {name} has educated generations of leaders, professionals and innovators. Our approach
              blends academic rigour with discipline, faith and service — guided by experienced,
              caring teachers and a strong School Development Committee.
            </p>
            <ul className="mt-6 space-y-3">
              {['ZIMSEC-aligned curriculum from ECD to A-Level', 'Modern laboratories, library and ICT facilities', 'A safe, disciplined and inclusive environment', 'Strong sporting and co-curricular tradition'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
              Read our story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl shadow-emerald-900/20">
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-white">
                <HeartHandshake className="h-16 w-16 text-emerald-200" />
                <p className="max-w-xs text-lg font-medium text-emerald-50">
                  “Education is the most powerful weapon you can use to change the world.”
                </p>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 dark:bg-card sm:block">
              <p className="text-3xl font-extrabold text-emerald-600">{stats[2].value}</p>
              <p className="text-xs font-medium text-muted-foreground">Exam pass rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Academics showcase ───────── */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Academics</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Programmes that open doors</h2>
            <p className="mt-4 text-muted-foreground">From the sciences to the arts, our curriculum prepares every learner for university, enterprise and life.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {programmes.map((p) => (
              <div key={p.title} className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg dark:hover:border-emerald-900">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/40">
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/academics" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3 font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-900 dark:bg-card dark:text-emerald-400">
              Explore all programmes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── News + Events ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* News */}
          <div className="lg:col-span-2">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Latest news</span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">What’s happening</h2>
              </div>
              <Link href="/news" className="hidden items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 sm:inline-flex">
                All news <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 space-y-5">
              {displayNews.map((n, i) => {
                const card = (
                  <article className="group flex gap-5 rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900">
                    <div className="hidden h-24 w-32 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 sm:flex">
                      <BookOpen className="h-8 w-8 text-white/80" />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{n.category}</span>
                      <h3 className="mt-2 line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{n.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>
                    </div>
                  </article>
                )
                return 'slug' in n && n.slug
                  ? <Link key={i} href={`/news/${n.slug}`}>{card}</Link>
                  : <div key={i}>{card}</div>
              })}
            </div>
          </div>

          {/* Events */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Upcoming</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Events</h2>
            <div className="mt-6 space-y-4">
              {events.length > 0 ? events.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="group flex gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <span className="text-lg font-bold leading-none">{new Date(e.startDate).getDate()}</span>
                    <span className="text-[10px] uppercase">{new Date(e.startDate).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{e.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatEventDate(e.startDate)}
                    </p>
                    {e.venue && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {e.venue}</p>}
                  </div>
                </Link>
              )) : (
                <p className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  No upcoming events scheduled. Please check back soon.
                </p>
              )}
            </div>
            <Link href="/events" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
              View calendar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-800">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to join the {name} family?
          </h2>
          <p className="max-w-xl text-emerald-100/90">
            Applications for the new term are open. Begin your child’s journey towards excellence today.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/admissions/apply" className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-7 py-3.5 font-bold text-emerald-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-yellow-300">
              Start Your Application <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
              Contact Admissions
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
