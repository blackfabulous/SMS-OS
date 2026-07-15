import 'server-only'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface IdempotencyStore {
  get(scope: string, key: string): Promise<unknown | null>
  set(scope: string, key: string, value: unknown, ttlSeconds: number): Promise<void>
}

/**
 * Postgres-backed idempotency store. Keys are scoped so the same idempotency
 * key can be reused across different operations (e.g. `payment` vs `notify`).
 * Expired keys are lazily ignored and can be pruned by a periodic job.
 */
export const prismaIdempotencyStore: IdempotencyStore = {
  async get(scope: string, key: string) {
    const row = await db.idempotencyKey.findUnique({
      where: { scope_key: { scope, key } },
    })
    if (!row) return null
    if (row.expiresAt < new Date()) {
      // Lazy cleanup of expired key.
      await db.idempotencyKey.delete({ where: { scope_key: { scope, key } } }).catch(() => {})
      return null
    }
    return row.response ?? null
  },

  async set(scope: string, key: string, value: unknown, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
    await db.idempotencyKey.upsert({
      where: { scope_key: { scope, key } },
      create: { scope, key, response: value as Prisma.InputJsonValue, expiresAt },
      update: { response: value as Prisma.InputJsonValue, expiresAt },
    })
  },
}

export interface IdempotencyResult<T> {
  result: T
  cached: boolean
}

/**
 * Run `fn` idempotently. If an idempotency key was previously used for this
 * scope and is still live, return the stored response without re-running `fn`.
 * Otherwise run `fn`, store its result, and return it with `cached: false`.
 */
export async function withIdempotency<T>(
  scope: string,
  key: string | null | undefined,
  ttlSeconds: number,
  fn: () => Promise<T>,
  store: IdempotencyStore = prismaIdempotencyStore,
): Promise<IdempotencyResult<T>> {
  if (!key) {
    const result = await fn()
    return { result, cached: false }
  }
  const cached = await store.get(scope, key)
  if (cached !== null) return { result: cached as T, cached: true }
  const result = await fn()
  await store.set(scope, key, result, ttlSeconds)
  return { result, cached: false }
}

export function idempotencyKeyFromRequest(request: Request): string | null {
  return request.headers.get('Idempotency-Key')?.trim() ?? null
}
