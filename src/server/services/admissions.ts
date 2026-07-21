import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { dispatchNotification } from '@/lib/notifications'

interface ListParams {
  search?: string | null
  status?: string | null
  page?: number
  limit?: number
}

export async function listAdmissions(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { schoolId }
  if (params.status) where.enrollmentStatus = params.status
  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
      { studentNumber: { contains: params.search, mode: 'insensitive' } },
      { nationalId: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [students, total, statusStats] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        parentLinks: { include: { parent: true } },
        enrollments: { include: { class: { include: { grade: true } } }, orderBy: { enrollmentDate: 'desc' }, take: 1 },
      },
      orderBy: { admissionDate: 'desc' },
      skip,
      take: limit,
    }),
    db.student.count({ where }),
    db.student.groupBy({ by: ['enrollmentStatus'], where: { schoolId }, _count: { id: true } }),
  ])

  const statusCounts: Record<string, number> = {}
  statusStats.forEach((s) => {
    statusCounts[s.enrollmentStatus] = s._count.id
  })

  const stats = {
    total,
    active: statusCounts['ACTIVE'] || 0,
    pending: statusCounts['PENDING'] || 0,
    droppedOut: statusCounts['DROPPED_OUT'] || 0,
    transferred: statusCounts['TRANSFERRED'] || 0,
  }

  return { data: students, total, page, totalPages: Math.ceil(total / limit), stats }
}

export async function generateStudentNumber(schoolId: string) {
  const currentYear = new Date().getFullYear()
  const prefix = `STU${currentYear}`
  const lastStudent = await db.student.findFirst({
    where: { schoolId, studentNumber: { startsWith: prefix } },
    orderBy: { studentNumber: 'desc' },
  })
  const nextNum = lastStudent ? parseInt(lastStudent.studentNumber.slice(-3)) + 1 : 1
  return `${prefix}${String(nextNum).padStart(3, '0')}`
}

export async function createAdmission(schoolId: string, body: Record<string, unknown>) {
  const currentYear = new Date().getFullYear()
  const lastStudent = await db.student.findFirst({
    where: { schoolId, studentNumber: { startsWith: `STU${currentYear}` } },
    orderBy: { studentNumber: 'desc' },
  })
  const nextNum = lastStudent ? parseInt(lastStudent.studentNumber.slice(-3)) + 1 : 1
  const studentNumber = `STU${currentYear}${String(nextNum).padStart(3, '0')}`

  const student = await db.student.create({
    data: {
      schoolId,
      studentNumber,
      firstName: body.firstName as string,
      lastName: body.lastName as string,
      middleName: (body.middleName as string) || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth as string) : new Date(),
      gender: (body.gender as any) || 'MALE',
      birthCertNumber: (body.birthCertNumber as string) || null,
      nationalId: (body.nationalId as string) || null,
      previousSchool: (body.previousSchool as string) || null,
      enrollmentStatus: (body.status as any) || 'PENDING',
      boardingStatus: (body.boardingStatus as any) || null,
      admissionDate: new Date(),
    },
  })

  if (body.guardianFirstName && body.guardianLastName) {
    const parent = await db.parent.create({
      data: {
        schoolId,
        firstName: body.guardianFirstName as string,
        lastName: body.guardianLastName as string,
        phone: (body.guardianPhone as string) || '',
        email: (body.guardianEmail as string) || null,
      },
    })
    await db.studentParent.create({
      data: {
        schoolId,
        studentId: student.id,
        parentId: parent.id,
        relationship: (body.guardianRelationship as string) || 'PARENT',
        isPrimary: true,
        isFeeResponsible: true,
      },
    })
  }

  if (body.gradeId) {
    const currentYearString = new Date().getFullYear().toString()
    const academicYear = await db.academicYear.findFirst({
      where: { schoolId, name: { contains: currentYearString, mode: 'insensitive' } },
    })
    if (academicYear) {
      const cls = await db.class.findFirst({ where: { gradeId: body.gradeId as string, schoolId } })
      if (cls) {
        await db.studentEnrollment.create({
          data: {
            schoolId,
            studentId: student.id,
            classId: cls.id,
            academicYearId: academicYear.id,
            status: 'ACTIVE' as any,
          },
        })
      }
    }
  }

  logAudit({ action: 'CREATE', entity: 'admissions', entityId: student.id, schoolId, afterValue: student }).catch(() => {})
  return student
}

export async function enrollStudent(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existingStudent = await db.student.findUnique({ where: { id, schoolId } })
  if (!existingStudent) throw new AppError('NOT_FOUND', 'Student application not found')

  const { classId, academicYearId } = updates
  if (!classId) throw new AppError('VALIDATION', 'Class ID is required for enrollment')

  let finalAcademicYearId = academicYearId as string | undefined
  if (!finalAcademicYearId) {
    const currentYearString = new Date().getFullYear().toString()
    const academicYear = await db.academicYear.findFirst({
      where: { schoolId, name: { contains: currentYearString, mode: 'insensitive' } },
    })
    if (!academicYear) throw new AppError('VALIDATION', 'No current academic year found for enrollment')
    finalAcademicYearId = academicYear.id
  }

  let studentNumber = existingStudent.studentNumber
  if (studentNumber.startsWith('APP')) {
    studentNumber = await generateStudentNumber(schoolId)
  }

  const student = await db.student.update({
    where: { id },
    data: { enrollmentStatus: 'ACTIVE' as any, studentNumber },
    include: { parentLinks: { include: { parent: true } }, enrollments: { include: { class: { include: { grade: true } } } } },
  })

  await db.studentEnrollment.upsert({
    where: { studentId_academicYearId: { studentId: id, academicYearId: finalAcademicYearId } },
    create: { schoolId, studentId: id, classId: classId as string, academicYearId: finalAcademicYearId, status: 'ACTIVE' as any },
    update: { classId: classId as string, status: 'ACTIVE' as any },
  })

  logAudit({ action: 'UPDATE', entity: 'admissions', entityId: student.id, schoolId, afterValue: student }).catch(() => {})
  return student
}

export async function updateAdmission(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existingStudent = await db.student.findUnique({ where: { id, schoolId } })
  if (!existingStudent) throw new AppError('NOT_FOUND', 'Student application not found')

  const exitStatuses = new Set(['DROPPED_OUT', 'TRANSFERRED', 'REJECTED'])
  const newStatus = (updates.enrollmentStatus as string) || (updates.status as string)
  const exitReason = exitStatuses.has(newStatus) ? ((updates.exitReason as string) || newStatus) : undefined

  const student = await db.student.update({
    where: { id },
    data: {
      enrollmentStatus: (newStatus as any) || undefined,
      boardingStatus: (updates.boardingStatus as any) || undefined,
      beamStatus: (updates.beamStatus as any) || undefined,
      firstName: updates.firstName as string | undefined,
      lastName: updates.lastName as string | undefined,
      exitDate: exitStatuses.has(newStatus) ? new Date() : undefined,
      exitReason,
    },
    include: { parentLinks: { include: { parent: true } }, enrollments: { include: { class: { include: { grade: true } } } } },
  })

  logAudit({ action: 'UPDATE', entity: 'admissions', entityId: student.id, schoolId, afterValue: student }).catch(() => {})
  return student
}

export async function dropAdmission(schoolId: string, id: string) {
  const existing = await db.student.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Student not found')

  const student = await db.student.update({
    where: { id },
    data: { enrollmentStatus: 'DROPPED_OUT' as any, exitDate: new Date(), exitReason: 'DROPPED_OUT' },
  })

  logAudit({ action: 'DELETE', entity: 'admissions', entityId: id, schoolId }).catch(() => {})
  return { message: 'Admission record updated (student dropped out)', student }
}

export async function submitApplication(d: Record<string, unknown>) {
  const school = await db.school.findFirst()
  if (!school) throw new AppError('INTERNAL', 'Admissions are not currently configured. Please contact the school directly.')

  const currentYear = new Date().getFullYear()
  const last = await db.student.findFirst({
    where: { schoolId: school.id, studentNumber: { startsWith: `APP${currentYear}` } },
    orderBy: { studentNumber: 'desc' },
  })
  const nextNum = last ? parseInt(last.studentNumber.slice(-4)) + 1 : 1
  const studentNumber = `APP${currentYear}${String(nextNum).padStart(4, '0')}`

  const student = await db.student.create({
    data: {
      schoolId: school.id,
      studentNumber,
      firstName: d.firstName as string,
      lastName: d.lastName as string,
      middleName: (d.middleName as string) || null,
      gender: d.gender as any,
      dateOfBirth: new Date(d.dateOfBirth as string),
      enrollmentStatus: 'PENDING' as any,
      boardingStatus: (d.boardingStatus as any) || null,
      previousSchool: (d.previousSchool as string) || null,
      admissionDate: new Date(),
    },
  })

  const parent = await db.parent.create({
    data: {
      schoolId: school.id,
      firstName: d.guardianFirstName as string,
      lastName: d.guardianLastName as string,
      phone: d.guardianPhone as string,
      email: (d.guardianEmail as string) || null,
      preferredContact: d.guardianEmail ? 'EMAIL' : 'SMS',
      isFeeResponsible: true,
    },
  })

  await db.studentParent.create({
    data: {
      schoolId: school.id,
      studentId: student.id,
      parentId: parent.id,
      relationship: (d.guardianRelationship as string) || 'Guardian',
      isPrimary: true,
      isFeeResponsible: true,
    },
  })

  void dispatchNotification(
    school.id,
    { type: 'admission.received' as any, applicantName: `${d.firstName} ${d.lastName}`, reference: studentNumber },
    { parentId: parent.id, phone: d.guardianPhone as string, email: (d.guardianEmail as string) || null, name: `${d.guardianFirstName} ${d.guardianLastName}` },
  ).catch(() => {})

  return { message: 'Application received', reference: studentNumber, appliedFor: d.gradeApplyingFor }
}

export function handleAdmissionsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
