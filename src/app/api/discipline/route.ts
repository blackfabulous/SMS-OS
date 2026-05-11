import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/discipline - Fetch discipline records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const incidentType = searchParams.get('incidentType')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (incidentType) where.incidentType = incidentType

    const records = await db.disciplineRecord.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Failed to fetch discipline records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discipline records' },
      { status: 500 }
    )
  }
}

// POST /api/discipline - Add a discipline incident
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      incidentType,
      description,
      date,
      action,
      meritPoints,
      demeritPoints,
      parentNotified,
    } = body

    if (!studentId || !incidentType || !description) {
      return NextResponse.json(
        { error: 'Student ID, incident type, and description are required' },
        { status: 400 }
      )
    }

    const record = await db.disciplineRecord.create({
      data: {
        studentId,
        incidentType,
        description,
        date: date ? new Date(date) : new Date(),
        action: action || null,
        meritPoints: meritPoints || 0,
        demeritPoints: demeritPoints || 0,
        parentNotified: parentNotified || false,
        status: 'OPEN',
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to create discipline record:', error)
    return NextResponse.json(
      { error: 'Failed to create discipline record' },
      { status: 500 }
    )
  }
}
