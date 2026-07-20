import { db, withDbRetry } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {}
  const start = Date.now()

  try {
    await withDbRetry(() => db.$queryRaw`SELECT 1`, 2, 500)
    checks.database = 'ok'
  } catch (error) {
    checks.database = 'fail'
    logger.error({ err: error }, 'Deep health check: database unreachable')
    return fail('INTERNAL', 'Service unhealthy', { checks, responseTimeMs: Date.now() - start })
  }

  return ok({ status: 'healthy', checks, responseTimeMs: Date.now() - start })
}
