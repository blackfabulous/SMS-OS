import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { getSchool, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'
import { ContactForm } from './contact-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `Contact — ${name}`,
    description: `Get in touch with ${name}. Find our address, phone, email and location map.`,
  }
}

export default async function ContactPage() {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  const address = school?.physicalAddress ?? SITE_FALLBACK.physicalAddress
  const phone = school?.contactPhone ?? SITE_FALLBACK.contactPhone
  const email = school?.contactEmail ?? SITE_FALLBACK.contactEmail

  // Keyless Google Maps embed — prefer GPS coordinates, fall back to address.
  const mapQuery = school?.gpsLatitude && school?.gpsLongitude
    ? `${school.gpsLatitude},${school.gpsLongitude}`
    : `${name}, ${address}`
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`

  const details = [
    { icon: MapPin, label: 'Address', value: address },
    { icon: Phone, label: 'Phone', value: phone, href: `tel:${phone}` },
    { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
    { icon: Clock, label: 'Office hours', value: 'Mon–Fri, 7:30am – 4:30pm' },
  ]

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact Us"
        subtitle={`We’d love to hear from you. Reach ${name} using the details below or send us a message.`}
        crumbs={[{ label: 'Contact' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight">Reach us</h2>
            <ul className="mt-6 space-y-5">
              {details.map((d) => (
                <li key={d.label} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                    <d.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{d.label}</p>
                    {d.href
                      ? <a href={d.href} className="font-medium transition-colors hover:text-emerald-700 dark:hover:text-emerald-400">{d.value}</a>
                      : <p className="font-medium">{d.value}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight">Send a message</h2>
            <div className="mt-6"><ContactForm /></div>
          </div>
        </div>
      </div>

      {/* Wide full-width map */}
      <section className="border-t border-border/60">
        <iframe
          title={`Map to ${name}`}
          src={mapSrc}
          className="h-[420px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </section>
    </>
  )
}
