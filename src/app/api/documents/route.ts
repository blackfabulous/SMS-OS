import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/documents - List documents with category/search filter
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''
    const fileType = searchParams.get('fileType')
    const isTemplate = searchParams.get('isTemplate')
    const uploadedBy = searchParams.get('uploadedBy')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Build where clause
    const where: Record<string, unknown> = { schoolId }
    if (category) where.category = category
    if (fileType) where.fileType = fileType
    if (isTemplate === 'true') where.isTemplate = true
    if (isTemplate === 'false') where.isTemplate = false
    if (uploadedBy) where.uploadedBy = uploadedBy
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.document.count({ where }),
    ])

    // Templates separately
    const templates = await db.document.findMany({
      where: { schoolId, isTemplate: true },
      orderBy: { title: 'asc' },
    })

    // Document statistics
    const categoryGroups = await db.document.groupBy({
      by: ['category'],
      where: { schoolId },
      _count: { id: true },
    })

    const totalSize = await db.document.aggregate({
      where: { schoolId },
      _sum: { fileSize: true },
    })

    const stats = {
      totalDocuments: total,
      templates: templates.length,
      categories: categoryGroups.length,
      totalSize: totalSize._sum.fileSize || 0,
      categoryBreakdown: categoryGroups.map((g) => ({
        category: g.category,
        count: g._count.id,
      })),
    }

    return NextResponse.json({
      data: documents,
      templates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create document record (metadata only, no file upload)
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    const {
      title,
      category,
      description,
      fileName,
      fileType,
      fileSize,
      uploadedBy,
      tags,
      isTemplate,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const doc = await db.document.create({
      data: {
        schoolId,
        title,
        category: category || 'GENERAL',
        description: description || null,
        fileName: fileName || title,
        fileType: fileType || 'PDF',
        fileSize: fileSize || 0,
        uploadedBy: uploadedBy || null,
        tags: tags || null,
        isTemplate: isTemplate || false,
      },
    })

    logAudit({ action: 'CREATE', entity: 'documents', entityId: (doc as any)?.id, afterValue: doc }).catch(() => {})
    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Failed to create document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

// PUT /api/documents - Update document metadata
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const doc = await db.document.update({
      where: { id },
      data: {
        title: updates.title,
        category: updates.category,
        description: updates.description,
        tags: updates.tags,
        isTemplate: updates.isTemplate,
        version: updates.version ? updates.version : undefined,
        fileType: updates.fileType,
        fileSize: updates.fileSize,
      },
    })

    logAudit({ action: 'UPDATE', entity: 'documents', entityId: (doc as any)?.id, afterValue: doc }).catch(() => {})
    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents - Delete document record
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.document.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'documents', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
