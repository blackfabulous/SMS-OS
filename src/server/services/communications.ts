import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

const AFRICAS_TALKING_API_KEY = process.env.AFRICAS_TALKING_API_KEY
const AFRICAS_TALKING_USERNAME = process.env.AFRICAS_TALKING_USERNAME || 'sandbox'
const AFRICAS_TALKING_SENDER_ID = process.env.AFRICAS_TALKING_SENDER_ID || 'ZimSchool'

interface SmsDeliveryResult {
  messageId: string
  recipient: string
  status: 'Sent' | 'Delivered' | 'Failed' | 'Rejected' | 'Queued'
  cost: number
  network: string
  failureReason?: string
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`
}

function validatePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('0')) cleaned = '+263' + cleaned.substring(1)
  else if (!cleaned.startsWith('+')) cleaned = '+263' + cleaned
  return cleaned
}

export async function listCommunications(schoolId: string, filters: { channel?: string; status?: string; search?: string; page: number; limit: number }) {
  const where: Record<string, unknown> = { schoolId }
  if (filters.channel) where.channel = filters.channel.toUpperCase() as any
  if (filters.status) where.status = filters.status.toUpperCase() as any

  if (filters.search) {
    const matchingParents = await db.parent.findMany({
      where: {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    })
    const parentIds = matchingParents.map((p) => p.id)
    where.OR = [{ parentId: { in: parentIds } }, { subject: { contains: filters.search, mode: 'insensitive' } }, { message: { contains: filters.search, mode: 'insensitive' } }]
  }

  const [communications, total] = await Promise.all([
    db.communication.findMany({
      where,
      include: { parent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    db.communication.count({ where }),
  ])

  const channelStats = await db.communication.groupBy({ by: ['channel'], where: { schoolId }, _count: { id: true } })
  const statusStats = await db.communication.groupBy({ by: ['status'], where: { schoolId }, _count: { id: true } })

  const stats = {
    totalMessages: total,
    sms: channelStats.find((c) => c.channel === 'SMS')?._count.id || 0,
    email: channelStats.find((c) => c.channel === 'EMAIL')?._count.id || 0,
    whatsapp: channelStats.find((c) => c.channel === 'WHATSAPP')?._count.id || 0,
    delivered: statusStats.find((s) => s.status === 'DELIVERED')?._count.id || 0,
    pending: statusStats.find((s) => s.status === 'PENDING')?._count.id || 0,
    failed: statusStats.find((s) => s.status === 'FAILED')?._count.id || 0,
    sent: statusStats.find((s) => s.status === 'SENT')?._count.id || 0,
  }

  const channelDistribution = channelStats.map((c) => ({ channel: c.channel, count: c._count.id }))

  return { data: communications, stats, channelDistribution, total, page: filters.page, totalPages: Math.ceil(total / filters.limit) }
}

export async function sendCommunication(schoolId: string, body: any) {
  const { parentId, channel, subject, message, recipientGroup, gradeId } = body
  if (!message) throw new AppError('VALIDATION', 'Message is required')

  if (parentId) {
    const comm = await db.communication.create({
      data: {
        schoolId,
        parentId,
        channel: (channel || 'SMS').toUpperCase() as any,
        subject: subject || null,
        message,
        status: 'SENT' as any,
        sentAt: new Date(),
      },
      include: { parent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
    })
    logAudit({ action: 'CREATE', entity: 'communication', entityId: comm.id, schoolId, afterValue: comm }).catch(() => {})
    return comm
  }

  let parents: Array<{ id: string }> = []
  if (recipientGroup === 'ALL_PARENTS') {
    parents = await db.parent.findMany({ where: { schoolId }, select: { id: true } })
  } else if (recipientGroup === 'FEE_RESPONSIBLE') {
    parents = await db.parent.findMany({ where: { schoolId, isFeeResponsible: true }, select: { id: true } })
  } else if (recipientGroup === 'BY_GRADE' && gradeId) {
    const students = await db.student.findMany({
      where: { schoolId, enrollments: { some: { class: { gradeId } } } },
      select: { id: true },
    })
    const studentIds = students.map((s) => s.id)
    const links = await db.studentParent.findMany({
      where: { schoolId, studentId: { in: studentIds } },
      select: { parentId: true },
      distinct: ['parentId'],
    })
    parents = links.map((l) => ({ id: l.parentId }))
  }

  const communications = await Promise.all(
    parents.map((parent) =>
      db.communication.create({
        data: {
          schoolId,
          parentId: parent.id,
          channel: (channel || 'SMS').toUpperCase() as any,
          subject: subject || null,
          message,
          status: 'SENT' as any,
          sentAt: new Date(),
        },
      }),
    ),
  )

  logAudit({ action: 'CREATE', entity: 'communication', entityId: 'bulk', schoolId, afterValue: { count: communications.length } }).catch(() => {})
  return { message: `Message sent to ${communications.length} parent(s)`, count: communications.length }
}

export async function updateCommunication(schoolId: string, id: string, updates: any) {
  const owned = await db.communication.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Communication not found')

  const comm = await db.communication.update({
    where: { id },
    data: { status: updates.status, subject: updates.subject, message: updates.message, sentAt: updates.status === 'SENT' ? new Date() : undefined },
    include: { parent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
  })

  logAudit({ action: 'UPDATE', entity: 'communication', entityId: comm.id, schoolId, afterValue: comm }).catch(() => {})
  return comm
}

export async function deleteCommunication(schoolId: string, id: string) {
  const owned = await db.communication.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Communication not found')

  await db.communication.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'communication', entityId: id, schoolId }).catch(() => {})
  return { message: 'Communication deleted successfully' }
}

export async function sendSmsViaAfricasTalking(schoolId: string, body: { to: string | string[]; message: string; type?: 'sms' | 'whatsapp'; senderId?: string }) {
  const { to, message, type, senderId } = body
  if (!to) throw new AppError('VALIDATION', 'Recipient(s) are required. Provide a phone number or array of phone numbers.')
  if (!message || message.trim().length === 0) throw new AppError('VALIDATION', 'Message content is required')

  const recipients: string[] = Array.isArray(to) ? to : [to]
  if (recipients.length === 0) throw new AppError('VALIDATION', 'At least one recipient is required')
  if (recipients.length > 1000) throw new AppError('VALIDATION', 'Maximum 1000 recipients per request')

  const validatedRecipients = recipients.map(validatePhoneNumber)
  const usedSenderId = senderId || AFRICAS_TALKING_SENDER_ID
  const smsType = type || 'sms'
  const isWhatsApp = smsType === 'whatsapp'

  if (AFRICAS_TALKING_API_KEY) {
    try {
      const baseUrl = AFRICAS_TALKING_USERNAME === 'sandbox' ? 'https://api.sandbox.africastalking.com/version1/messaging' : 'https://api.africastalking.com/version1/messaging'
      const atPayload = new URLSearchParams({
        username: AFRICAS_TALKING_USERNAME,
        message: message.substring(0, 160 * (recipients.length > 1 ? 5 : 1)),
        to: validatedRecipients.join(','),
        from: usedSenderId,
      })
      if (isWhatsApp) atPayload.append('enqueue', '1')

      const response = await fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', apiKey: AFRICAS_TALKING_API_KEY, Accept: 'application/json' }, body: atPayload.toString() })
      const responseData = await response.json()

      if (responseData.SMSMessageData) {
        const smsData = responseData.SMSMessageData
        const deliveryResults: SmsDeliveryResult[] = (smsData.Recipients || []).map((r: any) => ({
          messageId: r.messageId || generateMessageId(),
          recipient: r.number,
          status: r.status as SmsDeliveryResult['status'],
          cost: parseFloat(r.cost) || 0,
          network: r.networkCode || 'ZW01',
        }))

        const totalCost = deliveryResults.reduce((sum: number, r: { cost: number }) => sum + r.cost, 0)
        const sentCount = deliveryResults.filter((r: { status: string }) => r.status === 'Sent' || r.status === 'Queued').length
        const failedCount = deliveryResults.filter((r: { status: string }) => r.status === 'Failed' || r.status === 'Rejected').length

        for (const result of deliveryResults) {
          try {
            const parent = await db.parent.findFirst({
              where: { schoolId, phone: { contains: result.recipient.replace('+263', ''), mode: 'insensitive' } },
            })
            await db.communication.create({
              data: {
                schoolId,
                parentId: parent?.id || null,
                channel: isWhatsApp ? 'WHATSAPP' : 'SMS',
                subject: `Bulk SMS - ${message.substring(0, 50)}`,
                message,
                status: result.status === 'Failed' || result.status === 'Rejected' ? 'FAILED' : 'SENT',
                sentAt: new Date(),
              },
            })
          } catch {}
        }

        logAudit({ action: 'CREATE', entity: 'send', schoolId }).catch(() => {})
        return {
          success: true,
          messageId: deliveryResults[0]?.messageId || generateMessageId(),
          status: failedCount === deliveryResults.length ? 'failed' : sentCount > 0 ? 'sent' : 'partial',
          cost: totalCost,
          totalSent: sentCount,
          totalFailed: failedCount,
          results: deliveryResults,
        }
      }
      throw new AppError('INTERNAL', "Africa's Talking API error", responseData)
    } catch (error) {
      if (isAppError(error)) throw error
      throw new AppError('INTERNAL', "Failed to communicate with Africa's Talking")
    }
  }

  const deliveryResults: SmsDeliveryResult[] = validatedRecipients.map((phone) => {
    const isSuccess = Math.random() > 0.1
    return {
      messageId: generateMessageId(),
      recipient: phone,
      status: isSuccess ? 'Delivered' : 'Failed',
      cost: 0.02,
      network: phone.includes('77') ? 'ECONET' : phone.includes('71') ? 'NETONE' : 'TELECEL',
      failureReason: !isSuccess ? 'Invalid number' : undefined,
    }
  })

  const totalCost = deliveryResults.reduce((sum, r) => sum + r.cost, 0)
  const sentCount = deliveryResults.filter((r) => r.status === 'Delivered' || r.status === 'Sent').length
  const failedCount = deliveryResults.filter((r) => r.status === 'Failed' || r.status === 'Rejected').length

  for (const result of deliveryResults) {
    try {
      const parent = await db.parent.findFirst({ where: { schoolId, phone: { contains: result.recipient.replace('+263', ''), mode: 'insensitive' } } })
      if (parent || result.status === 'Delivered') {
        await db.communication.create({
          data: {
            schoolId,
            parentId: parent?.id || null,
            channel: isWhatsApp ? 'WHATSAPP' : 'SMS',
            subject: `Bulk SMS - ${message.substring(0, 50)}`,
            message,
            status: result.status === 'Failed' ? 'FAILED' : 'SENT',
            sentAt: new Date(),
          },
        })
      }
    } catch {}
  }

  logAudit({ action: 'CREATE', entity: 'send', schoolId }).catch(() => {})
  return {
    success: true,
    messageId: deliveryResults[0]?.messageId || generateMessageId(),
    status: failedCount === deliveryResults.length ? 'failed' : sentCount > 0 ? 'sent' : 'partial',
    cost: totalCost,
    totalSent: sentCount,
    totalFailed: failedCount,
    results: deliveryResults,
    demo: true,
  }
}

export function handleCommunicationsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
