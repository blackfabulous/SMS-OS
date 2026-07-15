import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
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

    return ok({
      grades, subjects, recentAssessments, totalSubjects, coreSubjects, practicalSubjects,
      classes: classes.map((cls) => ({ ...cls, studentCount: classStudentCounts[cls.id] || 0 })),
    })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching academic overview')
    return fail('INTERNAL', 'Failed to fetch academic overview')
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
      if (!name) return fail('VALIDATION', 'Grade name is required')
      const grade = await db.grade.create({
        data: { schoolId, name, level: level || 'PRIMARY', sequence: sequence || 0 },
      })
      logAudit({ action: 'CREATE', entity: 'academics', entityId: grade.id, afterValue: grade }).catch(() => {})
      return ok(grade, 201)
    }

    if (action === 'addClass') {
      const { gradeId, name, stream, academicYear, capacity } = body
      if (!gradeId || !name) return fail('VALIDATION', 'Grade ID and name are required')
      // Verify grade belongs to caller's school
      const grade = await db.grade.findUnique({ where: { id: gradeId, schoolId }, select: { id: true } })
      if (!grade) return fail('NOT_FOUND', 'Grade not found')
      const cls = await db.class.create({
        data: { schoolId, gradeId, name, stream: stream || null, academicYear: academicYear || new Date().getFullYear().toString(), capacity: capacity || 40 },
      })
      logAudit({ action: 'CREATE', entity: 'academics', entityId: cls.id, afterValue: cls }).catch(() => {})
      return ok(cls, 201)
    }

    if (action === 'addSubject') {
      const { code, name, department, isCore, isPractical, passMark } = body
      if (!code || !name) return fail('VALIDATION', 'Code and name are required')
      const subject = await db.subject.create({
        data: { schoolId, code, name, department: department || null, isCore: isCore || false, isPractical: isPractical || false, passMark: passMark || 50 },
      })
      logAudit({ action: 'CREATE', entity: 'academics', entityId: subject.id, afterValue: subject }).catch(() => {})
      return ok(subject, 201)
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
    return ok(assessment, 201)
  } catch (error) {
    logger.error({ err: error }, 'Error creating academic record')
    return fail('INTERNAL', 'Failed to create academic record')
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { type, id, ...updates } = body
    if (!id || !type) return fail('VALIDATION', 'ID and type are required')

    if (type === 'grade') {
      const existing = await db.grade.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return fail('NOT_FOUND', 'Grade not found')
      const grade = await db.grade.update({ where: { id }, data: { name: updates.name, level: updates.level, sequence: updates.sequence, isActive: updates.isActive } })
      logAudit({ action: 'UPDATE', entity: 'academics', entityId: grade.id, afterValue: grade }).catch(() => {})
      return ok(grade)
    }

    if (type === 'class') {
      const existing = await db.class.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return fail('NOT_FOUND', 'Class not found')
      const cls = await db.class.update({ where: { id }, data: { name: updates.name, stream: updates.stream, capacity: updates.capacity, classTeacherId: updates.classTeacherId, isActive: updates.isActive } })
      logAudit({ action: 'UPDATE', entity: 'academics', entityId: cls.id, afterValue: cls }).catch(() => {})
      return ok(cls)
    }

    if (type === 'subject') {
      const existing = await db.subject.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return fail('NOT_FOUND', 'Subject not found')
      const subject = await db.subject.update({ where: { id }, data: { name: updates.name, code: updates.code, department: updates.department, isCore: updates.isCore, isPractical: updates.isPractical, passMark: updates.passMark, isActive: updates.isActive } })
      logAudit({ action: 'UPDATE', entity: 'academics', entityId: subject.id, afterValue: subject }).catch(() => {})
      return ok(subject)
    }

    return fail('VALIDATION', 'Invalid type')
  } catch (error) {
    logger.error({ err: error }, 'Error updating academic record')
    return fail('INTERNAL', 'Failed to update academic record')
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
    if (!id || !type) return fail('VALIDATION', 'ID and type are required')

    if (type === 'grade') {
      const existing = await db.grade.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return fail('NOT_FOUND', 'Grade not found')
      await db.grade.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'class') {
      const existing = await db.class.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return fail('NOT_FOUND', 'Class not found')
      await db.class.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'subject') {
      const existing = await db.subject.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
      if (!existing) return fail('NOT_FOUND', 'Subject not found')
      await db.subject.update({ where: { id }, data: { isActive: false } })
    }

    logAudit({ action: 'DELETE', entity: 'academics', entityId: id }).catch(() => {})
    return ok({ message: 'Deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting academic record')
    return fail('INTERNAL', 'Failed to delete academic record')
  }
}
