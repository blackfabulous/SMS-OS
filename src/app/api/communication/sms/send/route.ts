import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Africa's Talking SMS Integration - Send Endpoint ────────────────────────
// Production-ready structure with simulated responses when env vars are not set.
// Set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME for live usage.

interface SmsSendRequest {
  to: string | string[]
  message: string
  type?: 'sms' | 'whatsapp'
  senderId?: string
}

interface SmsDeliveryResult {
  messageId: string
  recipient: string
  status: 'Sent' | 'Delivered' | 'Failed' | 'Rejected' | 'Queued'
  cost: number
  network: string
  failureReason?: string
}

const AFRICAS_TALKING_API_KEY = process.env.AFRICAS_TALKING_API_KEY
const AFRICAS_TALKING_USERNAME = process.env.AFRICAS_TALKING_USERNAME || 'sandbox'
const AFRICAS_TALKING_SENDER_ID = process.env.AFRICAS_TALKING_SENDER_ID || 'ZimSchool'

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`
}

function validatePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '+263' + cleaned.substring(1)
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+263' + cleaned
  }
  return cleaned
}

// ─── POST: Send SMS via Africa's Talking ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: SmsSendRequest = await request.json()
    const { to, message, type, senderId } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient(s) are required. Provide a phone number or array of phone numbers.' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Normalize recipients to array
    const recipients: string[] = Array.isArray(to) ? to : [to]

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    // Limit bulk SMS to 1000 recipients
    if (recipients.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 recipients per request' },
        { status: 400 }
      )
    }

    // Validate and normalize phone numbers
    const validatedRecipients = recipients.map(validatePhoneNumber)
    const usedSenderId = senderId || AFRICAS_TALKING_SENDER_ID
    const smsType = type || 'sms'
    const isWhatsApp = smsType === 'whatsapp'

    // If Africa's Talking credentials are configured, make real API call
    if (AFRICAS_TALKING_API_KEY) {
      try {
        const baseUrl = AFRICAS_TALKING_USERNAME === 'sandbox'
          ? 'https://api.sandbox.africastalking.com/version1/messaging'
          : 'https://api.africastalking.com/version1/messaging'

        const atPayload = new URLSearchParams({
          username: AFRICAS_TALKING_USERNAME,
          message: message.substring(0, 160 * (recipients.length > 1 ? 5 : 1)),
          to: validatedRecipients.join(','),
          from: usedSenderId,
        })

        if (isWhatsApp) {
          // WhatsApp uses a different endpoint structure
          atPayload.append('enqueue', '1')
        }

        const response = await fetch(baseUrl, {
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
          const deliveryResults: SmsDeliveryResult[] = (smsData.Recipients || []).map(
            (r: { statusCode: number; number: string; status: string; cost: string; messageId: string; networkCode?: string }) => ({
              messageId: r.messageId || generateMessageId(),
              recipient: r.number,
              status: r.status as SmsDeliveryResult['status'],
              cost: parseFloat(r.cost) || 0,
              network: r.networkCode || 'ZW01',
            })
          )

          const totalCost = deliveryResults.reduce((sum: number, r: { cost: number }) => sum + r.cost, 0)
          const sentCount = deliveryResults.filter((r: { status: string }) => r.status === 'Sent' || r.status === 'Queued').length
          const failedCount = deliveryResults.filter((r: { status: string }) => r.status === 'Failed' || r.status === 'Rejected').length

          // Log communications in the database
          for (const result of deliveryResults) {
            try {
              // Find parent by phone number
              const parent = await db.parent.findFirst({
                where: { phone: { contains: result.recipient.replace('+263', '') } },
              })

              await db.communication.create({
                data: {
                  schoolId: parent?.schoolId || 'default',
                  parentId: parent?.id || null,
                  channel: isWhatsApp ? 'WHATSAPP' : 'SMS',
                  subject: `Bulk SMS - ${message.substring(0, 50)}`,
                  message,
                  status: result.status === 'Failed' || result.status === 'Rejected' ? 'FAILED' : 'SENT',
                  sentAt: new Date(),
                },
              })
            } catch {
              // Skip logging individual communication errors
            }
          }

          return NextResponse.json({
            success: true,
            messageId: deliveryResults[0]?.messageId || generateMessageId(),
            status: failedCount === deliveryResults.length ? 'failed' : sentCount > 0 ? 'sent' : 'partial',
            cost: totalCost,
            totalSent: sentCount,
            totalFailed: failedCount,
            results: deliveryResults,
          })
        } else {
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

    // ─── Simulated SMS Flow (Dev Mode) ─────────────────────────────────────
    const deliveryResults: SmsDeliveryResult[] = validatedRecipients.map(phone => {
      const isSuccess = Math.random() > 0.1
      return {
        messageId: generateMessageId(),
        recipient: phone,
        status: isSuccess ? 'Delivered' as const : 'Failed' as const,
        cost: 0.02,
        network: phone.includes('77') ? 'ECONET' : phone.includes('71') ? 'NETONE' : 'TELECEL',
        failureReason: !isSuccess ? 'Invalid number' : undefined,
      }
    })

    const totalCost = deliveryResults.reduce((sum, r) => sum + r.cost, 0)
    const sentCount = deliveryResults.filter(r => r.status === 'Delivered' || r.status === 'Sent').length
    const failedCount = deliveryResults.filter(r => r.status === 'Failed' || r.status === 'Rejected').length

    // Log communications in the database (demo mode)
    for (const result of deliveryResults) {
      try {
        const parent = await db.parent.findFirst({
          where: { phone: { contains: result.recipient.replace('+263', '') } },
        })

        if (parent || result.status === 'Delivered') {
          await db.communication.create({
            data: {
              schoolId: parent?.schoolId || 'default',
              parentId: parent?.id || null,
              channel: isWhatsApp ? 'WHATSAPP' : 'SMS',
              subject: `Bulk SMS - ${message.substring(0, 50)}`,
              message,
              status: result.status === 'Failed' ? 'FAILED' : 'SENT',
              sentAt: new Date(),
            },
          })
        }
      } catch {
        // Skip logging individual communication errors
      }
    }

    return NextResponse.json({
      success: true,
      messageId: deliveryResults[0]?.messageId || generateMessageId(),
      status: failedCount === deliveryResults.length ? 'failed' : sentCount > 0 ? 'sent' : 'partial',
      cost: totalCost,
      totalSent: sentCount,
      totalFailed: failedCount,
      results: deliveryResults,
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
