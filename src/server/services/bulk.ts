import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { notifyStudentGuardiansBatch } from '@/lib/notifications'

const VALID_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK']

export async function bulkAttendance(
  schoolId: string,
  body: { classId: string; date: string; records: { studentId: string; status: string; remarks?: string }[] },
) {
  const { classId, date, records } = body
  if (!classId || !date || !records || !Array.isArray(records)) {
    throw new AppError('VALIDATION', 'classId, date, and records array are required')
  }
  if (records.length === 0) throw new AppError('VALIDATION', 'Records array cannot be empty')

  for (let i = 0; i < records.length; i++) {
    if (!records[i].studentId || !records[i].status) {
      throw new AppError('VALIDATION', `Record at index ${i} is missing studentId or status`)
    }
    if (!VALID_ATTENDANCE_STATUSES.includes(records[i].status)) {
      throw new AppError('VALIDATION', `Invalid status '${records[i].status}' at index ${i}. Valid: ${VALID_ATTENDANCE_STATUSES.join(', ')}`)
    }
  }

  const classData = await db.class.findFirst({ where: { id: classId, schoolId }, include: { grade: true } })
  if (!classData) throw new AppError('VALIDATION', 'Invalid class ID')

  const ownedStudents = await db.student.findMany({
    where: { id: { in: records.map((r) => r.studentId) }, schoolId },
    select: { id: true },
  })
  const ownedIds = new Set(ownedStudents.map((s) => s.id))

  const attendanceDate = new Date(date)
  let term = await db.term.findFirst({ where: { startDate: { lte: attendanceDate }, endDate: { gte: attendanceDate } } })
  if (!term) term = await db.term.findFirst({ where: { isCurrent: true } })
  if (!term) throw new AppError('VALIDATION', 'No term found for the given date')

  const dateOnly = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate())

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const record of records) {
    try {
      if (!ownedIds.has(record.studentId)) {
        errors.push(`Student ${record.studentId} does not belong to your school`)
        continue
      }
      const existing = await db.attendance.findFirst({
        where: { studentId: record.studentId, date: dateOnly, termId: term.id },
      })
      if (existing) {
        await db.attendance.update({
          where: { id: existing.id },
          data: { status: record.status as any, remarks: record.remarks ?? existing.remarks },
        })
        updated++
      } else {
        await db.attendance.create({
          data: {
            schoolId,
            studentId: record.studentId,
            termId: term.id,
            date: dateOnly,
            status: record.status as any,
            remarks: record.remarks || null,
            attendanceType: 'DAILY' as any,
          },
        })
        created++
      }
    } catch {
      errors.push(`Failed to process attendance for student ${record.studentId}`)
    }
  }

  const absenceLabel = dateOnly.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  void notifyStudentGuardiansBatch(
    schoolId,
    records
      .filter((r) => r.status === 'ABSENT' && ownedIds.has(r.studentId))
      .map((r) => ({
        studentId: r.studentId,
        eventFactory: (studentName: string) => ({ type: 'attendance.absent' as any, studentName, date: absenceLabel }),
      })),
  ).catch(() => {})

  logAudit({
    action: 'BULK_ATTENDANCE',
    entity: 'Attendance',
    schoolId,
    details: `Recorded attendance for ${created + updated} students in ${classData.name} on ${dateOnly.toISOString().split('T')[0]}`,
  }).catch(() => {})

  return {
    created,
    updated,
    createdCount: created,
    updatedCount: updated,
    success: true,
    errors: errors.length > 0 ? errors : [],
    message: `${created + updated} attendance record${created + updated !== 1 ? 's' : ''} processed (${created} new, ${updated} updated)`,
  }
}

export async function bulkAssignFees(
  schoolId: string,
  body: { feeStructureId: string; gradeIds?: string[]; classIds?: string[]; studentIds?: string[]; academicYearId?: string; termId?: string },
) {
  const { feeStructureId, gradeIds, classIds, studentIds, termId } = body
  if (!feeStructureId) throw new AppError('VALIDATION', 'feeStructureId is required')
  if (!gradeIds && !classIds && !studentIds) throw new AppError('VALIDATION', 'At least one of gradeIds, classIds, or studentIds is required')

  const feeStructure = await db.feeStructure.findUnique({ where: { id: feeStructureId, schoolId }, include: { grade: true } })
  if (!feeStructure) throw new AppError('VALIDATION', 'Invalid fee structure ID')

  let targetTermId = termId
  if (!targetTermId) {
    const currentTerm = await db.term.findFirst({ where: { isCurrent: true, schoolId } })
    if (!currentTerm) throw new AppError('VALIDATION', 'No current term found. Provide termId.')
    targetTermId = currentTerm.id
  }

  const term = await db.term.findUnique({ where: { id: targetTermId, schoolId } })
  if (!term) throw new AppError('VALIDATION', 'Invalid term ID')

  const enrollmentWhere: Record<string, unknown> = { status: 'ACTIVE' as any }
  if (studentIds && studentIds.length > 0) enrollmentWhere.studentId = { in: studentIds }
  else if (classIds && classIds.length > 0) enrollmentWhere.classId = { in: classIds }
  else if (gradeIds && gradeIds.length > 0) enrollmentWhere.class = { gradeId: { in: gradeIds } }

  const enrollments = await db.studentEnrollment.findMany({
    where: enrollmentWhere,
    include: { student: true },
    distinct: ['studentId'],
  })
  if (enrollments.length === 0) throw new AppError('VALIDATION', 'No active students found for the selected criteria')

  const lastInvoice = await db.feeInvoice.findFirst({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  })

  let invoiceCounter = 1
  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/(\d+)$/)
    if (match) invoiceCounter = parseInt(match[1]) + 1
  }

  let created = 0
  let skipped = 0
  let totalAmount = 0
  const errors: string[] = []

  for (const enrollment of enrollments) {
    try {
      const existingInvoice = await db.feeInvoice.findFirst({
        where: {
          studentId: enrollment.studentId,
          termId: targetTermId,
          schoolId,
          items: { some: { feeType: feeStructure.feeType, description: feeStructure.name } },
        },
      })
      if (existingInvoice) {
        skipped++
        continue
      }

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCounter).padStart(4, '0')}`
      invoiceCounter++

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      await db.feeInvoice.create({
        data: {
          studentId: enrollment.studentId,
          termId: targetTermId,
          schoolId,
          invoiceNumber,
          totalAmount: feeStructure.amount as any,
          amountPaid: 0 as any,
          balance: feeStructure.amount as any,
          dueDate,
          status: 'PENDING' as any,
          items: {
            create: { description: feeStructure.name, amount: feeStructure.amount as any, feeType: feeStructure.feeType, schoolId },
          },
        },
      })

      created++
      totalAmount += Number(feeStructure.amount)
    } catch {
      errors.push(`Failed to create invoice for ${enrollment.student.firstName} ${enrollment.student.lastName}`)
    }
  }

  logAudit({
    action: 'BULK_FEE_ASSIGNMENT',
    entity: 'FeeInvoice',
    schoolId,
    details: `Assigned ${feeStructure.name} (${feeStructure.feeType}) to ${created} students. Total: $${totalAmount.toFixed(2)}`,
  }).catch(() => {})

  return {
    created,
    createdCount: created,
    skipped,
    totalAmount,
    success: true,
    errors: errors.length > 0 ? errors : [],
    message: `${created} invoice${created !== 1 ? 's' : ''} created for ${feeStructure.name}, ${skipped} skipped (already invoiced). Total: $${totalAmount.toFixed(2)}`,
  }
}

export async function bulkPromote(
  schoolId: string,
  body: { fromGradeId: string; toGradeId: string; studentIds?: string[]; academicYearId: string; promoteAll?: boolean },
) {
  const { fromGradeId, toGradeId, studentIds, academicYearId, promoteAll } = body
  if (!fromGradeId || !toGradeId || !academicYearId) throw new AppError('VALIDATION', 'fromGradeId, toGradeId, and academicYearId are required')

  const fromGrade = await db.grade.findFirst({ where: { id: fromGradeId, schoolId } })
  const toGrade = await db.grade.findFirst({ where: { id: toGradeId, schoolId } })
  if (!fromGrade || !toGrade) throw new AppError('VALIDATION', 'Invalid grade IDs')

  const academicYear = await db.academicYear.findFirst({ where: { id: academicYearId, schoolId } })
  if (!academicYear) throw new AppError('VALIDATION', 'Invalid academic year ID')

  const where: Record<string, unknown> = { status: 'ACTIVE' as any, class: { gradeId: fromGradeId }, student: { schoolId } }
  if (!promoteAll && studentIds && studentIds.length > 0) where.studentId = { in: studentIds }

  const studentsToPromote = await db.studentEnrollment.findMany({ where, include: { student: true, class: true } })
  if (studentsToPromote.length === 0) throw new AppError('VALIDATION', 'No active students found in the source grade')

  const targetClasses = await db.class.findMany({ where: { gradeId: toGradeId, isActive: true, schoolId } })
  if (targetClasses.length === 0) throw new AppError('VALIDATION', 'No active classes found in the target grade. Create classes first.')

  let promoted = 0
  let failed = 0
  const errors: string[] = []

  for (const enrollment of studentsToPromote) {
    try {
      const existingEnrollment = await db.studentEnrollment.findUnique({
        where: { studentId_academicYearId: { studentId: enrollment.studentId, academicYearId } },
      })
      if (existingEnrollment) {
        errors.push(`${enrollment.student.firstName} ${enrollment.student.lastName} already enrolled for academic year ${academicYear.name}`)
        failed++
        continue
      }

      let targetClass = targetClasses.find((c) => c.stream === enrollment.class.stream)
      if (!targetClass) targetClass = targetClasses[0]

      await db.studentEnrollment.create({
        data: {
          schoolId,
          studentId: enrollment.studentId,
          classId: targetClass.id,
          academicYearId,
          enrollmentDate: new Date(),
          status: 'ACTIVE' as any,
        },
      })

      await db.studentEnrollment.update({
        where: { id: enrollment.id },
        data: { exitDate: new Date(), status: 'PROMOTED' as any },
      })

      promoted++
    } catch {
      errors.push(`Failed to promote ${enrollment.student.firstName} ${enrollment.student.lastName}`)
      failed++
    }
  }

  logAudit({
    action: 'BULK_PROMOTE',
    entity: 'StudentEnrollment',
    schoolId,
    details: `Promoted ${promoted} students from ${fromGrade.name} to ${toGrade.name} for ${academicYear.name}`,
  }).catch(() => {})

  return {
    promoted,
    promotedCount: promoted,
    failed,
    success: true,
    errors: errors.length > 0 ? errors : [],
    message: `${promoted} student${promoted !== 1 ? 's' : ''} promoted from ${fromGrade.name} to ${toGrade.name}`,
  }
}

export function handleBulkError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
