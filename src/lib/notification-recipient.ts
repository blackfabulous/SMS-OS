import 'server-only'
import { db } from '@/lib/db'

export interface GuardianRecipient {
  parentId: string | null
  phone: string | null
  email: string | null
  name: string | null
  studentName: string
}

const STUDENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  parentLinks: {
    orderBy: { isPrimary: 'desc' } as const,
    take: 1,
    select: { parent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
  },
} as const

function toRecipient(student: {
  firstName: string
  lastName: string
  parentLinks: { parent: { id: string; firstName: string; lastName: string; phone: string; email: string | null } }[]
}): GuardianRecipient {
  const p = student.parentLinks[0]?.parent
  return {
    parentId: p?.id ?? null,
    phone: p?.phone ?? null,
    email: p?.email ?? null,
    name: p ? `${p.firstName} ${p.lastName}` : null,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
  }
}

/**
 * Resolve a student's primary guardian as a notification recipient — SCOPED to
 * the given school (prevents cross-tenant PII leakage). Returns null if the
 * student does not exist *in that school*.
 */
export async function resolveStudentGuardian(studentId: string, schoolId: string): Promise<GuardianRecipient | null> {
  const student = await db.student.findFirst({ where: { id: studentId, schoolId }, select: STUDENT_SELECT })
  return student ? toRecipient(student) : null
}

/**
 * Batch-resolve guardians for many students in ONE query (avoids the N+1 in
 * bulk dispatch). Scoped to the school. Returns a Map keyed by studentId;
 * students not in the school are simply absent from the map.
 */
export async function resolveStudentGuardians(
  studentIds: string[],
  schoolId: string,
): Promise<Map<string, GuardianRecipient>> {
  const unique = [...new Set(studentIds)]
  if (unique.length === 0) return new Map()
  const students = await db.student.findMany({
    where: { id: { in: unique }, schoolId },
    select: STUDENT_SELECT,
  })
  return new Map(students.map((s) => [s.id, toRecipient(s)]))
}
