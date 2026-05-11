import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const routes = await db.transportRoute.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const vehicles = await db.vehicle.findMany({
      where: { isActive: true },
      orderBy: { registrationNumber: 'asc' },
    })

    const totalRoutes = routes.length
    const totalVehicles = vehicles.length
    const studentsOnTransport = await db.transportAssignment.count({ where: { status: 'ACTIVE' } })

    const assignments = await db.transportAssignment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true } },
        route: { select: { id: true, name: true, fee: true, description: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const routeStats = routes.map((r) => ({
      id: r.id, name: r.name, fee: r.fee, capacity: r.capacity,
      studentCount: r.assignments.length,
      occupancyRate: r.capacity > 0 ? ((r.assignments.length / r.capacity) * 100).toFixed(1) : '0',
    }))

    return NextResponse.json({
      routes, vehicles, assignments, routeStats,
      stats: { totalRoutes, totalVehicles, studentsOnTransport },
    })
  } catch (error) {
    console.error('Failed to fetch transport data:', error)
    return NextResponse.json({ error: 'Failed to fetch transport data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'assign') {
      const { studentId, routeId, pickupPoint, dropoffPoint } = body
      if (!studentId || !routeId) return NextResponse.json({ error: 'studentId and routeId are required' }, { status: 400 })

      const existing = await db.transportAssignment.findUnique({ where: { studentId } })
      if (existing && existing.status === 'ACTIVE') return NextResponse.json({ error: 'Student already has an active transport assignment' }, { status: 400 })

      const route = await db.transportRoute.findUnique({
        where: { id: routeId },
        include: { _count: { select: { assignments: { where: { status: 'ACTIVE' } } } } },
      })
      if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 })
      if (route._count.assignments >= route.capacity) return NextResponse.json({ error: 'Route is at full capacity' }, { status: 400 })

      const assignment = await db.transportAssignment.create({
        data: { studentId, routeId, pickupPoint: pickupPoint || null, dropoffPoint: dropoffPoint || null, status: 'ACTIVE', startDate: new Date() },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          route: { select: { name: true, fee: true } },
        },
      })
      return NextResponse.json(assignment, { status: 201 })
    }

    if (action === 'addRoute') {
      const { schoolId, name, description, fee, capacity } = body
      if (!name) return NextResponse.json({ error: 'Route name is required' }, { status: 400 })
      let sid = schoolId
      if (!sid) { const school = await db.school.findFirst(); sid = school?.id }

      const route = await db.transportRoute.create({
        data: { schoolId: sid || 'default', name, description: description || null, fee: fee || 0, capacity: capacity || 50 },
      })
      return NextResponse.json(route, { status: 201 })
    }

    if (action === 'addVehicle') {
      const { schoolId, registrationNumber, make, model, year, capacity, driverName } = body
      if (!registrationNumber) return NextResponse.json({ error: 'Registration number is required' }, { status: 400 })
      let sid = schoolId
      if (!sid) { const school = await db.school.findFirst(); sid = school?.id }

      const vehicle = await db.vehicle.create({
        data: { schoolId: sid || 'default', registrationNumber, make: make || null, model: model || null, year: year || null, capacity: capacity || null, driverName: driverName || null },
      })
      return NextResponse.json(vehicle, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process transport request:', error)
    return NextResponse.json({ error: 'Failed to process transport request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'route') {
      const route = await db.transportRoute.update({
        where: { id },
        data: { name: updates.name, description: updates.description, fee: updates.fee, capacity: updates.capacity, isActive: updates.isActive },
      })
      return NextResponse.json(route)
    }

    if (type === 'vehicle') {
      const vehicle = await db.vehicle.update({
        where: { id },
        data: { registrationNumber: updates.registrationNumber, make: updates.make, model: updates.model, driverName: updates.driverName, isActive: updates.isActive },
      })
      return NextResponse.json(vehicle)
    }

    // Default: update assignment
    const assignment = await db.transportAssignment.update({
      where: { id },
      data: { status: updates.status, pickupPoint: updates.pickupPoint, dropoffPoint: updates.dropoffPoint, endDate: updates.status === 'INACTIVE' ? new Date() : undefined },
    })
    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Failed to update transport record:', error)
    return NextResponse.json({ error: 'Failed to update transport record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'route') {
      await db.transportRoute.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'vehicle') {
      await db.vehicle.update({ where: { id }, data: { isActive: false } })
    } else {
      await db.transportAssignment.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete transport record:', error)
    return NextResponse.json({ error: 'Failed to delete transport record' }, { status: 500 })
  }
}
