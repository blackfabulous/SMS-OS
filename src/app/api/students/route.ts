import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { createStudent, listStudents, handleStudentsError } from '@/server/services/students'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender') || ''
    const enrollmentStatus = searchParams.get('enrollmentStatus') || ''
    const grade = searchParams.get('grade') || ''
    const boardingStatus = searchParams.get('boardingStatus') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await listStudents(tenantResult.schoolId, { search, gender, enrollmentStatus, grade, boardingStatus, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleStudentsError(error, 'Failed to fetch students')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const student = await createStudent(authResult.session.user.schoolId, body)
    return ok(student, 201)
  } catch (error) {
    const { code, message } = handleStudentsError(error, 'Failed to create student')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
