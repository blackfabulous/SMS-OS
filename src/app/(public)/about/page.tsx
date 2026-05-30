import type { Metadata } from 'next'
import { Target, Eye, Heart, ShieldCheck, Users, Award } from 'lucide-react'
import { getSchool, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `About — ${name}`,
    description: `Learn about ${name}: our history, mission, vision and the values that shape our learners.`,
  }
}

const VALUES = [
  { icon: ShieldCheck, title: 'Discipline', desc: 'A structured, respectful environment where learners thrive.' },
  { icon: Award, title: 'Excellence', desc: 'High academic standards and a culture of continuous improvement.' },
  { icon: Heart, title: 'Compassion', desc: 'Caring for the whole learner — academically, socially and spiritually.' },
  { icon: Users, title: 'Community', desc: 'Strong partnerships between school, parents and the wider community.' },
]

export default async function AboutPage() {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  const established = school?.establishedYear ?? 1985
  const head = school?.headName

  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={`About ${name}`}
        subtitle={`Since ${established}, we have been shaping confident, principled young Zimbabweans ready to lead and serve.`}
        crumbs={[{ label: 'About' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* History */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">A proud heritage</h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>
                {name} was established in {established} to provide quality, accessible education to the
                community. Over the decades we have grown into a respected institution known for strong
                academic results, sporting achievement and a culture of discipline and care.
              </p>
              <p>
                Today our learners benefit from dedicated teachers, modern facilities and a curriculum
                aligned to ZIMSEC standards — from Early Childhood Development through to Advanced Level.
              </p>
              {head && <p>The school is led by <span className="font-medium text-foreground">{head}</span>, supported by an experienced staff and an active School Development Committee.</p>}
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl shadow-emerald-900/20">
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-2xl font-bold text-white">{new Date().getFullYear() - established}+ years<br /><span className="text-base font-medium text-emerald-100">of educating leaders</span></p>
            </div>
          </div>
        </section>

        {/* Mission / Vision */}
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white"><Target className="h-6 w-6" /></span>
            <h3 className="mt-4 text-xl font-bold">Our Mission</h3>
            <p className="mt-2 text-muted-foreground">To provide holistic, quality education that nurtures academic excellence, strong character and a lifelong love of learning in every child.</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white"><Eye className="h-6 w-6" /></span>
            <h3 className="mt-4 text-xl font-bold">Our Vision</h3>
            <p className="mt-2 text-muted-foreground">To be a leading centre of educational excellence in Zimbabwe, producing confident, responsible and innovative citizens.</p>
          </div>
        </section>

        {/* Values */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Our core values</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border/60 bg-card p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"><v.icon className="h-6 w-6" /></span>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
