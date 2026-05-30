import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { CreateStudentSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender') || ''
    const enrollmentStatus = searchParams.get('enrollmentStatus') || ''
    const grade = searchParams.get('grade') || ''
    const boardingStatus = searchParams.get('boardingStatus') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Always scope to the authenticated user's school
    const where: Record<string, unknown> = { schoolId }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (gender) where.gender = gender
    if (enrollmentStatus) where.enrollmentStatus = enrollmentStatus
    if (boardingStatus) where.boardingStatus = boardingStatus

    if (grade) {
      where.enrollments = {
        some: { class: { grade: { name: grade } }, status: 'ACTIVE' },
      }
    }

    const [data, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { class: { include: { grade: true } } },
            take: 1,
            orderBy: { enrollmentDate: 'desc' },
          },
          parentLinks: {
            where: { isPrimary: true },
            include: { parent: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.student.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER', 'BURSAR'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()

    // Validate the required identity fields; optional profile fields are read
    // from the body below.
    const parsed = CreateStudentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
    }

    const currentYear = new Date().getFullYear()

    const lastStudent = await db.student.findFirst({
      where: { studentNumber: { startsWith: `STU${currentYear}` } },
      orderBy: { studentNumber: 'desc' },
    })

    let sequence = 1
    if (lastStudent) {
      const lastSequence = parseInt(lastStudent.studentNumber.slice(-3))
      sequence = lastSequence + 1
    }

    const studentNumber = `STU${currentYear}${sequence.toString().padStart(3, '0')}`

    // Always use the authenticated user's schoolId — never trust the request body
    const student = await db.student.create({
      data: {
        studentNumber,
        schoolId: session.user.schoolId,
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        preferredName: body.preferredName,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        birthCertNumber: body.birthCertNumber,
        nationalId: body.nationalId,
        passportNumber: body.passportNumber,
        photo: body.photo,
        religion: body.religion,
        homeLanguage: body.homeLanguage,
        languagePreference: body.languagePreference || 'ENGLISH',
        nationality: body.nationality || 'Zimbabwean',
        bloodGroup: body.bloodGroup,
        allergies: body.allergies,
        chronicConditions: body.chronicConditions,
        medications: body.medications,
        doctorName: body.doctorName,
        doctorPhone: body.doctorPhone,
        enrollmentStatus: body.enrollmentStatus || 'ACTIVE',
        boardingStatus: body.boardingStatus,
        beamStatus: body.beamStatus,
        isSpecialNeeds: body.isSpecialNeeds || false,
        specialNeedsDetails: body.specialNeedsDetails,
        previousSchool: body.previousSchool,
        admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
        transferDate: body.transferDate ? new Date(body.transferDate) : undefined,
        exitDate: body.exitDate ? new Date(body.exitDate) : undefined,
        exitReason: body.exitReason,
      },
      include: {
        enrollments: { include: { class: { include: { grade: true } } } },
        parentLinks: { include: { parent: true } },
      },
    })

    if (body.parentLinks && body.parentLinks.length > 0) {
      await db.studentParent.createMany({
        data: body.parentLinks.map((link: { parentId: string; relationship: string; isPrimary?: boolean; isFeeResponsible?: boolean }) => ({
          studentId: student.id,
          parentId: link.parentId,
          relationship: link.relationship,
          isPrimary: link.isPrimary || false,
          isFeeResponsible: link.isFeeResponsible || false,
        })),
      })
    }

    if (body.classId && body.academicYearId) {
      await db.studentEnrollment.create({
        data: {
          studentId: student.id,
          classId: body.classId,
          academicYearId: body.academicYearId,
          status: 'ACTIVE',
        },
      })
    }

    logAudit({ action: 'CREATE', entity: 'students', entityId: student.id, afterValue: student }).catch(() => {})
    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
}
