import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { CreateStudentSchema } from '@/lib/validations'

interface ListParams {
  search?: string
  gender?: string
  enrollmentStatus?: string
  grade?: string
  boardingStatus?: string
  page?: number
  limit?: number
}

interface SessionUser {
  id: string
  role: string
  schoolId: string
  studentId?: string | null
}

export async function listStudents(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const gender = params.gender ?? ''
  const enrollmentStatus = params.enrollmentStatus ?? ''
  const grade = params.grade ?? ''
  const boardingStatus = params.boardingStatus ?? ''

  const where: Record<string, unknown> = { schoolId }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { middleName: { contains: search, mode: 'insensitive' } },
      { studentNumber: { contains: search, mode: 'insensitive' } },
      { nationalId: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (gender) where.gender = gender
  if (boardingStatus) where.boardingStatus = boardingStatus

  if (enrollmentStatus) {
    where.enrollmentStatus = enrollmentStatus
  } else {
    where.NOT = [
      { studentNumber: { startsWith: 'APP' } },
      { enrollmentStatus: { in: ['PENDING', 'REJECTED', 'UNDER_REVIEW', 'WAITLISTED'] } },
    ]
  }

  if (grade) {
    where.enrollments = {
      some: { class: { grade: { name: grade } }, status: 'ACTIVE' },
    }
  }

  const [data, total] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { include: { grade: true } } },
          take: 1,
          orderBy: { enrollmentDate: 'desc' },
        },
        parentLinks: {
          where: { isPrimary: true },
          include: { parent: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.student.count({ where }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}

export async function createStudent(schoolId: string, body: Record<string, unknown>) {
  const parsed = CreateStudentSchema.safeParse(body)
  if (!parsed.success) throw new AppError('VALIDATION', 'Validation failed', parsed.error.issues)

  const currentYear = new Date().getFullYear()
  const prefix = `STU${currentYear}`
  const lastStudent = await db.student.findFirst({
    where: { schoolId, studentNumber: { startsWith: prefix } },
    orderBy: { studentNumber: 'desc' },
  })

  let sequence = 1
  if (lastStudent) {
    const lastSequence = parseInt(lastStudent.studentNumber.slice(-3))
    sequence = lastSequence + 1
  }
  const studentNumber = `${prefix}${sequence.toString().padStart(3, '0')}`

  const student = await db.student.create({
    data: {
      studentNumber,
      schoolId,
      firstName: body.firstName as string,
      lastName: body.lastName as string,
      middleName: (body.middleName as string) || null,
      preferredName: (body.preferredName as string) || null,
      dateOfBirth: new Date(body.dateOfBirth as string),
      gender: body.gender as any,
      birthCertNumber: (body.birthCertNumber as string) || null,
      nationalId: (body.nationalId as string) || null,
      passportNumber: (body.passportNumber as string) || null,
      photo: (body.photo as string) || null,
      religion: (body.religion as string) || null,
      homeLanguage: (body.homeLanguage as string) || null,
      languagePreference: (body.languagePreference as string) || 'ENGLISH',
      nationality: (body.nationality as string) || 'Zimbabwean',
      bloodGroup: (body.bloodGroup as string) || null,
      allergies: (body.allergies as string) || null,
      chronicConditions: (body.chronicConditions as string) || null,
      medications: (body.medications as string) || null,
      doctorName: (body.doctorName as string) || null,
      doctorPhone: (body.doctorPhone as string) || null,
      enrollmentStatus: (body.enrollmentStatus as any) || 'ACTIVE',
      boardingStatus: (body.boardingStatus as any) || null,
      beamStatus: (body.beamStatus as any) || null,
      isSpecialNeeds: (body.isSpecialNeeds as boolean) || false,
      specialNeedsDetails: (body.specialNeedsDetails as string) || null,
      previousSchool: (body.previousSchool as string) || null,
      admissionDate: body.admissionDate ? new Date(body.admissionDate as string) : new Date(),
      transferDate: body.transferDate ? new Date(body.transferDate as string) : null,
      exitDate: body.exitDate ? new Date(body.exitDate as string) : null,
      exitReason: (body.exitReason as string) || null,
    },
    include: {
      enrollments: { include: { class: { include: { grade: true } } } },
      parentLinks: { include: { parent: true } },
    },
  })

  const parentLinks = body.parentLinks as Array<{ parentId: string; relationship: string; isPrimary?: boolean; isFeeResponsible?: boolean }> | undefined
  if (parentLinks && parentLinks.length > 0) {
    await db.studentParent.createMany({
      data: parentLinks.map((link) => ({
        schoolId,
        studentId: student.id,
        parentId: link.parentId,
        relationship: link.relationship,
        isPrimary: link.isPrimary || false,
        isFeeResponsible: link.isFeeResponsible || false,
      })),
    })
  }

  if (body.classId && body.academicYearId) {
    await db.studentEnrollment.create({
      data: {
        schoolId,
        studentId: student.id,
        classId: body.classId as string,
        academicYearId: body.academicYearId as string,
        status: 'ACTIVE',
      },
    })
  }

  logAudit({ action: 'CREATE', entity: 'students', entityId: student.id, schoolId, afterValue: student }).catch(() => {})
  return student
}

export async function getStudent(schoolId: string, id: string, user: SessionUser) {
  if (user.role === 'STUDENT' && user.studentId !== id) {
    throw new AppError('FORBIDDEN', 'Forbidden')
  }

  if (user.role === 'PARENT') {
    const userRecord = await db.user.findUnique({ where: { id: user.id }, select: { parentId: true } })
    if (!userRecord?.parentId) throw new AppError('FORBIDDEN', 'Forbidden')
    const link = await db.studentParent.findFirst({
      where: { studentId: id, parentId: userRecord.parentId },
    })
    if (!link) throw new AppError('FORBIDDEN', 'Forbidden')
  }

  const include: any = {
    school: true,
    parentLinks: { include: { parent: true } },
    enrollments: {
      include: { class: { include: { grade: true } }, academicYear: true },
      orderBy: { enrollmentDate: 'desc' },
    },
    feeInvoices: {
      include: { items: true, term: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
    attendanceRecords: { orderBy: { date: 'desc' }, take: 30 },
    disciplineRecords: { orderBy: { date: 'desc' }, take: 10 },
    beamApplication: true,
    boardingAssignment: { include: { dormitory: { include: { hostel: true } } } },
    transportAssignment: { include: { route: true } },
  }
  if (user.role !== 'PARENT' && user.role !== 'STUDENT') {
    include.healthRecords = { orderBy: { visitDate: 'desc' }, take: 10 }
  }

  const student = await db.student.findFirst({ where: { id, schoolId }, include })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const records = student.attendanceRecords || []
  const total = records.length
  const present = records.filter((r: any) => r.status === 'PRESENT').length
  const absent = records.filter((r: any) => r.status === 'ABSENT').length
  const late = records.filter((r: any) => r.status === 'LATE').length

  const attendanceSummary = {
    total,
    present,
    absent,
    late,
    attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : '0',
  }

  return { student, attendanceSummary }
}

export async function updateStudent(schoolId: string, id: string, body: Record<string, unknown>) {
  const existing = await db.student.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Student not found')

  const student = await db.student.update({
    where: { id },
    data: {
      firstName: body.firstName as string | undefined,
      lastName: body.lastName as string | undefined,
      middleName: body.middleName as string | undefined,
      preferredName: body.preferredName as string | undefined,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth as string) : undefined,
      gender: body.gender as any,
      birthCertNumber: body.birthCertNumber as string | undefined,
      nationalId: body.nationalId as string | undefined,
      passportNumber: body.passportNumber as string | undefined,
      photo: body.photo as string | undefined,
      religion: body.religion as string | undefined,
      homeLanguage: body.homeLanguage as string | undefined,
      languagePreference: body.languagePreference as string | undefined,
      nationality: body.nationality as string | undefined,
      bloodGroup: body.bloodGroup as string | undefined,
      allergies: body.allergies as string | undefined,
      chronicConditions: body.chronicConditions as string | undefined,
      medications: body.medications as string | undefined,
      doctorName: body.doctorName as string | undefined,
      doctorPhone: body.doctorPhone as string | undefined,
      enrollmentStatus: body.enrollmentStatus as any,
      boardingStatus: body.boardingStatus as any,
      beamStatus: body.beamStatus as any,
      isSpecialNeeds: body.isSpecialNeeds as boolean | undefined,
      specialNeedsDetails: body.specialNeedsDetails as string | undefined,
      previousSchool: body.previousSchool as string | undefined,
      transferDate: body.transferDate ? new Date(body.transferDate as string) : undefined,
      exitDate: body.exitDate ? new Date(body.exitDate as string) : undefined,
      exitReason: body.exitReason as string | undefined,
    },
    include: {
      enrollments: { include: { class: { include: { grade: true } } } },
      parentLinks: { include: { parent: true } },
    },
  })

  logAudit({ action: 'UPDATE', entity: 'students', entityId: student.id, schoolId, afterValue: student }).catch(() => {})
  return student
}

export async function deleteStudent(schoolId: string, id: string) {
  const existing = await db.student.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Student not found')

  const student = await db.student.update({
    where: { id },
    data: {
      enrollmentStatus: 'DROPPED_OUT',
      exitDate: new Date(),
      exitReason: 'DROPPED_OUT',
    },
  })

  logAudit({ action: 'DELETE', entity: 'students', entityId: id, schoolId }).catch(() => {})
  return { message: 'Student soft deleted successfully', student }
}

export function handleStudentsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
