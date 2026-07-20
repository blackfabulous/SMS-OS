import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { listDocuments, createDocument, updateDocument, deleteDocument, handleDocumentError } from '@/server/services/documents'

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
    const schoolId = authResult.session.user.schoolId

    if (!schoolId) return fail('VALIDATION', 'School not configured')

    const result = await listDocuments(schoolId, { search, category, fileType, isTemplate, uploadedBy, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleDocumentError(error, 'Failed to fetch documents')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const schoolId = authResult.session.user.schoolId
    if (!schoolId) return fail('VALIDATION', 'School not configured')

    const doc = await createDocument(schoolId, body)
    return ok(doc, 201)
  } catch (error) {
    const { code, message } = handleDocumentError(error, 'Failed to create document')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    const doc = await updateDocument(schoolId, id, updates)
    return ok(doc)
  } catch (error) {
    const { code, message } = handleDocumentError(error, 'Failed to update document')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    const result = await deleteDocument(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleDocumentError(error, 'Failed to delete document')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
