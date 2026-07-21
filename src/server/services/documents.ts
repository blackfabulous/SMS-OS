import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string | null
  category?: string | null
  fileType?: string | null
  isTemplate?: string | null
  uploadedBy?: string | null
  page?: number
  limit?: number
}

export async function listDocuments(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search || ''

  const where: Record<string, unknown> = { schoolId }
  if (params.category) where.category = params.category as any
  if (params.fileType) where.fileType = params.fileType as any
  if (params.isTemplate === 'true') where.isTemplate = true
  if (params.isTemplate === 'false') where.isTemplate = false
  if (params.uploadedBy) where.uploadedBy = params.uploadedBy
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { tags: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { fileName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [documents, total, templates, categoryGroups, totalSize] = await Promise.all([
    db.document.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    db.document.count({ where }),
    db.document.findMany({ where: { schoolId, isTemplate: true }, orderBy: { title: 'asc' } }),
    db.document.groupBy({ by: ['category'], where: { schoolId }, _count: { id: true } }),
    db.document.aggregate({ where: { schoolId }, _sum: { fileSize: true } }),
  ])

  const stats = {
    totalDocuments: total,
    templates: templates.length,
    categories: categoryGroups.length,
    totalSize: totalSize._sum.fileSize || 0,
    categoryBreakdown: categoryGroups.map((g) => ({ category: g.category, count: g._count.id })),
  }

  return { data: documents, templates, total, page, totalPages: Math.ceil(total / limit), stats }
}

export async function createDocument(schoolId: string, body: Record<string, unknown>) {
  const { title, category, description, fileName, fileType, fileSize, uploadedBy, tags, isTemplate } = body
  if (!title) throw new AppError('VALIDATION', 'Title is required')

  const doc = await db.document.create({
    data: {
      schoolId,
      title: title as string,
      category: (category as any) || 'GENERAL',
      description: (description as string) || null,
      fileName: (fileName as string) || (title as string),
      fileType: (fileType as any) || 'PDF',
      fileSize: (fileSize as number) ?? 0,
      uploadedBy: (uploadedBy as string) || null,
      tags: (tags as string) || null,
      isTemplate: (isTemplate as boolean) || false,
    },
  })

  logAudit({ action: 'CREATE', entity: 'documents', entityId: doc.id, schoolId, afterValue: doc }).catch(() => {})
  return doc
}

export async function updateDocument(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.document.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Document not found')

  const data: Record<string, unknown> = {
    title: updates.title,
    category: updates.category as any,
    description: updates.description,
    tags: updates.tags,
    isTemplate: updates.isTemplate,
    fileType: updates.fileType as any,
    fileSize: updates.fileSize,
  }
  if (updates.version) data.version = updates.version

  const doc = await db.document.update({ where: { id }, data })

  logAudit({ action: 'UPDATE', entity: 'documents', entityId: doc.id, schoolId, afterValue: doc }).catch(() => {})
  return doc
}

export async function deleteDocument(schoolId: string, id: string) {
  const owned = await db.document.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Document not found')

  await db.document.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'documents', entityId: id, schoolId }).catch(() => {})
  return { message: 'Document deleted successfully' }
}

export function handleDocumentError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
