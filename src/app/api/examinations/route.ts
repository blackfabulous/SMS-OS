import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'

export async function GET(request: Request) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error
  const { schoolId } = tenantResult

  try {
    const { searchParams } = new URL(request.url)
    const examLevel = searchParams.get('examLevel')
    const year = searchParams.get('year')
    const registrationStatus = searchParams.get('registrationStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { student: { schoolId } }
    if (examLevel) where.examLevel = examLevel
    if (year) where.examYear = parseInt(year)
    if (registrationStatus) where.registrationStatus = registrationStatus

    const [candidates, total] = await Promise.all([
      db.zimsecCandidate.findMany({
        where,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true, dateOfBirth: true,
              enrollments: { where: { status: 'ACTIVE' }, take: 1, include: { class: { include: { grade: true } } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.zimsecCandidate.count({ where }),
    ])

    const allCandidates = await db.zimsecCandidate.findMany({ where })
    const stats = {
      totalCandidates: allCandidates.length,
      grade7Count: allCandidates.filter((c) => c.examLevel === 'GRADE_7').length,
      oLevelCount: allCandidates.filter((c) => c.examLevel === 'O_LEVEL').length,
      aLevelCount: allCandidates.filter((c) => c.examLevel === 'A_LEVEL').length,
      registeredCount: allCandidates.filter((c) => c.registrationStatus === 'REGISTERED').length,
      pendingCount: allCandidates.filter((c) => c.registrationStatus === 'PENDING').length,
      confirmedCount: allCandidates.filter((c) => c.registrationStatus === 'CONFIRMED').length,
      registrationProgress: allCandidates.length > 0
        ? Math.round(((allCandidates.filter((c) => c.registrationStatus === 'REGISTERED' || c.registrationStatus === 'CONFIRMED').length) / allCandidates.length) * 100)
        : 0,
    }

    return NextResponse.json({ data: candidates, total, page, totalPages: Math.ceil(total / limit), stats })
  } catch (error) {
    console.error('Error fetching examinations:', error)
    return NextResponse.json({ error: 'Failed to fetch examinations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()

    // The candidate's student must belong to the caller's school (tenant guard).
    const ownStudent = await db.student.findFirst({ where: { id: body.studentId, schoolId }, select: { id: true } })
    if (!ownStudent) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const existing = await db.zimsecCandidate.findFirst({
      where: { studentId: body.studentId, examYear: body.examYear || new Date().getFullYear(), student: { schoolId } },
    })
    if (existing) return NextResponse.json({ error: 'Candidate already registered for this exam year', duplicate: true }, { status: 409 })

    const school = await db.school.findUnique({ where: { id: schoolId } })
    const centreNumber = school?.zimsecCentreNumber || ''
    const year = body.examYear || new Date().getFullYear()
    const existingCount = await db.zimsecCandidate.count({ where: { examYear: year, student: { schoolId } } })
    const candidateNumber = `${centreNumber}/${String(existingCount + 1).padStart(4, '0')}`

    const candidate = await db.zimsecCandidate.create({
      data: {
        studentId: body.studentId, centreNumber, candidateNumber,
        examLevel: body.examLevel || 'O_LEVEL', examYear: year, registrationStatus: 'PENDING',
        subjects: body.subjects || null, totalFees: body.totalFees || 0, feesPaid: 0,
      },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
    })

    logAudit({ action: 'CREATE', entity: 'examinations', entityId: (candidate as any)?.id, afterValue: candidate }).catch(() => {})
    return NextResponse.json(candidate, { status: 201 })
  } catch (error) {
    console.error('Error registering candidate:', error)
    return NextResponse.json({ error: 'Failed to register candidate' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })

    // Verify the candidate belongs to the caller's school before mutating.
    const owned = await db.zimsecCandidate.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

    const candidate = await db.zimsecCandidate.update({
      where: { id },
      data: {
        registrationStatus: updates.registrationStatus,
        subjects: updates.subjects,
        totalFees: updates.totalFees,
        feesPaid: updates.feesPaid,
        examLevel: updates.examLevel,
      },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
    })

    logAudit({ action: 'UPDATE', entity: 'examinations', entityId: (candidate as any)?.id, afterValue: candidate }).catch(() => {})
    return NextResponse.json(candidate)
  } catch (error) {
    console.error('Error updating candidate:', error)
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })

    // Verify the candidate belongs to the caller's school before deleting.
    const owned = await db.zimsecCandidate.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

    await db.zimsecCandidate.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'examinations', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Candidate registration deleted successfully' })
  } catch (error) {
    console.error('Error deleting candidate:', error)
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 })
  }
}
