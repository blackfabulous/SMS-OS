import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string | null
  graduationYear?: string | null
  location?: string | null
  occupation?: string | null
  isNotable?: string | null
  page?: number
  limit?: number
}

export async function listAlumni(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search || ''

  const where: Record<string, unknown> = { schoolId, isActive: true }
  if (params.graduationYear) where.graduationYear = parseInt(params.graduationYear)
  if (params.location) where.location = { contains: params.location, mode: 'insensitive' }
  if (params.occupation) where.occupation = { contains: params.occupation, mode: 'insensitive' }
  if (params.isNotable === 'true') where.isNotable = true
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { occupation: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [alumni, total, totalContributions, notableCount, byGraduationYear, byLocation] = await Promise.all([
    db.alumni.findMany({
      where,
      include: { contributions: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { lastName: 'asc' },
      skip,
      take: limit,
    }),
    db.alumni.count({ where }),
    db.alumniContribution.aggregate({
      where: { schoolId },
      _sum: { amount: true },
    }),
    db.alumni.count({ where: { schoolId, isNotable: true, isActive: true } }),
    db.alumni.groupBy({
      by: ['graduationYear'],
      where: { schoolId, isActive: true },
      _count: { id: true },
      orderBy: { graduationYear: 'asc' },
    }),
    db.alumni.groupBy({
      by: ['location'],
      where: { schoolId, isActive: true, location: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  const stats = {
    totalAlumni: total,
    totalContributions: Number(totalContributions._sum.amount ?? 0),
    notableAlumni: notableCount,
    byGraduationYear: byGraduationYear.map((g) => ({ year: g.graduationYear, count: g._count.id })),
    byLocation: byLocation.slice(0, 10).map((l) => ({ location: l.location, count: l._count.id })),
  }

  return { data: alumni, total, page, totalPages: Math.ceil(total / limit), stats }
}

export async function addAlumniContribution(
  schoolId: string,
  body: { alumniId?: string; amount?: number; contributionType?: string; description?: string; campaign?: string; date?: string | Date },
) {
  const { alumniId, amount, contributionType, description, campaign, date } = body
  if (!alumniId || amount === undefined || amount === null) throw new AppError('VALIDATION', 'Alumni ID and amount are required')

  const ownedAlumni = await db.alumni.findFirst({ where: { id: alumniId, schoolId }, select: { id: true } })
  if (!ownedAlumni) throw new AppError('NOT_FOUND', 'Alumni not found')

  const contribution = await db.alumniContribution.create({
    data: {
      schoolId,
      alumniId,
      amount: amount as any,
      contributionType: (contributionType as any) || 'DONATION',
      description: description || null,
      campaign: campaign || null,
      date: date ? new Date(date) : new Date(),
    },
  })

  await db.alumni.update({ where: { id: alumniId }, data: { totalContributions: { increment: amount as any } } })

  logAudit({ action: 'CREATE', entity: 'alumni', entityId: contribution.id, schoolId, afterValue: contribution }).catch(
    () => {},
  )
  return contribution
}

export async function createAlumni(schoolId: string, body: Record<string, unknown>) {
  const { firstName, lastName, graduationYear, email, phone, occupation, company, location, isNotable } = body
  if (!firstName || !lastName || !graduationYear) throw new AppError('VALIDATION', 'First name, last name, and graduation year are required')

  const alumniRecord = await db.alumni.create({
    data: {
      schoolId,
      firstName: firstName as string,
      lastName: lastName as string,
      graduationYear: parseInt(String(graduationYear)),
      email: (email as string) || null,
      phone: (phone as string) || null,
      occupation: (occupation as string) || null,
      company: (company as string) || null,
      location: (location as string) || null,
      isNotable: (isNotable as boolean) || false,
    },
    include: { contributions: true },
  })

  logAudit({ action: 'CREATE', entity: 'alumni', entityId: alumniRecord.id, schoolId, afterValue: alumniRecord }).catch(
    () => {},
  )
  return alumniRecord
}

export async function updateAlumni(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.alumni.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Alumni not found')

  const alumniRecord = await db.alumni.update({
    where: { id },
    data: {
      firstName: updates.firstName as string | undefined,
      lastName: updates.lastName as string | undefined,
      graduationYear: updates.graduationYear ? parseInt(String(updates.graduationYear)) : undefined,
      email: updates.email as string | undefined,
      phone: updates.phone as string | undefined,
      occupation: updates.occupation as string | undefined,
      company: updates.company as string | undefined,
      location: updates.location as string | undefined,
      isNotable: updates.isNotable as boolean | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
    include: { contributions: true },
  })

  logAudit({ action: 'UPDATE', entity: 'alumni', entityId: alumniRecord.id, schoolId, afterValue: alumniRecord }).catch(
    () => {},
  )
  return alumniRecord
}

export async function deleteAlumni(schoolId: string, id: string) {
  const owned = await db.alumni.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Alumni not found')

  await db.alumni.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'alumni', entityId: id, schoolId }).catch(() => {})
  return { message: 'Alumni record deleted successfully' }
}

export function handleAlumniError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
