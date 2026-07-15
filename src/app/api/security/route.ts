import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
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

      return ok({
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

    return ok({
      data: visitors,
      total: visTotal,
      page,
      totalPages: Math.ceil(visTotal / limit),
      stats,
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch security data')
    return fail('INTERNAL', 'Failed to fetch security data')
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
        return fail('VALIDATION', 'Name and purpose are required')
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
      return ok(visitor, 201)
    }

    // Check-out visitor
    if (action === 'checkOut') {
      const { visitorId } = body
      if (!visitorId) {
        return fail('VALIDATION', 'Visitor ID is required')
      }

      // Verify visitor exists and is on campus
      const existing = await db.visitor.findFirst({
        where: { id: visitorId, schoolId, status: 'ON_CAMPUS' },
      })
      if (!existing) {
        return fail('NOT_FOUND', 'Visitor not found or already checked out')
      }

      const visitor = await db.visitor.update({
        where: { id: visitorId },
        data: { checkOutTime: new Date(), status: 'OFF_CAMPUS' },
      })
      logAudit({ action: 'CREATE', entity: 'security', entityId: (visitor as any)?.id, afterValue: visitor }).catch(() => {})
      return ok(visitor)
    }

    // Report security incident
    if (action === 'reportIncident') {
      const { incidentType, location, severity, description, reporter } = body
      if (!incidentType || !description) {
        return fail('VALIDATION', 'Incident type and description are required')
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
      return ok(incident, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use checkIn, checkOut, or reportIncident')
  } catch (error) {
    logger.error({ err: error }, 'Failed to process security request')
    return fail('INTERNAL', 'Failed to process security request')
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
      return fail('VALIDATION', 'ID is required')
    }

    if (type === 'incident') {
      const ownedIncident = await db.securityIncident.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedIncident) return fail('NOT_FOUND', 'Incident not found')
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
      return ok(incident)
    }

    // Update visitor — verify ownership first.
    const ownedVisitor = await db.visitor.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!ownedVisitor) return fail('NOT_FOUND', 'Visitor not found')
    const visitor = await db.visitor.update({
      where: { id },
      data: {
        status: updates.status,
        checkOutTime: updates.status === 'OFF_CAMPUS' ? new Date() : undefined,
      },
    })
    logAudit({ action: 'UPDATE', entity: 'security', entityId: (visitor as any)?.id, afterValue: visitor }).catch(() => {})
    return ok(visitor)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update security record')
    return fail('INTERNAL', 'Failed to update security record')
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
      return fail('VALIDATION', 'ID is required')
    }

    // Verify the target belongs to the caller's school before deleting.
    if (type === 'incident') {
      const owned = await db.securityIncident.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.securityIncident.delete({ where: { id } })
    } else {
      const owned = await db.visitor.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.visitor.delete({ where: { id } })
    }

    logAudit({ action: 'DELETE', entity: 'security', entityId: (id ?? undefined) }).catch(() => {})
    return ok({ message: 'Deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete security record')
    return fail('INTERNAL', 'Failed to delete security record')
  }
}
