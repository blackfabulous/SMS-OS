import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/welfare - Fetch welfare records and BEAM applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'welfare' or 'beam'

    if (type === 'beam') {
      const beamApplications = await db.beamApplication.findMany({
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              beamStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ beamApplications })
    }

    // Default: return both welfare records and BEAM applications
    const welfareRecords = await db.welfareRecord.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            beamStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const beamApplications = await db.beamApplication.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            beamStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ welfareRecords, beamApplications })
  } catch (error) {
    console.error('Failed to fetch welfare data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch welfare data' },
      { status: 500 }
    )
  }
}

// POST /api/welfare - Add welfare record or BEAM application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === 'beam') {
      // Apply for BEAM
      const { studentId, guardianSituation, orphanStatus, notes, coveredAmount, outstandingBalance } = body

      if (!studentId) {
        return NextResponse.json(
          { error: 'Student ID is required' },
          { status: 400 }
        )
      }

      // Check if student already has a BEAM application
      const existing = await db.beamApplication.findUnique({
        where: { studentId },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Student already has a BEAM application' },
          { status: 400 }
        )
      }

      const beamApplication = await db.beamApplication.create({
        data: {
          studentId,
          guardianSituation: guardianSituation || null,
          orphanStatus: orphanStatus || null,
          notes: notes || null,
          coveredAmount: coveredAmount || 0,
          outstandingBalance: outstandingBalance || 0,
          status: 'APPLIED',
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              beamStatus: true,
            },
          },
        },
      })

      // Update student beamStatus
      await db.student.update({
        where: { id: studentId },
        data: { beamStatus: 'APPLIED' },
      })

      return NextResponse.json(beamApplication, { status: 201 })
    }

    // Default: Add welfare record
    const { studentId, category, description, actionTaken, referredTo, isConfidential } = body

    if (!studentId || !category) {
      return NextResponse.json(
        { error: 'Student ID and category are required' },
        { status: 400 }
      )
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
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            beamStatus: true,
          },
        },
      },
    })

    return NextResponse.json(welfareRecord, { status: 201 })
  } catch (error) {
    console.error('Failed to create welfare record:', error)
    return NextResponse.json(
      { error: 'Failed to create welfare record' },
      { status: 500 }
    )
  }
}
