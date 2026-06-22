# Row-Level Security (tenant isolation) — RA-B3

Defense-in-depth tenant isolation: even if an API handler forgets to scope a query
by `schoolId`, Postgres itself refuses to return/modify another school's rows.

## How it works

1. **Request context** — `src/server/tenant-context.ts` holds the caller's
   `schoolId` in an `AsyncLocalStorage`. The auth helpers (`validateAuth`, and
   therefore `validateRole` / `validateSchoolAccess` / `getRequestTenant` /
   `requireContext`) call `enterTenant(session.user.schoolId)` on every
   authenticated request.
2. **Per-query GUC** — when `RLS_ENABLED=true`, the Prisma extension in
   `src/lib/db.ts` wraps each query in a transaction that runs
   `SELECT set_config('app.current_school_id', <schoolId>, true)` first, so the
   setting applies on the same connection (required under PgBouncer transaction
   pooling). Interactive `db.$transaction(...)` calls get the GUC injected as
   their first statement.
3. **Policies** — `prisma/rls/enable-rls.sql` puts a `tenant_isolation` policy on
   every table with a `schoolId` column (and `School` on its `id`) comparing the
   row to `current_setting('app.current_school_id', true)`.

When `RLS_ENABLED` is unset/false (the default) the extension is a pass-through —
behavior is identical to a plain `PrismaClient`. Nothing changes until you enable.

## Enable it (safely)

Do this in a **staging** environment first. Run `bun scripts/verify-rls.ts` first —
it reports the role, the GUC round-trip, and current RLS state.

> ⚠️ **CONFIRMED BLOCKER (2026-06):** `scripts/verify-rls.ts` shows this project's
> `DATABASE_URL` connects as **`postgres` (superuser, `rolbypassrls = true`)**.
> A superuser/BYPASSRLS role **ignores RLS entirely**, so applying the policies now
> would be a no-op — false security. **Step 1 below is mandatory before enabling.**
> (The GUC mechanism itself is verified working, so once the role is fixed the rest
> is ready.)

1. **Use a non-superuser, non-BYPASSRLS role for the app connection.** Create a
   least-privilege role and point the runtime `DATABASE_URL` at it; keep `postgres`
   on `DIRECT_URL` for migrations only:
   ```sql
   CREATE ROLE zimschool_app LOGIN PASSWORD '<strong-secret>';
   GRANT CONNECT ON DATABASE postgres TO zimschool_app;
   GRANT USAGE ON SCHEMA public TO zimschool_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zimschool_app;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO zimschool_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zimschool_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
     GRANT USAGE, SELECT ON SEQUENCES TO zimschool_app;
   -- zimschool_app is NOT superuser and NOT BYPASSRLS → subject to policies.
   ```
   Re-run `bun scripts/verify-rls.ts` with that connection and confirm
   `bypasses_rls: false` before continuing.
2. **Apply the policies** (use the direct connection, not the pooler):
   ```bash
   psql "$DIRECT_URL" -f prisma/rls/enable-rls.sql
   ```
3. **Turn on enforcement in the app**: set `RLS_ENABLED=true` and redeploy.
4. **Verify** (see below). If anything is wrong, roll back immediately.

## Verify

With two schools seeded, signed in as a user of school A:
- Normal pages still load (A's data is visible). If pages are suddenly **empty**,
  the GUC isn't being set (role bypass off + extension on but context missing) —
  check `RLS_ENABLED` and that requests go through the auth helpers.
- A direct attempt to read/modify a school B row by id returns **0 rows / not
  found** (previously it leaked). The cross-tenant test net (RA-02) automates this.

Quick DB-level check:
```sql
-- as the app role, with no GUC set → must return 0
SELECT count(*) FROM "Student";
-- with the GUC set → returns only that school's rows
SELECT set_config('app.current_school_id', '<schoolId>', false);
SELECT count(*) FROM "Student";
```

## Roll back

```bash
psql "$DIRECT_URL" -f prisma/rls/disable-rls.sql
```
and set `RLS_ENABLED=false` (or unset) + redeploy.

## Not yet covered (follow-ups)

- **Relation-scoped tables** without a `schoolId` column (e.g. `FeePayment`,
  `AssessmentMark`, `ZimsecCandidate`, `CourseResource`) are **not** covered by the
  dynamic policy — they remain protected by the app-layer scoping/ownership guards
  added across the route handlers. For full DB coverage, add `EXISTS`-based
  policies that join to the parent (e.g. `student.schoolId`).
- **`School` write policy** is read-only (`USING` only) to avoid blocking setup;
  school mutations stay app-layer controlled.
- Pair with **RA-02** (cross-tenant test suite) as the standing regression guard.
