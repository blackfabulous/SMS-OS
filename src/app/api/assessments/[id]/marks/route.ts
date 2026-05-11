import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const assessment = await db.assessment.findUnique({
      where: { id },
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
          orderBy: {
            student: { lastName: 'asc' },
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // If classId is set, also get all students in that class for marks entry
    let classStudents: Array<{
      id: string
      firstName: string
      lastName: string
      studentNumber: string
      existingMarkId: string | null
      marksObtained: number | null
      grade: string | null
    }> = []

    if (assessment.classId) {
      const enrollments = await db.studentEnrollment.findMany({
        where: {
          classId: assessment.classId,
          status: 'ACTIVE',
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

      // Map existing marks
      const marksMap = new Map(
        assessment.marks.map((m) => [m.studentId, m])
      )

      classStudents = enrollments.map((e) => {
        const existingMark = marksMap.get(e.student.id)
        return {
          id: e.student.id,
          firstName: e.student.firstName,
          lastName: e.student.lastName,
          studentNumber: e.student.studentNumber,
          existingMarkId: existingMark?.id || null,
          marksObtained: existingMark?.marksObtained ?? null,
          grade: existingMark?.grade ?? null,
        }
      })
    }

    return NextResponse.json({
      assessment,
      classStudents,
    })
  } catch (error) {
    console.error('Error fetching assessment marks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment marks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const marks: Array<{
      studentId: string
      marksObtained: number
      grade?: string
      comments?: string
    }> = body.marks || []

    if (!marks.length) {
      return NextResponse.json({ error: 'No marks provided' }, { status: 400 })
    }

    // Verify assessment exists
    const assessment = await db.assessment.findUnique({
      where: { id },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Calculate grade from marks
    const calculateGrade = (obtained: number, total: number): string => {
      const pct = (obtained / total) * 100
      if (pct >= 80) return 'A'
      if (pct >= 70) return 'B'
      if (pct >= 60) return 'C'
      if (pct >= 50) return 'D'
      if (pct >= 40) return 'E'
      return 'U'
    }

    // Upsert marks
    const results = []
    for (const mark of marks) {
      const grade = mark.grade || calculateGrade(mark.marksObtained, assessment.totalMarks)
      const result = await db.assessmentMark.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: id,
            studentId: mark.studentId,
          },
        },
        create: {
          assessmentId: id,
          studentId: mark.studentId,
          marksObtained: mark.marksObtained,
          grade,
          comments: mark.comments,
        },
        update: {
          marksObtained: mark.marksObtained,
          grade,
          comments: mark.comments,
        },
      })
      results.push(result)
    }

    return NextResponse.json({
      saved: results.length,
      marks: results,
    })
  } catch (error) {
    console.error('Error saving marks:', error)
    return NextResponse.json(
      { error: 'Failed to save marks' },
      { status: 500 }
    )
  }
}
