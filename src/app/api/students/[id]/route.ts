import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params

    // Parents can only view their own child
    if (session.user.role === 'PARENT') {
      // Resolve parentId from the User record (not stored in session)
      const userRecord = await db.user.findUnique({ where: { id: session.user.id }, select: { parentId: true } })
      if (!userRecord?.parentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const link = await db.studentParent.findFirst({
        where: { studentId: id, parentId: userRecord.parentId },
      })
      if (!link) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Students can only view their own record
    if (session.user.role === 'STUDENT' && session.user.studentId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // All roles: enforce school isolation
    const student = await db.student.findUnique({
      where: { id, schoolId: session.user.schoolId },
      include: {
        school: true,
        parentLinks: {
          include: { parent: true },
        },
        enrollments: {
          include: {
            class: {
              include: { grade: true },
            },
            academicYear: true,
          },
          orderBy: { enrollmentDate: 'desc' },
        },
        feeInvoices: {
          include: {
            items: true,
            term: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        disciplineRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        // Health records: only visible to ADMIN and TEACHER, not PARENT/STUDENT directly
        ...(session.user.role !== 'PARENT' && session.user.role !== 'STUDENT'
          ? {
              healthRecords: {
                orderBy: { visitDate: 'desc' },
                take: 10,
              },
            }
          : {}),
        beamApplication: true,
        boardingAssignment: {
          include: {
            dormitory: { include: { hostel: true } },
          },
        },
        transportAssignment: {
          include: { route: true },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const totalAttendance = student.attendanceRecords.length
    const presentCount = student.attendanceRecords.filter((r) => r.status === 'PRESENT').length
    const absentCount = student.attendanceRecords.filter((r) => r.status === 'ABSENT').length
    const lateCount = student.attendanceRecords.filter((r) => r.status === 'LATE').length

    const attendanceSummary = {
      total: totalAttendance,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      attendanceRate: totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0',
    }

    return NextResponse.json({ student, attendanceSummary })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params
    const body = await request.json()

    // Verify student belongs to the caller's school before updating
    const existing = await db.student.findUnique({
      where: { id, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const student = await db.student.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        preferredName: body.preferredName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender,
        birthCertNumber: body.birthCertNumber,
        nationalId: body.nationalId,
        passportNumber: body.passportNumber,
        photo: body.photo,
        religion: body.religion,
        homeLanguage: body.homeLanguage,
        languagePreference: body.languagePreference,
        nationality: body.nationality,
        bloodGroup: body.bloodGroup,
        allergies: body.allergies,
        chronicConditions: body.chronicConditions,
        medications: body.medications,
        doctorName: body.doctorName,
        doctorPhone: body.doctorPhone,
        enrollmentStatus: body.enrollmentStatus,
        boardingStatus: body.boardingStatus,
        beamStatus: body.beamStatus,
        isSpecialNeeds: body.isSpecialNeeds,
        specialNeedsDetails: body.specialNeedsDetails,
        previousSchool: body.previousSchool,
        transferDate: body.transferDate ? new Date(body.transferDate) : undefined,
        exitDate: body.exitDate ? new Date(body.exitDate) : undefined,
        exitReason: body.exitReason,
      },
      include: {
        enrollments: { include: { class: { include: { grade: true } } } },
        parentLinks: { include: { parent: true } },
      },
    })

    logAudit({ action: 'UPDATE', entity: 'students', entityId: student.id, afterValue: student }).catch(() => {})
    return NextResponse.json(student)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params

    // Verify student belongs to the caller's school before deleting
    const existing = await db.student.findUnique({
      where: { id, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const student = await db.student.update({
      where: { id },
      data: {
        enrollmentStatus: 'DROPPED_OUT',
        exitDate: new Date(),
        exitReason: 'DROPPED_OUT',
      },
    })

    logAudit({ action: 'DELETE', entity: 'students', entityId: id }).catch(() => {})
    return NextResponse.json({ message: 'Student soft deleted successfully', student })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
