import { db } from '@/lib/db'
import type { RequestContext } from '@/server/context'

const STAFF_ROLES: readonly string[] = ['ADMIN', 'SUPER_ADMIN', 'BURSAR']

/**
 * Role-aware visibility filter for student-linked finance rows (FeeInvoice,
 * FeePayment). Staff (admin/bursar/super-admin) see the whole school; a parent
 * sees only their own children; a student sees only themselves. Returns null
 * when the caller has no finance visibility (e.g. TEACHER) — the caller should
 * then return an empty result set.
 *
 * SECURITY (blueprint §3.2): for non-staff this PINS the studentId scope, so a
 * parent/student cannot widen results by passing ?studentId=<another family's
 * child>. Without this, GET /api/finance/{payments,invoices} returned the whole
 * school's records to any authenticated user (cross-family financial leak).
 */
export async function financeStudentScope(
  ctx: RequestContext,
): Promise<{ where: Record<string, unknown>; staff: boolean } | null> {
  if (STAFF_ROLES.includes(ctx.role)) {
    return { where: { student: { schoolId: ctx.schoolId } }, staff: true }
  }

  if (ctx.role === 'STUDENT') {
    const u = await db.user.findUnique({ where: { id: ctx.userId }, select: { studentId: true } })
    if (!u?.studentId) return null
    return { where: { studentId: u.studentId, student: { schoolId: ctx.schoolId } }, staff: false }
  }

  if (ctx.role === 'PARENT') {
    const u = await db.user.findUnique({ where: { id: ctx.userId }, select: { parentId: true } })
    if (!u?.parentId) return null
    const links = await db.studentParent.findMany({
      where: { parentId: u.parentId, student: { schoolId: ctx.schoolId } },
      select: { studentId: true },
    })
    const ids = links.map((l) => l.studentId)
    if (ids.length === 0) return null
    return { where: { studentId: { in: ids }, student: { schoolId: ctx.schoolId } }, staff: false }
  }

  // TEACHER and any other role: no finance visibility.
  return null
}
