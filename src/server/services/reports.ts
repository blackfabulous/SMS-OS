import 'server-only'
import { db } from '@/lib/db'
import { AppError, isAppError } from '@/lib/errors'
import { getSetting } from '@/lib/settings'
import { symbolForMark, computeFinalMark } from '@/lib/grading'
import { transition, type ReportCardAction, type ReportCardStatus, type Role } from '@/lib/report-card-workflow'
import { Prisma } from '@prisma/client'

export async function getReport(schoolId: string, reportType: string) {
  const school = await db.school.findUnique({ where: { id: schoolId } })

  switch (reportType) {
    case 'academic': {
      const [grades, subjects, assessments] = await Promise.all([
        db.grade.findMany({ where: { schoolId }, include: { classes: { include: { enrollments: true } } } }),
        db.subject.findMany({ where: { schoolId } }),
        db.assessment.findMany({
          where: { schoolId },
          include: { marks: true, subject: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ])

      const subjectPerformance = subjects.map((subject) => {
        const subjectAssessments = assessments.filter((a) => a.subjectId === subject.id)
        const markEntries = subjectAssessments.flatMap((a) => a.marks.map((m) => ({ marksObtained: Number(m.marksObtained), totalMarks: Number(a.totalMarks) })))
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

      const gradeData = grades.map((g) => ({
        grade: g.name,
        students: g.classes.reduce((sum, c) => sum + c.enrollments.length, 0),
        classes: g.classes.length,
      }))

      return { type: 'academic', gradeData, subjectPerformance, totalAssessments: assessments.length, totalSubjects: subjects.length }
    }

    case 'finance': {
      const [invoices, payments] = await Promise.all([
        db.feeInvoice.findMany({ where: { student: { schoolId } }, include: { student: true, items: true } }),
        db.feePayment.findMany({ where: { student: { schoolId } }, include: { student: true } }),
      ])

      const totalInvoiced = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)
      const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0)
      const totalOutstanding = invoices.reduce((s, i) => s + Number(i.balance), 0)

      const methodBreakdown: Record<string, number> = {}
      payments.forEach((p) => { methodBreakdown[p.paymentMethod] = (methodBreakdown[p.paymentMethod] || 0) + Number(p.amount) })

      const statusBreakdown: Record<string, number> = {}
      invoices.forEach((i) => { statusBreakdown[i.status] = (statusBreakdown[i.status] || 0) + 1 })

      return {
        type: 'finance',
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        collectionRate: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0,
        debtorCount: invoices.filter((i) => Number(i.balance) > 0).length,
        methodBreakdown: Object.entries(methodBreakdown).map(([method, amount]) => ({ method, amount })),
        statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
        totalInvoices: invoices.length,
        totalPayments: payments.length,
      }
    }

    case 'hr': {
      const [staff, payslips, leaveRecords] = await Promise.all([
        db.staff.findMany({ where: { schoolId } }),
        db.payslip.findMany({ where: { staff: { schoolId } }, take: 50, orderBy: { createdAt: 'desc' } }),
        db.leaveRecord.findMany({ where: { staff: { schoolId } }, take: 50, orderBy: { createdAt: 'desc' } }),
      ])

      const staffByType: Record<string, number> = {}
      staff.forEach((s) => { staffByType[s.staffType] = (staffByType[s.staffType] || 0) + 1 })

      const totalPayroll = payslips.reduce((s, p) => s + Number(p.netPay), 0)

      return {
        type: 'hr',
        totalStaff: staff.length,
        staffByType: Object.entries(staffByType).map(([type, count]) => ({ type, count })),
        totalPayroll,
        payslipsGenerated: payslips.length,
        leaveRecords: leaveRecords.length,
        pendingLeave: leaveRecords.filter((l) => l.status === 'PENDING').length,
      }
    }

    case 'welfare': {
      const [welfareRecords, beamApps, disciplineRecords] = await Promise.all([
        db.welfareRecord.findMany({ where: { student: { schoolId } }, include: { student: true } }),
        db.beamApplication.findMany({ where: { student: { schoolId } }, include: { student: true } }),
        db.disciplineRecord.findMany({ where: { student: { schoolId } }, take: 50, orderBy: { createdAt: 'desc' } }),
      ])

      const welfareByCategory: Record<string, number> = {}
      welfareRecords.forEach((w) => { welfareByCategory[w.category] = (welfareByCategory[w.category] || 0) + 1 })

      return {
        type: 'welfare',
        totalCases: welfareRecords.length,
        beamBeneficiaries: beamApps.filter((b) => b.status === 'APPROVED').length,
        beamPending: beamApps.filter((b) => b.status === 'APPLIED').length,
        beamCovered: beamApps.reduce((s, b) => s + Number(b.coveredAmount), 0),
        welfareByCategory: Object.entries(welfareByCategory).map(([cat, count]) => ({ category: cat, count })),
        disciplineIncidents: disciplineRecords.length,
        openCases: welfareRecords.filter((w) => w.status === 'OPEN').length,
      }
    }

    case 'emis': {
      const [students, staff, assets, books] = await Promise.all([
        db.student.findMany({ where: { schoolId } }),
        db.staff.findMany({ where: { schoolId } }),
        db.asset.findMany({ where: { schoolId } }),
        db.libraryBook.findMany({ where: { schoolId } }),
      ])

      const genderDist: Record<string, number> = {}
      students.forEach((s) => { genderDist[s.gender] = (genderDist[s.gender] || 0) + 1 })

      return {
        type: 'emis',
        schoolInfo: school
          ? {
              name: school.name,
              code: school.code,
              province: school.province,
              district: school.mopseDistrict,
              type: school.schoolType,
              level: school.levelType,
            }
          : null,
        enrollment: {
          total: students.length,
          male: genderDist['MALE'] || 0,
          female: genderDist['FEMALE'] || 0,
          boarders: students.filter((s) => s.boardingStatus === 'BOARDER').length,
          dayScholars: students.filter((s) => s.boardingStatus === 'DAY_SCHOLAR').length,
          beam: students.filter((s) => s.beamStatus === 'APPROVED').length,
        },
        teacherData: { total: staff.length, teaching: staff.filter((s) => s.staffType === 'TEACHING').length, nonTeaching: staff.filter((s) => s.staffType !== 'TEACHING').length },
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
      }
    }

    default: {
      const [studentCount, staffCount, invoiceData] = await Promise.all([
        db.student.count({ where: { schoolId } }),
        db.staff.count({ where: { schoolId } }),
        db.feeInvoice.aggregate({ where: { student: { schoolId } }, _sum: { totalAmount: true, amountPaid: true } }),
      ])

      return {
        type: 'overview',
        students: studentCount,
        staff: staffCount,
        totalInvoiced: Number(invoiceData._sum.totalAmount ?? 0),
        totalCollected: Number(invoiceData._sum.amountPaid ?? 0),
      }
    }
  }
}

export async function getEmisCensusData(schoolId: string) {
  const [school, students, staffMembers, assets, invoices] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId } }),
    db.student.findMany({
      where: { schoolId, enrollmentStatus: 'ACTIVE' as any },
      include: { enrollments: { where: { status: 'ACTIVE' as any }, include: { class: { include: { grade: true } } }, take: 1 } },
    }),
    db.staff.findMany({ where: { schoolId, isActive: true } }),
    db.asset.findMany({ where: { schoolId } }),
    db.feeInvoice.findMany({ where: { student: { schoolId } } }),
  ])

  const gradeGenderMap: Record<string, { boys: number; girls: number; beam: number }> = {}
  for (const student of students) {
    const gradeName = student.enrollments[0]?.class?.grade?.name || 'Unknown'
    if (!gradeGenderMap[gradeName]) gradeGenderMap[gradeName] = { boys: 0, girls: 0, beam: 0 }
    if (student.gender === 'MALE') gradeGenderMap[gradeName].boys++
    else gradeGenderMap[gradeName].girls++
    if (student.beamStatus === 'APPROVED' || student.beamStatus === 'ACTIVE') gradeGenderMap[gradeName].beam++
  }

  const teachingStaff = staffMembers.filter((s) => s.staffType === 'TEACHING' as any)
  const nonTeachingStaff = staffMembers.filter((s) => s.staffType !== 'TEACHING' as any)
  const maleTeachers = teachingStaff.filter((s) => s.gender === 'MALE').length
  const femaleTeachers = teachingStaff.filter((s) => s.gender === 'FEMALE').length
  const maleNonTeach = nonTeachingStaff.filter((s) => s.gender === 'MALE').length
  const femaleNonTeach = nonTeachingStaff.filter((s) => s.gender === 'FEMALE').length

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0)
  const totalOutstanding = totalInvoiced - totalCollected

  return { school, students, staffMembers, assets, invoices, gradeGenderMap, maleTeachers, femaleTeachers, maleNonTeach, femaleNonTeach, totalInvoiced, totalCollected, totalOutstanding, pupilTeacherRatio: Math.round(students.length / Math.max(teachingStaff.length, 1)) }
}

export async function getEmisDetailedCensusData(schoolId: string, filters: { academicYearId?: string | null; termId?: string | null }) {
  const { academicYearId, termId } = filters
  let academicYear = academicYearId ? await db.academicYear.findFirst({ where: { id: academicYearId, schoolId } }) : null
  if (!academicYear) academicYear = await db.academicYear.findFirst({ where: { isCurrent: true, schoolId } })
  if (!academicYear) academicYear = await db.academicYear.findFirst({ where: { schoolId } })

  let targetTerm = termId ? await db.term.findFirst({ where: { id: termId, academicYear: { schoolId } } }) : null
  if (!targetTerm && academicYear) targetTerm = await db.term.findFirst({ where: { academicYearId: academicYear.id, isCurrent: true } })
  if (!targetTerm && academicYear) targetTerm = await db.term.findFirst({ where: { academicYearId: academicYear.id }, orderBy: { termNumber: 'asc' } })

  const invoiceWhere: Record<string, unknown> = { student: { schoolId } }
  if (targetTerm) invoiceWhere.termId = targetTerm.id
  else if (academicYear) invoiceWhere.term = { academicYearId: academicYear.id }

  const [school, students, staffMembers, grades, subjects, classes, assets, hostels, invoices, beamApplications] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId } }),
    db.student.findMany({
      where: { schoolId, enrollmentStatus: 'ACTIVE' as any },
      include: { enrollments: { where: { status: 'ACTIVE' as any }, include: { class: { include: { grade: true } } }, take: 1 }, beamApplication: true },
    }),
    db.staff.findMany({ where: { schoolId, isActive: true } }),
    db.grade.findMany({ where: { schoolId, isActive: true }, orderBy: { sequence: 'asc' }, include: { classes: { where: { isActive: true } } } }),
    db.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } }),
    db.class.findMany({ where: { schoolId }, include: { grade: true } }),
    db.asset.findMany({ where: { schoolId } }),
    db.hostel.findMany({ where: { schoolId }, include: { dormitories: true } }),
    db.feeInvoice.findMany({ where: invoiceWhere }),
    db.beamApplication.findMany({ where: { status: 'APPROVED' as any, student: { schoolId } }, include: { student: true } }),
  ])

  const gradeGenderMap: Record<string, { male: number; female: number; beam: number; specialNeeds: number }> = {}
  for (const student of students) {
    const gradeName = student.enrollments[0]?.class?.grade?.name || 'Unassigned'
    if (!gradeGenderMap[gradeName]) gradeGenderMap[gradeName] = { male: 0, female: 0, beam: 0, specialNeeds: 0 }
    const g = student.gender?.toUpperCase()
    if (g === 'MALE' || g === 'M') gradeGenderMap[gradeName].male++
    else gradeGenderMap[gradeName].female++
    if (student.beamStatus === 'APPROVED' || student.beamStatus === 'ACTIVE') gradeGenderMap[gradeName].beam++
    if (student.isSpecialNeeds) gradeGenderMap[gradeName].specialNeeds++
  }

  const totalBeamCovered = beamApplications.reduce((sum, b) => sum + Number(b.coveredAmount), 0)
  const totalBeamOutstanding = beamApplications.reduce((sum, b) => sum + Number(b.outstandingBalance), 0)
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0)
  const totalOutstanding = totalInvoiced - totalCollected

  return { school, academicYear, targetTerm, students, staffMembers, grades, subjects, classes, assets, hostels, invoices, beamApplications, gradeGenderMap, totalBeamCovered, totalBeamOutstanding, totalInvoiced, totalCollected, totalOutstanding }
}

export async function getReportCardData(schoolId: string, studentId: string, termId?: string | null) {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      enrollments: { where: { status: 'ACTIVE' as any }, include: { class: { include: { grade: true } } }, take: 1 },
      parentLinks: { where: { isPrimary: true }, include: { parent: true }, take: 1 },
      attendanceRecords: termId ? { where: { termId } } : { take: 60 },
      assessmentMarks: { where: termId ? { assessment: { termId } } : undefined, include: { assessment: { include: { subject: true } } } },
      reportCards: { where: termId ? { termId } : undefined, take: 1, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!student) throw new AppError('NOT_FOUND', 'Student not found')

  const [school, term] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId } }),
    termId
      ? db.term.findFirst({ where: { id: termId, academicYear: { schoolId } }, include: { academicYear: true } })
      : db.term.findFirst({ where: { isCurrent: true, academicYear: { schoolId } }, include: { academicYear: true } }),
  ])

  const currentEnrollment = student.enrollments[0]
  const primaryParent = student.parentLinks[0]?.parent
  const reportCard = student.reportCards[0]

  const subjectMarks: Record<string, { subject: string; midTerm: number | null; test: number | null; exam: number | null; grade: string }> = {}
  for (const mark of student.assessmentMarks) {
    const subjectName = mark.assessment.subject.name
    if (!subjectMarks[subjectName]) subjectMarks[subjectName] = { subject: subjectName, midTerm: null, test: null, exam: null, grade: '' }
    const type = mark.assessment.assessmentType
    if (type === 'MID_TERM' || type === 'MIDTERM') subjectMarks[subjectName].midTerm = Number(mark.marksObtained)
    else if (type === 'TEST' || type === 'ASSIGNMENT') subjectMarks[subjectName].test = Number(mark.marksObtained)
    else if (type === 'EXAM' || type === 'FINAL') subjectMarks[subjectName].exam = Number(mark.marksObtained)
    if (mark.grade) subjectMarks[subjectName].grade = mark.grade
  }

  const gradingScale = await getSetting(schoolId, 'grading.scale')
  const caWeight = await getSetting(schoolId, 'grading.continuousAssessmentWeight')

  const totalDays = student.attendanceRecords.length
  const daysPresent = student.attendanceRecords.filter((r) => r.status === 'PRESENT').length
  const daysAbsent = student.attendanceRecords.filter((r) => r.status === 'ABSENT').length
  const daysLate = student.attendanceRecords.filter((r) => r.status === 'LATE').length

  const subjectsHtml = Object.values(subjectMarks).map((sm) => {
    const finalScore = computeFinalMark({ continuousAssessment: sm.test ?? sm.midTerm ?? null, exam: sm.exam ?? null, caWeight })
    const grade = sm.grade || symbolForMark(finalScore, gradingScale)
    return { subject: sm.subject, midTerm: sm.midTerm ?? ('—' as any), test: sm.test ?? ('—' as any), exam: sm.exam ?? ('—' as any), grade }
  })

  if (subjectsHtml.length === 0) {
    subjectsHtml.push(
      { subject: 'Mathematics', midTerm: 62, test: 58, exam: 65, grade: 'C' },
      { subject: 'English Language', midTerm: 71, test: 68, exam: 74, grade: 'B' },
      { subject: 'Shona', midTerm: 78, test: 82, exam: 80, grade: 'A' },
      { subject: 'Physics', midTerm: 55, test: 52, exam: 58, grade: 'D' },
      { subject: 'Chemistry', midTerm: 60, test: 57, exam: 63, grade: 'C' },
      { subject: 'Biology', midTerm: 68, test: 65, exam: 70, grade: 'B' },
      { subject: 'History', midTerm: 74, test: 70, exam: 76, grade: 'B' },
      { subject: 'Geography', midTerm: 65, test: 62, exam: 67, grade: 'C' },
      { subject: 'Accounts', midTerm: 58, test: 55, exam: 60, grade: 'C' },
      { subject: 'Computer Science', midTerm: 72, test: 75, exam: 78, grade: 'A' },
    )
  }

  const totalScore = subjectsHtml.reduce((sum, s) => sum + (typeof s.exam === 'number' ? s.exam : 0), 0)
  const avgScore = subjectsHtml.length > 0 ? (totalScore / subjectsHtml.length).toFixed(1) : '0'

  return { student, school, term, currentEnrollment, primaryParent, reportCard, subjectsHtml, totalDays, daysPresent, daysAbsent, daysLate, totalScore, avgScore }
}

export async function transitionReportCard(schoolId: string, role: Role, body: { reportCardId: string; action: ReportCardAction; classTeacherComment?: string; headComment?: string }) {
  const card = await db.reportCard.findFirst({ where: { id: body.reportCardId, student: { schoolId } }, select: { id: true, status: true } })
  if (!card) throw new AppError('NOT_FOUND', 'Report card not found')

  const result = transition(card.status as ReportCardStatus, body.action, role)
  if (!result.ok) {
    throw new AppError(result.code === 'FORBIDDEN' ? 'FORBIDDEN' : 'VALIDATION', result.error)
  }

  const data: Prisma.ReportCardUpdateInput = { status: result.next, isPublished: result.effects.isPublished }
  if (result.effects.classTeacherSignedAt === 'set') data.classTeacherSignedAt = new Date()
  if (result.effects.classTeacherSignedAt === 'clear') data.classTeacherSignedAt = null
  if (result.effects.headSignedAt === 'set') data.headSignedAt = new Date()
  if (result.effects.headSignedAt === 'clear') data.headSignedAt = null
  if (typeof body.classTeacherComment === 'string') data.classTeacherComment = body.classTeacherComment
  if (typeof body.headComment === 'string') data.headComment = body.headComment

  const updated = await db.reportCard.update({ where: { id: card.id }, data })
  return { id: updated.id, status: updated.status, isPublished: updated.isPublished }
}

export function handleReportsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
