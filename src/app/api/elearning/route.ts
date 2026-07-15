import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/elearning - List courses, resources, assignments with filters
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // courses | resources | assignments
    const courseId = searchParams.get('courseId')
    const resourceType = searchParams.get('resourceType')
    const assignmentStatus = searchParams.get('assignmentStatus')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const schoolId = authResult.session.user.schoolId

    if (!schoolId) {
      return fail('VALIDATION', 'School not configured')
    }

    // Resources list
    if (type === 'resources') {
      const resWhere: Record<string, unknown> = {}
      if (courseId) resWhere.courseId = courseId
      if (resourceType) resWhere.resourceType = resourceType.toUpperCase()
      if (search) {
        resWhere.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { url: { contains: search, mode: 'insensitive' } },
          { uploadedBy: { contains: search, mode: 'insensitive' } },
        ]
      }
      // Only show resources for courses belonging to this school
      if (!courseId) {
        const schoolCourses = await db.course.findMany({
          where: { schoolId },
          select: { id: true },
        })
        resWhere.courseId = { in: schoolCourses.map((c) => c.id) }
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

      return ok({
        data: resources,
        total: resTotal,
        page,
        totalPages: Math.ceil(resTotal / limit),
      })
    }

    // Assignments list
    if (type === 'assignments') {
      const asgWhere: Record<string, unknown> = {}
      if (courseId) asgWhere.courseId = courseId
      if (assignmentStatus) asgWhere.status = assignmentStatus.toUpperCase()
      if (search) {
        asgWhere.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }
      // Only show assignments for courses belonging to this school
      if (!courseId) {
        const schoolCourses = await db.course.findMany({
          where: { schoolId },
          select: { id: true },
        })
        asgWhere.courseId = { in: schoolCourses.map((c) => c.id) }
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

      return ok({
        data: assignments,
        total: asgTotal,
        page,
        totalPages: Math.ceil(asgTotal / limit),
      })
    }

    // Default: courses list
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
        include: {
          resources: { take: 5, orderBy: { createdAt: 'desc' } },
          assignments: { take: 5, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.course.count({ where }),
    ])

    // E-learning stats
    const stats = {
      activeCourses: total,
      totalResources: await db.courseResource.count(),
      totalAssignments: await db.courseAssignment.count(),
      avgCompletion:
        (
          await db.course.aggregate({
            where: { schoolId, isActive: true },
            _avg: { syllabusCompletion: true },
          })
        )._avg.syllabusCompletion || 0,
      totalEnrollments:
        (
          await db.course.aggregate({
            where: { schoolId, isActive: true },
            _sum: { enrollmentCount: true },
          })
        )._sum.enrollmentCount || 0,
    }

    return ok({
      data: courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch e-learning data')
    return fail('INTERNAL', 'Failed to fetch e-learning data')
  }
}

// POST /api/elearning - Create course, resource, or assignment
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (!schoolId) {
      return fail('VALIDATION', 'School not configured')
    }

    // Create Course
    if (action === 'addCourse') {
      const {
        name,
        description,
        instructor,
        subjectId,
        enrollmentCount,
        syllabusCompletion,
      } = body
      if (!name) {
        return fail('VALIDATION', 'Course name is required')
      }

      const course = await db.course.create({
        data: {
          schoolId,
          name,
          description: description || null,
          instructor: instructor || null,
          subjectId: subjectId || null,
          enrollmentCount: enrollmentCount || 0,
          syllabusCompletion: syllabusCompletion || 0,
        },
        include: { resources: true, assignments: true },
      })
      logAudit({ action: 'CREATE', entity: 'elearning', entityId: (course as any)?.id, afterValue: course }).catch(() => {})
      return ok(course, 201)
    }

    // Add Resource
    if (action === 'addResource') {
      const { courseId, title, resourceType, url, fileSize, uploadedBy } = body
      if (!courseId || !title) {
        return fail('VALIDATION', 'Course ID and title are required')
      }

      // Verify course belongs to school
      const course = await db.course.findFirst({
        where: { id: courseId, schoolId },
      })
      if (!course) {
        return fail('NOT_FOUND', 'Course not found')
      }

      const resource = await db.courseResource.create({
        data: {
          schoolId,
          courseId,
          title,
          resourceType: resourceType || 'NOTES',
          url: url || null,
          fileSize: fileSize || 0,
          uploadedBy: uploadedBy || null,
        },
      })
      logAudit({ action: 'CREATE', entity: 'elearning', entityId: (resource as any)?.id, afterValue: resource }).catch(() => {})
      return ok(resource, 201)
    }

    // Add Assignment
    if (action === 'addAssignment') {
      const { courseId, title, description, maxMarks, dueDate } = body
      if (!courseId || !title) {
        return fail('VALIDATION', 'Course ID and title are required')
      }

      // Verify course belongs to school
      const course = await db.course.findFirst({
        where: { id: courseId, schoolId },
      })
      if (!course) {
        return fail('NOT_FOUND', 'Course not found')
      }

      const assignment = await db.courseAssignment.create({
        data: {
          schoolId,
          courseId,
          title,
          description: description || null,
          maxMarks: maxMarks || 100,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'OPEN',
        },
      })
      logAudit({ action: 'CREATE', entity: 'elearning', entityId: (assignment as any)?.id, afterValue: assignment }).catch(() => {})
      return ok(assignment, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use addCourse, addResource, or addAssignment')
  } catch (error) {
    logger.error({ err: error }, 'Failed to process e-learning request')
    return fail('INTERNAL', 'Failed to process e-learning request')
  }
}

// PUT /api/elearning - Update course, resource, or assignment
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }
    const schoolId = authResult.session.user.schoolId

    if (type === 'course') {
      const ownedCourse = await db.course.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedCourse) return fail('NOT_FOUND', 'Course not found')
      const course = await db.course.update({
        where: { id },
        data: {
          name: updates.name,
          description: updates.description,
          instructor: updates.instructor,
          enrollmentCount: updates.enrollmentCount,
          syllabusCompletion: updates.syllabusCompletion,
          isActive: updates.isActive,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'elearning', entityId: (course as any)?.id, afterValue: course }).catch(() => {})
      return ok(course)
    }

    if (type === 'resource') {
      const ownedResource = await db.courseResource.findFirst({ where: { id, course: { schoolId } }, select: { id: true } })
      if (!ownedResource) return fail('NOT_FOUND', 'Resource not found')
      const resource = await db.courseResource.update({
        where: { id },
        data: {
          title: updates.title,
          resourceType: updates.resourceType,
          url: updates.url,
          downloads: updates.downloads,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'elearning', entityId: (resource as any)?.id, afterValue: resource }).catch(() => {})
      return ok(resource)
    }

    if (type === 'assignment') {
      const ownedAssignment = await db.courseAssignment.findFirst({ where: { id, course: { schoolId } }, select: { id: true } })
      if (!ownedAssignment) return fail('NOT_FOUND', 'Assignment not found')
      const assignment = await db.courseAssignment.update({
        where: { id },
        data: {
          title: updates.title,
          description: updates.description,
          maxMarks: updates.maxMarks,
          dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
          status: updates.status,
          submissionsCount: updates.submissionsCount,
          avgScore: updates.avgScore,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'elearning', entityId: (assignment as any)?.id, afterValue: assignment }).catch(() => {})
      return ok(assignment)
    }

    return fail('VALIDATION', 'Invalid type')
  } catch (error) {
    logger.error({ err: error }, 'Failed to update e-learning record')
    return fail('INTERNAL', 'Failed to update e-learning record')
  }
}

// DELETE /api/elearning - Delete course, resource, or assignment
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }

    if (type === 'course') {
      await db.course.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'resource') {
      await db.courseResource.delete({ where: { id } })
    } else if (type === 'assignment') {
      await db.courseAssignment.delete({ where: { id } })
    } else {
      return fail('VALIDATION', 'Invalid type')
    }

    logAudit({ action: 'DELETE', entity: 'elearning', entityId: (id ?? undefined) }).catch(() => {})
    return ok({ message: 'Deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete e-learning record')
    return fail('INTERNAL', 'Failed to delete e-learning record')
  }
}
