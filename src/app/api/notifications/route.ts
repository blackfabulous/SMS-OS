import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

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

export async function GET() {
  const auth = await validateAuth()
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return fail('VALIDATION', 'School not configured')

  try {
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

    return ok({ stats, history, dailyVolume, channelUsage, recentActivity })
  } catch (error) {
    logger.error({ err: error }, 'notifications GET error')
    return fail('INTERNAL', 'Failed to fetch notifications')
  }
}

export async function POST(request: NextRequest) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return fail('VALIDATION', 'School not configured')

  try {
    const body = await request.json()
    const { channel, recipients, subject, body: messageBody, status, phone, eventType } = body
    if (!messageBody) return fail('VALIDATION', 'body is required')

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
    logAudit({ action: 'CREATE', entity: 'notifications', entityId: log.id }).catch(() => {})
    return ok(log, 201)
  } catch (error) {
    logger.error({ err: error }, 'notifications POST error')
    return fail('INTERNAL', 'Failed to log notification')
  }
}
