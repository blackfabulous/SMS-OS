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
    const visitType = searchParams.get('visitType') || ''
    const studentId = searchParams.get('studentId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { student: { schoolId } }
    if (visitType) where.visitType = visitType
    if (studentId) where.studentId = studentId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.visitDate = dateFilter
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { treatment: { contains: search, mode: 'insensitive' } },
        { medicationGiven: { contains: search, mode: 'insensitive' } },
        { referredTo: { contains: search, mode: 'insensitive' } },
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { studentNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [records, total] = await Promise.all([
      db.healthRecord.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              gender: true,
              allergies: true,
              chronicConditions: true,
              medications: true,
              bloodGroup: true,
              doctorName: true,
              doctorPhone: true,
              enrollmentStatus: true,
            },
          },
        },
        orderBy: { visitDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.healthRecord.count({ where }),
    ])

    // Stats — scoped to this school only
    const schoolFilter = { student: { schoolId } }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalRecords, visitTypeStats, confidentialCount, referralsCount, todayVisits, studentsWithChronicConditions, studentsWithAllergies] =
      await Promise.all([
        db.healthRecord.count({ where: schoolFilter }),
        db.healthRecord.groupBy({ by: ['visitType'], where: schoolFilter, _count: { id: true } }),
        db.healthRecord.count({ where: { ...schoolFilter, isConfidential: true } }),
        db.healthRecord.count({ where: { ...schoolFilter, referredTo: { not: null } } }),
        db.healthRecord.count({ where: { ...schoolFilter, visitDate: { gte: today } } }),
        db.student.count({ where: { schoolId, chronicConditions: { not: null } } }),
        db.student.count({ where: { schoolId, allergies: { not: null } } }),
      ])

    return ok({
      data: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: { totalRecords, todayVisits, confidentialCount, referralsCount, studentsWithChronicConditions, studentsWithAllergies },
      visitTypeBreakdown: visitTypeStats.map((v) => ({ type: v.visitType, count: v._count.id })),
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch health records')
    return fail('INTERNAL', 'Failed to fetch health records')
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { studentId, visitType, description, treatment, medicationGiven, referredTo, isConfidential, visitDate } = body

    if (!studentId || !visitType || !description) {
      return fail('VALIDATION', 'Student ID, visit type, and description are required')
    }

    // Verify student belongs to caller's school
    const student = await db.student.findUnique({
      where: { id: studentId, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!student) {
      return fail('NOT_FOUND', 'Student not found')
    }

    const record = await db.healthRecord.create({
      data: {
        schoolId: session.user.schoolId,
        studentId,
        visitType,
        description,
        treatment: treatment || null,
        medicationGiven: medicationGiven || null,
        referredTo: referredTo || null,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        isConfidential: isConfidential !== undefined ? isConfidential : true,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true, allergies: true, chronicConditions: true, bloodGroup: true },
        },
      },
    })

    return ok(record, 201)
  } catch (error) {
    logger.error({ err: error }, 'Failed to create health record')
    return fail('INTERNAL', 'Failed to create health record')
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return fail('VALIDATION', 'Record ID is required')
    }

    // Verify the health record belongs to a student in the caller's school
    const existing = await db.healthRecord.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return fail('NOT_FOUND', 'Record not found')
    }

    const record = await db.healthRecord.update({
      where: { id },
      data: {
        visitType: updates.visitType,
        description: updates.description,
        treatment: updates.treatment,
        medicationGiven: updates.medicationGiven,
        referredTo: updates.referredTo,
        isConfidential: updates.isConfidential,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
    })

    return ok(record)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update health record')
    return fail('INTERNAL', 'Failed to update health record')
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return fail('VALIDATION', 'Record ID is required')
    }

    // Verify the health record belongs to a student in the caller's school
    const existing = await db.healthRecord.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return fail('NOT_FOUND', 'Record not found')
    }

    await db.healthRecord.delete({ where: { id } })
    return ok({ message: 'Health record deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete health record')
    return fail('INTERNAL', 'Failed to delete health record')
  }
}
