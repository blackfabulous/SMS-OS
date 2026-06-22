import { PrismaClient } from '@prisma/client'
import { currentSchoolId, isInTenantTx, withTenantTxFlag } from '@/server/tenant-context'

/**
 * Row-Level Security is enabled per-deployment with RLS_ENABLED=true (RA-B3).
 * When on, every query carries the request's tenant (app.current_school_id GUC)
 * so Postgres RLS policies enforce isolation at the DB — a backstop for any
 * missing app-layer scope. When off (default) the extension is a pass-through,
 * so behavior is identical to a plain PrismaClient until RLS is verified+enabled.
 * See docs/RLS.md for the enablement + verification procedure.
 */
const RLS_ENABLED = process.env.RLS_ENABLED === 'true'

function createPrisma() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

  const setGuc = (schoolId: string) =>
    base.$executeRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`

  return base.$extends({
    // Money is stored as Postgres Decimal (precise storage + precise SQL sums) but
    // surfaced to the app/UI as `number` so existing code and JSON responses are
    // unchanged. Writes accept numbers (Prisma coerces number -> Decimal).
    result: {
      feeInvoice: {
        totalAmount: { needs: { totalAmount: true }, compute: (r) => Number(r.totalAmount) },
        amountPaid: { needs: { amountPaid: true }, compute: (r) => Number(r.amountPaid) },
        balance: { needs: { balance: true }, compute: (r) => Number(r.balance) },
      },
    },
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          if (!RLS_ENABLED) return query(args)
          const schoolId = currentSchoolId()
          // No tenant context (public/seed/pre-auth) or already inside a tenant
          // transaction → run as-is. Otherwise wrap so SET LOCAL + the query run
          // on one connection (required under PgBouncer transaction pooling).
          if (!schoolId || isInTenantTx()) return query(args)
          const [, result] = await base.$transaction([setGuc(schoolId), query(args)])
          return result
        },
      },
    },
    client: {
      // Inject the tenant GUC as the first statement of interactive transactions
      // started by app code, so their statements are RLS-scoped too.
      $transaction(...txArgs: unknown[]) {
        const schoolId = currentSchoolId()
        const [arg, opts] = txArgs
        if (RLS_ENABLED && schoolId && typeof arg === 'function') {
           
          return (base.$transaction as any)(async (tx: any) => {
            await tx.$executeRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`
             
            return withTenantTxFlag(() => (arg as (t: any) => Promise<unknown>)(tx))
          }, opts)
        }
         
        return (base.$transaction as any)(...txArgs)
      },
    },
  })
}

type ExtendedPrisma = ReturnType<typeof createPrisma>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrisma | undefined
}

// Drop a stale cached client from before recent schema changes (dev only).
if (globalForPrisma.prisma && typeof (globalForPrisma.prisma as unknown as Record<string, unknown>).websitePage === 'undefined') {
  globalForPrisma.prisma = undefined
}

export const db = globalForPrisma.prisma ?? createPrisma()

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
