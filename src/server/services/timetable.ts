import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface ListParams {
  classId?: string | null
  staffId?: string | null
  dayOfWeek?: string | null
  subjectId?: string | null
  room?: string | null
  page?: number
  limit?: number
}

export async function listTimetable(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 100
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { schoolId, isActive: true }
  if (params.classId) where.classId = params.classId
  if (params.staffId) where.staffId = params.staffId
  if (params.dayOfWeek) where.dayOfWeek = parseInt(params.dayOfWeek)
  if (params.subjectId) where.subjectId = params.subjectId
  if (params.room) where.room = { contains: params.room, mode: 'insensitive' }

  const [entries, total] = await Promise.all([
    db.timetableEntry.findMany({
      where,
      include: { class: { include: { grade: true } }, subject: true },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
      skip,
      take: limit,
    }),
    db.timetableEntry.count({ where }),
  ])

  const [classesScheduled, teachersScheduled, roomsInUse] = await Promise.all([
    db.timetableEntry.groupBy({ by: ['classId'], where: { schoolId, isActive: true } }),
    db.timetableEntry.groupBy({ by: ['staffId'], where: { schoolId, isActive: true, staffId: { not: null } } }),
    db.timetableEntry.groupBy({ by: ['room'], where: { schoolId, isActive: true, room: { not: null } } }),
  ])

  const stats = {
    totalPeriods: total,
    classesScheduled: classesScheduled.length,
    teachersScheduled: teachersScheduled.length,
    roomsInUse: roomsInUse.length,
    byDay: [1, 2, 3, 4, 5].map((day) => ({
      day,
      dayName: dayNames[day - 1],
      periods: entries.filter((e) => e.dayOfWeek === day).length,
    })),
  }

  return { data: entries, total, page, totalPages: Math.ceil(total / limit), stats }
}

interface CreateInput {
  classId?: string
  subjectId?: string
  staffId?: string | null
  dayOfWeek?: number
  period?: number
  room?: string | null
  startTime?: string | null
  endTime?: string | null
}

export async function createTimetableEntry(schoolId: string, body: CreateInput) {
  const { classId, subjectId, staffId, dayOfWeek, period, room, startTime, endTime } = body

  if (!classId || !subjectId || dayOfWeek === undefined || period === undefined) {
    throw new AppError('VALIDATION', 'Class, subject, day of week, and period are required')
  }
  if (dayOfWeek < 1 || dayOfWeek > 7) throw new AppError('VALIDATION', 'Day of week must be between 1 (Monday) and 7 (Sunday)')
  if (period < 1 || period > 12) throw new AppError('VALIDATION', 'Period must be between 1 and 12')

  await detectAndThrowConflicts(schoolId, { classId, subjectId, staffId, dayOfWeek, period, room })

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
    include: { class: { include: { grade: true } }, subject: true },
  })

  logAudit({ action: 'CREATE', entity: 'timetable', entityId: entry.id, schoolId, afterValue: entry }).catch(() => {})
  return entry
}

interface UpdateInput {
  classId?: string
  subjectId?: string
  staffId?: string | null
  dayOfWeek?: number
  period?: number
  room?: string | null
  startTime?: string | null
  endTime?: string | null
}

export async function updateTimetableEntry(schoolId: string, id: string, updates: UpdateInput) {
  const existing = await db.timetableEntry.findFirst({ where: { id, schoolId } })
  if (!existing) throw new AppError('NOT_FOUND', 'Timetable entry not found')

  if (updates.dayOfWeek || updates.period || updates.classId || updates.staffId !== undefined || updates.room !== undefined) {
    const newDayOfWeek = updates.dayOfWeek ?? existing.dayOfWeek
    const newPeriod = updates.period ?? existing.period
    const newClassId = updates.classId ?? existing.classId
    const newStaffId = updates.staffId !== undefined ? updates.staffId : existing.staffId
    const newRoom = updates.room !== undefined ? updates.room : existing.room

    await detectAndThrowConflicts(
      schoolId,
      { classId: newClassId, subjectId: updates.subjectId ?? existing.subjectId, staffId: newStaffId, dayOfWeek: newDayOfWeek, period: newPeriod, room: newRoom },
      id,
    )
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
    include: { class: { include: { grade: true } }, subject: true },
  })

  logAudit({ action: 'UPDATE', entity: 'timetable', entityId: entry.id, schoolId, afterValue: entry }).catch(() => {})
  return entry
}

export async function deleteTimetableEntry(schoolId: string, id: string) {
  const owned = await db.timetableEntry.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Timetable entry not found')

  await db.timetableEntry.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'timetable', entityId: id, schoolId }).catch(() => {})
  return { message: 'Timetable entry deleted successfully' }
}

export function handleTimetableError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}

async function detectAndThrowConflicts(
  schoolId: string,
  params: { classId: string; subjectId: string; staffId?: string | null; dayOfWeek: number; period: number; room?: string | null },
  excludeId?: string,
) {
  const { classId, staffId, dayOfWeek, period, room } = params

  const classConflict = await db.timetableEntry.findFirst({
    where: { schoolId, classId, dayOfWeek, period, isActive: true, id: excludeId ? { not: excludeId } : undefined },
    include: { class: { include: { grade: true } }, subject: true },
  })
  if (classConflict) {
    throw new AppError(
      'CONFLICT',
      `Class conflict: This class already has "${classConflict.subject?.name || 'a subject'}" scheduled for ${dayNames[dayOfWeek - 1]} Period ${period}`,
      { conflict: { type: 'CLASS', existingEntry: classConflict } },
    )
  }

  if (staffId) {
    const teacherConflict = await db.timetableEntry.findFirst({
      where: { schoolId, staffId, dayOfWeek, period, isActive: true, id: excludeId ? { not: excludeId } : undefined },
      include: { class: { include: { grade: true } }, subject: true },
    })
    if (teacherConflict) {
      throw new AppError(
        'CONFLICT',
        `Teacher conflict: This teacher is already assigned to "${teacherConflict.subject?.name || 'a subject'}" for ${teacherConflict.class?.name || 'a class'} on ${dayNames[dayOfWeek - 1]} Period ${period}`,
        { conflict: { type: 'TEACHER', existingEntry: teacherConflict } },
      )
    }
  }

  if (room) {
    const roomConflict = await db.timetableEntry.findFirst({
      where: { schoolId, room, dayOfWeek, period, isActive: true, id: excludeId ? { not: excludeId } : undefined },
      include: { class: { include: { grade: true } }, subject: true },
    })
    if (roomConflict) {
      throw new AppError(
        'CONFLICT',
        `Room conflict: Room "${room}" is already occupied by ${roomConflict.class?.name || 'a class'} for "${roomConflict.subject?.name || 'a subject'}" on ${dayNames[dayOfWeek - 1]} Period ${period}`,
        { conflict: { type: 'ROOM', existingEntry: roomConflict } },
      )
    }
  }
}
