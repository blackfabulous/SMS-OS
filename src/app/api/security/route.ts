import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'

// GET /api/security - List visitors, access points, incidents with status/type filters
export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error
  const { schoolId } = tenantResult

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // visitors | incidents | accessPoints
    const status = searchParams.get('status')
    const incidentType = searchParams.get('incidentType')
    const severity = searchParams.get('severity')
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Incidents list
    if (type === 'incidents') {
      const incWhere: Record<string, unknown> = { schoolId }
      if (status) incWhere.status = status.toUpperCase()
      if (incidentType) incWhere.incidentType = incidentType
      if (severity) incWhere.severity = severity.toUpperCase()
      if (search) {
        incWhere.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { reporter: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {}
        if (dateFrom) dateFilter.gte = new Date(dateFrom)
        if (dateTo) dateFilter.lte = new Date(dateTo)
        incWhere.createdAt = dateFilter
      }

      const [incidents, incTotal] = await Promise.all([
        db.securityIncident.findMany({
          where: incWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.securityIncident.count({ where: incWhere }),
      ])

      const incidentStats = {
        total: incTotal,
        open: await db.securityIncident.count({ where: { schoolId, status: 'OPEN' } }),
        investigating: await db.securityIncident.count({ where: { schoolId, status: 'INVESTIGATING' } }),
        resolved: await db.securityIncident.count({ where: { schoolId, status: 'RESOLVED' } }),
        closed: await db.securityIncident.count({ where: { schoolId, status: 'CLOSED' } }),
        critical: await db.securityIncident.count({ where: { schoolId, severity: 'CRITICAL' } }),
        high: await db.securityIncident.count({ where: { schoolId, severity: 'HIGH' } }),
      }

      return NextResponse.json({
        data: incidents,
        total: incTotal,
        page,
        totalPages: Math.ceil(incTotal / limit),
        stats: incidentStats,
      })
    }

    // Default: visitors list
    const visWhere: Record<string, unknown> = { schoolId }
    if (status) visWhere.status = status.toUpperCase()
    if (search) {
      visWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { hostPerson: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
        { vehicleReg: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      visWhere.checkInTime = dateFilter
    }

    const [visitors, visTotal] = await Promise.all([
      db.visitor.findMany({
        where: visWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.visitor.count({ where: visWhere }),
    ])

    // Security stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const stats = {
      visitorsToday: await db.visitor.count({
        where: { schoolId, checkInTime: { gte: todayStart } },
      }),
      currentlyOnCampus: await db.visitor.count({
        where: { schoolId, status: 'ON_CAMPUS' },
      }),
      incidentsThisMonth: await db.securityIncident.count({
        where: { schoolId, createdAt: { gte: todayStart } },
      }),
      openIncidents: await db.securityIncident.count({
        where: { schoolId, status: 'OPEN' } ,
      }),
      totalVisitors: visTotal,
    }

    return NextResponse.json({
      data: visitors,
      total: visTotal,
      page,
      totalPages: Math.ceil(visTotal / limit),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch security data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}

// POST /api/security - Register visitor, report incident, check-in/check-out
export async function POST(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action } = body

    // Register visitor / Check-in
    if (action === 'checkIn' || action === 'registerVisitor') {
      const { name, idNumber, purpose, hostPerson, vehicleReg, phone } = body
      if (!name || !purpose) {
        return NextResponse.json(
          { error: 'Name and purpose are required' },
          { status: 400 }
        )
      }

      const visitor = await db.visitor.create({
        data: {
          schoolId,
          name,
          idNumber: idNumber || null,
          purpose,
          hostPerson: hostPerson || null,
          vehicleReg: vehicleReg || null,
          phone: phone || null,
          status: 'ON_CAMPUS',
        },
      })
      logAudit({ action: 'CREATE', entity: 'security', entityId: (visitor as any)?.id, afterValue: visitor }).catch(() => {})
      return NextResponse.json(visitor, { status: 201 })
    }

    // Check-out visitor
    if (action === 'checkOut') {
      const { visitorId } = body
      if (!visitorId) {
        return NextResponse.json(
          { error: 'Visitor ID is required' },
          { status: 400 }
        )
      }

      // Verify visitor exists and is on campus
      const existing = await db.visitor.findFirst({
        where: { id: visitorId, schoolId, status: 'ON_CAMPUS' },
      })
      if (!existing) {
        return NextResponse.json(
          { error: 'Visitor not found or already checked out' },
          { status: 404 }
        )
      }

      const visitor = await db.visitor.update({
        where: { id: visitorId },
        data: { checkOutTime: new Date(), status: 'OFF_CAMPUS' },
      })
      logAudit({ action: 'CREATE', entity: 'security', entityId: (visitor as any)?.id, afterValue: visitor }).catch(() => {})
      return NextResponse.json(visitor)
    }

    // Report security incident
    if (action === 'reportIncident') {
      const { incidentType, location, severity, description, reporter } = body
      if (!incidentType || !description) {
        return NextResponse.json(
          { error: 'Incident type and description are required' },
          { status: 400 }
        )
      }

      const incident = await db.securityIncident.create({
        data: {
          schoolId,
          incidentType,
          location: location || null,
          severity: severity || 'LOW',
          description,
          reporter: reporter || null,
          status: 'OPEN',
        },
      })
      logAudit({ action: 'CREATE', entity: 'security', entityId: (incident as any)?.id, afterValue: incident }).catch(() => {})
      return NextResponse.json(incident, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use checkIn, checkOut, or reportIncident' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to process security request:', error)
    return NextResponse.json(
      { error: 'Failed to process security request' },
      { status: 500 }
    )
  }
}

// PUT /api/security - Update visitor or incident
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'incident') {
      const ownedIncident = await db.securityIncident.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedIncident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
      const incident = await db.securityIncident.update({
        where: { id },
        data: {
          status: updates.status,
          resolution: updates.resolution,
          severity: updates.severity,
          location: updates.location,
          description: updates.description,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'security', entityId: (incident as any)?.id, afterValue: incident }).catch(() => {})
      return NextResponse.json(incident)
    }

    // Update visitor — verify ownership first.
    const ownedVisitor = await db.visitor.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!ownedVisitor) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    const visitor = await db.visitor.update({
      where: { id },
      data: {
        status: updates.status,
        checkOutTime: updates.status === 'OFF_CAMPUS' ? new Date() : undefined,
      },
    })
    logAudit({ action: 'UPDATE', entity: 'security', entityId: (visitor as any)?.id, afterValue: visitor }).catch(() => {})
    return NextResponse.json(visitor)
  } catch (error) {
    console.error('Failed to update security record:', error)
    return NextResponse.json(
      { error: 'Failed to update security record' },
      { status: 500 }
    )
  }
}

// DELETE /api/security - Delete visitor or incident record
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify the target belongs to the caller's school before deleting.
    if (type === 'incident') {
      const owned = await db.securityIncident.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.securityIncident.delete({ where: { id } })
    } else {
      const owned = await db.visitor.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.visitor.delete({ where: { id } })
    }

    logAudit({ action: 'DELETE', entity: 'security', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete security record:', error)
    return NextResponse.json(
      { error: 'Failed to delete security record' },
      { status: 500 }
    )
  }
}
