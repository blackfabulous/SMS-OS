import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { notifyStudentGuardiansBatch } from '@/lib/notifications'
import type { AttendanceStatus, AttendanceType } from '@prisma/client'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error
  const { schoolId } = tenant

  try {
    const body = await request.json()
    const { classId, date, records } = body

    if (!classId || !date || !records || !Array.isArray(records)) {
      return fail('VALIDATION', 'classId, date, and records array are required')
    }

    if (records.length === 0) {
      return fail('VALIDATION', 'Records array cannot be empty')
    }

    // Validate each record has required fields
    for (let i = 0; i < records.length; i++) {
      if (!records[i].studentId || !records[i].status) {
        return fail('VALIDATION', `Record at index ${i} is missing studentId or status`)
      }
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK']
      if (!validStatuses.includes(records[i].status)) {
        return fail('VALIDATION', `Invalid status '${records[i].status}' at index ${i}. Valid: ${validStatuses.join(', ')}`)
      }
    }

    // Validate class exists AND belongs to the caller's school (tenant guard).
    const classData = await db.class.findFirst({
      where: { id: classId, schoolId },
      include: { grade: true },
    })
    if (!classData) {
      return fail('VALIDATION', 'Invalid class ID')
    }

    // Tenant guard: restrict processing to students that belong to this school.
    const ownedStudents = await db.student.findMany({
      where: { id: { in: records.map((r: { studentId: string }) => r.studentId) }, schoolId },
      select: { id: true },
    })
    const ownedIds = new Set(ownedStudents.map((s) => s.id))

    // Determine the term - find the term that contains the given date
    const attendanceDate = new Date(date)
    let term = await db.term.findFirst({
      where: {
        startDate: { lte: attendanceDate },
        endDate: { gte: attendanceDate },
      },
    })

    if (!term) {
      // Fallback to current term
      term = await db.term.findFirst({
        where: { isCurrent: true },
      })
    }

    if (!term) {
      return fail('VALIDATION', 'No term found for the given date')
    }

    // Reset date time to start of day for consistent comparison
    const dateOnly = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate())

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (const record of records) {
      try {
        // Skip students that don't belong to this school (tenant guard).
        if (!ownedIds.has(record.studentId)) {
          errors.push(`Student ${record.studentId} does not belong to your school`)
          continue
        }
        // Check if attendance record already exists for this student on this date in this term
        const existing = await db.attendance.findFirst({
          where: {
            studentId: record.studentId,
            date: dateOnly,
            termId: term.id,
          },
        })

        if (existing) {
          // Update existing record (upsert behavior)
          await db.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              remarks: record.remarks ?? existing.remarks,
            },
          })
          updated++
        } else {
          // Create new record
          await db.attendance.create({
            data: {
              schoolId,
              studentId: record.studentId,
              termId: term.id,
              date: dateOnly,
              status: record.status as AttendanceStatus,
              remarks: record.remarks || null,
              attendanceType: 'DAILY' as AttendanceType,
            },
          })
          created++
        }
      } catch {
        errors.push(`Failed to process attendance for student ${record.studentId}`)
      }
    }

    // Notify guardians of (owned) absentees — batched (one context + one guardian
    // query, no N+1) and fire-and-forget so it never blocks the response.
    const absenceLabel = dateOnly.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    void notifyStudentGuardiansBatch(
      schoolId,
      records
        .filter((r: { status?: string; studentId: string }) => r.status === 'ABSENT' && ownedIds.has(r.studentId))
        .map((r: { studentId: string }) => ({
          studentId: r.studentId,
          eventFactory: (studentName: string) => ({ type: 'attendance.absent' as const, studentName, date: absenceLabel }),
        })),
    ).catch(() => {})

    // Log audit entry
    logAudit({
      action: 'BULK_ATTENDANCE',
      entity: 'Attendance',
      schoolId,
      details: `Recorded attendance for ${created + updated} students in ${classData.name} on ${dateOnly.toISOString().split('T')[0]}`,
    }).catch(() => {})

    return ok({
      created,
      updated,
      createdCount: created,
      updatedCount: updated,
      success: true,
      errors: errors.length > 0 ? errors : [],
      message: `${created + updated} attendance record${created + updated !== 1 ? 's' : ''} processed (${created} new, ${updated} updated)`,
    })
  } catch (error) {
    logger.error({ err: error }, 'Bulk attendance error')
    return fail('INTERNAL', 'Failed to process bulk attendance')
  }
}
