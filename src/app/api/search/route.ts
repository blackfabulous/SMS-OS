import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { globalSearch, handleSearchError } from '@/server/services/search'

export async function GET(request: NextRequest) {
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'TEACHER'] })
  if ('error' in result) return result.error

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const data = await globalSearch(result.ctx.schoolId, query)
    return ok(data)
  } catch (error) {
    const { code, message } = handleSearchError(error, 'Failed to search')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
