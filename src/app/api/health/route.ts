import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/health — List health records with student details
// Query params: search, visitType, studentId, dateFrom, dateTo, page, limit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const visitType = searchParams.get('visitType') || ''
    const studentId = searchParams.get('studentId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter
    const where: Record<string, unknown> = {}
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
        { description: { contains: search } },
        { treatment: { contains: search } },
        { medicationGiven: { contains: search } },
        { referredTo: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { student: { studentNumber: { contains: search } } },
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

    // Stats
    const totalRecords = await db.healthRecord.count()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const visitTypeStats = await db.healthRecord.groupBy({
      by: ['visitType'],
      _count: { id: true },
    })

    const confidentialCount = await db.healthRecord.count({ where: { isConfidential: true } })
    const referralsCount = await db.healthRecord.count({ where: { referredTo: { not: null } } })
    const todayVisits = await db.healthRecord.count({
      where: { visitDate: { gte: today } },
    })

    // Students with chronic conditions
    const studentsWithChronicConditions = await db.student.count({
      where: { chronicConditions: { not: null } },
    })

    // Students with allergies
    const studentsWithAllergies = await db.student.count({
      where: { allergies: { not: null } },
    })

    return NextResponse.json({
      data: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalRecords,
        todayVisits,
        confidentialCount,
        referralsCount,
        studentsWithChronicConditions,
        studentsWithAllergies,
      },
      visitTypeBreakdown: visitTypeStats.map((v) => ({ type: v.visitType, count: v._count.id })),
    })
  } catch (error) {
    console.error('Failed to fetch health records:', error)
    return NextResponse.json({ error: 'Failed to fetch health records' }, { status: 500 })
  }
}

// POST /api/health — Create health record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, visitType, description, treatment, medicationGiven, referredTo, isConfidential, visitDate } = body

    if (!studentId || !visitType || !description) {
      return NextResponse.json(
        { error: 'Student ID, visit type, and description are required' },
        { status: 400 }
      )
    }

    const record = await db.healthRecord.create({
      data: {
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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            allergies: true,
            chronicConditions: true,
            bloodGroup: true,
          },
        },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to create health record:', error)
    return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 })
  }
}

// PUT /api/health — Update health record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
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

    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to update health record:', error)
    return NextResponse.json({ error: 'Failed to update health record' }, { status: 500 })
  }
}

// DELETE /api/health?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    await db.healthRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Health record deleted successfully' })
  } catch (error) {
    console.error('Failed to delete health record:', error)
    return NextResponse.json({ error: 'Failed to delete health record' }, { status: 500 })
  }
}
