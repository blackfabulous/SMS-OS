import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const grades = await db.grade.findMany({
      where: { isActive: true },
      include: {
        classes: { where: { isActive: true }, orderBy: { name: 'asc' } },
        gradeSubjects: { include: { subject: true } },
      },
      orderBy: { sequence: 'asc' },
    })

    const subjects = await db.subject.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })

    const recentAssessments = await db.assessment.findMany({
      take: 10, orderBy: { createdAt: 'desc' },
      include: { subject: true, marks: { include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } }, take: 5 } },
    })

    const gradeCounts = await db.studentEnrollment.groupBy({ by: ['classId'], where: { status: 'ACTIVE' }, _count: { studentId: true } })
    const classes = await db.class.findMany({ where: { isActive: true }, include: { grade: true } })
    const classStudentCounts: Record<string, number> = {}
    for (const gc of gradeCounts) { classStudentCounts[gc.classId] = gc._count.studentId }

    const totalSubjects = subjects.length
    const coreSubjects = subjects.filter((s) => s.isCore).length
    const practicalSubjects = subjects.filter((s) => s.isPractical).length

    return NextResponse.json({
      grades, subjects, recentAssessments, totalSubjects, coreSubjects, practicalSubjects,
      classes: classes.map((cls) => ({ ...cls, studentCount: classStudentCounts[cls.id] || 0 })),
    })
  } catch (error) {
    console.error('Error fetching academic overview:', error)
    return NextResponse.json({ error: 'Failed to fetch academic overview' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    if (action === 'addGrade') {
      const { name, level, sequence } = body
      if (!name) return NextResponse.json({ error: 'Grade name is required' }, { status: 400 })
      const grade = await db.grade.create({
        data: { schoolId: schoolId || 'default', name, level: level || 'PRIMARY', sequence: sequence || 0 },
      })
      return NextResponse.json(grade, { status: 201 })
    }

    if (action === 'addClass') {
      const { gradeId, name, stream, academicYear, capacity } = body
      if (!gradeId || !name) return NextResponse.json({ error: 'Grade ID and name are required' }, { status: 400 })
      const cls = await db.class.create({
        data: { schoolId: schoolId || 'default', gradeId, name, stream: stream || null, academicYear: academicYear || new Date().getFullYear().toString(), capacity: capacity || 40 },
      })
      return NextResponse.json(cls, { status: 201 })
    }

    if (action === 'addSubject') {
      const { code, name, department, isCore, isPractical, passMark } = body
      if (!code || !name) return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
      const subject = await db.subject.create({
        data: { schoolId: schoolId || 'default', code, name, department: department || null, isCore: isCore || false, isPractical: isPractical || false, passMark: passMark || 50 },
      })
      return NextResponse.json(subject, { status: 201 })
    }

    // Default: create assessment
    const assessment = await db.assessment.create({
      data: {
        schoolId: schoolId || 'default', termId: body.termId || '',
        subjectId: body.subjectId, classId: body.classId || null,
        name: body.name, assessmentType: body.assessmentType || 'TEST',
        totalMarks: body.totalMarks || 100, weight: body.weight || 1,
        date: body.date ? new Date(body.date) : undefined, isLocked: body.isLocked || false,
      },
      include: { subject: true, marks: true },
    })

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
    console.error('Error creating academic record:', error)
    return NextResponse.json({ error: 'Failed to create academic record' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { type, id, ...updates } = body
    if (!id || !type) return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })

    if (type === 'grade') {
      const grade = await db.grade.update({ where: { id }, data: { name: updates.name, level: updates.level, sequence: updates.sequence, isActive: updates.isActive } })
      return NextResponse.json(grade)
    }

    if (type === 'class') {
      const cls = await db.class.update({ where: { id }, data: { name: updates.name, stream: updates.stream, capacity: updates.capacity, classTeacherId: updates.classTeacherId, isActive: updates.isActive } })
      return NextResponse.json(cls)
    }

    if (type === 'subject') {
      const subject = await db.subject.update({ where: { id }, data: { name: updates.name, code: updates.code, department: updates.department, isCore: updates.isCore, isPractical: updates.isPractical, passMark: updates.passMark, isActive: updates.isActive } })
      return NextResponse.json(subject)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating academic record:', error)
    return NextResponse.json({ error: 'Failed to update academic record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id || !type) return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })

    if (type === 'grade') {
      await db.grade.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'class') {
      await db.class.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'subject') {
      await db.subject.update({ where: { id }, data: { isActive: false } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Error deleting academic record:', error)
    return NextResponse.json({ error: 'Failed to delete academic record' }, { status: 500 })
  }
}
