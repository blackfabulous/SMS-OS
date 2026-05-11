import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get students that could be considered as admissions (recently admitted or with specific statuses)
    const where: Record<string, unknown> = {}
    
    if (status) {
      where.enrollmentStatus = status
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { studentNumber: { contains: search } },
        { nationalId: { contains: search } },
      ]
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          parentLinks: {
            include: { parent: true },
          },
          enrollments: {
            include: { class: { include: { grade: true } } },
            orderBy: { enrollmentDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { admissionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.student.count({ where }),
    ])

    // Compute admission stats
    const stats = await db.student.groupBy({
      by: ['enrollmentStatus'],
      _count: { id: true },
    })

    const statusCounts: Record<string, number> = {}
    stats.forEach((s) => {
      statusCounts[s.enrollmentStatus] = s._count.id
    })

    return NextResponse.json({
      data: students,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: total,
        active: statusCounts['ACTIVE'] || 0,
        pending: statusCounts['PENDING'] || 0,
        droppedOut: statusCounts['DROPPED_OUT'] || 0,
        transferred: statusCounts['TRANSFERRED'] || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching admissions:', error)
    return NextResponse.json({ error: 'Failed to fetch admissions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Get school
    const school = await db.school.findFirst()
    if (!school) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Generate student number
    const currentYear = new Date().getFullYear()
    const lastStudent = await db.student.findFirst({
      where: { studentNumber: { startsWith: `STU${currentYear}` } },
      orderBy: { studentNumber: 'desc' },
    })
    const nextNum = lastStudent
      ? parseInt(lastStudent.studentNumber.slice(-3)) + 1
      : 1
    const studentNumber = `STU${currentYear}${String(nextNum).padStart(3, '0')}`

    const student = await db.student.create({
      data: {
        schoolId: school.id,
        studentNumber,
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : new Date(),
        gender: body.gender || 'MALE',
        birthCertNumber: body.birthCertNumber,
        nationalId: body.nationalId,
        previousSchool: body.previousSchool,
        enrollmentStatus: body.status || 'PENDING',
        boardingStatus: body.boardingStatus,
        admissionDate: new Date(),
      },
    })

    // Create parent/guardian if provided
    if (body.guardianFirstName && body.guardianLastName) {
      const parent = await db.parent.create({
        data: {
          schoolId: school.id,
          firstName: body.guardianFirstName,
          lastName: body.guardianLastName,
          phone: body.guardianPhone || '',
          email: body.guardianEmail,
          relationship: body.guardianRelationship || 'PARENT',
        },
      })

      await db.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relationship: body.guardianRelationship || 'PARENT',
          isPrimary: true,
          isFeeResponsible: true,
        },
      })
    }

    // Create enrollment if grade specified
    if (body.gradeId) {
      const currentYear2 = new Date().getFullYear().toString()
      const academicYear = await db.academicYear.findFirst({
        where: { schoolId: school.id, name: { contains: currentYear2 } },
      })

      if (academicYear) {
        const cls = await db.class.findFirst({
          where: { gradeId: body.gradeId, schoolId: school.id },
        })
        if (cls) {
          await db.studentEnrollment.create({
            data: {
              studentId: student.id,
              classId: cls.id,
              academicYearId: academicYear.id,
              status: 'ACTIVE',
            },
          })
        }
      }
    }

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating admission:', error)
    return NextResponse.json({ error: 'Failed to create admission' }, { status: 500 })
  }
}
