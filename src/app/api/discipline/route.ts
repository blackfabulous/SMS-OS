import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import {
  listDiscipline,
  createDisciplineRecord,
  updateDisciplineRecord,
  deleteDisciplineRecord,
  handleDisciplineError,
} from '@/server/services/discipline'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const incidentType = searchParams.get('incidentType') || ''
    const studentId = searchParams.get('studentId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listDiscipline(tenantResult.schoolId, {
      search,
      status,
      incidentType,
      studentId,
      dateFrom,
      dateTo,
      page,
      limit,
    })
    return ok(result)
  } catch (error) {
    const { code, message } = handleDisciplineError(error, 'Failed to fetch discipline records')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const record = await createDisciplineRecord(authResult.session.user.schoolId, body)
    return ok(record, 201)
  } catch (error) {
    const { code, message } = handleDisciplineError(error, 'Failed to create discipline record')
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

    const record = await updateDisciplineRecord(schoolId, id, updates)
    return ok(record)
  } catch (error) {
    const { code, message } = handleDisciplineError(error, 'Failed to update discipline record')
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

    const result = await deleteDisciplineRecord(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleDisciplineError(error, 'Failed to delete discipline record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
