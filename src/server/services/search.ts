import 'server-only'
import { db } from '@/lib/db'
import { isAppError } from '@/lib/errors'

export async function globalSearch(schoolId: string, query: string) {
  if (!query || query.length < 2) return { results: [] }

  const limit = 5

  const [students, staff] = await Promise.all([
    db.student.findMany({
      where: {
        schoolId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { middleName: { contains: query, mode: 'insensitive' } },
          { studentNumber: { contains: query, mode: 'insensitive' } },
          { nationalId: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { include: { grade: true } } },
          take: 1,
          orderBy: { enrollmentDate: 'desc' },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.staff.findMany({
      where: {
        schoolId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { middleName: { contains: query, mode: 'insensitive' } },
          { staffNumber: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { position: { contains: query, mode: 'insensitive' } },
          { department: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const studentResults = students.map((s) => ({
    id: s.id,
    type: 'student' as const,
    title: `${s.firstName} ${s.lastName}`,
    subtitle: s.studentNumber,
    description: s.enrollments?.[0]?.class?.grade?.name
      ? `${s.enrollments[0].class.grade.name} - ${s.enrollments[0].class.name}`
      : s.enrollmentStatus,
    module: 'students',
  }))

  const staffResults = staff.map((s) => ({
    id: s.id,
    type: 'staff' as const,
    title: `${s.firstName} ${s.lastName}`,
    subtitle: s.staffNumber,
    description: `${s.position || 'Staff'}${s.department ? ` - ${s.department}` : ''}`,
    module: 'staff',
  }))

  return { results: [...studentResults, ...staffResults] }
}

export function handleSearchError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
