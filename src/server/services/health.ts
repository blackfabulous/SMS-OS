import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string
  visitType?: string
  studentId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export async function listHealth(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const visitType = params.visitType ?? ''
  const studentId = params.studentId ?? ''
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo

  const where: Record<string, unknown> = { schoolId }
  if (visitType) where.visitType = visitType
  if (studentId) where.studentId = studentId
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    where.visitDate = dateFilter
  }
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { treatment: { contains: search, mode: 'insensitive' } },
      { medicationGiven: { contains: search, mode: 'insensitive' } },
      { referredTo: { contains: search, mode: 'insensitive' } },
      { student: { firstName: { contains: search, mode: 'insensitive' } } },
      { student: { lastName: { contains: search, mode: 'insensitive' } } },
      { student: { studentNumber: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [records, total] = await Promise.all([
    db.healthRecord.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            gender: true,
            allergies: true,
            chronicConditions: true,
            medications: true,
            bloodGroup: true,
            doctorName: true,
            doctorPhone: true,
            enrollmentStatus: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
      skip,
      take: limit,
    }),
    db.healthRecord.count({ where }),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const schoolFilter = { schoolId }
  const [
    totalRecords,
    visitTypeStats,
    confidentialCount,
    referralsCount,
    todayVisits,
    studentsWithChronicConditions,
    studentsWithAllergies,
  ] = await Promise.all([
    db.healthRecord.count({ where: schoolFilter }),
    db.healthRecord.groupBy({ by: ['visitType'], where: schoolFilter, _count: { id: true } }),
    db.healthRecord.count({ where: { ...schoolFilter, isConfidential: true } }),
    db.healthRecord.count({ where: { ...schoolFilter, referredTo: { not: null } } }),
    db.healthRecord.count({ where: { ...schoolFilter, visitDate: { gte: today } } }),
    db.student.count({ where: { schoolId, chronicConditions: { not: null } } }),
    db.student.count({ where: { schoolId, allergies: { not: null } } }),
  ])

  return {
    data: records,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalRecords,
      todayVisits,
      confidentialCount,
      referralsCount,
      studentsWithChronicConditions,
      studentsWithAllergies,
    },
    visitTypeBreakdown: visitTypeStats.map((v) => ({ type: v.visitType, count: v._count.id })),
  }
}

export async function createHealthRecord(
  schoolId: string,
  body: {
    studentId?: string
    visitType?: string
    description?: string
    treatment?: string
    medicationGiven?: string
    referredTo?: string
    isConfidential?: boolean
    visitDate?: string
  },
) {
  const { studentId, visitType, description, treatment, medicationGiven, referredTo, isConfidential, visitDate } = body
  if (!studentId || !visitType || !description) {
    throw new AppError('VALIDATION', 'Student ID, visit type, and description are required')
  }

  const student = await db.student.findUnique({ where: { id: studentId, schoolId }, select: { id: true } })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const record = await db.healthRecord.create({
    data: {
      schoolId,
      studentId,
      visitType,
      description,
      treatment: treatment || null,
      medicationGiven: medicationGiven || null,
      referredTo: referredTo || null,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      isConfidential: isConfidential !== undefined ? isConfidential : true,
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentNumber: true,
          allergies: true,
          chronicConditions: true,
          bloodGroup: true,
        },
      },
    },
  })

  logAudit({ action: 'CREATE', entity: 'health', entityId: record.id, schoolId, afterValue: record }).catch(() => {})
  return record
}

export async function updateHealthRecord(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.healthRecord.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  const record = await db.healthRecord.update({
    where: { id },
    data: {
      visitType: updates.visitType as string | undefined,
      description: updates.description as string | undefined,
      treatment: updates.treatment as string | undefined,
      medicationGiven: updates.medicationGiven as string | undefined,
      referredTo: updates.referredTo as string | undefined,
      isConfidential: updates.isConfidential as boolean | undefined,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
    },
  })

  logAudit({ action: 'UPDATE', entity: 'health', entityId: record.id, schoolId, afterValue: record }).catch(() => {})
  return record
}

export async function deleteHealthRecord(schoolId: string, id: string) {
  const existing = await db.healthRecord.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  await db.healthRecord.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'health', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleHealthError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
