import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { listExaminationCandidates, registerCandidate, updateCandidate, deleteCandidate, handleExaminationsError } from '@/server/services/examinations'

export async function GET(request: Request) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error
  const { schoolId } = tenantResult

  try {
    const { searchParams } = new URL(request.url)
    const data = await listExaminationCandidates(schoolId, {
      examLevel: searchParams.get('examLevel') || undefined,
      year: searchParams.get('year') || undefined,
      registrationStatus: searchParams.get('registrationStatus') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    })
    return ok(data)
  } catch (error) {
    const { code, message } = handleExaminationsError(error, 'Failed to fetch examinations')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const candidate = await registerCandidate(schoolId, body)
    return ok(candidate, 201)
  } catch (error) {
    const { code, message } = handleExaminationsError(error, 'Failed to register candidate')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return fail('VALIDATION', 'Candidate ID is required')

    const candidate = await updateCandidate(schoolId, id, updates)
    return ok(candidate)
  } catch (error) {
    const { code, message } = handleExaminationsError(error, 'Failed to update candidate')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: Request) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return fail('VALIDATION', 'Candidate ID is required')

    const result = await deleteCandidate(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleExaminationsError(error, 'Failed to delete candidate')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
