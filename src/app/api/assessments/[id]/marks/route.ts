import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getAssessmentWithMarks, saveAssessmentMarks, handleAssessmentsError } from '@/server/services/assessments'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { id } = await params
    const result = await getAssessmentWithMarks(authResult.session.user.schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleAssessmentsError(error, 'Failed to fetch assessment marks')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const { id } = await params
    const body = await request.json()
    const result = await saveAssessmentMarks(authResult.session.user.schoolId, id, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleAssessmentsError(error, 'Failed to save marks')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
