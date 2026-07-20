import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { listNotificationTemplates, createNotificationTemplate, handleNotificationsError } from '@/server/services/notifications'

export async function GET() {
  const auth = await validateAuth()
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return fail('VALIDATION', 'School not configured')

  try {
    const templates = await listNotificationTemplates(schoolId)
    return ok({ data: templates })
  } catch (error) {
    const { code, message } = handleNotificationsError(error, 'Failed to fetch templates')
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
    const template = await createNotificationTemplate(schoolId, body)
    return ok(template, 201)
  } catch (error) {
    const { code, message } = handleNotificationsError(error, 'Failed to create template')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
