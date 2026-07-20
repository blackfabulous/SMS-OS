import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth } from '@/lib/api-auth'
import { initiatePaynowTransaction, handlePaynowError } from '@/server/services/paynow'

export async function POST(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const result = await initiatePaynowTransaction(session.user.schoolId, session.user.id, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handlePaynowError(error, 'Internal server error')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
