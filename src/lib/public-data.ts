import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

/**
 * Server-side data helpers for the public website (the `(public)` route group).
 * Wrapped in React `cache` so a single request that renders layout + page +
 * generateMetadata hits the database once per query.
 *
 * Every helper is resilient to database outages: if the DB is unreachable
 * (e.g. a paused Supabase project waking from cold), the query is caught and a
 * safe fallback (null / empty list) is returned so the public marketing site
 * degrades to its built-in fallback content instead of throwing a 500.
 */

/** Run a public read, returning `fallback` if the database is unreachable. */
async function safeRead<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[public-data] ${label} failed; serving fallback:`, err instanceof Error ? err.message : err)
    return fallback
  }
}

export const getSchool = cache(async () => {
  return safeRead('getSchool', () => db.school.findFirst(), null)
})

export const getPublishedNews = cache(async (take = 6) => {
  const school = await getSchool()
  if (!school) return []
  return safeRead('getPublishedNews', () => db.newsArticle.findMany({
    where: { schoolId: school.id, isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    take,
  }), [])
})

export const getNewsBySlug = cache(async (slug: string) => {
  const school = await getSchool()
  if (!school) return null
  return safeRead('getNewsBySlug', () => db.newsArticle.findFirst({
    where: { schoolId: school.id, slug, isPublished: true },
  }), null)
})

export const getUpcomingEvents = cache(async (take = 6) => {
  const school = await getSchool()
  if (!school) return []
  return safeRead('getUpcomingEvents', () => db.schoolEvent.findMany({
    where: { schoolId: school.id },
    orderBy: { startDate: 'asc' },
    take,
  }), [])
})

export const getEventById = cache(async (id: string) => {
  const school = await getSchool()
  if (!school) return null
  return safeRead('getEventById', () => db.schoolEvent.findFirst({ where: { id, schoolId: school.id } }), null)
})

export const getGalleryImages = cache(async (take = 24) => {
  const school = await getSchool()
  if (!school) return []
  return safeRead('getGalleryImages', () => db.galleryImage.findMany({
    where: { schoolId: school.id },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    take,
  }), [])
})

/** Active partner / accreditation logos for the home-page carousel. */
export const getPartners = cache(async () => {
  const school = await getSchool()
  if (!school) return []
  return safeRead('getPartners', () => db.partner.findMany({
    where: { schoolId: school.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
  }), [])
})

/** The public-site theme + home content row (creates an in-memory default if absent). */
export const getSiteTheme = cache(async () => {
  const school = await getSchool()
  if (!school) return null
  return safeRead('getSiteTheme', () => db.siteTheme.findUnique({ where: { schoolId: school.id } }), null)
})

/** Staff members the admin has chosen to feature on the public About page, ordered. */
export const getWebsiteStaff = cache(async () => {
  const school = await getSchool()
  if (!school) return []
  return safeRead('getWebsiteStaff', () => db.staff.findMany({
    where: { schoolId: school.id, showOnWebsite: true, payrollStatus: 'ACTIVE' },
    orderBy: [{ websiteOrder: 'asc' }, { lastName: 'asc' }],
    select: {
      id: true, title: true, firstName: true, lastName: true,
      position: true, department: true, qualifications: true,
      photo: true, websiteBio: true,
    },
  }), [])
})

/** Active FAQs for the public site, ordered for the accordion. */
export const getFaqs = cache(async () => {
  const school = await getSchool()
  if (!school) return []
  return safeRead('getFaqs', () => db.faq.findMany({
    where: { schoolId: school.id, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  }), [])
})

/** Active fee structures grouped by grade, ordered by grade sequence — for the admissions page. */
export const getFeeSchedule = cache(async () => {
  const school = await getSchool()
  if (!school) return []
  const grades = await safeRead('getFeeSchedule', () => db.grade.findMany({
    where: { schoolId: school.id, isActive: true },
    orderBy: { sequence: 'asc' },
    include: {
      feeStructures: { where: { isActive: true }, orderBy: { amount: 'desc' } },
    },
  }), [])
  return grades
    .filter((g) => g.feeStructures.length > 0)
    .map((g) => ({
      grade: g.name,
      level: g.level,
      total: g.feeStructures.reduce((sum, f) => sum + f.amount, 0),
      currency: g.feeStructures[0]?.currency ?? 'USD',
      items: g.feeStructures.map((f) => ({ name: f.name, amount: f.amount })),
    }))
})

/** A safe, display-ready view of the school for public pages (handles no-school case). */
export type PublicSchool = NonNullable<Awaited<ReturnType<typeof getSchool>>>

/** Site-wide defaults used when no school record exists yet. */
export const SITE_FALLBACK = {
  name: 'ZimSchool',
  motto: 'Knowledge · Discipline · Excellence',
  province: 'Zimbabwe',
  physicalAddress: 'Harare, Zimbabwe',
  contactEmail: 'info@zimschool.co.zw',
  contactPhone: '+263 242 000 000',
} as const
