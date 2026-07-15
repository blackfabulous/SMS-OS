import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'

// GET /api/transport — List routes with vehicle and student assignment info
// Query params: search, isActive, page, limit
export async function GET(request: NextRequest) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActiveStr = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build route filter
    const routeFilter: Record<string, unknown> = {}
    if (search) {
      routeFilter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (isActiveStr !== null) {
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transportRoute.count({ where: routeFilter }),
    ])

    // Vehicles list (with filter)
    const vehicleFilter: Record<string, unknown> = {}
    if (isActiveStr !== null) {
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.vehicle.count({ where: vehicleFilter }),
    ])

    // All active assignments
    const studentsOnTransport = await db.transportAssignment.count({ where: { status: 'ACTIVE' } })

    // Route stats with occupancy
    const routeStats = routes.map((r) => ({
      id: r.id,
      name: r.name,
      fee: r.fee,
      capacity: r.capacity,
      studentCount: r.assignments.length,
      occupancyRate: r.capacity > 0 ? ((r.assignments.length / r.capacity) * 100).toFixed(1) : '0',
    }))

    // Assignments with full details
    const [assignments, assignmentTotal] = await Promise.all([
      db.transportAssignment.findMany({
        where: { status: 'ACTIVE' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true } },
          route: { select: { id: true, name: true, fee: true, description: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transportAssignment.count({ where: { status: 'ACTIVE' } }),
    ])

    // Aggregate stats - calculate total fee revenue from assignments
    const totalFeeRevenue = assignments.reduce((sum, a) => sum + (a.route?.fee || 0), 0)

    return ok({
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
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch transport data')
    return fail('INTERNAL', 'Failed to fetch transport data')
  }
}

// POST /api/transport — Create route / vehicle / assign student to route
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'assign') {
      const { studentId, routeId, pickupPoint, dropoffPoint } = body
      if (!studentId || !routeId) {
        return fail('VALIDATION', 'studentId and routeId are required')
      }

      const existing = await db.transportAssignment.findUnique({ where: { studentId } })
      if (existing && existing.status === 'ACTIVE') {
        return fail('CONFLICT', 'Student already has an active transport assignment')
      }

      const route = await db.transportRoute.findUnique({
        where: { id: routeId },
        include: { _count: { select: { assignments: { where: { status: 'ACTIVE' } } } } },
      })
      if (!route) {
        return fail('NOT_FOUND', 'Route not found')
      }
      if (route._count.assignments >= route.capacity) {
        return fail('CONFLICT', 'Route is at full capacity')
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
      logAudit({ action: 'CREATE', entity: 'transport', entityId: (assignment as any)?.id, afterValue: assignment }).catch(() => {})
      return ok(assignment, 201)
    }

    if (action === 'addRoute') {
      const { schoolId, name, description, fee, capacity } = body
      if (!name) {
        return fail('VALIDATION', 'Route name is required')
      }
      let sid = schoolId

      const newRoute = await db.transportRoute.create({
        data: {
          schoolId: sid || 'default',
          name,
          description: description || null,
          fee: fee || 0,
          capacity: capacity || 50,
        },
      })
      logAudit({ action: 'CREATE', entity: 'transport', entityId: (newRoute as any)?.id, afterValue: newRoute }).catch(() => {})
      return ok(newRoute, 201)
    }

    if (action === 'addVehicle') {
      const { schoolId, registrationNumber, make, model, year, capacity, driverName } = body
      if (!registrationNumber) {
        return fail('VALIDATION', 'Registration number is required')
      }
      let sid = schoolId

      const vehicle = await db.vehicle.create({
        data: {
          schoolId: sid || 'default',
          registrationNumber,
          make: make || null,
          model: model || null,
          year: year || null,
          capacity: capacity || null,
          driverName: driverName || null,
        },
      })
      logAudit({ action: 'CREATE', entity: 'transport', entityId: (vehicle as any)?.id, afterValue: vehicle }).catch(() => {})
      return ok(vehicle, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use: assign, addRoute, or addVehicle')
  } catch (error) {
    logger.error({ err: error }, 'Failed to process transport request')
    return fail('INTERNAL', 'Failed to process transport request')
  }
}

// PUT /api/transport — Update route / vehicle / assignment
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body

    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }
    const schoolId = authResult.session.user.schoolId

    if (type === 'route') {
      const owned = await db.transportRoute.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      const updatedRoute = await db.transportRoute.update({
        where: { id },
        data: {
          name: updates.name,
          description: updates.description,
          fee: updates.fee,
          capacity: updates.capacity,
          isActive: updates.isActive,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'transport', entityId: (updatedRoute as any)?.id, afterValue: updatedRoute }).catch(() => {})
      return ok(updatedRoute)
    }

    if (type === 'vehicle') {
      const owned = await db.vehicle.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      const vehicle = await db.vehicle.update({
        where: { id },
        data: {
          registrationNumber: updates.registrationNumber,
          make: updates.make,
          model: updates.model,
          driverName: updates.driverName,
          isActive: updates.isActive,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'transport', entityId: (vehicle as any)?.id, afterValue: vehicle }).catch(() => {})
      return ok(vehicle)
    }

    // Default: update assignment
    const ownedA = await db.transportAssignment.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
    if (!ownedA) return fail('NOT_FOUND', 'Not found')
    const assignment = await db.transportAssignment.update({
      where: { id },
      data: {
        status: updates.status,
        pickupPoint: updates.pickupPoint,
        dropoffPoint: updates.dropoffPoint,
        endDate: updates.status === 'INACTIVE' ? new Date() : undefined,
      },
    })
    logAudit({ action: 'UPDATE', entity: 'transport', entityId: (assignment as any)?.id, afterValue: assignment }).catch(() => {})
    return ok(assignment)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update transport record')
    return fail('INTERNAL', 'Failed to update transport record')
  }
}

// DELETE /api/transport?id=xxx&type=route|vehicle|assignment
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
    if (type === 'route') {
      const owned = await db.transportRoute.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.transportRoute.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'vehicle') {
      const owned = await db.vehicle.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.vehicle.update({ where: { id }, data: { isActive: false } })
    } else {
      const owned = await db.transportAssignment.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.transportAssignment.delete({ where: { id } })
    }

    logAudit({ action: 'DELETE', entity: 'transport', entityId: (id ?? undefined) }).catch(() => {})
    return ok({ message: 'Deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete transport record')
    return fail('INTERNAL', 'Failed to delete transport record')
  }
}
