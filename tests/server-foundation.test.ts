import { describe, it, expect } from 'vitest'
import { errorBody, ERROR_STATUS } from '@/server/http'
import { tenantWhere, tenantVia, assertOwned, TenantViolationError } from '@/server/db/tenant'
import { canPerformAction } from '@/lib/rbac'

describe('http envelope', () => {
  it('maps error codes to status', () => {
    expect(ERROR_STATUS.UNAUTHENTICATED).toBe(401)
    expect(ERROR_STATUS.FORBIDDEN).toBe(403)
    expect(ERROR_STATUS.VALIDATION).toBe(400)
    expect(ERROR_STATUS.CONFLICT).toBe(409)
    expect(ERROR_STATUS.INTERNAL).toBe(500)
  })
  it('builds a consistent error body', () => {
    expect(errorBody('NOT_FOUND', 'gone')).toEqual({ error: { code: 'NOT_FOUND', message: 'gone' } })
    expect(errorBody('VALIDATION', 'bad', [{ k: 1 }])).toEqual({ error: { code: 'VALIDATION', message: 'bad', details: [{ k: 1 }] } })
  })
})

describe('tenant scoping helpers', () => {
  it('always injects schoolId into the where clause', () => {
    expect(tenantWhere('s1')).toEqual({ schoolId: 's1' })
    expect(tenantWhere('s1', { status: 'ACTIVE' })).toEqual({ status: 'ACTIVE', schoolId: 's1' })
  })
  it('scopes child rows through a relation', () => {
    expect(tenantVia('student', 's1')).toEqual({ student: { schoolId: 's1' } })
  })
  it('assertOwned returns the row when it belongs to the school', () => {
    const row = { id: 'x', schoolId: 's1' }
    expect(assertOwned(row, 's1')).toBe(row)
  })
  it('assertOwned throws on a cross-tenant or missing row', () => {
    expect(() => assertOwned({ id: 'x', schoolId: 's2' }, 's1', 'student')).toThrow(TenantViolationError)
    expect(() => assertOwned(null, 's1')).toThrow(TenantViolationError)
  })
})

describe('RBAC policy matrix (canPerformAction)', () => {
  it('ADMIN has full access', () => {
    for (const m of ['students', 'finance', 'settings', 'examinations']) {
      for (const a of ['create', 'read', 'update', 'delete'] as const) {
        expect(canPerformAction('ADMIN', m, a)).toBe(true)
      }
    }
  })
  it('BURSAR can update settings but not delete them', () => {
    expect(canPerformAction('BURSAR', 'settings', 'update')).toBe(true)
    expect(canPerformAction('BURSAR', 'settings', 'delete')).toBe(false)
    expect(canPerformAction('BURSAR', 'finance', 'delete')).toBe(true)
  })
  it('TEACHER manages examinations but only reads students', () => {
    expect(canPerformAction('TEACHER', 'examinations', 'update')).toBe(true)
    expect(canPerformAction('TEACHER', 'students', 'read')).toBe(true)
    expect(canPerformAction('TEACHER', 'students', 'update')).toBe(false)
  })
  it('STUDENT/PARENT cannot reach restricted modules', () => {
    expect(canPerformAction('STUDENT', 'finance', 'read')).toBe(false)
    expect(canPerformAction('STUDENT', 'payroll', 'read')).toBe(false)
    expect(canPerformAction('PARENT', 'finance', 'read')).toBe(true) // parents may view fees
    expect(canPerformAction('PARENT', 'finance', 'update')).toBe(false)
    expect(canPerformAction('PARENT', 'students', 'read')).toBe(false)
  })
})
