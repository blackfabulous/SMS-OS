import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import type { ActiveStatus } from '@prisma/client'

interface ListParams {
  search?: string
  gender?: string
  status?: string
  page?: number
  limit?: number
}

export async function listBoarding(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const gender = params.gender ?? ''
  const status = (params.status || 'ACTIVE') as ActiveStatus

  const hostelFilter: Record<string, unknown> = { schoolId }
  if (search) hostelFilter.OR = [{ name: { contains: search, mode: 'insensitive' } }]
  if (gender) hostelFilter.gender = gender

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
      skip,
      take: limit,
    }),
    db.hostel.count({ where: hostelFilter }),
  ])

  const assignmentFilter: Record<string, unknown> = { schoolId }
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
      skip,
      take: limit,
    }),
    db.boardingAssignment.count({ where: assignmentFilter }),
  ])

  const [totalBoarders, totalHostels, totalDormitories, dormStats] = await Promise.all([
    db.boardingAssignment.count({ where: { schoolId, status: 'ACTIVE' } }),
    db.hostel.count({ where: { schoolId } }),
    db.dormitory.count({ where: { schoolId } }),
    db.dormitory.aggregate({ where: { schoolId }, _sum: { capacity: true, currentOccupancy: true } }),
  ])

  const totalCapacity = dormStats._sum.capacity || 0
  const totalOccupancy = dormStats._sum.currentOccupancy || 0
  const occupancyRate = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : '0'

  return {
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
  }
}

export async function assignBoarder(schoolId: string, body: { studentId?: string; dormitoryId?: string; bedNumber?: string }) {
  const { studentId, dormitoryId, bedNumber } = body
  if (!studentId || !dormitoryId) throw new AppError('VALIDATION', 'studentId and dormitoryId are required')

  const student = await db.student.findUnique({ where: { id: studentId, schoolId }, select: { id: true } })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const existing = await db.boardingAssignment.findFirst({ where: { studentId, schoolId, status: 'ACTIVE' } })
  if (existing) throw new AppError('CONFLICT', 'Student already has an active boarding assignment')

  const dormitory = await db.dormitory.findFirst({ where: { id: dormitoryId, schoolId } })
  if (!dormitory) throw new AppError('NOT_FOUND', 'Dormitory not found')
  if (dormitory.currentOccupancy >= dormitory.capacity) throw new AppError('CONFLICT', 'Dormitory is at full capacity')

  const assignment = await db.$transaction(async (tx) => {
    const newAssignment = await tx.boardingAssignment.create({
      data: {
        schoolId,
        studentId,
        dormitoryId,
        bedNumber: bedNumber || null,
        status: 'ACTIVE',
        startDate: new Date(),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        dormitory: { include: { hostel: { select: { name: true } } } },
      },
    })
    await tx.dormitory.update({ where: { id: dormitoryId }, data: { currentOccupancy: { increment: 1 } } })
    await tx.student.update({ where: { id: studentId }, data: { boardingStatus: 'BOARDER' } })
    return newAssignment
  })

  logAudit({ action: 'CREATE', entity: 'boarding', entityId: assignment.id, schoolId, afterValue: assignment }).catch(
    () => {},
  )
  return assignment
}

export async function createHostel(schoolId: string, body: { name?: string; gender?: string; capacity?: number }) {
  const { name, gender, capacity } = body
  if (!name) throw new AppError('VALIDATION', 'Hostel name is required')

  const hostel = await db.hostel.create({
    data: { schoolId, name, gender: gender || null, capacity: capacity || 50 },
  })

  logAudit({ action: 'CREATE', entity: 'boarding', entityId: hostel.id, schoolId, afterValue: hostel }).catch(() => {})
  return hostel
}

export async function createDormitory(schoolId: string, body: { hostelId?: string; name?: string; capacity?: number }) {
  const { hostelId, name, capacity } = body
  if (!hostelId || !name) throw new AppError('VALIDATION', 'Hostel ID and name are required')

  const hostel = await db.hostel.findFirst({ where: { id: hostelId, schoolId }, select: { id: true } })
  if (!hostel) throw new AppError('NOT_FOUND', 'Hostel not found')

  const dormitory = await db.dormitory.create({
    data: { schoolId, hostelId, name, capacity: capacity || 20 },
  })

  logAudit({ action: 'CREATE', entity: 'boarding', entityId: dormitory.id, schoolId, afterValue: dormitory }).catch(
    () => {},
  )
  return dormitory
}

export async function updateBoardingAssignment(
  schoolId: string,
  id: string,
  updates: { bedNumber?: string; dormitoryId?: string; status?: string },
) {
  const owned = await db.boardingAssignment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Assignment not found')

  if (updates.dormitoryId) {
    const dormitory = await db.dormitory.findFirst({ where: { id: updates.dormitoryId, schoolId } })
    if (!dormitory) throw new AppError('NOT_FOUND', 'Dormitory not found')
  }

  const assignment = await db.boardingAssignment.update({
    where: { id },
    data: {
      bedNumber: updates.bedNumber,
      dormitoryId: updates.dormitoryId,
      status: updates.status as ActiveStatus,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'boarding', entityId: assignment.id, schoolId, afterValue: assignment }).catch(
    () => {},
  )
  return assignment
}

export async function checkoutBoarder(schoolId: string, id: string) {
  const owned = await db.boardingAssignment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Assignment not found')

  const assignment = await db.boardingAssignment.update({
    where: { id },
    data: { status: 'INACTIVE', endDate: new Date() },
    include: { student: true, dormitory: true },
  })
  await db.dormitory.update({ where: { id: assignment.dormitoryId }, data: { currentOccupancy: { decrement: 1 } } })
  await db.student.update({ where: { id: assignment.studentId }, data: { boardingStatus: 'DAY_SCHOLAR' } })

  logAudit({ action: 'UPDATE', entity: 'boarding', entityId: assignment.id, schoolId, afterValue: assignment }).catch(
    () => {},
  )
  return assignment
}

export async function deleteHostel(schoolId: string, id: string) {
  const owned = await db.hostel.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Hostel not found')

  await db.hostel.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'boarding', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteDormitory(schoolId: string, id: string) {
  const owned = await db.dormitory.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Dormitory not found')

  await db.dormitory.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'boarding', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteBoardingAssignment(schoolId: string, id: string) {
  const owned = await db.boardingAssignment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Assignment not found')

  const assignment = await db.boardingAssignment.delete({ where: { id } })
  await db.dormitory.update({ where: { id: assignment.dormitoryId }, data: { currentOccupancy: { decrement: 1 } } })

  logAudit({ action: 'DELETE', entity: 'boarding', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleBoardingError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
