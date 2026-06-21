import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/timetable - List timetable entries with class/teacher/day filters
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const staffId = searchParams.get('staffId')
    const dayOfWeek = searchParams.get('dayOfWeek')
    const subjectId = searchParams.get('subjectId')
    const room = searchParams.get('room')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    const schoolId = authResult.session.user.schoolId

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Build where clause
    const where: Record<string, unknown> = { schoolId, isActive: true }
    if (classId) where.classId = classId
    if (staffId) where.staffId = staffId
    if (dayOfWeek) where.dayOfWeek = parseInt(dayOfWeek)
    if (subjectId) where.subjectId = subjectId
    if (room) where.room = { contains: room, mode: 'insensitive' }

    const [entries, total] = await Promise.all([
      db.timetableEntry.findMany({
        where,
        include: {
          class: { include: { grade: true } },
          subject: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        skip,
        take: limit,
      }),
      db.timetableEntry.count({ where }),
    ])

    // Timetable statistics
    const classesScheduled = await db.timetableEntry.groupBy({
      by: ['classId'],
      where: { schoolId, isActive: true },
    })

    const teachersScheduled = await db.timetableEntry.groupBy({
      by: ['staffId'],
      where: { schoolId, isActive: true, staffId: { not: null } },
    })

    const roomsInUse = await db.timetableEntry.groupBy({
      by: ['room'],
      where: { schoolId, isActive: true, room: { not: null } },
    })

    const stats = {
      totalPeriods: total,
      classesScheduled: classesScheduled.length,
      teachersScheduled: teachersScheduled.length,
      roomsInUse: roomsInUse.length,
      byDay: [1, 2, 3, 4, 5].map((day) => ({
        day,
        dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][day - 1],
        periods: entries.filter((e) => e.dayOfWeek === day).length,
      })),
    }

    return NextResponse.json({
      data: entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch timetable data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timetable data' },
      { status: 500 }
    )
  }
}

// POST /api/timetable - Create timetable entry with conflict detection
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const schoolId = authResult.session.user.schoolId

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    const {
      classId,
      subjectId,
      staffId,
      dayOfWeek,
      period,
      room,
      startTime,
      endTime,
    } = body

    // Validate required fields
    if (!classId || !subjectId || !dayOfWeek || !period) {
      return NextResponse.json(
        { error: 'Class, subject, day of week, and period are required' },
        { status: 400 }
      )
    }

    // Validate dayOfWeek (1=Monday through 5=Friday, or 1-7)
    if (dayOfWeek < 1 || dayOfWeek > 7) {
      return NextResponse.json(
        { error: 'Day of week must be between 1 (Monday) and 7 (Sunday)' },
        { status: 400 }
      )
    }

    // Validate period
    if (period < 1 || period > 12) {
      return NextResponse.json(
        { error: 'Period must be between 1 and 12' },
        { status: 400 }
      )
    }

    // === CONFLICT DETECTION ===

    // 1. Check if the class already has something scheduled at this day+period
    const classConflict = await db.timetableEntry.findFirst({
      where: {
        schoolId,
        classId,
        dayOfWeek,
        period,
        isActive: true,
      },
      include: {
        class: { include: { grade: true } },
        subject: true,
      },
    })

    if (classConflict) {
      return NextResponse.json(
        {
          error: `Class conflict: This class already has "${classConflict.subject?.name || 'a subject'}" scheduled for ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayOfWeek - 1]} Period ${period}`,
          conflict: {
            type: 'CLASS',
            existingEntry: classConflict,
          },
        },
        { status: 409 }
      )
    }

    // 2. Check if the teacher is already assigned at this day+period
    if (staffId) {
      const teacherConflict = await db.timetableEntry.findFirst({
        where: {
          schoolId,
          staffId,
          dayOfWeek,
          period,
          isActive: true,
        },
        include: {
          class: { include: { grade: true } },
          subject: true,
        },
      })

      if (teacherConflict) {
        return NextResponse.json(
          {
            error: `Teacher conflict: This teacher is already assigned to "${teacherConflict.subject?.name || 'a subject'}" for ${teacherConflict.class?.name || 'a class'} on ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayOfWeek - 1]} Period ${period}`,
            conflict: {
              type: 'TEACHER',
              existingEntry: teacherConflict,
            },
          },
          { status: 409 }
        )
      }
    }

    // 3. Check if the room is already occupied at this day+period
    if (room) {
      const roomConflict = await db.timetableEntry.findFirst({
        where: {
          schoolId,
          room,
          dayOfWeek,
          period,
          isActive: true,
        },
        include: {
          class: { include: { grade: true } },
          subject: true,
        },
      })

      if (roomConflict) {
        return NextResponse.json(
          {
            error: `Room conflict: Room "${room}" is already occupied by ${roomConflict.class?.name || 'a class'} for "${roomConflict.subject?.name || 'a subject'}" on ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayOfWeek - 1]} Period ${period}`,
            conflict: {
              type: 'ROOM',
              existingEntry: roomConflict,
            },
          },
          { status: 409 }
        )
      }
    }

    // No conflicts - create the entry
    const entry = await db.timetableEntry.create({
      data: {
        schoolId,
        classId,
        subjectId,
        staffId: staffId || null,
        dayOfWeek,
        period,
        room: room || null,
        startTime: startTime || null,
        endTime: endTime || null,
      },
      include: {
        class: { include: { grade: true } },
        subject: true,
      },
    })

    logAudit({ action: 'CREATE', entity: 'timetable', entityId: (entry as any)?.id, afterValue: entry }).catch(() => {})
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Failed to create timetable entry:', error)
    return NextResponse.json(
      { error: 'Failed to create timetable entry' },
      { status: 500 }
    )
  }
}

// PUT /api/timetable - Update timetable entry
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    // Verify the entry belongs to the caller's school before any read/mutation.
    const schoolId = authResult.session.user.schoolId
    const existing = await db.timetableEntry.findFirst({ where: { id, schoolId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Timetable entry not found' },
        { status: 404 }
      )
    }

    // If changing day/period/class/teacher/room, check for conflicts
    if (updates.dayOfWeek || updates.period || updates.classId || updates.staffId || updates.room) {
      const newDayOfWeek = updates.dayOfWeek || existing.dayOfWeek
      const newPeriod = updates.period || existing.period
      const newClassId = updates.classId || existing.classId
      const newStaffId = updates.staffId !== undefined ? updates.staffId : existing.staffId
      const newRoom = updates.room !== undefined ? updates.room : existing.room

      // Check class conflict (excluding current entry)
      const classConflict = await db.timetableEntry.findFirst({
        where: {
          schoolId,
          classId: newClassId,
          dayOfWeek: newDayOfWeek,
          period: newPeriod,
          isActive: true,
          id: { not: id },
        },
      })
      if (classConflict) {
        return NextResponse.json(
          { error: 'Class conflict detected for the new schedule' },
          { status: 409 }
        )
      }

      // Check teacher conflict
      if (newStaffId) {
        const teacherConflict = await db.timetableEntry.findFirst({
          where: {
            schoolId,
            staffId: newStaffId,
            dayOfWeek: newDayOfWeek,
            period: newPeriod,
            isActive: true,
            id: { not: id },
          },
        })
        if (teacherConflict) {
          return NextResponse.json(
            { error: 'Teacher conflict detected for the new schedule' },
            { status: 409 }
          )
        }
      }

      // Check room conflict
      if (newRoom) {
        const roomConflict = await db.timetableEntry.findFirst({
          where: {
            schoolId,
            room: newRoom,
            dayOfWeek: newDayOfWeek,
            period: newPeriod,
            isActive: true,
            id: { not: id },
          },
        })
        if (roomConflict) {
          return NextResponse.json(
            { error: 'Room conflict detected for the new schedule' },
            { status: 409 }
          )
        }
      }
    }

    const entry = await db.timetableEntry.update({
      where: { id },
      data: {
        classId: updates.classId,
        subjectId: updates.subjectId,
        staffId: updates.staffId,
        dayOfWeek: updates.dayOfWeek,
        period: updates.period,
        room: updates.room,
        startTime: updates.startTime,
        endTime: updates.endTime,
      },
      include: {
        class: { include: { grade: true } },
        subject: true,
      },
    })

    logAudit({ action: 'UPDATE', entity: 'timetable', entityId: (entry as any)?.id, afterValue: entry }).catch(() => {})
    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to update timetable entry:', error)
    return NextResponse.json(
      { error: 'Failed to update timetable entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/timetable - Soft delete timetable entry
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    const schoolId = authResult.session.user.schoolId
    const owned = await db.timetableEntry.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Timetable entry not found' }, { status: 404 })

    await db.timetableEntry.update({ where: { id }, data: { isActive: false } })
    logAudit({ action: 'DELETE', entity: 'timetable', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Timetable entry deleted successfully' })
  } catch (error) {
    console.error('Failed to delete timetable entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete timetable entry' },
      { status: 500 }
    )
  }
}
