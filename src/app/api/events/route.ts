import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import {
  listEvents,
  addSportsCode,
  addSchoolEvent,
  updateSportsCode,
  updateSchoolEvent,
  deleteSportsCode,
  deleteSchoolEvent,
  handleEventsError,
} from '@/server/services/events'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType') || ''
    const sport = searchParams.get('sport') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search') || ''
    const upcoming = searchParams.get('upcoming') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listEvents(tenantResult.schoolId, {
      eventType,
      sport,
      dateFrom,
      dateTo,
      search,
      upcoming,
      page,
      limit,
    })
    return ok(result)
  } catch (error) {
    const { code, message } = handleEventsError(error, 'Failed to fetch events data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (action === 'addSport') {
      const sport = await addSportsCode(schoolId, body)
      return ok(sport, 201)
    }

    const event = await addSchoolEvent(schoolId, body)
    return ok(event, 201)
  } catch (error) {
    const { code, message } = handleEventsError(error, 'Failed to create event')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'sport') {
      const sport = await updateSportsCode(schoolId, id, updates)
      return ok(sport)
    }

    const event = await updateSchoolEvent(schoolId, id, updates)
    return ok(event)
  } catch (error) {
    const { code, message } = handleEventsError(error, 'Failed to update event')
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

    if (type === 'sport') {
      const result = await deleteSportsCode(schoolId, id)
      return ok(result)
    }

    const result = await deleteSchoolEvent(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleEventsError(error, 'Failed to delete event')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
