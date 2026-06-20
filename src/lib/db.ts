import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if cached PrismaClient has the expected models (handles schema migrations in dev)
if (globalForPrisma.prisma && typeof (globalForPrisma.prisma as unknown as Record<string, unknown>).websitePage === 'undefined') {
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Retry a query when the database is briefly unreachable.
 *
 * The dev DB is a Supabase free-tier project that PAUSES after inactivity: the
 * first query after a pause fails with P1001 / PrismaClientInitializationError
 * ("Can't reach database server") and then the project wakes within a couple of
 * seconds. This wrapper retries only those connection errors (with backoff),
 * which transparently rides out a cold start. Application errors (bad input,
 * unique violations, etc.) are re-thrown immediately.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 800): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const code = (err as { code?: string })?.code
      const msg = err instanceof Error ? err.message : String(err)
      const isConnError =
        code === 'P1001' ||
        err?.constructor?.name === 'PrismaClientInitializationError' ||
        /reach database server|Can't reach|connection pool|ECONNREFUSED|ETIMEDOUT/i.test(msg)
      if (!isConnError || attempt === retries) throw err
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)))
    }
  }
  throw lastErr
}