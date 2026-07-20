import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getStudent, updateStudent, deleteStudent, handleStudentsError } from '@/server/services/students'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { id } = await params
    const { user } = authResult.session
    const result = await getStudent(user.schoolId, id, user as any)
    return ok(result)
  } catch (error) {
    const { code, message } = handleStudentsError(error, 'Failed to fetch student')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const { id } = await params
    const body = await request.json()
    const student = await updateStudent(authResult.session.user.schoolId, id, body)
    return ok(student)
  } catch (error) {
    const { code, message } = handleStudentsError(error, 'Failed to update student')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { id } = await params
    const result = await deleteStudent(authResult.session.user.schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleStudentsError(error, 'Failed to delete student')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
