# ZimSchool Pro Re-Architecture — 90-Day Implementation Plan

> This plan assumes a small team (2–4 engineers) working incrementally. It can be compressed or expanded based on team size and runway.
>
> **Legend:** `[x]` = completed, `[~]` = partially done / needs finishing, `[ ]` = not started.

---

## Pre-Flight (Week 0 — before day 1)

- [x] **Day 0.1** — `.env.example` contains only placeholder/commented credentials; no live secrets detected. Rotating any real project secrets should still be verified before production.
- [ ] **Day 0.2** — Run `git-secrets` / `truffleHog` across the repo; add CI check.
- [ ] **Day 0.3** — Create a `migration-status` board (Notion/GitHub Projects) listing all 41 modules and their current state.
- [ ] **Day 0.4** — Confirm Supabase/Postgres connection pooling mode (transaction vs session vs direct).
- [ ] **Day 0.5** — Set up a long-lived staging environment that mirrors production data (anonymized).

---

## Phase 1 — Foundation & Tooling (Weeks 1–3)

### Week 1: Repository, Service Layer, and Response Envelope

- [x] Create `src/server/db/` with tenant-scoped Prisma helpers (`tenant.ts`, plus `src/lib/db.ts` RLS-aware extension).
- [x] Create `src/server/services/` with a `settings/` context as the reference implementation.
- [x] Add `ok()` / `fail()` response envelope helpers.
- [x] Convert all API routes to `ok()` / `fail()`; eliminate `NextResponse.json` and `console.*` in `src/app/api`.
- [~] Add central `policies.ts` for RBAC with one sample policy (`settings.read`, `settings.update`) — RBAC matrix lives in `src/lib/rbac.ts`; central `policies.ts` wrapper not yet created.
- [x] Set up Vitest + one sample unit test for the `settings` service (`tests/settings-schema.test.ts`, plus tenant-safety and server-foundation tests).
- [x] Add `cross-tenant` test harness that asserts `schoolId` isolation.

### Week 2: Schema Hardening (Part 1) — Additive Migrations

- [x] Add `deletedAt` columns to all tenant-owned tables.
- [x] Add Prisma extension to auto-filter `deletedAt: null`.
- [x] Introduce enums for `Role`, `EnrollmentStatus`, `StaffType`, `PaymentMethod`, `Currency`, `InvoiceStatus`, `ReportCardStatus`.
- [x] Add `schoolId` to `AuditLog`.
- [ ] Backfill `schoolId` for existing audit rows using the actor's school (column added; backfill SQL not yet included in migration).
- [ ] Add `personId`/`personType` to `User` (additive); keep old columns.
- [ ] Backfill `personId`/`personType` from existing `staffId`/`studentId`/`parentId`.

### Week 3: Schema Hardening (Part 2) — Money, Keys, and RLS

- [x] Add `Decimal` money columns (migrated directly to `Decimal`; no `Float` money remains in the baseline schema).
- [x] Add per-school composite unique keys for `studentNumber` and `staffNumber`.
- [~] Write backfill script to populate `Decimal` columns and validate against `Float` (not needed for fresh baseline; required if migrating existing production data).
- [x] Enable Postgres RLS on tenant-owned tables (`prisma/rls/enable-rls.sql`).
- [x] Implement `SET LOCAL` RLS pattern inside every transaction (GUC set per query/transaction via `set_config(..., true)` in `src/lib/db.ts`).
- [x] Add `app.current_school_id` helper and integrate with `prisma.$transaction`.

### Week 3 end: Gate

- [x] All `tsc --noEmit`, lint, unit tests, and cross-tenant tests pass.
- [ ] Staging data migration verified.
- [ ] Rollback tested for all schema migrations.

---

## Phase 2 — Reference Context: Settings & School (Weeks 4–5)

### Week 4: Settings to Standard

- [x] Refactor `settings` to service layer with Zod schemas (`src/server/services/settings.ts` + `src/lib/settings-schema.ts`).
- [~] Add full unit test coverage for settings service (schema tests exist; DB-backed service unit tests not yet added).
- [ ] Create server-rendered route `src/app/(app)/settings/page.tsx`.
- [~] Add TanStack Query hooks for settings reads/writes (`settings-module.tsx` already uses `useApiQuery` for school/audit; settings mutations still inline).
- [ ] Use shared design-system components for settings UI.
- [x] Add role policy for `settings.read` / `settings.update` (`src/lib/rbac.ts` covers settings actions).
- [x] Add audit logging via outbox for all settings mutations (`/api/settings` calls `logAudit`).

### Week 5: School & Calendar to Standard

- [~] Migrate `School`, `AcademicYear`, `Term`, `Holiday` to service layer (`/api/school` converted; dedicated service file pending).
- [ ] Add server-rendered routes for school and calendar management.
- [~] Add tests and cross-tenant tests (static guard covers all routes; per-context service tests pending).
- [~] Document the "standard slice" pattern using Settings and School as examples (`MIGRATION-GUIDE.md` and `REARCHITECTURE-BLUEPRINT.md` cover the pattern; a concise per-context recipe still pending).

### Week 5 end: Gate

- [ ] Two full contexts migrated to standard.
- [ ] New pattern documented and reviewed by the team.
- [ ] Remaining modules scored by risk and effort.

---

## Phase 3 — Tenancy Hardening & Tooling (Weeks 6–7)

### Week 6: Cross-Tenant Test Suite

- [~] Write automated tests that attempt cross-tenant reads/writes for every resource (static guard over all routes + dynamic finance-scope/tenant-context tests; per-resource dynamic coverage still pending).
- [ ] Run suite against the old route handlers; document all failures.
- [~] Fix the highest-risk failures (attendance, bulk-attendance, report-card GET) — many by-id mutations now ownership-guarded; remaining high-risk routes queued in `REARCH-TASKS.md`.
- [ ] Run suite against new service layer; verify zero failures.
- [ ] Add cross-tenant test suite to CI as a hard gate (CI file still in `scripts/github-ci.yml` awaiting GitHub `workflow` scope).

### Week 7: Observability & Queue

- [x] Replace `console.*` with Pino structured logging (`src/lib/logger.ts` + `instrumentation.ts` patches console on server).
- [x] Add Sentry for errors and traces (`sentry.*.config.ts` wired into `next.config.ts`).
- [x] Add `/api/health/deep` endpoint (`src/app/api/health/deep/route.ts` pings the DB and returns ok()/fail() envelope).
- [ ] Set up Upstash QStash for notifications and outbox-style jobs (outbox worker runs in-process; managed QStash integration pending).
- [~] Replace in-memory rate-limit with Upstash Redis rate-limit (Postgres-backed distributed rate-limit exists in `src/lib/rate-limit.ts`; Upstash/Redis swap is interface-compatible but not configured).
- [x] Add Docker + `docker-compose` for local development.
- [~] Add GitHub Actions CI for typecheck/lint/test/build (workflow lives at `scripts/github-ci.yml`; cannot push to `.github/workflows/ci.yml` until GitHub OAuth token has `workflow` scope).

### Week 7 end: Gate

- [~] Cross-tenant test suite passes.
- [ ] CI green on every PR.
- [ ] Staging logs are structured and queryable.

---

## Phase 4 — High-Value Migration (Weeks 8–12)

### Week 8: People (Students, Guardians, Staff, Enrollment)

- [ ] Migrate `Student`, `Guardian`, `StudentGuardian`, `Staff`, `Enrollment` to service layer.
- [x] Add per-school unique `studentNumber`/`staffNumber` enforcement (schema-level `@@unique` added).
- [x] Add soft-delete support across People entities (`deletedAt` added to all tenant-owned models).
- [ ] Migrate read routes to server-rendered pages.
- [ ] Add forms with React Hook Form + Zod.
- [ ] Cross-tenant tests for all People entities.

### Week 9: Academics (Grades, Classes, Subjects, Timetable)

- [ ] Migrate `Grade`, `Class`, `Subject`, `GradeSubject`, `TimetableEntry` to service layer.
- [ ] Add server-rendered routes and shared components.
- [x] Ensure no cascade deletes from `Grade` to `Subject` (`onDelete` reviewed in baseline migration).
- [~] Add tests for timetable conflicts (`src/server/algorithms/timetable.ts` + `timetable.test.ts` exist; not wired to a route service).

### Week 10: Finance (Part 1) — Invoices, Payments, Allocations

- [~] Migrate `FeeStructure`, `Invoice`, `InvoiceItem`, `Payment`, `PaymentAllocation` to service layer (`src/server/services/payment-service.ts` + `PaymentAllocation` ledger; remaining finance contexts pending).
- [~] Remove `Invoice.balance` writes; derive balance from `Invoice` and `PaymentAllocation` (`balance` still exists as a transition cache; new allocations update it).
- [x] Add `Decimal` money usage throughout finance.
- [x] Add `Currency` enum and exchange-rate handling.
- [~] Property-based tests comparing old vs new balance calculations (`tests/finance-calc.test.ts`, `tests/statement.test.ts` cover core calculations; not property-based).
- [x] Cross-tenant tests for invoices and payments (`tests/finance-scope.test.ts`).

### Week 11: Finance (Part 2) — Statements, BEAM, Bank Accounts

- [~] Build statement/ledger service from immutable rows (`payment-service.ts` uses `PaymentAllocation`; statement rendering/tests exist).
- [ ] Migrate `BankAccount`, `Scholarship`, `BeamApplication`.
- [x] Add idempotency keys for payment operations (`src/lib/idempotency.ts` + `IdempotencyKey` model; applied to `/api/finance/payments`).
- [ ] Add server-rendered finance routes and statements UI.

### Week 12: Assessment (Grading, Marks, Report Cards)

- [x] Consolidate duplicated grading ladders into `GradingScale` service (ZIMSEC scale in settings registry; grading helpers in `src/server/algorithms/`).
- [x] Migrate `Assessment`, `AssessmentMark`, `ReportCard` to service layer (`src/server/services/reports.ts` handles EMIS, report-card data, and workflow transitions).
- [x] Add report-card workflow (draft → review → publish) (`tests/report-card-workflow.test.ts` validates workflow; routes use `transitionReportCard`).
- [x] Add ZIMSEC grading support as data-driven rules (default scale in settings registry).
- [ ] Add parent/teacher report-card views.

### Week 12 end: Gate

- [~] `tsc`, lint, unit tests, cross-tenant tests, and build all pass.
- [~] Critical user journeys (enroll → attendance → fee → payment → statement, marks → report card → publish) pass in Playwright E2E. Smoke tests cover public pages, contact, admissions apply, all 39 dashboard modules (chromium + mobile), student search, student record detail, finance dashboard, and `/api/health/deep`; remaining end-to-end payment/report-card/parent-portal workflows pending.

---

## Phase 5 — Stabilization & Handoff (Week 13 and beyond)

- [~] Migrate remaining contexts (Operations, Welfare, Communications, CMS, Portals, Students/Staff, Examinations, Timetable) using the standard slice. Reports/EMIS/Analytics routes are now service-backed; frontend modules all use TanStack Query or typed `api-client`.
- [ ] Run a full adversarial security review.
- [ ] Add Playwright E2E for parent and student portals.
- [ ] Add PWA/offline strategy for attendance entry.
- [ ] Add Shona/Ndebele i18n structure (strings only, if requested).
- [ ] Remove old `Float` money columns and `isActive` columns after one release of no reads.
- [~] Document the new architecture and onboarding guide (`REARCHITECTURE-BLUEPRINT.md`, `MIGRATION-GUIDE.md`, `docs/RLS.md` exist; onboarding guide pending).

---

## Success Metrics

| Metric | Target by Week 12 | Status |
|--------|-------------------|--------|
| Cross-tenant tests | 100% pass, cover all tenant-owned resources | Partial — static route guard + dynamic finance tests pass; per-resource coverage pending. |
| Service-layer coverage | 100% of finance, assessment, people, settings logic | Partial — settings/payments/report-cards/reports done; people/examinations/timetable pending. |
| Unit test coverage | ≥70% of service layer | Not yet measured. |
| E2E critical journeys | 5 critical journeys passing in CI | Partial — smoke, login/dashboard/modules, and public admissions apply flow green in chromium + mobile; payment/report-card portal journeys pending. |
| CI build time | <10 minutes | Not measured (CI not live). |
| `console.*` in production | 0 | 0 in `src/app/api`; Pino patches console globally. |
| Secrets in repo | 0 | `.env.example` uses placeholder values; no live credentials detected. |
| Modules migrated to standard | All modules use typed data layer | In progress; reports service done; decomposition pilots completed for `timetable-module.tsx`, `sdc-module.tsx`, `sms-dialog.tsx`, and `paynow-dialog.tsx`. |
| Average route handler size | <50 lines | Not yet achieved for EMIS/report-card HTML routes; most routes now thin wrappers. |
| New route pages | Server-rendered by default | Dashboard routes exist at `/dashboard/[module]`; internal module buttons still module-swap (pending). |

---

## Risk Triggers (pause and reassess if any occur)

1. Cross-tenant test suite finds more than 5 new leaks in a single phase.
2. Any data migration cannot be rolled back in <30 minutes.
3. Finance balance discrepancy > 0.01 between old and new calculations.
4. CI build time exceeds 15 minutes.
5. More than 2 weeks of scope creep added to the current phase.
