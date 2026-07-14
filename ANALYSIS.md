# ZimSchool Pro — App vs Re-Architecture Blueprint Gap Analysis

> Generated from the uploaded `sms-os.zip` (79 commits, 79 Prisma models, 74 API routes, 15 pages) against `REARCHITECTURE-BLUEPRINT.md` and the `zimschool-rearchitecture` reference artifacts.

## 1. Executive Summary

The app is a real, feature-rich Next.js 16 + Bun + Prisma 6 + Supabase Postgres code base. It is already implementing the re-architecture blueprint in many places and has gone **beyond** the reference artifacts in some areas (RLS via a Prisma extension + `AsyncLocalStorage`, a settings registry with Zod, public-site SSR routes, 13 test files including tenant-safety static guards, and a working RBAC matrix). However, several blueprint pillars are only partially done. The biggest remaining risks are: missing `schoolId` on ~28 child/join tables, no soft-delete (`deletedAt`), `FeeInvoice.balance` stored as a mutable column, `User` using three nullable FKs instead of a polymorphic principal, and the dashboard still being a single `'use client'` page swapping modules via Zustand.

**Verdict:** the blueprint and the app are directionally aligned, but the implementation is ahead in some places and behind in others. The `REARCH-TASKS.md` snapshot is now outdated (it claims 0 `Decimal`/enums) and should be refreshed from the current schema/code.

## 2. Pillar-by-Pillar Comparison

| Pillar | Blueprint requirement | Current app state | Verdict | Notes |
|--------|------------------------|-------------------|---------|-------|
| **Money as `Decimal`** | `Decimal @db.Decimal(15,2)` for all money | 50 `Decimal` money fields; 11 `Float` fields remain (`deliveryRate`, `passMark`, `totalMarks`, `weight`, `marksObtained`, `exchangeRate`, `discountPercentage`, `rating`, etc.) | Mostly done | Remaining `Float`s are mostly non-money academic/operational numbers; `exchangeRate` and `discountPercentage` should still be audited. See `prisma/schema.prisma`. |
| **Closed sets as enums** | Prisma enums for status/role/gender/etc. | 23 enums defined; some models still use `String` (`Student.beamStatus`, `StudentEnrollment.status`, `Staff.contractType`, `Staff.payType`, etc.) | Partial | Good progress, but string columns still leak invalid states. |
| **Soft delete** | `deletedAt DateTime?` on every tenant-owned table | 0 `deletedAt`; 27 `isActive` booleans | Not done | `isActive` is a hard-delete guard, not an audit/recoverable soft delete. |
| **Per-school unique keys** | `@@unique([schoolId, naturalKey])` | 10 composite unique keys; `FeeInvoice.invoiceNumber` and `FeePayment.receiptNumber` are globally `@unique` | Partial | Global unique invoice/receipt numbers will collide across schools. |
| **`schoolId` on every tenant row** | Every tenant-owned model carries `schoolId` | 47 of 79 models have `schoolId`; 32 models lack it (child/join tables and some domain tables) | Partial | Missing on `FeeInvoice`, `FeePayment`, `InvoiceItem`, `StudentEnrollment`, `StudentParent`, `AssessmentMark`, `Term`, `ReportCard`, `Payslip`, `WelfareRecord`, `HealthRecord`, `DisciplineRecord`, `TransportAssignment`, `BoardingAssignment`, etc. |
| **Tenancy / RLS** | `SET LOCAL app.current_school_id` per transaction + Postgres RLS | Implemented via `src/server/tenant-context.ts` (`AsyncLocalStorage`), `src/lib/db.ts` Prisma extension, `prisma/rls/enable-rls.sql`, and `docs/RLS.md` | Done / advanced | Uses relation-scoped `EXISTS` policies for tables without `schoolId`. This works but is harder to maintain than column-based RLS and carries performance risk on deep joins. |
| **RBAC / policies** | Central role × module × action matrix | `src/lib/rbac.ts` has `UserRole`, `Action`, `MODULES`, `ROLE_PERMISSIONS`, and `requireContext` wrapper in `src/server/context.ts` | Done | Well-structured. Still app-layer only; no field-level checks in schema. |
| **Identity (`User`) model** | Polymorphic `personType` + `personId` | `User` has `staffId`/`studentId`/`parentId` nullable FKs; `Parent` not `Guardian` | Divergent | App uses separate nullable FKs. Blueprint suggests one pointer; either works, but the current model means a user can only be one kind and parent/guardian link is weak. |
| **Finance allocation** | `PaymentAllocation` ledger; derived invoice balance | `FeeInvoice` has a mutable `balance` column; `FeePayment` optionally links one invoice | Not done | Multi-invoice/BEAM allocation is not modeled immutably. This is a data-integrity risk. |
| **Service layer** | Business logic in `src/server/services/<context>/` | `src/lib/settings.ts`, `src/server/finance/scope.ts`, `src/lib/finance-calc.ts`, `src/lib/grading.ts`, etc. | Partial | Many route handlers still contain logic. No single `src/server/services/<context>/` layout yet. |
| **Route conventions** | Thin route handlers: auth → validate → service → typed response | 74 API routes; some use `requireContext`, some still inline auth/validation | Partial | `src/server/context.ts` and `src/server/http.ts` are good starting points but adoption is uneven. |
| **TanStack Query** | Typed `api` client + TanStack Query hooks | Installed (`@tanstack/react-query ^5.82`) but dashboard uses Zustand + ad-hoc `fetch` | Not used | `src/lib/use-api.ts` exists; not integrated into dashboard module rendering. |
| **Dashboard routing** | Real App Router routes per module | `src/app/dashboard/page.tsx` is `'use client'` and renders `ModuleRenderer` based on `useAppStore().activeModule` | Not done | Public site `(public)` uses real SSR routes. Dashboard is still a SPA-by-flag. |
| **Audit log** | `AuditLog` with `schoolId`, actor, immutable `Json` before/after | `AuditLog` has no `schoolId`; `beforeValue`/`afterValue` are `String`, `details` is `String` | Not done | Not tenant-scoped; structured diff is lost in string fields. |
| **Outbox / jobs** | Durable outbox for notifications, SMS, statements | Notifications are fire-and-forget (`src/lib/notifications.ts`) | Not done | No `Outbox` table or worker visible. |
| **Testing** | Unit tests per service + cross-tenant isolation suite | 13 Vitest files, including `tests/tenant-safety.test.ts`, `tests/tenant-context.test.ts`, `tests/finance-scope.test.ts` | Partial | Static tenant-safety guard is strong. DB-backed cross-tenant tests are limited. No E2E. |
| **Docker / CI** | `Dockerfile`, `docker-compose.yml`, GitHub Actions | None in repo root | Not done | `zimschool-rearchitecture` reference Dockerfile/CI exist and can be adapted. |
| **Observability** | Pino + Sentry structured logging | `console.*` only | Not done | `src/lib/db.ts` even comments that it uses `console` for query logging. |
| **Public site / CMS** | Real SSR routes, SEO, metadata | `src/app/(public)/...` pages, `src/lib/public-data.ts`, SEO settings | Done | Public-facing site is already on App Router with real routes. |
| **Settings registry** | Typed, validated, defaulted settings | `src/lib/settings-schema.ts` + `src/lib/settings.ts` | Done | This is a strong reference implementation; arguably better than the `zimschool-rearchitecture` settings service. |
| **Algorithms** | Pure functions for finance, timetable, enrollment | `src/lib/finance-calc.ts`, `src/lib/grading.ts`, `src/lib/statement.ts`, `src/lib/beam.ts`, `src/lib/payroll-calc.ts` | Partial | Domain logic is extracted; the `zimschool-rearchitecture` algorithms can supplement these. |

## 3. Biggest Gaps vs the Improved Blueprint

The `zimschool-rearchitecture/REARCHITECTURE-BLUEPRINT-IMPROVED.md` adds a few stricter choices on top of the app's own blueprint:

1. **`deletedAt` soft-delete everywhere.** The app still relies on `isActive` booleans. This means deletes are not recoverable and audit trails are weaker.
2. **`schoolId` on every tenant-owned table.** The app uses relation-scoped `EXISTS` RLS policies for ~32 tables. The improved blueprint wants a `schoolId` column on each row for simpler, faster, and more maintainable policies.
3. **`PaymentAllocation` instead of `FeeInvoice.balance`.** The app stores a mutable `balance` and lets `FeePayment` point to one invoice. Multi-invoice payments (e.g. BEAM) are modeled via `BeamApplication` but the ledger is not generalized.
4. **Polymorphic `User` (`personType`/`personId`).** The app keeps `staffId`/`studentId`/`parentId`. This works but makes the user-entity join non-uniform and leaves parents without a strong `User` link.
5. **`AuditLog` with `schoolId` and `Json` before/after.** The current `AuditLog` is global and stores strings, losing structure and tenant scope.
6. **Outbox table.** There is no durable job queue for notifications, statements, etc.
7. **Real dashboard routes + TanStack Query.** The dashboard is the largest remaining frontend architecture gap.
8. **Docker + CI.** No production deployment pipeline or reproducible local stack.

## 4. Where the App Is Already Better Than the Reference Artifacts

- **RLS implementation:** the Prisma extension + `AsyncLocalStorage` pattern in `src/lib/db.ts` is more robust for PgBouncer transaction pooling than the simple `withTenantTransaction` helper in the reference.
- **Settings registry:** `src/lib/settings-schema.ts` already has Zod schemas, UI hints, categories, and defaults; the reference Settings service is a smaller CRUD-only slice.
- **RBAC matrix:** `src/lib/rbac.ts` covers all 41 modules and 6 roles.
- **Public site:** real App Router routes, metadata, sitemap/robots/JSON-LD.
- **Test coverage:** `tests/tenant-safety.test.ts` is a creative static guard that does not need a DB.

## 5. Recommendations (Priority Order)

1. **Refresh `REARCH-TASKS.md`** from the current code. The 2026-06 snapshot is misleading (it says 0 `Decimal`/enums). The current state is much further along.
2. **Land `deletedAt` soft-delete.** Add `deletedAt DateTime?` to every tenant-owned model, replace `isActive` usage, and add a Prisma extension to auto-filter `deletedAt: null`.
3. **Backfill `schoolId` on child/join tables.** Start with high-risk tables: `FeeInvoice`, `FeePayment`, `InvoiceItem`, `StudentEnrollment`, `AssessmentMark`, `ReportCard`. This enables simpler RLS and per-school unique invoice/receipt numbers.
4. **Replace mutable `FeeInvoice.balance` with `PaymentAllocation`.** Make payments immutable allocations; derive balances in queries/services.
5. **Refactor `User` to `personType`/`personId` (optional but cleaner).** If too disruptive, at least enforce a DB `CHECK` and give `Parent`/`Guardian` a real `User` link.
6. **Split the dashboard into App Router routes.** Move `src/app/dashboard/page.tsx` to `src/app/(app)/<module>/page.tsx` routes and use `useAppStore` only for pure UI state.
7. **Adopt TanStack Query.** Replace ad-hoc `fetch` with a typed `api` client + hooks; `src/lib/use-api.ts` is a starting point.
8. **Add `AuditLog` `schoolId` + `Json` fields and an `Outbox` table.** These are prerequisites for trustworthy audit and reliable notifications.
9. **Add `Dockerfile` + `.github/workflows/ci.yml`.** The `zimschool-rearchitecture` reference can be adapted for Bun/Next 16.
10. **Run the cross-tenant test suite against a real DB.** Expand `tests/tenant-safety.test.ts` to dynamic DB-backed tests.

## 6. What Was Pushed

This repo (`sms-os`) is the application code base. In addition to the original app, this push adds:

- `ANALYSIS.md` (this file)
- `rearchitecture/reference/` — the complete `zimschool-rearchitecture` deliverables (improved blueprint, risk register, 90-day plan, migration guide, proposed `schema.prisma`, RLS SQL, reference `Settings` service, algorithms, TanStack Query hooks, API client, Dockerfile, docker-compose, CI, seed script). These are provided as a reference and are **not** wired into the app's build.

The reference artifacts should be consulted, selectively copied, and adapted rather than dropped over the existing code as-is, because the app already has its own (often more advanced) implementations of the same patterns.
