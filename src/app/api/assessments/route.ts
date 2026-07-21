import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import {
  listAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  handleAssessmentsError,
} from '@/server/services/assessments'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const assessmentType = searchParams.get('assessmentType')
    const subjectId = searchParams.get('subjectId')
    const classId = searchParams.get('classId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listAssessments(tenantResult.schoolId, { assessmentType, subjectId, classId, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleAssessmentsError(error, 'Failed to fetch assessments')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const assessment = await createAssessment(authResult.session.user.schoolId, body)
    return ok(assessment, 201)
  } catch (error) {
    const { code, message } = handleAssessmentsError(error, 'Failed to create assessment')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Assessment ID is required')

    const assessment = await updateAssessment(schoolId, id, updates)
    return ok(assessment)
  } catch (error) {
    const { code, message } = handleAssessmentsError(error, 'Failed to update assessment')
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
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Assessment ID is required')

    const result = await deleteAssessment(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleAssessmentsError(error, 'Failed to delete assessment')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
