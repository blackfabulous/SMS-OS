import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/website-cms - Returns CMS data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'
    const school = await db.school.findFirst()
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
  try {
    const body = await request.json()
    const { action, data } = body
    const school = await db.school.findFirst()
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
      return NextResponse.json({ success: true, data: page }, { status: 201 })
    }

    if (action === 'createNews') {
      if (!data?.title || !data?.slug || !data?.content) {
        return NextResponse.json({ success: false, error: 'title, slug, and content are required' }, { status: 400 })
      }
      const article = await db.newsArticle.create({
        data: { schoolId, title: data.title, slug: data.slug, content: data.content, excerpt: data.excerpt, featuredImage: data.featuredImage, category: data.category || 'GENERAL', authorName: data.authorName, isPublished: data.isPublished ?? false, isFeatured: data.isFeatured ?? false, publishedAt: data.isPublished ? new Date() : null, metaTitle: data.metaTitle, metaDescription: data.metaDescription },
      })
      return NextResponse.json({ success: true, data: article }, { status: 201 })
    }

    if (action === 'uploadGalleryImage') {
      if (!data?.title || !data?.imageUrl) {
        return NextResponse.json({ success: false, error: 'title and imageUrl are required' }, { status: 400 })
      }
      const image = await db.galleryImage.create({
        data: { schoolId, title: data.title, description: data.description, imageUrl: data.imageUrl, category: data.category || 'GENERAL', isFeatured: data.isFeatured ?? false, sortOrder: data.sortOrder ?? 0 },
      })
      return NextResponse.json({ success: true, data: image }, { status: 201 })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('CMS POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create CMS content' }, { status: 500 })
  }
}

// PUT /api/website-cms - Update page, news, or branding
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, data } = body

    if (action === 'updatePage') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      const page = await db.websitePage.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      return NextResponse.json({ success: true, data: page })
    }

    if (action === 'updateNews') {
      if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      const updateData = { ...data, updatedAt: new Date() }
      if (data.isPublished && !data.publishedAt) updateData.publishedAt = new Date()
      const article = await db.newsArticle.update({ where: { id }, data: updateData })
      return NextResponse.json({ success: true, data: article })
    }

    if (action === 'updateBranding') {
      const school = await db.school.findFirst()
      if (!school) return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 })
      const updated = await db.school.update({ where: { id: school.id }, data: { ...data, updatedAt: new Date() } })
      return NextResponse.json({ success: true, data: updated })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('CMS PUT error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update CMS content' }, { status: 500 })
  }
}

// DELETE /api/website-cms - Delete page, news, or gallery image
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id } = body

    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    if (action === 'deletePage') {
      await db.websitePage.delete({ where: { id } })
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deleteNews') {
      await db.newsArticle.delete({ where: { id } })
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deleteGalleryImage') {
      await db.galleryImage.delete({ where: { id } })
      return NextResponse.json({ success: true, data: { deleted: true } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('CMS DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete CMS content' }, { status: 500 })
  }
}
