import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    studentParent: { findFirst: vi.fn() },
  },
}))

import { db } from '@/lib/db'
import { canAccessStudent } from '@/server/student-access'
import type { RequestContext } from '@/server/context'

const ctx = (role: string, userId = 'u1'): RequestContext => ({
  userId,
  schoolId: 's1',
  role: role as RequestContext['role'],
  can: () => true,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userMock = db.user.findUnique as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linkMock = db.studentParent.findFirst as any

beforeEach(() => {
  userMock.mockReset()
  linkMock.mockReset()
})

describe('canAccessStudent', () => {
  it('staff may access any student (school scoping enforced by the query)', async () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'TEACHER']) {
      expect(await canAccessStudent(ctx(role), 'any-student')).toBe(true)
    }
    expect(userMock).not.toHaveBeenCalled()
  })

  it('STUDENT may access only themselves', async () => {
    userMock.mockResolvedValue({ studentId: 'stu-self' })
    expect(await canAccessStudent(ctx('STUDENT'), 'stu-self')).toBe(true)
    userMock.mockResolvedValue({ studentId: 'stu-self' })
    expect(await canAccessStudent(ctx('STUDENT'), 'stu-other')).toBe(false)
  })

  it('PARENT may access only linked children', async () => {
    userMock.mockResolvedValue({ parentId: 'par-1' })
    linkMock.mockResolvedValue({ id: 'link-1' })
    expect(await canAccessStudent(ctx('PARENT'), 'child-a')).toBe(true)

    userMock.mockResolvedValue({ parentId: 'par-1' })
    linkMock.mockResolvedValue(null)
    expect(await canAccessStudent(ctx('PARENT'), 'not-mine')).toBe(false)
  })

  it('PARENT/STUDENT with no backing entity is denied', async () => {
    userMock.mockResolvedValue({ parentId: null })
    expect(await canAccessStudent(ctx('PARENT'), 'x')).toBe(false)
    userMock.mockResolvedValue({ studentId: null })
    expect(await canAccessStudent(ctx('STUDENT'), 'x')).toBe(false)
  })

  it('unknown roles are denied', async () => {
    expect(await canAccessStudent(ctx('GUEST'), 'x')).toBe(false)
  })
})
