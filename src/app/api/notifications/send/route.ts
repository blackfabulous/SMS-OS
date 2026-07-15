import { NextResponse } from 'next/server'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { dispatchNotification, type NotificationRecipient } from '@/lib/notifications'
import { NOTIFICATION_EVENT_TYPES, type NotificationEvent } from '@/lib/notification-events'
import { withIdempotency, idempotencyKeyFromRequest } from '@/lib/idempotency'
import { checkRateLimit } from '@/lib/rate-limit'

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
    return NextResponse.json(
      { error: 'Rate limit exceeded', limit: rateLimit.result.limit, remaining: rateLimit.result.remaining, resetAt: rateLimit.result.resetAt.toISOString() },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  let body: { event?: NotificationEvent; recipient?: NotificationRecipient }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const event = body.event
  if (!event || typeof event !== 'object' || !NOTIFICATION_EVENT_TYPES.includes(event.type)) {
    return NextResponse.json(
      { error: `event.type is required and must be one of: ${NOTIFICATION_EVENT_TYPES.join(', ')}` },
      { status: 400 },
    )
  }
  if (event.type === 'general' && (!event.subject || !event.message)) {
    return NextResponse.json({ error: 'general events require subject and message' }, { status: 400 })
  }

  try {
    const idempotencyKey = idempotencyKeyFromRequest(request)
    const { result } = await withIdempotency(
      'notification',
      idempotencyKey,
      3600,
      () => dispatchNotification(tenant.schoolId, event, body.recipient ?? {}),
    )
    return NextResponse.json(result)
  } catch (err) {
    console.error('notification dispatch failed', err)
    return NextResponse.json({ error: 'Failed to dispatch notification' }, { status: 500 })
  }
}
