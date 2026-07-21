import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string
  status?: string
  incidentType?: string
  studentId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export async function listDiscipline(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const status = params.status ?? ''
  const incidentType = params.incidentType ?? ''
  const studentId = params.studentId ?? ''
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo

  const where: Record<string, unknown> = { schoolId }
  if (status) where.status = status
  if (incidentType) where.incidentType = incidentType
  if (studentId) where.studentId = studentId
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    where.date = dateFilter
  }
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
      { student: { firstName: { contains: search, mode: 'insensitive' } } },
      { student: { lastName: { contains: search, mode: 'insensitive' } } },
      { student: { studentNumber: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [records, total] = await Promise.all([
    db.disciplineRecord.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true, enrollmentStatus: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    db.disciplineRecord.count({ where }),
  ])

  const [open, resolved, closed, totalMeritAgg, totalDemeritAgg, parentNotifiedCount] = await Promise.all([
    db.disciplineRecord.count({ where: { schoolId, status: 'OPEN' } }),
    db.disciplineRecord.count({ where: { schoolId, status: 'RESOLVED' } }),
    db.disciplineRecord.count({ where: { schoolId, status: 'CLOSED' } }),
    db.disciplineRecord.aggregate({ where: { schoolId }, _sum: { meritPoints: true } }),
    db.disciplineRecord.aggregate({ where: { schoolId }, _sum: { demeritPoints: true } }),
    db.disciplineRecord.count({ where: { schoolId, parentNotified: true } }),
  ])

  const stats = {
    total,
    open,
    resolved,
    closed,
    totalMerit: totalMeritAgg._sum.meritPoints || 0,
    totalDemerit: totalDemeritAgg._sum.demeritPoints || 0,
    parentNotifiedCount,
  }

  const incidentTypeBreakdown = await db.disciplineRecord.groupBy({
    by: ['incidentType'],
    where: { schoolId },
    _count: { id: true },
  })

  return {
    data: records,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats,
    incidentTypeBreakdown: incidentTypeBreakdown.map((i) => ({ type: i.incidentType, count: i._count.id })),
  }
}

export async function createDisciplineRecord(
  schoolId: string,
  body: {
    studentId?: string
    incidentType?: string
    description?: string
    date?: string
    action?: string
    meritPoints?: number
    demeritPoints?: number
    parentNotified?: boolean
  },
) {
  const { studentId, incidentType, description, date, action, meritPoints, demeritPoints, parentNotified } = body
  if (!studentId || !incidentType || !description) {
    throw new AppError('VALIDATION', 'Student ID, incident type, and description are required')
  }

  const student = await db.student.findUnique({ where: { id: studentId, schoolId }, select: { id: true } })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const record = await db.disciplineRecord.create({
    data: {
      schoolId,
      studentId,
      incidentType,
      description,
      date: date ? new Date(date) : new Date(),
      action: action || null,
      meritPoints: meritPoints ?? 0,
      demeritPoints: demeritPoints ?? 0,
      parentNotified: parentNotified ?? false,
      status: 'OPEN',
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
  })

  logAudit({ action: 'CREATE', entity: 'discipline', entityId: record.id, schoolId, afterValue: record }).catch(
    () => {},
  )
  return record
}

export async function updateDisciplineRecord(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.disciplineRecord.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  const record = await db.disciplineRecord.update({
    where: { id },
    data: {
      incidentType: updates.incidentType as string | undefined,
      description: updates.description as string | undefined,
      action: updates.action as string | undefined,
      meritPoints: updates.meritPoints as number | undefined,
      demeritPoints: updates.demeritPoints as number | undefined,
      parentNotified: updates.parentNotified as boolean | undefined,
      status: updates.status as any,
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
  })

  logAudit({ action: 'UPDATE', entity: 'discipline', entityId: record.id, schoolId, afterValue: record }).catch(
    () => {},
  )
  return record
}

export async function deleteDisciplineRecord(schoolId: string, id: string) {
  const existing = await db.disciplineRecord.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  await db.disciplineRecord.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'discipline', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleDisciplineError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
