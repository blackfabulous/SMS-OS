import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { getStudentStatement, handleFinanceError } from '@/server/services/finance'

export async function GET(request: NextRequest) {
  const result = await requireContext({ roles: ['ADMIN', 'BURSAR', 'TEACHER', 'SUPER_ADMIN'] })
  if ('error' in result) return result.error

  try {
    const studentId = new URL(request.url).searchParams.get('studentId')
    if (!studentId) return fail('VALIDATION', 'studentId is required')

    const data = await getStudentStatement(result.ctx.schoolId, studentId)
    return ok(data)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to generate statement')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
