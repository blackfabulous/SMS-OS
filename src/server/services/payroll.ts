import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { calculatePAYE } from '@/lib/payroll-calc'

interface Period { month: number; year: number }

function gross(s: { basicSalary: unknown; housingAllowance: unknown; transportAllowance: unknown; responsibilityAllowance: unknown }) {
  return Number(s.basicSalary) + Number(s.housingAllowance) + Number(s.transportAllowance) + Number(s.responsibilityAllowance)
}

export async function getPayroll(schoolId: string, period: Period) {
  const { month, year } = period

  const [staff, payslips] = await Promise.all([
    db.staff.findMany({
      where: { schoolId, isActive: true, payrollStatus: 'ACTIVE', payType: 'SCHOOL_PAID' },
      include: { payslips: { where: { periodMonth: month, periodYear: year } } },
      orderBy: { lastName: 'asc' },
    }),
    db.payslip.findMany({
      where: { periodMonth: month, periodYear: year, staff: { schoolId } },
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalPayroll = staff.reduce((sum, s) => sum + gross(s), 0)
  const totalDeductions = staff.reduce((sum, s) => {
    const g = gross(s)
    const paye = calculatePAYE(g)
    const nssa = Math.min(g * 0.045, 339)
    const aidsLevy = paye * 0.06
    return sum + paye + nssa + aidsLevy
  }, 0)

  const payeSummary = staff.reduce((acc, s) => acc + calculatePAYE(gross(s)), 0)
  const nssaEmployee = staff.reduce((acc, s) => acc + Math.min(gross(s) * 0.045, 339), 0)
  const nssaEmployer = nssaEmployee

  return {
    staff: staff.map((s) => ({
      id: s.id,
      staffNumber: s.staffNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      position: s.position,
      department: s.department,
      staffType: s.staffType,
      basicSalary: s.basicSalary,
      housingAllowance: s.housingAllowance,
      transportAllowance: s.transportAllowance,
      responsibilityAllowance: s.responsibilityAllowance,
      grossPay: gross(s),
      hasPayslip: s.payslips.length > 0,
    })),
    payslips,
    stats: {
      totalStaff: staff.length,
      totalPayroll,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
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
  }
}

export async function runPayroll(schoolId: string, period: Period) {
  const { month, year } = period

  const staffMembers = await db.staff.findMany({
    where: { schoolId, isActive: true, payrollStatus: 'ACTIVE', payType: 'SCHOOL_PAID' },
  })
  const results: { staffId: string; status: string; netPay?: number }[] = []

  for (const staff of staffMembers) {
    const existing = await db.payslip.findUnique({
      where: { staffId_periodMonth_periodYear: { staffId: staff.id, periodMonth: month, periodYear: year } },
    })
    if (existing) {
      results.push({ staffId: staff.id, status: 'already_exists' })
      continue
    }

    const grossPay = gross(staff)
    const paye = calculatePAYE(grossPay)
    const nssaEmp = Math.min(grossPay * 0.045, 339)
    const nssaEmpr = Math.min(grossPay * 0.045, 339)
    const aidsLevy = paye * 0.06
    const zimdef = grossPay * 0.01
    const totalDeductions = paye + nssaEmp + aidsLevy + zimdef
    const netPay = grossPay - totalDeductions

    await db.payslip.create({
      data: {
        schoolId,
        staffId: staff.id,
        periodMonth: month,
        periodYear: year,
        basicSalary: staff.basicSalary as any,
        housingAllowance: staff.housingAllowance as any,
        transportAllowance: staff.transportAllowance as any,
        responsibilityAllowance: staff.responsibilityAllowance as any,
        overtime: 0,
        grossPay: grossPay as any,
        paye: Math.round(paye * 100) / 100 as any,
        nssaEmployee: Math.round(nssaEmp * 100) / 100 as any,
        nssaEmployer: Math.round(nssaEmpr * 100) / 100 as any,
        aidsLevy: Math.round(aidsLevy * 100) / 100 as any,
        zimdef: Math.round(zimdef * 100) / 100 as any,
        pension: 0,
        medicalAid: 0,
        funeralPolicy: 0,
        otherDeductions: 0,
        netPay: Math.round(netPay * 100) / 100 as any,
        status: 'GENERATED' as any,
      },
    })
    results.push({ staffId: staff.id, status: 'created', netPay: Math.round(netPay * 100) / 100 })
  }

  logAudit({ action: 'CREATE', entity: 'payroll', schoolId, afterValue: { month, year, processed: results.length } }).catch(
    () => {},
  )

  return {
    message: `Payroll processed for ${month}/${year}`,
    processed: results.filter((r) => r.status === 'created').length,
    skipped: results.filter((r) => r.status === 'already_exists').length,
    results,
  }
}

export async function updatePayslip(schoolId: string, id: string, updates: { status?: string }) {
  const existing = await db.payslip.findUnique({
    where: { id },
    select: { staff: { select: { schoolId: true } } },
  })
  if (!existing || existing.staff.schoolId !== schoolId) throw new AppError('NOT_FOUND', 'Payslip not found')

  const payslip = await db.payslip.update({
    where: { id },
    data: { status: updates.status as any },
    include: { staff: true },
  })

  logAudit({ action: 'UPDATE', entity: 'payroll', entityId: payslip.id, schoolId, afterValue: payslip }).catch(() => {})
  return payslip
}

export async function deletePayslip(schoolId: string, id: string) {
  const existing = await db.payslip.findUnique({
    where: { id },
    select: { staff: { select: { schoolId: true } } },
  })
  if (!existing || existing.staff.schoolId !== schoolId) throw new AppError('NOT_FOUND', 'Payslip not found')

  await db.payslip.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'payroll', entityId: id, schoolId }).catch(() => {})
  return { message: 'Payslip deleted successfully' }
}

export function handlePayrollError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
