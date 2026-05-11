import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/boarding - Get hostels, dormitories, and boarding assignments
export async function GET() {
  try {
    const hostels = await db.hostel.findMany({
      include: {
        dormitories: {
          include: {
            boardingAssignments: {
              where: { status: 'ACTIVE' },
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    studentNumber: true,
                    gender: true,
                    boardingStatus: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Calculate stats
    const totalBoarders = await db.boardingAssignment.count({
      where: { status: 'ACTIVE' },
    })

    const totalHostels = hostels.length
    const totalDormitories = hostels.reduce((sum, h) => sum + h.dormitories.length, 0)
    const totalCapacity = hostels.reduce(
      (sum, h) => sum + h.dormitories.reduce((ds, d) => ds + d.capacity, 0),
      0
    )
    const totalOccupancy = hostels.reduce(
      (sum, h) => sum + h.dormitories.reduce((ds, d) => ds + d.currentOccupancy, 0),
      0
    )
    const occupancyRate = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : '0'

    // All boarding assignments for boarders tab
    const assignments = await db.boardingAssignment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            gender: true,
          },
        },
        dormitory: {
          include: {
            hostel: { select: { id: true, name: true, gender: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      hostels,
      stats: {
        totalBoarders,
        totalHostels,
        totalDormitories,
        totalCapacity,
        totalOccupancy,
        occupancyRate,
      },
      assignments,
    })
  } catch (error) {
    console.error('Failed to fetch boarding data:', error)
    return NextResponse.json({ error: 'Failed to fetch boarding data' }, { status: 500 })
  }
}

// POST /api/boarding - Assign boarder to dormitory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, studentId, dormitoryId, bedNumber } = body

    if (action === 'assign') {
      if (!studentId || !dormitoryId) {
        return NextResponse.json({ error: 'studentId and dormitoryId are required' }, { status: 400 })
      }

      // Check if student already has an active boarding assignment
      const existing = await db.boardingAssignment.findUnique({
        where: { studentId },
      })
      if (existing && existing.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Student already has an active boarding assignment' }, { status: 400 })
      }

      // Check dormitory capacity
      const dormitory = await db.dormitory.findUnique({
        where: { id: dormitoryId },
      })
      if (!dormitory) {
        return NextResponse.json({ error: 'Dormitory not found' }, { status: 404 })
      }
      if (dormitory.currentOccupancy >= dormitory.capacity) {
        return NextResponse.json({ error: 'Dormitory is at full capacity' }, { status: 400 })
      }

      // Create assignment and update occupancy in a transaction
      const assignment = await db.$transaction(async (tx) => {
        const newAssignment = await tx.boardingAssignment.create({
          data: {
            studentId,
            dormitoryId,
            bedNumber: bedNumber || null,
            status: 'ACTIVE',
            startDate: new Date(),
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
            dormitory: {
              include: { hostel: { select: { name: true } } },
            },
          },
        })

        await tx.dormitory.update({
          where: { id: dormitoryId },
          data: { currentOccupancy: { increment: 1 } },
        })

        // Update student boarding status
        await tx.student.update({
          where: { id: studentId },
          data: { boardingStatus: 'BOARDER' },
        })

        return newAssignment
      })

      return NextResponse.json(assignment, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process boarding request:', error)
    return NextResponse.json({ error: 'Failed to process boarding request' }, { status: 500 })
  }
}
