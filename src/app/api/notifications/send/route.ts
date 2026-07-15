import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { dispatchNotification, type NotificationRecipient } from '@/lib/notifications'
import { NOTIFICATION_EVENT_TYPES, type NotificationEvent } from '@/lib/notification-events'
import { withIdempotency, idempotencyKeyFromRequest } from '@/lib/idempotency'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'

/**
 * POST /api/notifications/send
 * Body: { event: NotificationEvent, recipient?: { parentId, phone, email, name } }
 * Dispatches the event over the school's enabled channels. ADMIN/TEACHER only.
 */
export async function POST(request: Request) {
  const auth = await validateRole(['ADMIN', 'TEACHER', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  const rateLimit = await checkRateLimit('notification:send', auth.session.user.id, {
    windowSeconds: 60,
    maxRequests: 30,
  })
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.result.resetAt.getTime() - Date.now()) / 1000))
    return fail('RATE_LIMITED', 'Rate limit exceeded', {
      limit: rateLimit.result.limit,
      remaining: rateLimit.result.remaining,
      resetAt: rateLimit.result.resetAt.toISOString(),
      retryAfter,
    })
  }

  let body: { event?: NotificationEvent; recipient?: NotificationRecipient }
  try {
    body = await request.json()
  } catch {
    return fail('VALIDATION', 'Invalid JSON body')
  }

  const event = body.event
  if (!event || typeof event !== 'object' || !NOTIFICATION_EVENT_TYPES.includes(event.type)) {
    return fail('VALIDATION', `event.type is required and must be one of: ${NOTIFICATION_EVENT_TYPES.join(', ')}`)
  }
  if (event.type === 'general' && (!event.subject || !event.message)) {
    return fail('VALIDATION', 'general events require subject and message')
  }

  try {
    const idempotencyKey = idempotencyKeyFromRequest(request)
    const { result } = await withIdempotency(
      'notification',
      idempotencyKey,
      3600,
      () => dispatchNotification(tenant.schoolId, event, body.recipient ?? {}),
    )
    return ok(result)
  } catch (err) {
    logger.error({ err }, 'notification dispatch failed')
    return fail('INTERNAL', 'Failed to dispatch notification')
  }
}
