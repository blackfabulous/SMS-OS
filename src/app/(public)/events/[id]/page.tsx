import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin, Clock } from 'lucide-react'
import { getEventById, getSchool, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const event = await getEventById(id)
  if (!event) return { title: 'Event not found' }
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  const description = event.description || `${event.title} at ${name}`
  return {
    title: `${event.title} — ${name}`,
    description,
    openGraph: { title: event.title, description, type: 'website' },
  }
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEventById(id)
  if (!event) notFound()

  return (
    <>
      <PageHero eyebrow={event.eventType} title={event.title} crumbs={[{ label: 'Events', href: '/events' }, { label: 'Details' }]} />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Starts</p>
              <p className="font-medium">{fmt(event.startDate)}</p>
            </div>
          </div>
          {event.endDate && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ends</p>
                <p className="font-medium">{fmt(event.endDate)}</p>
              </div>
            </div>
          )}
          {event.venue && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Venue</p>
                <p className="font-medium">{event.venue}</p>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-8 space-y-4 leading-relaxed text-foreground/85">
            {event.description.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}

        <div className="mt-12 border-t border-border/60 pt-6">
          <Link href="/events" className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
            <ArrowLeft className="h-4 w-4" /> Back to all events
          </Link>
        </div>
      </div>
    </>
  )
}
