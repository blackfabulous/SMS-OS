import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAuth, validateRole } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const authResult = await validateAuth()
    if ('error' in authResult) return authResult.error
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const staffType = searchParams.get('staffType') || ''
    const position = searchParams.get('position') || ''
    const isActive = searchParams.get('isActive') || ''
    const department = searchParams.get('department') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { middleName: { contains: search } },
        { staffNumber: { contains: search } },
        { nationalId: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (staffType) where.staffType = staffType
    if (position) where.position = { contains: position }
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

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await validateRole(['ADMIN'])
    if ('error' in authResult) return authResult.error
    const body = await request.json()

    const currentYear = new Date().getFullYear()

    const lastStaff = await db.staff.findFirst({
      where: {
        staffNumber: { startsWith: `STF${currentYear}` },
      },
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
        schoolId: body.schoolId,
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

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { error: 'Failed to create staff' },
      { status: 500 }
    )
  }
}
