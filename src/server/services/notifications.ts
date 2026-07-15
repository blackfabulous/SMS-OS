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
import { enqueueOutbox, processOutboxJob, registerOutboxHandler } from '@/server/outbox'

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

export interface BatchNotifyItem {
  studentId: string
  eventFactory: (studentName: string) => NotificationEvent
}

interface ResolvedBatchItem {
  event: NotificationEvent
  recipient: NotificationRecipient
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
 * Execute a notification event over the enabled channels immediately. Channel set =
 * intersection of the event's preferred channels with the school's `notifications.channels`.
 * Every attempt is logged as a Communication row. Failures are captured, never thrown.
 *
 * This is the outbox handler body; public dispatch functions enqueue an outbox job
 * and then process it so delivery is durable and retryable.
 */
async function executeNotification(
  schoolId: string,
  event: NotificationEvent,
  recipient: NotificationRecipient = {},
  ctx?: NotificationContext,
): Promise<DispatchResult> {
  const { schoolName, enabledChannels } = ctx ?? (await loadNotificationContext(schoolId))

  const preferred = preferredChannels(event.type)
  const channels = preferred ? preferred.filter((c) => enabledChannels.includes(c)) : enabledChannels

  const { subject, body } = renderNotification(event, schoolName)

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
 * Resolve a single student's guardian (school-scoped) and execute an event.
 */
async function executeNotifyStudentGuardian(
  schoolId: string,
  studentId: string,
  eventFactory: (studentName: string) => NotificationEvent,
  ctx?: NotificationContext,
): Promise<DispatchResult | null> {
  const guardian = await resolveStudentGuardian(studentId, schoolId)
  if (!guardian) return null
  return executeNotification(
    schoolId,
    eventFactory(guardian.studentName),
    { parentId: guardian.parentId, phone: guardian.phone, email: guardian.email, name: guardian.name },
    ctx,
  )
}

async function executeNotifyStudentGuardiansBatch(
  schoolId: string,
  items: ResolvedBatchItem[],
  skipped: number,
  ctx?: NotificationContext,
): Promise<{ sent: number; skipped: number; failed: number }> {
  const context = ctx ?? (await loadNotificationContext(schoolId))
  let sent = 0
  let failed = 0

  for (const item of items) {
    const result = await executeNotification(schoolId, item.event, item.recipient, context)
    if (result.channels.length === 0 || result.channels.every((c) => c.ok)) {
      sent++
    } else {
      failed++
    }
  }

  return { sent, skipped, failed }
}

// Register notification handlers with the outbox worker.
registerOutboxHandler('notification.dispatch', async (payload) => {
  const { schoolId, event, recipient, ctx } = payload as {
    schoolId: string
    event: NotificationEvent
    recipient: NotificationRecipient
    ctx?: NotificationContext
  }
  return executeNotification(schoolId, event, recipient, ctx)
})

registerOutboxHandler('notification.batch', async (payload) => {
  const { schoolId, items, skipped, ctx } = payload as {
    schoolId: string
    items: ResolvedBatchItem[]
    skipped: number
    ctx?: NotificationContext
  }
  return executeNotifyStudentGuardiansBatch(schoolId, items, skipped, ctx)
})

/**
 * Public dispatch: enqueue an outbox job and immediately process it. If it
 * fails, the job remains in the outbox for a worker retry; the function returns
 * a best-effort result describing the attempt.
 */
export async function dispatchNotification(
  schoolId: string,
  event: NotificationEvent,
  recipient: NotificationRecipient = {},
  ctx?: NotificationContext,
): Promise<DispatchResult> {
  const job = await enqueueOutbox({
    topic: 'notification.dispatch',
    schoolId,
    payload: { schoolId, event, recipient, ctx },
  })
  try {
    return (await processOutboxJob(job.id)) as DispatchResult
  } catch {
    return { event: event.type, channels: [] }
  }
}

export async function notifyStudentGuardian(
  schoolId: string,
  studentId: string,
  eventFactory: (studentName: string) => NotificationEvent,
  ctx?: NotificationContext,
): Promise<DispatchResult | null> {
  const guardian = await resolveStudentGuardian(studentId, schoolId)
  if (!guardian) return null

  const event = eventFactory(guardian.studentName)
  const recipient = { parentId: guardian.parentId, phone: guardian.phone, email: guardian.email, name: guardian.name }
  const job = await enqueueOutbox({
    topic: 'notification.dispatch',
    schoolId,
    payload: { schoolId, event, recipient, ctx },
  })
  try {
    return (await processOutboxJob(job.id)) as DispatchResult
  } catch {
    return { event: event.type, channels: [] }
  }
}

export async function notifyStudentGuardiansBatch(
  schoolId: string,
  items: BatchNotifyItem[],
  ctx?: NotificationContext,
): Promise<{ sent: number; skipped: number; failed: number }> {
  if (items.length === 0) return { sent: 0, skipped: 0, failed: 0 }

  const [context, guardians] = await Promise.all([
    ctx ?? loadNotificationContext(schoolId),
    resolveStudentGuardians(items.map((i) => i.studentId), schoolId),
  ])

  const resolved: ResolvedBatchItem[] = []
  let skipped = 0
  for (const item of items) {
    const g = guardians.get(item.studentId)
    if (!g) {
      skipped++
      continue
    }
    resolved.push({
      event: item.eventFactory(g.studentName),
      recipient: { parentId: g.parentId, phone: g.phone, email: g.email, name: g.name },
    })
  }

  const job = await enqueueOutbox({
    topic: 'notification.batch',
    schoolId,
    payload: { schoolId, items: resolved, skipped, ctx: context },
  })

  try {
    return (await processOutboxJob(job.id)) as { sent: number; skipped: number; failed: number }
  } catch {
    return { sent: 0, skipped: skipped + resolved.length, failed: resolved.length }
  }
}
