import 'server-only'
import { db } from '@/lib/db'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
}

export interface RateLimitStore {
  check(key: string, windowSeconds: number, maxRequests: number): Promise<RateLimitResult>
}

/**
 * Postgres-backed fixed-window rate limiter. Distributed by default because all
 * instances share the same DB. For very high traffic, swap in a Redis-backed store
 * without changing callers.
 *
 * Uses a single row per key per window; `windowSeconds` should be a small integer
 * (e.g. 60). `resetAt` is rounded to the start of the next window.
 */
export const prismaRateLimitStore: RateLimitStore = {
  async check(key: string, windowSeconds: number, maxRequests: number): Promise<RateLimitResult> {
    const now = new Date()
    const windowMs = windowSeconds * 1000
    const currentWindowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs)
    const resetAt = new Date(currentWindowStart.getTime() + windowMs)

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.rateLimitWindow.findUnique({ where: { key } })
      if (!existing || existing.windowStart < currentWindowStart) {
        // New window or first request.
        const upserted = await tx.rateLimitWindow.upsert({
          where: { key },
          create: { key, windowStart: currentWindowStart, count: 1 },
          update: { windowStart: currentWindowStart, count: 1 },
        })
        return { count: upserted.count, resetAt }
      }

      if (existing.count >= maxRequests) {
        return { count: existing.count, resetAt }
      }

      const updated = await tx.rateLimitWindow.update({
        where: { key },
        data: { count: { increment: 1 } },
      })
      return { count: updated.count, resetAt }
    })

    const remaining = Math.max(0, maxRequests - result.count)
    return { allowed: result.count <= maxRequests, limit: maxRequests, remaining, resetAt: result.resetAt }
  },
}

/**
 * Convenience helper for routes. Key defaults to `${scope}:${identifier}`.
 * Returns a 429-style response payload if disallowed, or null if allowed.
 */
export async function checkRateLimit(
  scope: string,
  identifier: string,
  options: { windowSeconds?: number; maxRequests?: number; store?: RateLimitStore } = {},
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  const { windowSeconds = 60, maxRequests = 30, store = prismaRateLimitStore } = options
  const key = `${scope}:${identifier}`
  const result = await store.check(key, windowSeconds, maxRequests)
  return { allowed: result.allowed, result }
}
