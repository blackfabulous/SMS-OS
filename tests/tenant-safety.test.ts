import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * RA-02 — tenant-isolation regression guard.
 *
 * Statically enforces the cross-tenant invariants this codebase was swept for, so
 * a new (or edited) API route can't silently reintroduce the class of leaks that
 * the audit found across ~25 modules. Runs with no DB. Pairs with the RLS backstop
 * (docs/RLS.md) for defense-in-depth.
 *
 * Invariants:
 *   1. No `db.school.findFirst()` in an authenticated route (it returns an
 *      ARBITRARY tenant). Authenticated routes must resolve the school via the
 *      session: db.school.findUnique({ where: { id: <session schoolId> } }).
 *   2. Any by-id mutation (`db.X.update/delete({ where: { id }`) must be
 *      ownership-guarded somewhere in the file (a schoolId/relation scope check).
 *
 * Legitimate exceptions are explicitly allow-listed with a reason.
 */

const API_DIR = join(process.cwd(), 'src', 'app', 'api')

function listRouteFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listRouteFiles(full))
    else if (entry.name === 'route.ts') out.push(full)
  }
  return out
}

/** Repo-relative, forward-slashed path under src/app/api (e.g. "finance/route.ts"). */
function rel(file: string): string {
  return relative(API_DIR, file).split(sep).join('/')
}

const AUTH_SIGNAL = /\b(validateAuth|validateRole|validateSchoolAccess|getRequestTenant|requireContext)\b/

// Files where db.school.findFirst() is correct: no session to scope by (public)
// or the single-school first-run bootstrap.
const SCHOOL_FINDFIRST_ALLOW = new Set<string>([
  'admissions/apply/route.ts', // public application form — unauthenticated, no session
  'school/route.ts', // POST: first-run setup guard (rejects if a school already exists)
])

// Ownership/tenant-scope signals that make a by-id mutation safe.
const SCOPE_SIGNAL = new RegExp(
  [
    'where:\\s*\\{\\s*id,\\s*schoolId', // update/delete({ where: { id, schoolId } })
    'find(First|Unique)\\([^)]*schoolId', // pre-fetch ownership check incl. schoolId
    '\\.schoolId\\s*!==', // explicit `existing.x.schoolId !== session...`
    '\\b\\w+:\\s*\\{\\s*schoolId', // relation scope: student:{ schoolId }, asset:{ schoolId }, ...
    '\\b(tenantWhere|assertOwned|canAccessStudent|financeStudentScope)\\b', // shared helpers
  ].join('|'),
)

const BY_ID_MUTATION = /\.(update|delete|updateMany|deleteMany)\(\s*\{\s*where:\s*\{\s*id\b/

// Pre-auth flows where a by-id mutation is scoped by a one-time token, not a
// session/tenant — tenant scoping does not apply.
const BY_ID_MUTATION_ALLOW = new Set<string>([
  'password/reset/route.ts', // public: completes reset via emailed token (token-hash gated)
])

function lineOf(src: string, index: number): number {
  return src.slice(0, index).split('\n').length
}

const routeFiles = listRouteFiles(API_DIR)

describe('RA-02 tenant-isolation static guard', () => {
  it('discovers API route files to scan', () => {
    expect(routeFiles.length).toBeGreaterThan(30)
  })

  it('no authenticated route uses db.school.findFirst() (use findUnique by session schoolId)', () => {
    const violations: string[] = []
    for (const file of routeFiles) {
      const src = readFileSync(file, 'utf8')
      if (!src.includes('db.school.findFirst(')) continue
      const r = rel(file)
      if (SCHOOL_FINDFIRST_ALLOW.has(r)) continue
      if (!AUTH_SIGNAL.test(src)) continue // unauthenticated/public — out of scope here
      const idx = src.indexOf('db.school.findFirst(')
      violations.push(`${r}:${lineOf(src, idx)} — authenticated route uses db.school.findFirst() (returns an arbitrary tenant)`)
    }
    expect(violations, `Cross-tenant read risk:\n${violations.join('\n')}`).toEqual([])
  })

  it('every by-id mutation is ownership/tenant scoped', () => {
    const violations: string[] = []
    for (const file of routeFiles) {
      const src = readFileSync(file, 'utf8')
      if (!BY_ID_MUTATION.test(src)) continue
      if (BY_ID_MUTATION_ALLOW.has(rel(file))) continue
      if (SCOPE_SIGNAL.test(src)) continue // file has at least one scope guard
      violations.push(`${rel(file)} — has a by-id update/delete with no tenant ownership guard`)
    }
    expect(violations, `Cross-tenant write (IDOR) risk:\n${violations.join('\n')}`).toEqual([])
  })
})
