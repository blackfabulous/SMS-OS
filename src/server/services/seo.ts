import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

export async function getSEO(schoolId: string, pageSlug?: string | null) {
  if (pageSlug) {
    const seoSetting = await db.sEOSetting.findUnique({
      where: { schoolId_pageSlug: { schoolId, pageSlug } },
    })
    return seoSetting
  }

  const [seoSettings, events, newsArticles] = await Promise.all([
    db.sEOSetting.findMany({ where: { schoolId }, orderBy: { pageSlug: 'asc' } }),
    db.schoolEvent.findMany({ where: { schoolId }, select: { id: true, title: true, startDate: true, createdAt: true } }),
    db.newsArticle.findMany({
      where: { schoolId, isPublished: true },
      select: { id: true, slug: true, publishedAt: true, updatedAt: true },
    }),
  ])

  const sitemapData = {
    pages: seoSettings.map((s) => ({ slug: s.pageSlug, updatedAt: s.updatedAt })),
    events: events.map((e) => ({ id: e.id, title: e.title, startDate: e.startDate, createdAt: e.createdAt })),
    news: newsArticles.map((n) => ({ id: n.id, slug: n.slug, publishedAt: n.publishedAt, updatedAt: n.updatedAt })),
  }

  return { seoSettings, sitemapData }
}

export async function createSEO(schoolId: string, body: Record<string, unknown>) {
  const { pageSlug, metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImage, schemaMarkup, canonicalUrl, robotsDirective } = body
  if (!pageSlug) throw new AppError('VALIDATION', 'pageSlug is required')

  const existing = await db.sEOSetting.findUnique({
    where: { schoolId_pageSlug: { schoolId, pageSlug: pageSlug as string } },
  })
  if (existing) throw new AppError('CONFLICT', 'SEO setting already exists for this page slug. Use PUT to update.')

  const seoSetting = await db.sEOSetting.create({
    data: {
      schoolId,
      pageSlug: pageSlug as string,
      metaTitle: metaTitle as string | undefined,
      metaDescription: metaDescription as string | undefined,
      metaKeywords: metaKeywords as string | undefined,
      ogTitle: ogTitle as string | undefined,
      ogDescription: ogDescription as string | undefined,
      ogImage: ogImage as string | undefined,
      schemaMarkup: schemaMarkup as string | undefined,
      canonicalUrl: canonicalUrl as string | undefined,
      robotsDirective: (robotsDirective as string) || 'index, follow',
    },
  })

  logAudit({ action: 'CREATE', entity: 'seo', entityId: seoSetting.id, schoolId }).catch(() => {})
  return seoSetting
}

export async function updateSEO(schoolId: string, id: string, fieldsToUpdate: Record<string, unknown>) {
  const owned = await db.sEOSetting.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'SEO setting not found')

  const seoSetting = await db.sEOSetting.update({
    where: { id },
    data: { ...fieldsToUpdate, updatedAt: new Date() },
  })

  logAudit({ action: 'UPDATE', entity: 'seo', entityId: seoSetting.id, schoolId }).catch(() => {})
  return seoSetting
}

export async function deleteSEO(schoolId: string, id: string) {
  const owned = await db.sEOSetting.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'SEO setting not found')

  await db.sEOSetting.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'seo', entityId: id, schoolId }).catch(() => {})
  return { deleted: true }
}

export function handleSEOError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
