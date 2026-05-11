import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const limit = 5

    // Search students
    const students = await db.student.findMany({
      where: {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { middleName: { contains: query } },
          { studentNumber: { contains: query } },
          { nationalId: { contains: query } },
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

    // Search staff
    const staff = await db.staff.findMany({
      where: {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { middleName: { contains: query } },
          { staffNumber: { contains: query } },
          { email: { contains: query } },
          { position: { contains: query } },
          { department: { contains: query } },
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

    return NextResponse.json({
      results: [...studentResults, ...staffResults],
    })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}
