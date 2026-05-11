import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dayOfWeek = searchParams.get('dayOfWeek')
    const classId = searchParams.get('classId')
    const staffId = searchParams.get('staffId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    let schoolId: string | undefined
    const school = await db.school.findFirst()
    schoolId = school?.id

    const where: Record<string, unknown> = { schoolId, isActive: true }
    if (dayOfWeek) where.dayOfWeek = parseInt(dayOfWeek)
    if (classId) where.classId = classId
    if (staffId) where.staffId = staffId

    const [entries, total] = await Promise.all([
      db.timetableEntry.findMany({
        where,
        include: {
          class: { include: { grade: true } },
          subject: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.timetableEntry.count({ where }),
    ])

    const stats = {
      totalPeriods: total,
      classesScheduled: (await db.timetableEntry.groupBy({ by: ['classId'], where: { schoolId, isActive: true } })).length,
      teachersScheduled: (await db.timetableEntry.groupBy({ by: ['staffId'], where: { schoolId, isActive: true, staffId: { not: null } } })).length,
      freePeriods: 0, // Would need more complex calculation
    }

    return NextResponse.json({ data: entries, total, page, totalPages: Math.ceil(total / limit), stats })
  } catch (error) {
    console.error('Failed to fetch timetable data:', error)
    return NextResponse.json({ error: 'Failed to fetch timetable data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    const { classId, subjectId, staffId, dayOfWeek, period, room, startTime, endTime } = body
    if (!classId || !subjectId || !dayOfWeek || !period) {
      return NextResponse.json({ error: 'Class, subject, day, and period are required' }, { status: 400 })
    }

    // Check for conflicts
    const conflict = await db.timetableEntry.findFirst({
      where: { schoolId: schoolId || 'default', dayOfWeek, period, isActive: true,
        OR: [
          { classId }, // Same class same period
          ...(staffId ? [{ staffId }] : []), // Same teacher same period
        ],
      },
    })

    if (conflict) {
      return NextResponse.json({ error: 'Timetable conflict detected - this slot is already occupied', conflict }, { status: 409 })
    }

    const entry = await db.timetableEntry.create({
      data: {
        schoolId: schoolId || 'default', classId, subjectId,
        staffId: staffId || null, dayOfWeek, period,
        room: room || null, startTime: startTime || null, endTime: endTime || null,
      },
      include: { class: { include: { grade: true } }, subject: true },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Failed to create timetable entry:', error)
    return NextResponse.json({ error: 'Failed to create timetable entry' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })

    const entry = await db.timetableEntry.update({
      where: { id },
      data: {
        classId: updates.classId, subjectId: updates.subjectId,
        staffId: updates.staffId, dayOfWeek: updates.dayOfWeek,
        period: updates.period, room: updates.room,
        startTime: updates.startTime, endTime: updates.endTime,
      },
      include: { class: { include: { grade: true } }, subject: true },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to update timetable entry:', error)
    return NextResponse.json({ error: 'Failed to update timetable entry' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })

    await db.timetableEntry.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Timetable entry deleted successfully' })
  } catch (error) {
    console.error('Failed to delete timetable entry:', error)
    return NextResponse.json({ error: 'Failed to delete timetable entry' }, { status: 500 })
  }
}
