import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const staffType = searchParams.get('staffType') || ''
    const position = searchParams.get('position') || ''
    const isActive = searchParams.get('isActive') || ''
    const department = searchParams.get('department') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Always scope to authenticated user's school
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.staff.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()

    const currentYear = new Date().getFullYear()

    const lastStaff = await db.staff.findFirst({
      where: { staffNumber: { startsWith: `STF${currentYear}` } },
      orderBy: { staffNumber: 'desc' },
    })

    let sequence = 1
    if (lastStaff) {
      const lastSequence = parseInt(lastStaff.staffNumber.slice(-3))
      sequence = lastSequence + 1
    }

    const staffNumber = `STF${currentYear}${sequence.toString().padStart(3, '0')}`

    const staff = await db.staff.create({
      data: {
        staffNumber,
        // Always use authenticated user's schoolId — never trust body.schoolId
        schoolId: session.user.schoolId,
        title: body.title,
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        nationalId: body.nationalId,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender,
        address: body.address,
        phone: body.phone,
        email: body.email,
        nextOfKin: body.nextOfKin,
        nextOfKinPhone: body.nextOfKinPhone,
        position: body.position,
        department: body.department,
        staffType: body.staffType || 'TEACHING',
        payType: body.payType || 'SCHOOL_PAID',
        qualifications: body.qualifications,
        subjectSpecialisation: body.subjectSpecialisation,
        employmentDate: body.employmentDate ? new Date(body.employmentDate) : undefined,
        contractType: body.contractType || 'PERMANENT',
        payrollStatus: body.payrollStatus || 'ACTIVE',
        bankName: body.bankName,
        bankAccountNumber: body.bankAccountNumber,
        nssaNumber: body.nssaNumber,
        taxNumber: body.taxNumber,
        basicSalary: body.basicSalary || 0,
        housingAllowance: body.housingAllowance || 0,
        transportAllowance: body.transportAllowance || 0,
        responsibilityAllowance: body.responsibilityAllowance || 0,
        photo: body.photo,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    logAudit({ action: 'CREATE', entity: 'staff', entityId: staff.id, afterValue: staff }).catch(() => {})
    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}
