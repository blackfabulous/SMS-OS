-- RLS migration: enable tenant isolation on every table that has a schoolId column.
-- Run this as part of a Prisma migration (psql, prisma/migrations/.../migration.sql, or Supabase SQL Editor).
-- Application code must call `SET LOCAL app.current_school_id = '<school-id>';` inside every transaction.

-- 1. Helper function to set the tenant id for the current transaction.
--    This is used by application code when running raw SQL, or by the `withTenantTransaction` helper.
CREATE OR REPLACE FUNCTION set_tenant_id(school_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_school_id', school_id, true);
END;
$$ LANGUAGE plpgsql;

-- 2. Apply RLS to all tenant-owned tables.
--    This creates (or recreates) a policy `tenant_isolation_<table>` on every table that has a schoolId column.
CREATE OR REPLACE FUNCTION apply_tenant_rls()
RETURNS void AS $$
DECLARE
  t record;
  policy_name text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'schoolId'
      AND t.table_type = 'BASE TABLE'
    GROUP BY c.table_name
  LOOP
    policy_name := 'tenant_isolation_' || t.table_name;

    -- Enable RLS on the table.
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t.table_name);

    -- Drop existing policy if present.
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', policy_name, t.table_name);

    -- Create policy: tenant matches AND row is not soft-deleted.
    -- current_setting(..., true) returns NULL when not set, so a missing tenant id returns no rows.
    EXECUTE format(
      'CREATE POLICY %I ON %I
        USING (schoolId = current_setting(''app.current_school_id'', true) AND deletedAt IS NULL);',
      policy_name, t.table_name
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT apply_tenant_rls();

-- 3. Restrict access to the helper functions to the application role.
--    Replace `app_user` with the role your Next.js app uses (e.g. `supabase_admin` / `postgres` should bypass).
-- REVOKE ALL ON FUNCTION set_tenant_id(text) FROM PUBLIC;
-- GRANT EXECUTE ON FUNCTION set_tenant_id(text) TO app_user;
