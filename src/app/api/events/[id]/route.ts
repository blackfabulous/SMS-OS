import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getEvent, updateEvent, deleteEvent, handleEventsError } from '@/server/services/events'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { id } = await params
    const event = await getEvent(schoolId, id)
    return ok(event)
  } catch (error) {
    const { code, message } = handleEventsError(error, 'Failed to fetch event')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { id } = await params
    const body = await request.json()
    const event = await updateEvent(schoolId, id, body)
    return ok(event)
  } catch (error) {
    const { code, message } = handleEventsError(error, 'Failed to update event')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { id } = await params
    const result = await deleteEvent(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleEventsError(error, 'Failed to delete event')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
