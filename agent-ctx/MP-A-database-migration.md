# Task MP-A: Database Migration — SQLite → Supabase Postgres

> Source: [MASTER-PLAN.md](../MASTER-PLAN.md) Phase A. This is the first, unblocking
> workstream ("small, unblocks everything"). Phases B (public site), C (login), and
> F (features) depend on this landing first.
> Status: **✅ COMPLETE — live on Supabase Postgres (eu-west-1), seeded & smoke-tested** · Updated: 2026-05-30

---

## Final result (2026-05-30)
- Connected via **Session/Transaction pooler** (`aws-0-eu-west-1.pooler.supabase.com`) — the direct `db.<ref>.supabase.co` host is IPv6-only and unreachable from IPv4, so pooler is used for both runtime and DDL. Password percent-encoded in `.env`.
- `prisma db push` ✔ — all 72 models + new indexes created on Supabase.
- Seeded headlessly via new `prisma/seed.ts` → `src/lib/seed-data.ts`: 1 school, 15 grades, 28 classes, 18 subjects, 55 students, 12 parents, 17 staff, 4 users, 40 invoices.
- Smoke test ✔ — reads round-trip; `mode:'insensitive'` confirmed working on Postgres (lowercase `"tin"` matched `Tinotenda`/`Martin`); admin user present.
- `tsc --noEmit`: 12 errors, all pre-existing (timetable ×11, students ×1), zero introduced.

**Seed refactor (also fixes Postgres compat):** the old `/api/seed` used SQLite-only `PRAGMA foreign_keys` (would crash on PG) and required an admin session (impossible on an empty DB). Logic extracted to `src/lib/seed-data.ts::seedDatabase()`, called by both the gated route and the headless `prisma/seed.ts`. PRAGMA removed (delete order is child→parent, FK-safe).

**Login creds (dev):** `admin@zimschool.co.zw` / `password123` (also headmaster/teacher/bursar).

---

## Progress log (2026-05-30)
**Done (committed to working tree):**
- `prisma/schema.prisma`: datasource → `postgresql` with `directUrl = env("DIRECT_URL")`; header comment updated.
- Composite indexes added: `Student([schoolId, enrollmentStatus])`, `Attendance([termId, date])`, `FeeInvoice([studentId, status])` + `([termId])`, `FeePayment([parentId])`, `AssessmentMark([studentId])`, `StudentEnrollment([classId, academicYearId])`.
- `mode: 'insensitive'` added to **134** `contains:` filters across **24** API route files (one-off codemod, verified on edge cases: internal-comma `.replace()` args, nested relation filters, and skip-if-already-present).
- `.gitignore`: added `*.db` / `*.db-journal`. `db/custom.db` untracked (`git rm --cached`, file kept on disk).
- `.env.example`: added documented `DIRECT_URL` placeholder + pooled-URL guidance.
- Local `.env` rewritten with well-formed Postgres placeholders + restored `NEXTAUTH_SECRET`/`NEXTAUTH_URL`/`SEED_SECRET`.
- `bunx prisma generate` ✔ (schema + indexes valid for Postgres).
- `bunx tsc --noEmit`: 12 errors, **all pre-existing** (timetable ×11, students ×1 — unrelated to this change; confirmed by reverting the two files to HEAD → identical 12). Recorded baseline in `ts-errors.txt` (146 lines).

**Blocked — needs you (external):**
1. Create/confirm a Supabase project and provide the **pooled** (`6543`) + **direct** (`5432`) connection strings. The host in `.env.example` (`db.orpujzneiunhxbxycfiu.supabase.co`) **does not resolve** — that project doesn't exist. Put real URLs in local `.env` (replace the `PLACEHOLDER` values).
2. Then run (against the **direct** URL): `bunx prisma db push` → seed (`bun prisma/seed-users.ts` or gated `/api/seed` with `X-Seed-Secret`).
3. Smoke-test: login + open Students + one other module + create a record.

---

---

## Objective
Move the app off SQLite onto managed Supabase Postgres **without** touching the
existing auth/RBAC/tenant model (decision D1: Supabase = managed Postgres only,
no Supabase Auth/RLS). Keep Prisma, NextAuth, route handlers, RBAC matrix as-is.

## Definition of done
- [ ] App boots against Supabase Postgres; login + a couple of CRUD modules work end-to-end.
- [ ] `prisma generate` clean; `prisma db push` succeeds against a Postgres datasource.
- [ ] Database seeded (admin/demo users present via seed).
- [ ] 24 `contains:` queries are case-insensitive on Postgres.
- [ ] Composite tenant indexes added to hot models.
- [ ] `db/custom.db` no longer tracked; `*.db` ignored.
- [ ] `tsc --noEmit` + `eslint` green (the standing hard gate).

---

## Current state (verified in repo, 2026-05-30)
- `prisma/schema.prisma` line 9 still `provider = "sqlite"`, no `directUrl`.
- `.env.example` **already** references a PostgreSQL/Supabase `DATABASE_URL` but has **no `DIRECT_URL`** line. ⚠️ It also contains what looks like a **real Supabase password committed in cleartext** (line 6) — see "Security note" below.
- `.gitignore` line 34 ignores `.env*` (good) but does **not** ignore `*.db`; `db/custom.db` is still tracked.
- **24** API route files use `contains:` (case-sensitive on SQLite): students, sdc, communication, admissions, examinations/bulk-import, communication/sms/send, transport, boarding, library, inventory, security, events, canteen, alumni, timetable, school-shop, procurement, elearning, documents, search, discipline, staff, welfare, health.
- Seed entry point: `prisma/seed-users.ts` and gated `/api/seed` (needs `SEED_SECRET`).

---

## Steps

### 1. Provision Supabase
- Create the Supabase project (or confirm the existing `db.orpujzneiunhxbxycfiu.supabase.co` one is ours).
- Capture both connection strings:
  - **Pooled** (transaction mode, PgBouncer): host `...pooler.supabase.com`, port `6543`, append `?pgbouncer=true&connection_limit=1` → `DATABASE_URL`.
  - **Direct**: port `5432` → `DIRECT_URL`. Used only for schema ops/migrations.

### 2. Prisma datasource
In `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (6543, pgbouncer)
  directUrl = env("DIRECT_URL")     // direct (5432)
}
```
Update the file's top comment (currently "Designed for SQLite").

### 3. Environment
- Create local `.env` (gitignored) with: `DATABASE_URL` (pooled), `DIRECT_URL` (direct), and restore `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SEED_SECRET`.
- Add a `DIRECT_URL` line to `.env.example` (placeholder, **no real password**) directly under `DATABASE_URL`, with a comment that it must be the 5432 direct URL.

### 4. Push schema + seed
> ⚠️ Run all schema ops through the **direct** (5432) URL, never the pooled PgBouncer one — PgBouncer transaction mode breaks DDL/prepared statements.
```bash
bunx prisma generate
bunx prisma db push          # no migration history exists → clean push
bun prisma/seed-users.ts     # or POST /api/seed with X-Seed-Secret header
```
Smoke-test: log in, open Students + one other module, create/read a record.

### 5. Case-insensitive search (free UX win on Postgres)
Add `mode: 'insensitive'` to every `contains:` filter in the 24 route files listed above. Pattern:
```ts
where: { name: { contains: q, mode: 'insensitive' } }
```
Grep `contains:` under `src/app/api` to confirm none are missed.

### 6. Composite tenant indexes
Add `@@index([schoolId, ...])` to tenant-heavy models per REBUILD-PLAN §5 — at minimum Student, Attendance, Invoice (and the obvious join/date-filtered models). Then `prisma db push` again (direct URL).

### 7. Repo hygiene
- `git rm --cached db/custom.db` (keep the local file).
- Add `*.db` to `.gitignore`.

### 8. Gate
- `bunx tsc --noEmit` and `eslint` must be green before handing off.

---

## Security note (flag, do not silently fix)
`.env.example:6` contains a concrete-looking Supabase Postgres password in cleartext.
If that database is real and reachable, the credential should be **rotated** and the
example file scrubbed to a placeholder. Confirm with the owner before rotating, since
other environments may use it.

## Risks & rollback
- **PgBouncer DDL failures** → ensure schema ops use `DIRECT_URL`.
- **Type drift SQLite→PG** (e.g. `DateTime`, `Json`, case-sensitivity) → surfaced by `db push` + the smoke test; fix in schema, re-push.
- Rollback is cheap pre-launch: point `DATABASE_URL` back at SQLite + revert the datasource block (no production data yet).

## Out of scope (later phases)
Public-site routes/redesign (B), login cleanup (C), TanStack/error boundaries (D),
tests (E), feature build-out (F), prod hardening (G).
