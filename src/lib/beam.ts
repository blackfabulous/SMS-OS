// Pure BEAM (Basic Education Assistance Module) coverage allocation — no DB/IO.
// Distributes an approved coverage amount across a student's outstanding
// invoices, oldest-due first, never over-paying any single invoice.

import { round2 } from '@/lib/finance-calc'

export interface OutstandingInvoice {
  id: string
  balance: number
  dueDate: Date | string
}

export interface BeamAllocation {
  invoiceId: string
  applied: number
  newBalance: number
}

export interface BeamAllocationResult {
  allocations: BeamAllocation[]
  totalApplied: number
  /** Coverage left over after all invoices are settled. */
  leftover: number
}

/**
 * Allocate `coveredAmount` across outstanding invoices, oldest dueDate first.
 * Each invoice receives at most its current balance. Invoices with no balance
 * are skipped. Returns per-invoice allocations + the unused remainder.
 */
export function allocateBeamCoverage(coveredAmount: number, invoices: OutstandingInvoice[]): BeamAllocationResult {
  let remaining = round2(Math.max(0, coveredAmount))
  const ordered = [...invoices]
    .filter((i) => i.balance > 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const allocations: BeamAllocation[] = []
  for (const inv of ordered) {
    if (remaining <= 0) break
    const applied = round2(Math.min(remaining, inv.balance))
    if (applied <= 0) continue
    allocations.push({ invoiceId: inv.id, applied, newBalance: round2(inv.balance - applied) })
    remaining = round2(remaining - applied)
  }

  const totalApplied = round2(allocations.reduce((s, a) => s + a.applied, 0))
  return { allocations, totalApplied, leftover: round2(remaining) }
}
