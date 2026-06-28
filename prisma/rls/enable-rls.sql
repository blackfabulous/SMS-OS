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
--      ZimsecCandidate, etc.) are covered by the EXISTS-based policies in the second
--      block below — each row's tenant is resolved through its parent (student/staff/
--      alumni/course/etc.). Rows whose anchor FK is NULL fail closed (hidden when a
--      GUC is set); app-layer scoping remains the primary guard either way.

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

-- ============================================================================
-- Relation-scoped children (no schoolId column): resolve tenant via parent.
-- Each (child, fkColumn, parent) below gets an EXISTS policy joining the child's
-- FK to a parent that carries schoolId. Skipped gracefully if the table is absent.
-- ============================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Term','academicYearId','AcademicYear'),
      ('GradeSubject','gradeId','Grade'),
      ('StudentParent','studentId','Student'),
      ('StudentEnrollment','studentId','Student'),
      ('Attendance','studentId','Student'),
      ('AssessmentMark','studentId','Student'),
      ('ReportCard','studentId','Student'),
      ('FeeInvoice','studentId','Student'),
      ('FeePayment','studentId','Student'),
      ('Scholarship','studentId','Student'),
      ('ZimsecCandidate','studentId','Student'),
      ('BeamApplication','studentId','Student'),
      ('WelfareRecord','studentId','Student'),
      ('DisciplineRecord','studentId','Student'),
      ('HealthRecord','studentId','Student'),
      ('Dormitory','hostelId','Hostel'),
      ('BoardingAssignment','studentId','Student'),
      ('TransportAssignment','studentId','Student'),
      ('LibraryTransaction','bookId','LibraryBook'),
      ('Payslip','staffId','Staff'),
      ('LeaveRecord','staffId','Staff'),
      ('AppraisalRecord','staffId','Staff'),
      ('StaffDiscipline','staffId','Staff'),
      ('CanteenTransactionItem','transactionId','CanteenTransaction'),
      ('PurchaseOrderItem','purchaseOrderId','PurchaseOrder'),
      ('AlumniContribution','alumniId','Alumni'),
      ('CourseResource','courseId','Course'),
      ('CourseAssignment','courseId','Course')
    ) AS v(child, fkcol, parent)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=r.child) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', r.child);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', r.child);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', r.child);
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %I '
        'USING (EXISTS (SELECT 1 FROM %I p WHERE p."id" = %I.%I AND p."schoolId" = current_setting(''app.current_school_id'', true))) '
        'WITH CHECK (EXISTS (SELECT 1 FROM %I p WHERE p."id" = %I.%I AND p."schoolId" = current_setting(''app.current_school_id'', true)));',
        r.child, r.parent, r.child, r.fkcol, r.parent, r.child, r.fkcol
      );
    END IF;
  END LOOP;
END $$;

-- InvoiceItem is two hops from a schoolId (InvoiceItem -> FeeInvoice -> Student).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='InvoiceItem') THEN
    ALTER TABLE "InvoiceItem" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "InvoiceItem" FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON "InvoiceItem";
    CREATE POLICY tenant_isolation ON "InvoiceItem"
      USING (EXISTS (SELECT 1 FROM "FeeInvoice" fi JOIN "Student" s ON s."id" = fi."studentId" WHERE fi."id" = "InvoiceItem"."invoiceId" AND s."schoolId" = current_setting('app.current_school_id', true)))
      WITH CHECK (EXISTS (SELECT 1 FROM "FeeInvoice" fi JOIN "Student" s ON s."id" = fi."studentId" WHERE fi."id" = "InvoiceItem"."invoiceId" AND s."schoolId" = current_setting('app.current_school_id', true)));
  END IF;
END $$;
