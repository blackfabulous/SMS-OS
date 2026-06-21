import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'

// GET /api/sdc — List SDC members, meetings, projects
// Query params: search, type (member|meeting|project), isActive, page, limit
export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const isActiveStr = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const school = await db.school.findUnique({ where: { id: tenantResult.schoolId } })
    if (!school) {
      return NextResponse.json({ members: [], meetings: [], projects: [], stats: {} })
    }

    // Build member filter
    const memberFilter: Record<string, unknown> = { schoolId: school.id }
    if (search) {
      memberFilter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (isActiveStr !== null) {
      memberFilter.isActive = isActiveStr === 'true'
    }

    // Build event filter
    const eventFilter: Record<string, unknown> = { schoolId: school.id }
    if (search) {
      eventFilter.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ]
    }

    // If type=member, return only members
    if (type === 'member') {
      const [members, memberTotal] = await Promise.all([
        db.sDCMember.findMany({
          where: memberFilter,
          orderBy: { createdAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.sDCMember.count({ where: memberFilter }),
      ])

      return NextResponse.json({
        data: members,
        total: memberTotal,
        page,
        totalPages: Math.ceil(memberTotal / limit),
      })
    }

    // If type=meeting, return only meetings
    if (type === 'meeting') {
      const meetingFilter = { ...eventFilter, eventType: 'MEETING' }
      const [meetings, meetingTotal] = await Promise.all([
        db.schoolEvent.findMany({
          where: meetingFilter,
          orderBy: { startDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.schoolEvent.count({ where: meetingFilter }),
      ])

      return NextResponse.json({
        data: meetings,
        total: meetingTotal,
        page,
        totalPages: Math.ceil(meetingTotal / limit),
      })
    }

    // If type=project, return only projects
    if (type === 'project') {
      const projectFilter = { ...eventFilter, eventType: { in: ['FUNDRAISER', 'PROJECT'] } }
      const [projects, projectTotal] = await Promise.all([
        db.schoolEvent.findMany({
          where: projectFilter,
          orderBy: { startDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.schoolEvent.count({ where: projectFilter }),
      ])

      return NextResponse.json({
        data: projects,
        total: projectTotal,
        page,
        totalPages: Math.ceil(projectTotal / limit),
      })
    }

    // Default: return all SDC data
    const [members, memberTotal] = await Promise.all([
      db.sDCMember.findMany({
        where: memberFilter,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.sDCMember.count({ where: memberFilter }),
    ])

    const totalFunds = await db.feePayment.aggregate({ where: { student: { schoolId: school.id } }, _sum: { amount: true }, _count: true })

    const allEvents = await db.schoolEvent.findMany({
      where: eventFilter,
      orderBy: { startDate: 'desc' },
      take: 100,
    })

    const meetings = allEvents.filter((e) => e.eventType === 'MEETING')
    const projects = allEvents.filter((e) => e.eventType === 'FUNDRAISER' || e.eventType === 'PROJECT')

    const stats = {
      totalMembers: memberTotal,
      activeMembers: await db.sDCMember.count({ where: { schoolId: school.id, isActive: true } }),
      meetingsThisTerm: meetings.length,
      activeProjects: projects.length,
      fundBalance: totalFunds._sum.amount || 0,
      totalPayments: totalFunds._count,
    }

    return NextResponse.json({
      members,
      meetings,
      projects,
      events: allEvents,
      stats,
      schoolInfo: {
        sdcChairperson: school.sdcChairperson,
        sdcSecretary: school.sdcSecretary,
        sdcTreasurer: school.sdcTreasurer,
      },
      pagination: {
        page,
        limit,
        totalMembers: memberTotal,
        totalPages: Math.ceil(memberTotal / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching SDC data:', error)
    return NextResponse.json({ error: 'Failed to fetch SDC data' }, { status: 500 })
  }
}

// POST /api/sdc — Create SDC member or meeting
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  try {
    const body = await request.json()

    if (body.type === 'meeting') {
      if (!body.title || !body.startDate) {
        return NextResponse.json({ error: 'Title and startDate are required' }, { status: 400 })
      }
      const meeting = await db.schoolEvent.create({
        data: {
          schoolId: school.id,
          title: body.title,
          description: body.description || null,
          eventType: 'MEETING',
          startDate: new Date(body.startDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          venue: body.venue || null,
        },
      })
      logAudit({ action: 'CREATE', entity: 'sdc', entityId: (meeting as any)?.id, afterValue: meeting }).catch(() => {})
      return NextResponse.json(meeting, { status: 201 })
    }

    if (body.type === 'project') {
      if (!body.title || !body.startDate) {
        return NextResponse.json({ error: 'Title and startDate are required' }, { status: 400 })
      }
      const project = await db.schoolEvent.create({
        data: {
          schoolId: school.id,
          title: body.title,
          description: body.description || null,
          eventType: body.eventType || 'PROJECT',
          startDate: new Date(body.startDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          venue: body.venue || null,
        },
      })
      logAudit({ action: 'CREATE', entity: 'sdc', entityId: (project as any)?.id, afterValue: project }).catch(() => {})
      return NextResponse.json(project, { status: 201 })
    }

    // Default: add SDC member
    if (!body.name || !body.position) {
      return NextResponse.json({ error: 'Name and position are required' }, { status: 400 })
    }
    const member = await db.sDCMember.create({
      data: {
        schoolId: school.id,
        name: body.name,
        position: body.position,
        phone: body.phone || null,
        email: body.email || null,
        termStart: body.termStart ? new Date(body.termStart) : null,
        termEnd: body.termEnd ? new Date(body.termEnd) : null,
        isActive: true,
      },
    })

    // Sync school SDC officer names
    if (body.position === 'Chairperson') {
      await db.school.update({ where: { id: school.id }, data: { sdcChairperson: body.name } })
    } else if (body.position === 'Secretary') {
      await db.school.update({ where: { id: school.id }, data: { sdcSecretary: body.name } })
    } else if (body.position === 'Treasurer') {
      await db.school.update({ where: { id: school.id }, data: { sdcTreasurer: body.name } })
    }

    logAudit({ action: 'CREATE', entity: 'sdc', entityId: (member as any)?.id, afterValue: member }).catch(() => {})
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating SDC record:', error)
    return NextResponse.json({ error: 'Failed to create SDC record' }, { status: 500 })
  }
}

// PUT /api/sdc — Update SDC member or event
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

    if (type === 'member') {
      const ownedMember = await db.sDCMember.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedMember) return NextResponse.json({ error: 'SDC member not found' }, { status: 404 })
      const member = await db.sDCMember.update({
        where: { id },
        data: {
          name: updates.name,
          position: updates.position,
          phone: updates.phone,
          email: updates.email,
          isActive: updates.isActive,
          termEnd: updates.termEnd ? new Date(updates.termEnd) : undefined,
        },
      })

      // Sync school SDC officer names if position changed (own school only)
      if (updates.position === 'Chairperson' && updates.name) {
        await db.school.update({ where: { id: schoolId }, data: { sdcChairperson: updates.name } })
      } else if (updates.position === 'Secretary' && updates.name) {
        await db.school.update({ where: { id: schoolId }, data: { sdcSecretary: updates.name } })
      } else if (updates.position === 'Treasurer' && updates.name) {
        await db.school.update({ where: { id: schoolId }, data: { sdcTreasurer: updates.name } })
      }

      logAudit({ action: 'UPDATE', entity: 'sdc', entityId: (member as any)?.id, afterValue: member }).catch(() => {})
      return NextResponse.json(member)
    }

    if (type === 'event') {
      const ownedEvent = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedEvent) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      const event = await db.schoolEvent.update({
        where: { id },
        data: {
          title: updates.title,
          description: updates.description,
          venue: updates.venue,
          startDate: updates.startDate ? new Date(updates.startDate) : undefined,
          endDate: updates.endDate ? new Date(updates.endDate) : undefined,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'sdc', entityId: (event as any)?.id, afterValue: event }).catch(() => {})
      return NextResponse.json(event)
    }

    return NextResponse.json({ error: 'Invalid type. Use: member or event' }, { status: 400 })
  } catch (error) {
    console.error('Error updating SDC record:', error)
    return NextResponse.json({ error: 'Failed to update SDC record' }, { status: 500 })
  }
}

// DELETE /api/sdc?id=xxx&type=member|event
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

    // Verify the target belongs to the caller's school before mutating.
    if (type === 'event') {
      const owned = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.schoolEvent.delete({ where: { id } })
    } else {
      const owned = await db.sDCMember.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (type === 'member') {
        await db.sDCMember.update({ where: { id }, data: { isActive: false } })
      } else {
        await db.sDCMember.delete({ where: { id } })
      }
    }

    logAudit({ action: 'DELETE', entity: 'sdc', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Error deleting SDC record:', error)
    return NextResponse.json({ error: 'Failed to delete SDC record' }, { status: 500 })
  }
}
