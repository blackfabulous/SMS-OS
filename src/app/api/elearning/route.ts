import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
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

      return NextResponse.json({
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

      return NextResponse.json({
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

    return NextResponse.json({
      data: courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch e-learning data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch e-learning data' },
      { status: 500 }
    )
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
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
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
        return NextResponse.json(
          { error: 'Course name is required' },
          { status: 400 }
        )
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
      return NextResponse.json(course, { status: 201 })
    }

    // Add Resource
    if (action === 'addResource') {
      const { courseId, title, resourceType, url, fileSize, uploadedBy } = body
      if (!courseId || !title) {
        return NextResponse.json(
          { error: 'Course ID and title are required' },
          { status: 400 }
        )
      }

      // Verify course belongs to school
      const course = await db.course.findFirst({
        where: { id: courseId, schoolId },
      })
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
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
      return NextResponse.json(resource, { status: 201 })
    }

    // Add Assignment
    if (action === 'addAssignment') {
      const { courseId, title, description, maxMarks, dueDate } = body
      if (!courseId || !title) {
        return NextResponse.json(
          { error: 'Course ID and title are required' },
          { status: 400 }
        )
      }

      // Verify course belongs to school
      const course = await db.course.findFirst({
        where: { id: courseId, schoolId },
      })
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
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
      return NextResponse.json(assignment, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use addCourse, addResource, or addAssignment' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to process e-learning request:', error)
    return NextResponse.json(
      { error: 'Failed to process e-learning request' },
      { status: 500 }
    )
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
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    const schoolId = authResult.session.user.schoolId

    if (type === 'course') {
      const ownedCourse = await db.course.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedCourse) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
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
      return NextResponse.json(course)
    }

    if (type === 'resource') {
      const ownedResource = await db.courseResource.findFirst({ where: { id, course: { schoolId } }, select: { id: true } })
      if (!ownedResource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
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
      return NextResponse.json(resource)
    }

    if (type === 'assignment') {
      const ownedAssignment = await db.courseAssignment.findFirst({ where: { id, course: { schoolId } }, select: { id: true } })
      if (!ownedAssignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
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
      return NextResponse.json(assignment)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update e-learning record:', error)
    return NextResponse.json(
      { error: 'Failed to update e-learning record' },
      { status: 500 }
    )
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
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'course') {
      await db.course.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'resource') {
      await db.courseResource.delete({ where: { id } })
    } else if (type === 'assignment') {
      await db.courseAssignment.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    logAudit({ action: 'DELETE', entity: 'elearning', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete e-learning record:', error)
    return NextResponse.json(
      { error: 'Failed to delete e-learning record' },
      { status: 500 }
    )
  }
}
