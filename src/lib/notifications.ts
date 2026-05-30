import 'server-only'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { sendEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'
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

export interface ChannelResult {
  channel: NotificationChannel
  ok: boolean
  skipped?: string
}

export interface DispatchResult {
  event: NotificationEvent['type']
  channels: ChannelResult[]
}

/**
 * Dispatch a notification event for a school over the enabled channels.
 *
 * Channel selection = intersection of the event's preferred channels (if any)
 * with the school's `notifications.channels` setting. Every send is logged as a
 * Communication row. Channel failures are captured, never thrown — one dead
 * channel must not block the others.
 */
export async function dispatchNotification(
  schoolId: string,
  event: NotificationEvent,
  recipient: NotificationRecipient = {},
): Promise<DispatchResult> {
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } })
  const schoolName = school?.name ?? 'ZimSchool'

  const enabled = await getSetting(schoolId, 'notifications.channels')
  const preferred = preferredChannels(event.type)
  const channels: NotificationChannel[] = preferred
    ? preferred.filter((c) => enabled.includes(c))
    : (enabled as NotificationChannel[])

  const { subject, body } = renderNotification(event, schoolName)
  const results: ChannelResult[] = []

  for (const channel of channels) {
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
        ok = true // persisted below as a Communication row
      }
    } catch {
      ok = false
    }

    // Record every attempt for the communication log / audit trail.
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

    results.push({ channel, ok, skipped })
  }

  return { event: event.type, channels: results }
}
