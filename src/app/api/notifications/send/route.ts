import { NextResponse } from 'next/server'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { dispatchNotification, type NotificationRecipient } from '@/lib/notifications'
import { NOTIFICATION_EVENT_TYPES, type NotificationEvent } from '@/lib/notification-events'

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
    const result = await dispatchNotification(tenant.schoolId, event, body.recipient ?? {})
    return NextResponse.json(result)
  } catch (err) {
    console.error('notification dispatch failed', err)
    return NextResponse.json({ error: 'Failed to dispatch notification' }, { status: 500 })
  }
}
