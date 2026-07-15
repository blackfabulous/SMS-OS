import 'server-only'

/**
 * Tiny, type-unsafe tenant-scope helpers used while we move from raw Prisma calls
 * to per-context repositories. The goal is to guarantee `schoolId` appears in
 * every `where` / `data` object even when the caller is a transaction client.
 *
 * These are intentionally generic; context-specific repositories (e.g.
 * payment-repository.ts) wrap them and add the correct Prisma types.
 */
export function withSchoolId<T extends object>(data: T, schoolId: string): T & { schoolId: string } {
  return { ...data, schoolId }
}

export function whereSchoolId<T extends object>(schoolId: string, extra?: T): { schoolId: string } & T {
  return { schoolId, ...(extra ?? {}) } as { schoolId: string } & T
}
