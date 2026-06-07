// Pure report-card publish/countersign workflow — no DB/IO, fully unit-testable.
//
// Lifecycle: DRAFT → SUBMITTED (class teacher) → COUNTERSIGNED (head) → PUBLISHED (head).
// Any post-draft state can be reverted to DRAFT by an admin/head.

export const REPORT_CARD_STATUSES = ['DRAFT', 'SUBMITTED', 'COUNTERSIGNED', 'PUBLISHED'] as const
export type ReportCardStatus = (typeof REPORT_CARD_STATUSES)[number]

export const REPORT_CARD_ACTIONS = ['submit', 'countersign', 'publish', 'revert'] as const
export type ReportCardAction = (typeof REPORT_CARD_ACTIONS)[number]

// Roles as used by the RBAC layer.
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'BURSAR'

interface Rule {
  from: ReportCardStatus[]
  to: ReportCardStatus
  roles: Role[]
}

// Head/administrative roles that can countersign and publish.
const HEAD_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN']
// Roles that may submit a draft for countersigning.
const SUBMIT_ROLES: Role[] = ['TEACHER', 'ADMIN', 'SUPER_ADMIN']

const RULES: Record<ReportCardAction, Rule> = {
  submit: { from: ['DRAFT'], to: 'SUBMITTED', roles: SUBMIT_ROLES },
  countersign: { from: ['SUBMITTED'], to: 'COUNTERSIGNED', roles: HEAD_ROLES },
  publish: { from: ['COUNTERSIGNED'], to: 'PUBLISHED', roles: HEAD_ROLES },
  revert: { from: ['SUBMITTED', 'COUNTERSIGNED', 'PUBLISHED'], to: 'DRAFT', roles: HEAD_ROLES },
}

export interface TransitionOk {
  ok: true
  next: ReportCardStatus
  /** Side-effects the persistence layer should apply. */
  effects: {
    classTeacherSignedAt?: 'set' | 'clear'
    headSignedAt?: 'set' | 'clear'
    isPublished: boolean
  }
}
export interface TransitionErr {
  ok: false
  error: string
  code: 'BAD_STATE' | 'FORBIDDEN' | 'UNKNOWN_ACTION'
}
export type TransitionResult = TransitionOk | TransitionErr

/**
 * Compute the result of applying `action` to a report card in `current` status,
 * as performed by a user with `role`. Pure — the caller persists `next`/effects.
 */
export function transition(current: ReportCardStatus, action: ReportCardAction, role: Role): TransitionResult {
  const rule = RULES[action]
  if (!rule) return { ok: false, error: `Unknown action "${action}"`, code: 'UNKNOWN_ACTION' }

  if (!rule.roles.includes(role)) {
    return { ok: false, error: `Your role (${role}) may not ${action} a report card`, code: 'FORBIDDEN' }
  }
  if (!rule.from.includes(current)) {
    return {
      ok: false,
      error: `Cannot ${action} a report card in ${current} state (expected one of: ${rule.from.join(', ')})`,
      code: 'BAD_STATE',
    }
  }

  const next = rule.to
  const effects: TransitionOk['effects'] = { isPublished: next === 'PUBLISHED' }
  if (action === 'submit') effects.classTeacherSignedAt = 'set'
  if (action === 'countersign') effects.headSignedAt = 'set'
  if (action === 'revert') {
    effects.classTeacherSignedAt = 'clear'
    effects.headSignedAt = 'clear'
  }

  return { ok: true, next, effects }
}

/** Whether a report card in this status is visible to parents/students. */
export function isParentVisible(status: ReportCardStatus): boolean {
  return status === 'PUBLISHED'
}
