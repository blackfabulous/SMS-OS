import { PrismaClient } from '@prisma/client'
import { currentSchoolId, isInTenantTx, withTenantTxFlag } from '@/server/tenant-context'
import { hasSoftDelete } from '@/lib/soft-delete-models'

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
      feeStructure: {
        amount: { needs: { amount: true }, compute: (r) => Number(r.amount) },
      },
      invoiceItem: {
        amount: { needs: { amount: true }, compute: (r) => Number(r.amount) },
      },
      feePayment: {
        amount: { needs: { amount: true }, compute: (r) => Number(r.amount) },
        exchangeRate: { needs: { exchangeRate: true }, compute: (r) => Number(r.exchangeRate) },
      },
      paymentAllocation: {
        amount: { needs: { amount: true }, compute: (r) => Number(r.amount) },
      },
      bankAccount: {
        balance: { needs: { balance: true }, compute: (r) => Number(r.balance) },
      },
      scholarship: {
        amount: { needs: { amount: true }, compute: (r) => (r.amount == null ? null : Number(r.amount)) },
        discountPercentage: { needs: { discountPercentage: true }, compute: (r) => Number(r.discountPercentage) },
      },
      zimsecCandidate: {
        totalFees: { needs: { totalFees: true }, compute: (r) => Number(r.totalFees) },
        feesPaid: { needs: { feesPaid: true }, compute: (r) => Number(r.feesPaid) },
      },
      beamApplication: {
        coveredAmount: { needs: { coveredAmount: true }, compute: (r) => Number(r.coveredAmount) },
        outstandingBalance: { needs: { outstandingBalance: true }, compute: (r) => Number(r.outstandingBalance) },
      },
      staff: {
        basicSalary: { needs: { basicSalary: true }, compute: (r) => Number(r.basicSalary) },
        housingAllowance: { needs: { housingAllowance: true }, compute: (r) => Number(r.housingAllowance) },
        transportAllowance: { needs: { transportAllowance: true }, compute: (r) => Number(r.transportAllowance) },
        responsibilityAllowance: { needs: { responsibilityAllowance: true }, compute: (r) => Number(r.responsibilityAllowance) },
      },
      payslip: {
        basicSalary: { needs: { basicSalary: true }, compute: (r) => Number(r.basicSalary) },
        housingAllowance: { needs: { housingAllowance: true }, compute: (r) => Number(r.housingAllowance) },
        transportAllowance: { needs: { transportAllowance: true }, compute: (r) => Number(r.transportAllowance) },
        responsibilityAllowance: { needs: { responsibilityAllowance: true }, compute: (r) => Number(r.responsibilityAllowance) },
        overtime: { needs: { overtime: true }, compute: (r) => Number(r.overtime) },
        grossPay: { needs: { grossPay: true }, compute: (r) => Number(r.grossPay) },
        paye: { needs: { paye: true }, compute: (r) => Number(r.paye) },
        nssaEmployee: { needs: { nssaEmployee: true }, compute: (r) => Number(r.nssaEmployee) },
        nssaEmployer: { needs: { nssaEmployer: true }, compute: (r) => Number(r.nssaEmployer) },
        aidsLevy: { needs: { aidsLevy: true }, compute: (r) => Number(r.aidsLevy) },
        zimdef: { needs: { zimdef: true }, compute: (r) => Number(r.zimdef) },
        pension: { needs: { pension: true }, compute: (r) => Number(r.pension) },
        medicalAid: { needs: { medicalAid: true }, compute: (r) => Number(r.medicalAid) },
        funeralPolicy: { needs: { funeralPolicy: true }, compute: (r) => Number(r.funeralPolicy) },
        otherDeductions: { needs: { otherDeductions: true }, compute: (r) => Number(r.otherDeductions) },
        netPay: { needs: { netPay: true }, compute: (r) => Number(r.netPay) },
      },
      transportRoute: {
        fee: { needs: { fee: true }, compute: (r) => Number(r.fee) },
      },
      libraryTransaction: {
        fine: { needs: { fine: true }, compute: (r) => Number(r.fine) },
      },
      asset: {
        purchaseCost: { needs: { purchaseCost: true }, compute: (r) => Number(r.purchaseCost) },
      },
      maintenanceRequest: {
        estimatedCost: { needs: { estimatedCost: true }, compute: (r) => (r.estimatedCost == null ? null : Number(r.estimatedCost)) },
        actualCost: { needs: { actualCost: true }, compute: (r) => (r.actualCost == null ? null : Number(r.actualCost)) },
      },
      requisition: {
        estimatedCost: { needs: { estimatedCost: true }, compute: (r) => (r.estimatedCost == null ? null : Number(r.estimatedCost)) },
      },
      canteenItem: {
        price: { needs: { price: true }, compute: (r) => Number(r.price) },
        costPrice: { needs: { costPrice: true }, compute: (r) => Number(r.costPrice) },
      },
      canteenTransaction: {
        totalAmount: { needs: { totalAmount: true }, compute: (r) => Number(r.totalAmount) },
      },
      canteenTransactionItem: {
        unitPrice: { needs: { unitPrice: true }, compute: (r) => Number(r.unitPrice) },
        totalPrice: { needs: { totalPrice: true }, compute: (r) => Number(r.totalPrice) },
      },
      purchaseOrder: {
        totalAmount: { needs: { totalAmount: true }, compute: (r) => Number(r.totalAmount) },
      },
      purchaseOrderItem: {
        unitPrice: { needs: { unitPrice: true }, compute: (r) => Number(r.unitPrice) },
        totalPrice: { needs: { totalPrice: true }, compute: (r) => Number(r.totalPrice) },
      },
      alumni: {
        totalContributions: { needs: { totalContributions: true }, compute: (r) => Number(r.totalContributions) },
      },
      alumniContribution: {
        amount: { needs: { amount: true }, compute: (r) => Number(r.amount) },
      },
      schoolShopItem: {
        price: { needs: { price: true }, compute: (r) => Number(r.price) },
      },
      schoolShopOrder: {
        totalAmount: { needs: { totalAmount: true }, compute: (r) => Number(r.totalAmount) },
      },
    },
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const hasSd = hasSoftDelete(model as string)

          // Soft-delete: redirect delete / deleteMany to an update that sets deletedAt.
          if (hasSd && (operation === 'delete' || operation === 'deleteMany')) {
            const target = operation === 'delete' ? 'update' : 'updateMany'
            return ((this as unknown as Record<string, unknown>)[model as string] as any)[target]({
              ...args,
              data: { deletedAt: new Date() },
            })
          }

          // Filter out soft-deleted rows by default for reads and updates.
          if (
            hasSd &&
            args &&
            typeof args === 'object' &&
            ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy', 'update', 'updateMany'].includes(operation)
          ) {
            const a = args as Record<string, unknown>
            if (!a.where || typeof a.where !== 'object' || !('deletedAt' in a.where)) {
              const where = a.where && typeof a.where === 'object' ? { ...a.where, deletedAt: null } : { deletedAt: null }
              const nextArgs = { ...a, where } as unknown
              return query(nextArgs as typeof args)
            }
          }

          // Row-Level Security: set the tenant GUC per query unless already in a tenant transaction.
          if (!RLS_ENABLED) return query(args)
          const schoolId = currentSchoolId()
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
