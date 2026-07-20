import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string
  staffType?: string
  position?: string
  isActive?: string
  department?: string
  page?: number
  limit?: number
}

export async function listStaff(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const staffType = params.staffType ?? ''
  const position = params.position ?? ''
  const isActive = params.isActive ?? ''
  const department = params.department ?? ''

  const where: Record<string, unknown> = { schoolId }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { middleName: { contains: search, mode: 'insensitive' } },
      { staffNumber: { contains: search, mode: 'insensitive' } },
      { nationalId: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (staffType) where.staffType = staffType
  if (position) where.position = { contains: position, mode: 'insensitive' }
  if (department) where.department = department
  if (isActive !== '') where.isActive = isActive === 'true'

  const [data, total] = await Promise.all([
    db.staff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.staff.count({ where }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}

interface CreateStaffInput {
  title?: string
  firstName?: string
  lastName?: string
  middleName?: string
  nationalId?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  phone?: string
  email?: string
  nextOfKin?: string
  nextOfKinPhone?: string
  position?: string
  department?: string
  staffType?: string
  payType?: string
  qualifications?: string
  subjectSpecialisation?: string
  employmentDate?: string
  contractType?: string
  payrollStatus?: string
  bankName?: string
  bankAccountNumber?: string
  nssaNumber?: string
  taxNumber?: string
  basicSalary?: number | string
  housingAllowance?: number | string
  transportAllowance?: number | string
  responsibilityAllowance?: number | string
  photo?: string
  isActive?: boolean
}

export async function createStaff(schoolId: string, input: CreateStaffInput) {
  if (!input.firstName || !input.lastName || !input.position) {
    throw new AppError('VALIDATION', 'First name, last name, and position are required')
  }

  const currentYear = new Date().getFullYear()
  const prefix = `STF${currentYear}`
  const lastStaff = await db.staff.findFirst({
    where: { schoolId, staffNumber: { startsWith: prefix } },
    orderBy: { staffNumber: 'desc' },
  })

  let sequence = 1
  if (lastStaff) {
    const lastSequence = parseInt(lastStaff.staffNumber.slice(-3))
    sequence = lastSequence + 1
  }
  const staffNumber = `${prefix}${sequence.toString().padStart(3, '0')}`

  const staff = await db.staff.create({
    data: {
      schoolId,
      staffNumber,
      title: input.title,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      nationalId: input.nationalId,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender as any,
      address: input.address,
      phone: input.phone,
      email: input.email,
      nextOfKin: input.nextOfKin,
      nextOfKinPhone: input.nextOfKinPhone,
      position: input.position,
      department: input.department,
      staffType: (input.staffType as any) || 'TEACHING',
      payType: (input.payType as any) || 'SCHOOL_PAID',
      qualifications: input.qualifications,
      subjectSpecialisation: input.subjectSpecialisation,
      employmentDate: input.employmentDate ? new Date(input.employmentDate) : null,
      contractType: (input.contractType as any) || 'PERMANENT',
      payrollStatus: (input.payrollStatus as any) || 'ACTIVE',
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
      nssaNumber: input.nssaNumber,
      taxNumber: input.taxNumber,
      basicSalary: input.basicSalary != null ? Number(input.basicSalary) : 0,
      housingAllowance: input.housingAllowance != null ? Number(input.housingAllowance) : 0,
      transportAllowance: input.transportAllowance != null ? Number(input.transportAllowance) : 0,
      responsibilityAllowance: input.responsibilityAllowance != null ? Number(input.responsibilityAllowance) : 0,
      photo: input.photo,
      isActive: input.isActive !== undefined ? input.isActive : true,
    },
  })

  logAudit({ action: 'CREATE', entity: 'staff', entityId: staff.id, schoolId, afterValue: staff }).catch(() => {})
  return staff
}

export async function getStaff(schoolId: string, id: string) {
  const staff = await db.staff.findFirst({
    where: { id, schoolId },
    include: {
      school: true,
      payslips: { orderBy: { createdAt: 'desc' }, take: 12 },
      leaveRecords: { orderBy: { createdAt: 'desc' }, take: 20 },
      appraisalRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
      disciplinaryRecords: { orderBy: { date: 'desc' }, take: 10 },
    },
  })
  if (!staff) throw new AppError('NOT_FOUND', 'Staff not found')
  return staff
}

export async function updateStaff(schoolId: string, id: string, input: CreateStaffInput) {
  const existing = await db.staff.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Staff not found')

  const staff = await db.staff.update({
    where: { id },
    data: {
      title: input.title,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      nationalId: input.nationalId,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      gender: input.gender as any,
      address: input.address,
      phone: input.phone,
      email: input.email,
      nextOfKin: input.nextOfKin,
      nextOfKinPhone: input.nextOfKinPhone,
      position: input.position,
      department: input.department,
      staffType: input.staffType as any,
      payType: input.payType as any,
      qualifications: input.qualifications,
      subjectSpecialisation: input.subjectSpecialisation,
      employmentDate: input.employmentDate ? new Date(input.employmentDate) : undefined,
      contractType: input.contractType as any,
      payrollStatus: input.payrollStatus as any,
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
      nssaNumber: input.nssaNumber,
      taxNumber: input.taxNumber,
      basicSalary: input.basicSalary != null ? Number(input.basicSalary) : undefined,
      housingAllowance: input.housingAllowance != null ? Number(input.housingAllowance) : undefined,
      transportAllowance: input.transportAllowance != null ? Number(input.transportAllowance) : undefined,
      responsibilityAllowance: input.responsibilityAllowance != null ? Number(input.responsibilityAllowance) : undefined,
      photo: input.photo,
      isActive: input.isActive,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'staff', entityId: staff.id, schoolId, afterValue: staff }).catch(() => {})
  return staff
}

export async function deleteStaff(schoolId: string, id: string) {
  const existing = await db.staff.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!existing) throw new AppError('NOT_FOUND', 'Staff not found')

  const staff = await db.staff.update({
    where: { id },
    data: { isActive: false, payrollStatus: 'INACTIVE' },
  })

  logAudit({ action: 'DELETE', entity: 'staff', entityId: id, schoolId }).catch(() => {})
  return { message: 'Staff soft deleted successfully', staff }
}

export function handleStaffError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
