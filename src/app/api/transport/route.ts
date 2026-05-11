import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/transport - Get routes, vehicles, and transport assignments
export async function GET() {
  try {
    const routes = await db.transportRoute.findMany({
      where: { isActive: true },
      include: {
        assignments: {
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
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const vehicles = await db.vehicle.findMany({
      where: { isActive: true },
      orderBy: { registrationNumber: 'asc' },
    })

    // Calculate stats
    const totalRoutes = routes.length
    const totalVehicles = vehicles.length
    const studentsOnTransport = await db.transportAssignment.count({
      where: { status: 'ACTIVE' },
    })
    const activeVehicles = vehicles.filter((v) => v.isActive).length

    // All transport assignments for students tab
    const assignments = await db.transportAssignment.findMany({
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
        route: {
          select: {
            id: true,
            name: true,
            fee: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Route stats
    const routeStats = routes.map((r) => ({
      id: r.id,
      name: r.name,
      fee: r.fee,
      capacity: r.capacity,
      studentCount: r.assignments.length,
      occupancyRate: r.capacity > 0 ? ((r.assignments.length / r.capacity) * 100).toFixed(1) : '0',
    }))

    return NextResponse.json({
      routes,
      vehicles,
      stats: {
        totalRoutes,
        totalVehicles,
        studentsOnTransport,
        activeVehicles,
        fleetUtilization: totalVehicles > 0 ? `${((activeVehicles / totalVehicles) * 100).toFixed(0)}%` : '0%',
      },
      routeStats,
      assignments,
    })
  } catch (error) {
    console.error('Failed to fetch transport data:', error)
    return NextResponse.json({ error: 'Failed to fetch transport data' }, { status: 500 })
  }
}

// POST /api/transport - Assign student to route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, studentId, routeId, pickupPoint, dropoffPoint } = body

    if (action === 'assign') {
      if (!studentId || !routeId) {
        return NextResponse.json({ error: 'studentId and routeId are required' }, { status: 400 })
      }

      // Check if student already has an active transport assignment
      const existing = await db.transportAssignment.findUnique({
        where: { studentId },
      })
      if (existing && existing.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Student already has an active transport assignment' }, { status: 400 })
      }

      // Check route capacity
      const route = await db.transportRoute.findUnique({
        where: { id: routeId },
        include: {
          _count: { select: { assignments: { where: { status: 'ACTIVE' } } } },
        },
      })
      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 })
      }
      if (route._count.assignments >= route.capacity) {
        return NextResponse.json({ error: 'Route is at full capacity' }, { status: 400 })
      }

      const assignment = await db.transportAssignment.create({
        data: {
          studentId,
          routeId,
          pickupPoint: pickupPoint || null,
          dropoffPoint: dropoffPoint || null,
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
          route: {
            select: { name: true, fee: true },
          },
        },
      })

      return NextResponse.json(assignment, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process transport request:', error)
    return NextResponse.json({ error: 'Failed to process transport request' }, { status: 500 })
  }
}
