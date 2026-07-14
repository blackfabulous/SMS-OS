# ZimSchool Pro Re-Architecture — 90-Day Implementation Plan

> This plan assumes a small team (2–4 engineers) working incrementally. It can be compressed or expanded based on team size and runway.

---

## Pre-Flight (Week 0 — before day 1)

- [ ] **Day 0.1** — Rotate the committed `.env.example` Supabase password and any other exposed secrets.
- [ ] **Day 0.2** — Run `git-secrets` / `truffleHog` across the repo; add CI check.
- [ ] **Day 0.3** — Create a `migration-status` board (Notion/GitHub Projects) listing all 41 modules and their current state.
- [ ] **Day 0.4** — Confirm Supabase/Postgres connection pooling mode (transaction vs session vs direct).
- [ ] **Day 0.5** — Set up a long-lived staging environment that mirrors production data (anonymized).

---

## Phase 1 — Foundation & Tooling (Weeks 1–3)

### Week 1: Repository, Service Layer, and Response Envelope

- [ ] Create `src/server/db/` with tenant-scoped Prisma helpers.
- [ ] Create `src/server/services/` with a `settings/` context as the reference implementation.
- [ ] Add `ok()` / `fail()` response envelope helpers.
- [ ] Add central `policies.ts` for RBAC with one sample policy (`settings.read`, `settings.update`).
- [ ] Set up Vitest + one sample unit test for the `settings` service.
- [ ] Add `cross-tenant` test harness that asserts `schoolId` isolation.

### Week 2: Schema Hardening (Part 1) — Additive Migrations

- [ ] Add `deletedAt` columns to all tenant-owned tables.
- [ ] Add Prisma extension to auto-filter `deletedAt: null`.
- [ ] Introduce enums for `Role`, `EnrollmentStatus`, `StaffType`, `PaymentMethod`, `Currency`, `InvoiceStatus`, `ReportCardStatus`.
- [ ] Add `schoolId` to `AuditLog`.
- [ ] Backfill `schoolId` for existing audit rows using the actor's school.
- [ ] Add `personId`/`personType` to `User` (additive); keep old columns.
- [ ] Backfill `personId`/`personType` from existing `staffId`/`studentId`/`parentId`.

### Week 3: Schema Hardening (Part 2) — Money, Keys, and RLS

- [ ] Add `Decimal` money columns (additive) alongside `Float` columns.
- [ ] Add per-school composite unique keys for `studentNumber` and `staffNumber`.
- [ ] Write backfill script to populate `Decimal` columns and validate against `Float`.
- [ ] Enable Postgres RLS on tenant-owned tables.
- [ ] Implement `SET LOCAL` RLS pattern inside every transaction.
- [ ] Add `app.current_school_id` helper and integrate with `prisma.$transaction`.

### Week 3 end: Gate

- [ ] All `tsc --noEmit`, lint, unit tests, and cross-tenant tests pass.
- [ ] Staging data migration verified.
- [ ] Rollback tested for all schema migrations.

---

## Phase 2 — Reference Context: Settings & School (Weeks 4–5)

### Week 4: Settings to Standard

- [ ] Refactor `settings` to service layer with Zod schemas.
- [ ] Add full unit test coverage for settings service.
- [ ] Create server-rendered route `src/app/(app)/settings/page.tsx`.
- [ ] Add TanStack Query hooks for settings reads/writes.
- [ ] Use shared design-system components for settings UI.
- [ ] Add role policy for `settings.read` / `settings.update`.
- [ ] Add audit logging via outbox for all settings mutations.

### Week 5: School & Calendar to Standard

- [ ] Migrate `School`, `AcademicYear`, `Term`, `Holiday` to service layer.
- [ ] Add server-rendered routes for school and calendar management.
- [ ] Add tests and cross-tenant tests.
- [ ] Document the "standard slice" pattern using Settings and School as examples.

### Week 5 end: Gate

- [ ] Two full contexts migrated to standard.
- [ ] New pattern documented and reviewed by the team.
- [ ] Remaining modules scored by risk and effort.

---

## Phase 3 — Tenancy Hardening & Tooling (Weeks 6–7)

### Week 6: Cross-Tenant Test Suite

- [ ] Write automated tests that attempt cross-tenant reads/writes for every resource.
- [ ] Run suite against the old route handlers; document all failures.
- [ ] Fix the highest-risk failures (attendance, bulk-attendance, report-card GET).
- [ ] Run suite against new service layer; verify zero failures.
- [ ] Add cross-tenant test suite to CI as a hard gate.

### Week 7: Observability & Queue

- [ ] Replace `console.*` with Pino structured logging.
- [ ] Add Sentry for errors and traces.
- [ ] Add `/api/health/deep` endpoint.
- [ ] Set up Upstash QStash for notifications and outbox-style jobs.
- [ ] Replace in-memory rate-limit with Upstash Redis rate-limit.
- [ ] Add Docker + `docker-compose` for local development.
- [ ] Add GitHub Actions CI for typecheck/lint/test/build.

### Week 7 end: Gate

- [ ] Cross-tenant test suite passes.
- [ ] CI green on every PR.
- [ ] Staging logs are structured and queryable.

---

## Phase 4 — High-Value Migration (Weeks 8–12)

### Week 8: People (Students, Guardians, Staff, Enrollment)

- [ ] Migrate `Student`, `Guardian`, `StudentGuardian`, `Staff`, `Enrollment` to service layer.
- [ ] Add per-school unique `studentNumber`/`staffNumber` enforcement.
- [ ] Add soft-delete support across People entities.
- [ ] Migrate read routes to server-rendered pages.
- [ ] Add forms with React Hook Form + Zod.
- [ ] Cross-tenant tests for all People entities.

### Week 9: Academics (Grades, Classes, Subjects, Timetable)

- [ ] Migrate `Grade`, `Class`, `Subject`, `GradeSubject`, `TimetableEntry` to service layer.
- [ ] Add server-rendered routes and shared components.
- [ ] Ensure no cascade deletes from `Grade` to `Subject`.
- [ ] Add tests for timetable conflicts.

### Week 10: Finance (Part 1) — Invoices, Payments, Allocations

- [ ] Migrate `FeeStructure`, `Invoice`, `InvoiceItem`, `Payment`, `PaymentAllocation` to service layer.
- [ ] Remove `Invoice.balance` writes; derive balance from `Invoice` and `PaymentAllocation`.
- [ ] Add `Decimal` money usage throughout finance.
- [ ] Add `Currency` enum and exchange-rate handling.
- [ ] Property-based tests comparing old vs new balance calculations.
- [ ] Cross-tenant tests for invoices and payments.

### Week 11: Finance (Part 2) — Statements, BEAM, Bank Accounts

- [ ] Build statement/ledger service from immutable rows.
- [ ] Migrate `BankAccount`, `Scholarship`, `BeamApplication`.
- [ ] Add idempotency keys for payment operations.
- [ ] Add server-rendered finance routes and statements UI.

### Week 12: Assessment (Grading, Marks, Report Cards)

- [ ] Consolidate duplicated grading ladders into `GradingScale` service.
- [ ] Migrate `Assessment`, `AssessmentMark`, `ReportCard` to service layer.
- [ ] Add report-card workflow (draft → review → publish).
- [ ] Add ZIMSEC grading support as data-driven rules.
- [ ] Add parent/teacher report-card views.

### Week 12 end: Gate

- [ ] `tsc`, lint, unit tests, cross-tenant tests, and build all pass.
- [ ] Critical user journeys (enroll → attendance → fee → payment → statement, marks → report card → publish) pass in Playwright E2E.

---

## Phase 5 — Stabilization & Handoff (Week 13 and beyond)

- [ ] Migrate remaining contexts (Operations, Welfare, Communications, CMS, Portals, Reports/EMIS/Analytics) using the standard slice.
- [ ] Run a full adversarial security review.
- [ ] Add Playwright E2E for parent and student portals.
- [ ] Add PWA/offline strategy for attendance entry.
- [ ] Add Shona/Ndebele i18n structure (strings only, if requested).
- [ ] Remove old `Float` money columns and `isActive` columns after one release of no reads.
- [ ] Document the new architecture and onboarding guide.

---

## Success Metrics

| Metric | Target by Week 12 |
|--------|-------------------|
| Cross-tenant tests | 100% pass, cover all tenant-owned resources |
| Service-layer coverage | 100% of finance, assessment, people, settings logic |
| Unit test coverage | ≥70% of service layer |
| E2E critical journeys | 5 critical journeys passing in CI |
| CI build time | <10 minutes |
| `console.*` in production | 0 |
| Secrets in repo | 0 |
| Modules migrated to standard | 10+ of the 41 modules (core contexts done) |
| Average route handler size | <50 lines |
| New route pages | Server-rendered by default |

---

## Risk Triggers (pause and reassess if any occur)

1. Cross-tenant test suite finds more than 5 new leaks in a single phase.
2. Any data migration cannot be rolled back in <30 minutes.
3. Finance balance discrepancy > 0.01 between old and new calculations.
4. CI build time exceeds 15 minutes.
5. More than 2 weeks of scope creep added to the current phase.
