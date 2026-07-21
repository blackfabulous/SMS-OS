import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface MigrationStudent {
  studentNumber: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  nationalId?: string
  email?: string
  phone?: string
  gradeName?: string
  enrollmentStatus?: string
  boardingStatus?: string
  [key: string]: unknown
}

interface MigrationStaff {
  staffNumber: string
  firstName: string
  lastName: string
  position?: string
  department?: string
  email?: string
  phone?: string
  staffType?: string
  qualifications?: string
  subjectSpecialisation?: string
  [key: string]: unknown
}

interface MigrationGrade {
  name: string
  level?: string
  sequence?: number
  [key: string]: unknown
}

interface MigrationClass {
  name: string
  gradeName?: string
  stream?: string
  capacity?: number
  academicYear?: string
  [key: string]: unknown
}

interface MigrationSubject {
  code: string
  name: string
  department?: string
  isCore?: boolean
  passMark?: number
  [key: string]: unknown
}

interface MigrationPayload {
  students?: MigrationStudent[]
  staff?: MigrationStaff[]
  grades?: MigrationGrade[]
  classes?: MigrationClass[]
  subjects?: MigrationSubject[]
}

export async function importData(schoolId: string, body: MigrationPayload) {
  const school = await db.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new AppError('FORBIDDEN', 'No school configured. Run setup wizard first.')

  const imported = { students: 0, staff: 0, grades: 0, classes: 0, subjects: 0 }
  let skipped = 0
  const errors: string[] = []

  if (body.students && Array.isArray(body.students)) {
    for (const student of body.students) {
      try {
        if (!student.studentNumber || !student.firstName || !student.lastName) {
          skipped++
          errors.push(`Student skipped: missing required fields for entry: ${JSON.stringify(student).slice(0, 100)}`)
          continue
        }
        const existing = await db.student.findFirst({ where: { studentNumber: student.studentNumber, schoolId: school.id } })
        if (existing) {
          skipped++
          errors.push(`Student skipped: duplicate studentNumber "${student.studentNumber}"`)
          continue
        }
        await db.student.create({
          data: {
            schoolId: school.id,
            studentNumber: student.studentNumber,
            firstName: student.firstName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : new Date(),
            gender: student.gender === 'FEMALE' ? 'FEMALE' : student.gender === 'MALE' ? 'MALE' : 'OTHER',
            nationalId: student.nationalId || null,
            enrollmentStatus: (student.enrollmentStatus as any) || 'ACTIVE',
            boardingStatus: (student.boardingStatus as any) || null,
          },
        })
        imported.students++
      } catch (err) {
        skipped++
        errors.push(`Student error: ${err instanceof Error ? err.message : 'Unknown error'} for ${student.studentNumber || 'unknown'}`)
      }
    }
  }

  if (body.staff && Array.isArray(body.staff)) {
    for (const staffMember of body.staff) {
      try {
        if (!staffMember.staffNumber || !staffMember.firstName || !staffMember.lastName) {
          skipped++
          errors.push(`Staff skipped: missing required fields for entry: ${JSON.stringify(staffMember).slice(0, 100)}`)
          continue
        }
        const existing = await db.staff.findFirst({ where: { staffNumber: staffMember.staffNumber, schoolId: school.id } })
        if (existing) {
          skipped++
          errors.push(`Staff skipped: duplicate staffNumber "${staffMember.staffNumber}"`)
          continue
        }
        if (staffMember.email) {
          const existingEmail = await db.staff.findFirst({ where: { email: staffMember.email } })
          if (existingEmail) {
            skipped++
            errors.push(`Staff skipped: duplicate email "${staffMember.email}"`)
            continue
          }
        }
        await db.staff.create({
          data: {
            schoolId: school.id,
            staffNumber: staffMember.staffNumber,
            firstName: staffMember.firstName,
            lastName: staffMember.lastName,
            position: staffMember.position || 'Teacher',
            department: staffMember.department || null,
            email: staffMember.email || null,
            phone: staffMember.phone || null,
            staffType: (staffMember.staffType as any) || 'TEACHING',
            qualifications: staffMember.qualifications || null,
            subjectSpecialisation: staffMember.subjectSpecialisation || null,
          },
        })
        imported.staff++
      } catch (err) {
        skipped++
        errors.push(`Staff error: ${err instanceof Error ? err.message : 'Unknown error'} for ${staffMember.staffNumber || 'unknown'}`)
      }
    }
  }

  const createdGradeMap = new Map<string, string>()
  if (body.grades && Array.isArray(body.grades)) {
    for (const grade of body.grades) {
      try {
        if (!grade.name) {
          skipped++
          errors.push(`Grade skipped: missing name field`)
          continue
        }
        const existing = await db.grade.findFirst({ where: { schoolId: school.id, name: grade.name } })
        if (existing) {
          createdGradeMap.set(grade.name, existing.id)
          skipped++
          errors.push(`Grade skipped: duplicate name "${grade.name}"`)
          continue
        }
        const created = await db.grade.create({
          data: { schoolId: school.id, name: grade.name, level: (grade.level || 'SECONDARY') as any, sequence: grade.sequence || 1 },
        })
        createdGradeMap.set(grade.name, created.id)
        imported.grades++
      } catch (err) {
        skipped++
        errors.push(`Grade error: ${err instanceof Error ? err.message : 'Unknown error'} for ${grade.name || 'unknown'}`)
      }
    }
  }

  const allGrades = await db.grade.findMany({ where: { schoolId: school.id } })
  for (const g of allGrades) {
    if (!createdGradeMap.has(g.name)) createdGradeMap.set(g.name, g.id)
  }

  if (body.classes && Array.isArray(body.classes)) {
    for (const cls of body.classes) {
      try {
        if (!cls.name) {
          skipped++
          errors.push(`Class skipped: missing name field`)
          continue
        }
        let gradeId: string | null = null
        if (cls.gradeName) gradeId = createdGradeMap.get(cls.gradeName) || null
        if (!gradeId) gradeId = allGrades[0]?.id || null
        if (!gradeId) {
          skipped++
          errors.push(`Class skipped: no grade found for class "${cls.name}"`)
          continue
        }
        const academicYear = cls.academicYear || String(new Date().getFullYear())
        const existing = await db.class.findFirst({
          where: { schoolId: school.id, gradeId, name: cls.name, academicYear },
        })
        if (existing) {
          skipped++
          errors.push(`Class skipped: duplicate class "${cls.name}" for grade in year ${academicYear}`)
          continue
        }
        await db.class.create({
          data: {
            schoolId: school.id,
            gradeId,
            name: cls.name,
            stream: cls.stream || null,
            academicYear,
            capacity: cls.capacity || 40,
          },
        })
        imported.classes++
      } catch (err) {
        skipped++
        errors.push(`Class error: ${err instanceof Error ? err.message : 'Unknown error'} for ${cls.name || 'unknown'}`)
      }
    }
  }

  if (body.subjects && Array.isArray(body.subjects)) {
    for (const subject of body.subjects) {
      try {
        if (!subject.code || !subject.name) {
          skipped++
          errors.push(`Subject skipped: missing code or name field`)
          continue
        }
        const existing = await db.subject.findFirst({ where: { schoolId: school.id, code: subject.code } })
        if (existing) {
          skipped++
          errors.push(`Subject skipped: duplicate code "${subject.code}"`)
          continue
        }
        await db.subject.create({
          data: {
            schoolId: school.id,
            code: subject.code,
            name: subject.name,
            department: subject.department || null,
            isCore: subject.isCore || false,
            passMark: subject.passMark || 50,
          },
        })
        imported.subjects++
      } catch (err) {
        skipped++
        errors.push(`Subject error: ${err instanceof Error ? err.message : 'Unknown error'} for ${subject.code || 'unknown'}`)
      }
    }
  }

  logAudit({ action: 'CREATE', entity: 'import', schoolId, details: `Imported ${JSON.stringify(imported)}` }).catch(() => {})
  return { imported, skipped, errors: errors.length > 50 ? errors.slice(0, 50).concat([`... and ${errors.length - 50} more errors`]) : errors }
}

export function handleDataMigrationError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
