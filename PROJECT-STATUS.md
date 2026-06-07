# ZimSchool Pro — Project Status

> Authoritative "what's done / what's left" record. Updated: 2026-05-30.
> Branch: `feat/phase-a-supabase-postgres`. Backlog of record: `full school management plan.md`.
> Execution plan: `MASTER-PLAN.md`. Per-batch detail: `WORK-DONE-2026-05-30.md`, `agent-ctx/MP-*.md`.

Dev login (seeded): `admin@zimschool.co.zw` / `password123`.

---

## ✅ Done & committed (this programme)

| Phase / Batch | Commit | Summary |
|---|---|---|
| **A — DB migration** | `90547ea` | SQLite → Supabase Postgres; composite indexes; TimetableEntry relations; Postgres-safe seed (`src/lib/seed-data.ts` + `prisma/seed.ts`) |
| **B — Public website** | `0f4c376` | Real SSR `(public)` route group + premium redesign (home/about/academics/admissions+apply/news+[slug]/events+[id]/gallery/contact); dashboard → `/dashboard`; `/login`; sitemap/robots/JSON-LD; deleted 2,678-line monolith |
| **B — fix** | `4c157de` | Public honeypot no longer 400s (silent accept) |
| **C — Auth UX** | `0b05697` | Password reset flow (token model + `/api/password/{forgot,reset}` + pages); demo creds dev-gated; redirects |
| **F1 — Settings store** | `91070f3` | `SchoolSetting` model; pure Zod registry (`settings-schema.ts`); server accessor (`settings.ts`); `GET/PUT /api/settings` |
| **F2 — Finance** | `c6c7d42` | Multi-currency settlement **bug fix**; `toBaseAmount`/`applyLateFee`; payment-method enforcement; `/api/finance/late-fees` |
| **F3 — Examinations** | `94e0c54` | `grading.ts` (ZIMSEC bands + CA weighting); wired both report-card routes to settings |
| **F4 — Notifications** | `f3511ae` | Event library + `dispatchNotification` (EMAIL/SMS/WhatsApp/in-app from settings); `sms.ts`; `/api/notifications/send` |
| **F5 — Settings UI** | `335eb82` | Registry-driven "Advanced" settings tab — auto-renders a control for every setting incl. grade-scale editor |
| **F6 — Notification triggers + hardening** | `51993d2` | Wired dispatch into admissions/payments/late-fees/attendance; multi-agent adversarial review → fixed 10 findings (3 tenant-security holes, N+1 batching, non-blocking dispatch) |
| **F7 — Examinations depth** | `6853c2e` | Mark validation + ZIMSEC grading on entry; report-card generation (class aggregation + ranking) + DRAFT→SUBMITTED→COUNTERSIGNED→PUBLISHED workflow (state machine + RBAC) |
| **build — self-host fonts** | `a959d6c` | Geist via `geist` pkg (no build-time Google Fonts fetch); declared vitest/test scripts |

**Quality gates:** `tsc --noEmit` clean; **61 unit tests passing** (`bunx vitest run`) across settings, finance, grading, notifications; **full `next build` green** (exit 0, 69 pages, all new API routes registered); Phase B verified via runtime probes; Phase C & F2/F5 verified via DB round-trips against Supabase.

**Architecture convention (every batch):** pure logic + Zod + thin server DB layer + RBAC'd API + unit tests + non-breaking integration. New config flows through the one settings registry.

---

## 🟡 Known follow-ups on delivered work
- **Notifications auto-trigger from attendance/fees/admissions/payments** ✅ done (F6). A real delivery queue (vs fire-and-forget) is still future work for serverless deployments.
- **Currency code mismatch**: `currency.ts` uses `ZiG`; settings/ISO use `ZWG`. Bridge/unify.
- **Settings UI** covers the registry (~14 keys). The legacy settings tabs (profile/academic/fees) still save via `/api/school`; migrate more of the spec's settings tree into the registry over time.
- **Branch not pushed**; no PR opened. ~690 pre-existing uncommitted files in the tree (a tenant-scoping/audit refactor + bulk `skills/`) are NOT ours — never `git add -A`.
- **No E2E tests** yet (Playwright) and **no React component tests** (no testing-library installed).

---

## ⏳ Left to do — spec backlog (`full school management plan.md`, ~50 areas)

Status legend: **Shell** = pre-existing module/route exists but thin vs spec · **TODO** = not started · **Partial** = some done this programme.

### Core academic & people
- Student Management — **Shell** (CRUD exists; spec wants documents, medical, transfers, bulk, ID cards)
- ECD / Pre-School module — **TODO**
- Admissions — **Partial** (public apply done F-B; dashboard pipeline/offer-letters/assessment workflow TODO)
- Staff Management — **Shell** (CRUD exists; contracts, appraisals, qualifications, leave depth TODO)
- Academic/Curriculum — **Shell**
- Timetable — **Shell** (conflict detection exists; auto-generation, room/teacher load TODO)
- Attendance — **Shell** (records exist; settings `lockAfterDays` not yet enforced; biometric/SMS-on-absent TODO)
- Examinations & Assessment — **Partial** (grading/CA F3; mark validation + report-card generation + publish/countersign workflow F7; remaining: mark-entry UI, ZIMSEC candidate registration, report-card UI for the new workflow)

### Finance
- Fees & Finance — **Partial** (multi-currency/methods/late-fees done F2; invoicing depth, statements, BEAM workflow, EcoCash/PayNow live integration, reconciliations TODO)
- Payroll — **Shell** (calc + payslips exist; statutory filing, bank files TODO)

### Operations & welfare
- Library — **Shell** · Boarding/Hostel — **Shell** · Transport — **Shell** · Health/Medical — **Shell**
- Sports & Extra-curricular — **Shell** · Assets & Inventory — **Shell** · Infrastructure/Facilities — **TODO**
- Discipline — **Shell** · Welfare — **Shell** · SDC — **Shell** · Procurement — **Shell**

### Communication & portals
- Communication & Messaging — **Partial** (SMS/email senders + dispatch done; campaign UX, templates, scheduling TODO)
- Parent/Student/Teacher Portals — **Shell**
- Notifications centre — **Partial** (dispatch backend done; in-app feed wiring TODO)

### Reporting & admin
- Reports & Analytics — **Shell** (report cards + some exports exist; EMIS depth, dashboards TODO)
- Security & Access Control — **Partial** (RBAC + middleware guard + rate-limit + audit exist; 2FA, session mgmt, advanced settings tree TODO)
- Events & Calendar — **Shell** · Headmaster tools — **TODO** · PTA — **TODO**
- System/Technical (PWA, offline, backups) — **Partial** (PWA/SW present; Pino logging, Sentry, Redis rate-limit, Docker/CI TODO — see MASTER-PLAN Phase G)

### Website CMS (spec lines 558–968)
- Public site — **Done** (F-B). CMS *editing* (page/menu/news/gallery/downloads/forms/newsletter/vacancies/SEO admin) — **Shell/TODO**

### Premium POS (spec lines 970–1326)
- Uniform Shop POS — **Shell** (school-shop module exists) · Tuckshop/Canteen POS — **Shell** (canteen module exists). Full POS (cart, receipts, stock, shifts) — **TODO**

### Advanced Settings tree (spec PART 1–6, lines 1328–2621)
- Global system, module-specific, security, integration, notification, backup settings — **Partial** (registry foundation + ~14 keys done F1/F5; the full ~200-key tree — **TODO**, add incrementally to the registry — UI auto-renders them)

---

## Recommended next batches (priority order)
1. **F6 — Wire notification triggers** into attendance (absent), fees (reminder/overdue), admissions (received) + payment receipts.
2. **F7 — Examinations depth**: mark-entry validation + report-card publish/countersign workflow.
3. **F8 — Finance depth**: statements, BEAM workflow, PayNow/EcoCash live integration.
4. **F9 — CMS editing** backend for the public site (pages/news/events/gallery).
5. **F10 — POS** (uniform + tuckshop): cart → receipt → stock decrement → shift reconciliation.
6. Expand the settings registry toward the spec's full tree (auto-surfaces in the Advanced UI).
7. **Phase E** — Playwright E2E on critical journeys; add testing-library for component tests.
8. **Phase G** — production hardening (Pino, Sentry, Redis rate-limit, Docker, CI).

Then breadth across remaining **Shell** modules to close each to its spec checklist.
