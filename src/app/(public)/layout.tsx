import type { CSSProperties, ReactNode } from 'react'
import { getSchool, getSiteTheme, SITE_FALLBACK } from '@/lib/public-data'
import { resolveTheme } from '@/lib/site-theme'
import { PublicHeader } from './_components/public-header'
import { PublicFooter } from './_components/public-footer'

// Public pages read the school record at request time.
export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [school, themeRow] = await Promise.all([getSchool(), getSiteTheme()])
  const name = school?.name ?? SITE_FALLBACK.name
  const theme = resolveTheme(themeRow)

  // Brand tokens exposed site-wide for theme-driven accents.
  const brandVars = {
    '--bp': theme.primaryColor,
    '--bs': theme.secondaryColor,
    '--ba': theme.accentColor,
    '--bd': theme.darkColor,
  } as CSSProperties

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
    <div className="flex min-h-screen flex-col bg-white dark:bg-background" style={brandVars}>
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
