import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentType = searchParams.get('assessmentType')
    const subjectId = searchParams.get('subjectId')
    const classId = searchParams.get('classId')

    const where: Record<string, unknown> = {}
    if (assessmentType) where.assessmentType = assessmentType
    if (subjectId) where.subjectId = subjectId
    if (classId) where.classId = classId

    const assessments = await db.assessment.findMany({
      where,
      include: {
        subject: true,
        marks: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const total = await db.assessment.count({ where })

    return NextResponse.json({
      data: assessments,
      total,
    })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Get the first school and current term as defaults
    const school = await db.school.findFirst()
    const currentTerm = await db.term.findFirst({
      where: { isCurrent: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!school) {
      return NextResponse.json({ error: 'No school found. Please seed the database.' }, { status: 400 })
    }

    const assessment = await db.assessment.create({
      data: {
        schoolId: school.id,
        termId: currentTerm?.id || body.termId || '',
        subjectId: body.subjectId,
        classId: body.classId || null,
        name: body.name,
        assessmentType: body.assessmentType || 'TEST',
        totalMarks: body.totalMarks || 100,
        weight: body.weight || 1,
        date: body.date ? new Date(body.date) : undefined,
        isLocked: false,
      },
      include: {
        subject: true,
        marks: true,
      },
    })

    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}
