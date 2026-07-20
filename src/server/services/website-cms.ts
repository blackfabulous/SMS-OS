import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

export async function getCMSData(schoolId: string, section: string) {
  const school = await db.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new AppError('FORBIDDEN', 'School not configured')

  const result: Record<string, unknown> = {}
  if (section === 'all' || section === 'pages') result.pages = await db.websitePage.findMany({ where: { schoolId }, orderBy: { sortOrder: 'asc' } })
  if (section === 'all' || section === 'news') result.news = await db.newsArticle.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } })
  if (section === 'all' || section === 'gallery') result.gallery = await db.galleryImage.findMany({ where: { schoolId }, orderBy: { sortOrder: 'asc' } })
  if (section === 'all' || section === 'partners') result.partners = await db.partner.findMany({ where: { schoolId }, orderBy: { sortOrder: 'asc' } })
  if (section === 'all' || section === 'theme') result.theme = await db.siteTheme.findUnique({ where: { schoolId } })
  if (section === 'all' || section === 'staff') {
    result.staff = await db.staff.findMany({
      where: { schoolId, payrollStatus: 'ACTIVE' as any },
      orderBy: [{ websiteOrder: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true, title: true, firstName: true, lastName: true, position: true, department: true,
        qualifications: true, photo: true, showOnWebsite: true, websiteBio: true, websiteOrder: true,
      },
    })
  }
  if (section === 'all' || section === 'faqs') result.faqs = await db.faq.findMany({ where: { schoolId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
  if (section === 'all' || section === 'seo') result.seo = await db.sEOSetting.findMany({ where: { schoolId }, orderBy: { pageSlug: 'asc' } })
  if (section === 'all') result.branding = school

  return result
}

function log(action: string, entity: string, entityId?: string, schoolId?: string) {
  logAudit({ action, entity, entityId, schoolId }).catch(() => {})
}

export async function processCMS(action: string, schoolId: string, body: { id?: string; data?: any }) {
  const { id, data } = body

  if (action === 'createPage') {
    if (!data?.title || !data?.slug || !data?.content) throw new AppError('VALIDATION', 'title, slug, and content are required')
    const page = await db.websitePage.create({
      data: { schoolId, slug: data.slug, title: data.title, content: data.content, heroImage: data.heroImage, metaTitle: data.metaTitle, metaDescription: data.metaDescription, metaKeywords: data.metaKeywords, schemaMarkup: data.schemaMarkup, isPublished: data.isPublished ?? false, showInNavigation: data.showInNavigation ?? true, sortOrder: data.sortOrder ?? 0 },
    })
    log('CREATE', 'website-cms', page.id, schoolId)
    return page
  }

  if (action === 'createNews') {
    if (!data?.title || !data?.slug || !data?.content) throw new AppError('VALIDATION', 'title, slug, and content are required')
    const article = await db.newsArticle.create({
      data: { schoolId, title: data.title, slug: data.slug, content: data.content, excerpt: data.excerpt, featuredImage: data.featuredImage, category: data.category || 'GENERAL', authorName: data.authorName, isPublished: data.isPublished ?? false, isFeatured: data.isFeatured ?? false, publishedAt: data.isPublished ? new Date() : null, metaTitle: data.metaTitle, metaDescription: data.metaDescription },
    })
    log('CREATE', 'website-cms', article.id, schoolId)
    return article
  }

  if (action === 'uploadGalleryImage') {
    if (!data?.title || !data?.imageUrl) throw new AppError('VALIDATION', 'title and imageUrl are required')
    const image = await db.galleryImage.create({
      data: { schoolId, title: data.title, description: data.description, imageUrl: data.imageUrl, category: data.category || 'GENERAL', isFeatured: data.isFeatured ?? false, sortOrder: data.sortOrder ?? 0 },
    })
    log('CREATE', 'website-cms', image.id, schoolId)
    return image
  }

  if (action === 'createPartner') {
    if (!data?.name) throw new AppError('VALIDATION', 'name is required')
    const partner = await db.partner.create({
      data: { schoolId, name: data.name, logoUrl: data.logoUrl || null, websiteUrl: data.websiteUrl || null, category: data.category || 'PARTNER', sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
    })
    log('CREATE', 'website-cms', partner.id, schoolId)
    return partner
  }

  if (action === 'createFaq') {
    if (!data?.question || !data?.answer) throw new AppError('VALIDATION', 'question and answer are required')
    const faq = await db.faq.create({
      data: { schoolId, question: data.question, answer: data.answer, category: data.category || 'GENERAL', sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
    })
    log('CREATE', 'website-cms', faq.id, schoolId)
    return faq
  }

  if (action === 'createSeo') {
    const slug = String(data?.pageSlug || '').trim()
    if (!slug) throw new AppError('VALIDATION', 'pageSlug is required')
    const existing = await db.sEOSetting.findUnique({ where: { schoolId_pageSlug: { schoolId, pageSlug: slug } } })
    if (existing) throw new AppError('CONFLICT', `SEO settings for "${slug}" already exist`)
    const seo = await db.sEOSetting.create({
      data: { schoolId, pageSlug: slug, metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null, metaKeywords: data.metaKeywords || null, ogTitle: data.ogTitle || null, ogDescription: data.ogDescription || null, ogImage: data.ogImage || null, canonicalUrl: data.canonicalUrl || null, schemaMarkup: data.schemaMarkup || null, robotsDirective: data.robotsDirective || 'index, follow' },
    })
    log('CREATE', 'website-cms', seo.id, schoolId)
    return seo
  }

  if (action === 'updatePage') {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const page = await db.websitePage.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
    log('UPDATE', 'website-cms', id, schoolId)
    return page
  }

  if (action === 'updateNews') {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const updateData = { ...data, updatedAt: new Date() }
    if (data.isPublished && !data.publishedAt) updateData.publishedAt = new Date()
    const article = await db.newsArticle.update({ where: { id }, data: updateData })
    log('UPDATE', 'website-cms', id, schoolId)
    return article
  }

  if (action === 'updateBranding') {
    const updated = await db.school.update({ where: { id: schoolId }, data: { ...data, updatedAt: new Date() } })
    log('UPDATE', 'website-cms', schoolId, schoolId)
    return updated
  }

  if (action === 'updateGallery') {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const image = await db.galleryImage.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
    log('UPDATE', 'website-cms', id, schoolId)
    return image
  }

  if (action === 'updatePartner') {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const partner = await db.partner.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
    log('UPDATE', 'website-cms', id, schoolId)
    return partner
  }

  if (action === 'updateTheme') {
    const theme = await db.siteTheme.upsert({
      where: { schoolId },
      update: { ...data, updatedAt: new Date() },
      create: { schoolId, ...data },
    })
    log('UPDATE', 'website-cms', theme.id, schoolId)
    return theme
  }

  if (action === 'updateFaq') {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const faq = await db.faq.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
    log('UPDATE', 'website-cms', id, schoolId)
    return faq
  }

  if (action === 'updateSeo') {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const { pageSlug, schoolId: _, id: __, ...fields } = data ?? {}
    void pageSlug; void _; void __
    const seo = await db.sEOSetting.update({ where: { id }, data: { ...fields, updatedAt: new Date() } })
    log('UPDATE', 'website-cms', id, schoolId)
    return seo
  }

  if (action === 'updateStaffWebsite') {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const allowed: Record<string, unknown> = {}
    if (data?.showOnWebsite !== undefined) allowed.showOnWebsite = Boolean(data.showOnWebsite)
    if (data?.websiteBio !== undefined) allowed.websiteBio = data.websiteBio || null
    if (data?.websiteOrder !== undefined) allowed.websiteOrder = Number(data.websiteOrder) || 0
    const staff = await db.staff.update({
      where: { id },
      data: { ...allowed, updatedAt: new Date() },
      select: { id: true, title: true, firstName: true, lastName: true, position: true, department: true, qualifications: true, photo: true, showOnWebsite: true, websiteBio: true, websiteOrder: true },
    })
    log('UPDATE', 'website-cms', id, schoolId)
    return staff
  }

  if (['deletePage', 'deleteNews', 'deleteGalleryImage', 'deletePartner', 'deleteFaq', 'deleteSeo'].includes(action)) {
    if (!id) throw new AppError('VALIDATION', 'ID is required')
    const modelMap: Record<string, any> = {
      deletePage: db.websitePage,
      deleteNews: db.newsArticle,
      deleteGalleryImage: db.galleryImage,
      deletePartner: db.partner,
      deleteFaq: db.faq,
      deleteSeo: db.sEOSetting,
    }
    await modelMap[action].delete({ where: { id } })
    log('DELETE', 'website-cms', id, schoolId)
    return { deleted: true }
  }

  throw new AppError('VALIDATION', 'Invalid action')
}

export function handleWebsiteCMSError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
