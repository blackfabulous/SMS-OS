import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import {
  listElearning,
  addCourse,
  addResource,
  addAssignment,
  updateCourse,
  updateResource,
  updateAssignment,
  deleteCourse,
  deleteResource,
  deleteAssignment,
  handleElearningError,
} from '@/server/services/elearning'

export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const courseId = searchParams.get('courseId')
    const resourceType = searchParams.get('resourceType')
    const assignmentStatus = searchParams.get('assignmentStatus')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const schoolId = authResult.session.user.schoolId

    if (!schoolId) return fail('VALIDATION', 'School not configured')

    const result = await listElearning(schoolId, { type, courseId, resourceType, assignmentStatus, search, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleElearningError(error, 'Failed to fetch e-learning data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (!schoolId) return fail('VALIDATION', 'School not configured')

    if (action === 'addCourse') {
      const course = await addCourse(schoolId, body)
      return ok(course, 201)
    }

    if (action === 'addResource') {
      const resource = await addResource(schoolId, body)
      return ok(resource, 201)
    }

    if (action === 'addAssignment') {
      const assignment = await addAssignment(schoolId, body)
      return ok(assignment, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use addCourse, addResource, or addAssignment')
  } catch (error) {
    const { code, message } = handleElearningError(error, 'Failed to process e-learning request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'course') {
      const course = await updateCourse(schoolId, id, updates)
      return ok(course)
    }

    if (type === 'resource') {
      const resource = await updateResource(schoolId, id, updates)
      return ok(resource)
    }

    if (type === 'assignment') {
      const assignment = await updateAssignment(schoolId, id, updates)
      return ok(assignment)
    }

    return fail('VALIDATION', 'Invalid type')
  } catch (error) {
    const { code, message } = handleElearningError(error, 'Failed to update e-learning record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'course') {
      const result = await deleteCourse(schoolId, id)
      return ok(result)
    }

    if (type === 'resource') {
      const result = await deleteResource(schoolId, id)
      return ok(result)
    }

    if (type === 'assignment') {
      const result = await deleteAssignment(schoolId, id)
      return ok(result)
    }

    return fail('VALIDATION', 'Invalid type')
  } catch (error) {
    const { code, message } = handleElearningError(error, 'Failed to delete e-learning record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
