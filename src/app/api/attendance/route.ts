import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { AppError, isAppError } from '@/lib/errors'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import {
  bulkCreateAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  type AttendanceRecordInput,
  type AttendanceUpdateInput,
} from '@/server/services/attendance'

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

    return ok({ records, total, page, totalPages: Math.ceil(total / limit), summary, byClass })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching attendance')
    return fail('INTERNAL', 'Failed to fetch attendance')
  }
}

export async function POST(request: Request) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error

  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  try {
    const body: { records?: AttendanceRecordInput[] } & AttendanceRecordInput = await request.json()

    if (body.records && Array.isArray(body.records)) {
      const { count, message } = await bulkCreateAttendance(tenant.schoolId, auth.session.user.id, body.records)
      return NextResponse.json({ message, count }, { status: 201 })
    }

    const record = await createAttendance(tenant.schoolId, auth.session.user.id, body)
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (isAppError(error)) return fail(error.code, error.message)
    logger.error({ err: error }, 'Error recording attendance')
    return fail('INTERNAL', 'Failed to record attendance')
  }
}

export async function PUT(request: Request) {
  const auth = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in auth) return auth.error

  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  try {
    const body = (await request.json()) as { id: string } & AttendanceUpdateInput
    const { id, ...updates } = body

    const record = await updateAttendance(tenant.schoolId, auth.session.user.id, id, updates)
    return NextResponse.json(record)
  } catch (error) {
    if (isAppError(error)) return fail(error.code, error.message)
    logger.error({ err: error }, 'Error updating attendance')
    return fail('INTERNAL', 'Failed to update attendance')
  }
}

export async function DELETE(request: Request) {
  const auth = await validateRole(['ADMIN'])
  if ('error' in auth) return auth.error

  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''

    const message = await deleteAttendance(tenant.schoolId, auth.session.user.id, id)
    return NextResponse.json({ message })
  } catch (error) {
    if (isAppError(error)) return fail(error.code, error.message)
    logger.error({ err: error }, 'Error deleting attendance')
    return fail('INTERNAL', 'Failed to delete attendance')
  }
}
