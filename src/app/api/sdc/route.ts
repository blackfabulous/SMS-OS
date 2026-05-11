import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const school = await db.school.findFirst()
    if (!school) {
      return NextResponse.json({ members: [], meetings: [], projects: [], stats: {} })
    }

    // SDC Members
    const members = await db.sDCMember.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'asc' },
    })

    // SDC fund summary - use fee payments as proxy for fund tracking
    const totalFunds = await db.feePayment.aggregate({
      _sum: { amount: true },
      _count: true,
    })

    // Active projects count (simulated from events)
    const activeEvents = await db.schoolEvent.findMany({
      where: { schoolId: school.id },
      orderBy: { startDate: 'desc' },
      take: 10,
    })

    // Stats
    const stats = {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.isActive).length,
      meetingsThisTerm: activeEvents.filter((e) => e.eventType === 'MEETING').length,
      activeProjects: activeEvents.filter((e) => e.eventType === 'FUNDRAISER' || e.eventType === 'PROJECT').length,
      fundBalance: totalFunds._sum.amount || 0,
    }

    return NextResponse.json({
      members,
      meetings: activeEvents.filter((e) => e.eventType === 'MEETING'),
      projects: activeEvents.filter((e) => e.eventType === 'FUNDRAISER' || e.eventType === 'PROJECT'),
      events: activeEvents,
      stats,
      schoolInfo: {
        sdcChairperson: school.sdcChairperson,
        sdcSecretary: school.sdcSecretary,
        sdcTreasurer: school.sdcTreasurer,
      },
    })
  } catch (error) {
    console.error('Error fetching SDC data:', error)
    return NextResponse.json({ error: 'Failed to fetch SDC data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const school = await db.school.findFirst()

    if (!school) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    if (body.type === 'meeting') {
      const meeting = await db.schoolEvent.create({
        data: {
          schoolId: school.id,
          title: body.title,
          description: body.description,
          eventType: 'MEETING',
          startDate: new Date(body.startDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          venue: body.venue,
        },
      })
      return NextResponse.json(meeting, { status: 201 })
    }

    if (body.type === 'project') {
      const project = await db.schoolEvent.create({
        data: {
          schoolId: school.id,
          title: body.title,
          description: body.description,
          eventType: 'PROJECT',
          startDate: new Date(body.startDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          venue: body.venue,
        },
      })
      return NextResponse.json(project, { status: 201 })
    }

    // Default: add SDC member
    const member = await db.sDCMember.create({
      data: {
        schoolId: school.id,
        name: body.name,
        position: body.position,
        phone: body.phone,
        email: body.email,
        termStart: body.termStart ? new Date(body.termStart) : null,
        termEnd: body.termEnd ? new Date(body.termEnd) : null,
        isActive: true,
      },
    })

    // Update school SDC positions if chairperson/secretary/treasurer
    if (body.position === 'Chairperson') {
      await db.school.update({ where: { id: school.id }, data: { sdcChairperson: body.name } })
    } else if (body.position === 'Secretary') {
      await db.school.update({ where: { id: school.id }, data: { sdcSecretary: body.name } })
    } else if (body.position === 'Treasurer') {
      await db.school.update({ where: { id: school.id }, data: { sdcTreasurer: body.name } })
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating SDC record:', error)
    return NextResponse.json({ error: 'Failed to create SDC record' }, { status: 500 })
  }
}
