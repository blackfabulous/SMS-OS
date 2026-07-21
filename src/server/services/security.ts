import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  type?: string | null
  status?: string | null
  incidentType?: string | null
  severity?: string | null
  search?: string
  dateFrom?: string | null
  dateTo?: string | null
  page?: number
  limit?: number
}

export async function listSecurity(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const status = params.status
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo

  if (params.type === 'incidents') {
    const incWhere: Record<string, unknown> = { schoolId }
    if (status) incWhere.status = status.toUpperCase()
    if (params.incidentType) incWhere.incidentType = params.incidentType
    if (params.severity) incWhere.severity = params.severity.toUpperCase()
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

    const [incidents, incTotal, open, investigating, resolved, closed, critical, high] = await Promise.all([
      db.securityIncident.findMany({
        where: incWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.securityIncident.count({ where: incWhere }),
      db.securityIncident.count({ where: { schoolId, status: 'OPEN' } }),
      db.securityIncident.count({ where: { schoolId, status: 'INVESTIGATING' } }),
      db.securityIncident.count({ where: { schoolId, status: 'RESOLVED' } }),
      db.securityIncident.count({ where: { schoolId, status: 'CLOSED' } }),
      db.securityIncident.count({ where: { schoolId, severity: 'CRITICAL' } }),
      db.securityIncident.count({ where: { schoolId, severity: 'HIGH' } }),
    ])

    return {
      data: incidents,
      total: incTotal,
      page,
      totalPages: Math.ceil(incTotal / limit),
      stats: {
        total: incTotal,
        open,
        investigating,
        resolved,
        closed,
        critical,
        high,
      },
    }
  }

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

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [visitorsToday, currentlyOnCampus, incidentsThisMonth, openIncidents] = await Promise.all([
    db.visitor.count({ where: { schoolId, checkInTime: { gte: todayStart } } }),
    db.visitor.count({ where: { schoolId, status: 'ON_CAMPUS' } }),
    db.securityIncident.count({ where: { schoolId, createdAt: { gte: todayStart } } }),
    db.securityIncident.count({ where: { schoolId, status: 'OPEN' } }),
  ])

  return {
    data: visitors,
    total: visTotal,
    page,
    totalPages: Math.ceil(visTotal / limit),
    stats: {
      visitorsToday,
      currentlyOnCampus,
      incidentsThisMonth,
      openIncidents,
      totalVisitors: visTotal,
    },
  }
}

export async function checkInVisitor(
  schoolId: string,
  body: { name?: string; idNumber?: string; purpose?: string; hostPerson?: string; vehicleReg?: string; phone?: string },
) {
  const { name, idNumber, purpose, hostPerson, vehicleReg, phone } = body
  if (!name || !purpose) throw new AppError('VALIDATION', 'Name and purpose are required')

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

  logAudit({ action: 'CREATE', entity: 'security', entityId: visitor.id, schoolId, afterValue: visitor }).catch(
    () => {},
  )
  return visitor
}

export async function checkOutVisitor(schoolId: string, visitorId?: string) {
  if (!visitorId) throw new AppError('VALIDATION', 'Visitor ID is required')

  const existing = await db.visitor.findFirst({ where: { id: visitorId, schoolId, status: 'ON_CAMPUS' } })
  if (!existing) throw new AppError('NOT_FOUND', 'Visitor not found or already checked out')

  const visitor = await db.visitor.update({
    where: { id: visitorId },
    data: { checkOutTime: new Date(), status: 'OFF_CAMPUS' },
  })

  logAudit({ action: 'UPDATE', entity: 'security', entityId: visitor.id, schoolId, afterValue: visitor }).catch(
    () => {},
  )
  return visitor
}

export async function reportSecurityIncident(
  schoolId: string,
  body: { incidentType?: string; location?: string; severity?: string; description?: string; reporter?: string },
) {
  const { incidentType, location, severity, description, reporter } = body
  if (!incidentType || !description) throw new AppError('VALIDATION', 'Incident type and description are required')

  const incident = await db.securityIncident.create({
    data: {
      schoolId,
      incidentType,
      location: location || null,
      severity: (severity as any) || 'LOW',
      description,
      reporter: reporter || null,
      status: 'OPEN',
    },
  })

  logAudit({ action: 'CREATE', entity: 'security', entityId: incident.id, schoolId, afterValue: incident }).catch(
    () => {},
  )
  return incident
}

export async function updateSecurityIncident(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.securityIncident.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Incident not found')

  const incident = await db.securityIncident.update({
    where: { id },
    data: {
      status: updates.status as any,
      resolution: updates.resolution as string | undefined,
      severity: updates.severity as any,
      location: updates.location as string | undefined,
      description: updates.description as string | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'security', entityId: incident.id, schoolId, afterValue: incident }).catch(
    () => {},
  )
  return incident
}

export async function updateVisitor(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.visitor.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Visitor not found')

  const status = updates.status as any
  const visitor = await db.visitor.update({
    where: { id },
    data: {
      status,
      checkOutTime: status === 'OFF_CAMPUS' ? new Date() : undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'security', entityId: visitor.id, schoolId, afterValue: visitor }).catch(
    () => {},
  )
  return visitor
}

export async function deleteSecurityIncident(schoolId: string, id: string) {
  const owned = await db.securityIncident.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Incident not found')

  await db.securityIncident.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'security', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteVisitor(schoolId: string, id: string) {
  const owned = await db.visitor.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Visitor not found')

  await db.visitor.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'security', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleSecurityError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
