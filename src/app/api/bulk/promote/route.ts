import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromGradeId, toGradeId, academicYearId, studentIds } = body

    if (!fromGradeId || !toGradeId || !academicYearId) {
      return NextResponse.json(
        { error: 'fromGradeId, toGradeId, and academicYearId are required' },
        { status: 400 }
      )
    }

    // Validate grades exist
    const fromGrade = await db.grade.findUnique({ where: { id: fromGradeId } })
    const toGrade = await db.grade.findUnique({ where: { id: toGradeId } })
    if (!fromGrade || !toGrade) {
      return NextResponse.json({ error: 'Invalid grade IDs' }, { status: 400 })
    }

    // Validate academic year exists
    const academicYear = await db.academicYear.findUnique({ where: { id: academicYearId } })
    if (!academicYear) {
      return NextResponse.json({ error: 'Invalid academic year ID' }, { status: 400 })
    }

    // Get students currently enrolled in the fromGrade
    let studentsToPromote
    if (studentIds && studentIds.length > 0) {
      // Promote specific students
      studentsToPromote = await db.studentEnrollment.findMany({
        where: {
          studentId: { in: studentIds },
          status: 'ACTIVE',
          class: { gradeId: fromGradeId },
        },
        include: { student: true, class: true },
      })
    } else {
      // Promote all active students in the grade
      studentsToPromote = await db.studentEnrollment.findMany({
        where: {
          status: 'ACTIVE',
          class: { gradeId: fromGradeId },
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

    // Get a class in the target grade (use first available class or match by stream)
    const targetClasses = await db.class.findMany({
      where: { gradeId: toGradeId, isActive: true },
    })

    if (targetClasses.length === 0) {
      return NextResponse.json(
        { error: 'No active classes found in the target grade' },
        { status: 400 }
      )
    }

    // Create new enrollment records
    let promotedCount = 0
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
          errors.push(`${enrollment.student.firstName} ${enrollment.student.lastName} already enrolled for this academic year`)
          continue
        }

        // Find matching class by stream, or use first available
        let targetClass = targetClasses.find(
          (c) => c.stream === enrollment.class.stream
        )
        if (!targetClass) {
          targetClass = targetClasses[0]
        }

        // Create new enrollment
        await db.studentEnrollment.create({
          data: {
            studentId: enrollment.studentId,
            classId: targetClass.id,
            academicYearId: academicYearId,
            enrollmentDate: new Date(),
            status: 'ACTIVE',
          },
        })

        // Update old enrollment status
        await db.studentEnrollment.update({
          where: { id: enrollment.id },
          data: {
            exitDate: new Date(),
            status: 'PROMOTED',
          },
        })

        promotedCount++
      } catch (err) {
        errors.push(
          `Failed to promote ${enrollment.student.firstName} ${enrollment.student.lastName}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      promotedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${promotedCount} student${promotedCount !== 1 ? 's' : ''} promoted from ${fromGrade.name} to ${toGrade.name}`,
    })
  } catch (error) {
    console.error('Bulk promotion error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk promotion' },
      { status: 500 }
    )
  }
}
