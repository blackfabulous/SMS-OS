import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { generateClassReportCardsViaOutbox } from '@/lib/report-card-service'

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
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'classId and termId are required' }, { status: 400 })

  try {
    const result = await generateClassReportCardsViaOutbox(tenant.schoolId, parsed.data.classId, parsed.data.termId)
    logAudit({
      action: 'CREATE',
      entity: 'report-card.generate',
      entityId: parsed.data.classId,
      afterValue: { termId: parsed.data.termId, generated: result.generated },
    }).catch(() => {})
    return NextResponse.json({ generated: result.generated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate report cards'
    const status = message === 'Class not found' || message === 'Term not found' ? 404 : 500
    if (status === 500) console.error('report-card generate failed', err)
    return NextResponse.json({ error: message }, { status })
  }
}
