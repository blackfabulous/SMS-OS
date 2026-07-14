# ZimSchool Pro Re-Architecture — Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R1 | **Migration fatigue / scope creep** — team abandons the standard slice under pressure to ship features. | High | High | Gate every PR against the standard checklist; pick one low-risk context first; keep a visible migration board. | Tech Lead |
| R2 | **Data loss during schema migration** — changing `Float` to `Decimal`, `isActive` to `deletedAt`, or global unique to per-school unique corrupts live data. | Medium | Critical | Write reversible migrations; run on a full copy of prod; test rollbacks; backup before each deploy. | Backend Lead / DBA |
| R3 | **Cross-tenant regression** — moving logic to services introduces new tenant-leak bugs. | Medium | Critical | Mandatory cross-tenant test suite before any merge; adversarial review per phase; RLS backstop. | Security Lead |
| R4 | **RLS silently fails with PgBouncer** — `SET` is lost across transaction-pooled connections, causing apparent isolation but no real backstop. | Medium | High | Use `SET LOCAL` inside every transaction; test RLS in staging with the same pooling config as prod. | Backend Lead |
| R5 | **Finance rounding/regression** — switching to `Decimal` and derived balances changes displayed amounts. | Medium | High | Write property-based tests comparing old vs new balance calculations; reconcile with existing balances before go-live. | Finance Domain Owner |
| R6 | **Performance regression** — derived balances and RLS add query overhead; N+1 in new Server Components. | Medium | Medium | Add composite indexes; batch loaders; `EXPLAIN ANALYZE` on critical paths; set SLOs. | Platform Engineer |
| R7 | **User/parent portal outage** — `User` identity model migration breaks logins. | Medium | Critical | Backfill `personId`/`personType` with a reversible script; smoke-test all roles in staging; keep old columns until verified. | Identity Team |
| R8 | **Frontend rewrite stalls** — 41 modules is too many to migrate; old and new dashboards diverge. | High | High | Migrate one module at a time; both coexist; use feature flags; measure bundle size per module. | Frontend Lead |
| R9 | **Outbox/QStash operational burden** — messages lost, poison queues, ordering issues. | Medium | Medium | Start with QStash; monitor dead-letter queues; add idempotency keys; keep durable outbox table. | Platform Engineer |
| R10 | **Secrets still in repo** — `.env.example` or other files contain real credentials. | Medium | Critical | Rotate immediately; run `git-secrets` / `truffleHog` in CI; move to secrets manager. | Security Lead |
| R11 | **Team lacks App Router / TanStack Query / Prisma migration experience** | Medium | High | Pairing, reference modules, documented patterns, training time in the 90-day plan. | Engineering Manager |
| R12 | **ZIMSEC/custom grading rules break during refactor** — duplicated grading ladders consolidated incorrectly. | Medium | High | Capture grading rules as data-driven tests before refactor; compare old and new outputs. | Academics Domain Owner |
| R13 | **Mobile/offline features regress** — existing service worker and attendance register offline behavior not preserved. | Medium | Medium | Define offline strategy explicitly; test on real devices; keep PWA scope. | Frontend Lead |
| R14 | **Third-party payment providers (EcoCash/OneMoney/InnBucks/ZimSwitch/PayNow) integration drift** — webhook schemas change. | Low | High | Isolate provider logic in adapters; version webhook payloads; maintain test stubs. | Finance Domain Owner |

## Migration sequencing rules

1. **Foundation before feature.** Do not build new features on the old architecture.
2. **Read-only before write.** Migrate read paths first, then writes, then deletes/soft-deletes.
3. **Green before merge.** Every migrated module must pass `tsc`, lint, unit tests, and cross-tenant tests.
4. **One context at a time.** Finish a bounded context before starting the next. Parallel work is allowed only within separate contexts.
5. **Data migration before code migration.** Backfill columns, run migrations, then deploy code that reads from new columns.
6. **Keep old fields until verified.** Use additive migrations; drop old columns only after at least one release of no reads from them.
7. **Adversarial review before tenant-sensitive merges.** Any PR touching auth, tenancy, or finance requires a second security-focused review.
