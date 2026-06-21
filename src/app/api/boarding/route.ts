import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'

// GET /api/boarding — List hostels with dormitory counts and boarding assignments
// Query params: search, gender, status, page, limit
export async function GET(request: NextRequest) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender') || ''
    const status = searchParams.get('status') || 'ACTIVE'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build hostel filter
    const hostelFilter: Record<string, unknown> = { schoolId }
    if (search) {
      hostelFilter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (gender) {
      hostelFilter.gender = gender
    }

    const [hostels, hostelTotal] = await Promise.all([
      db.hostel.findMany({
        where: hostelFilter,
        include: {
          dormitories: {
            include: {
              boardingAssignments: {
                where: { status },
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.hostel.count({ where: hostelFilter }),
    ])

    // Boarding assignments with student + dormitory + hostel details
    const assignmentFilter: Record<string, unknown> = {}
    if (status) assignmentFilter.status = status

    const [assignments, assignmentTotal] = await Promise.all([
      db.boardingAssignment.findMany({
        where: assignmentFilter,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true, boardingStatus: true },
          },
          dormitory: {
            include: { hostel: { select: { id: true, name: true, gender: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.boardingAssignment.count({ where: assignmentFilter }),
    ])

    // Stats
    const totalBoarders = await db.boardingAssignment.count({ where: { status: 'ACTIVE' } })
    const totalHostels = await db.hostel.count()
    const totalDormitories = await db.dormitory.count()

    const dormStats = await db.dormitory.aggregate({
      _sum: { capacity: true, currentOccupancy: true },
    })
    const totalCapacity = dormStats._sum.capacity || 0
    const totalOccupancy = dormStats._sum.currentOccupancy || 0
    const occupancyRate = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : '0'

    return NextResponse.json({
      hostels,
      assignments,
      stats: { totalBoarders, totalHostels, totalDormitories, totalCapacity, totalOccupancy, occupancyRate },
      pagination: {
        page,
        limit,
        totalHostels: hostelTotal,
        totalAssignments: assignmentTotal,
        totalPages: Math.ceil(hostelTotal / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch boarding data:', error)
    return NextResponse.json({ error: 'Failed to fetch boarding data' }, { status: 500 })
  }
}

// POST /api/boarding — Create hostel / dormitory / assign boarder
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'assign') {
      const { studentId, dormitoryId, bedNumber } = body
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

      logAudit({ action: 'CREATE', entity: 'boarding', entityId: (assignment as any)?.id, afterValue: assignment }).catch(() => {})
      return NextResponse.json(assignment, { status: 201 })
    }

    if (action === 'createHostel') {
      const { schoolId, name, gender, capacity } = body
      if (!name) {
        return NextResponse.json({ error: 'Hostel name is required' }, { status: 400 })
      }
      let sid = schoolId
      const hostel = await db.hostel.create({
        data: { schoolId: sid || 'default', name, gender: gender || null, capacity: capacity || 50 },
      })
      logAudit({ action: 'CREATE', entity: 'boarding', entityId: (hostel as any)?.id, afterValue: hostel }).catch(() => {})
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
      logAudit({ action: 'CREATE', entity: 'boarding', entityId: (dormitory as any)?.id, afterValue: dormitory }).catch(() => {})
      return NextResponse.json(dormitory, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action. Use: assign, createHostel, or createDormitory' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process boarding request:', error)
    return NextResponse.json({ error: 'Failed to process boarding request' }, { status: 500 })
  }
}

// PUT /api/boarding — Update assignment / checkout
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Verify the assignment belongs to the caller's school before mutating.
    const schoolId = authResult.session.user.schoolId
    const owned = await db.boardingAssignment.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

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
      logAudit({ action: 'UPDATE', entity: 'boarding', entityId: (assignment as any)?.id, afterValue: assignment }).catch(() => {})
      return NextResponse.json(assignment)
    }

    const assignment = await db.boardingAssignment.update({
      where: { id },
      data: {
        bedNumber: updates.bedNumber,
        dormitoryId: updates.dormitoryId,
        status: updates.status,
      },
    })

    logAudit({ action: 'UPDATE', entity: 'boarding', entityId: (assignment as any)?.id, afterValue: assignment }).catch(() => {})
    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Failed to update boarding assignment:', error)
    return NextResponse.json({ error: 'Failed to update boarding assignment' }, { status: 500 })
  }
}

// DELETE /api/boarding?id=xxx&type=hostel|dormitory|assignment
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const schoolId = authResult.session.user.schoolId
    if (type === 'hostel') {
      const owned = await db.hostel.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.hostel.delete({ where: { id } })
    } else if (type === 'dormitory') {
      const owned = await db.dormitory.findFirst({ where: { id, hostel: { schoolId } }, select: { id: true } })
      if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.dormitory.delete({ where: { id } })
    } else {
      const ownedA = await db.boardingAssignment.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
      if (!ownedA) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const assignment = await db.boardingAssignment.delete({ where: { id } })
      await db.dormitory.update({
        where: { id: assignment.dormitoryId },
        data: { currentOccupancy: { decrement: 1 } },
      })
    }

    logAudit({ action: 'DELETE', entity: 'boarding', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete boarding record:', error)
    return NextResponse.json({ error: 'Failed to delete boarding record' }, { status: 500 })
  }
}
