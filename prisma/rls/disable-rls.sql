-- ============================================================================
-- Roll back Row-Level Security (RA-B3) — drop tenant_isolation policies and
-- disable RLS on every table touched by enable-rls.sql. Run this if RLS causes
-- problems after enabling (and set RLS_ENABLED=false / unset in the app env).
-- ============================================================================

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
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS tenant_isolation ON "School";
ALTER TABLE "School" DISABLE ROW LEVEL SECURITY;

-- Relation-scoped children covered by enable-rls.sql's EXISTS policies.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Term','GradeSubject','StudentParent','StudentEnrollment','Attendance','AssessmentMark',
    'ReportCard','FeeInvoice','FeePayment','Scholarship','ZimsecCandidate','BeamApplication',
    'WelfareRecord','DisciplineRecord','HealthRecord','Dormitory','BoardingAssignment',
    'TransportAssignment','LibraryTransaction','Payslip','LeaveRecord','AppraisalRecord',
    'StaffDiscipline','CanteenTransactionItem','PurchaseOrderItem','AlumniContribution',
    'CourseResource','CourseAssignment','InvoiceItem'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;
