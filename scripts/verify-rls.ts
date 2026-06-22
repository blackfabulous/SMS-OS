/**
 * RLS readiness + verification probe (RA-B3, see docs/RLS.md).
 *
 *   bun scripts/verify-rls.ts            # report-only (role, GUC, current RLS state)
 *   bun scripts/verify-rls.ts --isolate # also run a live two-school isolation check
 *
 * Read-only by default. It NEVER enables RLS — apply prisma/rls/enable-rls.sql
 * separately. Use this before and after enabling to confirm enforcement works.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const isolate = process.argv.includes('--isolate')

  // 1) Which role does the app connect as, and does it bypass RLS?
  const role = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT current_user AS role,
            (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS is_super,
            (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypasses_rls`,
  )
  const r = role[0] ?? {}
  console.log('\n[1] Connection role:', r)
  const bypasses = r.bypasses_rls === true || r.is_super === true
  if (bypasses) {
    console.log('    ⚠️  This role BYPASSES RLS — policies will NOT be enforced for the app.')
    console.log('       Create/use a non-superuser, non-BYPASSRLS role for DATABASE_URL.')
  } else {
    console.log('    ✓ Role is subject to RLS policies.')
  }

  // 2) Can we set + read the tenant GUC on one connection (PgBouncer-safe via tx)?
  const guc = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_school_id', 'probe-school', true)`
    return tx.$queryRaw<Array<{ v: string | null }>>`SELECT current_setting('app.current_school_id', true) AS v`
  })
  console.log('\n[2] GUC round-trip in a transaction:', guc[0]?.v === 'probe-school' ? '✓ works' : `✗ got ${JSON.stringify(guc[0])}`)

  // 3) Current RLS state on a few representative tables.
  const state = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT relname AS "table", relrowsecurity AS "rlsEnabled", relforcerowsecurity AS "rlsForced"
       FROM pg_class
      WHERE relkind = 'r' AND relname IN ('School','Student','Staff','FeeInvoice')
      ORDER BY relname`,
  )
  console.log('\n[3] RLS state (representative tables):')
  console.table(state)
  const anyEnabled = state.some((s) => s.rlsEnabled === true)
  console.log(anyEnabled ? '    RLS is ENABLED on some tables.' : '    RLS not yet enabled (run prisma/rls/enable-rls.sql to enable).')

  // 4) Optional live isolation check (only meaningful once RLS is enabled).
  if (isolate) {
    const schools = await db.$queryRaw<Array<{ id: string }>>`SELECT id FROM "School" LIMIT 2`
    if (schools.length < 2) {
      console.log('\n[4] Isolation check skipped — need ≥2 schools seeded.')
    } else {
      const [a, b] = schools
      const countFor = (sid: string) =>
        db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_school_id', ${sid}, true)`
          const rows = await tx.$queryRaw<Array<{ n: bigint }>>`SELECT count(*)::int AS n FROM "Student"`
          return Number(rows[0]?.n ?? 0)
        })
      const noScope = await (async () => {
        const rows = await db.$queryRaw<Array<{ n: bigint }>>`SELECT count(*)::int AS n FROM "Student"`
        return Number(rows[0]?.n ?? 0)
      })()
      console.log('\n[4] Student counts —',
        `schoolA=${await countFor(a.id)}, schoolB=${await countFor(b.id)}, no-GUC=${noScope}`)
      console.log('    With RLS enforced you expect: each school sees only its own; no-GUC sees 0.')
    }
  }

  console.log('')
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('verify-rls failed:', e)
  await db.$disconnect()
  process.exit(1)
})
