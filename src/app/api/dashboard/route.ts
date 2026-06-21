import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'

export async function GET() {
  try {
    const authResult = await validateAuth()
    if ('error' in authResult) return authResult.error
    // Every query below MUST be scoped to the caller's school (tenant isolation).
    const schoolId = authResult.session.user.schoolId

    // Enrollment stats
    const totalStudents = await db.student.count({ where: { schoolId } })
    const activeStudents = await db.student.count({
      where: { schoolId, enrollmentStatus: 'ACTIVE' },
    })
    const newStudents = await db.student.count({
      where: {
        schoolId,
        enrollmentStatus: 'ACTIVE',
        admissionDate: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
    })

    const enrollmentByStatus = await db.student.groupBy({
      by: ['enrollmentStatus'],
      where: { schoolId },
      _count: { id: true },
    })

    // Gender distribution
    const genderDistribution = await db.student.groupBy({
      by: ['gender'],
      _count: { id: true },
      where: { schoolId, enrollmentStatus: 'ACTIVE' },
    })

    // Grade distribution
    const gradeDistribution = await db.studentEnrollment.groupBy({
      by: ['classId'],
      where: { status: 'ACTIVE', student: { schoolId } },
      _count: { studentId: true },
    })

    const classes = await db.class.findMany({
      where: { isActive: true, schoolId },
      include: { grade: true },
    })

    const gradeMap = new Map(classes.map((c) => [c.id, c.grade.name]))
    const gradeStudentCounts: Record<string, number> = {}
    for (const gc of gradeDistribution) {
      const gradeName = gradeMap.get(gc.classId) || 'Unknown'
      gradeStudentCounts[gradeName] = (gradeStudentCounts[gradeName] || 0) + gc._count.studentId
    }

    // Attendance stats (today)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAttendance = await db.attendance.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        student: { schoolId },
      },
    })

    const attendanceStats = {
      total: todayAttendance.length,
      present: todayAttendance.filter((a) => a.status === 'PRESENT').length,
      absent: todayAttendance.filter((a) => a.status === 'ABSENT').length,
      late: todayAttendance.filter((a) => a.status === 'LATE').length,
      rate: todayAttendance.length > 0
        ? ((todayAttendance.filter((a) => a.status === 'PRESENT').length / todayAttendance.length) * 100).toFixed(1)
        : '0',
    }

    // Fee collection stats
    const feeStats = await db.feeInvoice.aggregate({
      where: { student: { schoolId } },
      _sum: {
        totalAmount: true,
        amountPaid: true,
        balance: true,
      },
      _count: true,
    })

    const paidInvoices = await db.feeInvoice.count({
      where: { status: 'PAID', student: { schoolId } },
    })
    const overdueInvoices = await db.feeInvoice.count({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() },
        student: { schoolId },
      },
    })

    // Staff stats
    const totalStaff = await db.staff.count({ where: { schoolId } })
    const activeStaff = await db.staff.count({
      where: { schoolId, isActive: true },
    })
    const teachingStaff = await db.staff.count({
      where: { schoolId, isActive: true, staffType: 'TEACHING' },
    })
    const nonTeachingStaff = await db.staff.count({
      where: { schoolId, isActive: true, staffType: 'NON_TEACHING' },
    })

    // Recent activities (recent students, payments, enrollments)
    const recentStudents = await db.student.findMany({
      where: { schoolId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentNumber: true,
        enrollmentStatus: true,
        createdAt: true,
      },
    })

    const recentPayments = await db.feePayment.findMany({
      where: { student: { schoolId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
    })

    // Boarding stats
    const boardingStudents = await db.student.count({
      where: {
        schoolId,
        enrollmentStatus: 'ACTIVE',
        boardingStatus: 'BOARDER',
      },
    })
    const dayStudents = await db.student.count({
      where: {
        schoolId,
        enrollmentStatus: 'ACTIVE',
        boardingStatus: 'DAY_SCHOLAR',
      },
    })

    // BEAM stats
    const beamStudents = await db.beamApplication.count({
      where: { status: 'APPROVED', student: { schoolId } },
    })

    return NextResponse.json({
      enrollment: {
        total: totalStudents,
        active: activeStudents,
        newThisYear: newStudents,
        boarding: boardingStudents,
        dayScholars: dayStudents,
        beamBeneficiaries: beamStudents,
        byStatus: enrollmentByStatus.reduce((acc: Record<string, number>, item) => {
          acc[item.enrollmentStatus] = item._count.id
          return acc
        }, {}),
      },
      genderDistribution: genderDistribution.reduce((acc: Record<string, number>, item) => {
        acc[item.gender] = item._count.id
        return acc
      }, {}),
      gradeDistribution: gradeStudentCounts,
      attendance: attendanceStats,
      finance: {
        totalInvoiced: feeStats._sum.totalAmount || 0,
        totalCollected: feeStats._sum.amountPaid || 0,
        totalOutstanding: feeStats._sum.balance || 0,
        totalInvoices: feeStats._count,
        paidInvoices,
        overdueInvoices,
        collectionRate: (feeStats._sum.totalAmount || 0) > 0
          ? (((feeStats._sum.amountPaid || 0) / feeStats._sum.totalAmount!) * 100).toFixed(1)
          : '0',
      },
      staff: {
        total: totalStaff,
        active: activeStaff,
        teaching: teachingStaff,
        nonTeaching: nonTeachingStaff,
      },
      recentActivities: {
        students: recentStudents,
        payments: recentPayments,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
