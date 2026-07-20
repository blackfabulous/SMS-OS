import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  eventType?: string
  sport?: string
  dateFrom?: string | null
  dateTo?: string | null
  search?: string
  upcoming?: string
  page?: number
  limit?: number
}

export async function listEvents(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const eventType = params.eventType
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo
  const upcoming = params.upcoming

  const where: Record<string, unknown> = { schoolId }
  if (eventType) where.eventType = eventType.toUpperCase()
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { venue: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (upcoming === 'true') {
    where.startDate = { gte: new Date() }
  } else if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    where.startDate = dateFilter
  }

  const [events, total] = await Promise.all([
    db.schoolEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      skip,
      take: limit,
    }),
    db.schoolEvent.count({ where }),
  ])

  const sport = params.sport
  const sportWhere: Record<string, unknown> = { schoolId, isActive: true }
  if (sport) {
    if (isNaN(Number(sport)) && !sport.startsWith('c')) {
      sportWhere.name = { contains: sport, mode: 'insensitive' }
    } else {
      sportWhere.id = sport
    }
  }

  const [sportsCodes, upcomingEvents] = await Promise.all([
    db.sportsCode.findMany({ where: sportWhere, orderBy: { name: 'asc' } }),
    db.schoolEvent.findMany({
      where: { schoolId, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 10,
    }),
  ])

  const eventTypeBreakdown = await db.schoolEvent.groupBy({
    by: ['eventType'],
    where: { schoolId },
    _count: { id: true },
  })

  const today = new Date()
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const thisMonth = await db.schoolEvent.count({
    where: {
      schoolId,
      startDate: {
        gte: thisMonthStart,
        lt: nextMonthStart,
      },
    },
  })

  return {
    data: events,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    sportsCodes,
    upcomingEvents,
    stats: {
      totalEvents: total,
      upcomingEvents: upcomingEvents.length,
      sportsCodes: sportsCodes.length,
      byType: eventTypeBreakdown.map((t) => ({ type: t.eventType, count: t._count.id })),
      thisMonth,
    },
  }
}

export async function addSportsCode(schoolId: string, body: { name?: string; season?: string }) {
  const { name, season } = body
  if (!name) throw new AppError('VALIDATION', 'Sport name is required')

  const existing = await db.sportsCode.findFirst({ where: { schoolId, name } })
  if (existing) throw new AppError('CONFLICT', 'A sport with this name already exists')

  const sport = await db.sportsCode.create({
    data: { schoolId, name, season: season || null },
  })

  logAudit({ action: 'CREATE', entity: 'events', entityId: sport.id, schoolId, afterValue: sport }).catch(() => {})
  return sport
}

export async function addSchoolEvent(
  schoolId: string,
  body: { title?: string; description?: string; eventType?: string; startDate?: string; endDate?: string; venue?: string },
) {
  const { title, description, eventType, startDate, endDate, venue } = body
  if (!title || !eventType || !startDate) throw new AppError('VALIDATION', 'Title, event type, and start date are required')

  const event = await db.schoolEvent.create({
    data: {
      schoolId,
      title,
      description: description || null,
      eventType: eventType.toUpperCase(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      venue: venue || null,
    },
  })

  logAudit({ action: 'CREATE', entity: 'events', entityId: event.id, schoolId, afterValue: event }).catch(() => {})
  return event
}

export async function updateSportsCode(schoolId: string, id: string, updates: Record<string, unknown>) {
  const ownedSport = await db.sportsCode.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!ownedSport) throw new AppError('NOT_FOUND', 'Sports code not found')

  const sport = await db.sportsCode.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      season: updates.season as string | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'events', entityId: sport.id, schoolId, afterValue: sport }).catch(() => {})
  return sport
}

export async function updateSchoolEvent(schoolId: string, id: string, updates: Record<string, unknown>) {
  const ownedEvent = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!ownedEvent) throw new AppError('NOT_FOUND', 'Event not found')

  const event = await db.schoolEvent.update({
    where: { id },
    data: {
      title: updates.title as string | undefined,
      description: updates.description as string | undefined,
      eventType: updates.eventType as string | undefined,
      venue: updates.venue as string | undefined,
      startDate: updates.startDate ? new Date(updates.startDate as string) : undefined,
      endDate: updates.endDate ? new Date(updates.endDate as string) : undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'events', entityId: event.id, schoolId, afterValue: event }).catch(() => {})
  return event
}

export async function deleteSportsCode(schoolId: string, id: string) {
  const owned = await db.sportsCode.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Sports code not found')

  const sport = await db.sportsCode.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'events', entityId: id, schoolId, afterValue: sport }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteSchoolEvent(schoolId: string, id: string) {
  const owned = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Event not found')

  await db.schoolEvent.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'events', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleEventsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
