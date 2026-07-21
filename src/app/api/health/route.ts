import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import {
  listHealth,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  handleHealthError,
} from '@/server/services/health'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const visitType = searchParams.get('visitType') || ''
    const studentId = searchParams.get('studentId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listHealth(tenantResult.schoolId, {
      search,
      visitType,
      studentId,
      dateFrom,
      dateTo,
      page,
      limit,
    })
    return ok(result)
  } catch (error) {
    const { code, message } = handleHealthError(error, 'Failed to fetch health records')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const record = await createHealthRecord(authResult.session.user.schoolId, body)
    return ok(record, 201)
  } catch (error) {
    const { code, message } = handleHealthError(error, 'Failed to create health record')
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

    if (!id) return fail('VALIDATION', 'Record ID is required')

    const record = await updateHealthRecord(schoolId, id, updates)
    return ok(record)
  } catch (error) {
    const { code, message } = handleHealthError(error, 'Failed to update health record')
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

    if (!id) return fail('VALIDATION', 'Record ID is required')

    const result = await deleteHealthRecord(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleHealthError(error, 'Failed to delete health record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
