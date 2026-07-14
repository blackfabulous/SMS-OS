# Prisma Migration Guide: ZimSchool Pro Rebuild

This guide describes how to move the live ZimSchool Pro database from the current schema to the new schema **without data loss** and without a big-bang rewrite.

## Core principle

Only additive migrations in production. Never `DROP` or `ALTER` existing columns in a way that breaks the running app. The old app keeps working while the new context is tested, and fields are removed only after the old code is dead.

## Before you start

1. Run `npx prisma validate --schema=schema.prisma`.
2. Have a recent backup of the production database.
3. Create a `migration` branch and a `staging` environment that mirrors production.
4. Run the cross-tenant test suite against staging after every migration.

## Step 0 — Add `deletedAt` and `schoolId` to existing tables

For each table that the old app already uses, run one migration that adds the new columns only.

```sql
ALTER TABLE "SchoolSetting" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "SchoolSetting" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;
UPDATE "SchoolSetting" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
ALTER TABLE "SchoolSetting" ALTER COLUMN "schoolId" SET NOT NULL;
```

Backfill `schoolId` from the existing tenant column or from a single-school default. Do not remove the old column yet.

## Step 1 — Backfill `schoolId` for all historical rows

Run a single migration script that derives `schoolId` for every historical row.

```sql
-- Example: derive from School table
UPDATE "Invoice" i
SET "schoolId" = s."schoolId"
FROM "School" s
WHERE i."schoolId" IS NULL;
```

Always make `schoolId` `NOT NULL` only after the backfill is complete and verified.

## Step 2 — Migrate `Float` money to `Decimal(15,2)`

Money columns must be `Decimal`.

```sql
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "amountDecimal" DECIMAL(15,2);
UPDATE "Invoice" SET "amountDecimal" = "amount"::DECIMAL(15,2);
ALTER TABLE "Invoice" RENAME COLUMN "amount" TO "amountDeprecated";
ALTER TABLE "Invoice" RENAME COLUMN "amountDecimal" TO "amount";
```

The old app reads `amount` (now `Decimal` at the DB level), but numeric values are identical. The new app writes `amount` as `Decimal`.

## Step 3 — Add the `User.personId` / `User.personType` polymorphism

1. Add the new columns.

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personId" TEXT;
```

2. Backfill from existing `staffId`, `studentId`, `guardianId` columns.

```sql
UPDATE "User" SET "personType" = 'STAFF', "personId" = "staffId" WHERE "staffId" IS NOT NULL;
UPDATE "User" SET "personType" = 'STUDENT', "personId" = "studentId" WHERE "studentId" IS NOT NULL;
UPDATE "User" SET "personType" = 'GUARDIAN', "personId" = "guardianId" WHERE "guardianId" IS NOT NULL;
```

3. Keep the old columns until all old code is retired.

## Step 4 — Remove the `Invoice.balance` column

The balance is derived from `Invoice` and `PaymentAllocation`.

1. Add a computed view for the old app if needed.

```sql
CREATE OR REPLACE VIEW invoice_balance AS
SELECT
  i.id,
  i."schoolId",
  i.amount - COALESCE(SUM(pa.amount), 0) AS balance
FROM "Invoice" i
LEFT JOIN "PaymentAllocation" pa ON pa."invoiceId" = i.id AND pa."deletedAt" IS NULL
WHERE i."deletedAt" IS NULL
GROUP BY i.id, i."schoolId", i.amount;
```

2. Only after the old app no longer reads `Invoice.balance` directly, drop the column.

```sql
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "balance";
```

## Step 5 — Apply Postgres RLS

Run `prisma/rls.sql` in the target database.

```bash
psql $DATABASE_URL -f prisma/rls.sql
```

For Supabase, open the SQL Editor and run `prisma/rls.sql`.

## Step 6 — Migrate per bounded context

Use the strangler approach. For each context (Settings → Identity → Academics → Finance → ...):

1. Create the new tables if they do not exist.
2. Backfill existing tables with `schoolId`/`deletedAt`.
3. Write the service layer, repository, and tests.
4. Run the cross-tenant test suite against the context.
5. Switch the UI route or Server Action to the new service.
6. Mark the old code `// DEPRECATED: remove after <date>`.

## Step 7 — Clean up deprecated fields

After at least one full production cycle and a successful audit:

1. Remove `staffId`/`studentId`/`guardianId` from `User`.
2. Drop `amountDeprecated` columns.
3. Drop old views and tables that no code uses.

## Rollback rules

- Every migration is a single transaction where possible.
- If a migration fails, restore from backup rather than writing ad-hoc fix scripts.
- Never run migrations outside business hours without an on-call person.

## Verification checklist

- [ ] `npx prisma migrate deploy` runs cleanly on staging.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx vitest run src/server/test` passes.
- [ ] `npx prisma db seed` runs against a fresh DB.
- [ ] Manual spot check: log in as a school admin and confirm only that school's data is visible.
