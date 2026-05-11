import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/events - List events and sports fixtures with type/sport/date filters
export async function GET(request: NextRequest) {
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

    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Build where clause for events
    const where: Record<string, unknown> = { schoolId }
    if (eventType) where.eventType = eventType.toUpperCase()
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { venue: { contains: search } },
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
        sportWhere.name = { contains: sport }
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

    return NextResponse.json({
      data: events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      sportsCodes,
      upcomingEvents,
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch events data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events data' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create event or sports fixture
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Add sports code / fixture
    if (action === 'addSport') {
      const { name, season } = body
      if (!name) {
        return NextResponse.json(
          { error: 'Sport name is required' },
          { status: 400 }
        )
      }

      // Check if sport already exists
      const existing = await db.sportsCode.findFirst({
        where: { schoolId, name },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'A sport with this name already exists' },
          { status: 409 }
        )
      }

      const sport = await db.sportsCode.create({
        data: {
          schoolId,
          name,
          season: season || null,
        },
      })
      return NextResponse.json(sport, { status: 201 })
    }

    // Default: create event / fixture
    const { title, description, eventType, startDate, endDate, venue } = body
    if (!title || !eventType || !startDate) {
      return NextResponse.json(
        { error: 'Title, event type, and start date are required' },
        { status: 400 }
      )
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

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

// PUT /api/events - Update event or sports fixture
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'sport') {
      const sport = await db.sportsCode.update({
        where: { id },
        data: {
          name: updates.name,
          season: updates.season,
          isActive: updates.isActive,
        },
      })
      return NextResponse.json(sport)
    }

    // Update event
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

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to update event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events - Delete event or sports fixture
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'sport') {
      await db.sportsCode.update({ where: { id }, data: { isActive: false } })
    } else {
      await db.schoolEvent.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
