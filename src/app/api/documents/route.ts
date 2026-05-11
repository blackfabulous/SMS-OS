import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let schoolId: string | undefined
    const school = await db.school.findFirst()
    schoolId = school?.id

    const where: Record<string, unknown> = { schoolId }
    if (category) where.category = category
    if (search) {
      where.OR = [{ title: { contains: search } }, { category: { contains: search } }, { tags: { contains: search } }]
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.document.count({ where }),
    ])

    const templates = await db.document.findMany({
      where: { schoolId, isTemplate: true },
      orderBy: { title: 'asc' },
    })

    const stats = {
      totalDocuments: total,
      templates: templates.length,
      categories: (await db.document.groupBy({ by: ['category'], where: { schoolId }, _count: { id: true } })).length,
      totalSize: (await db.document.aggregate({ where: { schoolId }, _sum: { fileSize: true } }))._sum.fileSize || 0,
    }

    return NextResponse.json({ data: documents, templates, total, page, totalPages: Math.ceil(total / limit), stats })
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    const { title, category, description, fileName, fileType, fileSize, uploadedBy, tags, isTemplate } = body
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const doc = await db.document.create({
      data: {
        schoolId: schoolId || 'default', title, category: category || 'GENERAL',
        description: description || null, fileName: fileName || title,
        fileType: fileType || 'PDF', fileSize: fileSize || 0,
        uploadedBy: uploadedBy || null, tags: tags || null,
        isTemplate: isTemplate || false,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Failed to create document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const doc = await db.document.update({
      where: { id },
      data: {
        title: updates.title, category: updates.category, description: updates.description,
        tags: updates.tags, isTemplate: updates.isTemplate, version: updates.version ? updates.version : undefined,
      },
    })

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await db.document.delete({ where: { id } })
    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
