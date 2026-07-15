import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import { calculatePAYE } from '@/lib/payroll-calc'
import { RunPayrollSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const staff = await db.staff.findMany({
      where: { schoolId, isActive: true, payrollStatus: 'ACTIVE', payType: 'SCHOOL_PAID' },
      include: { payslips: { where: { periodMonth: month, periodYear: year } } },
      orderBy: { lastName: 'asc' },
    })

    const totalPayroll = staff.reduce((sum, s) => sum + s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance, 0)
    const totalDeductions = staff.reduce((sum, s) => {
      const gross = s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance
      const paye = calculatePAYE(gross)
      const nssa = Math.min(gross * 0.045, 339)
      const aidsLevy = paye * 0.06
      return sum + paye + nssa + aidsLevy
    }, 0)

    const payslips = await db.payslip.findMany({
      where: { periodMonth: month, periodYear: year, staff: { schoolId } },
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
    })

    const payeSummary = staff.reduce((acc, s) => acc + calculatePAYE(s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance), 0)
    const nssaEmployee = staff.reduce((acc, s) => acc + Math.min((s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance) * 0.045, 339), 0)
    const nssaEmployer = nssaEmployee

    return ok({
      staff: staff.map((s) => ({
        id: s.id, staffNumber: s.staffNumber, firstName: s.firstName, lastName: s.lastName,
        position: s.position, department: s.department, staffType: s.staffType,
        basicSalary: s.basicSalary, housingAllowance: s.housingAllowance, transportAllowance: s.transportAllowance,
        responsibilityAllowance: s.responsibilityAllowance,
        grossPay: s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance,
        hasPayslip: s.payslips.length > 0,
      })),
      payslips,
      stats: {
        totalStaff: staff.length, totalPayroll, totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetPay: Math.round((totalPayroll - totalDeductions) * 100) / 100,
        payeTotal: Math.round(payeSummary * 100) / 100,
        nssaEmployee: Math.round(nssaEmployee * 100) / 100,
        nssaEmployer: Math.round(nssaEmployer * 100) / 100,
        aidsLevy: Math.round(payeSummary * 0.06 * 100) / 100,
        zimdef: Math.round(totalPayroll * 0.01 * 100) / 100,
        payslipsGenerated: payslips.length,
      },
      period: { month, year },
      distribution: [],
    })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching payroll')
    return fail('INTERNAL', 'Failed to fetch payroll data')
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()

    const parsed = RunPayrollSchema.safeParse(body)
    if (!parsed.success) {
      return fail('VALIDATION', 'Validation failed', parsed.error.issues)
    }
    const { month, year } = parsed.data

    const staffMembers = await db.staff.findMany({
      where: { schoolId: session.user.schoolId, isActive: true, payrollStatus: 'ACTIVE', payType: 'SCHOOL_PAID' },
    })
    const results: { staffId: string; status: string; netPay?: number }[] = []

    for (const staff of staffMembers) {
      const existing = await db.payslip.findUnique({
        where: { staffId_periodMonth_periodYear: { staffId: staff.id, periodMonth: month, periodYear: year } },
      })
      if (existing) { results.push({ staffId: staff.id, status: 'already_exists' }); continue }

      const grossPay = staff.basicSalary + staff.housingAllowance + staff.transportAllowance + staff.responsibilityAllowance
      const paye = calculatePAYE(grossPay)
      const nssaEmp = Math.min(grossPay * 0.045, 339)
      const nssaEmpr = Math.min(grossPay * 0.045, 339)
      const aidsLevy = paye * 0.06
      const zimdef = grossPay * 0.01
      const totalDeductions = paye + nssaEmp + aidsLevy + zimdef
      const netPay = grossPay - totalDeductions

      await db.payslip.create({
        data: {
          schoolId: session.user.schoolId,
          staffId: staff.id, periodMonth: month, periodYear: year,
          basicSalary: staff.basicSalary, housingAllowance: staff.housingAllowance,
          transportAllowance: staff.transportAllowance, responsibilityAllowance: staff.responsibilityAllowance,
          overtime: 0, grossPay, paye: Math.round(paye * 100) / 100,
          nssaEmployee: Math.round(nssaEmp * 100) / 100, nssaEmployer: Math.round(nssaEmpr * 100) / 100,
          aidsLevy: Math.round(aidsLevy * 100) / 100, zimdef: Math.round(zimdef * 100) / 100,
          pension: 0, medicalAid: 0, funeralPolicy: 0, otherDeductions: 0,
          netPay: Math.round(netPay * 100) / 100, status: 'GENERATED',
        },
      })
      results.push({ staffId: staff.id, status: 'created', netPay: Math.round(netPay * 100) / 100 })
    }

    return ok({
      message: `Payroll processed for ${month}/${year}`,
      processed: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'already_exists').length,
      results,
    }, 201)
  } catch (error) {
    logger.error({ err: error }, 'Error processing payroll')
    return fail('INTERNAL', 'Failed to process payroll')
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return fail('VALIDATION', 'Payslip ID is required')

    // Verify payslip belongs to a staff member of the caller's school
    const existing = await db.payslip.findUnique({
      where: { id },
      select: { staff: { select: { schoolId: true } } },
    })
    if (!existing || existing.staff.schoolId !== session.user.schoolId) {
      return fail('NOT_FOUND', 'Payslip not found')
    }

    const payslip = await db.payslip.update({
      where: { id },
      data: { status: updates.status },
      include: { staff: true },
    })

    logAudit({ action: 'UPDATE', entity: 'payroll', entityId: payslip.id, afterValue: payslip }).catch(() => {})
    return ok(payslip)
  } catch (error) {
    logger.error({ err: error }, 'Error updating payslip')
    return fail('INTERNAL', 'Failed to update payslip')
  }
}

export async function DELETE(request: Request) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return fail('VALIDATION', 'Payslip ID is required')

    // Verify payslip belongs to a staff member of the caller's school
    const existing = await db.payslip.findUnique({
      where: { id },
      select: { staff: { select: { schoolId: true } } },
    })
    if (!existing || existing.staff.schoolId !== session.user.schoolId) {
      return fail('NOT_FOUND', 'Payslip not found')
    }

    await db.payslip.delete({ where: { id } })
    logAudit({ action: 'DELETE', entity: 'payroll', entityId: id }).catch(() => {})
    return ok({ message: 'Payslip deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting payslip')
    return fail('INTERNAL', 'Failed to delete payslip')
  }
}
