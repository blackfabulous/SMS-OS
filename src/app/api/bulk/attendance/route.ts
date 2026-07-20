import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { bulkAttendance, handleBulkError } from '@/server/services/bulk'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  try {
    const body = await request.json()
    const result = await bulkAttendance(tenant.schoolId, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleBulkError(error, 'Failed to process bulk attendance')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
