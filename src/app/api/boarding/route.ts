import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import type { ActiveStatus } from '@prisma/client'

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
                where: { status: status as ActiveStatus },
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

    return ok({
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
    logger.error({ err: error }, 'Failed to fetch boarding data')
    return fail('INTERNAL', 'Failed to fetch boarding data')
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
        return fail('VALIDATION', 'studentId and dormitoryId are required')
      }

      const existing = await db.boardingAssignment.findUnique({ where: { studentId } })
      if (existing && existing.status === 'ACTIVE') {
        return fail('CONFLICT', 'Student already has an active boarding assignment')
      }

      const dormitory = await db.dormitory.findUnique({ where: { id: dormitoryId } })
      if (!dormitory) {
        return fail('NOT_FOUND', 'Dormitory not found')
      }
      if (dormitory.currentOccupancy >= dormitory.capacity) {
        return fail('CONFLICT', 'Dormitory is at full capacity')
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
      return ok(assignment, 201)
    }

    if (action === 'createHostel') {
      const { schoolId, name, gender, capacity } = body
      if (!name) {
        return fail('VALIDATION', 'Hostel name is required')
      }
      let sid = schoolId
      const hostel = await db.hostel.create({
        data: { schoolId: sid || 'default', name, gender: gender || null, capacity: capacity || 50 },
      })
      logAudit({ action: 'CREATE', entity: 'boarding', entityId: (hostel as any)?.id, afterValue: hostel }).catch(() => {})
      return ok(hostel, 201)
    }

    if (action === 'createDormitory') {
      const { hostelId, name, capacity } = body
      if (!hostelId || !name) {
        return fail('VALIDATION', 'Hostel ID and name are required')
      }
      const dormitory = await db.dormitory.create({
        data: { schoolId, hostelId, name, capacity: capacity || 20 },
      })
      logAudit({ action: 'CREATE', entity: 'boarding', entityId: (dormitory as any)?.id, afterValue: dormitory }).catch(() => {})
      return ok(dormitory, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use: assign, createHostel, or createDormitory')
  } catch (error) {
    logger.error({ err: error }, 'Failed to process boarding request')
    return fail('INTERNAL', 'Failed to process boarding request')
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
      return fail('VALIDATION', 'Assignment ID is required')
    }

    // Verify the assignment belongs to the caller's school before mutating.
    const schoolId = authResult.session.user.schoolId
    const owned = await db.boardingAssignment.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
    if (!owned) return fail('NOT_FOUND', 'Assignment not found')

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
      return ok(assignment)
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
    return ok(assignment)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update boarding assignment')
    return fail('INTERNAL', 'Failed to update boarding assignment')
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
      return fail('VALIDATION', 'ID is required')
    }

    const schoolId = authResult.session.user.schoolId
    if (type === 'hostel') {
      const owned = await db.hostel.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.hostel.delete({ where: { id } })
    } else if (type === 'dormitory') {
      const owned = await db.dormitory.findFirst({ where: { id, hostel: { schoolId } }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.dormitory.delete({ where: { id } })
    } else {
      const ownedA = await db.boardingAssignment.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
      if (!ownedA) return fail('NOT_FOUND', 'Not found')
      const assignment = await db.boardingAssignment.delete({ where: { id } })
      await db.dormitory.update({
        where: { id: assignment.dormitoryId },
        data: { currentOccupancy: { decrement: 1 } },
      })
    }

    logAudit({ action: 'DELETE', entity: 'boarding', entityId: (id ?? undefined) }).catch(() => {})
    return ok({ message: 'Deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete boarding record')
    return fail('INTERNAL', 'Failed to delete boarding record')
  }
}
