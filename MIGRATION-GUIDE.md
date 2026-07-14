# Migration Guide — Re-Architecture Fixes

> This guide covers applying the schema changes introduced in this branch to an existing ZimSchool Pro database.
> For a fresh/empty database you can run `bun run db:push`.

## What changed

1. **Soft-delete (`deletedAt`)** added to every tenant-owned Prisma model.
2. **`schoolId` added** to `FeeInvoice`, `FeePayment`, `InvoiceItem`, `PaymentAllocation`, `Outbox`, `AuditLog`.
3. **Per-school unique numbers** for `FeeInvoice.invoiceNumber` and `FeePayment.receiptNumber`.
4. **New `PaymentAllocation` ledger** between payments and invoices.
5. **New `Outbox` durable-jobs table**.
6. **`AuditLog` now tenant-scoped** with `schoolId`, `actorId`, and `beforeValue`/`afterValue` as JSON.
7. **Prisma extension in `src/lib/db.ts`** auto-filters soft-deleted rows and converts `delete` → soft-delete.

## Recommended migration path

### 1. Create a Prisma migration

```bash
cp .env .env.bak
# Make sure DATABASE_URL points to a staging or production database
npx prisma migrate dev --name rearchitecture_runtime_fixes
```

Review the generated migration SQL before applying it. Prisma Migrate will produce `ALTER TABLE` statements for the new columns and `CREATE TABLE` for `PaymentAllocation`/`Outbox`.

### 2. Back-fill required `schoolId` values

If you have existing data, run the following SQL **inside the same transaction as the migration** (or immediately after) so required columns are not null:

```sql
-- Finance tables: derive schoolId from the owning student
UPDATE "FeeInvoice" i
SET "schoolId" = s."schoolId"
FROM "Student" s
WHERE i."studentId" = s.id AND i."schoolId" IS NULL;

UPDATE "FeePayment" p
SET "schoolId" = s."schoolId"
FROM "Student" s
WHERE p."studentId" = s.id AND p."schoolId" IS NULL;

UPDATE "InvoiceItem" ii
SET "schoolId" = i."schoolId"
FROM "FeeInvoice" i
WHERE ii."invoiceId" = i.id AND ii."schoolId" IS NULL;

-- AuditLog: where possible, link to the school of the performing user
UPDATE "AuditLog" al
SET "schoolId" = u."schoolId"
FROM "User" u
WHERE al."performedBy" = u.id AND al."schoolId" IS NULL;
```

### 3. Handle per-school unique number collisions

If two schools already have the same `invoiceNumber` or `receiptNumber`, the migration will fail. Pre-emptively disambiguate:

```sql
-- Example: append a school-specific suffix to duplicates (run before applying unique)
WITH dupes AS (
  SELECT id, "invoiceNumber", "schoolId",
         ROW_NUMBER() OVER (PARTITION BY "schoolId", "invoiceNumber" ORDER BY "createdAt") AS rn
  FROM "FeeInvoice"
)
UPDATE "FeeInvoice" fi
SET "invoiceNumber" = d."invoiceNumber" || '-' || d.rn
FROM dupes d
WHERE fi.id = d.id AND d.rn > 1;
```

Repeat for `FeePayment.receiptNumber`.

### 4. Re-generate the Prisma client

```bash
bun run db:generate
```

### 5. Verify

```bash
bun run typecheck
bun run test
bun run build
```

### 6. Optional: seed allocations for existing payments

Existing `FeePayment` rows do not have `PaymentAllocation` records. You can back-fill them with a one-off script:

```ts
// scripts/backfill-allocations.ts
import { db } from '@/lib/db'

async function main() {
  const payments = await db.feePayment.findMany({
    where: { invoiceId: { not: null }, isReversed: false, allocations: { none: {} } },
    include: { invoice: true },
  })

  for (const p of payments) {
    if (!p.invoiceId) continue
    const baseAmount = Number(p.amount) / (p.exchangeRate || 1)
    await db.paymentAllocation.create({
      data: {
        paymentId: p.id,
        invoiceId: p.invoiceId,
        schoolId: p.schoolId,
        amount: baseAmount,
      },
    })
  }
  console.log(`Back-filled ${payments.length} allocations`)
}

main().finally(() => process.exit(0))
```

Run with `bun tsx scripts/backfill-allocations.ts`.

## Rollback

Keep the `.env.bak` and a database snapshot before applying. Prisma migrations can be reverted with `npx prisma migrate resolve --rolled-back <name>` and manual column drops only if no writes occurred after the migration.
