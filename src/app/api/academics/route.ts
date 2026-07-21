import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import {
  getAcademicOverview,
  addGrade,
  addClass,
  addSubject,
  addAssessment,
  updateGrade,
  updateClass,
  updateSubject,
  deleteGrade,
  deleteClass,
  deleteSubject,
  handleAcademicsError,
} from '@/server/services/academics'

export async function GET() {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const result = await getAcademicOverview(tenantResult.schoolId)
    return ok(result)
  } catch (error) {
    const { code, message } = handleAcademicsError(error, 'Failed to fetch academic overview')
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

    if (action === 'addGrade') {
      const grade = await addGrade(schoolId, body)
      return ok(grade, 201)
    }

    if (action === 'addClass') {
      const cls = await addClass(schoolId, body)
      return ok(cls, 201)
    }

    if (action === 'addSubject') {
      const subject = await addSubject(schoolId, body)
      return ok(subject, 201)
    }

    const assessment = await addAssessment(schoolId, body)
    return ok(assessment, 201)
  } catch (error) {
    const { code, message } = handleAcademicsError(error, 'Failed to create academic record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { type, id, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id || !type) return fail('VALIDATION', 'ID and type are required')

    if (type === 'grade') {
      const grade = await updateGrade(schoolId, id, updates)
      return ok(grade)
    }

    if (type === 'class') {
      const cls = await updateClass(schoolId, id, updates)
      return ok(cls)
    }

    if (type === 'subject') {
      const subject = await updateSubject(schoolId, id, updates)
      return ok(subject)
    }

    return fail('VALIDATION', 'Invalid type')
  } catch (error) {
    const { code, message } = handleAcademicsError(error, 'Failed to update academic record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const schoolId = authResult.session.user.schoolId

    if (!id || !type) return fail('VALIDATION', 'ID and type are required')

    if (type === 'grade') {
      const result = await deleteGrade(schoolId, id)
      return ok(result)
    }

    if (type === 'class') {
      const result = await deleteClass(schoolId, id)
      return ok(result)
    }

    if (type === 'subject') {
      const result = await deleteSubject(schoolId, id)
      return ok(result)
    }

    return fail('VALIDATION', 'Invalid type')
  } catch (error) {
    const { code, message } = handleAcademicsError(error, 'Failed to delete academic record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
