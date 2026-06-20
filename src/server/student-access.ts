import { db } from '@/lib/db'
import type { RequestContext } from '@/server/context'

const STAFF_ROLES: readonly string[] = ['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'TEACHER']

/**
 * Whether the caller may view a specific student's records (blueprint §3.2).
 * Staff may view any student IN THEIR SCHOOL — the caller must still scope the
 * data query by schoolId, so a staffer from another tenant resolves to no row.
 * A parent may view only their linked children; a student only themselves.
 */
export async function canAccessStudent(ctx: RequestContext, studentId: string): Promise<boolean> {
  if (STAFF_ROLES.includes(ctx.role)) return true

  if (ctx.role === 'STUDENT') {
    const u = await db.user.findUnique({ where: { id: ctx.userId }, select: { studentId: true } })
    return !!u?.studentId && u.studentId === studentId
  }

  if (ctx.role === 'PARENT') {
    const u = await db.user.findUnique({ where: { id: ctx.userId }, select: { parentId: true } })
    if (!u?.parentId) return false
    const link = await db.studentParent.findFirst({
      where: { parentId: u.parentId, studentId },
      select: { id: true },
    })
    return !!link
  }

  return false
}
