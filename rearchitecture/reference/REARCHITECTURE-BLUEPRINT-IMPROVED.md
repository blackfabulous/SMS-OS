# ZimSchool Pro — Re-Architecture Blueprint (Improved)

> A clean, standards-first design for the whole system **as if building it fresh** — database → API → UI/UX.
> This document improves on the original blueprint by tightening the migration path, resolving the Postgres RLS/connection-pooling interaction, replacing the polymorphic user model with a simpler design, and sequencing the work by risk rather than feature value alone.
> Grounded in a six-lens analysis of the current app (DB, backend/auth, frontend, UI/UX, feature coverage, non-functional).
> Execution backlog: `REARCH-TASKS.md` (to be updated). Product feature backlog: `full school management plan.md`.
> Status: Proposal · 2026-07

---

## 0. Why re-architect

The current app is feature-rich (~78 Prisma models, ~62 API routes, ~41 dashboard modules, 6 roles) and a lot works. The analysis found recurring **non-standard patterns** that raise the cost of every future change and create real risk:

| Layer | Non-standard pattern found | Risk |
|------|----------------------------|------|
| DB | Money as `Float`; status/role as free `String` (no Prisma enums); `studentNumber`/`staffNumber` globally `@unique` (not per-school); `isActive` booleans instead of `deletedAt`; `AuditLog` has no `schoolId`; tenancy enforced **only** in app code (no DB-level guard) | Rounding errors in finance; invalid states; multi-tenant ID collisions; no deletion trail; cross-tenant leaks |
| Backend | Tenant scoping applied inconsistently (adversarial review found cross-tenant read/write holes in attendance, bulk-attendance and report-card GET); business logic lives **inside route handlers**; duplicated hardcoded grading ladders; mixed validation (some Zod, some raw `body`); ad-hoc error shapes; side-effects fire-and-forget with no queue | Security bugs, duplication, untestable logic, lost background work |
| Frontend | Dashboard is **one** `'use client'` page swapping ~41 lazy modules by a Zustand `activeModule` flag — no URL routing, no deep-links/back-button, no per-route SSR or code-splitting; module files are 800–1,500-line monoliths; ad-hoc `fetch` instead of a query cache | No shareable URLs, large bundles, poor UX, hard to maintain |
| UI/UX | Emerald system exists but applied inconsistently; loading/empty/error states ad-hoc; accessibility gaps | Inconsistent, less accessible UX |
| Non-functional | Tests minimal (until recently); no E2E; in-memory rate-limit; `console.*` logging; a real credential committed in `.env.example`; no CI/Docker | Regressions, no prod observability, security exposure |

**Design goals for the rebuild:**
1. Correctness & data integrity first.
2. Security & multi-tenancy by construction (defense in depth).
3. Real routing, SSR, and streaming.
4. A thin, typed, testable service layer.
5. One design system.
6. Operability (logging, CI, deploys).

**Non-goals:**
- Do not rewrite the entire frontend in one big-bang.
- Do not redesign the visual brand; standardize it.
- Do not add major new features until the existing surface is rebuilt to standard.

---

## 1. Architecture overview

### 1.1 Stack (keep what's good, standardize the rest)

- **Next.js 15+ (App Router)** · React 19 · TypeScript (strict) — real nested routes everywhere, Server Components by default.
- **PostgreSQL (Supabase)** via **Prisma** — with **enums, `Decimal` money, `deletedAt` soft-delete, and Row-Level Security (RLS)** for tenant isolation.
- **NextAuth (JWT)** + a **policy-based RBAC** layer.
- **Zod** for every input boundary; **TanStack Query** for all client data.
- **Tailwind v4 + shadcn/ui** with a documented token system.
- **A job/outbox queue** (Upstash QStash or a DB outbox + worker) for notifications/SMS/email.
- **Pino** structured logging + **Sentry**; **Upstash Redis** rate-limit; **Docker + GitHub Actions** CI.

### 1.2 Layering (strict, top calls down only)

```
UI (Server/Client Components)
  └─ API route handlers / Server Actions   ← thin: auth, validate (Zod), call service
       └─ Service layer (src/server/services/*)   ← business logic, transactions, authorization checks
            └─ Repository / Prisma (src/server/db/*)   ← tenant-scoped data access
                 └─ Postgres (+ RLS as a backstop)
```

The **service layer is the single home of business logic**. It is unit-testable without HTTP and reused by route handlers, Server Actions, cron jobs, and seeds. Business logic currently living in route handlers is the root cause of duplicated grading ladders and inconsistent tenant checks.

### 1.3 Decision log

| Decision | Rationale |
|----------|-----------|
| Service layer over fat route handlers | Testability, reuse, consistent auth/tenancy |
| Next.js App Router over SPA-by-flag | Deep links, SSR, streaming, code-splitting, route-level access control |
| Prisma enums over free strings | Compile-time safety, clean migrations, query clarity |
| `Decimal` over `Float` for money | Avoids rounding errors in finance and statements |
| `personId`/`personType` over `staffId`/`studentId`/`guardianId` | Simpler polymorphism, one unique constraint, one check, easier to extend |
| RLS as a backstop, not the only guard | App-layer checks are fast and explicit; RLS catches misses |
| QStash/outbox over fire-and-forget | Delivery guarantees, retries, observability, faster response times |
| Strangler migration over big-bang | The app is live; zero-downtime migration is required |

---

## 2. Database & domain model

### 2.1 Principles

1. **Every tenant-owned row carries `schoolId`** and is unique **within** the school: `@@unique([schoolId, <natural key>])`. Fixes the global-unique `studentNumber`/`staffNumber` collision.
2. **Money is `Decimal @db.Decimal(15,2)`** — never `Float`. A single `Money` value object in app code wraps amount + currency.
3. **Closed sets are Prisma `enum`s** (`Role`, `EnrollmentStatus`, `StaffType`, `PaymentMethod`, `Currency`, `InvoiceStatus`, `ReportCardStatus`, etc.) — compile-time safety + clean migrations.
4. **Soft-delete via `deletedAt DateTime?`** (+ `@@index`) with a Prisma extension that auto-filters `deletedAt: null` for all queries; no more scattered `isActive` checks.
5. **Auditing is first-class**: `AuditLog` gains `schoolId`, immutable timestamp, actor, `entity`, `entityId`, and `before/after` as `Json`. Writes go through an **outbox** so an audit can never be silently dropped.
6. **Explicit relational intent**: `onDelete: Restrict` by default; `Cascade` only for truly-owned children (invoice→items, order→lines). No cascade through shared entities (e.g. never cascade `Grade`→`GradeSubject`→`Subject`).
7. **Defense-in-depth tenancy**: repository injects `schoolId`; **Postgres RLS** keyed on a `current_setting('app.current_school_id')` session variable set per request; and a test suite asserts cross-tenant access is impossible.
8. **UTC everywhere** (`@db.Timestamptz`), formatted at the edge in the school's timezone (a setting).

### 2.2 Bounded contexts (group the ~78 models into ~10 domains)

| Context | Models (representative) | Folder |
|---------|-------------------------|--------|
| Identity & Access | `User`, `Role`, `Session`, `PasswordResetToken`, `AuditLog`, `SchoolSetting` | `src/server/services/identity/` |
| School & Calendar | `School`, `AcademicYear`, `Term`, `Holiday`, `Department`, `House` | `src/server/services/school/` |
| People | `Student`, `Guardian`, `StudentGuardian`, `Staff`, `Enrollment` | `src/server/services/people/` |
| Academics | `Grade`, `Class`, `Subject`, `GradeSubject`, `TimetableEntry` | `src/server/services/academics/` |
| Assessment | `Assessment`, `AssessmentMark`, `ReportCard`, `GradingScale` | `src/server/services/assessment/` |
| Finance | `FeeStructure`, `Invoice`, `InvoiceItem`, `Payment`, `PaymentAllocation`, `BankAccount`, `Scholarship`, `BeamApplication` | `src/server/services/finance/` |
| Operations | Boarding, Transport, Library, Inventory/Assets, Procurement, Canteen/Shop (POS) | `src/server/services/operations/` |
| Welfare & Conduct | Health, Discipline, Welfare, SDC | `src/server/services/welfare/` |
| Communications | `Message`, `NotificationEvent`, `Template`, `Channel` | `src/server/services/communications/` |
| Website/CMS | `Page`, `NewsArticle`, `Event`, `GalleryImage`, `Faq`, `SiteTheme`, `SEOSetting` | `src/server/services/cms/` |

Each context has its own service(s), Zod schemas, repository layer, and tests.

### 2.3 Identity model fix (high-severity today)

The current `User` has nullable `staffId`/`studentId`/`parentId` with no real link for parents. Replace with a clean polymorphic principal:

```prisma
enum PersonType {
  STAFF
  STUDENT
  GUARDIAN
}

model User {
  id         String     @id @default(cuid())
  schoolId   String
  email      String
  role       Role
  personType PersonType
  personId   String
  ...
  @@unique([schoolId, email])
  @@unique([schoolId, personType, personId])
  @@index([schoolId, personType])
}
```

Add a DB `CHECK` ensuring the referenced person exists in the corresponding table and the role matches `personType` (e.g. `TEACHER`/`ADMIN`→`STAFF`, `STUDENT`→`STUDENT`, `PARENT`→`GUARDIAN`).

**Why this is better than three nullable FKs:**
- One `@@unique` instead of three `@unique` columns.
- One `personId` column, one `personType` column.
- Easy to add new person types later (e.g. `ALUMNUS`).
- Simpler repository joins: `personType` + `personId` always points to the right entity.

**Guardians get a first-class `User` link** — today they cannot truly self-serve.

### 2.4 Finance modelling (correctness-critical)

- `Decimal` everywhere; `Currency` enum.
- **Payments allocate to invoices** via `PaymentAllocation` (a payment can cover several invoices, e.g. BEAM), so balances are derived, never hand-mutated.
- The current "mutate `balance` in the route" pattern caused the multi-currency settlement bug.
- Exchange rate captured per payment; statement/ledger computed by a pure service from immutable invoice + allocation rows.
- No `Invoice.balance` column; always compute as `SUM(amount) - SUM(payment allocations)` for a given currency. This is slower but always correct.

### 2.5 RLS and Prisma connection pooling (critical fix)

RLS relies on `current_setting('app.current_school_id')`. The original blueprint did not address how this interacts with **PgBouncer/Supabase connection pooling**.

**Problem:** PgBouncer in transaction mode reuses connections across requests. A session-level `SET` is not guaranteed to persist or be isolated.

**Solutions (choose one):**

1. **Use `SET LOCAL` inside every transaction** (recommended for Prisma + pooled connections).
   ```prisma
   await prisma.$transaction(async (tx) => {
     await tx.$executeRaw`SET LOCAL app.current_school_id = ${schoolId}`;
     // ... all queries in this tx run under RLS
   });
   ```
2. **Use separate direct connections for RLS-enforced operations** (Supabase allows 5432 direct, 6543 pooled). Migrations use direct; runtime use pooled with `SET LOCAL`.
3. **Add a `tenantId` column to every query explicitly** (no RLS). Faster but less defense-in-depth. Combine with RLS to keep the backstop.

**Recommendation:** Keep the repository layer injecting `schoolId` in every query (app-layer guard) and use `SET LOCAL` RLS as a backstop. Do not rely on session-level `SET` alone in a pooled environment.

---

## 3. Backend / API

### 3.1 Conventions

- Route handlers stay thin: `auth → tenant → Zod-validate → service → typed response`.
- One response envelope: success `{ data }`; error `{ error: { code, message, details? } }` with consistent HTTP codes. A shared `ok()` / `fail()` helper.
- **Server Actions** for form mutations co-located with their UI (admissions apply, settings save, mark entry). **Route handlers** for cross-client/public APIs (sitemap, webhooks, public forms).
- Transactions in the service (`prisma.$transaction`) for any multi-write operation; reads are tenant-scoped repository calls.
- **Idempotency** for money/communication operations via an `idempotencyKey` (generalize the BEAM `coverageAppliedAt` flag).

### 3.2 Auth, RBAC & tenancy (by construction)

- `withAuth(roles)` wrapper resolves the session, sets RLS `SET LOCAL` per transaction, and injects a typed `ctx = { user, schoolId, can() }`.
- **Policy-based RBAC**: a central `policies.ts` maps `(role, action, resource)` → allow/deny, replacing scattered `validateRole([...])` lists.
- Field/row visibility (e.g. a parent only sees their own child, a teacher only their classes) is enforced in the repository via mandatory `schoolId` + relationship filters.
- **Tenancy is enforced in three places**:
  1. Repository always injects `schoolId`.
  2. RLS backstops at the DB with `SET LOCAL` per transaction.
  3. A test suite asserts cross-tenant access is impossible for every resource.

### 3.3 Side-effects & jobs

Notifications, SMS/email, report generation, and statements run through an **outbox table + worker** (or Upstash QStash), not fire-and-forget in the request.

**Why QStash is the pragmatic start:**
- Managed queue, retries, and dead-letter handling.
- One less service to operate.
- Later migrate to a DB outbox if you need stricter ordering or lower cost.

If building an in-house outbox:
- `Outbox` table: `id`, `schoolId`, `type`, `payload`, `status`, `attempts`, `createdAt`, `processedAt`.
- Worker polls every 5s, processes in order per `schoolId`.
- Add `processedAt` and `error` logging; keep messages for 30 days.

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

Benefits: deep-linkable URLs, back/forward, per-route SSR + streaming, route-level code-splitting, granular access control via nested layouts, and smaller client bundles.

### 4.2 Data & state

- Server Components fetch initial data (via the service layer) and stream it.
- **TanStack Query** owns all client-side reads/mutations: caching, optimistic updates, refetch, and a single typed `api` client over the response envelope.
- **Zustand only for genuine UI state** (sidebar open, theme), not for routing or server data.
- **Error boundaries** at the shell and per route segment so one module cannot blank the app.

### 4.3 Module decomposition standard

Per feature: `page.tsx` (server, data + metadata) → `feature-table.tsx`/`feature-form.tsx` (client, presentational) → `use-feature.ts` (TanStack Query hooks) → server actions/service.

**File size guidance:** Aim for files under 400 lines. If a file exceeds this, it is a signal that the module is doing too much. Refactor into smaller components or a new context. This is a guideline, not a CI gate.

---

## 5. UI/UX & design system

- **Tokens:** codify the emerald brand as CSS variables + Tailwind theme (color scales, spacing, radius, shadow, typography) in one place; light/dark; document them. Zimbabwe flag accent kept as a deliberate motif.
- **Component library:** shadcn/ui as the base; a thin `@/components/ui` layer with consistent variants. One `<DataTable>`, one `<FormField>`, one `<PageHeader>`, one set of empty/loading/error states — reused everywhere.
- **Information architecture:** role-aware navigation grouped by domain (People, Academics, Finance, Operations, Welfare, Communications, Website, Admin); breadcrumbs from the route tree; global command-palette search.
- **Accessibility (WCAG 2.1 AA):** semantic landmarks, labelled controls, focus management, keyboard nav, color-contrast-checked tokens, `aria-live` for async results. Make it a CI lint (`eslint-plugin-jsx-a11y`) + Playwright axe checks.
- **Responsive:** mobile-first; generalize the existing mobile bottom-nav; tables → cards on small screens.
- **Premium polish:** consistent motion (Framer) with `prefers-reduced-motion`, skeleton loaders, and real imagery via the CMS.
- **Forms:** React Hook Form + Zod resolver (shared schema with the server), inline validation, optimistic save, toasts.

---

## 6. Feature/module map

Build to `full school management plan.md`, grouped by the bounded contexts in §2.2. For each module the standard slice is: **enum-backed model → service (+ Zod + tests) → tenant-scoped API/Server Action → server-rendered route + TanStack-Query client + shared UI components → role policy → notification events**.

### 6.1 Sequencing by risk, not value alone

The original blueprint prioritized high-value, high-risk modules (Finance, Examinations) first. **This is risky.** A better approach is to prove the standard slice on a low-risk context first, then apply it to the highest-value contexts.

| Phase | Context | Why first |
|-------|---------|-----------|
| 0 | **Settings / School & Calendar** | Low-risk, no live transactions, already partly built, perfect reference implementation. |
| 1 | **Communications (Templates, Channels)** | Event-driven, but low data integrity risk. Tests outbox + notification worker. |
| 2 | **People (Students/Guardians/Staff)** | High-value, moderate risk. Proves per-school unique keys, soft delete, audit. |
| 3 | **Academics (Grades, Classes, Subjects)** | Depends on People. Tests relationship-heavy domains. |
| 4 | **Finance** | High-value, high-risk. Apply once standard slice is proven. |
| 5 | **Assessment / Report Cards** | High-value, high-risk. Uses Finance and Academics. |
| 6 | **Operations / Welfare / CMS / Portals** | Feature depth on top of stable base. |
| 7 | **Reports / EMIS / Analytics** | Read-heavy, built on migrated data. |

### 6.2 Reference implementations

Several foundations already exist (settings registry, finance multi-currency, grading, notification dispatch, report-card workflow). These become the **reference implementations** of the standard slice and must be refactored to standard first.

---

## 7. Non-functional requirements

- **Testing:** Vitest unit tests for every service + pure lib; **cross-tenant isolation tests** as a standing suite; Playwright E2E on critical journeys (login, enrol→attendance, fee→payment→statement, marks→report card→publish, parent views child); `tsc --noEmit` + eslint as hard CI gates.
- **Security:** no secrets in the repo (rotate the committed `.env.example` DB password immediately; use a secrets manager); PII-at-rest encryption for national ID/medical; 2FA for admin roles; "log out all devices"; CSRF on mutations; distributed rate-limit (Upstash) replacing the in-memory middleware; security headers kept.
- **Performance:** composite indexes per access path; no N+1 (batch loaders — the notification batch loader is the pattern); HTTP caching/ISR for public pages; `Decimal` math; pooled DB (PgBouncer 6543) at runtime with `SET LOCAL` RLS, direct (5432) for migrations.
- **Observability:** Pino structured logs with request IDs; Sentry for errors + traces; a `/api/health/deep` check; audit completeness via the outbox.
- **i18n & money:** currency formatting via a single util (USD/ZWG); English now, structure for Shona/Ndebele; school-timezone date formatting.
- **Offline/PWA:** keep the service worker; define an explicit offline strategy for register/attendance entry.
- **Build/deploy:** Next standalone output in Docker; `docker-compose` (app + Postgres) for local; GitHub Actions running typecheck/lint/test/build on every PR; DB migrations via `prisma migrate` (introduce a migration history — today it's `db push`).

---

## 8. Migration path (strangler, not big-bang)

You do not rebuild blind — you converge the running app onto this blueprint incrementally.

### 8.1 Phase 1 — Foundations (4–6 weeks)

1. **Immediate fixes:**
   - Rotate & remove the committed Supabase password in `.env.example`.
   - Run an audit for any other committed secrets.
2. **Schema hardening:**
   - Introduce enums for `Role`, `EnrollmentStatus`, `StaffType`, `PaymentMethod`, `Currency`, `InvoiceStatus`, `ReportCardStatus`.
   - Change `Float` money columns to `Decimal @db.Decimal(15,2)`.
   - Add `deletedAt DateTime?` to tenant-owned tables and replace `isActive` filtering.
   - Change `studentNumber`/`staffNumber` from global `@unique` to `@@unique([schoolId, number])`.
   - Add `schoolId` to `AuditLog`.
   - Add `personId`/`personType` to `User` and migrate `staffId`/`studentId`/`parentId`.
3. **Repository layer:** create `src/server/db/` with tenant-scoped helpers.
4. **Service layer:** create `src/server/services/` and start with **Settings** as the reference context.
5. **RLS backstop:** enable RLS on tenant-owned tables and use `SET LOCAL` per transaction.

### 8.2 Phase 2 — Tenancy hardening (2–3 weeks)

- Land the automated cross-tenant test suite.
- Fix any resource it flags (the adversarial-review pattern, now automated).
- Run the test suite against the old route handlers and the new service layer.

### 8.3 Phase 3 — Routing modernization (per module, 2–4 weeks each)

- Move the dashboard from the Zustand-swap SPA to real `(app)/<module>` routes one module at a time.
- Both old and new modules can coexist during transition.
- Migrate a module to the standard slice: model → service → API → route → components → policy.

### 8.4 Phase 4 — Data layer migration

- Adopt TanStack Query + typed `api` client per module as it is migrated.
- Keep old `fetch` calls contained in legacy modules until they are replaced.

### 8.5 Phase 5 — Design system

- Extract tokens + shared components.
- Migrate modules to them during their routing move.

### 8.6 Phase 6 — Ops

- Add Pino/Sentry, Upstash rate-limit, the job outbox, Docker, and CI.
- Add `/api/health/deep` and structured logging.

### 8.7 Phase 7 — Feature depth

- Continue the product backlog on top of the new standard slice.

**Each step ships independently, stays green (`tsc`+tests+build), and is adversarially reviewed for tenant safety before merge.**

---

## 9. Definition of "standard" (acceptance bar for any module)

A module is "done to standard" when it has:
- [ ] Enum-backed schema with `schoolId` + composite uniques + `Decimal` money.
- [ ] A service with Zod schemas and unit tests.
- [ ] Tenant-scoped repository access with a passing cross-tenant test.
- [ ] A typed API or Server Action using the response envelope.
- [ ] A server-rendered route + TanStack-Query client.
- [ ] Shared design-system UI with full loading/empty/error/a11y states.
- [ ] A role policy entry in `policies.ts`.
- [ ] Notification events via the outbox (where relevant).
- [ ] No business logic in route handlers or UI components.
- [ ] No ad-hoc `fetch` or `console.*` logging.

---

## 10. Open questions

1. What is the current Supabase plan and pooling mode? This determines whether `SET LOCAL` RLS or direct connections are needed.
2. Is the current codebase available for me to scan to identify the exact files that violate the service-layer rule?
3. What is the target go-live date? The strangler path can stretch or compress based on this.
4. Should we enforce 2FA for all admin roles immediately, or roll it out?
5. Are there existing Playwright tests, or is the E2E suite starting from scratch?

---

## Appendix — most urgent corrections (do first, regardless of pace)

1. **Rotate & remove the committed Supabase password in `.env.example` immediately.**
2. Make `studentNumber`/`staffNumber` per-school unique; switch money to `Decimal`.
3. Land the automated **cross-tenant isolation test suite**.
4. Move grading/finance/report-card logic fully into services.
5. Add Postgres RLS as the tenancy backstop, using `SET LOCAL` per transaction.
6. Adopt `personId`/`personType` for the `User` model.
