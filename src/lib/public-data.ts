import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

/**
 * Server-side data helpers for the public website (the `(public)` route group).
 * Wrapped in React `cache` so a single request that renders layout + page +
 * generateMetadata hits the database once per query.
 */

export const getSchool = cache(async () => {
  return db.school.findFirst()
})

export const getPublishedNews = cache(async (take = 6) => {
  const school = await getSchool()
  if (!school) return []
  return db.newsArticle.findMany({
    where: { schoolId: school.id, isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    take,
  })
})

export const getNewsBySlug = cache(async (slug: string) => {
  const school = await getSchool()
  if (!school) return null
  return db.newsArticle.findFirst({
    where: { schoolId: school.id, slug, isPublished: true },
  })
})

export const getUpcomingEvents = cache(async (take = 6) => {
  const school = await getSchool()
  if (!school) return []
  return db.schoolEvent.findMany({
    where: { schoolId: school.id },
    orderBy: { startDate: 'asc' },
    take,
  })
})

export const getEventById = cache(async (id: string) => {
  const school = await getSchool()
  if (!school) return null
  return db.schoolEvent.findFirst({ where: { id, schoolId: school.id } })
})

export const getGalleryImages = cache(async (take = 24) => {
  const school = await getSchool()
  if (!school) return []
  return db.galleryImage.findMany({
    where: { schoolId: school.id },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    take,
  })
})

/** Active fee structures grouped by grade, ordered by grade sequence — for the admissions page. */
export const getFeeSchedule = cache(async () => {
  const school = await getSchool()
  if (!school) return []
  const grades = await db.grade.findMany({
    where: { schoolId: school.id, isActive: true },
    orderBy: { sequence: 'asc' },
    include: {
      feeStructures: { where: { isActive: true }, orderBy: { amount: 'desc' } },
    },
  })
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
