import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { SaveMarksSchema } from '@/lib/validations'
import { getSetting } from '@/lib/settings'
import { symbolForMark, validateMark, markToPercent } from '@/lib/grading'
import type { AssessmentMark } from '@prisma/client'

interface ListParams {
  assessmentType?: string | null
  subjectId?: string | null
  classId?: string | null
  page?: number
  limit?: number
}

export async function listAssessments(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { schoolId }
  if (params.assessmentType) where.assessmentType = params.assessmentType
  if (params.subjectId) where.subjectId = params.subjectId
  if (params.classId) where.classId = params.classId

  const [assessments, total] = await Promise.all([
    db.assessment.findMany({
      where,
      include: {
        subject: true,
        marks: {
          include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.assessment.count({ where }),
  ])

  return { data: assessments, total, page, totalPages: Math.ceil(total / limit) }
}

export async function createAssessment(schoolId: string, body: Record<string, unknown>) {
  const currentTerm = await db.term.findFirst({
    where: { academicYear: { schoolId }, isCurrent: true },
    orderBy: { createdAt: 'desc' },
  })

  const assessment = await db.assessment.create({
    data: {
      schoolId,
      termId: currentTerm?.id || (body.termId as string) || '',
      subjectId: body.subjectId as string,
      classId: (body.classId as string) || null,
      name: body.name as string,
      assessmentType: (body.assessmentType as any) || 'TEST',
      totalMarks: (body.totalMarks as number) ?? 100,
      weight: (body.weight as number) ?? 1,
      date: body.date ? new Date(body.date as string) : null,
      isLocked: false,
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

  logAudit({ action: 'CREATE', entity: 'assessments', entityId: assessment.id, schoolId, afterValue: assessment }).catch(
    () => {},
  )
  return assessment
}

export async function updateAssessment(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.assessment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Assessment not found')

  const assessment = await db.assessment.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      assessmentType: updates.assessmentType as any,
      totalMarks: updates.totalMarks as number | undefined,
      weight: updates.weight as number | undefined,
      date: updates.date ? new Date(updates.date as string) : undefined,
      isLocked: updates.isLocked as boolean | undefined,
    },
    include: { subject: true, marks: true },
  })

  logAudit({ action: 'UPDATE', entity: 'assessments', entityId: assessment.id, schoolId, afterValue: assessment }).catch(
    () => {},
  )
  return assessment
}

export async function deleteAssessment(schoolId: string, id: string) {
  const existing = await db.assessment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Assessment not found')

  await db.assessmentMark.deleteMany({ where: { assessmentId: id, schoolId } })
  await db.assessment.delete({ where: { id } })

  logAudit({ action: 'DELETE', entity: 'assessments', entityId: id, schoolId }).catch(() => {})
  return { message: 'Assessment deleted successfully' }
}

interface ClassStudent {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
  existingMarkId: string | null
  marksObtained: number | null
  grade: string | null
}

export async function getAssessmentWithMarks(schoolId: string, id: string) {
  const assessment = await db.assessment.findFirst({
    where: { id, schoolId },
    include: {
      subject: true,
      marks: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        },
        orderBy: { student: { lastName: 'asc' } },
      },
    },
  })
  if (!assessment) throw new AppError('NOT_FOUND', 'Assessment not found')

  let classStudents: ClassStudent[] = []
  if (assessment.classId) {
    const enrollments = await db.studentEnrollment.findMany({
      where: { classId: assessment.classId, status: 'ACTIVE' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
    })

    const marksMap = new Map(assessment.marks.map((m) => [m.studentId, m]))
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

  return { assessment, classStudents }
}

export async function saveAssessmentMarks(schoolId: string, assessmentId: string, marksInput: unknown) {
  const parsed = SaveMarksSchema.safeParse(marksInput)
  if (!parsed.success) throw new AppError('VALIDATION', 'Validation failed', parsed.error.issues)
  const marks = parsed.data.marks

  const assessment = await db.assessment.findFirst({ where: { id: assessmentId, schoolId } })
  if (!assessment) throw new AppError('NOT_FOUND', 'Assessment not found')
  if (assessment.isLocked) throw new AppError('CONFLICT', 'Assessment is locked and cannot be modified')

  for (const m of marks) {
    const v = validateMark(m.marksObtained, assessment.totalMarks)
    if (!v.ok) throw new AppError('VALIDATION', `Student ${m.studentId}: ${v.error}`)
  }

  const studentIds = [...new Set(marks.map((m) => m.studentId))]
  const validStudents = await db.student.count({
    where: { id: { in: studentIds }, schoolId },
  })
  if (validStudents !== studentIds.length) throw new AppError('FORBIDDEN', 'One or more students do not belong to your school')

  const gradingScale = await getSetting(schoolId, 'grading.scale')

  const results: AssessmentMark[] = []
  for (const mark of marks) {
    const grade = mark.grade || symbolForMark(markToPercent(mark.marksObtained, assessment.totalMarks), gradingScale)
    const result = await db.assessmentMark.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId: mark.studentId } },
      create: {
        schoolId,
        assessmentId,
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

  logAudit({ action: 'CREATE', entity: 'marks', entityId: assessmentId, schoolId }).catch(() => {})
  return { saved: results.length, marks: results }
}

export function handleAssessmentsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
