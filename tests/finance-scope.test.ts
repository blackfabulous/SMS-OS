import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Prisma client before importing the module under test.
vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    studentParent: { findMany: vi.fn() },
  },
}))

import { db } from '@/lib/db'
import { financeStudentScope } from '@/server/finance/scope'
import type { RequestContext } from '@/server/context'

const ctx = (role: string, userId = 'u1', schoolId = 's1'): RequestContext => ({
  userId,
  schoolId,
  role: role as RequestContext['role'],
  can: () => true,
})

 
const userMock = db.user.findUnique as any
 
const linksMock = db.studentParent.findMany as any

beforeEach(() => {
  userMock.mockReset()
  linksMock.mockReset()
})

describe('financeStudentScope', () => {
  it('staff (ADMIN/BURSAR/SUPER_ADMIN) see the whole school', async () => {
    for (const role of ['ADMIN', 'BURSAR', 'SUPER_ADMIN']) {
      const scope = await financeStudentScope(ctx(role))
      expect(scope).toEqual({ where: { student: { schoolId: 's1' } }, staff: true })
    }
    expect(userMock).not.toHaveBeenCalled() // no DB lookup needed for staff
  })

  it('STUDENT is pinned to their own studentId', async () => {
    userMock.mockResolvedValue({ studentId: 'stu-self' })
    const scope = await financeStudentScope(ctx('STUDENT'))
    expect(scope).toEqual({ where: { studentId: 'stu-self', student: { schoolId: 's1' } }, staff: false })
  })

  it('PARENT is pinned to their own children (cannot widen)', async () => {
    userMock.mockResolvedValue({ parentId: 'par-1' })
    linksMock.mockResolvedValue([{ studentId: 'child-a' }, { studentId: 'child-b' }])
    const scope = await financeStudentScope(ctx('PARENT'))
    expect(scope).toEqual({
      where: { studentId: { in: ['child-a', 'child-b'] }, student: { schoolId: 's1' } },
      staff: false,
    })
    // children lookup is school-scoped
    expect(linksMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { parentId: 'par-1', student: { schoolId: 's1' } } }),
    )
  })

  it('PARENT with no linked children gets no visibility (null)', async () => {
    userMock.mockResolvedValue({ parentId: 'par-1' })
    linksMock.mockResolvedValue([])
    expect(await financeStudentScope(ctx('PARENT'))).toBeNull()
  })

  it('STUDENT/PARENT with no backing entity gets null', async () => {
    userMock.mockResolvedValue({ studentId: null })
    expect(await financeStudentScope(ctx('STUDENT'))).toBeNull()
    userMock.mockResolvedValue({ parentId: null })
    expect(await financeStudentScope(ctx('PARENT'))).toBeNull()
  })

  it('TEACHER (and other roles) get no finance visibility', async () => {
    expect(await financeStudentScope(ctx('TEACHER'))).toBeNull()
  })
})
