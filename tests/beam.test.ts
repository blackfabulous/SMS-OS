import { describe, it, expect } from 'vitest'
import { allocateBeamCoverage } from '@/lib/beam'

const inv = (id: string, balance: number, dueDate: string) => ({ id, balance, dueDate })

describe('allocateBeamCoverage', () => {
  it('allocates oldest-due first and settles fully when coverage suffices', () => {
    const r = allocateBeamCoverage(300, [
      inv('b', 100, '2025-03-01'),
      inv('a', 150, '2025-01-01'),
      inv('c', 100, '2025-05-01'),
    ])
    expect(r.allocations.map((a) => a.invoiceId)).toEqual(['a', 'b', 'c'])
    expect(r.allocations.map((a) => a.applied)).toEqual([150, 100, 50])
    expect(r.allocations.map((a) => a.newBalance)).toEqual([0, 0, 50])
    expect(r.totalApplied).toBe(300)
    expect(r.leftover).toBe(0)
  })

  it('caps each invoice at its balance and returns leftover', () => {
    const r = allocateBeamCoverage(500, [inv('a', 100, '2025-01-01'), inv('b', 100, '2025-02-01')])
    expect(r.totalApplied).toBe(200)
    expect(r.leftover).toBe(300)
    expect(r.allocations.every((a) => a.newBalance === 0)).toBe(true)
  })

  it('partially covers when coverage is short', () => {
    const r = allocateBeamCoverage(120, [inv('a', 100, '2025-01-01'), inv('b', 100, '2025-02-01')])
    expect(r.allocations).toEqual([
      { invoiceId: 'a', applied: 100, newBalance: 0 },
      { invoiceId: 'b', applied: 20, newBalance: 80 },
    ])
    expect(r.leftover).toBe(0)
  })

  it('skips zero-balance invoices', () => {
    const r = allocateBeamCoverage(100, [inv('a', 0, '2025-01-01'), inv('b', 50, '2025-02-01')])
    expect(r.allocations).toEqual([{ invoiceId: 'b', applied: 50, newBalance: 0 }])
    expect(r.leftover).toBe(50)
  })

  it('handles zero / negative coverage', () => {
    expect(allocateBeamCoverage(0, [inv('a', 50, '2025-01-01')])).toMatchObject({ totalApplied: 0, leftover: 0, allocations: [] })
    expect(allocateBeamCoverage(-10, [inv('a', 50, '2025-01-01')])).toMatchObject({ totalApplied: 0, leftover: 0 })
  })
})
