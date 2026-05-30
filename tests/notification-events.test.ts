import { describe, it, expect } from 'vitest'
import {
  renderNotification,
  preferredChannels,
  NOTIFICATION_EVENT_TYPES,
  type NotificationEvent,
} from '@/lib/notification-events'

const SCHOOL = 'Mufakose High School'

describe('renderNotification', () => {
  it('renders a fee reminder with balance and due date', () => {
    const r = renderNotification(
      { type: 'fee.reminder', studentName: 'Tendai Moyo', balance: 150, currency: 'USD', dueDate: '15 Oct 2025' },
      SCHOOL,
    )
    expect(r.subject).toBe('Fee reminder — Mufakose High School')
    expect(r.body).toContain('Tendai Moyo')
    expect(r.body).toContain('USD 150.00')
    expect(r.body).toContain('15 Oct 2025')
  })

  it('omits the due date when absent', () => {
    const r = renderNotification({ type: 'fee.reminder', studentName: 'A B', balance: 10, currency: 'ZWG' }, SCHOOL)
    expect(r.body).not.toContain('due by')
    expect(r.body).toContain('ZWG 10.00')
  })

  it('renders a payment receipt', () => {
    const r = renderNotification(
      { type: 'payment.received', studentName: 'Chido N', amount: 200, currency: 'USD', receiptNumber: 'RCP1' },
      SCHOOL,
    )
    expect(r.body).toContain('USD 200.00')
    expect(r.body).toContain('RCP1')
  })

  it('passes through general subject/message verbatim', () => {
    const r = renderNotification({ type: 'general', subject: 'Closure', message: 'School closes Friday.' }, SCHOOL)
    expect(r).toEqual({ subject: 'Closure', body: 'School closes Friday.' })
  })

  it('covers every declared event type', () => {
    const samples: Record<NotificationEvent['type'], NotificationEvent> = {
      'fee.reminder': { type: 'fee.reminder', studentName: 'x', balance: 1, currency: 'USD' },
      'fee.overdue': { type: 'fee.overdue', studentName: 'x', balance: 1, currency: 'USD' },
      'payment.received': { type: 'payment.received', studentName: 'x', amount: 1, currency: 'USD', receiptNumber: 'r' },
      'attendance.absent': { type: 'attendance.absent', studentName: 'x', date: 'today' },
      'admission.received': { type: 'admission.received', applicantName: 'x', reference: 'APP1' },
      'exam.published': { type: 'exam.published', studentName: 'x', term: 'Term 3' },
      'general': { type: 'general', subject: 's', message: 'm' },
    }
    for (const type of NOTIFICATION_EVENT_TYPES) {
      const r = renderNotification(samples[type], SCHOOL)
      expect(r.subject.length).toBeGreaterThan(0)
      expect(r.body.length).toBeGreaterThan(0)
    }
  })
})

describe('preferredChannels', () => {
  it('prefers SMS+EMAIL for time-sensitive events', () => {
    expect(preferredChannels('attendance.absent')).toEqual(['SMS', 'EMAIL'])
    expect(preferredChannels('fee.overdue')).toEqual(['SMS', 'EMAIL'])
  })

  it('prefers EMAIL for admissions acknowledgements', () => {
    expect(preferredChannels('admission.received')).toEqual(['EMAIL'])
  })

  it('defers to school default for generic events', () => {
    expect(preferredChannels('general')).toBeNull()
    expect(preferredChannels('payment.received')).toBeNull()
  })
})
