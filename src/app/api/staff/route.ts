import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { createStaff, listStaff, handleStaffError } from '@/server/services/staff'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const staffType = searchParams.get('staffType') || ''
    const position = searchParams.get('position') || ''
    const isActive = searchParams.get('isActive') || ''
    const department = searchParams.get('department') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await listStaff(tenantResult.schoolId, { search, staffType, position, isActive, department, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleStaffError(error, 'Failed to fetch staff')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const staff = await createStaff(authResult.session.user.schoolId, body)
    return ok(staff, 201)
  } catch (error) {
    const { code, message } = handleStaffError(error, 'Failed to create staff')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
