/**
 * Tenant-scoping helpers (blueprint §3.2 — defense in depth).
 * Pure (no DB import) so it is unit-testable; intended for server use.
 *
 * RULE: no route handler queries Prisma directly. Reads/writes go through a
 * service that uses these helpers so `schoolId` is ALWAYS part of the filter.
 * `tenantWhere` builds the where-clause; `assertOwned` guards a fetched row.
 * (RLS at the DB, RA-B3, is the eventual backstop; this is the app-layer guard.)
 */

/** Compose a Prisma `where` that is always scoped to one school. */
export function tenantWhere<T extends Record<string, unknown>>(schoolId: string, extra?: T): T & { schoolId: string } {
  return { ...(extra ?? ({} as T)), schoolId }
}

/**
 * For child rows owned via a relation (no direct schoolId column), scope through
 * the relation, e.g. tenantViaStudent(schoolId) → { student: { schoolId } }.
 */
export function tenantVia(relation: string, schoolId: string): Record<string, { schoolId: string }> {
  return { [relation]: { schoolId } }
}

export class TenantViolationError extends Error {
  constructor(public resource: string) {
    super(`Cross-tenant access blocked for ${resource}`)
    this.name = 'TenantViolationError'
  }
}

/** Assert a fetched row belongs to the school; throws if not (or null). */
export function assertOwned<T extends { schoolId?: string | null } | null>(
  row: T,
  schoolId: string,
  resource = 'record',
): NonNullable<T> {
  if (!row || (row.schoolId != null && row.schoolId !== schoolId)) {
    throw new TenantViolationError(resource)
  }
  return row as NonNullable<T>
}
