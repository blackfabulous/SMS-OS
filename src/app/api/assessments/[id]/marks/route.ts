import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { SaveMarksSchema } from '@/lib/validations'
import { getSetting } from '@/lib/settings'
import { symbolForMark, validateMark, markToPercent } from '@/lib/grading'
import type { AssessmentMark } from '@prisma/client'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

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
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params
    const body = await request.json()

    const parsed = SaveMarksSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
    }
    const marks = parsed.data.marks

    // Verify the assessment exists AND belongs to the caller's school
    const assessment = await db.assessment.findFirst({
      where: { id, schoolId: session.user.schoolId },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    if (assessment.isLocked) {
      return NextResponse.json({ error: 'Assessment is locked and cannot be modified' }, { status: 409 })
    }

    // Reject marks above the assessment's maximum
    for (const m of marks) {
      const v = validateMark(m.marksObtained, assessment.totalMarks)
      if (!v.ok) {
        return NextResponse.json({ error: `Student ${m.studentId}: ${v.error}` }, { status: 400 })
      }
    }

    // Verify every target student belongs to the caller's school (prevents
    // writing marks against another school's students via a forged studentId)
    const studentIds = [...new Set(marks.map((m) => m.studentId))]
    const validStudents = await db.student.count({
      where: { id: { in: studentIds }, schoolId: session.user.schoolId },
    })
    if (validStudents !== studentIds.length) {
      return NextResponse.json({ error: 'One or more students do not belong to your school' }, { status: 403 })
    }

    // Grade symbols come from the school's ZIMSEC grading scale (settings).
    const gradingScale = await getSetting(session.user.schoolId, 'grading.scale')

    // Upsert marks
    const results: AssessmentMark[] = []
    for (const mark of marks) {
      const grade = mark.grade || symbolForMark(markToPercent(mark.marksObtained, assessment.totalMarks), gradingScale)
      const result = await db.assessmentMark.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: id,
            studentId: mark.studentId,
          },
        },
        create: {
          schoolId: session.user.schoolId,
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

    logAudit({ action: 'CREATE', entity: 'marks' }).catch(() => {})
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
