import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

export async function listEvents(schoolId: string, filters: { eventType?: string; sport?: string; dateFrom?: string | null; dateTo?: string | null; search?: string; upcoming?: string; page: number; limit: number }) {
  const where: Record<string, unknown> = { schoolId }
  if (filters.eventType) where.eventType = filters.eventType.toUpperCase()
  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {}
    if (filters.dateFrom) (where.startDate as Record<string, unknown>).gte = new Date(filters.dateFrom)
    if (filters.dateTo) (where.startDate as Record<string, unknown>).lte = new Date(filters.dateTo)
  }
  if (filters.upcoming) where.startDate = { gte: new Date() }
  if (filters.search) where.title = { contains: filters.search, mode: 'insensitive' }

  const [events, total, sportsCodes] = await Promise.all([
    db.schoolEvent.findMany({ where, orderBy: { startDate: 'asc' }, skip: (filters.page - 1) * filters.limit, take: filters.limit }),
    db.schoolEvent.count({ where }),
    db.sportsCode.findMany({ where: { schoolId, isActive: true }, orderBy: { name: 'asc' } }),
  ])

  const sports = sportsCodes.map((s) => s.name)
  const activeSports = filters.sport ? sportsCodes.filter((s) => s.name.toLowerCase() === filters.sport!.toLowerCase()) : sportsCodes

  return { data: events, total, page: filters.page, totalPages: Math.ceil(total / filters.limit), sports, activeSports }
}

export async function addSchoolEvent(schoolId: string, body: any) {
  if (!body.title || !body.startDate) throw new AppError('VALIDATION', 'title and startDate are required')

  const event = await db.schoolEvent.create({
    data: {
      schoolId,
      title: body.title,
      description: body.description || null,
      eventType: (body.eventType || 'GENERAL').toUpperCase(),
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      venue: body.venue || null,
    },
  })
  logAudit({ action: 'CREATE', entity: 'events', entityId: event.id, schoolId, afterValue: event }).catch(() => {})
  return event
}

export async function addSportsCode(schoolId: string, body: any) {
  if (!body.name) throw new AppError('VALIDATION', 'name is required')

  const sport = await db.sportsCode.create({
    data: { schoolId, name: body.name, season: body.season || null, isActive: body.isActive ?? true },
  })
  logAudit({ action: 'CREATE', entity: 'sports-code', entityId: sport.id, schoolId, afterValue: sport }).catch(() => {})
  return sport
}

export async function updateSportsCode(schoolId: string, id: string, updates: any) {
  const existing = await db.sportsCode.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Sports code not found')

  const sport = await db.sportsCode.update({
    where: { id },
    data: { name: updates.name, season: updates.season, isActive: updates.isActive },
  })
  logAudit({ action: 'UPDATE', entity: 'sports-code', entityId: sport.id, schoolId, afterValue: sport }).catch(() => {})
  return sport
}

export async function updateSchoolEvent(schoolId: string, id: string, updates: any) {
  return updateEvent(schoolId, id, updates)
}

export async function deleteSchoolEvent(schoolId: string, id: string) {
  return deleteEvent(schoolId, id)
}

export async function deleteSportsCode(schoolId: string, id: string) {
  const existing = await db.sportsCode.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Sports code not found')

  await db.sportsCode.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'sports-code', entityId: id, schoolId }).catch(() => {})
  return { message: 'Sports code deleted successfully' }
}

export async function getEvent(schoolId: string, id: string) {
  const event = await db.schoolEvent.findFirst({ where: { id, schoolId } })
  if (!event) throw new AppError('NOT_FOUND', 'Event not found')

  const relatedEvents = await db.schoolEvent.findMany({
    where: { schoolId: event.schoolId, eventType: event.eventType, startDate: { gte: new Date() }, id: { not: id } },
    orderBy: { startDate: 'asc' },
    take: 5,
  })

  return { ...event, relatedEvents }
}

export async function updateEvent(schoolId: string, id: string, body: { title?: string; description?: string; eventType?: string; startDate?: string; endDate?: string | null; venue?: string }) {
  const existing = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Event not found')

  const { title, description, eventType, startDate, endDate, venue } = body
  const event = await db.schoolEvent.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(eventType !== undefined && { eventType: eventType.toUpperCase() }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(venue !== undefined && { venue }),
    },
  })

  logAudit({ action: 'UPDATE', entity: 'events', entityId: event.id, schoolId, afterValue: event }).catch(() => {})
  return event
}

export async function deleteEvent(schoolId: string, id: string) {
  const existing = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Event not found')

  await db.schoolEvent.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'events', entityId: id, schoolId }).catch(() => {})
  return { message: 'Event deleted successfully' }
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
