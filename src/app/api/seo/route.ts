import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/seo - Returns SEO data
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('pageSlug')
    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('FORBIDDEN', 'School not configured')
    }

    // Return specific page SEO if pageSlug provided
    if (pageSlug) {
      const seoSetting = await db.sEOSetting.findUnique({
        where: { schoolId_pageSlug: { schoolId, pageSlug } },
      })
      return ok(seoSetting)
    }

    // Return all SEO settings + sitemap data
    const [seoSettings, events, newsArticles] = await Promise.all([
      db.sEOSetting.findMany({ where: { schoolId }, orderBy: { pageSlug: 'asc' } }),
      db.schoolEvent.findMany({ where: { schoolId }, select: { id: true, title: true, startDate: true, createdAt: true } }),
      db.newsArticle.findMany({ where: { schoolId, isPublished: true }, select: { id: true, slug: true, publishedAt: true, updatedAt: true } }),
    ])

    const sitemapData = {
      pages: seoSettings.map((s) => ({ slug: s.pageSlug, updatedAt: s.updatedAt })),
      events: events.map((e) => ({ id: e.id, title: e.title, startDate: e.startDate, createdAt: e.createdAt })),
      news: newsArticles.map((n) => ({ id: n.id, slug: n.slug, publishedAt: n.publishedAt, updatedAt: n.updatedAt })),
    }

    return ok({ seoSettings, sitemapData })
  } catch (error) {
    logger.error({ err: error }, 'SEO GET error')
    return fail('INTERNAL', 'Failed to fetch SEO data')
  }
}

// POST /api/seo - Create SEO setting
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { pageSlug, metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImage, schemaMarkup, canonicalUrl, robotsDirective } = body
    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('FORBIDDEN', 'School not configured')
    }
    if (!pageSlug) {
      return fail('VALIDATION', 'pageSlug is required')
    }

    // Check if SEO setting already exists for this slug
    const existing = await db.sEOSetting.findUnique({
      where: { schoolId_pageSlug: { schoolId, pageSlug } },
    })
    if (existing) {
      return fail('CONFLICT', 'SEO setting already exists for this page slug. Use PUT to update.')
    }

    const seoSetting = await db.sEOSetting.create({
      data: { schoolId, pageSlug, metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImage, schemaMarkup, canonicalUrl, robotsDirective: robotsDirective || 'index, follow' },
    })
    logAudit({ action: 'CREATE', entity: 'seo' }).catch(() => {})
    return ok(seoSetting, 201)
  } catch (error) {
    logger.error({ err: error }, 'SEO POST error')
    return fail('INTERNAL', 'Failed to create SEO setting')
  }
}

// PUT /api/seo - Update SEO setting
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...fieldsToUpdate } = body

    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }

    const seoSetting = await db.sEOSetting.update({
      where: { id },
      data: { ...fieldsToUpdate, updatedAt: new Date() },
    })
    logAudit({ action: 'UPDATE', entity: 'seo', entityId: (body?.id ?? undefined) }).catch(() => {})
    return ok(seoSetting)
  } catch (error) {
    logger.error({ err: error }, 'SEO PUT error')
    return fail('INTERNAL', 'Failed to update SEO setting')
  }
}

// DELETE /api/seo - Delete SEO setting
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }

    await db.sEOSetting.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'seo', entityId: (id ?? undefined) }).catch(() => {})
    return ok({ deleted: true })
  } catch (error) {
    logger.error({ err: error }, 'SEO DELETE error')
    return fail('INTERNAL', 'Failed to delete SEO setting')
  }
}
