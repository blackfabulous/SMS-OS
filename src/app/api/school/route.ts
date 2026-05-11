import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'

export async function GET() {
  try {
    let school = await db.school.findFirst()

    if (!school) {
      // Return a default structure if no school exists
      school = {
        id: '',
        name: 'Not Configured',
        code: 'N/A',
        motto: null,
        logo: null,
        zimsecCentreNumber: null,
        mopseDistrict: null,
        province: 'Harare',
        schoolType: 'GOVERNMENT',
        ownershipType: 'GOVERNMENT',
        levelType: 'PRIMARY',
        registrationStatus: 'REGISTERED',
        headName: null,
        deputyHeadName: null,
        contactEmail: null,
        contactPhone: null,
        physicalAddress: null,
        gpsLatitude: null,
        gpsLongitude: null,
        catchmentArea: null,
        responsibleAuthority: null,
        establishedYear: null,
        isActive: true,
        bankName: null,
        bankAccountNumber: null,
        bankBranch: null,
        taxNumber: null,
        nssaNumber: null,
        zimdefNumber: null,
        sdcChairperson: null,
        sdcSecretary: null,
        sdcTreasurer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json(
      { error: 'Failed to fetch school info' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Check if school exists
    const existing = await db.school.findFirst()

    let school
    if (existing) {
      school = await db.school.update({
        where: { id: existing.id },
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
    } else {
      school = await db.school.create({
        data: {
          name: body.name,
          code: body.code,
          motto: body.motto,
          logo: body.logo,
          zimsecCentreNumber: body.zimsecCentreNumber,
          mopseDistrict: body.mopseDistrict,
          province: body.province || 'Harare',
          schoolType: body.schoolType || 'GOVERNMENT',
          ownershipType: body.ownershipType || 'GOVERNMENT',
          levelType: body.levelType || 'PRIMARY',
          registrationStatus: body.registrationStatus || 'REGISTERED',
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
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error updating school:', error)
    return NextResponse.json(
      { error: 'Failed to update school info' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { school: schoolData, academic, fees, admin } = body

    if (!schoolData?.name || !schoolData?.code) {
      return NextResponse.json(
        { error: 'School name and code (EMIS) are required' },
        { status: 400 }
      )
    }

    // Check if school already exists
    const existingSchool = await db.school.findFirst()
    if (existingSchool) {
      return NextResponse.json(
        { error: 'A school is already configured. Use PUT to update.' },
        { status: 409 }
      )
    }

    // 1. Create the school
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

    // 2. Create Academic Year
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

      // 3. Create Terms
      if (academic.terms && Array.isArray(academic.terms)) {
        for (const term of academic.terms) {
          await db.term.create({
            data: {
              academicYearId: academicYear.id,
              name: term.name,
              termNumber: term.termNumber,
              startDate: new Date(term.startDate),
              endDate: new Date(term.endDate),
              isCurrent: term.termNumber === 1,
            },
          })
          termCount++
        }
      }

      // 4. Create Grades
      const createdGrades: { id: string; name: string }[] = []
      if (academic.grades && Array.isArray(academic.grades)) {
        for (const grade of academic.grades) {
          const created = await db.grade.create({
            data: {
              schoolId: school.id,
              name: grade.name,
              level: grade.level || 'SECONDARY',
              sequence: grade.sequence || 1,
            },
          })
          createdGrades.push({ id: created.id, name: created.name })
          gradeCount++
        }
      }

      // 5. Create Classes
      if (academic.classes && Array.isArray(academic.classes)) {
        for (const cls of academic.classes) {
          const grade = createdGrades.find(g => g.name === cls.gradeName)
          if (grade) {
            await db.class.create({
              data: {
                schoolId: school.id,
                gradeId: grade.id,
                name: cls.name,
                stream: cls.stream || null,
                academicYear: String(new Date().getFullYear()),
                capacity: cls.capacity || 40,
              },
            })
            classCount++
          }
        }
      }

      // 6. Create Fee Structures
      if (fees?.grades && Array.isArray(fees.grades)) {
        const currentTerm = await db.term.findFirst({
          where: { academicYearId: academicYear.id },
        })
        for (const fee of fees.grades) {
          const grade = createdGrades.find(g => g.name === fee.gradeName)
          if (grade && fee.amount > 0) {
            await db.feeStructure.create({
              data: {
                schoolId: school.id,
                gradeId: grade.id,
                termId: currentTerm?.id || null,
                name: fee.feeType || 'Tuition',
                feeType: fee.feeType || 'TUITION',
                amount: fee.amount,
                currency: fee.currency || 'USD',
              },
            })
            feeCount++
          }
        }
      }
    }

    // 7. Create Admin User
    if (admin?.email && admin?.password) {
      const hashedPassword = await hash(admin.password, 12)
      await db.user.create({
        data: {
          email: admin.email,
          password: hashedPassword,
          name: admin.name || 'Admin',
          role: 'ADMIN',
          schoolId: school.id,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      schoolName: school.name,
      summary: {
        grades: gradeCount,
        classes: classCount,
        terms: termCount,
        feeItems: feeCount,
      },
    })
  } catch (error) {
    console.error('Error creating school:', error)
    return NextResponse.json(
      { error: 'Failed to create school. ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
