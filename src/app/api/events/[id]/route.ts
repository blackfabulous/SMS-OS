import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/events/[id] - Get a single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { id } = await params
    const event = await db.schoolEvent.findFirst({
      where: { id, schoolId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get related upcoming events (same type, future dates, different id)
    const relatedEvents = await db.schoolEvent.findMany({
      where: {
        schoolId: event.schoolId,
        eventType: event.eventType,
        startDate: { gte: new Date() },
        id: { not: id },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    })

    return NextResponse.json({ ...event, relatedEvents })
  } catch (error) {
    console.error('Failed to fetch event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, eventType, startDate, endDate, venue } = body

    // Verify the event belongs to the caller's school before updating
    const existing = await db.schoolEvent.findFirst({
      where: { id, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

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

    logAudit({ action: 'UPDATE', entity: 'events', entityId: (event as any)?.id, afterValue: event }).catch(() => {})
    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to update event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params

    // Verify the event belongs to the caller's school before deleting
    const existing = await db.schoolEvent.findFirst({
      where: { id, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await db.schoolEvent.delete({
      where: { id },
    })

    logAudit({ action: 'DELETE', entity: 'events', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Failed to delete event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
