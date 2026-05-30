import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ClipboardCheck, CalendarClock, BadgeCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getSchool, getFeeSchedule, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `Admissions — ${name}`,
    description: `Apply to ${name}. Entry requirements, the application process and the current fees schedule for day scholars and boarders.`,
  }
}

const REQUIREMENTS = [
  'Completed application form (online or at the school office)',
  'Certified copy of the learner’s birth certificate',
  'Most recent school report / transfer letter',
  'Two passport-size photographs',
  'Guardian’s national ID and proof of residence',
]

const PROCESS = [
  { icon: FileText, title: 'Submit Application', desc: 'Complete the online form or collect one from the school office.' },
  { icon: ClipboardCheck, title: 'Assessment & Review', desc: 'Shortlisted applicants sit a placement assessment and interview.' },
  { icon: CalendarClock, title: 'Offer & Acceptance', desc: 'Successful applicants receive an offer letter and enrolment pack.' },
  { icon: BadgeCheck, title: 'Enrolment', desc: 'Pay the acceptance fee, submit documents and confirm your place.' },
]

export default async function AdmissionsPage() {
  const [school, fees] = await Promise.all([getSchool(), getFeeSchedule()])
  const name = school?.name ?? SITE_FALLBACK.name

  return (
    <>
      <PageHero
        eyebrow="Join our community"
        title="Admissions"
        subtitle={`Begin your child’s journey at ${name}. We welcome applications from learners of all backgrounds who are ready to grow in a disciplined, caring environment.`}
        crumbs={[{ label: 'Admissions' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Process */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How to apply</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-border/60 bg-card p-6">
                <span className="absolute right-5 top-5 text-3xl font-extrabold text-emerald-100 dark:text-emerald-950">{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Requirements + Fees */}
        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Entry requirements</h2>
            <ul className="mt-6 space-y-3">
              {REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="text-sm text-foreground/90">{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-950/30">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">Ready to begin?</h3>
              <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-300/80">Complete our secure online application in a few minutes.</p>
              <Link
                href="/admissions/apply"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Start your application <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Fees schedule</h2>
            <p className="mt-2 text-sm text-muted-foreground">Per-term fees by grade. Boarding and optional levies are billed separately.</p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
              {fees.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-semibold">Grade</th>
                      <th className="px-4 py-3 font-semibold">Level</th>
                      <th className="px-4 py-3 text-right font-semibold">Per term</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {fees.map((f) => (
                      <tr key={f.grade} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{f.grade}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.level}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {f.currency} {f.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  Detailed fees are available on request. Please <Link href="/contact" className="font-medium text-emerald-700 dark:text-emerald-400">contact the school office</Link>.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
