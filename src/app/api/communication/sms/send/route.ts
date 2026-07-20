import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { sendSmsViaAfricasTalking, handleCommunicationsError } from '@/server/services/communications'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const result = await sendSmsViaAfricasTalking(schoolId, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleCommunicationsError(error, 'Failed to send SMS')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
