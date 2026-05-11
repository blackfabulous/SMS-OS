import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let schoolId: string | undefined
    const school = await db.school.findFirst()
    schoolId = school?.id

    const where: Record<string, unknown> = { schoolId }
    if (eventType) where.eventType = eventType
    if (search) {
      where.OR = [{ title: { contains: search } }, { description: { contains: search } }, { venue: { contains: search } }]
    }

    const [events, total] = await Promise.all([
      db.schoolEvent.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.schoolEvent.count({ where }),
    ])

    // Sports codes
    const sportsCodes = await db.sportsCode.findMany({
      where: { schoolId, isActive: true },
      orderBy: { name: 'asc' },
    })

    // Upcoming events
    const upcomingEvents = await db.schoolEvent.findMany({
      where: { schoolId, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 10,
    })

    const stats = {
      totalEvents: total,
      upcomingEvents: upcomingEvents.length,
      sportsCodes: sportsCodes.length,
      byType: await db.schoolEvent.groupBy({ by: ['eventType'], where: { schoolId }, _count: { id: true } }),
    }

    return NextResponse.json({ data: events, total, page, totalPages: Math.ceil(total / limit), sportsCodes, upcomingEvents, stats })
  } catch (error) {
    console.error('Failed to fetch events data:', error)
    return NextResponse.json({ error: 'Failed to fetch events data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    if (action === 'addSport') {
      const { name, season } = body
      if (!name) return NextResponse.json({ error: 'Sport name is required' }, { status: 400 })

      const sport = await db.sportsCode.create({
        data: { schoolId: schoolId || 'default', name, season: season || null },
      })
      return NextResponse.json(sport, { status: 201 })
    }

    // Default: add event
    const { title, description, eventType, startDate, endDate, venue } = body
    if (!title || !eventType || !startDate) return NextResponse.json({ error: 'Title, event type, and start date are required' }, { status: 400 })

    const event = await db.schoolEvent.create({
      data: {
        schoolId: schoolId || 'default', title, description: description || null,
        eventType, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, venue: venue || null,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'sport') {
      const sport = await db.sportsCode.update({
        where: { id },
        data: { name: updates.name, season: updates.season, isActive: updates.isActive },
      })
      return NextResponse.json(sport)
    }

    const event = await db.schoolEvent.update({
      where: { id },
      data: {
        title: updates.title, description: updates.description,
        eventType: updates.eventType, venue: updates.venue,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to update event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'sport') {
      await db.sportsCode.update({ where: { id }, data: { isActive: false } })
    } else {
      await db.schoolEvent.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
