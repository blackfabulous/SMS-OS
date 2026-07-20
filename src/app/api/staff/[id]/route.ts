import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getStaff, updateStaff, deleteStaff, handleStaffError } from '@/server/services/staff'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { id } = await params
    const staff = await getStaff(authResult.session.user.schoolId, id)
    return ok(staff)
  } catch (error) {
    const { code, message } = handleStaffError(error, 'Failed to fetch staff')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { id } = await params
    const body = await request.json()
    const staff = await updateStaff(authResult.session.user.schoolId, id, body)
    return ok(staff)
  } catch (error) {
    const { code, message } = handleStaffError(error, 'Failed to update staff')
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
    const result = await deleteStaff(authResult.session.user.schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleStaffError(error, 'Failed to delete staff')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
