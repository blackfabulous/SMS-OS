import 'server-only'
import { hash } from 'bcrypt'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

export async function getSchool(schoolId: string) {
  const school = await db.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new AppError('NOT_FOUND', 'School not found')
  return school
}

function orUndefined(value: unknown): string | undefined {
  return value !== undefined && value !== null ? (value as string) : undefined
}

function orNumber(value: unknown): number | undefined {
  return value !== undefined && value !== null ? Number(value) : undefined
}

export async function updateSchool(schoolId: string, body: Record<string, unknown>) {
  const school = await db.school.update({
    where: { id: schoolId },
    data: {
      name: orUndefined(body.name),
      code: orUndefined(body.code),
      motto: orUndefined(body.motto),
      logo: orUndefined(body.logo),
      zimsecCentreNumber: orUndefined(body.zimsecCentreNumber),
      mopseDistrict: orUndefined(body.mopseDistrict),
      province: orUndefined(body.province),
      schoolType: body.schoolType ? (body.schoolType as any) : undefined,
      ownershipType: body.ownershipType ? (body.ownershipType as any) : undefined,
      levelType: body.levelType ? (body.levelType as any) : undefined,
      registrationStatus: body.registrationStatus ? (body.registrationStatus as any) : undefined,
      headName: orUndefined(body.headName),
      deputyHeadName: orUndefined(body.deputyHeadName),
      contactEmail: orUndefined(body.contactEmail),
      contactPhone: orUndefined(body.contactPhone),
      physicalAddress: orUndefined(body.physicalAddress),
      gpsLatitude: orUndefined(body.gpsLatitude),
      gpsLongitude: orUndefined(body.gpsLongitude),
      catchmentArea: orUndefined(body.catchmentArea),
      responsibleAuthority: orUndefined(body.responsibleAuthority),
      establishedYear: orNumber(body.establishedYear),
      bankName: orUndefined(body.bankName),
      bankAccountNumber: orUndefined(body.bankAccountNumber),
      bankBranch: orUndefined(body.bankBranch),
      taxNumber: orUndefined(body.taxNumber),
      nssaNumber: orUndefined(body.nssaNumber),
      zimdefNumber: orUndefined(body.zimdefNumber),
      sdcChairperson: orUndefined(body.sdcChairperson),
      sdcSecretary: orUndefined(body.sdcSecretary),
      sdcTreasurer: orUndefined(body.sdcTreasurer),
    },
  })

  logAudit({ action: 'UPDATE', entity: 'school', entityId: school.id, schoolId, afterValue: school }).catch(() => {})
  return school
}

export async function createSchoolWithSetup(body: Record<string, unknown>) {
  const { school: schoolData, academic, fees, admin } = body as {
    school?: Record<string, unknown>
    academic?: Record<string, unknown>
    fees?: Record<string, unknown>
    admin?: Record<string, unknown>
  }

  if (!schoolData?.name || !schoolData?.code) {
    throw new AppError('VALIDATION', 'School name and code (EMIS) are required')
  }

  const existingSchool = await db.school.findFirst()
  if (existingSchool) throw new AppError('CONFLICT', 'A school is already configured. Use PUT to update.')

  const school = await db.school.create({
    data: {
      name: schoolData.name as string,
      code: schoolData.code as string,
      motto: (schoolData.motto as string) || null,
      province: (schoolData.province as string) || 'Harare',
      schoolType: (schoolData.schoolType as any) || 'GOVERNMENT',
      ownershipType: (schoolData.ownershipType as any) || 'GOVERNMENT',
      levelType: (schoolData.levelType as any) || 'SECONDARY',
      registrationStatus: 'REGISTERED',
      headName: (schoolData.headName as string) || null,
      contactEmail: (schoolData.contactEmail as string) || null,
      contactPhone: (schoolData.contactPhone as string) || null,
      zimsecCentreNumber: (schoolData.emisNumber as string) || null,
    },
  })

  let gradeCount = 0
  let classCount = 0
  let termCount = 0
  let feeCount = 0

  if (academic) {
    const academicYear = await db.academicYear.create({
      data: {
        schoolId: school.id,
        name: (academic.yearName as string) || `${new Date().getFullYear()} Academic Year`,
        startDate: new Date((academic.startDate as string) || `${new Date().getFullYear()}-01-13`),
        endDate: new Date((academic.endDate as string) || `${new Date().getFullYear()}-12-05`),
        isCurrent: true,
        isActive: true,
      },
    })

    if (academic.terms && Array.isArray(academic.terms)) {
      for (const term of academic.terms as Array<Record<string, unknown>>) {
        await db.term.create({
          data: {
            schoolId: school.id,
            academicYearId: academicYear.id,
            name: term.name as string,
            termNumber: term.termNumber as number,
            startDate: new Date(term.startDate as string),
            endDate: new Date(term.endDate as string),
            isCurrent: term.termNumber === 1,
          },
        })
        termCount++
      }
    }

    const createdGrades: { id: string; name: string }[] = []
    if (academic.grades && Array.isArray(academic.grades)) {
      for (const grade of academic.grades as Array<Record<string, unknown>>) {
        const created = await db.grade.create({
          data: {
            schoolId: school.id,
            name: grade.name as string,
            level: (grade.level as any) || 'SECONDARY',
            sequence: (grade.sequence as number) || 1,
          },
        })
        createdGrades.push({ id: created.id, name: created.name })
        gradeCount++
      }
    }

    if (academic.classes && Array.isArray(academic.classes)) {
      for (const cls of academic.classes as Array<Record<string, unknown>>) {
        const grade = createdGrades.find((g) => g.name === cls.gradeName)
        if (grade) {
          await db.class.create({
            data: {
              schoolId: school.id,
              gradeId: grade.id,
              name: cls.name as string,
              stream: (cls.stream as string) || null,
              academicYear: String(new Date().getFullYear()),
              capacity: (cls.capacity as number) || 40,
            },
          })
          classCount++
        }
      }
    }

    if (fees?.grades && Array.isArray(fees.grades)) {
      const currentTerm = await db.term.findFirst({ where: { academicYearId: academicYear.id } })
      for (const fee of fees.grades as Array<Record<string, unknown>>) {
        const grade = createdGrades.find((g) => g.name === fee.gradeName)
        if (grade && (fee.amount as number) > 0) {
          await db.feeStructure.create({
            data: {
              schoolId: school.id,
              gradeId: grade.id,
              termId: currentTerm?.id || null,
              name: (fee.feeType as string) || 'Tuition',
              feeType: (fee.feeType as string) || 'TUITION',
              amount: fee.amount as any,
              currency: (fee.currency as any) || 'USD',
            },
          })
          feeCount++
        }
      }
    }
  }

  if (admin?.email && admin?.password) {
    const hashedPassword = await hash(admin.password as string, 12)
    await db.user.create({
      data: {
        email: admin.email as string,
        password: hashedPassword,
        name: (admin.name as string) || 'Admin',
        role: 'ADMIN' as any,
        schoolId: school.id,
        isActive: true,
      },
    })
  }

  logAudit({ action: 'CREATE', entity: 'school', entityId: school.id, schoolId: school.id }).catch(() => {})
  return {
    success: true,
    schoolName: school.name,
    summary: { grades: gradeCount, classes: classCount, terms: termCount, feeItems: feeCount },
  }
}

export function handleSchoolError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
