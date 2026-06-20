import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

export async function GET() {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    let school = await db.school.findUnique({ where: { id: session.user.schoolId } })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json({ error: 'Failed to fetch school info' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()

    const school = await db.school.update({
      where: { id: session.user.schoolId },
      data: {
        name: body.name,
        code: body.code,
        motto: body.motto,
        logo: body.logo,
        zimsecCentreNumber: body.zimsecCentreNumber,
        mopseDistrict: body.mopseDistrict,
        province: body.province,
        schoolType: body.schoolType,
        ownershipType: body.ownershipType,
        levelType: body.levelType,
        registrationStatus: body.registrationStatus,
        headName: body.headName,
        deputyHeadName: body.deputyHeadName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        physicalAddress: body.physicalAddress,
        gpsLatitude: body.gpsLatitude,
        gpsLongitude: body.gpsLongitude,
        catchmentArea: body.catchmentArea,
        responsibleAuthority: body.responsibleAuthority,
        establishedYear: body.establishedYear,
        bankName: body.bankName,
        bankAccountNumber: body.bankAccountNumber,
        bankBranch: body.bankBranch,
        taxNumber: body.taxNumber,
        nssaNumber: body.nssaNumber,
        zimdefNumber: body.zimdefNumber,
        sdcChairperson: body.sdcChairperson,
        sdcSecretary: body.sdcSecretary,
        sdcTreasurer: body.sdcTreasurer,
      },
    })

    logAudit({ action: 'UPDATE', entity: 'school', entityId: school.id, afterValue: school }).catch(() => {})
    return NextResponse.json(school)
  } catch (error) {
    console.error('Error updating school:', error)
    return NextResponse.json({ error: 'Failed to update school info' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Initial school creation requires SUPER_ADMIN or runs only when no school exists (first-run setup)
  const authResult = await validateRole(['SUPER_ADMIN', 'ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { school: schoolData, academic, fees, admin } = body

    if (!schoolData?.name || !schoolData?.code) {
      return NextResponse.json({ error: 'School name and code (EMIS) are required' }, { status: 400 })
    }

    const existingSchool = await db.school.findFirst()
    if (existingSchool) {
      return NextResponse.json({ error: 'A school is already configured. Use PUT to update.' }, { status: 409 })
    }

    const school = await db.school.create({
      data: {
        name: schoolData.name,
        code: schoolData.code,
        motto: schoolData.motto || null,
        province: schoolData.province || 'Harare',
        schoolType: schoolData.schoolType || 'GOVERNMENT',
        ownershipType: schoolData.ownershipType || 'GOVERNMENT',
        levelType: schoolData.levelType || 'SECONDARY',
        registrationStatus: 'REGISTERED',
        headName: schoolData.headName || null,
        contactEmail: schoolData.contactEmail || null,
        contactPhone: schoolData.contactPhone || null,
        zimsecCentreNumber: schoolData.emisNumber || null,
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
          name: academic.yearName || `${new Date().getFullYear()} Academic Year`,
          startDate: new Date(academic.startDate || `${new Date().getFullYear()}-01-13`),
          endDate: new Date(academic.endDate || `${new Date().getFullYear()}-12-05`),
          isCurrent: true,
          isActive: true,
        },
      })

      if (academic.terms && Array.isArray(academic.terms)) {
        for (const term of academic.terms) {
          await db.term.create({
            data: { academicYearId: academicYear.id, name: term.name, termNumber: term.termNumber, startDate: new Date(term.startDate), endDate: new Date(term.endDate), isCurrent: term.termNumber === 1 },
          })
          termCount++
        }
      }

      const createdGrades: { id: string; name: string }[] = []
      if (academic.grades && Array.isArray(academic.grades)) {
        for (const grade of academic.grades) {
          const created = await db.grade.create({
            data: { schoolId: school.id, name: grade.name, level: grade.level || 'SECONDARY', sequence: grade.sequence || 1 },
          })
          createdGrades.push({ id: created.id, name: created.name })
          gradeCount++
        }
      }

      if (academic.classes && Array.isArray(academic.classes)) {
        for (const cls of academic.classes) {
          const grade = createdGrades.find((g) => g.name === cls.gradeName)
          if (grade) {
            await db.class.create({
              data: { schoolId: school.id, gradeId: grade.id, name: cls.name, stream: cls.stream || null, academicYear: String(new Date().getFullYear()), capacity: cls.capacity || 40 },
            })
            classCount++
          }
        }
      }

      if (fees?.grades && Array.isArray(fees.grades)) {
        const currentTerm = await db.term.findFirst({ where: { academicYearId: academicYear.id } })
        for (const fee of fees.grades) {
          const grade = createdGrades.find((g) => g.name === fee.gradeName)
          if (grade && fee.amount > 0) {
            await db.feeStructure.create({
              data: { schoolId: school.id, gradeId: grade.id, termId: currentTerm?.id || null, name: fee.feeType || 'Tuition', feeType: fee.feeType || 'TUITION', amount: fee.amount, currency: fee.currency || 'USD' },
            })
            feeCount++
          }
        }
      }
    }

    if (admin?.email && admin?.password) {
      const hashedPassword = await hash(admin.password, 12)
      await db.user.create({
        data: { email: admin.email, password: hashedPassword, name: admin.name || 'Admin', role: 'ADMIN', schoolId: school.id, isActive: true },
      })
    }

    logAudit({ action: 'CREATE', entity: 'school', entityId: school.id }).catch(() => {})
    return NextResponse.json({ success: true, schoolName: school.name, summary: { grades: gradeCount, classes: classCount, terms: termCount, feeItems: feeCount } })
  } catch (error) {
    console.error('Error creating school:', error)
    return NextResponse.json({ error: 'Failed to create school. ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 })
  }
}
