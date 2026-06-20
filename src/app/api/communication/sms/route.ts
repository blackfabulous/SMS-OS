import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'

// ─── Africa's Talking SMS Integration ───────────────────────────────────────
// Production-ready structure with mock responses when env vars are not set.
// Set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME for live usage.

interface SmsRequest {
  recipients: string[]
  message: string
  category: 'general' | 'fee_reminder' | 'meeting_notice' | 'exam_schedule' | 'emergency' | 'attendance'
  senderId?: string
  scheduleAt?: string
}

interface SmsDeliveryReport {
  messageId: string
  recipient: string
  status: 'Sent' | 'Delivered' | 'Failed' | 'Rejected' | 'Queued'
  statusCode: number
  cost: number
  network: string
  sentAt: string
  deliveredAt?: string
  failureReason?: string
}

interface SmsRecord {
  id: string
  recipients: string[]
  message: string
  category: string
  senderId: string
  status: 'pending' | 'sent' | 'partial' | 'failed'
  totalRecipients: number
  deliveredCount: number
  failedCount: number
  cost: number
  currency: string
  deliveryReports: SmsDeliveryReport[]
  createdAt: string
  updatedAt: string
}

// In-memory SMS records (in production, use database)
const smsRecords: Map<string, SmsRecord> = new Map()

const AFRICAS_TALKING_API_KEY = process.env.AFRICAS_TALKING_API_KEY
const AFRICAS_TALKING_USERNAME = process.env.AFRICAS_TALKING_USERNAME || 'sandbox'
const AFRICAS_TALKING_SENDER_ID = process.env.AFRICAS_TALKING_SENDER_ID || 'ZimSchool'
const AFRICAS_TALKING_BASE_URL = AFRICAS_TALKING_USERNAME === 'sandbox'
  ? 'https://api.sandbox.africastalking.com/version1/messaging'
  : 'https://api.africastalking.com/version1/messaging'

function generateSmsId(): string {
  return `sms_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`
}

// ─── SMS Templates ──────────────────────────────────────────────────────────
const smsTemplates: Record<string, string> = {
  fee_reminder: 'Dear Parent, your child {student_name} has an outstanding fee balance of {amount}. Please arrange payment. - {school_name}',
  meeting_notice: 'Dear Parent, there will be a {meeting_type} on {date} at {time} in {venue}. Please attend. - {school_name}',
  exam_schedule: 'Dear Parent, {student_name} has {exam_name} starting on {date}. Please ensure they prepare. - {school_name}',
  attendance: 'Dear Parent, your child {student_name} was marked absent today ({date}). Please contact the school. - {school_name}',
  emergency: 'URGENT: {message}. Please contact {school_name} immediately at {phone}.',
  general: '{message} - {school_name}',
}

// ─── POST: Send SMS ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body: SmsRequest = await request.json()
    const { recipients, message, category, senderId, scheduleAt } = body

    if (!recipients || recipients.length === 0) {
      logAudit({ action: 'CREATE', entity: 'sms' }).catch(() => {})
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      logAudit({ action: 'CREATE', entity: 'sms' }).catch(() => {})
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Limit bulk SMS to 1000 recipients
    if (recipients.length > 1000) {
      logAudit({ action: 'CREATE', entity: 'sms' }).catch(() => {})
      return NextResponse.json(
        { error: 'Maximum 1000 recipients per request' },
        { status: 400 }
      )
    }

    // Validate phone numbers (Zimbabwe format: +263XXXXXXXXX)
    const validatedRecipients = recipients.map(phone => {
      let cleaned = phone.replace(/\s/g, '')
      if (cleaned.startsWith('0')) {
        cleaned = '+263' + cleaned.substring(1)
      } else if (!cleaned.startsWith('+')) {
        cleaned = '+263' + cleaned
      }
      return cleaned
    })

    const smsId = generateSmsId()
    const usedSenderId = senderId || AFRICAS_TALKING_SENDER_ID

    // If Africa's Talking credentials are configured, make real API call
    if (AFRICAS_TALKING_API_KEY) {
      try {
        const atPayload = new URLSearchParams({
          username: AFRICAS_TALKING_USERNAME,
          message: message.substring(0, 160 * (recipients.length > 1 ? 5 : 1)), // Allow longer for bulk
          to: validatedRecipients.join(','),
          from: usedSenderId,
        })

        if (scheduleAt) {
          atPayload.append('enqueue', '1')
        }

        const response = await fetch(AFRICAS_TALKING_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': AFRICAS_TALKING_API_KEY,
            'Accept': 'application/json',
          },
          body: atPayload.toString(),
        })

        const responseData = await response.json()

        if (responseData.SMSMessageData) {
          const smsData = responseData.SMSMessageData
          const deliveryReports: SmsDeliveryReport[] = (smsData.Recipients || []).map(
            (r: { statusCode: number; number: string; status: string; cost: string; messageId: string; networkCode?: string }) => ({
              messageId: r.messageId || generateMessageId(),
              recipient: r.number,
              status: r.status as SmsDeliveryReport['status'],
              statusCode: r.statusCode,
              cost: parseFloat(r.cost) || 0,
              network: r.networkCode || 'ZW01',
              sentAt: new Date().toISOString(),
            })
          )

          const totalCost = deliveryReports.reduce((sum: number, r: { cost: number }) => sum + r.cost, 0)
          const deliveredCount = deliveryReports.filter((r: { status: string }) => r.status === 'Sent' || r.status === 'Queued').length
          const failedCount = deliveryReports.filter((r: { status: string }) => r.status === 'Failed' || r.status === 'Rejected').length

          const record: SmsRecord = {
            id: smsId,
            recipients: validatedRecipients,
            message,
            category,
            senderId: usedSenderId,
            status: failedCount === deliveryReports.length ? 'failed' : deliveredCount === deliveryReports.length ? 'sent' : 'partial',
            totalRecipients: recipients.length,
            deliveredCount,
            failedCount,
            cost: totalCost,
            currency: 'USD',
            deliveryReports,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          smsRecords.set(smsId, record)

          logAudit({ action: 'CREATE', entity: 'sms' }).catch(() => {})
          return NextResponse.json({
            success: true,
            smsId,
            totalSent: deliveredCount,
            totalFailed: failedCount,
            cost: totalCost,
            currency: 'USD',
            deliveryReports,
          })
        } else {
          logAudit({ action: 'CREATE', entity: 'sms' }).catch(() => {})
          return NextResponse.json(
            { error: 'Africa\'s Talking API error', details: responseData },
            { status: 400 }
          )
        }
      } catch (error) {
        console.error('Africa\'s Talking API error:', error)
        return NextResponse.json(
          { error: 'Failed to communicate with Africa\'s Talking' },
          { status: 502 }
        )
      }
    }

    // Mock response when Africa's Talking credentials are not configured
    const deliveryReports: SmsDeliveryReport[] = validatedRecipients.map(phone => ({
      messageId: generateMessageId(),
      recipient: phone,
      status: Math.random() > 0.1 ? 'Delivered' as const : 'Failed' as const,
      statusCode: Math.random() > 0.1 ? 101 : 401,
      cost: 0.02,
      network: 'ECONET',
      sentAt: new Date().toISOString(),
      deliveredAt: Math.random() > 0.1 ? new Date().toISOString() : undefined,
      failureReason: Math.random() > 0.9 ? 'Invalid number' : undefined,
    }))

    const totalCost = deliveryReports.reduce((sum, r) => sum + r.cost, 0)
    const deliveredCount = deliveryReports.filter(r => r.status === 'Delivered' || r.status === 'Sent').length
    const failedCount = deliveryReports.filter(r => r.status === 'Failed' || r.status === 'Rejected').length

    const record: SmsRecord = {
      id: smsId,
      recipients: validatedRecipients,
      message,
      category,
      senderId: usedSenderId,
      status: failedCount === deliveryReports.length ? 'failed' : deliveredCount === deliveryReports.length ? 'sent' : 'partial',
      totalRecipients: recipients.length,
      deliveredCount,
      failedCount,
      cost: totalCost,
      currency: 'USD',
      deliveryReports,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    smsRecords.set(smsId, record)

    logAudit({ action: 'CREATE', entity: 'sms' }).catch(() => {})
    return NextResponse.json({
      success: true,
      smsId,
      totalSent: deliveredCount,
      totalFailed: failedCount,
      cost: totalCost,
      currency: 'USD',
      deliveryReports,
      demo: true,
    })
  } catch (error) {
    console.error('SMS sending error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── GET: Delivery Reports ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('messageId')
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  // If messageId is specified, return specific SMS record
  if (messageId) {
    const record = smsRecords.get(messageId)
    if (!record) {
      return NextResponse.json(
        { error: 'SMS record not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(record)
  }

  // Otherwise, return list of SMS records with optional filters
  let records = Array.from(smsRecords.values())

  if (status) {
    records = records.filter(r => r.status === status)
  }

  if (category) {
    records = records.filter(r => r.category === category)
  }

  // Sort by most recent first
  records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({
    total: records.length,
    records: records.slice(0, 50),
    templates: smsTemplates,
  })
}
