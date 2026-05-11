import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

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
