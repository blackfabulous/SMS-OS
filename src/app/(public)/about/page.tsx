import type { Metadata } from 'next'
import { Target, Eye, Heart, ShieldCheck, Users, Award, Sparkles, GraduationCap, HelpCircle, Quote } from 'lucide-react'
import { getSchool, getSiteTheme, getWebsiteStaff, getFaqs, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'
import { FaqAccordion } from '../_components/faq-accordion'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `About — ${name}`,
    description: `Learn about ${name}: our history, mission, vision, leadership team and the values that shape our learners.`,
  }
}

const VALUES = [
  { icon: ShieldCheck, title: 'Discipline', desc: 'A structured, respectful environment where learners thrive.' },
  { icon: Award, title: 'Excellence', desc: 'High academic standards and a culture of continuous improvement.' },
  { icon: Heart, title: 'Compassion', desc: 'Caring for the whole learner — academically, socially and spiritually.' },
  { icon: Users, title: 'Community', desc: 'Strong partnerships between school, parents and the wider community.' },
]

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export default async function AboutPage() {
  const [school, theme, staff, faqs] = await Promise.all([
    getSchool(),
    getSiteTheme(),
    getWebsiteStaff(),
    getFaqs(),
  ])
  const name = school?.name ?? SITE_FALLBACK.name
  const established = school?.establishedYear ?? 1985
  const head = school?.headName
  const years = new Date().getFullYear() - established

  const historyParas = (theme?.aboutHistory?.trim()
    ? theme.aboutHistory.split('\n').filter((p) => p.trim())
    : [
        `${name} was established in ${established} to provide quality, accessible education to the community. Over the decades we have grown into a respected institution known for strong academic results, sporting achievement and a culture of discipline and care.`,
        `Today our learners benefit from dedicated teachers, modern facilities and a curriculum aligned to ZIMSEC standards — from Early Childhood Development through to Advanced Level.`,
      ])

  const mission = theme?.missionText?.trim() || 'To provide holistic, quality education that nurtures academic excellence, strong character and a lifelong love of learning in every child.'
  const vision = theme?.visionText?.trim() || 'To be a leading centre of educational excellence in Zimbabwe, producing confident, responsible and innovative citizens.'

  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={`About ${name}`}
        subtitle={`Since ${established}, we have been shaping confident, principled young Zimbabweans ready to lead and serve.`}
        crumbs={[{ label: 'About' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* History */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> A proud heritage
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Educating leaders for {years}+ years</h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              {historyParas.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {head && <p>The school is led by <span className="font-medium text-foreground">{head}</span>, supported by an experienced staff and an active School Development Committee.</p>}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-200/40 to-teal-200/30 blur-2xl dark:from-emerald-900/30 dark:to-teal-900/20" />
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl shadow-emerald-900/20 ring-1 ring-white/10">
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-6xl font-extrabold text-white">{years}+</p>
                <p className="mt-2 text-base font-medium text-emerald-100">years of educating leaders</p>
                <p className="mt-4 text-sm text-emerald-200/80">Established {established}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission / Vision */}
        <section className="mt-20 grid gap-6 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 transition-shadow hover:shadow-xl hover:shadow-emerald-900/5">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"><Target className="h-6 w-6" /></span>
            <h3 className="relative mt-5 text-xl font-bold">Our Mission</h3>
            <p className="relative mt-2 text-muted-foreground">{mission}</p>
          </div>
          <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 transition-shadow hover:shadow-xl hover:shadow-teal-900/5">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal-500/5 transition-transform group-hover:scale-150" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30"><Eye className="h-6 w-6" /></span>
            <h3 className="relative mt-5 text-xl font-bold">Our Vision</h3>
            <p className="relative mt-2 text-muted-foreground">{vision}</p>
          </div>
        </section>

        {/* Values */}
        <section className="mt-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">What we stand for</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Our core values</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="group rounded-3xl border border-border/60 bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/5">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/40"><v.icon className="h-7 w-7" /></span>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Staff members */}
        {staff.length > 0 && (
          <section className="mt-24">
            <div className="text-center">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="h-4 w-4" /> Meet the team
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Our leadership &amp; staff</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">The dedicated educators and administrators who guide {name} every day.</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((s) => {
                const fullName = [s.title, s.firstName, s.lastName].filter(Boolean).join(' ')
                return (
                  <article key={s.id} className="group flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700">
                      {s.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photo} alt={fullName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-4xl font-extrabold text-white/90">{initials(s.firstName, s.lastName)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-bold">{fullName}</h3>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{s.position}</p>
                      {s.department && <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{s.department}</p>}
                      {s.websiteBio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.websiteBio}</p>}
                      {s.qualifications && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Award className="h-3.5 w-3.5 text-emerald-600" /> {s.qualifications}
                        </p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="mt-24">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  <HelpCircle className="h-4 w-4" /> Good to know
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
                <p className="mt-3 text-muted-foreground">Answers to the questions parents and learners ask us most. Still curious? <a href="/contact" className="font-medium text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400">Get in touch</a>.</p>
                <div className="mt-6 hidden rounded-3xl border border-border/60 bg-card p-6 lg:block">
                  <Quote className="h-7 w-7 text-emerald-600/40" />
                  <p className="mt-3 text-sm text-muted-foreground">We&apos;re always happy to help. Reach out to our admissions office for anything not covered here.</p>
                </div>
              </div>
              <FaqAccordion faqs={faqs} />
            </div>
          </section>
        )}
      </div>
    </>
  )
}
