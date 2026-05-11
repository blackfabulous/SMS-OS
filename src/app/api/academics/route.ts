import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get grades with their classes
    const grades = await db.grade.findMany({
      where: { isActive: true },
      include: {
        classes: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        gradeSubjects: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { sequence: 'asc' },
    })

    // Get subjects
    const subjects = await db.subject.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    // Get recent assessments
    const recentAssessments = await db.assessment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
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
          take: 5,
        },
      },
    })

    // Count students per grade
    const gradeCounts = await db.studentEnrollment.groupBy({
      by: ['classId'],
      where: { status: 'ACTIVE' },
      _count: { studentId: true },
    })

    // Get class info for mapping
    const classes = await db.class.findMany({
      where: { isActive: true },
      include: { grade: true },
    })

    const classStudentCounts: Record<string, number> = {}
    for (const gc of gradeCounts) {
      classStudentCounts[gc.classId] = gc._count.studentId
    }

    // Subjects count
    const totalSubjects = subjects.length
    const coreSubjects = subjects.filter((s) => s.isCore).length
    const practicalSubjects = subjects.filter((s) => s.isPractical).length

    return NextResponse.json({
      grades,
      subjects,
      recentAssessments,
      totalSubjects,
      coreSubjects,
      practicalSubjects,
      classes: classes.map((cls) => ({
        ...cls,
        studentCount: classStudentCounts[cls.id] || 0,
      })),
    })
  } catch (error) {
    console.error('Error fetching academic overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch academic overview' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const assessment = await db.assessment.create({
      data: {
        schoolId: body.schoolId,
        termId: body.termId,
        subjectId: body.subjectId,
        classId: body.classId,
        name: body.name,
        assessmentType: body.assessmentType || 'TEST',
        totalMarks: body.totalMarks || 100,
        weight: body.weight || 1,
        date: body.date ? new Date(body.date) : undefined,
        isLocked: body.isLocked || false,
      },
      include: {
        subject: true,
        marks: true,
      },
    })

    // Create marks if provided
    if (body.marks && Array.isArray(body.marks) && body.marks.length > 0) {
      await db.assessmentMark.createMany({
        data: body.marks.map((mark: { studentId: string; marksObtained: number; grade?: string; comments?: string }) => ({
          assessmentId: assessment.id,
          studentId: mark.studentId,
          marksObtained: mark.marksObtained,
          grade: mark.grade,
          comments: mark.comments,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}
