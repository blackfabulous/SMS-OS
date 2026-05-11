import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const courseId = searchParams.get('courseId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let schoolId: string | undefined
    const school = await db.school.findFirst()
    schoolId = school?.id

    if (type === 'resources') {
      const resWhere: Record<string, unknown> = {}
      if (courseId) resWhere.courseId = courseId
      const [resources, resTotal] = await Promise.all([
        db.courseResource.findMany({ where: resWhere, include: { course: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        db.courseResource.count({ where: resWhere }),
      ])
      return NextResponse.json({ data: resources, total: resTotal, page, totalPages: Math.ceil(resTotal / limit) })
    }

    if (type === 'assignments') {
      const asgWhere: Record<string, unknown> = {}
      if (courseId) asgWhere.courseId = courseId
      const [assignments, asgTotal] = await Promise.all([
        db.courseAssignment.findMany({ where: asgWhere, include: { course: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        db.courseAssignment.count({ where: asgWhere }),
      ])
      return NextResponse.json({ data: assignments, total: asgTotal, page, totalPages: Math.ceil(asgTotal / limit) })
    }

    // Default: courses
    const [courses, total] = await Promise.all([
      db.course.findMany({
        where: { schoolId, isActive: true },
        include: { resources: { take: 5, orderBy: { createdAt: 'desc' } }, assignments: { take: 5, orderBy: { createdAt: 'desc' } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.course.count({ where: { schoolId, isActive: true } }),
    ])

    const stats = {
      activeCourses: total,
      totalResources: await db.courseResource.count(),
      totalAssignments: await db.courseAssignment.count(),
      avgCompletion: (await db.course.aggregate({ where: { schoolId, isActive: true }, _avg: { syllabusCompletion: true } }))._avg.syllabusCompletion || 0,
    }

    return NextResponse.json({ data: courses, total, page, totalPages: Math.ceil(total / limit), stats })
  } catch (error) {
    console.error('Failed to fetch e-learning data:', error)
    return NextResponse.json({ error: 'Failed to fetch e-learning data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    if (action === 'addCourse') {
      const { name, description, instructor, subjectId, enrollmentCount, syllabusCompletion } = body
      if (!name) return NextResponse.json({ error: 'Course name is required' }, { status: 400 })

      const course = await db.course.create({
        data: { schoolId: schoolId || 'default', name, description: description || null, instructor: instructor || null, subjectId: subjectId || null, enrollmentCount: enrollmentCount || 0, syllabusCompletion: syllabusCompletion || 0 },
        include: { resources: true, assignments: true },
      })
      return NextResponse.json(course, { status: 201 })
    }

    if (action === 'addResource') {
      const { courseId, title, resourceType, url, fileSize, uploadedBy } = body
      if (!courseId || !title) return NextResponse.json({ error: 'Course ID and title are required' }, { status: 400 })

      const resource = await db.courseResource.create({
        data: { courseId, title, resourceType: resourceType || 'NOTES', url: url || null, fileSize: fileSize || 0, uploadedBy: uploadedBy || null },
      })
      return NextResponse.json(resource, { status: 201 })
    }

    if (action === 'addAssignment') {
      const { courseId, title, description, maxMarks, dueDate } = body
      if (!courseId || !title) return NextResponse.json({ error: 'Course ID and title are required' }, { status: 400 })

      const assignment = await db.courseAssignment.create({
        data: { courseId, title, description: description || null, maxMarks: maxMarks || 100, dueDate: dueDate ? new Date(dueDate) : null, status: 'OPEN' },
      })
      return NextResponse.json(assignment, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process e-learning request:', error)
    return NextResponse.json({ error: 'Failed to process e-learning request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'course') {
      const course = await db.course.update({
        where: { id },
        data: { name: updates.name, description: updates.description, instructor: updates.instructor, enrollmentCount: updates.enrollmentCount, syllabusCompletion: updates.syllabusCompletion, isActive: updates.isActive },
      })
      return NextResponse.json(course)
    }

    if (type === 'resource') {
      const resource = await db.courseResource.update({
        where: { id },
        data: { title: updates.title, resourceType: updates.resourceType, url: updates.url, downloads: updates.downloads },
      })
      return NextResponse.json(resource)
    }

    if (type === 'assignment') {
      const assignment = await db.courseAssignment.update({
        where: { id },
        data: { title: updates.title, description: updates.description, maxMarks: updates.maxMarks, dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined, status: updates.status, submissionsCount: updates.submissionsCount, avgScore: updates.avgScore },
      })
      return NextResponse.json(assignment)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update e-learning record:', error)
    return NextResponse.json({ error: 'Failed to update e-learning record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'course') {
      await db.course.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'resource') {
      await db.courseResource.delete({ where: { id } })
    } else if (type === 'assignment') {
      await db.courseAssignment.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete e-learning record:', error)
    return NextResponse.json({ error: 'Failed to delete e-learning record' }, { status: 500 })
  }
}
