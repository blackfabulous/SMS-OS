import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import {
  listProcurement,
  createProcurement,
  updateProcurement,
  deleteProcurement,
  handleProcurementError,
} from '@/server/services/procurement'

// GET /api/procurement - List purchase orders, vendors, requisitions with status filters
export async function GET(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listProcurement(authResult.session.user.schoolId, { type, status, search, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleProcurementError(error, 'Failed to fetch procurement data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// POST /api/procurement - Create purchase order, vendor, or requisition
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await createProcurement(authResult.session.user.schoolId, body)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handleProcurementError(error, 'Failed to process procurement request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// PUT /api/procurement - Update purchase order, vendor, or requisition
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await updateProcurement(authResult.session.user.schoolId, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleProcurementError(error, 'Failed to update procurement record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// DELETE /api/procurement - Delete procurement record
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return fail('VALIDATION', 'ID is required')

    const result = await deleteProcurement(authResult.session.user.schoolId, id, type)
    return ok(result)
  } catch (error) {
    const { code, message } = handleProcurementError(error, 'Failed to delete procurement record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
