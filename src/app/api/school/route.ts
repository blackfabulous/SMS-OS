import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getSchool, updateSchool, createSchoolWithSetup, handleSchoolError } from '@/server/services/school'

export async function GET() {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const school = await getSchool(authResult.session.user.schoolId)
    return ok(school)
  } catch (error) {
    const { code, message } = handleSchoolError(error, 'Failed to fetch school info')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const school = await updateSchool(authResult.session.user.schoolId, body)
    return ok(school)
  } catch (error) {
    const { code, message } = handleSchoolError(error, 'Failed to update school info')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['SUPER_ADMIN', 'ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await createSchoolWithSetup(body)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handleSchoolError(error, 'Failed to create school')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
