import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { updateNotificationTemplate, deleteNotificationTemplate, handleNotificationsError } from '@/server/services/notifications'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  const { id } = await params

  try {
    const body = await request.json()
    const template = await updateNotificationTemplate(schoolId, id, body)
    return ok(template)
  } catch (error) {
    const { code, message } = handleNotificationsError(error, 'Failed to update template')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  const { id } = await params

  try {
    const result = await deleteNotificationTemplate(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleNotificationsError(error, 'Failed to delete template')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
