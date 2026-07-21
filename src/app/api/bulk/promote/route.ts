import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { bulkPromote, handleBulkError } from '@/server/services/bulk'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const result = await bulkPromote(schoolId, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleBulkError(error, 'Failed to process bulk promotion')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
