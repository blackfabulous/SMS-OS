import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { applyBeamCoverage, handleFinanceError } from '@/server/services/finance'

export async function POST(request: NextRequest) {
  const result = await requireContext({ roles: ['ADMIN', 'BURSAR', 'SUPER_ADMIN'] })
  if ('error' in result) return result.error

  try {
    let body: { studentId?: string }
    try {
      body = await request.json()
    } catch {
      return fail('VALIDATION', 'Invalid JSON body')
    }
    if (!body.studentId) return fail('VALIDATION', 'studentId is required')

    const data = await applyBeamCoverage(result.ctx.schoolId, body.studentId)
    return ok(data)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to apply BEAM coverage')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
