import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { listAlumni, addAlumniContribution, createAlumni, updateAlumni, deleteAlumni, handleAlumniError } from '@/server/services/alumni'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const graduationYear = searchParams.get('graduationYear')
    const location = searchParams.get('location')
    const occupation = searchParams.get('occupation')
    const isNotable = searchParams.get('isNotable')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listAlumni(tenantResult.schoolId, { search, graduationYear, location, occupation, isNotable, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleAlumniError(error, 'Failed to fetch alumni data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (action === 'addContribution') {
      const contribution = await addAlumniContribution(schoolId, body)
      return ok(contribution, 201)
    }

    const alumniRecord = await createAlumni(schoolId, body)
    return ok(alumniRecord, 201)
  } catch (error) {
    const { code, message } = handleAlumniError(error, 'Failed to create alumni record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    const alumniRecord = await updateAlumni(schoolId, id, updates)
    return ok(alumniRecord)
  } catch (error) {
    const { code, message } = handleAlumniError(error, 'Failed to update alumni record')
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

    const result = await deleteAlumni(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleAlumniError(error, 'Failed to delete alumni record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
