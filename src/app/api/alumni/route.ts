import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const graduationYear = searchParams.get('graduationYear')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let schoolId: string | undefined
    const school = await db.school.findFirst()
    schoolId = school?.id

    const where: Record<string, unknown> = { schoolId, isActive: true }
    if (graduationYear) where.graduationYear = parseInt(graduationYear)
    if (location) where.location = { contains: location }
    if (search) {
      where.OR = [
        { firstName: { contains: search } }, { lastName: { contains: search } },
        { email: { contains: search } }, { occupation: { contains: search } }, { company: { contains: search } },
      ]
    }

    const [alumni, total] = await Promise.all([
      db.alumni.findMany({
        where,
        include: { contributions: { orderBy: { date: 'desc' }, take: 5 } },
        orderBy: { lastName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.alumni.count({ where }),
    ])

    const stats = {
      totalAlumni: await db.alumni.count({ where: { schoolId, isActive: true } }),
      totalContributions: (await db.alumniContribution.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
      notableAlumni: await db.alumni.count({ where: { schoolId, isNotable: true } }),
      byDecade: await db.alumni.groupBy({ by: ['graduationYear'], where: { schoolId, isActive: true }, _count: { id: true }, orderBy: { graduationYear: 'asc' } }),
    }

    return NextResponse.json({ data: alumni, total, page, totalPages: Math.ceil(total / limit), stats })
  } catch (error) {
    console.error('Failed to fetch alumni data:', error)
    return NextResponse.json({ error: 'Failed to fetch alumni data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    if (action === 'addContribution') {
      const { alumniId, amount, contributionType, description, campaign, date } = body
      if (!alumniId || !amount) return NextResponse.json({ error: 'Alumni ID and amount are required' }, { status: 400 })

      const contribution = await db.alumniContribution.create({
        data: { alumniId, amount, contributionType: contributionType || 'DONATION', description: description || null, campaign: campaign || null, date: date ? new Date(date) : new Date() },
      })

      // Update alumni total contributions
      await db.alumni.update({ where: { id: alumniId }, data: { totalContributions: { increment: amount } } })

      return NextResponse.json(contribution, { status: 201 })
    }

    // Default: add alumni
    const { firstName, lastName, graduationYear, email, phone, occupation, company, location, isNotable } = body
    if (!firstName || !lastName || !graduationYear) return NextResponse.json({ error: 'First name, last name, and graduation year are required' }, { status: 400 })

    const alumniRecord = await db.alumni.create({
      data: {
        schoolId: schoolId || 'default', firstName, lastName,
        graduationYear: parseInt(String(graduationYear)), email: email || null,
        phone: phone || null, occupation: occupation || null,
        company: company || null, location: location || null,
        isNotable: isNotable || false,
      },
    })

    return NextResponse.json(alumniRecord, { status: 201 })
  } catch (error) {
    console.error('Failed to create alumni record:', error)
    return NextResponse.json({ error: 'Failed to create alumni record' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const alumniRecord = await db.alumni.update({
      where: { id },
      data: {
        firstName: updates.firstName, lastName: updates.lastName,
        graduationYear: updates.graduationYear ? parseInt(String(updates.graduationYear)) : undefined,
        email: updates.email, phone: updates.phone, occupation: updates.occupation,
        company: updates.company, location: updates.location, isNotable: updates.isNotable, isActive: updates.isActive,
      },
    })

    return NextResponse.json(alumniRecord)
  } catch (error) {
    console.error('Failed to update alumni record:', error)
    return NextResponse.json({ error: 'Failed to update alumni record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await db.alumni.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Alumni record deleted successfully' })
  } catch (error) {
    console.error('Failed to delete alumni record:', error)
    return NextResponse.json({ error: 'Failed to delete alumni record' }, { status: 500 })
  }
}
