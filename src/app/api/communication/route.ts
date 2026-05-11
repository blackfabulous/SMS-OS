import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (channel) where.channel = channel
    if (status) where.status = status

    const [communications, total] = await Promise.all([
      db.communication.findMany({
        where,
        include: { parent: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.communication.count({ where }),
    ])

    const channelStats = await db.communication.groupBy({ by: ['channel'], _count: { id: true } })
    const statusStats = await db.communication.groupBy({ by: ['status'], _count: { id: true } })

    const stats = {
      totalMessages: total,
      sms: channelStats.find((c) => c.channel === 'SMS')?._count.id || 0,
      whatsapp: channelStats.find((c) => c.channel === 'WHATSAPP')?._count.id || 0,
      email: channelStats.find((c) => c.channel === 'EMAIL')?._count.id || 0,
      delivered: statusStats.find((s) => s.status === 'DELIVERED')?._count.id || 0,
      pending: statusStats.find((s) => s.status === 'PENDING')?._count.id || 0,
      failed: statusStats.find((s) => s.status === 'FAILED')?._count.id || 0,
    }

    return NextResponse.json({
      data: communications, stats, total, page, totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching communications:', error)
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const school = await db.school.findFirst()
    if (!school) return NextResponse.json({ error: 'School not configured' }, { status: 400 })

    if (body.parentId) {
      const comm = await db.communication.create({
        data: {
          schoolId: school.id, parentId: body.parentId, channel: body.channel || 'SMS',
          subject: body.subject, message: body.message, status: 'SENT', sentAt: new Date(),
        },
        include: { parent: true },
      })
      return NextResponse.json(comm, { status: 201 })
    }

    // Send to group
    let parents: Array<{ id: string }> = []

    if (body.recipientGroup === 'ALL_PARENTS') {
      parents = await db.parent.findMany({ where: { schoolId: school.id }, select: { id: true } })
    } else if (body.recipientGroup === 'FEE_RESPONSIBLE') {
      parents = await db.parent.findMany({ where: { schoolId: school.id, isFeeResponsible: true }, select: { id: true } })
    } else if (body.recipientGroup === 'BY_GRADE' && body.gradeId) {
      const students = await db.student.findMany({
        where: { schoolId: school.id, enrollments: { some: { class: { gradeId: body.gradeId } } } },
        select: { id: true },
      })
      const studentIds = students.map((s) => s.id)
      const links = await db.studentParent.findMany({
        where: { studentId: { in: studentIds } }, select: { parentId: true }, distinct: ['parentId'],
      })
      parents = links.map((l) => ({ id: l.parentId }))
    }

    const communications = await Promise.all(
      parents.map((parent) =>
        db.communication.create({
          data: {
            schoolId: school.id, parentId: parent.id, channel: body.channel || 'SMS',
            subject: body.subject, message: body.message, status: 'SENT', sentAt: new Date(),
          },
        })
      )
    )

    return NextResponse.json({ message: `Message sent to ${communications.length} parent(s)`, count: communications.length }, { status: 201 })
  } catch (error) {
    console.error('Error sending communication:', error)
    return NextResponse.json({ error: 'Failed to send communication' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 })

    const comm = await db.communication.update({
      where: { id },
      data: { status: updates.status, subject: updates.subject, message: updates.message, sentAt: updates.status === 'SENT' ? new Date() : undefined },
      include: { parent: true },
    })

    return NextResponse.json(comm)
  } catch (error) {
    console.error('Error updating communication:', error)
    return NextResponse.json({ error: 'Failed to update communication' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 })

    await db.communication.delete({ where: { id } })
    return NextResponse.json({ message: 'Communication deleted successfully' })
  } catch (error) {
    console.error('Error deleting communication:', error)
    return NextResponse.json({ error: 'Failed to delete communication' }, { status: 500 })
  }
}
