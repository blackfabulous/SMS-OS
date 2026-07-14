# ZimSchool Pro — Re-Architecture Blueprint

> A clean, standards-first design for the whole system **as if building it fresh** — database → API → UI/UX.
> Grounded in a six-lens analysis of the current app (DB, backend/auth, frontend, UI/UX, feature coverage, non-functional).
> Execution backlog: `REARCH-TASKS.md`. Product feature backlog: `full school management plan.md`.
> Status: Updated · 2026-07-10

---

## 0. Why re-architect

The current app is feature-rich (~78 Prisma models, ~62 API routes, ~41 dashboard modules, 6 roles) and a lot works. But the analysis found recurring **non-standard patterns** that raise the cost of every future change and create real risk:

| Layer | Non-standard pattern found | Risk |
|------|----------------------------|------|
| DB | Money mostly `Decimal` (50 fields) but 11 `Float`s remain; 23 Prisma enums defined but some status/type columns still `String`; `deletedAt` soft-delete added to 77 tenant-owned models; `schoolId` added to finance tables (`FeeInvoice`, `FeePayment`, `InvoiceItem`, `PaymentAllocation`, `Outbox`, `AuditLog`); `AuditLog` now tenant-scoped with `Json` before/after; `FeeInvoice`/`FeePayment` numbers per-school unique; `PaymentAllocation` ledger introduced; `isActive` still present as legacy | Rounding risk in `exchangeRate`/`discountPercentage`; invalid states; remaining relation-scoped child/join tables; migration still manual |
| Backend | Tenant context + RLS extension provide DB backstop; `PaymentAllocation`/`Outbox` services added; business logic still lives inside many route handlers | Inconsistent app-layer scoping, untestable logic, lost background work |
| Frontend | Dashboard is **one** `'use client'` page swapping ~41 lazy modules by a Zustand `activeModule` flag — no URL routing, no deep-links/back-button, no per-route SSR or code-split; module files are 800–1,500-line monoliths; ad-hoc `fetch` instead of a query cache | No shareable URLs, large bundles, poor UX, hard to maintain |
| UI/UX | Emerald system exists but applied inconsistently; loading/empty/error states ad-hoc; accessibility gaps | Inconsistent, less accessible UX |
| Non-functional | Cross-tenant static tests and several unit tests exist; root `Dockerfile` + GitHub Actions CI added; `typecheck` script added; no E2E; `console.*` logging; `.env.example` cleaned of real credentials | Regressions, no prod observability; CI still needs Bun + DB wiring for tests |

**Design goals for the rebuild:** correctness & data integrity first; security & multi-tenancy by construction (defense in depth); real routing & SSR; a thin, typed, testable service layer; one design system; and operability (logging, CI, deploys).

---

## 1. Architecture overview

**Stack (keep what's good, standardize the rest):**
- **Next.js (App Router)** · React 19 · TypeScript (strict) — real nested routes everywhere, Server Components by default.
- **PostgreSQL (Supabase)** via **Prisma** — with **enums, `Decimal` money, `deletedAt` soft-delete, and Row-Level Security** for tenant isolation.
- **NextAuth (JWT)** + a **policy-based RBAC** layer.
- **Zod** for every input boundary; **TanStack Query** for all client data.
- **Tailwind v4 + shadcn/ui** with a documented token system.
- **A job/outbox queue** (Upstash QStash or a DB outbox + worker) for notifications/SMS/email.
- **Pino** structured logging + **Sentry**; **Upstash Redis** rate-limit; **Docker + GitHub Actions** CI.

**Layering (strict, top calls down only):**
```
UI (Server/Client Components)
  └─ API route handlers / Server Actions   ← thin: auth, validate (Zod), call service
       └─ Service layer (src/server/services/*)   ← business logic, transactions, authorization checks
            └─ Repository / Prisma (src/server/db/*)   ← tenant-scoped data access
                 └─ Postgres (+ RLS as a backstop)
```
The **service layer is the single home of business logic** — so it is unit-testable without HTTP and reused by route handlers, Server Actions, cron jobs and seeds alike. (Today logic lives in route handlers; that's the root cause of the duplicated grading ladders and inconsistent tenant checks.)

---

## 2. Database & domain model (the foundation)

### 2.1 Principles
1. **Every tenant-owned row carries `schoolId`** and is unique **within** the school: `@@unique([schoolId, <natural key>])`. Fixes the global-unique `studentNumber`/`staffNumber` collision.
2. **Money is `Decimal @db.Decimal(15,2)`** — never `Float`. A single `Money` value object in app code wraps amount+currency.
3. **Closed sets are Prisma `enum`s** (Role, EnrollmentStatus, StaffType, PaymentMethod, Currency, InvoiceStatus, ReportCardStatus, …) — compile-time safety + clean migrations.
4. **Soft-delete via `deletedAt DateTime?`** (+ `@@index`) with a Prisma extension that auto-filters `deletedAt: null`; no more scattered `isActive`.
5. **Auditing is first-class**: `AuditLog` gains `schoolId`, immutable timestamp, actor, `entity`, `entityId`, and `before/after` as `Json`. Writes go through an **outbox** so an audit can never be silently dropped.
6. **Explicit relational intent**: `onDelete: Restrict` by default; `Cascade` only for truly-owned children (invoice→items, order→lines). No cascade through shared entities (e.g. never cascade Grade→GradeSubject→Subject).
7. **Defense-in-depth tenancy**: enable **Postgres RLS** keyed on a `app.current_school_id` session var set per request — so even a missing app-layer check cannot leak across schools.
8. **UTC everywhere** (`@db.Timestamptz`), formatted at the edge in the school's timezone (a setting).

### 2.2 Bounded contexts (group the 78 models into ~10 domains)
- **Identity & Access**: `User`, `Role`, `Session`, `PasswordResetToken`, `AuditLog`, `SchoolSetting`.
- **School & Calendar**: `School`, `AcademicYear`, `Term`, `Holiday`, `Department`, `House`.
- **People**: `Student`, `Guardian` (renamed from Parent), `StudentGuardian`, `Staff`, `Enrollment`.
- **Academics**: `Grade`, `Class`, `Subject`, `GradeSubject`, `TimetableEntry`.
- **Assessment**: `Assessment`, `AssessmentMark`, `ReportCard` (+ workflow), `GradingScale`.
- **Finance**: `FeeStructure`, `Invoice`, `InvoiceItem`, `Payment`, `PaymentAllocation`, `BankAccount`, `Scholarship`, `BeamApplication`.
- **Operations**: Boarding, Transport, Library, Inventory/Assets, Procurement, Canteen/Shop (POS).
- **Welfare & Conduct**: Health, Discipline, Welfare, SDC.
- **Communications**: `Message`, `NotificationEvent`, `Template`, `Channel` config.
- **Website/CMS**: `Page`, `NewsArticle`, `Event`, `GalleryImage`, `Faq`, `SiteTheme`, `SEOSetting`.

Each context = a folder under `src/server/services/<context>/` with its own service(s), Zod schemas, and tests.

### 2.3 Identity model fix (high-severity today)
`User` currently has nullable `staffId`/`studentId`/`parentId` with no real link for parents. Replace with a clean polymorphic principal:
```prisma
model User {
  id        String  @id @default(cuid())
  schoolId  String
  email     String
  role      Role
  // exactly one backing entity, enforced by a CHECK + app invariant
  staffId   String? @unique
  studentId String? @unique
  guardianId String? @unique
  ...
  @@unique([schoolId, email])
}
```
Add a DB `CHECK` so the right link is present for the role (TEACHER/ADMIN→staff, STUDENT→student, PARENT→guardian). Guardians get a first-class `User` link (today they can't truly self-serve).

### 2.4 Finance modelling (correctness-critical)
- `Decimal` everywhere; `Currency` enum; **payments allocate to invoices** via `PaymentAllocation` (a payment can cover several invoices, e.g. BEAM), so balances are derived, never hand-mutated. (The current "mutate `balance` in the route" pattern caused the multi-currency settlement bug.)
- Exchange rate captured per payment; statement/ledger computed by a pure service from immutable invoice + allocation rows.

---

## 3. Backend / API

### 3.1 Conventions
- **Route handlers stay thin**: `auth → tenant → Zod-validate → service → typed response`. No business logic, no raw `body` access.
- **One response envelope**: success `{ data }`; error `{ error: { code, message, details? } }` with consistent HTTP codes. A shared `ok()` / `fail()` helper.
- **Server Actions** for form mutations co-located with their UI (admissions apply, settings save, mark entry); **route handlers** for cross-client/public APIs (sitemap, webhooks, public forms).
- **Transactions in the service** (`prisma.$transaction`) for any multi-write operation; reads are tenant-scoped repository calls.
- **Idempotency** for money/communication operations via an `idempotencyKey` (the BEAM `coverageAppliedAt` flag generalised).

### 3.2 Auth, RBAC & tenancy (by construction)
- `withAuth(roles)` wrapper resolves the session, sets `app.current_school_id` (for RLS), and injects a typed `ctx = { user, schoolId, can() }`.
- **Policy-based RBAC**: a central `policies.ts` maps `(role, action, resource)` → allow/deny, replacing scattered `validateRole([...])` lists. Field/row visibility (e.g. a parent only sees their own child, a teacher only their classes) is enforced in the repository via mandatory `schoolId` + relationship filters.
- **Tenancy is enforced in three places** (belt & braces): the repository always injects `schoolId`; RLS backs it at the DB; and a test suite asserts cross-tenant access is impossible for every resource. (This permanently closes the class of bug the adversarial reviews kept finding.)

### 3.3 Side-effects & jobs
Notifications, SMS/email, report generation and statements run through an **outbox table + worker** (or QStash), not fire-and-forget in the request. Guarantees delivery, retries, and observability; keeps responses fast. Channel selection still reads the settings registry.

---

## 4. Frontend architecture

### 4.1 Replace the "SPA-by-flag" dashboard with real routes
Today the whole dashboard is one client component that swaps ~41 modules by `useAppStore().activeModule`. Target:
```
src/app/(public)/...            # marketing site (already real routes — keep)
src/app/(app)/layout.tsx        # authenticated shell: sidebar + header (Server Component)
src/app/(app)/dashboard/page.tsx
src/app/(app)/students/page.tsx · students/[id]/page.tsx
src/app/(app)/finance/(invoices|payments|statements)/...
src/app/(app)/academics/... · attendance/... · examinations/... · settings/...
```
Benefits: **deep-linkable URLs, back/forward, per-route SSR + streaming, route-level code-splitting, granular access control via nested layouts**, and far smaller client bundles. Each module becomes `page.tsx (server) + components/ + hooks/` instead of a 1,200-line client monolith.

### 4.2 Data & state
- **Server Components fetch initial data** (via the service layer) and stream it.
- **TanStack Query** owns all client-side reads/mutations: caching, optimistic updates, refetch, and a single typed `api` client over the response envelope. Replaces the ad-hoc `fetch()` calls.
- **Zustand only for genuine UI state** (sidebar open, theme), not for routing or server data.
- **Error boundaries** at the shell and per route segment so one module can't blank the app.

### 4.3 Module decomposition standard
Per feature: `page.tsx` (server, data + metadata) → `feature-table.tsx`/`feature-form.tsx` (client, presentational) → `use-feature.ts` (TanStack Query hooks) → server actions/service. Hard cap ~300 lines/file.

---

## 5. UI/UX & design system

- **Tokens**: codify the emerald brand as CSS variables + Tailwind theme (color scales, spacing, radius, shadow, typography) in one place; light/dark; document them. Zimbabwe flag accent kept as a deliberate motif.
- **Component library**: shadcn/ui as the base; a thin `@/components/ui` layer with consistent variants. One `<DataTable>`, one `<FormField>`, one `<PageHeader>`, one set of empty/loading/error states — reused everywhere (kills per-module divergence).
- **Information architecture**: role-aware navigation grouped by domain (People, Academics, Finance, Operations, Welfare, Communications, Website, Admin); breadcrumbs from the route tree; global command-palette search.
- **Accessibility (WCAG 2.1 AA)**: semantic landmarks, labelled controls, focus management, keyboard nav, color-contrast-checked tokens, `aria-live` for async results. Make it a CI lint (eslint-plugin-jsx-a11y) + Playwright axe checks.
- **Responsive**: mobile-first; the existing mobile bottom-nav generalised; tables → cards on small screens.
- **Premium polish**: consistent motion (Framer) with `prefers-reduced-motion`, skeleton loaders, and real imagery via the CMS.
- **Forms**: React Hook Form + Zod resolver (shared schema with the server), inline validation, optimistic save, toasts.

---

## 6. Feature/module map (product surface)

Build to `full school management plan.md`, grouped by the bounded contexts in §2.2. For each module the standard slice is: **enum-backed model → service (+ Zod + tests) → tenant-scoped API/Server Action → server-rendered route + TanStack-Query client + shared UI components → role policy → notification events**. Priority order (Zimbabwe-specific, high-value first), mirroring the current Phase F:
1. Settings (config backbone) · 2. Finance (multi-currency, EcoCash/OneMoney/InnBucks/ZimSwitch/PayNow, BEAM, statements) · 3. Examinations (ZIMSEC grading + CA + report-card workflow) · 4. Attendance & Communications (event-driven SMS/email) · 5. Students/Admissions/Staff depth · 6. Operations (boarding/transport/library/inventory/POS) · 7. Welfare/Discipline/Health/SDC · 8. CMS depth · 9. Portals (parent/student/teacher) · 10. Reports/EMIS/analytics.

> Several of these already have solid foundations from recent work (settings registry, finance multi-currency, grading, notification dispatch, report-card workflow) — those become the **reference implementations** of the standard slice above.

---

## 7. Non-functional requirements

- **Testing**: Vitest unit tests for every service + pure lib (grading, finance, statements, beam, settings already done — extend to all); **cross-tenant isolation tests** as a standing suite; Playwright E2E on critical journeys (login, enrol→attendance, fee→payment→statement, marks→report card→publish, parent views child); `tsc --noEmit` + eslint as hard CI gates.
- **Security**: no secrets in the repo (rotate the committed `.env.example` DB password; use a secrets manager); PII-at-rest encryption for national ID/medical; 2FA for admin roles; "log out all devices"; CSRF on mutations; distributed rate-limit (Upstash) replacing the in-memory middleware; security headers (already present) kept.
- **Performance**: composite indexes per access path; no N+1 (batch loaders — the notification batch loader is the pattern); HTTP caching/ISR for public pages; `Decimal` math; pooled DB (PgBouncer 6543) at runtime, direct (5432) for migrations.
- **Observability**: Pino structured logs with request IDs; Sentry for errors + traces; a `/api/health/deep` check; audit completeness via the outbox.
- **i18n & money**: currency formatting via a single util (USD/ZWG); English now, structure for Shona/Ndebele; school-timezone date formatting.
- **Offline/PWA**: keep the service worker; define an explicit offline strategy for register/attendance entry.
- **Build/deploy**: Next standalone output in **Docker**; `docker-compose` (app + Postgres) for local; **GitHub Actions** running typecheck/lint/test/build on every PR; DB migrations via `prisma migrate` (introduce a migration history — today it's `db push`).

---

## 8. Migration path (strangler, not big-bang)

You don't rebuild blind — you converge the running app onto this blueprint incrementally:
1. **Foundations**: introduce enums + `Decimal` + `deletedAt` + per-school unique keys via real Prisma **migrations**; add RLS; add the `services/` + `repositories/` layer and move logic out of route handlers module-by-module (start with finance & examinations, already partly done).
2. **Tenancy hardening**: land the cross-tenant test suite; fix any resource it flags (the adversarial-review pattern, now automated).
3. **Routing**: move the dashboard from the Zustand-swap SPA to real `(app)/<module>` routes one module at a time (both can coexist during transition).
4. **Data layer**: TanStack Query + typed `api` client, replacing ad-hoc `fetch` per module as it's migrated.
5. **Design system**: extract tokens + shared components; migrate modules to them during their routing move.
6. **Ops**: add Pino/Sentry, Upstash rate-limit, the job outbox, Docker, and CI.
7. **Feature depth**: continue the Phase F batches on top of the new standard slice.

Each step ships independently, stays green (`tsc`+tests+build), and is adversarially reviewed for tenant safety before merge.

---

## 9. Definition of "standard" (acceptance bar for any module)
A module is "done to standard" when it has: enum-backed schema with `schoolId` + composite uniques + `Decimal` money; a service with Zod + unit tests; tenant-scoped repository access (with a passing cross-tenant test); a typed API/Server Action using the response envelope; a server-rendered route + TanStack-Query client; shared design-system UI with full loading/empty/error/a11y states; a role policy entry; and (where relevant) notification events via the outbox.

---

### Appendix — most urgent corrections (do first, regardless of pace)
1. Add `deletedAt` soft-delete to every tenant-owned table and a Prisma extension that enforces it.
2. Add `PaymentAllocation` and stop mutating `FeeInvoice.balance`.
3. Add `schoolId` to child/join tables and make invoice/receipt numbers per-school unique.
4. Improve `AuditLog` (tenant-scoped, actor, JSON before/after) and add an `Outbox` table + worker.
5. Add root `Dockerfile` + GitHub Actions CI (typecheck/tests/build/RLS safety).
6. Continue moving grading/finance/report-card logic fully into services under `src/server/services/<context>/`.
