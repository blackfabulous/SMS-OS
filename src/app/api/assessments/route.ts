import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentType = searchParams.get('assessmentType')
    const subjectId = searchParams.get('subjectId')
    const classId = searchParams.get('classId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (assessmentType) where.assessmentType = assessmentType
    if (subjectId) where.subjectId = subjectId
    if (classId) where.classId = classId

    const [assessments, total] = await Promise.all([
      db.assessment.findMany({
        where,
        include: {
          subject: true,
          marks: { include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.assessment.count({ where }),
    ])

    return NextResponse.json({ data: assessments, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const school = await db.school.findFirst()
    const currentTerm = await db.term.findFirst({ where: { isCurrent: true }, orderBy: { createdAt: 'desc' } })

    if (!school) return NextResponse.json({ error: 'No school found.' }, { status: 400 })

    const assessment = await db.assessment.create({
      data: {
        schoolId: school.id, termId: currentTerm?.id || body.termId || '',
        subjectId: body.subjectId, classId: body.classId || null,
        name: body.name, assessmentType: body.assessmentType || 'TEST',
        totalMarks: body.totalMarks || 100, weight: body.weight || 1,
        date: body.date ? new Date(body.date) : undefined, isLocked: false,
      },
      include: { subject: true, marks: true },
    })

    // Create marks if provided
    if (body.marks && Array.isArray(body.marks) && body.marks.length > 0) {
      await db.assessmentMark.createMany({
        data: body.marks.map((mark: { studentId: string; marksObtained: number; grade?: string; comments?: string }) => ({
          assessmentId: assessment.id, studentId: mark.studentId, marksObtained: mark.marksObtained, grade: mark.grade, comments: mark.comments,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })

    const assessment = await db.assessment.update({
      where: { id },
      data: {
        name: updates.name,
        assessmentType: updates.assessmentType,
        totalMarks: updates.totalMarks,
        weight: updates.weight,
        date: updates.date ? new Date(updates.date) : undefined,
        isLocked: updates.isLocked,
      },
      include: { subject: true, marks: true },
    })

    return NextResponse.json(assessment)
  } catch (error) {
    console.error('Error updating assessment:', error)
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })

    await db.assessmentMark.deleteMany({ where: { assessmentId: id } })
    await db.assessment.delete({ where: { id } })

    return NextResponse.json({ message: 'Assessment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assessment:', error)
    return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 })
  }
}
