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
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const schoolStudentFilter = { schoolId }

    if (type === 'beam') {
      const beamWhere: Record<string, unknown> = {}
      if (status) beamWhere.status = status
      if (search) {
        beamWhere.student = {
          schoolId,
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { studentNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      } else {
        beamWhere.student = { schoolId }
      }

      const [beamApplications, beamTotal] = await Promise.all([
        db.beamApplication.findMany({
          where: beamWhere,
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true, gender: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.beamApplication.count({ where: beamWhere }),
      ])

      // Stats scoped to this school
      const schoolBeamFilter = { student: schoolStudentFilter }
      const [applied, approved, rejected, totalCoveredAgg, totalOutstandingAgg] = await Promise.all([
        db.beamApplication.count({ where: { ...schoolBeamFilter, status: 'APPLIED' } }),
        db.beamApplication.count({ where: { ...schoolBeamFilter, status: 'APPROVED' } }),
        db.beamApplication.count({ where: { ...schoolBeamFilter, status: 'REJECTED' } }),
        db.beamApplication.aggregate({ where: schoolBeamFilter, _sum: { coveredAmount: true } }),
        db.beamApplication.aggregate({ where: schoolBeamFilter, _sum: { outstandingBalance: true } }),
      ])

      const beamStats = {
        total: beamTotal,
        applied,
        approved,
        rejected,
        totalCovered: Number(totalCoveredAgg._sum.coveredAmount ?? 0),
        totalOutstanding: Number(totalOutstandingAgg._sum.outstandingBalance ?? 0),
      }

      return ok({ data: beamApplications, total: beamTotal, page, totalPages: Math.ceil(beamTotal / limit), stats: beamStats })
    }

    // Default: welfare records
    const welfareWhere: Record<string, unknown> = {}
    if (status) welfareWhere.status = status
    if (category) welfareWhere.category = category
    if (search) {
      welfareWhere.student = {
        schoolId,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { studentNumber: { contains: search, mode: 'insensitive' } },
        ],
      }
    } else {
      welfareWhere.student = { schoolId }
    }

    const schoolWelfareFilter = { student: schoolStudentFilter }

    const [welfareRecords, welfareTotal] = await Promise.all([
      db.welfareRecord.findMany({
        where: welfareWhere,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true, gender: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.welfareRecord.count({ where: welfareWhere }),
    ])

    const beamApplications = await db.beamApplication.findMany({
      where: { student: { schoolId } },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const schoolBeamFilter = { student: schoolStudentFilter }

    const [openCases, inProgressCases, closedCases, confidentialCases, beamApplied, beamApproved, beamRejected, totalBeamCoveredAgg] =
      await Promise.all([
        db.welfareRecord.count({ where: { ...schoolWelfareFilter, status: 'OPEN' } }),
        db.welfareRecord.count({ where: { ...schoolWelfareFilter, status: 'IN_PROGRESS' } }),
        db.welfareRecord.count({ where: { ...schoolWelfareFilter, status: 'CLOSED' } }),
        db.welfareRecord.count({ where: { ...schoolWelfareFilter, isConfidential: true } }),
        db.beamApplication.count({ where: { ...schoolBeamFilter, status: 'APPLIED' } }),
        db.beamApplication.count({ where: { ...schoolBeamFilter, status: 'APPROVED' } }),
        db.beamApplication.count({ where: { ...schoolBeamFilter, status: 'REJECTED' } }),
        db.beamApplication.aggregate({ where: schoolBeamFilter, _sum: { coveredAmount: true } }),
      ])

    const stats = {
      totalWelfareCases: welfareTotal,
      openCases,
      inProgressCases,
      closedCases,
      confidentialCases,
      beamApplied,
      beamApproved,
      beamRejected,
      totalBeamCovered: Number(totalBeamCoveredAgg._sum.coveredAmount ?? 0),
    }

    const categoryBreakdown = await db.welfareRecord.groupBy({
      by: ['category'],
      where: schoolWelfareFilter,
      _count: { id: true },
    })

    return ok({
      data: welfareRecords,
      total: welfareTotal,
      page,
      totalPages: Math.ceil(welfareTotal / limit),
      beamApplications,
      stats,
      categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category, count: c._count.id })),
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch welfare data')
    return fail('INTERNAL', 'Failed to fetch welfare data')
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { type } = body

    if (type === 'beam') {
      const { studentId, guardianSituation, orphanStatus, notes, coveredAmount, outstandingBalance, socialWelfareRef } = body
      if (!studentId) {
        return fail('VALIDATION', 'Student ID is required')
      }

      // Verify student belongs to caller's school
      const student = await db.student.findUnique({ where: { id: studentId, schoolId: session.user.schoolId }, select: { id: true } })
      if (!student) return fail('NOT_FOUND', 'Student not found')

      const existing = await db.beamApplication.findUnique({ where: { studentId } })
      if (existing) {
        return fail('CONFLICT', 'Student already has a BEAM application')
      }

      const beamApplication = await db.beamApplication.create({
        data: {
          schoolId: session.user.schoolId,
          studentId,
          guardianSituation: guardianSituation || null,
          orphanStatus: orphanStatus || null,
          notes: notes || null,
          coveredAmount: coveredAmount || 0,
          outstandingBalance: outstandingBalance || 0,
          socialWelfareRef: socialWelfareRef || null,
          status: 'APPLIED',
        },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } },
        },
      })

      await db.student.update({ where: { id: studentId }, data: { beamStatus: 'APPLIED' } })
      return ok(beamApplication, 201)
    }

    const { studentId, category, description, actionTaken, referredTo, isConfidential } = body
    if (!studentId || !category) {
      return fail('VALIDATION', 'Student ID and category are required')
    }

    // Verify student belongs to caller's school
    const student = await db.student.findUnique({ where: { id: studentId, schoolId: session.user.schoolId }, select: { id: true } })
    if (!student) return fail('NOT_FOUND', 'Student not found')

    const welfareRecord = await db.welfareRecord.create({
      data: {
        schoolId: session.user.schoolId,
        studentId,
        category,
        description: description || null,
        actionTaken: actionTaken || null,
        referredTo: referredTo || null,
        isConfidential: isConfidential !== undefined ? isConfidential : true,
        status: 'OPEN',
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } },
      },
    })

    return ok(welfareRecord, 201)
  } catch (error) {
    logger.error({ err: error }, 'Failed to create welfare record')
    return fail('INTERNAL', 'Failed to create welfare record')
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { type, id, ...updates } = body

    if (!id) {
      return fail('VALIDATION', 'Record ID is required')
    }

    if (type === 'beam') {
      // Verify ownership
      const existing = await db.beamApplication.findUnique({
        where: { id },
        select: { student: { select: { schoolId: true } } },
      })
      if (!existing || existing.student.schoolId !== session.user.schoolId) {
        return fail('NOT_FOUND', 'Record not found')
      }

      const record = await db.beamApplication.update({
        where: { id },
        data: {
          status: updates.status,
          coveredAmount: updates.coveredAmount,
          outstandingBalance: updates.outstandingBalance,
          notes: updates.notes,
          socialWelfareRef: updates.socialWelfareRef,
          guardianSituation: updates.guardianSituation,
          orphanStatus: updates.orphanStatus,
        },
        include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } } },
      })

      if (updates.status && record.student) {
        await db.student.update({ where: { id: record.student.id }, data: { beamStatus: updates.status } })
      }

      return ok(record)
    }

    // Verify welfare record ownership
    const existing = await db.welfareRecord.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return fail('NOT_FOUND', 'Record not found')
    }

    const record = await db.welfareRecord.update({
      where: { id },
      data: {
        category: updates.category,
        description: updates.description,
        actionTaken: updates.actionTaken,
        referredTo: updates.referredTo,
        status: updates.status,
        isConfidential: updates.isConfidential,
      },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
    })

    return ok(record)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update welfare record')
    return fail('INTERNAL', 'Failed to update welfare record')
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return fail('VALIDATION', 'Record ID is required')
    }

    if (type === 'beam') {
      const existing = await db.beamApplication.findUnique({
        where: { id },
        select: { student: { select: { schoolId: true } } },
      })
      if (!existing || existing.student.schoolId !== session.user.schoolId) {
        return fail('NOT_FOUND', 'Record not found')
      }
      await db.beamApplication.delete({ where: { id } })
    } else {
      const existing = await db.welfareRecord.findUnique({
        where: { id },
        select: { student: { select: { schoolId: true } } },
      })
      if (!existing || existing.student.schoolId !== session.user.schoolId) {
        return fail('NOT_FOUND', 'Record not found')
      }
      await db.welfareRecord.delete({ where: { id } })
    }

    return ok({ message: 'Record deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete welfare record')
    return fail('INTERNAL', 'Failed to delete welfare record')
  }
}
