import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

export async function GET() {
  const auth = await validateAuth()
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return fail('VALIDATION', 'School not configured')

  try {
    const templates = await db.notificationTemplate.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } })
    return ok({ data: templates })
  } catch (error) {
    logger.error({ err: error }, 'templates GET error')
    return fail('INTERNAL', 'Failed to fetch templates')
  }
}

export async function POST(request: NextRequest) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return fail('VALIDATION', 'School not configured')

  try {
    const body = await request.json()
    const { name, category, channels, subject, body: messageBody } = body
    if (!name || !messageBody) return fail('VALIDATION', 'name and body are required')

    const template = await db.notificationTemplate.create({
      data: {
        schoolId,
        name,
        category: category || 'General',
        channels: Array.isArray(channels) ? channels.join(',') : (channels || 'SMS'),
        subject: subject || null,
        body: messageBody,
      },
    })
    logAudit({ action: 'CREATE', entity: 'notification-template', entityId: template.id }).catch(() => {})
    return ok(template, 201)
  } catch (error) {
    logger.error({ err: error }, 'templates POST error')
    return fail('INTERNAL', 'Failed to create template')
  }
}
