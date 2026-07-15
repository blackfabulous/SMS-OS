import 'server-only'
import { db } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { logAudit } from '@/lib/audit'
import { notifyStudentGuardian, notifyStudentGuardiansBatch } from '@/lib/notifications'
import type { AttendanceStatus, AttendanceType } from '@prisma/client'

export interface AttendanceRecordInput {
  studentId: string
  termId: string
  date?: string
  status?: string
  attendanceType?: string
  remarks?: string
}

export interface AttendanceUpdateInput {
  status?: string
  remarks?: string
  attendanceType?: string
}

function absenceDate(d?: string): string {
  return new Date(d ?? Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toStatus(value?: string): AttendanceStatus {
  if (!value) return 'PRESENT'
  const upper = value.toUpperCase()
  if (['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(upper)) {
    return upper as AttendanceStatus
  }
  return 'PRESENT'
}

function toType(value?: string): AttendanceType {
  if (!value) return 'DAILY'
  const upper = value.toUpperCase()
  if (['DAILY', 'CLASS', 'EXAM', 'ACTIVITY'].includes(upper)) {
    return upper as AttendanceType
  }
  return 'DAILY'
}

function parseDate(value?: string): Date {
  if (!value) return new Date()
  const d = new Date(value)
  if (isNaN(d.getTime())) throw new AppError('VALIDATION', `Invalid date: ${value}`)
  return d
}

export async function bulkCreateAttendance(
  schoolId: string,
  actorId: string,
  records: AttendanceRecordInput[],
): Promise<{ count: number; message: string }> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new AppError('VALIDATION', 'Records array is required')
  }

  const validStudents = await db.student.findMany({
    where: { id: { in: records.map((r) => r.studentId) }, schoolId },
    select: { id: true },
  })
  const validIds = new Set(validStudents.map((s) => s.id))
  if (records.some((r) => !validIds.has(r.studentId))) {
    throw new AppError('FORBIDDEN', 'One or more students do not belong to your school')
  }

  const created = await db.attendance.createMany({
    data: records.map((record) => ({
      schoolId,
      studentId: record.studentId,
      termId: record.termId,
      date: parseDate(record.date),
      attendanceType: toType(record.attendanceType),
      status: toStatus(record.status),
      remarks: record.remarks,
    })),
    skipDuplicates: true,
  })

  void notifyStudentGuardiansBatch(
    schoolId,
    records
      .filter((r) => toStatus(r.status) === 'ABSENT')
      .map((r) => ({
        studentId: r.studentId,
        eventFactory: (studentName: string) => ({
          type: 'attendance.absent' as const,
          studentName,
          date: absenceDate(r.date),
        }),
      })),
  ).catch(() => {})

  logAudit({
    action: 'CREATE',
    entity: 'attendance',
    entityId: actorId,
    schoolId,
    afterValue: { count: created.count },
  }).catch(() => {})

  return { count: created.count, message: `${created.count} attendance records created` }
}

export async function createAttendance(
  schoolId: string,
  actorId: string,
  body: AttendanceRecordInput,
): Promise<unknown> {
  const owned = await db.student.findFirst({
    where: { id: body.studentId, schoolId },
    select: { id: true, firstName: true, lastName: true, studentNumber: true },
  })
  if (!owned) throw new AppError('NOT_FOUND', 'Student not found')

  const record = await db.attendance.create({
    data: {
      schoolId,
      studentId: body.studentId,
      termId: body.termId,
      date: parseDate(body.date),
      attendanceType: toType(body.attendanceType),
      status: toStatus(body.status),
      remarks: body.remarks,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
    },
  })

  logAudit({
    action: 'CREATE',
    entity: 'attendance',
    entityId: record.id,
    schoolId,
    afterValue: record,
  }).catch(() => {})

  if (toStatus(body.status) === 'ABSENT') {
    void notifyStudentGuardian(schoolId, body.studentId, (studentName) => ({
      type: 'attendance.absent',
      studentName,
      date: absenceDate(body.date),
    })).catch(() => {})
  }

  return record
}

export async function updateAttendance(
  schoolId: string,
  actorId: string,
  id: string,
  updates: AttendanceUpdateInput,
): Promise<unknown> {
  if (!id) throw new AppError('VALIDATION', 'Attendance record ID is required')

  const existing = await db.attendance.findUnique({
    where: { id },
    select: { student: { select: { schoolId: true } } },
  })
  if (!existing?.student || existing.student.schoolId !== schoolId) {
    throw new AppError('NOT_FOUND', 'Attendance record not found')
  }

  const data: Record<string, unknown> = {}
  if (updates.status) data.status = toStatus(updates.status)
  if (updates.remarks !== undefined) data.remarks = updates.remarks
  if (updates.attendanceType) data.attendanceType = toType(updates.attendanceType)

  const record = await db.attendance.update({
    where: { id },
    data,
    include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
  })

  logAudit({
    action: 'UPDATE',
    entity: 'attendance',
    entityId: record.id,
    schoolId,
    afterValue: record,
  }).catch(() => {})

  return record
}

export async function deleteAttendance(schoolId: string, actorId: string, id: string): Promise<string> {
  if (!id) throw new AppError('VALIDATION', 'Attendance record ID is required')

  const existing = await db.attendance.findUnique({
    where: { id },
    select: { student: { select: { schoolId: true } } },
  })
  if (!existing?.student || existing.student.schoolId !== schoolId) {
    throw new AppError('NOT_FOUND', 'Attendance record not found')
  }

  await db.attendance.delete({ where: { id } })

  logAudit({
    action: 'DELETE',
    entity: 'attendance',
    entityId: id,
    schoolId,
  }).catch(() => {})

  return 'Attendance record deleted successfully'
}
