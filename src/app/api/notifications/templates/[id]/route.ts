import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'

// PUT    /api/notifications/templates/[id]  -> update a template
// DELETE /api/notifications/templates/[id]  -> delete a template

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  const { id } = await params

  try {
    const owned = await db.notificationTemplate.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const body = await request.json()
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
    logAudit({ action: 'UPDATE', entity: 'notification-template', entityId: id }).catch(() => {})
    return NextResponse.json(template)
  } catch (error) {
    console.error('template PUT error', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error
  const schoolId = auth.session.user.schoolId
  const { id } = await params

  try {
    const owned = await db.notificationTemplate.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    await db.notificationTemplate.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'notification-template', entityId: id }).catch(() => {})
    return NextResponse.json({ message: 'Template deleted' })
  } catch (error) {
    console.error('template DELETE error', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
