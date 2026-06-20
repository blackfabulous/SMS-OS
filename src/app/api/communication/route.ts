import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'

// GET /api/communication - List communications with type filter and search by recipient
export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error
  const { schoolId } = tenantResult

  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') // sms/email/whatsapp filter
    const status = searchParams.get('status')
    const search = searchParams.get('search') || '' // search by recipient
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { schoolId }
    if (channel) where.channel = channel.toUpperCase()
    if (status) where.status = status.toUpperCase()

    // Search by recipient (parent name via relation)
    if (search) {
      const matchingParents = await db.parent.findMany({
        where: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })
      const parentIds = matchingParents.map((p) => p.id)
      where.OR = [
        { parentId: { in: parentIds } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [communications, total] = await Promise.all([
      db.communication.findMany({
        where,
        include: {
          parent: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.communication.count({ where }),
    ])

    // Channel statistics
    const channelStats = await db.communication.groupBy({
      by: ['channel'],
      where: { schoolId },
      _count: { id: true },
    })

    const statusStats = await db.communication.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: { id: true },
    })

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

    return NextResponse.json({
      data: communications,
      stats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching communications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    )
  }
}

// POST /api/communication - Send communication (log it)
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  try {
    const body = await request.json()

    const { parentId, channel, subject, message, recipientGroup, gradeId } = body

    // Single recipient
    if (parentId) {
      if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 })
      }
      const comm = await db.communication.create({
        data: {
          schoolId: school.id,
          parentId,
          channel: channel || 'SMS',
          subject: subject || null,
          message,
          status: 'SENT',
          sentAt: new Date(),
        },
        include: {
          parent: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
        },
      })
      logAudit({ action: 'CREATE', entity: 'communication', entityId: (comm as any)?.id, afterValue: comm }).catch(() => {})
      return NextResponse.json(comm, { status: 201 })
    }

    // Bulk send to group
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let parents: Array<{ id: string }> = []

    if (recipientGroup === 'ALL_PARENTS') {
      parents = await db.parent.findMany({
        where: { schoolId: school.id },
        select: { id: true },
      })
    } else if (recipientGroup === 'FEE_RESPONSIBLE') {
      parents = await db.parent.findMany({
        where: { schoolId: school.id, isFeeResponsible: true },
        select: { id: true },
      })
    } else if (recipientGroup === 'BY_GRADE' && gradeId) {
      const students = await db.student.findMany({
        where: {
          schoolId: school.id,
          enrollments: { some: { class: { gradeId } } },
        },
        select: { id: true },
      })
      const studentIds = students.map((s) => s.id)
      const links = await db.studentParent.findMany({
        where: { studentId: { in: studentIds } },
        select: { parentId: true },
        distinct: ['parentId'],
      })
      parents = links.map((l) => ({ id: l.parentId }))
    }

    const communications = await Promise.all(
      parents.map((parent) =>
        db.communication.create({
          data: {
            schoolId: school.id,
            parentId: parent.id,
            channel: channel || 'SMS',
            subject: subject || null,
            message,
            status: 'SENT',
            sentAt: new Date(),
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: `Message sent to ${communications.length} parent(s)`,
        count: communications.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error sending communication:', error)
    return NextResponse.json(
      { error: 'Failed to send communication' },
      { status: 500 }
    )
  }
}

// PUT /api/communication - Update communication
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Communication ID is required' },
        { status: 400 }
      )
    }

    const comm = await db.communication.update({
      where: { id },
      data: {
        status: updates.status,
        subject: updates.subject,
        message: updates.message,
        sentAt: updates.status === 'SENT' ? new Date() : undefined,
      },
      include: {
        parent: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
    })

    logAudit({ action: 'UPDATE', entity: 'communication', entityId: (comm as any)?.id, afterValue: comm }).catch(() => {})
    return NextResponse.json(comm)
  } catch (error) {
    console.error('Error updating communication:', error)
    return NextResponse.json(
      { error: 'Failed to update communication' },
      { status: 500 }
    )
  }
}

// DELETE /api/communication - Delete communication
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Communication ID is required' },
        { status: 400 }
      )
    }

    await db.communication.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'communication', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Communication deleted successfully' })
  } catch (error) {
    console.error('Error deleting communication:', error)
    return NextResponse.json(
      { error: 'Failed to delete communication' },
      { status: 500 }
    )
  }
}
