// Pure notification event library + message templating — no DB/IO, unit-testable.
// `dispatchNotification` (in notifications.ts) renders these and sends them over
// the channels enabled in the `notifications.channels` setting.

export type NotificationChannel = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_APP'

export type NotificationEvent =
  | { type: 'fee.reminder'; studentName: string; balance: number; currency: string; dueDate?: string }
  | { type: 'fee.overdue'; studentName: string; balance: number; currency: string }
  | { type: 'payment.received'; studentName: string; amount: number; currency: string; receiptNumber: string }
  | { type: 'attendance.absent'; studentName: string; date: string }
  | { type: 'admission.received'; applicantName: string; reference: string }
  | { type: 'exam.published'; studentName: string; term: string }
  | { type: 'general'; subject: string; message: string }

export type NotificationEventType = NotificationEvent['type']

export const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  'fee.reminder',
  'fee.overdue',
  'payment.received',
  'attendance.absent',
  'admission.received',
  'exam.published',
  'general',
]

export interface RenderedNotification {
  subject: string
  /** Plain-text body (used by SMS/WhatsApp and as the email text part). */
  body: string
}

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`
}

/**
 * Render an event into a subject + body, personalised with the school name.
 * Pure and deterministic, so it can be snapshot/asserted in tests.
 */
export function renderNotification(event: NotificationEvent, schoolName: string): RenderedNotification {
  switch (event.type) {
    case 'fee.reminder':
      return {
        subject: `Fee reminder — ${schoolName}`,
        body:
          `Dear Parent/Guardian, this is a reminder that ${event.studentName} has an outstanding ` +
          `balance of ${money(event.balance, event.currency)}` +
          (event.dueDate ? `, due by ${event.dueDate}` : '') +
          `. Kindly settle at your earliest convenience. — ${schoolName}`,
      }
    case 'fee.overdue':
      return {
        subject: `Overdue fees — ${schoolName}`,
        body:
          `Dear Parent/Guardian, the fees for ${event.studentName} are now OVERDUE with a balance of ` +
          `${money(event.balance, event.currency)}. Please contact the bursary urgently. — ${schoolName}`,
      }
    case 'payment.received':
      return {
        subject: `Payment received — ${schoolName}`,
        body:
          `Thank you. We have received a payment of ${money(event.amount, event.currency)} for ` +
          `${event.studentName}. Receipt: ${event.receiptNumber}. — ${schoolName}`,
      }
    case 'attendance.absent':
      return {
        subject: `Absence notice — ${schoolName}`,
        body:
          `Dear Parent/Guardian, ${event.studentName} was marked absent on ${event.date}. ` +
          `Please contact the school if this is unexpected. — ${schoolName}`,
      }
    case 'admission.received':
      return {
        subject: `Application received — ${schoolName}`,
        body:
          `Thank you for applying to ${schoolName}. We have received the application for ` +
          `${event.applicantName} (ref ${event.reference}). Our team will be in touch shortly.`,
      }
    case 'exam.published':
      return {
        subject: `Results published — ${schoolName}`,
        body:
          `Dear Parent/Guardian, the ${event.term} results for ${event.studentName} have been ` +
          `published and are available on the parent portal. — ${schoolName}`,
      }
    case 'general':
      return { subject: event.subject, body: event.message }
  }
}

/** Some events have a sensible channel preference; null means "use school default". */
export function preferredChannels(type: NotificationEventType): NotificationChannel[] | null {
  switch (type) {
    case 'attendance.absent':
    case 'fee.overdue':
      return ['SMS', 'EMAIL'] // time-sensitive → prefer SMS
    case 'admission.received':
      return ['EMAIL']
    default:
      return null
  }
}
