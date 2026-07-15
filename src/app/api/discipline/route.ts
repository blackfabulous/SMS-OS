import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const incidentType = searchParams.get('incidentType') || ''
    const studentId = searchParams.get('studentId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { student: { schoolId } }
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
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { studentNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [records, total] = await Promise.all([
      db.disciplineRecord.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true, enrollmentStatus: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.disciplineRecord.count({ where }),
    ])

    // Stats scoped to this school
    const schoolFilter = { student: { schoolId } }
    const [open, resolved, closed, totalMeritAgg, totalDemeritAgg, parentNotifiedCount] = await Promise.all([
      db.disciplineRecord.count({ where: { ...schoolFilter, status: 'OPEN' } }),
      db.disciplineRecord.count({ where: { ...schoolFilter, status: 'RESOLVED' } }),
      db.disciplineRecord.count({ where: { ...schoolFilter, status: 'CLOSED' } }),
      db.disciplineRecord.aggregate({ where: schoolFilter, _sum: { meritPoints: true } }),
      db.disciplineRecord.aggregate({ where: schoolFilter, _sum: { demeritPoints: true } }),
      db.disciplineRecord.count({ where: { ...schoolFilter, parentNotified: true } }),
    ])

    const stats = {
      total,
      open,
      resolved,
      closed,
      totalMerit: totalMeritAgg._sum.meritPoints || 0,
      totalDemerit: totalDemeritAgg._sum.demeritPoints || 0,
      parentNotifiedCount,
    }

    const incidentTypeBreakdown = await db.disciplineRecord.groupBy({
      by: ['incidentType'],
      where: schoolFilter,
      _count: { id: true },
    })

    return ok({
      data: records, total, page, totalPages: Math.ceil(total / limit), stats,
      incidentTypeBreakdown: incidentTypeBreakdown.map((i) => ({ type: i.incidentType, count: i._count.id })),
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch discipline records')
    return fail('INTERNAL', 'Failed to fetch discipline records')
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { studentId, incidentType, description, date, action, meritPoints, demeritPoints, parentNotified } = body

    if (!studentId || !incidentType || !description) {
      return fail('VALIDATION', 'Student ID, incident type, and description are required')
    }

    // Verify student belongs to caller's school
    const student = await db.student.findUnique({ where: { id: studentId, schoolId: session.user.schoolId }, select: { id: true } })
    if (!student) return fail('NOT_FOUND', 'Student not found')

    const record = await db.disciplineRecord.create({
      data: {
        schoolId: session.user.schoolId,
        studentId, incidentType, description,
        date: date ? new Date(date) : new Date(),
        action: action || null,
        meritPoints: meritPoints || 0,
        demeritPoints: demeritPoints || 0,
        parentNotified: parentNotified || false,
        status: 'OPEN',
      },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
    })

    return ok(record, 201)
  } catch (error) {
    logger.error({ err: error }, 'Failed to create discipline record')
    return fail('INTERNAL', 'Failed to create discipline record')
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return fail('VALIDATION', 'Record ID is required')

    // Verify record belongs to a student in caller's school
    const existing = await db.disciplineRecord.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return fail('NOT_FOUND', 'Record not found')
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
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
    })

    return ok(record)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update discipline record')
    return fail('INTERNAL', 'Failed to update discipline record')
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return fail('VALIDATION', 'Record ID is required')

    // Verify record belongs to a student in caller's school
    const existing = await db.disciplineRecord.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return fail('NOT_FOUND', 'Record not found')
    }

    await db.disciplineRecord.delete({ where: { id } })
    return ok({ message: 'Discipline record deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete discipline record')
    return fail('INTERNAL', 'Failed to delete discipline record')
  }
}
