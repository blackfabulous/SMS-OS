import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Request-scoped tenant context (blueprint §3.2, RA-B3).
 *
 * Carries the caller's schoolId through the async execution of a request so the
 * Prisma client (src/lib/db.ts) can set the Postgres `app.current_school_id`
 * GUC per query, which Row-Level Security policies enforce. Established once by
 * the auth helpers (validateAuth / getRequestTenant / requireContext) via
 * `enterTenant`, then read by the db extension via `currentSchoolId`.
 */
interface TenantStore {
  schoolId?: string
  /** True while inside an interactive $transaction that already set the GUC. */
  inTx?: boolean
}

const store = new AsyncLocalStorage<TenantStore>()

/**
 * Bind the tenant for the remainder of this request's async execution.
 * Uses enterWith so callers don't have to wrap a callback. Idempotent — if a
 * store already exists it is updated in place.
 */
export function enterTenant(schoolId: string | null | undefined): void {
  if (!schoolId) return
  const existing = store.getStore()
  if (existing) {
    existing.schoolId = schoolId
    return
  }
  store.enterWith({ schoolId })
}

export function currentSchoolId(): string | undefined {
  return store.getStore()?.schoolId
}

export function isInTenantTx(): boolean {
  return store.getStore()?.inTx ?? false
}

/** Run `fn` with the in-transaction flag set, so nested query hooks don't re-wrap. */
export async function withTenantTxFlag<T>(fn: () => Promise<T>): Promise<T> {
  const s = store.getStore()
  if (!s) return fn()
  const prev = s.inTx
  s.inTx = true
  try {
    return await fn()
  } finally {
    s.inTx = prev
  }
}

/** Explicit callback form (used by tests / background jobs that have no auth helper). */
export function runWithTenant<T>(schoolId: string, fn: () => T): T {
  return store.run({ schoolId }, fn)
}
