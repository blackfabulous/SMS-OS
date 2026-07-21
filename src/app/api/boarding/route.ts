import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import {
  listBoarding,
  assignBoarder,
  createHostel,
  createDormitory,
  updateBoardingAssignment,
  checkoutBoarder,
  deleteHostel,
  deleteDormitory,
  deleteBoardingAssignment,
  handleBoardingError,
} from '@/server/services/boarding'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender') || ''
    const status = searchParams.get('status') || 'ACTIVE'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listBoarding(tenantResult.schoolId, { search, gender, status, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleBoardingError(error, 'Failed to fetch boarding data')
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

    if (action === 'assign') {
      const assignment = await assignBoarder(schoolId, body)
      return ok(assignment, 201)
    }

    if (action === 'createHostel') {
      const hostel = await createHostel(schoolId, body)
      return ok(hostel, 201)
    }

    if (action === 'createDormitory') {
      const dormitory = await createDormitory(schoolId, body)
      return ok(dormitory, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use: assign, createHostel, or createDormitory')
  } catch (error) {
    const { code, message } = handleBoardingError(error, 'Failed to process boarding request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, action, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Assignment ID is required')

    if (action === 'checkout') {
      const assignment = await checkoutBoarder(schoolId, id)
      return ok(assignment)
    }

    const assignment = await updateBoardingAssignment(schoolId, id, updates)
    return ok(assignment)
  } catch (error) {
    const { code, message } = handleBoardingError(error, 'Failed to update boarding assignment')
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

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'hostel') {
      const result = await deleteHostel(schoolId, id)
      return ok(result)
    }

    if (type === 'dormitory') {
      const result = await deleteDormitory(schoolId, id)
      return ok(result)
    }

    const result = await deleteBoardingAssignment(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleBoardingError(error, 'Failed to delete boarding record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
