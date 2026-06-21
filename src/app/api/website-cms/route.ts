import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json({ success: false, error: 'School not configured' }, { status: 400 })
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

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('CMS GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch CMS data' }, { status: 500 })
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
      return NextResponse.json({ success: false, error: 'School not configured' }, { status: 400 })
    }

    if (action === 'createPage') {
      if (!data?.title || !data?.slug || !data?.content) {
        return NextResponse.json({ success: false, error: 'title, slug, and content are required' }, { status: 400 })
      }
      const page = await db.websitePage.create({
        data: { schoolId, slug: data.slug, title: data.title, content: data.content, heroImage: data.heroImage, metaTitle: data.metaTitle, metaDescription: data.metaDescription, metaKeywords: data.metaKeywords, schemaMarkup: data.schemaMarkup, isPublished: data.isPublished ?? false, showInNavigation: data.showInNavigation ?? true, sortOrder: data.sortOrder ?? 0 },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return NextResponse.json({ success: true, data: page }, { status: 201 })
    }

    if (action === 'createNews') {
      if (!data?.title || !data?.slug || !data?.content) {
        return NextResponse.json({ success: false, error: 'title, slug, and content are required' }, { status: 400 })
      }
      const article = await db.newsArticle.create({
        data: { schoolId, title: data.title, slug: data.slug, content: data.content, excerpt: data.excerpt, featuredImage: data.featuredImage, category: data.category || 'GENERAL', authorName: data.authorName, isPublished: data.isPublished ?? false, isFeatured: data.isFeatured ?? false, publishedAt: data.isPublished ? new Date() : null, metaTitle: data.metaTitle, metaDescription: data.metaDescription },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return NextResponse.json({ success: true, data: article }, { status: 201 })
    }

    if (action === 'uploadGalleryImage') {
      if (!data?.title || !data?.imageUrl) {
        return NextResponse.json({ success: false, error: 'title and imageUrl are required' }, { status: 400 })
      }
      const image = await db.galleryImage.create({
        data: { schoolId, title: data.title, description: data.description, imageUrl: data.imageUrl, category: data.category || 'GENERAL', isFeatured: data.isFeatured ?? false, sortOrder: data.sortOrder ?? 0 },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return NextResponse.json({ success: true, data: image }, { status: 201 })
    }

    if (action === 'createPartner') {
      if (!data?.name) {
        return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 })
      }
      const partner = await db.partner.create({
        data: { schoolId, name: data.name, logoUrl: data.logoUrl || null, websiteUrl: data.websiteUrl || null, category: data.category || 'PARTNER', sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return NextResponse.json({ success: true, data: partner }, { status: 201 })
    }

    if (action === 'createFaq') {
      if (!data?.question || !data?.answer) {
        return NextResponse.json({ success: false, error: 'question and answer are required' }, { status: 400 })
      }
      const faq = await db.faq.create({
        data: { schoolId, question: data.question, answer: data.answer, category: data.category || 'GENERAL', sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
      })
      logAudit({ action: 'CREATE', entity: 'website-cms' }).catch(() => {})
      return NextResponse.json({ success: true, data: faq }, { status: 201 })
    }

    if (action === 'createSeo') {
      const slug = String(data?.pageSlug || '').trim()
      if (!slug) return NextResponse.json({ success: false, error: 'pageSlug is required' }, { status: 400 })
      const existing = await db.sEOSetting.findUnique({ where: { schoolId_pageSlug: { schoolId, pageSlug: slug } } })
      if (existing) return NextResponse.json({ success: false, error: `SEO settings for "${slug}" already exist` }, { status: 409 })
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
      return NextResponse.json({ success: true, data: seo }, { status: 201 })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('CMS POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create CMS content' }, { status: 500 })
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
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      const page = await db.websitePage.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: (body?.id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: page })
    }

    if (action === 'updateNews') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      const updateData = { ...data, updatedAt: new Date() }
      if (data.isPublished && !data.publishedAt) updateData.publishedAt = new Date()
      const article = await db.newsArticle.update({ where: { id }, data: updateData })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: (body?.id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: article })
    }

    if (action === 'updateBranding') {
      const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
      if (!school) return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 })
      const updated = await db.school.update({ where: { id: school.id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: (body?.id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: updated })
    }

    if (action === 'updateGallery') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      const image = await db.galleryImage.update({ where: { id }, data })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return NextResponse.json({ success: true, data: image })
    }

    if (action === 'updatePartner') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      const partner = await db.partner.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return NextResponse.json({ success: true, data: partner })
    }

    if (action === 'updateTheme') {
      const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
      if (!school) return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 })
      // Upsert so the row is created on first save if the seed never ran.
      const theme = await db.siteTheme.upsert({
        where: { schoolId: school.id },
        update: { ...data, updatedAt: new Date() },
        create: { schoolId: school.id, ...data },
      })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: theme.id }).catch(() => {})
      return NextResponse.json({ success: true, data: theme })
    }

    if (action === 'updateFaq') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      const faq = await db.faq.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return NextResponse.json({ success: true, data: faq })
    }

    if (action === 'updateSeo') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      // pageSlug is the natural key; don't let it be edited to a colliding value here.
      const { pageSlug: _ignore, schoolId: _s, id: _i, ...fields } = data ?? {}
      void _ignore; void _s; void _i
      const seo = await db.sEOSetting.update({ where: { id }, data: { ...fields, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'website-cms', entityId: id }).catch(() => {})
      return NextResponse.json({ success: true, data: seo })
    }

    if (action === 'updateStaffWebsite') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
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
      return NextResponse.json({ success: true, data: staff })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('CMS PUT error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update CMS content' }, { status: 500 })
  }
}

// DELETE /api/website-cms - Delete page, news, or gallery image
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id } = body

    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    if (action === 'deletePage') {
      await db.websitePage.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deleteNews') {
      await db.newsArticle.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deleteGalleryImage') {
      await db.galleryImage.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deletePartner') {
      await db.partner.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deleteFaq') {
      await db.faq.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deleteSeo') {
      await db.sEOSetting.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'website-cms', entityId: (id ?? undefined) }).catch(() => {})
      return NextResponse.json({ success: true, data: { deleted: true } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('CMS DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete CMS content' }, { status: 500 })
  }
}
