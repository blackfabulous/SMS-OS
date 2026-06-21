-- ============================================================================
-- Row-Level Security: tenant isolation backstop (RA-B3)
-- ============================================================================
-- Enables RLS + a `tenant_isolation` policy on every public BASE TABLE that has
-- a "schoolId" column, plus the School table itself (keyed on its id). The policy
-- compares each row's school to the per-request GUC `app.current_school_id`, which
-- the Prisma client (src/lib/db.ts) sets from the authenticated session when
-- RLS_ENABLED=true.
--
-- READ docs/RLS.md BEFORE RUNNING. Key caveats:
--   1. The role Prisma connects as must NOT have BYPASSRLS (Supabase's `postgres`
--      role may bypass — verify). FORCE RLS makes the table OWNER subject to
--      policies, but a BYPASSRLS/superuser role still bypasses entirely.
--        SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;
--   2. Once enabled, ANY query without app.current_school_id set returns ZERO
--      rows (fail-closed). The app must set RLS_ENABLED=true so the db extension +
--      auth helpers establish the GUC on every authenticated request.
--   3. Relation-scoped tables WITHOUT a schoolId column (FeePayment, AssessmentMark,
--      ZimsecCandidate, etc.) are NOT covered here — they remain app-layer scoped.
--      Add per-relation EXISTS policies in a follow-up for full DB coverage.

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'schoolId'
      AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I '
      'USING ("schoolId" = current_setting(''app.current_school_id'', true)) '
      'WITH CHECK ("schoolId" = current_setting(''app.current_school_id'', true));',
      t
    );
  END LOOP;
END $$;

-- The School row itself IS the tenant; scope reads on its id. USING only (no
-- WITH CHECK) so school creation during setup/seeding is not blocked by RLS.
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "School" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "School";
CREATE POLICY tenant_isolation ON "School"
  USING ("id" = current_setting('app.current_school_id', true));
