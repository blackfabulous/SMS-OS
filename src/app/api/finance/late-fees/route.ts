import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { previewLateFees, applyLateFees, handleFinanceError } from '@/server/services/finance'

export async function GET() {
  const result = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in result) return result.error

  try {
    const data = await previewLateFees(result.ctx.schoolId)
    return ok(data)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to fetch late-fees preview')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST() {
  const result = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in result) return result.error

  try {
    const data = await applyLateFees(result.ctx.schoolId)
    return ok(data)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to apply late fees')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
