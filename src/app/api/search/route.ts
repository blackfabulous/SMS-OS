import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'

export async function GET(request: Request) {
  // Global directory search (students incl. national IDs, staff incl. emails)
  // is a staff feature — not exposed to parents/students.
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'TEACHER'] })
  if ('error' in result) return result.error
  const { schoolId } = result.ctx

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return ok({ results: [] })
    }

    const limit = 5

    // Search students — scoped to caller's school
    const students = await db.student.findMany({
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
          include: {
            class: {
              include: { grade: true },
            },
          },
          take: 1,
          orderBy: { enrollmentDate: 'desc' },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Search staff — scoped to caller's school
    const staff = await db.staff.findMany({
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
    })

    // Format student results
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

    // Format staff results
    const staffResults = staff.map((s) => ({
      id: s.id,
      type: 'staff' as const,
      title: `${s.firstName} ${s.lastName}`,
      subtitle: s.staffNumber,
      description: `${s.position || 'Staff'}${s.department ? ` - ${s.department}` : ''}`,
      module: 'staff',
    }))

    return ok({ results: [...studentResults, ...staffResults] })
  } catch (error) {
    logger.error({ err: error }, 'Error searching')
    return fail('INTERNAL', 'Failed to search')
  }
}
