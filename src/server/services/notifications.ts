import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
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

const CHANNEL_FILL: Record<string, string> = { SMS: '#10b981', WHATSAPP: '#25d366', EMAIL: '#3b82f6' }
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtDateTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function relativeTime(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export async function getNotificationDashboard(schoolId: string) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 6)

  const logs = await db.notificationLog.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 500 })
  const sum = (arr: typeof logs, f: (l: typeof logs[number]) => number) => arr.reduce((s, l) => s + f(l), 0)

  const todayLogs = logs.filter((l) => l.createdAt >= todayStart)
  const monthLogs = logs.filter((l) => l.createdAt >= monthStart)
  const recent = logs.slice(0, 50)

  const stats = {
    sentToday: sum(todayLogs, (l) => l.recipients),
    deliveryRate: recent.length ? Math.round((sum(recent, (l) => l.deliveryRate) / recent.length) * 10) / 10 : 100,
    smsCreditsRemaining: Math.max(0, 10000 - sum(monthLogs.filter((l) => l.channel === 'SMS'), (l) => l.recipients)),
    whatsappMessages: sum(monthLogs.filter((l) => l.channel === 'WHATSAPP'), (l) => l.recipients),
  }

  const history = recent.map((l) => ({
    id: l.id, date: fmtDateTime(l.createdAt), recipients: l.recipients, channel: l.channel,
    subject: l.subject ?? '', status: l.status, deliveryRate: l.deliveryRate, phone: l.phone ?? '',
  }))

  const dailyMap = new Map<string, { day: string; sms: number; whatsapp: number; email: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - i)
    dailyMap.set(d.toDateString(), { day: DAY_NAMES[d.getDay()], sms: 0, whatsapp: 0, email: 0 })
  }
  logs.filter((l) => l.createdAt >= weekStart).forEach((l) => {
    const k = new Date(l.createdAt)
    k.setHours(0, 0, 0, 0)
    const e = dailyMap.get(k.toDateString())
    if (!e) return
    if (l.channel === 'SMS') e.sms += l.recipients
    else if (l.channel === 'WHATSAPP') e.whatsapp += l.recipients
    else if (l.channel === 'EMAIL') e.email += l.recipients
  })
  const dailyVolume = Array.from(dailyMap.values())

  const chMap = new Map<string, number>()
  logs.forEach((l) => chMap.set(l.channel, (chMap.get(l.channel) || 0) + l.recipients))
  const channelUsage = Array.from(chMap.entries()).map(([name, value]) => ({ name, value, fill: CHANNEL_FILL[name] || '#6b7280' }))

  const recentActivity = logs.slice(0, 8).map((l) => ({
    id: l.id, type: l.channel.toLowerCase(), message: l.subject || l.body.slice(0, 48),
    time: relativeTime(l.createdAt), status: l.status.toLowerCase(),
  }))

  return { stats, history, dailyVolume, channelUsage, recentActivity }
}

export async function createNotificationLogEntry(schoolId: string, body: any) {
  const { channel, recipients, subject, body: messageBody, status, phone, eventType } = body
  if (!messageBody) throw new AppError('VALIDATION', 'body is required')

  const log = await db.notificationLog.create({
    data: {
      schoolId,
      channel: ((channel || 'SMS') as string).toUpperCase() as any,
      recipients: typeof recipients === 'number' ? recipients : 1,
      subject: subject || null,
      body: messageBody,
      status: (status || 'DELIVERED').toUpperCase() as any,
      deliveryRate: 100,
      phone: phone || null,
      eventType: eventType || null,
    },
  })
  logAudit({ action: 'CREATE', entity: 'notifications', entityId: log.id, schoolId }).catch(() => {})
  return log
}

export async function listNotificationTemplates(schoolId: string) {
  return db.notificationTemplate.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } })
}

export async function createNotificationTemplate(schoolId: string, body: any) {
  const { name, category, channels, subject, body: messageBody } = body
  if (!name || !messageBody) throw new AppError('VALIDATION', 'name and body are required')

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
  logAudit({ action: 'CREATE', entity: 'notification-template', entityId: template.id, schoolId }).catch(() => {})
  return template
}

export async function updateNotificationTemplate(schoolId: string, id: string, body: any) {
  const owned = await db.notificationTemplate.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Template not found')

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
  logAudit({ action: 'UPDATE', entity: 'notification-template', entityId: id, schoolId }).catch(() => {})
  return template
}

export async function deleteNotificationTemplate(schoolId: string, id: string) {
  const owned = await db.notificationTemplate.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Template not found')

  await db.notificationTemplate.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'notification-template', entityId: id, schoolId }).catch(() => {})
  return { message: 'Template deleted' }
}

export function handleNotificationsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
