import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
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
        totalCovered: totalCoveredAgg._sum.coveredAmount || 0,
        totalOutstanding: totalOutstandingAgg._sum.outstandingBalance || 0,
      }

      return NextResponse.json({ data: beamApplications, total: beamTotal, page, totalPages: Math.ceil(beamTotal / limit), stats: beamStats })
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
      totalBeamCovered: totalBeamCoveredAgg._sum.coveredAmount || 0,
    }

    const categoryBreakdown = await db.welfareRecord.groupBy({
      by: ['category'],
      where: schoolWelfareFilter,
      _count: { id: true },
    })

    return NextResponse.json({
      data: welfareRecords,
      total: welfareTotal,
      page,
      totalPages: Math.ceil(welfareTotal / limit),
      beamApplications,
      stats,
      categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category, count: c._count.id })),
    })
  } catch (error) {
    console.error('Failed to fetch welfare data:', error)
    return NextResponse.json({ error: 'Failed to fetch welfare data' }, { status: 500 })
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
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
      }

      // Verify student belongs to caller's school
      const student = await db.student.findUnique({ where: { id: studentId, schoolId: session.user.schoolId }, select: { id: true } })
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

      const existing = await db.beamApplication.findUnique({ where: { studentId } })
      if (existing) {
        return NextResponse.json({ error: 'Student already has a BEAM application' }, { status: 400 })
      }

      const beamApplication = await db.beamApplication.create({
        data: {
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
      return NextResponse.json(beamApplication, { status: 201 })
    }

    const { studentId, category, description, actionTaken, referredTo, isConfidential } = body
    if (!studentId || !category) {
      return NextResponse.json({ error: 'Student ID and category are required' }, { status: 400 })
    }

    // Verify student belongs to caller's school
    const student = await db.student.findUnique({ where: { id: studentId, schoolId: session.user.schoolId }, select: { id: true } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const welfareRecord = await db.welfareRecord.create({
      data: {
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

    return NextResponse.json(welfareRecord, { status: 201 })
  } catch (error) {
    console.error('Failed to create welfare record:', error)
    return NextResponse.json({ error: 'Failed to create welfare record' }, { status: 500 })
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
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    if (type === 'beam') {
      // Verify ownership
      const existing = await db.beamApplication.findUnique({
        where: { id },
        select: { student: { select: { schoolId: true } } },
      })
      if (!existing || existing.student.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
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

      return NextResponse.json(record)
    }

    // Verify welfare record ownership
    const existing = await db.welfareRecord.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
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

    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to update welfare record:', error)
    return NextResponse.json({ error: 'Failed to update welfare record' }, { status: 500 })
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
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    if (type === 'beam') {
      const existing = await db.beamApplication.findUnique({
        where: { id },
        select: { student: { select: { schoolId: true } } },
      })
      if (!existing || existing.student.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }
      await db.beamApplication.delete({ where: { id } })
    } else {
      const existing = await db.welfareRecord.findUnique({
        where: { id },
        select: { student: { select: { schoolId: true } } },
      })
      if (!existing || existing.student.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }
      await db.welfareRecord.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Failed to delete welfare record:', error)
    return NextResponse.json({ error: 'Failed to delete welfare record' }, { status: 500 })
  }
}
