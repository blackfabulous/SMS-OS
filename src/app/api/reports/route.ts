import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireContext } from '@/server/context'

export async function GET(request: Request) {
  // Management reporting (finance/HR/welfare aggregates) — restrict to staff.
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN', 'BURSAR'] })
  if ('error' in result) return result.error
  const { schoolId } = result.ctx

  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'

    const school = await db.school.findUnique({ where: { id: schoolId } })

    switch (reportType) {
      case 'academic': {
        // Academic report data
        const [grades, subjects, assessments] = await Promise.all([
          db.grade.findMany({
            where: { schoolId: school?.id },
            include: {
              classes: { include: { enrollments: true } },
            },
          }),
          db.subject.findMany({ where: { schoolId: school?.id } }),
          db.assessment.findMany({
            where: { schoolId: school?.id },
            include: { marks: true, subject: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
        ])

        // Subject pass rates
        const subjectPerformance = subjects.map((subject) => {
          const subjectAssessments = assessments.filter((a) => a.subjectId === subject.id)
          // Build mark entries with their assessment's total marks for pass rate calculation
          const markEntries = subjectAssessments.flatMap((a) =>
            a.marks.map((m) => ({ marksObtained: m.marksObtained, totalMarks: a.totalMarks }))
          )
          const passCount = markEntries.filter((m) => (m.marksObtained / m.totalMarks) * 100 >= subject.passMark).length
          const totalEntries = markEntries.length
          return {
            subject: subject.name,
            code: subject.code,
            totalEntries,
            passRate: totalEntries > 0 ? Math.round((passCount / totalEntries) * 100) : 0,
            avgMarks: totalEntries > 0 ? Math.round(markEntries.reduce((sum, m) => sum + m.marksObtained, 0) / totalEntries) : 0,
          }
        })

        // Grade enrollment
        const gradeData = grades.map((g) => ({
          grade: g.name,
          students: g.classes.reduce((sum, c) => sum + c.enrollments.length, 0),
          classes: g.classes.length,
        }))

        return NextResponse.json({
          type: 'academic',
          gradeData,
          subjectPerformance,
          totalAssessments: assessments.length,
          totalSubjects: subjects.length,
        })
      }

      case 'finance': {
        const [invoices, payments] = await Promise.all([
          db.feeInvoice.findMany({
            where: { student: { schoolId } },
            include: { student: true, items: true },
          }),
          db.feePayment.findMany({
            where: { student: { schoolId } },
            include: { student: true },
          }),
        ])

        const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0)
        const totalCollected = payments.reduce((s, p) => s + p.amount, 0)
        const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)

        // Payment methods breakdown
        const methodBreakdown: Record<string, number> = {}
        payments.forEach((p) => {
          methodBreakdown[p.paymentMethod] = (methodBreakdown[p.paymentMethod] || 0) + p.amount
        })

        // Invoice status breakdown
        const statusBreakdown: Record<string, number> = {}
        invoices.forEach((i) => {
          statusBreakdown[i.status] = (statusBreakdown[i.status] || 0) + 1
        })

        return NextResponse.json({
          type: 'finance',
          totalInvoiced,
          totalCollected,
          totalOutstanding,
          collectionRate: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0,
          debtorCount: invoices.filter((i) => i.balance > 0).length,
          methodBreakdown: Object.entries(methodBreakdown).map(([method, amount]) => ({ method, amount })),
          statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
          totalInvoices: invoices.length,
          totalPayments: payments.length,
        })
      }

      case 'hr': {
        const [staff, payslips, leaveRecords] = await Promise.all([
          db.staff.findMany({ where: { schoolId } }),
          db.payslip.findMany({ where: { staff: { schoolId } }, take: 50, orderBy: { createdAt: 'desc' } }),
          db.leaveRecord.findMany({ where: { staff: { schoolId } }, take: 50, orderBy: { createdAt: 'desc' } }),
        ])

        const staffByType: Record<string, number> = {}
        staff.forEach((s) => {
          staffByType[s.staffType] = (staffByType[s.staffType] || 0) + 1
        })

        const totalPayroll = payslips.reduce((s, p) => s + p.netPay, 0)

        return NextResponse.json({
          type: 'hr',
          totalStaff: staff.length,
          staffByType: Object.entries(staffByType).map(([type, count]) => ({ type, count })),
          totalPayroll,
          payslipsGenerated: payslips.length,
          leaveRecords: leaveRecords.length,
          pendingLeave: leaveRecords.filter((l) => l.status === 'PENDING').length,
        })
      }

      case 'welfare': {
        const [welfareRecords, beamApps, disciplineRecords] = await Promise.all([
          db.welfareRecord.findMany({ where: { student: { schoolId } }, include: { student: true } }),
          db.beamApplication.findMany({ where: { student: { schoolId } }, include: { student: true } }),
          db.disciplineRecord.findMany({ where: { student: { schoolId } }, take: 50, orderBy: { createdAt: 'desc' } }),
        ])

        const welfareByCategory: Record<string, number> = {}
        welfareRecords.forEach((w) => {
          welfareByCategory[w.category] = (welfareByCategory[w.category] || 0) + 1
        })

        return NextResponse.json({
          type: 'welfare',
          totalCases: welfareRecords.length,
          beamBeneficiaries: beamApps.filter((b) => b.status === 'APPROVED').length,
          beamPending: beamApps.filter((b) => b.status === 'APPLIED').length,
          beamCovered: beamApps.reduce((s, b) => s + b.coveredAmount, 0),
          welfareByCategory: Object.entries(welfareByCategory).map(([cat, count]) => ({ category: cat, count })),
          disciplineIncidents: disciplineRecords.length,
          openCases: welfareRecords.filter((w) => w.status === 'OPEN').length,
        })
      }

      case 'emis': {
        const [students, staff, assets, books] = await Promise.all([
          db.student.findMany({ where: { schoolId: school?.id } }),
          db.staff.findMany({ where: { schoolId: school?.id } }),
          db.asset.findMany({ where: { schoolId: school?.id } }),
          db.libraryBook.findMany({ where: { schoolId: school?.id } }),
        ])

        const genderDist: Record<string, number> = {}
        students.forEach((s) => {
          genderDist[s.gender] = (genderDist[s.gender] || 0) + 1
        })

        return NextResponse.json({
          type: 'emis',
          schoolInfo: school ? {
            name: school.name,
            code: school.code,
            province: school.province,
            district: school.mopseDistrict,
            type: school.schoolType,
            level: school.levelType,
          } : null,
          enrollment: {
            total: students.length,
            male: genderDist['MALE'] || 0,
            female: genderDist['FEMALE'] || 0,
            boarders: students.filter((s) => s.boardingStatus === 'BOARDER').length,
            dayScholars: students.filter((s) => s.boardingStatus === 'DAY_SCHOLAR').length,
            beam: students.filter((s) => s.beamStatus === 'APPROVED').length,
          },
          teacherData: {
            total: staff.length,
            teaching: staff.filter((s) => s.staffType === 'TEACHING').length,
            nonTeaching: staff.filter((s) => s.staffType !== 'TEACHING').length,
          },
          infrastructure: {
            totalAssets: assets.length,
            goodCondition: assets.filter((a) => a.condition === 'GOOD' || a.condition === 'NEW').length,
            fairCondition: assets.filter((a) => a.condition === 'FAIR').length,
            poorCondition: assets.filter((a) => a.condition === 'POOR').length,
          },
          textbookData: {
            totalBooks: books.reduce((s, b) => s + b.totalCopies, 0),
            available: books.reduce((s, b) => s + b.availableCopies, 0),
            categories: [...new Set(books.map((b) => b.category).filter(Boolean))].length,
          },
        })
      }

      default: {
        // Overview - quick summary
        const [studentCount, staffCount, invoiceData] = await Promise.all([
          db.student.count({ where: { schoolId: school?.id } }),
          db.staff.count({ where: { schoolId: school?.id } }),
          db.feeInvoice.aggregate({ where: { student: { schoolId } }, _sum: { totalAmount: true, amountPaid: true } }),
        ])

        return NextResponse.json({
          type: 'overview',
          students: studentCount,
          staff: staffCount,
          totalInvoiced: Number(invoiceData._sum.totalAmount ?? 0),
          totalCollected: Number(invoiceData._sum.amountPaid ?? 0),
        })
      }
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
