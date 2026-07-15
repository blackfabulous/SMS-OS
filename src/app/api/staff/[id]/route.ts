import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params

    // Staff can only view their own record; admins can view all within school
    const where =
      session.user.role === 'TEACHER' || session.user.role === 'BURSAR'
        ? { id, schoolId: session.user.schoolId }
        : { id, schoolId: session.user.schoolId }

    const staff = await db.staff.findUnique({
      where,
      include: {
        school: true,
        payslips: { orderBy: { createdAt: 'desc' }, take: 12 },
        leaveRecords: { orderBy: { createdAt: 'desc' }, take: 20 },
        appraisalRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
        disciplinaryRecords: { orderBy: { date: 'desc' }, take: 10 },
      },
    })

    if (!staff) {
      return fail('NOT_FOUND', 'Staff not found')
    }

    return ok(staff)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching staff')
    return fail('INTERNAL', 'Failed to fetch staff')
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params
    const body = await request.json()

    // Verify staff belongs to the caller's school
    const existing = await db.staff.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
    if (!existing) {
      return fail('NOT_FOUND', 'Staff not found')
    }

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

    logAudit({ action: 'UPDATE', entity: 'staff', entityId: staff.id, afterValue: staff }).catch(() => {})
    return ok(staff)
  } catch (error) {
    logger.error({ err: error }, 'Error updating staff')
    return fail('INTERNAL', 'Failed to update staff')
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { id } = await params

    // Verify staff belongs to the caller's school
    const existing = await db.staff.findUnique({ where: { id, schoolId: session.user.schoolId }, select: { id: true } })
    if (!existing) {
      return fail('NOT_FOUND', 'Staff not found')
    }

    const staff = await db.staff.update({
      where: { id },
      data: { isActive: false, payrollStatus: 'INACTIVE' },
    })

    logAudit({ action: 'DELETE', entity: 'staff', entityId: id }).catch(() => {})
    return ok({ message: 'Staff soft deleted successfully', staff })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting staff')
    return fail('INTERNAL', 'Failed to delete staff')
  }
}
