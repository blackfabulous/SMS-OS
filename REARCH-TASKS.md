# ZimSchool Pro — Re-Architecture Task Plan

> Gap analysis + actionable backlog to converge the running app onto `REARCHITECTURE-BLUEPRINT.md`.
> Strangler approach (blueprint §8): each task ships independently and stays green (`tsc` + tests + build).
> Verified against the codebase 2026-06.
>
> **Legend** — Priority: P0 (urgent/security) · P1 (foundational) · P2 (standard) · P3 (later).
> Effort: S (<½ day) · M (~1 day) · L (2–4 days) · XL (week+). Status: ☐ todo · ◐ partial · ☑ done.

---

## 0. Snapshot — what we have vs the blueprint

| Blueprint pillar | Current state (verified) | Gap |
|---|---|---|
| Money as `Decimal` | **0** `Decimal` fields — all `Float` | Full |
| Closed sets as `enum` | **0** Prisma enums — all `String` | Full |
| Soft-delete `deletedAt` | **0** — uses `isActive` booleans | Full |
| Per-school unique keys | `studentNumber`/`staffNumber` **globally** `@unique` | High-risk gap |
| DB migrations | **None** — `prisma db push` only (no history) | Full |
| Tenancy backstop (RLS) | None — app-layer only (reviews found leaks) | Full |
| Service layer (`src/server`) | **None** — logic in route handlers + a few `src/lib/*` | Large; partial libs exist |
| Real dashboard routes | Single client `page.tsx` + Zustand `activeModule` swap | Full |
| TanStack Query | Installed (`^5.82`) but used in **0** files; 33 modules use ad-hoc `fetch` | Full |
| Design system | Emerald tokens exist; applied inconsistently | Medium |
| Tests | 8 vitest files (~76 unit tests); no E2E, no cross-tenant suite | Partial |
| Observability | `console.*` only — no Pino/Sentry | Full |
| Ops | No Docker, no CI, no Upstash rate-limit (in-memory) | Full |
| Public site | **Real SSR routes + redesign** (recent work) | ☑ Done |

### ✅ Already in place (reference implementations of the "standard slice")
- Settings registry + store + API (`src/lib/settings*.ts`, `/api/settings`) — pattern for config.
- Finance multi-currency math + late fees (`src/lib/finance-calc.ts`) — pure + tested.
- ZIMSEC grading + CA weighting (`src/lib/grading.ts`) — pure + tested.
- Notification event library + multi-channel dispatch (`src/lib/notification*.ts`) — fire-and-forget (needs outbox).
- Report-card publish/countersign workflow (`src/lib/report-card-workflow.ts`) — pure + tested.
- Statement + BEAM allocation (`src/lib/statement.ts`, `beam.ts`) — pure + tested (F8 WIP).
- Public `(public)` route group with SSR + metadata + sitemap/robots/JSON-LD.
- Supabase Postgres migration; composite indexes; password-reset flow; 76 unit tests.

---

## 1. P0 — Urgent corrections (do first, any pace)

| ID | Task | Effort | Acceptance |
|----|------|--------|-----------|
| RA-01 | **Rotate & scrub the committed Supabase password** in `.env.example`; move real secrets to env/secret store; scan git history for exposure | S | No live credential in the repo; placeholder only |
| RA-02 | **Cross-tenant isolation test suite** — for every resource, assert a user from school A cannot read/write school B data (codifies the bugs the adversarial reviews kept finding) | L | A `tests/tenant/*.test.ts` suite; CI-blocking |
| RA-03 | **Move remaining business logic out of route handlers** into services (start finance, examinations, attendance — partly done) | M (per area) | Route handlers are thin: auth→validate→service |
| RA-04 | Free host disk & add a guard — build cache (`.next`) + logs were filling C: (hit 100%) | S | Documented cleanup; `.gitignore` covers logs/caches |

---

## 2. WS-A — Database & domain model (blueprint §2)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-A1 | **Introduce Prisma migration history** (`prisma migrate`); stop relying on `db push` | P1 | M | — | `prisma/migrations/` exists; `migrate deploy` in CI |
| RA-A2 | **Money → `Decimal @db.Decimal(15,2)`** across all monetary fields (FeeStructure, Invoice, Payment, Payslip, Scholarship, Asset, Shop…) + a `Money` util | P1 | L | RA-A1 | No `Float` money; finance tests pass with Decimal |
| RA-A3 | **Define Prisma enums** (Role, Currency, EnrollmentStatus, StaffType, PaymentMethod, InvoiceStatus, ReportCardStatus, AssessmentType…) and migrate string columns | P1 | L | RA-A1 | Closed sets are enums; invalid states impossible |
| RA-A4 | **Per-school unique keys** — `@@unique([schoolId, studentNumber])`, `@@unique([schoolId, staffNumber])`, audit other natural keys | P0 | M | RA-A1 | Two schools can hold the same number |
| RA-A5 | **Soft-delete via `deletedAt`** + Prisma extension that auto-filters; migrate off `isActive` | P2 | L | RA-A1 | Deletes are recoverable + timestamped |
| RA-A6 | **`AuditLog` gains `schoolId`** + immutable timestamp + typed `Json` before/after; index | P1 | S | RA-A1 | Audits are tenant-scoped + queryable |
| RA-A7 | **Tighten `onDelete`** — default `Restrict`; `Cascade` only for owned children; remove cascades through shared entities | P2 | M | RA-A1 | No unintended cascade chains |
| RA-A8 | **Identity model fix** — formalize `User`↔Staff/Student/Guardian links (+ DB CHECK by role); give Guardians a real `User` link | P1 | M | RA-A1 | Every user has a valid backing entity |
| RA-A9 | **Finance: `PaymentAllocation`** so payments allocate to invoices (balances derived, not hand-mutated) | P1 | L | RA-A2 | Balance is computed; multi-invoice/BEAM payments correct |
| RA-A10 | **Timestamps → `Timestamptz` (UTC)**; format at edge per school timezone setting | P3 | M | RA-A1 | No naive datetimes |

---

## 3. WS-B — Tenancy, auth & security (blueprint §3.2, §7)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-B1 | **`withAuth(roles)` wrapper** → typed `ctx = { user, schoolId, can() }`; replace scattered `validateRole([...])` | P1 | M | — | All routes use one auth wrapper |
| RA-B2 | **Policy-based RBAC** (`policies.ts`: role×action×resource) | P1 | M | RA-B1 | Central, testable permission matrix |
| RA-B3 | **Postgres RLS** keyed on `app.current_school_id` set per request — DB backstop for tenancy | P1 | L | RA-A1 | Cross-tenant query blocked at DB even if app check missing |
| RA-B4 | **Repository layer always injects `schoolId`** (no raw `db.*` in routes) | P1 | L | RA-C1 | RA-02 suite passes for all resources |
| RA-B5 | 2FA for admin roles; "log out all devices"; PII-at-rest encryption (national ID/medical) | P2 | L | — | Admin 2FA; sensitive fields encrypted |
| RA-B6 | **Distributed rate-limit (Upstash)** replacing in-memory middleware | P2 | M | — | Limits survive multi-instance |

---

## 4. WS-C — Service & repository layer (blueprint §1, §3)

| ID | Task | Pri | Effort | Deps | Acceptance |
|----|------|-----|--------|------|-----------|
| RA-C1 | **Create `src/server/{services,db}/` structure** + a tenant-scoped Prisma repository helper | P1 | M | — | Layering enforced by lint (no `@/lib/db` in routes) |
| RA-C2 | Migrate domain logic into services context-by-context (finance, examinations, attendance, students, settings already partial) | P1 | XL | RA-C1 | Each service unit-tested; routes thin |
| RA-C3 | **Response envelope** `{data}` / `{error:{code,message,details}}` + `ok()`/`fail()` helpers | P2 | S | — | All endpoints consistent |
| RA-C4 | **Outbox table + worker** (or QStash) for notifications/SMS/email/reports — replace fire-and-forget | P1 | L | RA-A1 | Guaranteed, retried, observable delivery |
| RA-C5 | **Idempotency keys** for money/comms operations (generalize BEAM `coverageAppliedAt`) | P2 | M | RA-C2 | Safe retries; no double-charge/send |
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
| RA-E2 | **Replace ad-hoc `fetch` (33 modules)** with TanStack Query hooks (`use-<feature>.ts`) — per module as it migrates | P2 | XL | RA-E1, RA-D2 | Caching/optimistic updates; 0 raw `fetch('/api')` in modules |

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
| RA-G3 | **GitHub Actions CI** — typecheck/lint/test/build on every PR (incl. RA-02) | P1 | M | — | PRs gated green |
| RA-G4 | **Docker + docker-compose** (app + Postgres); standalone output | P2 | M | — | One-command local + deployable image |
| RA-G5 | **Playwright E2E** on critical journeys (login, enrol→attendance, fee→payment→statement, marks→report-card→publish, parent views child) | P2 | L | RA-D2 | E2E green in CI |
| RA-G6 | `/api/health/deep`; backups/PITR (Supabase) verified | P3 | S | — | Health + DR documented |
| RA-G7 | i18n + currency util scaffold (EN now; Shona/Ndebele-ready); school-timezone formatting | P3 | M | RA-A10 | Single currency/date util |
| RA-G8 | Offline/PWA strategy for register + attendance entry | P3 | M | RA-D2 | Defined offline behavior |

---

## 9. WS-H — Feature depth (blueprint §6, product backlog)

Continue closing `full school management plan.md` on the **standard slice** (§9 of the blueprint). Order (highest-value Zimbabwe-specific first; several already have foundations):
RA-H1 Settings depth · RA-H2 Finance (PayNow/EcoCash live, statements ☑WIP, BEAM ☑WIP) · RA-H3 Examinations (☑ workflow) · RA-H4 Attendance+Comms triggers (◐ done, needs outbox) · RA-H5 Students/Admissions/Staff depth · RA-H6 Operations (boarding/transport/library/inventory/POS) · RA-H7 Welfare/Discipline/Health/SDC · RA-H8 CMS depth · RA-H9 Portals (parent/student/teacher) · RA-H10 Reports/EMIS/analytics.

---

## 10. Sequenced execution (strangler phases)

1. **Phase 0 — Safety (P0):** RA-01, RA-02, RA-04, finish RA-03. *(security + a tenancy safety net before refactoring)*
2. **Phase 1 — DB foundations:** RA-A1 → RA-A2, RA-A3, RA-A4, RA-A6, RA-A8 → RA-A9. *(migrations, Decimal, enums, keys, identity, allocations)*
3. **Phase 2 — Backend standard:** RA-C1, RA-B1, RA-B2, RA-B4 → RA-C3, RA-C2 (per context), RA-C4 (outbox), RA-B3 (RLS).
4. **Phase 3 — Frontend standard:** RA-D1 → RA-D2 (module-by-module) with RA-E1/RA-E2 and RA-F1/RA-F2 applied during each module's move; RA-D4.
5. **Phase 4 — Ops:** RA-G1, RA-G3 early; RA-G2, RA-G4, RA-G5 as the surface stabilizes.
6. **Phase 5 — Depth & polish:** WS-H feature depth + remaining P3 (RA-A5/A10, RA-B5/B6, RA-F3–F6, RA-G6–G8).

Each module migrated in Phase 3 should exit meeting the blueprint's **§9 "definition of standard"** and pass the RA-02 cross-tenant suite before merge.

---

## 11. Open decisions (need a call before starting)
1. **Outbox vs hosted queue** (DB outbox+worker vs Upstash QStash)? — affects RA-C4.
2. **RLS now or after the repository layer** lands? — recommend repository first (RA-B4), RLS as backstop (RA-B3).
3. **Migration tolerance**: `db push` → `migrate` will reset the dev DB once (data is seed-only) — confirm OK.
4. **Scope of first vertical**: recommend **Finance** as the first fully-migrated context (most logic already extracted) to prove the end-to-end standard slice.
