import { z } from 'zod'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { generateClassReportCardsViaOutbox } from '@/server/services/report-cards'

/**
 * POST /api/reports/report-card/generate
 * Body: { classId, termId }
 * Generates/refreshes report cards for every active student in the class for the
 * term (computed grades + class positions). Preserves existing workflow state.
 * ADMIN/TEACHER only.
 */
const Schema = z.object({ classId: z.string().min(1), termId: z.string().min(1) })

export async function POST(request: Request) {
  const auth = await validateRole(['ADMIN', 'TEACHER', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  let body: unknown
  try { body = await request.json() } catch { return fail('VALIDATION', 'Invalid JSON body') }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return fail('VALIDATION', 'classId and termId are required')

  try {
    const result = await generateClassReportCardsViaOutbox(tenant.schoolId, parsed.data.classId, parsed.data.termId)
    logAudit({
      action: 'CREATE',
      entity: 'report-card.generate',
      entityId: parsed.data.classId,
      afterValue: { termId: parsed.data.termId, generated: result.generated },
    }).catch(() => {})
    return ok({ generated: result.generated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate report cards'
    if (message === 'Class not found' || message === 'Term not found') {
      return fail('NOT_FOUND', message)
    }
    logger.error({ err }, 'report-card generate failed')
    return fail('INTERNAL', message)
  }
}
