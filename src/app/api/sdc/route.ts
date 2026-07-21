import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import {
  listSDC,
  createMeeting,
  createProject,
  createSDCMember,
  updateSDCMember,
  updateSDCEvent,
  deleteSDCEvent,
  deleteSDCMember,
  handleSDCError,
} from '@/server/services/sdc'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listSDC(tenantResult.schoolId, { search, type, isActive, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleSDCError(error, 'Failed to fetch SDC data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { type } = body
    const schoolId = authResult.session.user.schoolId

    if (type === 'meeting') {
      const meeting = await createMeeting(schoolId, body)
      return ok(meeting, 201)
    }

    if (type === 'project') {
      const project = await createProject(schoolId, body)
      return ok(project, 201)
    }

    const member = await createSDCMember(schoolId, body)
    return ok(member, 201)
  } catch (error) {
    const { code, message } = handleSDCError(error, 'Failed to create SDC record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'member') {
      const member = await updateSDCMember(schoolId, id, updates)
      return ok(member)
    }

    if (type === 'event') {
      const event = await updateSDCEvent(schoolId, id, updates)
      return ok(event)
    }

    return fail('VALIDATION', 'Invalid type. Use: member or event')
  } catch (error) {
    const { code, message } = handleSDCError(error, 'Failed to update SDC record')
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

    if (type === 'event') {
      const result = await deleteSDCEvent(schoolId, id)
      return ok(result)
    }

    const result = await deleteSDCMember(schoolId, id, type === 'member')
    return ok(result)
  } catch (error) {
    const { code, message } = handleSDCError(error, 'Failed to delete SDC record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
