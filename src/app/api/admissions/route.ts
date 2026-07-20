import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { listAdmissions, createAdmission, enrollStudent, updateAdmission, dropAdmission, handleAdmissionsError } from '@/server/services/admissions'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listAdmissions(tenantResult.schoolId, { status, search, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleAdmissionsError(error, 'Failed to fetch admissions')
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

    const student = await createAdmission(schoolId, body)
    return ok(student, 201)
  } catch (error) {
    const { code, message } = handleAdmissionsError(error, 'Failed to create admission')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, action, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Student ID is required')

    if (action === 'enroll') {
      const student = await enrollStudent(schoolId, id, updates)
      return ok(student)
    }

    const student = await updateAdmission(schoolId, id, updates)
    return ok(student)
  } catch (error) {
    const { code, message } = handleAdmissionsError(error, 'Failed to update admission')
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

    if (!id) return fail('VALIDATION', 'Student ID is required')

    const result = await dropAdmission(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleAdmissionsError(error, 'Failed to delete admission')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
