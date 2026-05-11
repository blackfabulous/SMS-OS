import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let schoolId: string | undefined
    const school = await db.school.findFirst()
    schoolId = school?.id

    if (type === 'incidents') {
      const incWhere: Record<string, unknown> = { schoolId }
      if (status) incWhere.status = status
      const [incidents, incTotal] = await Promise.all([
        db.securityIncident.findMany({ where: incWhere, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        db.securityIncident.count({ where: incWhere }),
      ])
      return NextResponse.json({ data: incidents, total: incTotal, page, totalPages: Math.ceil(incTotal / limit) })
    }

    // Default: visitors
    const visWhere: Record<string, unknown> = { schoolId }
    if (status) visWhere.status = status

    const [visitors, visTotal] = await Promise.all([
      db.visitor.findMany({ where: visWhere, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.visitor.count({ where: visWhere }),
    ])

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const stats = {
      visitorsToday: await db.visitor.count({ where: { schoolId, checkInTime: { gte: todayStart } } }),
      currentlyOnCampus: await db.visitor.count({ where: { schoolId, status: 'ON_CAMPUS' } }),
      incidentsThisMonth: await db.securityIncident.count({ where: { schoolId, createdAt: { gte: todayStart } } }),
      openIncidents: await db.securityIncident.count({ where: { schoolId, status: 'OPEN' } }),
    }

    return NextResponse.json({ data: visitors, total: visTotal, page, totalPages: Math.ceil(visTotal / limit), stats })
  } catch (error) {
    console.error('Failed to fetch security data:', error)
    return NextResponse.json({ error: 'Failed to fetch security data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    if (action === 'checkIn') {
      const { name, idNumber, purpose, hostPerson, vehicleReg, phone } = body
      if (!name || !purpose) return NextResponse.json({ error: 'Name and purpose are required' }, { status: 400 })

      const visitor = await db.visitor.create({
        data: { schoolId: schoolId || 'default', name, idNumber: idNumber || null, purpose, hostPerson: hostPerson || null, vehicleReg: vehicleReg || null, phone: phone || null, status: 'ON_CAMPUS' },
      })
      return NextResponse.json(visitor, { status: 201 })
    }

    if (action === 'checkOut') {
      const { visitorId } = body
      if (!visitorId) return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 })

      const visitor = await db.visitor.update({
        where: { id: visitorId },
        data: { checkOutTime: new Date(), status: 'OFF_CAMPUS' },
      })
      return NextResponse.json(visitor)
    }

    if (action === 'reportIncident') {
      const { incidentType, location, severity, description, reporter } = body
      if (!incidentType || !description) return NextResponse.json({ error: 'Incident type and description are required' }, { status: 400 })

      const incident = await db.securityIncident.create({
        data: { schoolId: schoolId || 'default', incidentType, location: location || null, severity: severity || 'LOW', description, reporter: reporter || null, status: 'OPEN' },
      })
      return NextResponse.json(incident, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process security request:', error)
    return NextResponse.json({ error: 'Failed to process security request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'incident') {
      const incident = await db.securityIncident.update({
        where: { id },
        data: { status: updates.status, resolution: updates.resolution, severity: updates.severity },
      })
      return NextResponse.json(incident)
    }

    const visitor = await db.visitor.update({
      where: { id },
      data: { status: updates.status, checkOutTime: updates.status === 'OFF_CAMPUS' ? new Date() : undefined },
    })
    return NextResponse.json(visitor)
  } catch (error) {
    console.error('Failed to update security record:', error)
    return NextResponse.json({ error: 'Failed to update security record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'incident') {
      await db.securityIncident.delete({ where: { id } })
    } else {
      await db.visitor.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete security record:', error)
    return NextResponse.json({ error: 'Failed to delete security record' }, { status: 500 })
  }
}
