import 'server-only'
import { db } from '@/lib/db'

export async function getDashboardMetrics(schoolId: string) {
  const [totalStudents, activeStudents, newStudents, enrollmentByStatus, genderDistribution, gradeDistribution, classes] =
    await Promise.all([
      db.student.count({ where: { schoolId } }),
      db.student.count({ where: { schoolId, enrollmentStatus: 'ACTIVE' } }),
      db.student.count({
        where: { schoolId, enrollmentStatus: 'ACTIVE', admissionDate: { gte: new Date(new Date().getFullYear(), 0, 1) } },
      }),
      db.student.groupBy({ by: ['enrollmentStatus'], where: { schoolId }, _count: { id: true } }),
      db.student.groupBy({ by: ['gender'], _count: { id: true }, where: { schoolId, enrollmentStatus: 'ACTIVE' } }),
      db.studentEnrollment.groupBy({
        by: ['classId'],
        where: { status: 'ACTIVE', student: { schoolId } },
        _count: { studentId: true },
      }),
      db.class.findMany({ where: { isActive: true, schoolId }, include: { grade: true } }),
    ])

  const gradeMap = new Map(classes.map((c) => [c.id, c.grade.name]))
  const gradeStudentCounts: Record<string, number> = {}
  for (const gc of gradeDistribution) {
    const gradeName = gradeMap.get(gc.classId) || 'Unknown'
    gradeStudentCounts[gradeName] = (gradeStudentCounts[gradeName] || 0) + gc._count.studentId
  }

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayAttendance = await db.attendance.findMany({
    where: { date: { gte: today, lt: tomorrow }, student: { schoolId } },
  })

  const attendanceStats = {
    total: todayAttendance.length,
    present: todayAttendance.filter((a) => a.status === 'PRESENT').length,
    absent: todayAttendance.filter((a) => a.status === 'ABSENT').length,
    late: todayAttendance.filter((a) => a.status === 'LATE').length,
    rate:
      todayAttendance.length > 0
        ? (
            (todayAttendance.filter((a) => a.status === 'PRESENT').length / todayAttendance.length) *
            100
          ).toFixed(1)
        : '0',
  }

  const [feeStats, paidInvoices, overdueInvoices, totalStaff, activeStaff, teachingStaff, nonTeachingStaff] =
    await Promise.all([
      db.feeInvoice.aggregate({
        where: { student: { schoolId } },
        _sum: { totalAmount: true, amountPaid: true, balance: true },
        _count: true,
      }),
      db.feeInvoice.count({ where: { status: 'PAID', student: { schoolId } } }),
      db.feeInvoice.count({
        where: { status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: new Date() }, student: { schoolId } },
      }),
      db.staff.count({ where: { schoolId } }),
      db.staff.count({ where: { schoolId, isActive: true } }),
      db.staff.count({ where: { schoolId, isActive: true, staffType: 'TEACHING' } }),
      db.staff.count({ where: { schoolId, isActive: true, staffType: 'NON_TEACHING' } }),
    ])

  const [recentStudents, recentPayments, boardingStudents, dayStudents, beamStudents] = await Promise.all([
    db.student.findMany({
      where: { schoolId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, studentNumber: true, enrollmentStatus: true, createdAt: true },
    }),
    db.feePayment.findMany({
      where: { student: { schoolId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { firstName: true, lastName: true, studentNumber: true } } },
    }),
    db.student.count({ where: { schoolId, enrollmentStatus: 'ACTIVE', boardingStatus: 'BOARDER' } }),
    db.student.count({ where: { schoolId, enrollmentStatus: 'ACTIVE', boardingStatus: 'DAY_SCHOLAR' } }),
    db.beamApplication.count({ where: { status: 'APPROVED', student: { schoolId } } }),
  ])

  const ti = Number(feeStats._sum.totalAmount ?? 0)
  const tc = Number(feeStats._sum.amountPaid ?? 0)
  const to = Number(feeStats._sum.balance ?? 0)

  return {
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
      totalInvoiced: ti,
      totalCollected: tc,
      totalOutstanding: to,
      totalInvoices: feeStats._count,
      paidInvoices,
      overdueInvoices,
      collectionRate: ti > 0 ? ((tc / ti) * 100).toFixed(1) : '0',
    },
    staff: { total: totalStaff, active: activeStaff, teaching: teachingStaff, nonTeaching: nonTeachingStaff },
    recentActivities: { students: recentStudents, payments: recentPayments },
  }
}
