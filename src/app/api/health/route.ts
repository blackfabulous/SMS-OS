import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visitType = searchParams.get('visitType')
    const studentId = searchParams.get('studentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (visitType) where.visitType = visitType
    if (studentId) where.studentId = studentId

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
              allergies: true,
              chronicConditions: true,
              medications: true,
              bloodGroup: true,
              doctorName: true,
              doctorPhone: true,
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
    const visitTypeStats = await db.healthRecord.groupBy({
      by: ['visitType'],
      _count: { id: true },
    })

    return NextResponse.json({
      data: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      visitTypeBreakdown: visitTypeStats.map((v) => ({ type: v.visitType, count: v._count.id })),
    })
  } catch (error) {
    console.error('Failed to fetch health records:', error)
    return NextResponse.json({ error: 'Failed to fetch health records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, visitType, description, treatment, medicationGiven, referredTo, isConfidential } = body

    if (!studentId || !visitType || !description) {
      return NextResponse.json({ error: 'Student ID, visit type, and description are required' }, { status: 400 })
    }

    const record = await db.healthRecord.create({
      data: {
        studentId,
        visitType,
        description,
        treatment: treatment || null,
        medicationGiven: medicationGiven || null,
        referredTo: referredTo || null,
        visitDate: new Date(),
        isConfidential: isConfidential || false,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true, allergies: true, chronicConditions: true, bloodGroup: true },
        },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to create health record:', error)
    return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

export async function DELETE(request: Request) {
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
