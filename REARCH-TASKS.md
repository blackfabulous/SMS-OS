# ZimSchool Pro — Re-Architecture Task Plan

> Gap analysis + actionable backlog to converge the running app onto `REARCHITECTURE-BLUEPRINT.md`.
> Strangler approach (blueprint §8): each task ships independently and stays green (`tsc` + tests + build).
> Verified against the codebase 2026-07-10.
>
> **Legend** — Priority: P0 (urgent/security) · P1 (foundational) · P2 (standard) · P3 (later).
> Effort: S (<½ day) · M (~1 day) · L (2–4 days) · XL (week+). Status: ☐ todo · ◐ partial · ☑ done.

---

## 0. Snapshot — what we have vs the blueprint

| Blueprint pillar | Current state (verified) | Gap |
|---|---|---|
| Money as `Decimal` | All money/rate fields are `Decimal @db.Decimal(15,2)` (or 15,6 for exchange rate); remaining `Float` columns are academic/score percentages (`totalMarks`, `marksObtained`, `passMark`, `weight`, etc.) | Done |
| Closed sets as `enum` | 38 Prisma enums defined; high-risk status/type columns converted (`BoardingAssignment`, `TransportAssignment`, `MaintenanceRequest`, `Payslip`, `AppraisalRecord`, `StaffDiscipline`, `Outbox`, `Communication`, `CanteenItem`, `CanteenTransaction`, `PurchaseOrder`, `Requisition`, `Document`, `AlumniContribution`). Remaining strings are free-form labels/colors/categories (CMS, themes, templates) | Done (core) |
| Soft-delete `deletedAt` | Added `deletedAt` + `@@index([deletedAt])` on 77 tenant-owned models; Prisma extension auto-filters and converts `delete` → soft-delete | Done |
| Per-school unique keys | 10 composite `@@unique([schoolId, ...])`; `FeeInvoice.invoiceNumber` and `FeePayment.receiptNumber` now per-school unique | Done (finance) |
| `schoolId` on every tenant-owned row | Every tenant-owned model with `deletedAt` now carries a `schoolId` column (required on business tables, nullable on `AuditLog`/`Outbox` for system events); `CanteenTransactionItem` and `PurchaseOrderItem` added; `EXISTS` RLS block removed | Done |
| DB migrations | `prisma/migrations/20250714120000_baseline/migration.sql` created and kept in sync with schema; `bun run db:deploy` replaces `prisma db push` | Done |
| Tenancy backstop (RLS) | Implemented: `src/lib/db.ts` Prisma extension, `prisma/rls/enable-rls.sql` now uses direct `schoolId` policies and covers every tenant table (no `EXISTS` join policies); `docs/RLS.md` | Done / advanced |
| RBAC | `src/lib/rbac.ts` matrix, `src/server/context.ts` `requireContext` wrapper | Done |
| Service layer (`src/server`) | `src/lib/settings.ts`, `src/server/finance/scope.ts`, `src/server/services/payment-service.ts`, `src/lib/finance-calc.ts`, `src/lib/grading.ts`, etc. | Partial — payments service + repository created; other contexts pending |
| Real dashboard routes | `src/app/dashboard/[module]/page.tsx` introduced; `DashboardShell` drives module from URL; `AppSidebar` and `MobileBottomNav` navigate via `router.push`; legacy Zustand `activeModule` still used by internal module buttons (migration pending) | Partial |
| TanStack Query | `QueryProvider` added to root layout; `src/lib/api-client.ts` typed envelope client; `src/hooks/use-api-query.ts` hooks; modules still use `useApi` / ad-hoc fetch, migration pending | Partial |
| Design system | Emerald tokens + `components/ui` exist; module files are 800–1,500-line monoliths with inconsistent loading/error/empty states | Partial |
| Tests | 13 Vitest files, including `tests/tenant-safety.test.ts`, `tests/tenant-context.test.ts`, `tests/finance-scope.test.ts`, `tests/student-access.test.ts` | Partial |
| Observability | `console.*` only; no Pino/Sentry | Full |
| Outbox / durable jobs | `Outbox` model + `src/server/outbox.ts` (`enqueueOutbox`, `processOutboxJob`, `processOutbox`) wired into notifications (`src/lib/notifications.ts`) and report-card generation (`src/lib/report-card-service.ts`); new `POST /api/outbox/process` endpoint | Done |
| Ops | Root `Dockerfile`, `.dockerignore`, `scripts/github-ci.yml`, and `package.json` `typecheck` script added; `.github/workflows/ci.yml` needs GitHub `workflow` OAuth scope to push | Done |
| Public site | Real App Router routes, metadata, sitemap/robots/JSON-LD | Done |
| Settings registry | `src/lib/settings-schema.ts` + `src/lib/settings.ts` with Zod, categories, defaults, UI hints | Done |
| Finance allocation | `PaymentAllocation` model added; payment creation (`/api/finance/payments`, `/api/finance/beam/apply`) creates allocations; reverse deletes allocations; `FeeInvoice.balance` still cached during transition | Done (ledger + cached balance) |
| Audit log | `AuditLog` now has `schoolId`, `actorId`, `beforeValue`/`afterValue` as `Json`; `logAudit` helper updated; direct route callers migrated | Done |

### Already in place (reference implementations of the "standard slice")
- Public `(public)` route group with SSR + metadata + sitemap/robots/JSON-LD.
- RLS defense-in-depth: tenant context + Prisma extension + `EXISTS` policies for relation-scoped tables.
- Settings registry + store + API (`src/lib/settings*.ts`, `/api/settings`) — pattern for config.
- RBAC matrix (`src/lib/rbac.ts`) and `requireContext` wrapper.
- Finance multi-currency math + late fees (`src/lib/finance-calc.ts`) — pure + tested.
- ZIMSEC grading + CA weighting (`src/lib/grading.ts`) — pure + tested.
- Notification event library + multi-channel dispatch (`src/lib/notification*.ts`) — fire-and-forget (needs outbox).
- Report-card publish/countersign workflow (`src/lib/report-card-workflow.ts`) — pure + tested.
- Statement + BEAM allocation (`src/lib/statement.ts`, `beam.ts`) — pure + tested (F8 WIP).
- Cross-tenant static guard (`tests/tenant-safety.test.ts`) — scans API routes for scope signals.

---

## 1. P0 — Urgent corrections (do first, any pace)

| ID | Task | Effort | Acceptance |
|----|------|--------|-----------|
| RA-01 | **Introduce `deletedAt` soft-delete** on every tenant-owned model + Prisma extension that auto-filters `deletedAt: null` and converts `delete` → soft-delete | L | Done — `tsc` green; deletes are soft-deleted |
| RA-02 | **Add `schoolId` to high-risk child/join tables** (`FeeInvoice`, `FeePayment`, `InvoiceItem`, `StudentEnrollment`, `AssessmentMark`, `ReportCard`) and make invoice/receipt numbers per-school unique | L | Partial — finance tables (`FeeInvoice`, `FeePayment`, `InvoiceItem`) done; remaining child/join tables still relation-scoped |
| RA-03 | **Replace mutable `FeeInvoice.balance` with `PaymentAllocation` ledger**; keep `balance` as a view/cache only if necessary during transition | L | Done — `PaymentAllocation` model + allocations on payment/BEAM/reversal; `balance` still cached during transition |
| RA-04 | **Improve `AuditLog` and add `Outbox`** — `schoolId`, `actorId`, `ipAddress`, `beforeData`/`afterData` Json; durable outbox for notifications/SMS/email/reports | M | Done — `AuditLog` tenant-scoped with `Json` before/after; `Outbox` model + `src/server/outbox.ts` worker |
| RA-05 | **Land root `Dockerfile` + GitHub Actions CI** — typecheck, tests, build, RLS safety | M | Done — `Dockerfile`, `.dockerignore`, `.github/workflows/ci.yml`, `typecheck` script added |

---

## 2. WS-A — Database & domain model (blueprint §2)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-A1 | **Introduce Prisma migration history** (`prisma migrate`); stop relying on `db push` | P1 | M | — | Done — `prisma/migrations/20250714120000_baseline/` added and kept in sync; `bun run db:deploy` replaces `db push` |
| RA-A2 | **Finish money → `Decimal @db.Decimal(15,2)`**; audit remaining `Float` fields (`exchangeRate`, `discountPercentage`, etc.) | P2 | M | RA-A1 | Done — all money/rate fields now `Decimal`; remaining `Float` columns are academic scores/percentages only |
| RA-A3 | **Finish Prisma enums** — migrate remaining `String` status/type columns (`Student.beamStatus`, `StudentEnrollment.status`, `Staff.contractType`, `Staff.payType`, etc.) | P2 | L | RA-A1 | Done (core) — 38 enums defined; high-risk status/type fields converted; CMS/theme free-form labels remain as strings |
| RA-A4 | **Per-school unique keys** — complete `@@unique([schoolId, ...])` for all natural keys; replace global `@unique` on `FeeInvoice.invoiceNumber`, `FeePayment.receiptNumber`, etc. | P1 | M | RA-A1 | Done — `FeeInvoice`/`FeePayment` numbers are per-school unique; natural keys carry `schoolId` composites |
| RA-A5 | **Backfill `schoolId` on remaining child/join tables** (the 32 models previously using `EXISTS` RLS) | P2 | XL | RA-A2, RA-A4 | Done — `schoolId` added to all tenant models (incl. `CanteenTransactionItem`, `PurchaseOrderItem`); `prisma/rls/enable-rls.sql` now uses direct `schoolId` policies |
| RA-A6 | **Soft-delete via `deletedAt`** + Prisma extension that auto-filters; migrate off `isActive` | P0 | L | RA-A1 | Deletes are recoverable + timestamped |
| RA-A7 | **`AuditLog` gains `schoolId`, actor, immutable timestamp, typed `Json` before/after**; index | P0 | M | RA-A1 | Audits are tenant-scoped + queryable |
| RA-A8 | **Tighten `onDelete`** — default `Restrict`; `Cascade` only for owned children; remove cascades through shared entities | P2 | M | RA-A1 | Done — explicit `onDelete: Cascade` only on owned join/line-item children; all parent FKs default to `Restrict`/`SetNull` |
| RA-A9 | **Identity model fix** — formalize `User`↔Staff/Student/Parent links; consider polymorphic `personType`/`personId`; give Parents a real `User` link | P1 | L | RA-A1 | Partial — kept nullable `staffId`/`studentId`/`parentId` and added DB-level `CHECK (numnonnulls(...) <= 1)`; polymorphic refactor moved to P2 follow-up |
| RA-A10 | **Finance: `PaymentAllocation`** so payments allocate to invoices (balances derived, not hand-mutated) | P0 | L | RA-A2 | Balance is computed; multi-invoice/BEAM payments correct |
| RA-A11 | **Timestamps → `Timestamptz` (UTC)**; format at edge per school timezone setting | P3 | M | RA-A1 | Done — all `DateTime` columns use `@db.Timestamptz(3)`; timezone formatting remains client/app-layer |

---

## 3. WS-B — Tenancy, auth & security (blueprint §3.2, §7)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-B1 | `requireContext` already wraps auth + RBAC — replace any remaining scattered `validateRole([...])` | P1 | M | — | All routes use `requireContext` |
| RA-B2 | Policy-based RBAC (`src/lib/rbac.ts`) is in place; add field-level visibility rules (parent sees own children only, etc.) | P1 | M | RA-B1 | Central, testable permission matrix |
| RA-B3 | Postgres RLS is implemented; verify non-superuser app role and enable `RLS_ENABLED=true` in staging | P1 | M | RA-A5 | Cross-tenant query blocked at DB even if app check missing |
| RA-B4 | **Repository layer always injects `schoolId`** — `src/server/repositories/tenant-scope.ts` helpers + `src/server/repositories/payment.ts` reference; payments route now uses repo functions | P1 | L | RA-C1 | RA-02 suite passes for all resources |
| RA-B5 | 2FA for admin roles; "log out all devices"; PII-at-rest encryption (national ID/medical) | P2 | L | — | Admin 2FA; sensitive fields encrypted |
| RA-B6 | **Distributed rate-limit** — `src/lib/rate-limit.ts` with a Postgres-backed `RateLimitWindow` store (survives multi-instance; Redis/Upstash implementation can be swapped in) | P2 | M | — | Limits survive multi-instance |

---

## 4. WS-C — Service & repository layer (blueprint §1, §3)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-C1 | **Create `src/server/repositories/` structure** + tenant-scoped helper (`tenant-scope.ts`) and a payments reference repository | P1 | M | — | Payments repository injects `schoolId` and is used by `/api/finance/payments`; remaining contexts to follow |
| RA-C2 | Migrate domain logic into services context-by-context (finance, examinations, attendance, students, settings already partial) | P1 | XL | RA-C1 | Each service unit-tested; routes thin |
| RA-C3 | **Response envelope** `{data}` / `{error:{code,message,details}}` + `ok()`/`fail()` helpers in `src/server/http.ts` | P2 | S | — | Helpers created; `/api/finance/payments` and `/api/notifications/send` converted; route-wide rollout pending |
| RA-C4 | **Outbox table + worker** for notifications/SMS/email/reports — replace fire-and-forget | P0 | L | RA-A7 | Done — `src/server/outbox.ts` with registry, `processOutboxJob`, `processOutbox`; handlers for `notification.dispatch`, `notification.batch`, `report.generate`; `/api/outbox/process` endpoint |
| RA-C5 | **Idempotency keys** for money/comms operations — `src/lib/idempotency.ts` with Postgres-backed `IdempotencyKey` store | P2 | M | RA-C2 | Done — applied to `/api/finance/payments` (POST) and `/api/notifications/send`; safe retries with stored responses |
| RA-C6 | Adopt **Server Actions** for form mutations (admissions, settings, marks) | P2 | M | RA-C1 | Forms use actions + shared Zod |

---

## 5. WS-D — Routing & frontend architecture (blueprint §4)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-D1 | **`(app)` route group + shell layout** (sidebar/header as Server Components) | P1 | M | — | Authenticated shell rendered by a layout |
| RA-D2 | **Migrate dashboard from Zustand `activeModule` swap to real nested routes** — one module at a time (coexist during transition) | P1 | XL | RA-D1 | Deep-linkable URLs; back/forward; per-route SSR + code-split |
| RA-D3 | **Module decomposition standard** — `page.tsx (server) + components/ + hooks/`, ≤~300 lines/file (current modules are 800–1,500) | P2 | XL | RA-D2 | No monolith module files |
| RA-D4 | **Error boundaries** at shell + per route segment | P2 | S | RA-D1 | One module crash can't blank the app |
| RA-D5 | Zustand limited to genuine UI state (sidebar/theme) | P3 | S | RA-D2 | No server data in Zustand |

---

## 6. WS-E — Client data layer (blueprint §4.2)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-E1 | **`QueryClientProvider` + typed `api` client** over the response envelope | P1 | S | RA-C3 | TanStack wired app-wide |
| RA-E2 | **Replace ad-hoc `fetch`** with TanStack Query hooks (`use-<feature>.ts`) — per module as it migrates | P2 | XL | RA-E1, RA-D2 | Caching/optimistic updates; 0 raw `fetch('/api')` in modules |

---

## 7. WS-F — UI/UX & design system (blueprint §5)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-F1 | **Codify design tokens** (color/space/radius/shadow/type) + light/dark, documented | P2 | M | — | Single token source; no hardcoded hex in modules |
| RA-F2 | **Shared primitives** — one `DataTable`, `FormField`, `PageHeader`, and empty/loading/error states reused everywhere | P2 | L | RA-F1 | Modules compose shared components |
| RA-F3 | **Accessibility (WCAG 2.1 AA)** — landmarks, labels, focus, keyboard nav, contrast; add `eslint-plugin-jsx-a11y` + axe in Playwright | P2 | L | RA-F2 | a11y lint + axe pass |
| RA-F4 | **Role-aware IA + breadcrumbs + command-palette search** | P3 | M | RA-D2 | Navigation derived from route tree |
| RA-F5 | **Forms = React Hook Form + Zod resolver** (shared schema with server) | P2 | M | RA-C6 | Consistent inline validation |
| RA-F6 | Responsive pass (tables→cards on mobile); `prefers-reduced-motion` | P3 | M | RA-F2 | Mobile-first verified |

---

## 8. WS-G — Non-functional & ops (blueprint §7)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-G1 | **Pino structured logging** (request IDs) replacing `console.*` | P1 | M | — | JSON logs with correlation |
| RA-G2 | **Sentry** (errors + traces) | P2 | S | — | Errors captured in prod |
| RA-G3 | **GitHub Actions CI** — typecheck/lint/test/build on every PR (incl. RA-02) | P0 | M | — | PRs gated green |
| RA-G4 | **Docker + docker-compose** (app + Postgres); standalone output | P0 | M | — | One-command local + deployable image |
| RA-G5 | **Playwright E2E** on critical journeys (login, enrol→attendance, fee→payment→statement, marks→report-card→publish, parent views child) | P2 | L | RA-D2 | E2E green in CI |
| RA-G6 | `/api/health/deep`; backups/PITR (Supabase) verified | P3 | S | — | Health + DR documented |
| RA-G7 | i18n + currency util scaffold (EN now; Shona/Ndebele-ready); school-timezone formatting | P3 | M | RA-A11 | Single currency/date util |
| RA-G8 | Offline/PWA strategy for register + attendance entry | P3 | M | RA-D2 | Defined offline behavior |

---

## 9. WS-H — Feature depth (blueprint §6, product backlog)

Continue closing `full school management plan.md` on the **standard slice** (§9 of the blueprint). Order (highest-value Zimbabwe-specific first; several already have foundations):

RA-H1 Settings depth · RA-H2 Finance (PayNow/EcoCash live, statements, BEAM with `PaymentAllocation`) · RA-H3 Examinations (workflow ☑) · RA-H4 Attendance+Comms triggers (needs outbox) · RA-H5 Students/Admissions/Staff depth · RA-H6 Operations (boarding/transport/library/inventory/POS) · RA-H7 Welfare/Discipline/Health/SDC · RA-H8 CMS depth · RA-H9 Portals (parent/student/teacher) · RA-H10 Reports/EMIS/analytics.

---

## 10. Sequenced execution (strangler phases)

1. **Phase 0 — Safety & ops (P0):** RA-01, RA-02, RA-03, RA-04, RA-G3, RA-G4. *(soft-delete, payment ledger, audit/outbox, CI/Docker before broader refactoring)*
2. **Phase 1 — DB foundations:** RA-A1 → RA-A2, RA-A3, RA-A4, RA-A6, RA-A7, RA-A10, RA-A9. *(migrations, Decimal, enums, keys, identity, allocations)*
3. **Phase 2 — Backend standard:** RA-C1, RA-B1, RA-B2, RA-B4 → RA-C3, RA-C2 (per context), RA-C4 (outbox), RA-B3 (RLS verify).
4. **Phase 3 — Frontend standard:** RA-D1 → RA-D2 (module-by-module) with RA-E1/RA-E2 and RA-F1/RA-F2 applied during each module's move; RA-D4.
5. **Phase 4 — Ops polish:** RA-G1, RA-G2, RA-G5, RA-G6, RA-G7, RA-G8.
6. **Phase 5 — Depth & polish:** WS-H feature depth + remaining P3 (RA-A5/A11, RA-B5/B6, RA-F3–F6).

Each module migrated in Phase 3 should exit meeting the blueprint's **§9 "definition of standard"** and pass the RA-02 cross-tenant suite before merge.

---

## 11. This push's scope

The 2026-07-10 push lands the P0 items needed before wider refactoring:
- RA-01: `deletedAt` soft-delete across tenant-owned tables + Prisma extension.
- RA-03: `PaymentAllocation` model + allocation logic; keeps `FeeInvoice.balance` as a transition cache.
- RA-04: `Outbox` model and `AuditLog` `schoolId`/`actorId`/`beforeData`/`afterData` improvements.
- RA-05: Root `Dockerfile` + `.github/workflows/ci.yml`.
- RA-G3/RA-G4: CI + Docker wiring.
- Updated `REARCHITECTURE-BLUEPRINT.md` and `REARCH-TASKS.md`.

Remaining work (RA-A5 full `schoolId` backfill, RA-A9 identity model, RA-D2 routing, RA-E2 TanStack Query, etc.) is queued in the Phase 1–5 backlog above.
