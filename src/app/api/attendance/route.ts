import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { isAppError } from '@/lib/errors'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import {
  listAttendance,
  bulkCreateAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  handleAttendanceError,
  type AttendanceRecordInput,
  type AttendanceUpdateInput,
} from '@/server/services/attendance'

export async function GET(request: Request) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || ''
    const classId = searchParams.get('classId') || ''
    const termId = searchParams.get('termId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listAttendance(tenantResult.schoolId, { date, classId, termId, status, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleAttendanceError(error, 'Failed to fetch attendance')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: Request) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error

  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  try {
    const body: { records?: AttendanceRecordInput[] } & AttendanceRecordInput = await request.json()

    if (body.records && Array.isArray(body.records)) {
      const { count, message } = await bulkCreateAttendance(tenant.schoolId, auth.session.user.id, body.records)
      return ok({ message, count }, 201)
    }

    const record = await createAttendance(tenant.schoolId, auth.session.user.id, body)
    return ok(record, 201)
  } catch (error) {
    if (isAppError(error)) return fail(error.code, error.message)
    logger.error({ err: error }, 'Error recording attendance')
    return fail('INTERNAL', 'Failed to record attendance')
  }
}

export async function PUT(request: Request) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error

  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  try {
    const body = (await request.json()) as { id: string } & AttendanceUpdateInput
    const { id, ...updates } = body

    const record = await updateAttendance(tenant.schoolId, auth.session.user.id, id, updates)
    return ok(record)
  } catch (error) {
    if (isAppError(error)) return fail(error.code, error.message)
    logger.error({ err: error }, 'Error updating attendance')
    return fail('INTERNAL', 'Failed to update attendance')
  }
}

export async function DELETE(request: Request) {
  const auth = await validateRole(['ADMIN'])
  if ('error' in auth) return auth.error

  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''

    const message = await deleteAttendance(tenant.schoolId, auth.session.user.id, id)
    return ok({ message })
  } catch (error) {
    if (isAppError(error)) return fail(error.code, error.message)
    logger.error({ err: error }, 'Error deleting attendance')
    return fail('INTERNAL', 'Failed to delete attendance')
  }
}
