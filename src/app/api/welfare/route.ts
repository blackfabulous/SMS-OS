import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import {
  listWelfare,
  createBeamApplication,
  createWelfareRecord,
  updateBeamApplication,
  updateWelfareRecord,
  deleteBeamApplication,
  deleteWelfareRecord,
  handleWelfareError,
} from '@/server/services/welfare'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listWelfare(tenantResult.schoolId, { type, search, status, category, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleWelfareError(error, 'Failed to fetch welfare data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { type } = body
    const schoolId = authResult.session.user.schoolId

    if (type === 'beam') {
      const beamApplication = await createBeamApplication(schoolId, body)
      return ok(beamApplication, 201)
    }

    const welfareRecord = await createWelfareRecord(schoolId, body)
    return ok(welfareRecord, 201)
  } catch (error) {
    const { code, message } = handleWelfareError(error, 'Failed to create welfare record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { type, id, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Record ID is required')

    if (type === 'beam') {
      const record = await updateBeamApplication(schoolId, id, updates)
      return ok(record)
    }

    const record = await updateWelfareRecord(schoolId, id, updates)
    return ok(record)
  } catch (error) {
    const { code, message } = handleWelfareError(error, 'Failed to update welfare record')
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
    const type = searchParams.get('type')
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Record ID is required')

    if (type === 'beam') {
      const result = await deleteBeamApplication(schoolId, id)
      return ok(result)
    }

    const result = await deleteWelfareRecord(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleWelfareError(error, 'Failed to delete welfare record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
