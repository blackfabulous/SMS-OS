import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getNotificationDashboard, createNotificationLogEntry, handleNotificationsError } from '@/server/services/notifications'

export async function GET() {
  const auth = await validateAuth()
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return fail('VALIDATION', 'School not configured')

  try {
    const data = await getNotificationDashboard(schoolId)
    return ok(data)
  } catch (error) {
    const { code, message } = handleNotificationsError(error, 'Failed to fetch notifications')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return fail('VALIDATION', 'School not configured')

  try {
    const body = await request.json()
    const log = await createNotificationLogEntry(schoolId, body)
    return ok(log, 201)
  } catch (error) {
    const { code, message } = handleNotificationsError(error, 'Failed to log notification')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
