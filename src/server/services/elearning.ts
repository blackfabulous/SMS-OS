import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  type?: string | null
  courseId?: string | null
  resourceType?: string | null
  assignmentStatus?: string | null
  search?: string | null
  page?: number
  limit?: number
}

export async function listElearning(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search || ''

  if (params.type === 'resources') {
    const resWhere: Record<string, unknown> = { schoolId }
    if (params.courseId) resWhere.courseId = params.courseId
    if (params.resourceType) resWhere.resourceType = params.resourceType.toUpperCase()
    if (search) {
      resWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
        { uploadedBy: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [resources, resTotal] = await Promise.all([
      db.courseResource.findMany({
        where: resWhere,
        include: { course: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.courseResource.count({ where: resWhere }),
    ])

    return { data: resources, total: resTotal, page, totalPages: Math.ceil(resTotal / limit) }
  }

  if (params.type === 'assignments') {
    const asgWhere: Record<string, unknown> = { schoolId }
    if (params.courseId) asgWhere.courseId = params.courseId
    if (params.assignmentStatus) asgWhere.status = params.assignmentStatus.toUpperCase()
    if (search) {
      asgWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [assignments, asgTotal] = await Promise.all([
      db.courseAssignment.findMany({
        where: asgWhere,
        include: { course: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.courseAssignment.count({ where: asgWhere }),
    ])

    return { data: assignments, total: asgTotal, page, totalPages: Math.ceil(asgTotal / limit) }
  }

  const where: Record<string, unknown> = { schoolId, isActive: true }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { instructor: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      include: { resources: { take: 5, orderBy: { createdAt: 'desc' } }, assignments: { take: 5, orderBy: { createdAt: 'desc' } } },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    db.course.count({ where }),
  ])

  const [totalResources, totalAssignments, avgCompletion, totalEnrollments] = await Promise.all([
    db.courseResource.count({ where: { schoolId } }),
    db.courseAssignment.count({ where: { schoolId } }),
    db.course.aggregate({ where: { schoolId, isActive: true }, _avg: { syllabusCompletion: true } }),
    db.course.aggregate({ where: { schoolId, isActive: true }, _sum: { enrollmentCount: true } }),
  ])

  const stats = {
    activeCourses: total,
    totalResources,
    totalAssignments,
    avgCompletion: avgCompletion._avg.syllabusCompletion || 0,
    totalEnrollments: totalEnrollments._sum.enrollmentCount || 0,
  }

  return { data: courses, total, page, totalPages: Math.ceil(total / limit), stats }
}

export async function addCourse(schoolId: string, body: Record<string, unknown>) {
  const { name, description, instructor, subjectId, enrollmentCount, syllabusCompletion } = body
  if (!name) throw new AppError('VALIDATION', 'Course name is required')

  const course = await db.course.create({
    data: {
      schoolId,
      name: name as string,
      description: (description as string) || null,
      instructor: (instructor as string) || null,
      subjectId: (subjectId as string) || null,
      enrollmentCount: (enrollmentCount as number) ?? 0,
      syllabusCompletion: (syllabusCompletion as number) ?? 0,
    },
    include: { resources: true, assignments: true },
  })

  logAudit({ action: 'CREATE', entity: 'elearning', entityId: course.id, schoolId, afterValue: course }).catch(() => {})
  return course
}

export async function addResource(schoolId: string, body: Record<string, unknown>) {
  const { courseId, title, resourceType, url, fileSize, uploadedBy } = body
  if (!courseId || !title) throw new AppError('VALIDATION', 'Course ID and title are required')

  const course = await db.course.findFirst({ where: { id: courseId as string, schoolId } })
  if (!course) throw new AppError('NOT_FOUND', 'Course not found')

  const resource = await db.courseResource.create({
    data: {
      schoolId,
      courseId: courseId as string,
      title: title as string,
      resourceType: (resourceType as any) || 'NOTES',
      url: (url as string) || null,
      fileSize: (fileSize as number) ?? 0,
      uploadedBy: (uploadedBy as string) || null,
    },
  })

  logAudit({ action: 'CREATE', entity: 'elearning', entityId: resource.id, schoolId, afterValue: resource }).catch(
    () => {},
  )
  return resource
}

export async function addAssignment(schoolId: string, body: Record<string, unknown>) {
  const { courseId, title, description, maxMarks, dueDate } = body
  if (!courseId || !title) throw new AppError('VALIDATION', 'Course ID and title are required')

  const course = await db.course.findFirst({ where: { id: courseId as string, schoolId } })
  if (!course) throw new AppError('NOT_FOUND', 'Course not found')

  const assignment = await db.courseAssignment.create({
    data: {
      schoolId,
      courseId: courseId as string,
      title: title as string,
      description: (description as string) || null,
      maxMarks: (maxMarks as number) ?? 100,
      dueDate: dueDate ? new Date(dueDate as string) : null,
      status: 'OPEN' as any,
    },
  })

  logAudit({ action: 'CREATE', entity: 'elearning', entityId: assignment.id, schoolId, afterValue: assignment }).catch(
    () => {},
  )
  return assignment
}

export async function updateCourse(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.course.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Course not found')

  const course = await db.course.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      description: updates.description as string | undefined,
      instructor: updates.instructor as string | undefined,
      enrollmentCount: updates.enrollmentCount as number | undefined,
      syllabusCompletion: updates.syllabusCompletion as number | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'elearning', entityId: course.id, schoolId, afterValue: course }).catch(() => {})
  return course
}

export async function updateResource(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.courseResource.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Resource not found')

  const resource = await db.courseResource.update({
    where: { id },
    data: {
      title: updates.title as string | undefined,
      resourceType: updates.resourceType as any,
      url: updates.url as string | undefined,
      downloads: updates.downloads as number | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'elearning', entityId: resource.id, schoolId, afterValue: resource }).catch(
    () => {},
  )
  return resource
}

export async function updateAssignment(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.courseAssignment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Assignment not found')

  const assignment = await db.courseAssignment.update({
    where: { id },
    data: {
      title: updates.title as string | undefined,
      description: updates.description as string | undefined,
      maxMarks: updates.maxMarks as number | undefined,
      dueDate: updates.dueDate ? new Date(updates.dueDate as string) : undefined,
      status: updates.status as any,
      submissionsCount: updates.submissionsCount as number | undefined,
      avgScore: updates.avgScore as number | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'elearning', entityId: assignment.id, schoolId, afterValue: assignment }).catch(
    () => {},
  )
  return assignment
}

export async function deleteCourse(schoolId: string, id: string) {
  const owned = await db.course.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Course not found')

  await db.course.update({ where: { id }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'elearning', entityId: id, schoolId }).catch(() => {})
  return { message: 'Deleted successfully' }
}

export async function deleteResource(schoolId: string, id: string) {
  const owned = await db.courseResource.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Resource not found')

  await db.courseResource.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'elearning', entityId: id, schoolId }).catch(() => {})
  return { message: 'Deleted successfully' }
}

export async function deleteAssignment(schoolId: string, id: string) {
  const owned = await db.courseAssignment.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Assignment not found')

  await db.courseAssignment.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'elearning', entityId: id, schoolId }).catch(() => {})
  return { message: 'Deleted successfully' }
}

export function handleElearningError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
