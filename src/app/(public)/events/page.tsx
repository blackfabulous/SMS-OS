import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react'
import { getSchool, getUpcomingEvents, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `Events — ${name}`,
    description: `Upcoming events, sports fixtures and important dates at ${name}.`,
  }
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function EventsPage() {
  const events = await getUpcomingEvents(100)

  return (
    <>
      <PageHero eyebrow="Calendar" title="School Events" subtitle="Upcoming events, ceremonies, sports fixtures and key dates for our community." crumbs={[{ label: 'Events' }]} />

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {events.length > 0 ? (
          <ul className="space-y-4">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.id}`} className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <span className="text-xl font-bold leading-none">{new Date(e.startDate).getDate()}</span>
                    <span className="text-[11px] uppercase">{new Date(e.startDate).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{e.eventType}</span>
                    <h2 className="mt-1.5 font-semibold transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{e.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {fmt(e.startDate)}</span>
                      {e.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {e.venue}</span>}
                    </div>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-emerald-600 sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No upcoming events scheduled. Please check back soon.</p>
          </div>
        )}
      </div>
    </>
  )
}
