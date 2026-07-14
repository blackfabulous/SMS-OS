import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateRole } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { fromGradeId, toGradeId, studentIds, academicYearId, promoteAll } = body

    if (!fromGradeId || !toGradeId || !academicYearId) {
      return NextResponse.json(
        { error: 'fromGradeId, toGradeId, and academicYearId are required' },
        { status: 400 }
      )
    }

    // Validate grades + year exist AND belong to the caller's school (tenant guard).
    const fromGrade = await db.grade.findFirst({ where: { id: fromGradeId, schoolId } })
    const toGrade = await db.grade.findFirst({ where: { id: toGradeId, schoolId } })
    if (!fromGrade || !toGrade) {
      return NextResponse.json({ error: 'Invalid grade IDs' }, { status: 400 })
    }

    const academicYear = await db.academicYear.findFirst({ where: { id: academicYearId, schoolId } })
    if (!academicYear) {
      return NextResponse.json({ error: 'Invalid academic year ID' }, { status: 400 })
    }

    // Determine which students to promote
    let studentsToPromote

    if (promoteAll || !studentIds || studentIds.length === 0) {
      // Promote all active students in the fromGrade
      studentsToPromote = await db.studentEnrollment.findMany({
        where: {
          status: 'ACTIVE',
          class: { gradeId: fromGradeId },
          student: { schoolId },
        },
        include: { student: true, class: true },
      })
    } else {
      // Promote specific students
      studentsToPromote = await db.studentEnrollment.findMany({
        where: {
          studentId: { in: studentIds },
          status: 'ACTIVE',
          class: { gradeId: fromGradeId },
          student: { schoolId },
        },
        include: { student: true, class: true },
      })
    }

    if (studentsToPromote.length === 0) {
      return NextResponse.json(
        { error: 'No active students found in the source grade' },
        { status: 400 }
      )
    }

    // Get target classes in the toGrade
    const targetClasses = await db.class.findMany({
      where: { gradeId: toGradeId, isActive: true, schoolId },
    })

    if (targetClasses.length === 0) {
      return NextResponse.json(
        { error: 'No active classes found in the target grade. Create classes first.' },
        { status: 400 }
      )
    }

    // Promote each student
    let promoted = 0
    let failed = 0
    const errors: string[] = []

    for (const enrollment of studentsToPromote) {
      try {
        // Check if student already has an enrollment for this academic year
        const existingEnrollment = await db.studentEnrollment.findUnique({
          where: {
            studentId_academicYearId: {
              studentId: enrollment.studentId,
              academicYearId: academicYearId,
            },
          },
        })

        if (existingEnrollment) {
          errors.push(
            `${enrollment.student.firstName} ${enrollment.student.lastName} already enrolled for academic year ${academicYear.name}`
          )
          failed++
          continue
        }

        // Find matching class by stream, or use first available
        let targetClass = targetClasses.find(
          (c) => c.stream === enrollment.class.stream
        )
        if (!targetClass) {
          targetClass = targetClasses[0]
        }

        // Create new enrollment in the target grade/class
        await db.studentEnrollment.create({
          data: {
            schoolId,
            studentId: enrollment.studentId,
            classId: targetClass.id,
            academicYearId: academicYearId,
            enrollmentDate: new Date(),
            status: 'ACTIVE',
          },
        })

        // Mark old enrollment as promoted
        await db.studentEnrollment.update({
          where: { id: enrollment.id },
          data: {
            exitDate: new Date(),
            status: 'PROMOTED',
          },
        })

        promoted++
      } catch {
        errors.push(
          `Failed to promote ${enrollment.student.firstName} ${enrollment.student.lastName}`
        )
        failed++
      }
    }

    // Log audit entry
    logAudit({
      action: 'BULK_PROMOTE',
      entity: 'StudentEnrollment',
      schoolId,
      details: `Promoted ${promoted} students from ${fromGrade.name} to ${toGrade.name} for ${academicYear.name}`,
    }).catch(() => {})

    return NextResponse.json({
      promoted,
      failed,
      errors: errors.length > 0 ? errors : [],
      message: `${promoted} student${promoted !== 1 ? 's' : ''} promoted from ${fromGrade.name} to ${toGrade.name}`,
    })
  } catch (error) {
    console.error('Bulk promotion error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk promotion' },
      { status: 500 }
    )
  }
}
