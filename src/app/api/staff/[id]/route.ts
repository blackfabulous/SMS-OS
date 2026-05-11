import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const staff = await db.staff.findUnique({
      where: { id },
      include: {
        school: true,
        payslips: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        leaveRecords: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        appraisalRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        disciplinaryRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const staff = await db.staff.update({
      where: { id },
      data: {
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
        staffType: body.staffType,
        payType: body.payType,
        qualifications: body.qualifications,
        subjectSpecialisation: body.subjectSpecialisation,
        employmentDate: body.employmentDate ? new Date(body.employmentDate) : undefined,
        contractType: body.contractType,
        payrollStatus: body.payrollStatus,
        bankName: body.bankName,
        bankAccountNumber: body.bankAccountNumber,
        nssaNumber: body.nssaNumber,
        taxNumber: body.taxNumber,
        basicSalary: body.basicSalary,
        housingAllowance: body.housingAllowance,
        transportAllowance: body.transportAllowance,
        responsibilityAllowance: body.responsibilityAllowance,
        photo: body.photo,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { error: 'Failed to update staff' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete - set isActive to false
    const staff = await db.staff.update({
      where: { id },
      data: {
        isActive: false,
        payrollStatus: 'INACTIVE',
      },
    })

    return NextResponse.json({
      message: 'Staff soft deleted successfully',
      staff,
    })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff' },
      { status: 500 }
    )
  }
}
