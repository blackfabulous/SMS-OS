import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult

    const [grades, subjects] = await Promise.all([
      db.grade.findMany({
        where: { schoolId, isActive: true },
        include: {
          classes: { where: { isActive: true }, orderBy: { name: 'asc' } },
          gradeSubjects: { include: { subject: true } },
        },
        orderBy: { sequence: 'asc' },
      }),
      db.subject.findMany({ where: { schoolId, isActive: true }, orderBy: { name: 'asc' } }),
    ])

    const recentAssessments = await db.assessment.findMany({
      where: { schoolId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: true,
        marks: {
          include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
          take: 5,
        },
      },
    })

    const gradeCounts = await db.studentEnrollment.groupBy({
      by: ['classId'],
      where: { status: 'ACTIVE', class: { schoolId } },
      _count: { studentId: true },
    })
    const classes = await db.class.findMany({ where: { schoolId, isActive: true }, include: { grade: true } })
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
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = session.user.schoolId

    if (action === 'addGrade') {
      const { name, level, sequence } = body
      if (!name) return NextResponse.json({ error: 'Grade name is required' }, { status: 400 })
      const grade = await db.grade.create({
        data: { schoolId, name, level: level || 'PRIMARY', sequence: sequence || 0 },
      })
      logAudit({ action: 'CREATE', entity: 'academics', entityId: grade.id, afterValue: grade }).catch(() => {})
      return NextResponse.json(grade, { status: 201 })
    }

    if (action === 'addClass') {
      const { gradeId, name, stream, academicYear, capacity } = body
      if (!gradeId || !name) return NextResponse.json({ error: 'Grade ID and name are required' }, { status: 400 })
      // Verify grade belongs to caller's school
      const grade = await db.grade.findUnique({ where: { id: gradeId, schoolId }, select: { id: true } })
      if (!grade) return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
      const cls = await db.class.create({
        data: { schoolId, gradeId, name, stream: stream || null, academicYear: academicYear || new Date().getFullYear().toString(), capacity: capacity || 40 },
      })
      logAudit({ action: 'CREATE', entity: 'academics', entityId: cls.id, afterValue: cls }).catch(() => {})
      return NextResponse.json(cls, { status: 201 })
    }

    if (action === 'addSubject') {
      const { code, name, department, isCore, isPractical, passMark } = body
      if (!code || !name) return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
      const subject = await db.subject.create({
        data: { schoolId, code, name, department: department || null, isCore: isCore || false, isPractical: isPractical || false, passMark: passMark || 50 },
      })
      logAudit({ action: 'CREATE', entity: 'academics', entityId: subject.id, afterValue: subject }).catch(() => {})
      return NextResponse.json(subject, { status: 201 })
    }

    // Default: create assessment
    const currentTerm = await db.term.findFirst({
      where: { academicYear: { schoolId }, isCurrent: true },
      orderBy: { createdAt: 'desc' },
    })

    const assessment = await db.assessment.create({
      data: {
        schoolId,
        termId: currentTerm?.id || body.termId || '',
        subjectId: body.subjectId,
        classId: body.classId || null,
        name: body.name,
        assessmentType: body.assessmentType || 'TEST',
        totalMarks: body.totalMarks || 100,
        weight: body.weight || 1,
        date: body.date ? new Date(body.date) : undefined,
        isLocked: body.isLocked || false,
      },
      include: { subject: true, marks: true },
    })

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

    logAudit({ action: 'CREATE', entity: 'academics', entityId: assessment.id, afterValue: assessment }).catch(() => {})
    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    console.error('Error creating academic record:', error)
    return NextResponse.json({ error: 'Failed to create academic record' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { type, id, ...updates } = body
    if (!id || !type) return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })

    if (type === 'grade') {
      const existing = await db.grade.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
      const grade = await db.grade.update({ where: { id }, data: { name: updates.name, level: updates.level, sequence: updates.sequence, isActive: updates.isActive } })
      logAudit({ action: 'UPDATE', entity: 'academics', entityId: grade.id, afterValue: grade }).catch(() => {})
      return NextResponse.json(grade)
    }

    if (type === 'class') {
      const existing = await db.class.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      const cls = await db.class.update({ where: { id }, data: { name: updates.name, stream: updates.stream, capacity: updates.capacity, classTeacherId: updates.classTeacherId, isActive: updates.isActive } })
      logAudit({ action: 'UPDATE', entity: 'academics', entityId: cls.id, afterValue: cls }).catch(() => {})
      return NextResponse.json(cls)
    }

    if (type === 'subject') {
      const existing = await db.subject.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
      const subject = await db.subject.update({ where: { id }, data: { name: updates.name, code: updates.code, department: updates.department, isCore: updates.isCore, isPractical: updates.isPractical, passMark: updates.passMark, isActive: updates.isActive } })
      logAudit({ action: 'UPDATE', entity: 'academics', entityId: subject.id, afterValue: subject }).catch(() => {})
      return NextResponse.json(subject)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating academic record:', error)
    return NextResponse.json({ error: 'Failed to update academic record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id || !type) return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })

    if (type === 'grade') {
      const existing = await db.grade.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
      await db.grade.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'class') {
      const existing = await db.class.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      await db.class.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'subject') {
      const existing = await db.subject.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
      await db.subject.update({ where: { id }, data: { isActive: false } })
    }

    logAudit({ action: 'DELETE', entity: 'academics', entityId: id }).catch(() => {})
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Error deleting academic record:', error)
    return NextResponse.json({ error: 'Failed to delete academic record' }, { status: 500 })
  }
}
