import type { Metadata } from 'next'
import Link from 'next/link'
import { Baby, BookOpen, GraduationCap, Microscope, Globe2, Calculator, Palette, ArrowRight } from 'lucide-react'
import { getSchool, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `Academics — ${name}`,
    description: `Explore the academic programmes at ${name}, from ECD through Primary and Secondary to Advanced Level, aligned to the ZIMSEC curriculum.`,
  }
}

const PHASES = [
  { icon: Baby, title: 'Early Childhood (ECD A–B)', desc: 'A nurturing foundation focused on play-based learning, language and social development.' },
  { icon: BookOpen, title: 'Primary (Grade 1–7)', desc: 'A strong grounding in literacy, numeracy and the core subjects, culminating in Grade 7 examinations.' },
  { icon: GraduationCap, title: 'Secondary (Form 1–4)', desc: 'A broad ZIMSEC O-Level curriculum across sciences, commercials, humanities and the arts.' },
  { icon: GraduationCap, title: 'Advanced Level (Form 5–6)', desc: 'Specialised A-Level pathways preparing learners for university and professional careers.' },
]

const DEPARTMENTS = [
  { icon: Microscope, name: 'Sciences', subjects: 'Physics · Chemistry · Biology · Combined Science · Computer Science' },
  { icon: Calculator, name: 'Mathematics', subjects: 'Mathematics · Additional Mathematics · Statistics' },
  { icon: Globe2, name: 'Humanities', subjects: 'History · Geography · Religious Studies · Heritage' },
  { icon: BookOpen, name: 'Languages', subjects: 'English Language · English Literature · Shona' },
  { icon: Calculator, name: 'Commercials', subjects: 'Accounting · Business Studies · Economics' },
  { icon: Palette, name: 'Practical & Arts', subjects: 'Technical Graphics · Art · Agriculture · Physical Education' },
]

export default async function AcademicsPage() {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="A curriculum that builds futures"
        subtitle={`${name} delivers a rigorous, well-rounded education aligned to the ZIMSEC curriculum — supporting every learner from ECD to Advanced Level.`}
        crumbs={[{ label: 'Academics' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Our learning phases</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border/60 bg-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><p.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Departments &amp; subjects</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENTS.map((d) => (
              <div key={d.name} className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg dark:hover:border-emerald-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/40"><d.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{d.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.subjects}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-800 p-10 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Want to learn more?</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100/90">Speak to our academic team about subject combinations and pathways for your child.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/admissions/apply" className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-emerald-950 transition-all hover:-translate-y-0.5 hover:bg-yellow-300">Apply now <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">Contact us</Link>
          </div>
        </section>
      </div>
    </>
  )
}
