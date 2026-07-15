import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'

// GET /api/events - List events and sports fixtures with type/sport/date filters
export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error
  const { schoolId } = tenantResult

  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType') // HOLIDAY, CULTURAL, ACADEMIC, SPORTS, MEETING, CEREMONY, RELIGIOUS, SOCIAL
    const sport = searchParams.get('sport') // sports code id or name
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search') || ''
    const upcoming = searchParams.get('upcoming') // 'true' for upcoming events only
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause for events
    const where: Record<string, unknown> = { schoolId }
    if (eventType) where.eventType = eventType.toUpperCase()
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.startDate = dateFilter
    }
    if (upcoming === 'true') {
      where.startDate = { gte: new Date() }
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

    // Sports codes / fixtures
    const sportWhere: Record<string, unknown> = { schoolId, isActive: true }
    if (sport) {
      // If sport is a name, look up by name
      if (isNaN(Number(sport)) && !sport.startsWith('c')) {
        sportWhere.name = { contains: sport, mode: 'insensitive' }
      } else {
        sportWhere.id = sport
      }
    }

    const sportsCodes = await db.sportsCode.findMany({
      where: sportWhere,
      orderBy: { name: 'asc' },
    })

    // Upcoming events for dashboard
    const upcomingEvents = await db.schoolEvent.findMany({
      where: { schoolId, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 10,
    })

    // Event statistics
    const eventTypeBreakdown = await db.schoolEvent.groupBy({
      by: ['eventType'],
      where: { schoolId },
      _count: { id: true },
    })

    const stats = {
      totalEvents: total,
      upcomingEvents: upcomingEvents.length,
      sportsCodes: sportsCodes.length,
      byType: eventTypeBreakdown.map((t) => ({
        type: t.eventType,
        count: t._count.id,
      })),
      thisMonth: await db.schoolEvent.count({
        where: {
          schoolId,
          startDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
      }),
    }

    return ok({
      data: events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      sportsCodes,
      upcomingEvents,
      stats,
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch events data')
    return fail('INTERNAL', 'Failed to fetch events data')
  }
}

// POST /api/events - Create event or sports fixture
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action } = body

    // Add sports code / fixture
    if (action === 'addSport') {
      const { name, season } = body
      if (!name) {
        return fail('VALIDATION', 'Sport name is required')
      }

      // Check if sport already exists
      const existing = await db.sportsCode.findFirst({
        where: { schoolId, name },
      })
      if (existing) {
        return fail('CONFLICT', 'A sport with this name already exists')
      }

      const sport = await db.sportsCode.create({
        data: {
          schoolId,
          name,
          season: season || null,
        },
      })
      logAudit({ action: 'CREATE', entity: 'events', entityId: (sport as any)?.id, afterValue: sport }).catch(() => {})
      return ok(sport, 201)
    }

    // Default: create event / fixture
    const { title, description, eventType, startDate, endDate, venue } = body
    if (!title || !eventType || !startDate) {
      return fail('VALIDATION', 'Title, event type, and start date are required')
    }

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

    logAudit({ action: 'CREATE', entity: 'events', entityId: (event as any)?.id, afterValue: event }).catch(() => {})
    return ok(event, 201)
  } catch (error) {
    logger.error({ err: error }, 'Failed to create event')
    return fail('INTERNAL', 'Failed to create event')
  }
}

// PUT /api/events - Update event or sports fixture
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }

    if (type === 'sport') {
      // Verify the sports code belongs to the caller's school before mutating.
      const ownedSport = await db.sportsCode.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedSport) return fail('NOT_FOUND', 'Sports code not found')

      const sport = await db.sportsCode.update({
        where: { id },
        data: {
          name: updates.name,
          season: updates.season,
          isActive: updates.isActive,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'events', entityId: (sport as any)?.id, afterValue: sport }).catch(() => {})
      return ok(sport)
    }

    // Update event — verify it belongs to the caller's school first.
    const ownedEvent = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!ownedEvent) return fail('NOT_FOUND', 'Event not found')

    const event = await db.schoolEvent.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        eventType: updates.eventType,
        venue: updates.venue,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      },
    })

    logAudit({ action: 'UPDATE', entity: 'events', entityId: (event as any)?.id, afterValue: event }).catch(() => {})
    return ok(event)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update event')
    return fail('INTERNAL', 'Failed to update event')
  }
}

// DELETE /api/events - Delete event or sports fixture
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

    if (type === 'sport') {
      await db.sportsCode.update({ where: { id }, data: { isActive: false } })
    } else {
      await db.schoolEvent.delete({ where: { id } })
    }

    logAudit({ action: 'DELETE', entity: 'events', entityId: (id ?? undefined) }).catch(() => {})
    return ok({ message: 'Deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete event')
    return fail('INTERNAL', 'Failed to delete event')
  }
}
