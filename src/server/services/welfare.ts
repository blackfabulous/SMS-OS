import 'server-only'
import { db } from '@/lib/db'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  type?: string
  search?: string
  status?: string
  category?: string
  page?: number
  limit?: number
}

export async function listWelfare(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const status = params.status ?? ''
  const category = params.category ?? ''

  if (params.type === 'beam') {
    const beamWhere: Record<string, unknown> = { schoolId }
    if (status) beamWhere.status = status
    if (search) {
      beamWhere.student = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { studentNumber: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [beamApplications, beamTotal] = await Promise.all([
      db.beamApplication.findMany({
        where: beamWhere,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true, gender: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.beamApplication.count({ where: beamWhere }),
    ])

    const [applied, approved, rejected, totalCoveredAgg, totalOutstandingAgg] = await Promise.all([
      db.beamApplication.count({ where: { schoolId, status: 'APPLIED' } }),
      db.beamApplication.count({ where: { schoolId, status: 'APPROVED' } }),
      db.beamApplication.count({ where: { schoolId, status: 'REJECTED' } }),
      db.beamApplication.aggregate({ where: { schoolId }, _sum: { coveredAmount: true } }),
      db.beamApplication.aggregate({ where: { schoolId }, _sum: { outstandingBalance: true } }),
    ])

    return {
      data: beamApplications,
      total: beamTotal,
      page,
      totalPages: Math.ceil(beamTotal / limit),
      stats: {
        total: beamTotal,
        applied,
        approved,
        rejected,
        totalCovered: Number(totalCoveredAgg._sum.coveredAmount ?? 0),
        totalOutstanding: Number(totalOutstandingAgg._sum.outstandingBalance ?? 0),
      },
    }
  }

  const welfareWhere: Record<string, unknown> = { schoolId }
  if (status) welfareWhere.status = status
  if (category) welfareWhere.category = category
  if (search) {
    welfareWhere.student = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [welfareRecords, welfareTotal] = await Promise.all([
    db.welfareRecord.findMany({
      where: welfareWhere,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true, gender: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.welfareRecord.count({ where: welfareWhere }),
  ])

  const [beamApplications, openCases, inProgressCases, closedCases, confidentialCases, beamApplied, beamApproved, beamRejected, totalBeamCoveredAgg] =
    await Promise.all([
      db.beamApplication.findMany({
        where: { schoolId },
        include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.welfareRecord.count({ where: { schoolId, status: 'OPEN' } }),
      db.welfareRecord.count({ where: { schoolId, status: 'IN_PROGRESS' } }),
      db.welfareRecord.count({ where: { schoolId, status: 'CLOSED' } }),
      db.welfareRecord.count({ where: { schoolId, isConfidential: true } }),
      db.beamApplication.count({ where: { schoolId, status: 'APPLIED' } }),
      db.beamApplication.count({ where: { schoolId, status: 'APPROVED' } }),
      db.beamApplication.count({ where: { schoolId, status: 'REJECTED' } }),
      db.beamApplication.aggregate({ where: { schoolId }, _sum: { coveredAmount: true } }),
    ])

  const stats = {
    totalWelfareCases: welfareTotal,
    openCases,
    inProgressCases,
    closedCases,
    confidentialCases,
    beamApplied,
    beamApproved,
    beamRejected,
    totalBeamCovered: Number(totalBeamCoveredAgg._sum.coveredAmount ?? 0),
  }

  const categoryBreakdown = await db.welfareRecord.groupBy({
    by: ['category'],
    where: { schoolId },
    _count: { id: true },
  })

  return {
    data: welfareRecords,
    total: welfareTotal,
    page,
    totalPages: Math.ceil(welfareTotal / limit),
    beamApplications,
    stats,
    categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category, count: c._count.id })),
  }
}

export async function createBeamApplication(
  schoolId: string,
  body: {
    studentId?: string
    guardianSituation?: string
    orphanStatus?: string
    notes?: string
    coveredAmount?: number
    outstandingBalance?: number
    socialWelfareRef?: string
  },
) {
  const { studentId, guardianSituation, orphanStatus, notes, coveredAmount, outstandingBalance, socialWelfareRef } = body
  if (!studentId) throw new AppError('VALIDATION', 'Student ID is required')

  const student = await db.student.findUnique({ where: { id: studentId, schoolId }, select: { id: true } })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const existing = await db.beamApplication.findFirst({ where: { studentId, schoolId } })
  if (existing) throw new AppError('CONFLICT', 'Student already has a BEAM application')

  const beamApplication = await db.beamApplication.create({
    data: {
      schoolId,
      studentId,
      guardianSituation: guardianSituation || null,
      orphanStatus: orphanStatus || null,
      notes: notes || null,
      coveredAmount: coveredAmount ?? 0,
      outstandingBalance: outstandingBalance ?? 0,
      socialWelfareRef: socialWelfareRef || null,
      status: 'APPLIED',
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } },
    },
  })

  await db.student.update({ where: { id: studentId }, data: { beamStatus: 'APPLIED' } })
  return beamApplication
}

export async function createWelfareRecord(
  schoolId: string,
  body: {
    studentId?: string
    category?: string
    description?: string
    actionTaken?: string
    referredTo?: string
    isConfidential?: boolean
  },
) {
  const { studentId, category, description, actionTaken, referredTo, isConfidential } = body
  if (!studentId || !category) throw new AppError('VALIDATION', 'Student ID and category are required')

  const student = await db.student.findUnique({ where: { id: studentId, schoolId }, select: { id: true } })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const welfareRecord = await db.welfareRecord.create({
    data: {
      schoolId,
      studentId,
      category,
      description: description || null,
      actionTaken: actionTaken || null,
      referredTo: referredTo || null,
      isConfidential: isConfidential !== undefined ? isConfidential : true,
      status: 'OPEN',
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } },
    },
  })

  return welfareRecord
}

export async function updateBeamApplication(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.beamApplication.findFirst({ where: { id, schoolId }, select: { id: true, studentId: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  const record = await db.beamApplication.update({
    where: { id },
    data: {
      status: updates.status as any,
      coveredAmount: updates.coveredAmount != null ? Number(updates.coveredAmount) : undefined,
      outstandingBalance: updates.outstandingBalance != null ? Number(updates.outstandingBalance) : undefined,
      notes: updates.notes as string | undefined,
      socialWelfareRef: updates.socialWelfareRef as string | undefined,
      guardianSituation: updates.guardianSituation as string | undefined,
      orphanStatus: updates.orphanStatus as string | undefined,
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, beamStatus: true } } },
  })

  if (updates.status && record.student) {
    await db.student.update({ where: { id: record.student.id }, data: { beamStatus: updates.status as any } })
  }

  return record
}

export async function updateWelfareRecord(schoolId: string, id: string, updates: Record<string, unknown>) {
  const existing = await db.welfareRecord.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  const record = await db.welfareRecord.update({
    where: { id },
    data: {
      category: updates.category as string | undefined,
      description: updates.description as string | undefined,
      actionTaken: updates.actionTaken as string | undefined,
      referredTo: updates.referredTo as string | undefined,
      status: updates.status as any,
      isConfidential: updates.isConfidential as boolean | undefined,
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
  })

  return record
}

export async function deleteBeamApplication(schoolId: string, id: string) {
  const existing = await db.beamApplication.findFirst({ where: { id, schoolId }, select: { id: true, studentId: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  await db.beamApplication.delete({ where: { id } })
  await db.student.update({ where: { id: existing.studentId }, data: { beamStatus: null } })
  return { deleted: true, id }
}

export async function deleteWelfareRecord(schoolId: string, id: string) {
  const existing = await db.welfareRecord.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Record not found')

  await db.welfareRecord.delete({ where: { id } })
  return { deleted: true, id }
}

export function handleWelfareError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
