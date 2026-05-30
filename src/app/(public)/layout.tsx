import type { ReactNode } from 'react'
import { getSchool, SITE_FALLBACK } from '@/lib/public-data'
import { PublicHeader } from './_components/public-header'
import { PublicFooter } from './_components/public-footer'

// Public pages read the school record at request time.
export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name,
    slogan: school?.motto ?? SITE_FALLBACK.motto,
    address: {
      '@type': 'PostalAddress',
      streetAddress: school?.physicalAddress ?? SITE_FALLBACK.physicalAddress,
      addressRegion: school?.province ?? SITE_FALLBACK.province,
      addressCountry: 'ZW',
    },
    email: school?.contactEmail ?? SITE_FALLBACK.contactEmail,
    telephone: school?.contactPhone ?? SITE_FALLBACK.contactPhone,
    ...(school?.establishedYear ? { foundingDate: String(school.establishedYear) } : {}),
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader schoolName={name} />
      <main className="flex-1">{children}</main>
      <PublicFooter
        schoolName={name}
        motto={school?.motto ?? SITE_FALLBACK.motto}
        address={school?.physicalAddress ?? SITE_FALLBACK.physicalAddress}
        phone={school?.contactPhone ?? SITE_FALLBACK.contactPhone}
        email={school?.contactEmail ?? SITE_FALLBACK.contactEmail}
      />
    </div>
  )
}
