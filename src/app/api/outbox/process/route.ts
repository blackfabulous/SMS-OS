import { validateRole } from '@/lib/api-auth'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { processOutbox } from '@/server/outbox'

/**
 * POST /api/outbox/process
 * Polls pending/failed outbox jobs and dispatches them. Call from a Vercel cron,
 * a background worker, or an admin panel. ADMIN/SUPER_ADMIN only.
 *
 * Body (optional): { limit?: number, topics?: string[] }
 */
export async function POST(request: Request) {
  const auth = await validateRole(['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  let body: { limit?: number; topics?: string[] } = {}
  try {
    body = await request.json()
  } catch {
    // no body is fine
  }

  const limit = typeof body.limit === 'number' ? body.limit : 50
  const topics = Array.isArray(body.topics) ? body.topics : undefined

  try {
    const stats = await processOutbox({ limit, topics })
    return ok(stats)
  } catch (err) {
    logger.error({ err }, 'outbox process failed')
    return fail('INTERNAL', 'Failed to process outbox')
  }
}
