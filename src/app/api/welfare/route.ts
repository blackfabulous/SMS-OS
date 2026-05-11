import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/welfare — List welfare records and BEAM applications
// Query params: type (welfare|beam), search, status, category, page, limit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // If type=beam, return only BEAM applications
    if (type === 'beam') {
      const beamWhere: Record<string, unknown> = {}
      if (status) beamWhere.status = status
      if (search) {
        beamWhere.student = {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { studentNumber: { contains: search } },
          ],
        }
      }

      const [beamApplications, beamTotal] = await Promise.all([
        db.beamApplication.findMany({
          where: beamWhere,
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true, gender: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.beamApplication.count({ where: beamWhere }),
      ])

      const beamStats = {
        total: beamTotal,
        applied: await db.beamApplication.count({ where: { status: 'APPLIED' } }),
        approved: await db.beamApplication.count({ where: { status: 'APPROVED' } }),
        rejected: await db.beamApplication.count({ where: { status: 'REJECTED' } }),
        totalCovered: (await db.beamApplication.aggregate({ _sum: { coveredAmount: true } }))._sum.coveredAmount || 0,
        totalOutstanding: (await db.beamApplication.aggregate({ _sum: { outstandingBalance: true } }))._sum.outstandingBalance || 0,
      }

      return NextResponse.json({
        data: beamApplications,
        total: beamTotal,
        page,
        totalPages: Math.ceil(beamTotal / limit),
        stats: beamStats,
      })
    }

    // Default: return welfare records + BEAM summary
    const welfareWhere: Record<string, unknown> = {}
    if (status) welfareWhere.status = status
    if (category) welfareWhere.category = category
    if (search) {
      welfareWhere.student = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { studentNumber: { contains: search } },
        ],
      }
    }

    const [welfareRecords, welfareTotal] = await Promise.all([
      db.welfareRecord.findMany({
        where: welfareWhere,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true, gender: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.welfareRecord.count({ where: welfareWhere }),
    ])

    // BEAM applications summary
    const beamApplications = await db.beamApplication.findMany({
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Comprehensive stats
    const stats = {
      totalWelfareCases: welfareTotal,
      openCases: await db.welfareRecord.count({ where: { status: 'OPEN' } }),
      inProgressCases: await db.welfareRecord.count({ where: { status: 'IN_PROGRESS' } }),
      closedCases: await db.welfareRecord.count({ where: { status: 'CLOSED' } }),
      confidentialCases: await db.welfareRecord.count({ where: { isConfidential: true } }),
      beamApplied: await db.beamApplication.count({ where: { status: 'APPLIED' } }),
      beamApproved: await db.beamApplication.count({ where: { status: 'APPROVED' } }),
      beamRejected: await db.beamApplication.count({ where: { status: 'REJECTED' } }),
      totalBeamCovered: (await db.beamApplication.aggregate({ _sum: { coveredAmount: true } }))._sum.coveredAmount || 0,
    }

    // Category breakdown
    const categoryBreakdown = await db.welfareRecord.groupBy({
      by: ['category'],
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

// POST /api/welfare — Create welfare record or BEAM application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === 'beam') {
      const { studentId, guardianSituation, orphanStatus, notes, coveredAmount, outstandingBalance, socialWelfareRef } = body
      if (!studentId) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
      }

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

    // Default: add welfare record
    const { studentId, category, description, actionTaken, referredTo, isConfidential } = body
    if (!studentId || !category) {
      return NextResponse.json({ error: 'Student ID and category are required' }, { status: 400 })
    }

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

// PUT /api/welfare — Update welfare record or BEAM application
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    if (type === 'beam') {
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
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } },
        },
      })

      if (updates.status && record.student) {
        await db.student.update({ where: { id: record.student.id }, data: { beamStatus: updates.status } })
      }

      return NextResponse.json(record)
    }

    // Default: update welfare record
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
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to update welfare record:', error)
    return NextResponse.json({ error: 'Failed to update welfare record' }, { status: 500 })
  }
}

// DELETE /api/welfare?id=xxx&type=welfare|beam
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    if (type === 'beam') {
      await db.beamApplication.delete({ where: { id } })
    } else {
      await db.welfareRecord.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Failed to delete welfare record:', error)
    return NextResponse.json({ error: 'Failed to delete welfare record' }, { status: 500 })
  }
}
