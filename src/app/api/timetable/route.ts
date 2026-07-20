import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import {
  listTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  handleTimetableError,
} from '@/server/services/timetable'

export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const staffId = searchParams.get('staffId')
    const dayOfWeek = searchParams.get('dayOfWeek')
    const subjectId = searchParams.get('subjectId')
    const room = searchParams.get('room')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const schoolId = authResult.session.user.schoolId

    if (!schoolId) return fail('FORBIDDEN', 'School not configured')

    const result = await listTimetable(schoolId, { classId, staffId, dayOfWeek, subjectId, room, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleTimetableError(error, 'Failed to fetch timetable data')
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
    if (!schoolId) return fail('FORBIDDEN', 'School not configured')

    const entry = await createTimetableEntry(schoolId, body)
    return ok(entry, 201)
  } catch (error) {
    const { code, message } = handleTimetableError(error, 'Failed to create timetable entry')
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
    if (!schoolId) return fail('FORBIDDEN', 'School not configured')
    if (!id) return fail('VALIDATION', 'Entry ID is required')

    const entry = await updateTimetableEntry(schoolId, id, updates)
    return ok(entry)
  } catch (error) {
    const { code, message } = handleTimetableError(error, 'Failed to update timetable entry')
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
    if (!schoolId) return fail('FORBIDDEN', 'School not configured')
    if (!id) return fail('VALIDATION', 'Entry ID is required')

    const result = await deleteTimetableEntry(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleTimetableError(error, 'Failed to delete timetable entry')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
