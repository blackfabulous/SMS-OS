import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/website-cms - Returns CMS data
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'
    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('FORBIDDEN', 'School not configured')
    }

    const result: Record<string, unknown> = {}

    if (section === 'all' || section === 'pages') {
      result.pages = await db.websitePage.findMany({
        where: { schoolId },
        orderBy: { sortOrder: 'asc' },
      })
    }
    if (section === 'all' || section === 'news') {
      result.news = await db.newsArticle.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
      })
    }
    if (section === 'all' || section === 'gallery') {
      result.gallery = await db.galleryImage.findMany({
        where: { schoolId },
        orderBy: { sortOrder: 'asc' },
      })
    }
    if (section === 'all' || section === 'partners') {
      result.partners = await db.partner.findMany({
        where: { schoolId },
        orderBy: { sortOrder: 'asc' },
      })
    }
    if (section === 'all' || section === 'theme') {
      result.theme = await db.siteTheme.findUnique({ where: { schoolId } })
    }
    if (section === 'all' || section === 'staff') {
      result.staff = await db.staff.findMany({
        where: { schoolId, payrollStatus: 'ACTIVE' },
        orderBy: [{ websiteOrder: 'asc' }, { lastName: 'asc' }],
        select: {
          id: true, title: true, firstName: true, lastName: true, position: true, department: true,
          qualifications: true, photo: true, showOnWebsite: true, websiteBio: true, websiteOrder: true,
        },
      })
    }
    if (section === 'all' || section === 'faqs') {
      result.faqs = await db.faq.findMany({
        where: { schoolId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      })
    }
    if (section === 'all' || section === 'seo') {
      result.seo = await db.sEOSetting.findMany({
        where: { schoolId },
        orderBy: { pageSlug: 'asc' },
      })
    }
    if (section === 'all') {
      result.branding = school
    }

    return ok(result)
  } catch (error) {
    logger.error({ err: error }, 'CMS GET error')
    return fail('INTERNAL', 'Failed to fetch CMS data')
  }
}

// POST /api/website-cms - Create page, news, or gallery image
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, data } = body
    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('FORBIDDEN', 'School not configured')
    }

    if (action === 'createPage') {
      if (!data?.title || !data?.slug || !data?.content) {
        return fail('VALIDATION', 'title, slug, and content are required')
      }
      const page = await db.websitePage.create({
        data: { schoolId, slug: data.slug, title: data.title, content: data.content, heroImage: data.heroImage, metaTitle: data.metaTitle, metaDescription: data.metaDescription, metaKeywords: data.metaKeywords, schemaMarkup: data.schemaMarkup, isPublished: data.isPublished ?? false, showInNavigation: data.showInNavigation ?? true, sortOrder: data.sortOrder ?? 0 },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return ok(page, 201)
    }

    if (action === 'createNews') {
      if (!data?.title || !data?.slug || !data?.content) {
        return fail('VALIDATION', 'title, slug, and content are required')
      }
      const article = await db.newsArticle.create({
        data: { schoolId, title: data.title, slug: data.slug, content: data.content, excerpt: data.excerpt, featuredImage: data.featuredImage, category: data.category || 'GENERAL', authorName: data.authorName, isPublished: data.isPublished ?? false, isFeatured: data.isFeatured ?? false, publishedAt: data.isPublished ? new Date() : null, metaTitle: data.metaTitle, metaDescription: data.metaDescription },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return ok(article, 201)
    }

    if (action === 'uploadGalleryImage') {
      if (!data?.title || !data?.imageUrl) {
        return fail('VALIDATION', 'title and imageUrl are required')
      }
      const image = await db.galleryImage.create({
        data: { schoolId, title: data.title, description: data.description, imageUrl: data.imageUrl, category: data.category || 'GENERAL', isFeatured: data.isFeatured ?? false, sortOrder: data.sortOrder ?? 0 },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return ok(image, 201)
    }

    if (action === 'createPartner') {
      if (!data?.name) {
        return fail('VALIDATION', 'name is required')
      }
      const partner = await db.partner.create({
        data: { schoolId, name: data.name, logoUrl: data.logoUrl || null, websiteUrl: data.websiteUrl || null, category: data.category || 'PARTNER', sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return ok(partner, 201)
    }

    if (action === 'createFaq') {
      if (!data?.question || !data?.answer) {
        return fail('VALIDATION', 'question and answer are required')
      }
      const faq = await db.faq.create({
        data: { schoolId, question: data.question, answer: data.answer, category: data.category || 'GENERAL', sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return ok(faq, 201)
    }

    if (action === 'createSeo') {
      const slug = String(data?.pageSlug || '').trim()
      if (!slug) return fail('VALIDATION', 'pageSlug is required')
      const existing = await db.sEOSetting.findUnique({ where: { schoolId_pageSlug: { schoolId, pageSlug: slug } } })
      if (existing) return fail('CONFLICT', `SEO settings for "${slug}" already exist`)
      const seo = await db.sEOSetting.create({
        data: {
          schoolId, pageSlug: slug,
          metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null, metaKeywords: data.metaKeywords || null,
          ogTitle: data.ogTitle || null, ogDescription: data.ogDescription || null, ogImage: data.ogImage || null,
          canonicalUrl: data.canonicalUrl || null, schemaMarkup: data.schemaMarkup || null,
          robotsDirective: data.robotsDirective || 'index, follow',
        },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return ok(seo, 201)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    logger.error({ err: error }, 'CMS POST error')
    return fail('INTERNAL', 'Failed to create CMS content')
  }
}

// PUT /api/website-cms - Update page, news, or branding
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id, data } = body

    if (action === 'updatePage') {
      if (!id) return fail('VALIDATION', 'ID is required')
      const page = await db.websitePage.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: (body?.id ?? undefined) }).catch(() => {})
      return ok(page)
    }

    if (action === 'updateNews') {
      if (!id) return fail('VALIDATION', 'ID is required')
      const updateData = { ...data, updatedAt: new Date() }
      if (data.isPublished && !data.publishedAt) updateData.publishedAt = new Date()
      const article = await db.newsArticle.update({ where: { id }, data: updateData })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: (body?.id ?? undefined) }).catch(() => {})
      return ok(article)
    }

    if (action === 'updateBranding') {
      const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
      if (!school) return fail('NOT_FOUND', 'School not found')
      const updated = await db.school.update({ where: { id: school.id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: (body?.id ?? undefined) }).catch(() => {})
      return ok(updated)
    }

    if (action === 'updateGallery') {
      if (!id) return fail('VALIDATION', 'ID is required')
      const image = await db.galleryImage.update({ where: { id }, data })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return ok(image)
    }

    if (action === 'updatePartner') {
      if (!id) return fail('VALIDATION', 'ID is required')
      const partner = await db.partner.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return ok(partner)
    }

    if (action === 'updateTheme') {
      const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
      if (!school) return fail('NOT_FOUND', 'School not found')
      // Upsert so the row is created on first save if the seed never ran.
      const theme = await db.siteTheme.upsert({
        where: { schoolId: school.id },
        update: { ...data, updatedAt: new Date() },
        create: { schoolId: school.id, ...data },
      })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: theme.id }).catch(() => {})
      return ok(theme)
    }

    if (action === 'updateFaq') {
      if (!id) return fail('VALIDATION', 'ID is required')
      const faq = await db.faq.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return ok(faq)
    }

    if (action === 'updateSeo') {
      if (!id) return fail('VALIDATION', 'ID is required')
      // pageSlug is the natural key; don't let it be edited to a colliding value here.
      const { pageSlug: _ignore, schoolId: _s, id: _i, ...fields } = data ?? {}
      void _ignore; void _s; void _i
      const seo = await db.sEOSetting.update({ where: { id }, data: { ...fields, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return ok(seo)
    }

    if (action === 'updateStaffWebsite') {
      if (!id) return fail('VALIDATION', 'ID is required')
      // Only the public-website fields are editable here; HR owns the rest of the record.
      const allowed: Record<string, unknown> = {}
      if (data?.showOnWebsite !== undefined) allowed.showOnWebsite = Boolean(data.showOnWebsite)
      if (data?.websiteBio !== undefined) allowed.websiteBio = data.websiteBio || null
      if (data?.websiteOrder !== undefined) allowed.websiteOrder = Number(data.websiteOrder) || 0
      const staff = await db.staff.update({
        where: { id },
        data: { ...allowed, updatedAt: new Date() },
        select: {
          id: true, title: true, firstName: true, lastName: true, position: true, department: true,
          qualifications: true, photo: true, showOnWebsite: true, websiteBio: true, websiteOrder: true,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return ok(staff)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    logger.error({ err: error }, 'CMS PUT error')
    return fail('INTERNAL', 'Failed to update CMS content')
  }
}

// DELETE /api/website-cms - Delete page, news, or gallery image
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id } = body

    if (!id) return fail('VALIDATION', 'ID is required')

    if (action === 'deletePage') {
      await db.websitePage.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }
    if (action === 'deleteNews') {
      await db.newsArticle.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }
    if (action === 'deleteGalleryImage') {
      await db.galleryImage.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }
    if (action === 'deletePartner') {
      await db.partner.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }
    if (action === 'deleteFaq') {
      await db.faq.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }
    if (action === 'deleteSeo') {
      await db.sEOSetting.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    logger.error({ err: error }, 'CMS DELETE error')
    return fail('INTERNAL', 'Failed to delete CMS content')
  }
}
