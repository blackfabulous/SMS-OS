import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/health - Fetch health records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visitType = searchParams.get('visitType')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = {}
    if (visitType) where.visitType = visitType
    if (studentId) where.studentId = studentId

    const records = await db.healthRecord.findMany({
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
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Failed to fetch health records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health records' },
      { status: 500 }
    )
  }
}

// POST /api/health - Add a health record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      visitType,
      description,
      treatment,
      medicationGiven,
      referredTo,
      isConfidential,
    } = body

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
        visitDate: new Date(),
        isConfidential: isConfidential || false,
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
            medications: true,
            bloodGroup: true,
            doctorName: true,
            doctorPhone: true,
          },
        },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to create health record:', error)
    return NextResponse.json(
      { error: 'Failed to create health record' },
      { status: 500 }
    )
  }
}
