import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { notifyStudentGuardian, notifyStudentGuardiansBatch } from '@/lib/notifications'

function absenceDate(d?: string): string {
  return new Date(d ?? Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function GET(request: Request) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || ''
    const classId = searchParams.get('classId') || ''
    const termId = searchParams.get('termId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Always scope to authenticated user's school
    const where: Record<string, unknown> = { student: { schoolId } }

    if (date) {
      const targetDate = new Date(date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      where.date = { gte: targetDate, lt: nextDay }
    }

    if (termId) where.termId = termId
    if (status) where.status = status

    if (classId) {
      where.student = {
        schoolId,
        enrollments: { some: { classId, status: 'ACTIVE' } },
      }
    }

    const [records, total] = await Promise.all([
      db.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              enrollments: {
                where: { status: 'ACTIVE' },
                include: { class: { include: { grade: true } } },
                take: 1,
              },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.attendance.count({ where }),
    ])

    // Summary stats scoped to school
    const allRecords = await db.attendance.findMany({ where })
    const totalRecords = allRecords.length
    const presentCount = allRecords.filter((r) => r.status === 'PRESENT').length
    const absentCount = allRecords.filter((r) => r.status === 'ABSENT').length
    const lateCount = allRecords.filter((r) => r.status === 'LATE').length
    const excusedCount = allRecords.filter((r) => r.status === 'EXCUSED').length

    const summary = {
      total: totalRecords,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      attendanceRate: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0',
    }

    const byClass: Record<string, { present: number; absent: number; late: number; total: number }> = {}
    for (const record of records) {
      const className = record.student?.enrollments?.[0]?.class?.name || 'Unknown'
      if (!byClass[className]) { byClass[className] = { present: 0, absent: 0, late: 0, total: 0 } }
      byClass[className].total++
      if (record.status === 'PRESENT') byClass[className].present++
      else if (record.status === 'ABSENT') byClass[className].absent++
      else if (record.status === 'LATE') byClass[className].late++
    }

    return NextResponse.json({ data: records, total, page, totalPages: Math.ceil(total / limit), summary, byClass })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()

    if (body.records && Array.isArray(body.records)) {
      const records: Array<{ studentId: string; termId: string; date: string; status: string; attendanceType?: string; remarks?: string }> = body.records

      if (records.length === 0) {
        return NextResponse.json({ error: 'Records array is required' }, { status: 400 })
      }

      // Tenant guard: every referenced student must belong to the caller's school.
      const schoolId = authResult.session.user.schoolId
      const validStudents = await db.student.findMany({
        where: { id: { in: records.map((r) => r.studentId) }, schoolId },
        select: { id: true },
      })
      const validIds = new Set(validStudents.map((s) => s.id))
      if (records.some((r) => !validIds.has(r.studentId))) {
        return NextResponse.json({ error: 'One or more students do not belong to your school' }, { status: 403 })
      }

      const created = await db.attendance.createMany({
        data: records.map((record) => ({
          studentId: record.studentId,
          termId: record.termId,
          date: new Date(record.date),
          attendanceType: record.attendanceType || 'DAILY',
          status: record.status || 'PRESENT',
          remarks: record.remarks,
        })),
        skipDuplicates: true,
      })

      // Notify guardians of absentees — batched (one context + one guardian query),
      // fire-and-forget so it never blocks the response.
      void notifyStudentGuardiansBatch(
        schoolId,
        records
          .filter((r) => r.status === 'ABSENT')
          .map((r) => ({
            studentId: r.studentId,
            eventFactory: (studentName: string) => ({ type: 'attendance.absent' as const, studentName, date: absenceDate(r.date) }),
          })),
      ).catch(() => {})

      return NextResponse.json({ message: `${created.count} attendance records created`, count: created.count }, { status: 201 })
    }

    // Tenant guard: the student must belong to the caller's school.
    const owned = await db.student.findFirst({
      where: { id: body.studentId, schoolId: authResult.session.user.schoolId },
      select: { id: true },
    })
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const record = await db.attendance.create({
      data: {
        studentId: body.studentId,
        termId: body.termId,
        date: body.date ? new Date(body.date) : new Date(),
        attendanceType: body.attendanceType || 'DAILY',
        status: body.status || 'PRESENT',
        remarks: body.remarks,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
    })

    logAudit({ action: 'CREATE', entity: 'attendance', entityId: record.id, afterValue: record }).catch(() => {})

    if ((body.status || 'PRESENT') === 'ABSENT') {
      void notifyStudentGuardian(authResult.session.user.schoolId, body.studentId, (studentName) => ({
        type: 'attendance.absent',
        studentName,
        date: absenceDate(body.date),
      })).catch(() => {})
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Attendance record ID is required' }, { status: 400 })

    // Verify record belongs to a student in the caller's school
    const existing = await db.attendance.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || !existing.student || existing.student.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    const record = await db.attendance.update({
      where: { id },
      data: { status: updates.status, remarks: updates.remarks, attendanceType: updates.attendanceType },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
    })

    logAudit({ action: 'UPDATE', entity: 'attendance', entityId: record.id, afterValue: record }).catch(() => {})
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Attendance record ID is required' }, { status: 400 })

    // Verify record belongs to a student in the caller's school
    const existing = await db.attendance.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || !existing.student || existing.student.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    await db.attendance.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'attendance', entityId: id }).catch(() => {})
    return NextResponse.json({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json({ error: 'Failed to delete attendance' }, { status: 500 })
  }
}
