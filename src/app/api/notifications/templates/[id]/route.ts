import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  const { id } = await params

  try {
    const owned = await db.notificationTemplate.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) return fail('NOT_FOUND', 'Template not found')

    const body = await request.json()
    const { name, category, channels, subject, body: messageBody, usageCount, lastUsed } = body
    const template = await db.notificationTemplate.update({
      where: { id },
      data: {
        name,
        category,
        channels: Array.isArray(channels) ? channels.join(',') : channels,
        subject,
        body: messageBody,
        usageCount,
        lastUsed: lastUsed ? new Date(lastUsed) : undefined,
      },
    })
    logAudit({ action: 'UPDATE', entity: 'notification-template', entityId: id }).catch(() => {})
    return ok(template)
  } catch (error) {
    logger.error({ err: error }, 'template PUT error')
    return fail('INTERNAL', 'Failed to update template')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  const { id } = await params

  try {
    const owned = await db.notificationTemplate.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) return fail('NOT_FOUND', 'Template not found')

    await db.notificationTemplate.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'notification-template', entityId: id }).catch(() => {})
    return ok({ message: 'Template deleted' })
  } catch (error) {
    logger.error({ err: error }, 'template DELETE error')
    return fail('INTERNAL', 'Failed to delete template')
  }
}
