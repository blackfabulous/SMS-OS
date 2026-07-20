import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import {
  listLibrary,
  issueLibraryBook,
  returnLibraryBook,
  addLibraryBook,
  updateLibraryBook,
  updateLibraryTransaction,
  deleteLibraryBook,
  deleteLibraryTransaction,
  handleLibraryError,
} from '@/server/services/library'

// GET /api/library — List books with transaction status (available/issued/overdue)
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listLibrary(authResult.session.user.schoolId, {
      search,
      category,
      status,
      page,
      limit,
    })
    return ok(result)
  } catch (error) {
    const { code, message } = handleLibraryError(error, 'Failed to fetch library data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// POST /api/library — Create book or issue/return transaction
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (action === 'issue') {
      const transaction = await issueLibraryBook(schoolId, body)
      return ok(transaction, 201)
    }

    if (action === 'return') {
      const transaction = await returnLibraryBook(schoolId, body)
      return ok(transaction)
    }

    if (action === 'addBook') {
      const book = await addLibraryBook(schoolId, body)
      return ok(book, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use: issue, return, or addBook')
  } catch (error) {
    const { code, message } = handleLibraryError(error, 'Failed to process library request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// PUT /api/library — Update book or transaction
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'book' || updates.title || updates.author || updates.category !== undefined) {
      const book = await updateLibraryBook(schoolId, id, updates)
      return ok(book)
    }

    const transaction = await updateLibraryTransaction(schoolId, id, {
      fine: updates.fine as number | undefined,
      conditionOnReturn: updates.conditionOnReturn as string | undefined,
    })
    return ok(transaction)
  } catch (error) {
    const { code, message } = handleLibraryError(error, 'Failed to update library record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// DELETE /api/library?id=xxx&type=book|transaction
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'book') {
      const result = await deleteLibraryBook(schoolId, id)
      return ok(result)
    }

    const result = await deleteLibraryTransaction(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleLibraryError(error, 'Failed to delete library record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
