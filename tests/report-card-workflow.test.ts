import { describe, it, expect } from 'vitest'
import { transition, isParentVisible, REPORT_CARD_STATUSES } from '@/lib/report-card-workflow'

describe('report-card workflow transitions', () => {
  it('teacher submits a draft', () => {
    const r = transition('DRAFT', 'submit', 'TEACHER')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.next).toBe('SUBMITTED')
      expect(r.effects.classTeacherSignedAt).toBe('set')
      expect(r.effects.isPublished).toBe(false)
    }
  })

  it('head countersigns a submitted card', () => {
    const r = transition('SUBMITTED', 'countersign', 'ADMIN')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.next).toBe('COUNTERSIGNED')
      expect(r.effects.headSignedAt).toBe('set')
    }
  })

  it('head publishes a countersigned card', () => {
    const r = transition('COUNTERSIGNED', 'publish', 'ADMIN')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.next).toBe('PUBLISHED')
      expect(r.effects.isPublished).toBe(true)
    }
  })

  it('revert clears signatures and unpublishes', () => {
    const r = transition('PUBLISHED', 'revert', 'ADMIN')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.next).toBe('DRAFT')
      expect(r.effects.classTeacherSignedAt).toBe('clear')
      expect(r.effects.headSignedAt).toBe('clear')
      expect(r.effects.isPublished).toBe(false)
    }
  })
})

describe('report-card workflow guards', () => {
  it('rejects countersign by a teacher (role guard)', () => {
    const r = transition('SUBMITTED', 'countersign', 'TEACHER')
    expect(r).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('rejects publishing a draft (state guard)', () => {
    const r = transition('DRAFT', 'publish', 'ADMIN')
    expect(r).toMatchObject({ ok: false, code: 'BAD_STATE' })
  })

  it('rejects submitting an already-submitted card', () => {
    const r = transition('SUBMITTED', 'submit', 'TEACHER')
    expect(r).toMatchObject({ ok: false, code: 'BAD_STATE' })
  })

  it('cannot skip countersign (submitted → publish)', () => {
    const r = transition('SUBMITTED', 'publish', 'ADMIN')
    expect(r).toMatchObject({ ok: false, code: 'BAD_STATE' })
  })

  it('parents only see published cards', () => {
    expect(isParentVisible('PUBLISHED')).toBe(true)
    for (const s of REPORT_CARD_STATUSES.filter((x) => x !== 'PUBLISHED')) {
      expect(isParentVisible(s)).toBe(false)
    }
  })
})
