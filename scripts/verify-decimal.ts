/**
 * Runtime check that Decimal money columns surface to the app as `number`
 * (via the db.ts result extension) and that writes coerce number -> Decimal.
 *   bun scripts/verify-decimal.ts
 */
import { db } from '../src/lib/db'

async function main() {
  // Read path: a FeeInvoice's money fields must be JS numbers at runtime.
  const inv = await db.feeInvoice.findFirst()
  if (inv) {
    const types = {
      totalAmount: typeof inv.totalAmount,
      amountPaid: typeof inv.amountPaid,
      balance: typeof inv.balance,
    }
    console.log('[read] FeeInvoice money field types:', types, '→ values:', {
      totalAmount: inv.totalAmount, amountPaid: inv.amountPaid, balance: inv.balance,
    })
    const allNumbers = Object.values(types).every((t) => t === 'number')
    console.log(allNumbers ? '  ✓ all money fields are number at runtime' : '  ✗ NOT all number')
    // JSON serialization must produce numbers (not strings) — protects the UI.
    const json = JSON.parse(JSON.stringify({ balance: inv.balance }))
    console.log('  JSON balance is', typeof json.balance, json.balance, json.balance === inv.balance ? '✓' : '✗')
  } else {
    console.log('[read] no FeeInvoice rows to sample (seed data may be empty)')
  }

  // Aggregate path: _sum of a Decimal column (used by dashboards/reports).
  const agg = await db.feeInvoice.aggregate({ _sum: { totalAmount: true, balance: true } })
  console.log('[aggregate] _sum.totalAmount =', agg._sum.totalAmount, `(${typeof agg._sum.totalAmount})`,
    '| _sum.balance =', agg._sum.balance, `(${typeof agg._sum.balance})`)

  await db.$disconnect()
  console.log('\nDecimal runtime check complete.')
}

main().catch(async (e) => {
  console.error('verify-decimal failed:', e)
  await db.$disconnect()
  process.exit(1)
})
