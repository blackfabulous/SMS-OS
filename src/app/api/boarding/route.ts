import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

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

    const totalBoarders = await db.boardingAssignment.count({ where: { status: 'ACTIVE' } })
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

    const assignments = await db.boardingAssignment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true },
        },
        dormitory: {
          include: { hostel: { select: { id: true, name: true, gender: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      hostels,
      assignments,
      stats: { totalBoarders, totalHostels, totalDormitories, totalCapacity, totalOccupancy, occupancyRate },
    })
  } catch (error) {
    console.error('Failed to fetch boarding data:', error)
    return NextResponse.json({ error: 'Failed to fetch boarding data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, studentId, dormitoryId, bedNumber } = body

    if (action === 'assign') {
      if (!studentId || !dormitoryId) {
        return NextResponse.json({ error: 'studentId and dormitoryId are required' }, { status: 400 })
      }

      const existing = await db.boardingAssignment.findUnique({ where: { studentId } })
      if (existing && existing.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Student already has an active boarding assignment' }, { status: 400 })
      }

      const dormitory = await db.dormitory.findUnique({ where: { id: dormitoryId } })
      if (!dormitory) {
        return NextResponse.json({ error: 'Dormitory not found' }, { status: 404 })
      }
      if (dormitory.currentOccupancy >= dormitory.capacity) {
        return NextResponse.json({ error: 'Dormitory is at full capacity' }, { status: 400 })
      }

      const assignment = await db.$transaction(async (tx) => {
        const newAssignment = await tx.boardingAssignment.create({
          data: { studentId, dormitoryId, bedNumber: bedNumber || null, status: 'ACTIVE', startDate: new Date() },
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
            dormitory: { include: { hostel: { select: { name: true } } } },
          },
        })
        await tx.dormitory.update({ where: { id: dormitoryId }, data: { currentOccupancy: { increment: 1 } } })
        await tx.student.update({ where: { id: studentId }, data: { boardingStatus: 'BOARDER' } })
        return newAssignment
      })

      return NextResponse.json(assignment, { status: 201 })
    }

    if (action === 'createHostel') {
      const { schoolId, name, gender, capacity } = body
      if (!name) {
        return NextResponse.json({ error: 'Hostel name is required' }, { status: 400 })
      }
      let sid = schoolId
      if (!sid) { const school = await db.school.findFirst(); sid = school?.id }
      const hostel = await db.hostel.create({
        data: { schoolId: sid || 'default', name, gender: gender || null, capacity: capacity || 50 },
      })
      return NextResponse.json(hostel, { status: 201 })
    }

    if (action === 'createDormitory') {
      const { hostelId, name, capacity } = body
      if (!hostelId || !name) {
        return NextResponse.json({ error: 'Hostel ID and name are required' }, { status: 400 })
      }
      const dormitory = await db.dormitory.create({
        data: { hostelId, name, capacity: capacity || 20 },
      })
      return NextResponse.json(dormitory, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process boarding request:', error)
    return NextResponse.json({ error: 'Failed to process boarding request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    if (action === 'checkout') {
      const assignment = await db.boardingAssignment.update({
        where: { id },
        data: { status: 'INACTIVE', endDate: new Date() },
        include: { student: true, dormitory: true },
      })
      await db.dormitory.update({
        where: { id: assignment.dormitoryId },
        data: { currentOccupancy: { decrement: 1 } },
      })
      await db.student.update({
        where: { id: assignment.studentId },
        data: { boardingStatus: 'DAY_SCHOLAR' },
      })
      return NextResponse.json(assignment)
    }

    const assignment = await db.boardingAssignment.update({
      where: { id },
      data: { bedNumber: updates.bedNumber, dormitoryId: updates.dormitoryId, status: updates.status },
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Failed to update boarding assignment:', error)
    return NextResponse.json({ error: 'Failed to update boarding assignment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'hostel') {
      await db.hostel.delete({ where: { id } })
    } else if (type === 'dormitory') {
      await db.dormitory.delete({ where: { id } })
    } else {
      const assignment = await db.boardingAssignment.delete({ where: { id } })
      await db.dormitory.update({ where: { id: assignment.dormitoryId }, data: { currentOccupancy: { decrement: 1 } } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete boarding record:', error)
    return NextResponse.json({ error: 'Failed to delete boarding record' }, { status: 500 })
  }
}
