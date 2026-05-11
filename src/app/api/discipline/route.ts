import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/discipline — List discipline incidents with student details
// Query params: search, status, incidentType, studentId, dateFrom, dateTo, page, limit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const incidentType = searchParams.get('incidentType') || ''
    const studentId = searchParams.get('studentId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (incidentType) where.incidentType = incidentType
    if (studentId) where.studentId = studentId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { action: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { student: { studentNumber: { contains: search } } },
      ]
    }

    const [records, total] = await Promise.all([
      db.disciplineRecord.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              gender: true,
              enrollmentStatus: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.disciplineRecord.count({ where }),
    ])

    // Stats
    const stats = {
      total: await db.disciplineRecord.count(),
      open: await db.disciplineRecord.count({ where: { status: 'OPEN' } }),
      resolved: await db.disciplineRecord.count({ where: { status: 'RESOLVED' } }),
      closed: await db.disciplineRecord.count({ where: { status: 'CLOSED' } }),
      totalMerit: (await db.disciplineRecord.aggregate({ _sum: { meritPoints: true } }))._sum.meritPoints || 0,
      totalDemerit: (await db.disciplineRecord.aggregate({ _sum: { demeritPoints: true } }))._sum.demeritPoints || 0,
      parentNotifiedCount: await db.disciplineRecord.count({ where: { parentNotified: true } }),
    }

    // Incident type breakdown
    const incidentTypeBreakdown = await db.disciplineRecord.groupBy({
      by: ['incidentType'],
      _count: { id: true },
    })

    return NextResponse.json({
      data: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
      incidentTypeBreakdown: incidentTypeBreakdown.map((i) => ({ type: i.incidentType, count: i._count.id })),
    })
  } catch (error) {
    console.error('Failed to fetch discipline records:', error)
    return NextResponse.json({ error: 'Failed to fetch discipline records' }, { status: 500 })
  }
}

// POST /api/discipline — Create incident
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      incidentType,
      description,
      date,
      action,
      meritPoints,
      demeritPoints,
      parentNotified,
    } = body

    if (!studentId || !incidentType || !description) {
      return NextResponse.json(
        { error: 'Student ID, incident type, and description are required' },
        { status: 400 }
      )
    }

    const record = await db.disciplineRecord.create({
      data: {
        studentId,
        incidentType,
        description,
        date: date ? new Date(date) : new Date(),
        action: action || null,
        meritPoints: meritPoints || 0,
        demeritPoints: demeritPoints || 0,
        parentNotified: parentNotified || false,
        status: 'OPEN',
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to create discipline record:', error)
    return NextResponse.json({ error: 'Failed to create discipline record' }, { status: 500 })
  }
}

// PUT /api/discipline — Update discipline record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    const record = await db.disciplineRecord.update({
      where: { id },
      data: {
        incidentType: updates.incidentType,
        description: updates.description,
        action: updates.action,
        meritPoints: updates.meritPoints,
        demeritPoints: updates.demeritPoints,
        parentNotified: updates.parentNotified,
        status: updates.status,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to update discipline record:', error)
    return NextResponse.json({ error: 'Failed to update discipline record' }, { status: 500 })
  }
}

// DELETE /api/discipline?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    await db.disciplineRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Discipline record deleted successfully' })
  } catch (error) {
    console.error('Failed to delete discipline record:', error)
    return NextResponse.json({ error: 'Failed to delete discipline record' }, { status: 500 })
  }
}
