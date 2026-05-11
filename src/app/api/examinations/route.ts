import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examLevel = searchParams.get('examLevel')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    if (examLevel) where.examLevel = examLevel
    if (year) where.examYear = parseInt(year)

    const candidates = await db.zimsecCandidate.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            gender: true,
            dateOfBirth: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: {
                class: { include: { grade: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute stats
    const totalCandidates = candidates.length
    const grade7Count = candidates.filter((c) => c.examLevel === 'GRADE_7').length
    const oLevelCount = candidates.filter((c) => c.examLevel === 'O_LEVEL').length
    const aLevelCount = candidates.filter((c) => c.examLevel === 'A_LEVEL').length
    const registeredCount = candidates.filter((c) => c.registrationStatus === 'REGISTERED').length
    const pendingCount = candidates.filter((c) => c.registrationStatus === 'PENDING').length
    const confirmedCount = candidates.filter((c) => c.registrationStatus === 'CONFIRMED').length

    return NextResponse.json({
      data: candidates,
      stats: {
        totalCandidates,
        grade7Count,
        oLevelCount,
        aLevelCount,
        registeredCount,
        pendingCount,
        confirmedCount,
        registrationProgress: totalCandidates > 0
          ? Math.round(((registeredCount + confirmedCount) / totalCandidates) * 100)
          : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching examinations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch examinations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Check for duplicate
    const existing = await db.zimsecCandidate.findFirst({
      where: {
        studentId: body.studentId,
        examYear: body.examYear || new Date().getFullYear(),
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Candidate already registered for this exam year', duplicate: true },
        { status: 409 }
      )
    }

    // Get school centre number
    const school = await db.school.findFirst()
    const centreNumber = school?.zimsecCentreNumber || ''

    // Generate candidate number
    const year = body.examYear || new Date().getFullYear()
    const existingCount = await db.zimsecCandidate.count({
      where: { examYear: year },
    })
    const candidateNumber = `${centreNumber}/${String(existingCount + 1).padStart(4, '0')}`

    const candidate = await db.zimsecCandidate.create({
      data: {
        studentId: body.studentId,
        centreNumber,
        candidateNumber,
        examLevel: body.examLevel || 'O_LEVEL',
        examYear: year,
        registrationStatus: 'PENDING',
        subjects: body.subjects || null,
        totalFees: body.totalFees || 0,
        feesPaid: 0,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (error) {
    console.error('Error registering candidate:', error)
    return NextResponse.json(
      { error: 'Failed to register candidate' },
      { status: 500 }
    )
  }
}
