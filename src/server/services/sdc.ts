import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string | null
  type?: string | null
  isActive?: string | null
  page?: number
  limit?: number
}

export async function listSDC(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search || ''

  const memberFilter: Record<string, unknown> = { schoolId }
  if (search) {
    memberFilter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (params.isActive !== null && params.isActive !== undefined) {
    memberFilter.isActive = params.isActive === 'true'
  }

  const eventFilter: Record<string, unknown> = { schoolId }
  if (search) {
    eventFilter.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { venue: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (params.type === 'member') {
    const [members, memberTotal] = await Promise.all([
      db.sDCMember.findMany({ where: memberFilter, orderBy: { createdAt: 'asc' }, skip, take: limit }),
      db.sDCMember.count({ where: memberFilter }),
    ])
    return { data: members, total: memberTotal, page, totalPages: Math.ceil(memberTotal / limit) }
  }

  if (params.type === 'meeting') {
    const meetingFilter = { ...eventFilter, eventType: 'MEETING' }
    const [meetings, meetingTotal] = await Promise.all([
      db.schoolEvent.findMany({ where: meetingFilter, orderBy: { startDate: 'desc' }, skip, take: limit }),
      db.schoolEvent.count({ where: meetingFilter }),
    ])
    return { data: meetings, total: meetingTotal, page, totalPages: Math.ceil(meetingTotal / limit) }
  }

  if (params.type === 'project') {
    const projectFilter = { ...eventFilter, eventType: { in: ['FUNDRAISER', 'PROJECT'] } }
    const [projects, projectTotal] = await Promise.all([
      db.schoolEvent.findMany({ where: projectFilter, orderBy: { startDate: 'desc' }, skip, take: limit }),
      db.schoolEvent.count({ where: projectFilter }),
    ])
    return { data: projects, total: projectTotal, page, totalPages: Math.ceil(projectTotal / limit) }
  }

  const [members, memberTotal] = await Promise.all([
    db.sDCMember.findMany({ where: memberFilter, orderBy: { createdAt: 'asc' }, skip, take: limit }),
    db.sDCMember.count({ where: memberFilter }),
  ])

  const [totalFunds, allEvents] = await Promise.all([
    db.feePayment.aggregate({ where: { schoolId }, _sum: { amount: true }, _count: true }),
    db.schoolEvent.findMany({ where: eventFilter, orderBy: { startDate: 'desc' }, take: 100 }),
  ])

  const meetings = allEvents.filter((e) => e.eventType === 'MEETING')
  const projects = allEvents.filter((e) => e.eventType === 'FUNDRAISER' || e.eventType === 'PROJECT')

  const school = await db.school.findUnique({ where: { id: schoolId } })

  const stats = {
    totalMembers: memberTotal,
    activeMembers: await db.sDCMember.count({ where: { schoolId, isActive: true } }),
    meetingsThisTerm: meetings.length,
    activeProjects: projects.length,
    fundBalance: Number(totalFunds._sum.amount ?? 0),
    totalPayments: totalFunds._count,
  }

  return {
    members,
    meetings,
    projects,
    events: allEvents,
    stats,
    schoolInfo: {
      sdcChairperson: school?.sdcChairperson,
      sdcSecretary: school?.sdcSecretary,
      sdcTreasurer: school?.sdcTreasurer,
    },
    pagination: { page, limit, totalMembers: memberTotal, totalPages: Math.ceil(memberTotal / limit) },
  }
}

export async function createMeeting(schoolId: string, body: Record<string, unknown>) {
  if (!body.title || !body.startDate) throw new AppError('VALIDATION', 'Title and startDate are required')

  const meeting = await db.schoolEvent.create({
    data: {
      schoolId,
      title: body.title as string,
      description: (body.description as string) || null,
      eventType: 'MEETING',
      startDate: new Date(body.startDate as string),
      endDate: body.endDate ? new Date(body.endDate as string) : null,
      venue: (body.venue as string) || null,
    },
  })

  logAudit({ action: 'CREATE', entity: 'sdc', entityId: meeting.id, schoolId, afterValue: meeting }).catch(() => {})
  return meeting
}

export async function createProject(schoolId: string, body: Record<string, unknown>) {
  if (!body.title || !body.startDate) throw new AppError('VALIDATION', 'Title and startDate are required')

  const project = await db.schoolEvent.create({
    data: {
      schoolId,
      title: body.title as string,
      description: (body.description as string) || null,
      eventType: (body.eventType as string) || 'PROJECT',
      startDate: new Date(body.startDate as string),
      endDate: body.endDate ? new Date(body.endDate as string) : null,
      venue: (body.venue as string) || null,
    },
  })

  logAudit({ action: 'CREATE', entity: 'sdc', entityId: project.id, schoolId, afterValue: project }).catch(() => {})
  return project
}

async function syncSchoolSDCOfficer(schoolId: string, position: string, name: string) {
  if (position === 'Chairperson') await db.school.update({ where: { id: schoolId }, data: { sdcChairperson: name } })
  else if (position === 'Secretary') await db.school.update({ where: { id: schoolId }, data: { sdcSecretary: name } })
  else if (position === 'Treasurer') await db.school.update({ where: { id: schoolId }, data: { sdcTreasurer: name } })
}

export async function createSDCMember(schoolId: string, body: Record<string, unknown>) {
  if (!body.name || !body.position) throw new AppError('VALIDATION', 'Name and position are required')

  const member = await db.sDCMember.create({
    data: {
      schoolId,
      name: body.name as string,
      position: body.position as string,
      phone: (body.phone as string) || null,
      email: (body.email as string) || null,
      termStart: body.termStart ? new Date(body.termStart as string) : null,
      termEnd: body.termEnd ? new Date(body.termEnd as string) : null,
      isActive: true,
    },
  })

  await syncSchoolSDCOfficer(schoolId, body.position as string, body.name as string)

  logAudit({ action: 'CREATE', entity: 'sdc', entityId: member.id, schoolId, afterValue: member }).catch(() => {})
  return member
}

export async function updateSDCMember(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.sDCMember.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'SDC member not found')

  const member = await db.sDCMember.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      position: updates.position as string | undefined,
      phone: updates.phone as string | undefined,
      email: updates.email as string | undefined,
      isActive: updates.isActive as boolean | undefined,
      termEnd: updates.termEnd ? new Date(updates.termEnd as string) : undefined,
    },
  })

  if (updates.position && updates.name) {
    await syncSchoolSDCOfficer(schoolId, updates.position as string, updates.name as string)
  }

  logAudit({ action: 'UPDATE', entity: 'sdc', entityId: member.id, schoolId, afterValue: member }).catch(() => {})
  return member
}

export async function updateSDCEvent(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Event not found')

  const event = await db.schoolEvent.update({
    where: { id },
    data: {
      title: updates.title as string | undefined,
      description: updates.description as string | undefined,
      venue: updates.venue as string | undefined,
      startDate: updates.startDate ? new Date(updates.startDate as string) : undefined,
      endDate: updates.endDate ? new Date(updates.endDate as string) : undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'sdc', entityId: event.id, schoolId, afterValue: event }).catch(() => {})
  return event
}

export async function deleteSDCEvent(schoolId: string, id: string) {
  const owned = await db.schoolEvent.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Not found')

  await db.schoolEvent.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'sdc', entityId: id, schoolId }).catch(() => {})
  return { message: 'Deleted successfully' }
}

export async function deleteSDCMember(schoolId: string, id: string, soft = false) {
  const owned = await db.sDCMember.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Not found')

  if (soft) await db.sDCMember.update({ where: { id }, data: { isActive: false } })
  else await db.sDCMember.delete({ where: { id } })

  logAudit({ action: 'DELETE', entity: 'sdc', entityId: id, schoolId }).catch(() => {})
  return { message: 'Deleted successfully' }
}

export function handleSDCError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
