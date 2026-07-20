import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string
  isActive?: string | null
  page?: number
  limit?: number
}

export async function listTransport(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const isActiveStr = params.isActive

  const routeFilter: Record<string, unknown> = { schoolId }
  if (search) {
    routeFilter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (isActiveStr !== null && isActiveStr !== undefined && isActiveStr !== '') {
    routeFilter.isActive = isActiveStr === 'true'
  } else {
    routeFilter.isActive = true
  }

  const [routes, routeTotal] = await Promise.all([
    db.transportRoute.findMany({
      where: routeFilter,
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    db.transportRoute.count({ where: routeFilter }),
  ])

  const vehicleFilter: Record<string, unknown> = { schoolId }
  if (isActiveStr !== null && isActiveStr !== undefined && isActiveStr !== '') {
    vehicleFilter.isActive = isActiveStr === 'true'
  } else {
    vehicleFilter.isActive = true
  }
  if (search) {
    vehicleFilter.OR = [
      { registrationNumber: { contains: search, mode: 'insensitive' } },
      { driverName: { contains: search, mode: 'insensitive' } },
      { make: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [vehicles, vehicleTotal] = await Promise.all([
    db.vehicle.findMany({
      where: vehicleFilter,
      orderBy: { registrationNumber: 'asc' },
      skip,
      take: limit,
    }),
    db.vehicle.count({ where: vehicleFilter }),
  ])

  const studentsOnTransport = await db.transportAssignment.count({ where: { schoolId, status: 'ACTIVE' } })

  const routeStats = routes.map((r) => ({
    id: r.id,
    name: r.name,
    fee: r.fee,
    capacity: r.capacity,
    studentCount: r.assignments.length,
    occupancyRate: r.capacity > 0 ? ((r.assignments.length / r.capacity) * 100).toFixed(1) : '0',
  }))

  const [assignments, assignmentTotal] = await Promise.all([
    db.transportAssignment.findMany({
      where: { schoolId, status: 'ACTIVE' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true } },
        route: { select: { id: true, name: true, fee: true, description: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.transportAssignment.count({ where: { schoolId, status: 'ACTIVE' } }),
  ])

  const totalFeeRevenue = assignments.reduce((sum, a) => sum + (a.route?.fee || 0), 0)

  return {
    routes,
    vehicles,
    assignments,
    routeStats,
    stats: {
      totalRoutes: routeTotal,
      totalVehicles: vehicleTotal,
      studentsOnTransport,
      totalFeeRevenue,
    },
    pagination: {
      page,
      limit,
      totalRoutes: routeTotal,
      totalAssignments: assignmentTotal,
      totalPages: Math.ceil(routeTotal / limit),
    },
  }
}

export async function assignStudentToTransport(
  schoolId: string,
  body: { studentId?: string; routeId?: string; pickupPoint?: string; dropoffPoint?: string },
) {
  const { studentId, routeId, pickupPoint, dropoffPoint } = body
  if (!studentId || !routeId) {
    throw new AppError('VALIDATION', 'studentId and routeId are required')
  }

  const existing = await db.transportAssignment.findFirst({ where: { studentId, schoolId, status: 'ACTIVE' } })
  if (existing) {
    throw new AppError('CONFLICT', 'Student already has an active transport assignment')
  }

  const route = await db.transportRoute.findFirst({
    where: { id: routeId, schoolId },
    include: { _count: { select: { assignments: { where: { status: 'ACTIVE' } } } } },
  })
  if (!route) throw new AppError('NOT_FOUND', 'Route not found')
  if (route._count.assignments >= route.capacity) {
    throw new AppError('CONFLICT', 'Route is at full capacity')
  }

  const assignment = await db.transportAssignment.create({
    data: {
      schoolId,
      studentId,
      routeId,
      pickupPoint: pickupPoint || null,
      dropoffPoint: dropoffPoint || null,
      status: 'ACTIVE',
      startDate: new Date(),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      route: { select: { name: true, fee: true } },
    },
  })

  logAudit({ action: 'CREATE', entity: 'transport', entityId: assignment.id, schoolId, afterValue: assignment }).catch(
    () => {},
  )
  return assignment
}

export async function addTransportRoute(
  schoolId: string,
  body: { name?: string; description?: string; fee?: number; capacity?: number },
) {
  const { name, description, fee, capacity } = body
  if (!name) throw new AppError('VALIDATION', 'Route name is required')

  const route = await db.transportRoute.create({
    data: {
      schoolId,
      name,
      description: description || null,
      fee: fee || 0,
      capacity: capacity || 50,
    },
  })

  logAudit({ action: 'CREATE', entity: 'transport', entityId: route.id, schoolId, afterValue: route }).catch(() => {})
  return route
}

export async function addVehicle(
  schoolId: string,
  body: {
    registrationNumber?: string
    make?: string
    model?: string
    year?: number
    capacity?: number
    driverName?: string
  },
) {
  const { registrationNumber, make, model, year, capacity, driverName } = body
  if (!registrationNumber) throw new AppError('VALIDATION', 'Registration number is required')

  const vehicle = await db.vehicle.create({
    data: {
      schoolId,
      registrationNumber,
      make: make || null,
      model: model || null,
      year: year || null,
      capacity: capacity || null,
      driverName: driverName || null,
    },
  })

  logAudit({ action: 'CREATE', entity: 'transport', entityId: vehicle.id, schoolId, afterValue: vehicle }).catch(() => {})
  return vehicle
}

export async function updateTransportRoute(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.transportRoute.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Route not found')

  const route = await db.transportRoute.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      description: updates.description as string | undefined,
      fee: updates.fee as number | undefined,
      capacity: updates.capacity as number | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'transport', entityId: route.id, schoolId, afterValue: route }).catch(() => {})
  return route
}

export async function updateVehicle(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.vehicle.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Vehicle not found')

  const vehicle = await db.vehicle.update({
    where: { id },
    data: {
      registrationNumber: updates.registrationNumber as string | undefined,
      make: updates.make as string | undefined,
      model: updates.model as string | undefined,
      driverName: updates.driverName as string | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'transport', entityId: vehicle.id, schoolId, afterValue: vehicle }).catch(
    () => {},
  )
  return vehicle
}

export async function updateTransportAssignment(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.transportAssignment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Assignment not found')

  const assignment = await db.transportAssignment.update({
    where: { id },
    data: {
      status: updates.status as any,
      pickupPoint: updates.pickupPoint as string | undefined,
      dropoffPoint: updates.dropoffPoint as string | undefined,
      endDate: updates.status === 'INACTIVE' ? new Date() : undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'transport', entityId: assignment.id, schoolId, afterValue: assignment }).catch(
    () => {},
  )
  return assignment
}

export async function deleteTransportRoute(schoolId: string, id: string) {
  const owned = await db.transportRoute.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Route not found')

  await db.transportRoute.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'transport', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteVehicle(schoolId: string, id: string) {
  const owned = await db.vehicle.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Vehicle not found')

  await db.vehicle.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'transport', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteTransportAssignment(schoolId: string, id: string) {
  const owned = await db.transportAssignment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Assignment not found')

  await db.transportAssignment.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'transport', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleTransportError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
