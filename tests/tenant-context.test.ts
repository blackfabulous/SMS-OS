import { describe, it, expect } from 'vitest'
import {
  enterTenant,
  currentSchoolId,
  runWithTenant,
  isInTenantTx,
  withTenantTxFlag,
} from '@/server/tenant-context'

describe('tenant-context (RLS plumbing)', () => {
  it('runWithTenant scopes schoolId to the callback', () => {
    expect(currentSchoolId()).toBeUndefined()
    const inside = runWithTenant('school-a', () => currentSchoolId())
    expect(inside).toBe('school-a')
    expect(currentSchoolId()).toBeUndefined() // does not leak outside the scope
  })

  it('enterTenant binds the tenant within an ALS scope', () => {
    runWithTenant('seed', () => {
      enterTenant('school-b')
      expect(currentSchoolId()).toBe('school-b')
    })
  })

  it('enterTenant ignores empty/nullish school ids', () => {
    runWithTenant('school-a', () => {
      enterTenant(undefined)
      enterTenant('')
      expect(currentSchoolId()).toBe('school-a')
    })
  })

  it('isolates concurrent tenants (no cross-talk)', async () => {
    const seen: Record<string, string | undefined> = {}
    await Promise.all([
      new Promise<void>((resolve) =>
        runWithTenant('A', async () => {
          await new Promise((r) => setTimeout(r, 5))
          seen.A = currentSchoolId()
          resolve()
        }),
      ),
      new Promise<void>((resolve) =>
        runWithTenant('B', async () => {
          seen.B = currentSchoolId()
          resolve()
        }),
      ),
    ])
    expect(seen).toEqual({ A: 'A', B: 'B' })
  })

  it('withTenantTxFlag toggles the in-transaction flag and restores it', async () => {
    await runWithTenant('A', async () => {
      expect(isInTenantTx()).toBe(false)
      await withTenantTxFlag(async () => {
        expect(isInTenantTx()).toBe(true)
      })
      expect(isInTenantTx()).toBe(false)
    })
  })
})
