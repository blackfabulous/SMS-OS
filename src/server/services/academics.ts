import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

export async function getAcademicOverview(schoolId: string) {
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

  const [recentAssessments, gradeCounts, classes] = await Promise.all([
    db.assessment.findMany({
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
    }),
    db.studentEnrollment.groupBy({
      by: ['classId'],
      where: { status: 'ACTIVE', class: { schoolId } },
      _count: { studentId: true },
    }),
    db.class.findMany({ where: { schoolId, isActive: true }, include: { grade: true } }),
  ])

  const classStudentCounts: Record<string, number> = {}
  for (const gc of gradeCounts) classStudentCounts[gc.classId] = gc._count.studentId

  const totalSubjects = subjects.length
  const coreSubjects = subjects.filter((s) => s.isCore).length
  const practicalSubjects = subjects.filter((s) => s.isPractical).length

  return {
    grades,
    subjects,
    recentAssessments,
    totalSubjects,
    coreSubjects,
    practicalSubjects,
    classes: classes.map((cls) => ({ ...cls, studentCount: classStudentCounts[cls.id] || 0 })),
  }
}

export async function addGrade(schoolId: string, body: { name?: string; level?: string; sequence?: number }) {
  const { name, level, sequence } = body
  if (!name) throw new AppError('VALIDATION', 'Grade name is required')

  const grade = await db.grade.create({
    data: { schoolId, name, level: (level as any) || 'PRIMARY', sequence: sequence ?? 0 },
  })

  logAudit({ action: 'CREATE', entity: 'academics', entityId: grade.id, schoolId, afterValue: grade }).catch(() => {})
  return grade
}

export async function addClass(
  schoolId: string,
  body: { gradeId?: string; name?: string; stream?: string; academicYear?: string; capacity?: number },
) {
  const { gradeId, name, stream, academicYear, capacity } = body
  if (!gradeId || !name) throw new AppError('VALIDATION', 'Grade ID and name are required')

  const grade = await db.grade.findFirst({ where: { id: gradeId, schoolId }, select: { id: true } })
  if (!grade) throw new AppError('NOT_FOUND', 'Grade not found')

  const cls = await db.class.create({
    data: {
      schoolId,
      gradeId,
      name,
      stream: stream || null,
      academicYear: academicYear || new Date().getFullYear().toString(),
      capacity: capacity ?? 40,
    },
  })

  logAudit({ action: 'CREATE', entity: 'academics', entityId: cls.id, schoolId, afterValue: cls }).catch(() => {})
  return cls
}

export async function addSubject(
  schoolId: string,
  body: { code?: string; name?: string; department?: string; isCore?: boolean; isPractical?: boolean; passMark?: number },
) {
  const { code, name, department, isCore, isPractical, passMark } = body
  if (!code || !name) throw new AppError('VALIDATION', 'Code and name are required')

  const subject = await db.subject.create({
    data: {
      schoolId,
      code,
      name,
      department: department || null,
      isCore: isCore ?? false,
      isPractical: isPractical ?? false,
      passMark: passMark ?? 50,
    },
  })

  logAudit({ action: 'CREATE', entity: 'academics', entityId: subject.id, schoolId, afterValue: subject }).catch(() => {})
  return subject
}

export async function addAssessment(
  schoolId: string,
  body: Record<string, unknown>,
) {
  const currentTerm = await db.term.findFirst({
    where: { academicYear: { schoolId }, isCurrent: true },
    orderBy: { createdAt: 'desc' },
  })

  const termId = (currentTerm?.id || (body.termId as string)) || ''
  const assessment = await db.assessment.create({
    data: {
      schoolId,
      termId,
      subjectId: body.subjectId as string,
      classId: (body.classId as string) || null,
      name: body.name as string,
      assessmentType: (body.assessmentType as any) || 'TEST',
      totalMarks: (body.totalMarks as number) ?? 100,
      weight: (body.weight as number) ?? 1,
      date: body.date ? new Date(body.date as string) : null,
      isLocked: (body.isLocked as boolean) ?? false,
    },
    include: { subject: true, marks: true },
  })

  const marks = body.marks as Array<{ studentId: string; marksObtained: number; grade?: string; comments?: string }> | undefined
  if (marks && Array.isArray(marks) && marks.length > 0) {
    await db.assessmentMark.createMany({
      data: marks.map((mark) => ({
        schoolId,
        assessmentId: assessment.id,
        studentId: mark.studentId,
        marksObtained: mark.marksObtained,
        grade: mark.grade,
        comments: mark.comments,
      })),
      skipDuplicates: true,
    })
  }

  logAudit({ action: 'CREATE', entity: 'academics', entityId: assessment.id, schoolId, afterValue: assessment }).catch(
    () => {},
  )
  return assessment
}

export async function updateGrade(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.grade.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Grade not found')

  const grade = await db.grade.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      level: updates.level as any,
      sequence: updates.sequence as number | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'academics', entityId: grade.id, schoolId, afterValue: grade }).catch(() => {})
  return grade
}

export async function updateClass(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.class.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Class not found')

  const cls = await db.class.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      stream: updates.stream as string | undefined,
      capacity: updates.capacity as number | undefined,
      classTeacherId: updates.classTeacherId as string | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'academics', entityId: cls.id, schoolId, afterValue: cls }).catch(() => {})
  return cls
}

export async function updateSubject(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.subject.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Subject not found')

  const subject = await db.subject.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      code: updates.code as string | undefined,
      department: updates.department as string | undefined,
      isCore: updates.isCore as boolean | undefined,
      isPractical: updates.isPractical as boolean | undefined,
      passMark: updates.passMark as number | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'academics', entityId: subject.id, schoolId, afterValue: subject }).catch(
    () => {},
  )
  return subject
}

export async function deleteGrade(schoolId: string, id: string) {
  const existing = await db.grade.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Grade not found')

  await db.grade.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'academics', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteClass(schoolId: string, id: string) {
  const existing = await db.class.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Class not found')

  await db.class.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'academics', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteSubject(schoolId: string, id: string) {
  const existing = await db.subject.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Subject not found')

  await db.subject.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'academics', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleAcademicsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
