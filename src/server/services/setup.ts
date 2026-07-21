import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

const zimbabweProvinces = [
  'Bulawayo', 'Harare', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
]

const zimbabweDistricts = [
  'Beitbridge', 'Bikita', 'Bindura', 'Binga', 'Buhera', 'Bulilima',
  'Centenary', 'Chegutu', 'Chikomba', 'Chimanimani', 'Chipinge',
  'Chiredzi', 'Chirumanzu', 'Chivi', 'Gokwe North', 'Gokwe South',
  'Goromonzi', 'Guruve', 'Gutu', 'Gwanda', 'Gweru', 'Harare',
  'Hurungwe', 'Hwange', 'Hwedza', 'Insiza', 'Kadoma', 'Kariba',
  'Karoi', 'Kwekwe', 'Lupane', 'Makonde', 'Makoni', 'Mangwe',
  'Marondera', 'Masvingo', 'Matobo', 'Mazowe', 'Mberengwa',
  'Mount Darwin', 'Murehwa', 'Mutare', 'Mutasa', 'Mutoko',
  'Mwenezi', 'Nkayi', 'Nyanga', 'Rushinga', 'Seke', 'Shamva',
  'Shurugwi', 'Tsholotsho', 'Umguza', 'Umzingwane', 'Zaka',
  'Zvimba', 'Zvishavane',
]

export function getSetupOptions() {
  return {
    provinces: zimbabweProvinces,
    districts: zimbabweDistricts,
    schoolTypes: ['GOVERNMENT', 'MISSION', 'PRIVATE', 'COUNCIL', 'GROUP_A', 'GROUP_B'],
    ownershipTypes: ['GOVERNMENT', 'CHURCH', 'PRIVATE', 'LOCAL_AUTHORITY', 'TRUST'],
    levelTypes: ['PRIMARY', 'SECONDARY', 'COMBINED'],
  }
}

export async function createSchoolSetup(data: any) {
  if (!data.school?.name || !data.school?.code) throw new AppError('VALIDATION', 'School name and code are required')

  const existingSchool = await db.school.findUnique({ where: { code: data.school.code } })
  if (existingSchool) throw new AppError('CONFLICT', 'A school with this code already exists')

  const school = await db.school.create({
    data: {
      name: data.school.name,
      code: data.school.code,
      schoolType: (data.school.type || 'GOVERNMENT') as any,
      mopseDistrict: data.school.district,
      province: data.school.province,
      zimsecCentreNumber: data.school.emisNumber,
      motto: data.school.motto,
      logo: data.school.logo,
      levelType: (data.school.levelType || 'SECONDARY') as any,
      ownershipType: (data.school.ownershipType || 'GOVERNMENT') as any,
      contactEmail: data.school.contactEmail,
      contactPhone: data.school.contactPhone,
      physicalAddress: data.school.physicalAddress,
      headName: data.staff.headmaster ? `${data.staff.headmaster.firstName} ${data.staff.headmaster.lastName}` : undefined,
      deputyHeadName: data.staff.deputy ? `${data.staff.deputy.firstName} ${data.staff.deputy.lastName}` : undefined,
    },
  })

  const academicYear = await db.academicYear.create({
    data: {
      schoolId: school.id,
      name: data.academic.yearName,
      startDate: new Date(data.academic.startDate),
      endDate: new Date(data.academic.endDate),
      isCurrent: true,
      isActive: true,
    },
  })

  if (data.academic.terms?.length > 0) {
    for (const term of data.academic.terms) {
      await db.term.create({
        data: {
          schoolId: school.id,
          academicYearId: academicYear.id,
          name: term.name,
          termNumber: term.termNumber,
          startDate: new Date(term.startDate),
          endDate: new Date(term.endDate),
          isCurrent: term.termNumber === 1,
        },
      })
    }
  }

  const gradeMap: Record<string, string> = {}
  for (const grade of data.academic.grades || []) {
    const created = await db.grade.create({
      data: { schoolId: school.id, name: grade.name, level: (grade.level || 'SECONDARY') as any, sequence: grade.sequence },
    })
    gradeMap[grade.name] = created.id
  }

  const subjectMap: Record<string, string> = {}
  for (const subject of data.academic.subjects || []) {
    const created = await db.subject.create({
      data: { schoolId: school.id, code: subject.code, name: subject.name, department: subject.department, isCore: subject.isCore },
    })
    subjectMap[subject.code] = created.id
  }

  for (const cls of data.academic.classes || []) {
    const gradeId = gradeMap[cls.gradeName]
    if (gradeId) {
      await db.class.create({
        data: {
          schoolId: school.id,
          gradeId,
          name: cls.name,
          stream: cls.stream,
          academicYear: data.academic.yearName,
          capacity: cls.capacity,
        },
      })
    }
  }

  const currentTerm = await db.term.findFirst({ where: { academicYearId: academicYear.id, isCurrent: true } })

  for (const fee of data.fees?.grades || []) {
    const gradeId = gradeMap[fee.gradeName]
    if (gradeId) {
      await db.feeStructure.create({
        data: {
          schoolId: school.id,
          gradeId,
          termId: currentTerm?.id,
          name: fee.feeType,
          feeType: fee.feeType,
          amount: fee.amount as any,
          currency: (fee.currency as any) || 'USD',
        },
      })
    }
  }

  const staffToCreate: any[] = []
  if (data.staff.headmaster) {
    staffToCreate.push({
      schoolId: school.id,
      staffNumber: `${data.school.code}-HM-001`,
      firstName: data.staff.headmaster.firstName,
      lastName: data.staff.headmaster.lastName,
      phone: data.staff.headmaster.phone,
      email: data.staff.headmaster.email,
      position: 'HEADMASTER',
      staffType: 'TEACHING' as any,
      basicSalary: 0 as any,
    })
  }
  if (data.staff.deputy) {
    staffToCreate.push({
      schoolId: school.id,
      staffNumber: `${data.school.code}-DHM-001`,
      firstName: data.staff.deputy.firstName,
      lastName: data.staff.deputy.lastName,
      phone: data.staff.deputy.phone,
      email: data.staff.deputy.email,
      position: 'DEPUTY_HEAD',
      staffType: 'TEACHING' as any,
      basicSalary: 0 as any,
    })
  }
  if (data.staff.bursar) {
    staffToCreate.push({
      schoolId: school.id,
      staffNumber: `${data.school.code}-BUR-001`,
      firstName: data.staff.bursar.firstName,
      lastName: data.staff.bursar.lastName,
      phone: data.staff.bursar.phone,
      email: data.staff.bursar.email,
      position: 'BURSAR',
      staffType: 'NON_TEACHING' as any,
      basicSalary: 0 as any,
    })
  }
  for (let i = 0; i < (data.staff.seniorTeachers || []).length; i++) {
    const teacher = data.staff.seniorTeachers[i]
    staffToCreate.push({
      schoolId: school.id,
      staffNumber: `${data.school.code}-ST-${String(i + 1).padStart(3, '0')}`,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      subjectSpecialisation: teacher.subjectSpecialisation,
      phone: teacher.phone,
      position: 'SENIOR_TEACHER',
      staffType: 'TEACHING' as any,
      basicSalary: 0 as any,
    })
  }

  for (const staffData of staffToCreate) {
    await db.staff.create({ data: staffData })
  }

  for (const hostel of data.infrastructure?.hostels || []) {
    const createdHostel = await db.hostel.create({
      data: { schoolId: school.id, name: hostel.name, gender: hostel.gender, capacity: hostel.capacity },
    })
    const dormCount = Math.ceil(hostel.capacity / 20)
    for (let d = 1; d <= dormCount; d++) {
      await db.dormitory.create({
        data: {
          schoolId: school.id,
          hostelId: createdHostel.id,
          name: `${hostel.name} Dorm ${d}`,
          capacity: Math.min(20, hostel.capacity - (d - 1) * 20),
        },
      })
    }
  }

  await logAudit({
    action: 'SCHOOL_SETUP',
    entity: 'School',
    entityId: school.id,
    schoolId: school.id,
    afterValue: { name: school.name },
    details: `School "${school.name}" setup completed with ${Object.keys(gradeMap).length} grades, ${Object.keys(subjectMap).length} subjects, ${data.academic.classes?.length || 0} classes, ${staffToCreate.length} staff`,
  })

  return {
    schoolId: school.id,
    schoolName: school.name,
    summary: {
      grades: Object.keys(gradeMap).length,
      subjects: Object.keys(subjectMap).length,
      classes: data.academic.classes?.length || 0,
      staff: staffToCreate.length,
      hostels: data.infrastructure?.hostels?.length || 0,
      terms: data.academic.terms?.length || 0,
      feeStructures: data.fees?.grades?.length || 0,
    },
  }
}

export function handleSetupError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
