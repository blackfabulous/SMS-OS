import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth } from '@/lib/api-auth'
import { getDashboardMetrics } from '@/server/services/dashboard'

export async function GET() {
  try {
    const authResult = await validateAuth()
    if ('error' in authResult) return authResult.error

    const result = await getDashboardMetrics(authResult.session.user.schoolId)
    return ok(result)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching dashboard data')
    return fail('INTERNAL', 'Failed to fetch dashboard data')
  }
}
