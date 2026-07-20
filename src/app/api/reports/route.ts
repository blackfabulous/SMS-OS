import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { getReport, handleReportsError } from '@/server/services/reports'

export async function GET(request: NextRequest) {
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN', 'BURSAR'] })
  if ('error' in result) return result.error

  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const data = await getReport(result.ctx.schoolId, reportType)
    return ok(data)
  } catch (error) {
    const { code, message } = handleReportsError(error, 'Failed to generate report')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
