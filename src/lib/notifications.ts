import 'server-only'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { sendEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'
import { resolveStudentGuardian, resolveStudentGuardians } from '@/lib/notification-recipient'
import {
  type NotificationEvent,
  type NotificationChannel,
  renderNotification,
  preferredChannels,
} from '@/lib/notification-events'

export interface NotificationRecipient {
  parentId?: string | null
  phone?: string | null
  email?: string | null
  name?: string | null
}

/** Pre-resolved per-school context so bulk dispatch fetches it ONCE, not per event. */
export interface NotificationContext {
  schoolName: string
  enabledChannels: NotificationChannel[]
}

export interface ChannelResult {
  channel: NotificationChannel
  ok: boolean
  skipped?: string
}

export interface DispatchResult {
  event: NotificationEvent['type']
  channels: ChannelResult[]
}

/** Load the per-school notification context (school name + enabled channels). */
export async function loadNotificationContext(schoolId: string): Promise<NotificationContext> {
  const [school, enabledChannels] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
    getSetting(schoolId, 'notifications.channels'),
  ])
  return { schoolName: school?.name ?? 'ZimSchool', enabledChannels: enabledChannels as NotificationChannel[] }
}

/**
 * Dispatch a notification event over the enabled channels. Channel set =
 * intersection of the event's preferred channels (if any) with the school's
 * `notifications.channels`. Channels are processed CONCURRENTLY; every attempt
 * is logged as a Communication row. Failures are captured, never thrown.
 *
 * Pass `ctx` to reuse a pre-loaded context (bulk dispatch) and skip the per-call
 * school + settings lookups.
 */
export async function dispatchNotification(
  schoolId: string,
  event: NotificationEvent,
  recipient: NotificationRecipient = {},
  ctx?: NotificationContext,
): Promise<DispatchResult> {
  const { schoolName, enabledChannels } = ctx ?? (await loadNotificationContext(schoolId))

  const preferred = preferredChannels(event.type)
  const channels = preferred ? preferred.filter((c) => enabledChannels.includes(c)) : enabledChannels

  const { subject, body } = renderNotification(event, schoolName)

  // Process channels concurrently; each persists its own Communication row.
  const results = await Promise.all(
    channels.map(async (channel): Promise<ChannelResult> => {
      let ok = false
      let skipped: string | undefined
      try {
        if (channel === 'EMAIL') {
          if (recipient.email) ok = await sendEmail({ to: recipient.email, subject, html: `<p>${body}</p>`, text: body })
          else skipped = 'no email address'
        } else if (channel === 'SMS' || channel === 'WHATSAPP') {
          if (recipient.phone) ok = await sendSms(recipient.phone, body)
          else skipped = 'no phone number'
        } else if (channel === 'IN_APP') {
          ok = true
        }
      } catch {
        ok = false
      }
      await db.communication
        .create({
          data: {
            schoolId,
            parentId: recipient.parentId ?? null,
            channel,
            subject,
            message: body,
            status: skipped ? 'SKIPPED' : ok ? 'SENT' : 'FAILED',
            sentAt: ok ? new Date() : null,
          },
        })
        .catch(() => {})
      return { channel, ok, skipped }
    }),
  )

  return { event: event.type, channels: results }
}

/**
 * Resolve a single student's guardian (school-scoped) and dispatch an event.
 * No-op (null) if the student has no resolvable guardian in this school.
 */
export async function notifyStudentGuardian(
  schoolId: string,
  studentId: string,
  eventFactory: (studentName: string) => NotificationEvent,
  ctx?: NotificationContext,
): Promise<DispatchResult | null> {
  const guardian = await resolveStudentGuardian(studentId, schoolId)
  if (!guardian) return null
  return dispatchNotification(
    schoolId,
    eventFactory(guardian.studentName),
    { parentId: guardian.parentId, phone: guardian.phone, email: guardian.email, name: guardian.name },
    ctx,
  )
}

export interface BatchNotifyItem {
  studentId: string
  eventFactory: (studentName: string) => NotificationEvent
}

/**
 * Dispatch to many students efficiently: loads the school context ONCE,
 * batch-resolves all guardians in a SINGLE query (no N+1), then dispatches
 * concurrently. Resilient — individual failures are counted, never thrown.
 * Returns how many were sent vs skipped (no guardian) vs failed.
 */
export async function notifyStudentGuardiansBatch(
  schoolId: string,
  items: BatchNotifyItem[],
): Promise<{ sent: number; skipped: number; failed: number }> {
  if (items.length === 0) return { sent: 0, skipped: 0, failed: 0 }

  const [ctx, guardians] = await Promise.all([
    loadNotificationContext(schoolId),
    resolveStudentGuardians(items.map((i) => i.studentId), schoolId),
  ])

  let sent = 0
  let skipped = 0
  let failed = 0

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const g = guardians.get(item.studentId)
      if (!g) { skipped++; return }
      await dispatchNotification(
        schoolId,
        item.eventFactory(g.studentName),
        { parentId: g.parentId, phone: g.phone, email: g.email, name: g.name },
        ctx,
      )
      sent++
    }),
  )
  failed = settled.filter((s) => s.status === 'rejected').length
  if (failed > 0) console.warn(`[notifications] batch dispatch: ${failed} of ${items.length} failed`)

  return { sent, skipped, failed }
}
