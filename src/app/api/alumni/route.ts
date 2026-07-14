import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'

// GET /api/alumni - List alumni with graduation year, location, search filters
export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error
  const { schoolId } = tenantResult

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const graduationYear = searchParams.get('graduationYear')
    const location = searchParams.get('location')
    const occupation = searchParams.get('occupation')
    const isNotable = searchParams.get('isNotable')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { schoolId, isActive: true }
    if (graduationYear) where.graduationYear = parseInt(graduationYear)
    if (location) where.location = { contains: location, mode: 'insensitive' }
    if (occupation) where.occupation = { contains: occupation, mode: 'insensitive' }
    if (isNotable === 'true') where.isNotable = true
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [alumni, total] = await Promise.all([
      db.alumni.findMany({
        where,
        include: { contributions: { orderBy: { date: 'desc' }, take: 5 } },
        orderBy: { lastName: 'asc' },
        skip,
        take: limit,
      }),
      db.alumni.count({ where }),
    ])

    // Alumni statistics
    const totalContributions = await db.alumniContribution.aggregate({
      where: { alumni: { schoolId } },
      _sum: { amount: true },
    })

    const notableCount = await db.alumni.count({
      where: { schoolId, isNotable: true, isActive: true },
    })

    const byGraduationYear = await db.alumni.groupBy({
      by: ['graduationYear'],
      where: { schoolId, isActive: true },
      _count: { id: true },
      orderBy: { graduationYear: 'asc' },
    })

    const byLocation = await db.alumni.groupBy({
      by: ['location'],
      where: { schoolId, isActive: true, location: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    const stats = {
      totalAlumni: total,
      totalContributions: Number(totalContributions._sum.amount ?? 0),
      notableAlumni: notableCount,
      byGraduationYear: byGraduationYear.map((g) => ({
        year: g.graduationYear,
        count: g._count.id,
      })),
      byLocation: byLocation.slice(0, 10).map((l) => ({
        location: l.location,
        count: l._count.id,
      })),
    }

    return NextResponse.json({
      data: alumni,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch alumni data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alumni data' },
      { status: 500 }
    )
  }
}

// POST /api/alumni - Create alumni record
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult
  const schoolId = session.user.schoolId

  try {
    const body = await request.json()
    const { action } = body

    // Add contribution to existing alumni
    if (action === 'addContribution') {
      const { alumniId, amount, contributionType, description, campaign, date } = body
      if (!alumniId || !amount) {
        return NextResponse.json(
          { error: 'Alumni ID and amount are required' },
          { status: 400 }
        )
      }

      // Verify the alumnus belongs to the caller's school before writing.
      const ownedAlumni = await db.alumni.findFirst({ where: { id: alumniId, schoolId }, select: { id: true } })
      if (!ownedAlumni) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 })

      const contribution = await db.alumniContribution.create({
        data: {
          schoolId,
          alumniId,
          amount,
          contributionType: contributionType || 'DONATION',
          description: description || null,
          campaign: campaign || null,
          date: date ? new Date(date) : new Date(),
        },
      })

      // Update alumni total contributions
      await db.alumni.update({
        where: { id: alumniId },
        data: { totalContributions: { increment: amount } },
      })

      logAudit({ action: 'CREATE', entity: 'alumni', entityId: (contribution as any)?.id, afterValue: contribution }).catch(() => {})
      return NextResponse.json(contribution, { status: 201 })
    }

    // Default: create alumni record
    const {
      firstName,
      lastName,
      graduationYear,
      email,
      phone,
      occupation,
      company,
      location,
      isNotable,
    } = body

    if (!firstName || !lastName || !graduationYear) {
      return NextResponse.json(
        { error: 'First name, last name, and graduation year are required' },
        { status: 400 }
      )
    }

    const alumniRecord = await db.alumni.create({
      data: {
        schoolId,
        firstName,
        lastName,
        graduationYear: parseInt(String(graduationYear)),
        email: email || null,
        phone: phone || null,
        occupation: occupation || null,
        company: company || null,
        location: location || null,
        isNotable: isNotable || false,
      },
      include: { contributions: true },
    })

    logAudit({ action: 'CREATE', entity: 'alumni', entityId: (alumniRecord as any)?.id, afterValue: alumniRecord }).catch(() => {})
    return NextResponse.json(alumniRecord, { status: 201 })
  } catch (error) {
    console.error('Failed to create alumni record:', error)
    return NextResponse.json(
      { error: 'Failed to create alumni record' },
      { status: 500 }
    )
  }
}

// PUT /api/alumni - Update alumni record
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify the alumnus belongs to the caller's school before mutating.
    const owned = await db.alumni.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 })

    const alumniRecord = await db.alumni.update({
      where: { id },
      data: {
        firstName: updates.firstName,
        lastName: updates.lastName,
        graduationYear: updates.graduationYear
          ? parseInt(String(updates.graduationYear))
          : undefined,
        email: updates.email,
        phone: updates.phone,
        occupation: updates.occupation,
        company: updates.company,
        location: updates.location,
        isNotable: updates.isNotable,
        isActive: updates.isActive,
      },
      include: { contributions: true },
    })

    logAudit({ action: 'UPDATE', entity: 'alumni', entityId: (alumniRecord as any)?.id, afterValue: alumniRecord }).catch(() => {})
    return NextResponse.json(alumniRecord)
  } catch (error) {
    console.error('Failed to update alumni record:', error)
    return NextResponse.json(
      { error: 'Failed to update alumni record' },
      { status: 500 }
    )
  }
}

// DELETE /api/alumni - Soft delete alumni record
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify the alumnus belongs to the caller's school before mutating.
    const owned = await db.alumni.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 })

    await db.alumni.update({ where: { id }, data: { isActive: false } })
    logAudit({ action: 'DELETE', entity: 'alumni', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Alumni record deleted successfully' })
  } catch (error) {
    console.error('Failed to delete alumni record:', error)
    return NextResponse.json(
      { error: 'Failed to delete alumni record' },
      { status: 500 }
    )
  }
}
