import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET  /api/notifications/templates  -> list message templates
// POST /api/notifications/templates  -> create a template

export async function GET() {
  const auth = await validateAuth()
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return NextResponse.json({ error: 'School not configured' }, { status: 400 })

  try {
    const templates = await db.notificationTemplate.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data: templates })
  } catch (error) {
    console.error('templates GET error', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  if (!schoolId) return NextResponse.json({ error: 'School not configured' }, { status: 400 })

  try {
    const body = await request.json()
    const { name, category, channels, subject, body: messageBody } = body
    if (!name || !messageBody) return NextResponse.json({ error: 'name and body are required' }, { status: 400 })

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
    logAudit({ action: 'CREATE', entity: 'notification-template', entityId: template.id }).catch(() => {})
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('templates POST error', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
