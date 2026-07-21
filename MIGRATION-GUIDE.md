# Migration Guide — Re-Architecture Fixes

> This guide covers applying the schema changes introduced in this branch to an existing ZimSchool Pro database.
> A baseline migration now lives in `prisma/migrations/`. For fresh databases run `bun run db:deploy`. For existing databases, first mark the baseline as applied, then use `bun run db:deploy` for all future changes.

## What changed

1. **Soft-delete (`deletedAt`)** added to every tenant-owned Prisma model.
2. **`schoolId` added** to every tenant-owned business table (including all child/join/line-item tables previously isolated through `EXISTS` RLS policies such as `Term`, `GradeSubject`, `StudentEnrollment`, `AssessmentMark`, `ReportCard`, `BoardingAssignment`, `TransportAssignment`, `Payslip`, `CanteenTransactionItem`, `PurchaseOrderItem`, etc.).
3. **Per-school unique numbers** for `FeeInvoice.invoiceNumber` and `FeePayment.receiptNumber`.
4. **New `PaymentAllocation` ledger** between payments and invoices.
5. **New `Outbox` durable-jobs table**.
6. **`AuditLog` now tenant-scoped** with `schoolId`, `actorId`, and `beforeValue`/`afterValue` as JSON.
7. **Prisma extension in `src/lib/db.ts`** auto-filters soft-deleted rows and converts `delete` → soft-delete.
8. **Prisma enums** replace `String` status/type columns for high-risk domains (finance, HR, operations, academics, welfare).
9. **All money/rate fields** are now `Decimal @db.Decimal(15,2)` (`FeePayment.exchangeRate` uses `(15,6)`).
10. **All timestamps** use `@db.Timestamptz(3)`.
11. **RLS policies** in `prisma/rls/enable-rls.sql` now use direct `schoolId` comparisons, removing the `EXISTS` join block.

## Recommended migration path

### 1. Baseline an existing database

If your database already has the current tables, mark the baseline migration as already applied so Prisma does not try to re-create them.

```bash
npx prisma migrate resolve --applied 20250714120000_baseline
```

For existing databases, generate a diff between your current schema and the target datamodel to produce a focused migration:

```bash
bunx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20250714120001_db_domain/migration.sql
```

Review the generated SQL, add any required back-fill `UPDATE` statements (see below), then mark it applied and run `bun run db:deploy`.

Then deploy any subsequent migrations:

```bash
bun run db:deploy
```

For a fresh/empty database, simply run `bun run db:deploy` and Prisma will create everything from the baseline SQL.

### 2. Create future migrations

After schema changes, generate a new migration with:

```bash
bunx prisma migrate dev --name <descriptive_name>
```

Review the generated SQL before running `bun run db:deploy` in CI/prod.

### 2. Back-fill required `schoolId` values

If you have existing data, run back-fill `UPDATE` statements **inside the same transaction as the migration** (or immediately after) so required `schoolId` columns are not null. Derive from the most direct parent relationship:

```sql
-- Finance
UPDATE "FeeInvoice"   SET "schoolId" = s."schoolId" FROM "Student" s WHERE "FeeInvoice"."studentId" = s.id AND "FeeInvoice"."schoolId" IS NULL;
UPDATE "FeePayment"   SET "schoolId" = s."schoolId" FROM "Student" s WHERE "FeePayment"."studentId" = s.id AND "FeePayment"."schoolId" IS NULL;
UPDATE "InvoiceItem"  SET "schoolId" = i."schoolId" FROM "FeeInvoice" i WHERE "InvoiceItem"."invoiceId" = i.id AND "InvoiceItem"."schoolId" IS NULL;

-- Academics / assessments / records
UPDATE "Term" SET "schoolId" = y."schoolId" FROM "AcademicYear" y WHERE "Term"."academicYearId" = y.id AND "Term"."schoolId" IS NULL;
UPDATE "GradeSubject" SET "schoolId" = g."schoolId" FROM "Grade" g WHERE "GradeSubject"."gradeId" = g.id AND "GradeSubject"."schoolId" IS NULL;
UPDATE "StudentParent" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "StudentParent"."studentId" = s.id AND "StudentParent"."schoolId" IS NULL;
UPDATE "StudentEnrollment" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "StudentEnrollment"."studentId" = s.id AND "StudentEnrollment"."schoolId" IS NULL;
UPDATE "Attendance" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "Attendance"."studentId" = s.id AND "Attendance"."schoolId" IS NULL;
UPDATE "AssessmentMark" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "AssessmentMark"."studentId" = s.id AND "AssessmentMark"."schoolId" IS NULL;
UPDATE "ReportCard" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "ReportCard"."studentId" = s.id AND "ReportCard"."schoolId" IS NULL;
UPDATE "ZimsecCandidate" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "ZimsecCandidate"."studentId" = s.id AND "ZimsecCandidate"."schoolId" IS NULL;
UPDATE "Scholarship" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "Scholarship"."studentId" = s.id AND "Scholarship"."schoolId" IS NULL;

-- Operations / HR / welfare
UPDATE "DisciplineRecord" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "DisciplineRecord"."studentId" = s.id AND "DisciplineRecord"."schoolId" IS NULL;
UPDATE "HealthRecord" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "HealthRecord"."studentId" = s.id AND "HealthRecord"."schoolId" IS NULL;
UPDATE "Dormitory" SET "schoolId" = h."schoolId" FROM "Hostel" h WHERE "Dormitory"."hostelId" = h.id AND "Dormitory"."schoolId" IS NULL;
UPDATE "BoardingAssignment" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "BoardingAssignment"."studentId" = s.id AND "BoardingAssignment"."schoolId" IS NULL;
UPDATE "TransportAssignment" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "TransportAssignment"."studentId" = s.id AND "TransportAssignment"."schoolId" IS NULL;
UPDATE "LibraryTransaction" SET "schoolId" = b."schoolId" FROM "LibraryBook" b WHERE "LibraryTransaction"."bookId" = b.id AND "LibraryTransaction"."schoolId" IS NULL;
UPDATE "Payslip" SET "schoolId" = st."schoolId" FROM "Staff" st WHERE "Payslip"."staffId" = st.id AND "Payslip"."schoolId" IS NULL;
UPDATE "LeaveRecord" SET "schoolId" = st."schoolId" FROM "Staff" st WHERE "LeaveRecord"."staffId" = st.id AND "LeaveRecord"."schoolId" IS NULL;
UPDATE "AppraisalRecord" SET "schoolId" = st."schoolId" FROM "Staff" st WHERE "AppraisalRecord"."staffId" = st.id AND "AppraisalRecord"."schoolId" IS NULL;
UPDATE "StaffDiscipline" SET "schoolId" = st."schoolId" FROM "Staff" st WHERE "StaffDiscipline"."staffId" = st.id AND "StaffDiscipline"."schoolId" IS NULL;
UPDATE "BeamApplication" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "BeamApplication"."studentId" = s.id AND "BeamApplication"."schoolId" IS NULL;
UPDATE "WelfareRecord" SET "schoolId" = s."schoolId" FROM "Student" s WHERE "WelfareRecord"."studentId" = s.id AND "WelfareRecord"."schoolId" IS NULL;

-- e-Learning
UPDATE "CourseResource" SET "schoolId" = c."schoolId" FROM "Course" c WHERE "CourseResource"."courseId" = c.id AND "CourseResource"."schoolId" IS NULL;
UPDATE "CourseAssignment" SET "schoolId" = c."schoolId" FROM "Course" c WHERE "CourseAssignment"."courseId" = c.id AND "CourseAssignment"."schoolId" IS NULL;

-- Canteen / procurement line items
UPDATE "CanteenTransactionItem" SET "schoolId" = t."schoolId" FROM "CanteenTransaction" t WHERE "CanteenTransactionItem"."transactionId" = t.id AND "CanteenTransactionItem"."schoolId" IS NULL;
UPDATE "PurchaseOrderItem" SET "schoolId" = p."schoolId" FROM "PurchaseOrder" p WHERE "PurchaseOrderItem"."purchaseOrderId" = p.id AND "PurchaseOrderItem"."schoolId" IS NULL;

-- Alumni / audit / outbox
UPDATE "AlumniContribution" SET "schoolId" = a."schoolId" FROM "Alumni" a WHERE "AlumniContribution"."alumniId" = a.id AND "AlumniContribution"."schoolId" IS NULL;
UPDATE "AuditLog" al SET "schoolId" = u."schoolId" FROM "User" u WHERE al."performedBy" = u.id AND al."schoolId" IS NULL;
UPDATE "Outbox" SET "schoolId" = s."schoolId" FROM "School" s WHERE "Outbox"."schoolId" IS NULL; -- or link to the actor/user
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
