import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Zimbabwe PAYE tax brackets (2024)
function calculatePAYE(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  const brackets = [
    { limit: 300, rate: 0 },
    { limit: 1500, rate: 0.2 },
    { limit: 5000, rate: 0.25 },
    { limit: 10000, rate: 0.3 },
    { limit: 20000, rate: 0.35 },
    { limit: Infinity, rate: 0.4 },
  ]

  let paye = 0
  let remaining = taxableIncome
  let prevLimit = 0

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit)
    if (taxableInBracket <= 0) break
    paye += taxableInBracket * bracket.rate
    remaining -= taxableInBracket
    prevLimit = bracket.limit
  }

  return Math.round(paye * 100) / 100
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Get all active staff with payroll info
    const staff = await db.staff.findMany({
      where: {
        isActive: true,
        payrollStatus: 'ACTIVE',
        payType: 'SCHOOL_PAID',
      },
      include: {
        payslips: {
          where: { periodMonth: month, periodYear: year },
        },
      },
      orderBy: { lastName: 'asc' },
    })

    const totalPayroll = staff.reduce((sum, s) => sum + s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance, 0)
    const totalDeductions = staff.reduce((sum, s) => {
      const gross = s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance
      const paye = calculatePAYE(gross)
      const nssa = Math.min(gross * 0.045, 339) // 4.5% employee contribution, capped
      const aidsLevy = paye * 0.06 // 6% of PAYE
      return sum + paye + nssa + aidsLevy
    }, 0)
    const totalNetPay = totalPayroll - totalDeductions

    // Get existing payslips for the period
    const payslips = await db.payslip.findMany({
      where: { periodMonth: month, periodYear: year },
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
    })

    // PAYE summary
    const payeSummary = staff.reduce((acc, s) => {
      const gross = s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance
      const paye = calculatePAYE(gross)
      return acc + paye
    }, 0)

    // NSSA summary
    const nssaEmployee = staff.reduce((acc, s) => {
      const gross = s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance
      return acc + Math.min(gross * 0.045, 339)
    }, 0)

    const nssaEmployer = staff.reduce((acc, s) => {
      const gross = s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance
      return acc + Math.min(gross * 0.045, 339)
    }, 0)

    // Salary distribution data
    const salaryRanges = [
      { range: '$0-500', min: 0, max: 500 },
      { range: '$501-1000', min: 501, max: 1000 },
      { range: '$1001-2000', min: 1001, max: 2000 },
      { range: '$2001-3000', min: 2001, max: 3000 },
      { range: '$3001-5000', min: 3001, max: 5000 },
      { range: '$5000+', min: 5001, max: Infinity },
    ]

    const distribution = salaryRanges.map((range) => ({
      range: range.range,
      count: staff.filter((s) => {
        const gross = s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance
        return gross >= range.min && gross <= range.max
      }).length,
    }))

    return NextResponse.json({
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
        grossPay: s.basicSalary + s.housingAllowance + s.transportAllowance + s.responsibilityAllowance,
        hasPayslip: s.payslips.length > 0,
      })),
      payslips,
      stats: {
        totalStaff: staff.length,
        totalPayroll,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetPay: Math.round(totalNetPay * 100) / 100,
        payeTotal: Math.round(payeSummary * 100) / 100,
        nssaEmployee: Math.round(nssaEmployee * 100) / 100,
        nssaEmployer: Math.round(nssaEmployer * 100) / 100,
        aidsLevy: Math.round(payeSummary * 0.06 * 100) / 100,
        zimdef: Math.round(totalPayroll * 0.01 * 100) / 100, // 1% of payroll
        payslipsGenerated: payslips.length,
      },
      distribution,
      period: { month, year },
    })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Failed to fetch payroll data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { month, year } = body

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
    }

    // Get all active school-paid staff
    const staffMembers = await db.staff.findMany({
      where: { isActive: true, payrollStatus: 'ACTIVE', payType: 'SCHOOL_PAID' },
    })

    const results = []

    for (const staff of staffMembers) {
      // Check if payslip already exists
      const existing = await db.payslip.findUnique({
        where: {
          staffId_periodMonth_periodYear: {
            staffId: staff.id,
            periodMonth: month,
            periodYear: year,
          },
        },
      })

      if (existing) {
        results.push({ staffId: staff.id, status: 'already_exists' })
        continue
      }

      const grossPay = staff.basicSalary + staff.housingAllowance + staff.transportAllowance + staff.responsibilityAllowance
      const paye = calculatePAYE(grossPay)
      const nssaEmployee = Math.min(grossPay * 0.045, 339)
      const nssaEmployer = Math.min(grossPay * 0.045, 339)
      const aidsLevy = paye * 0.06
      const zimdef = grossPay * 0.01

      const totalDeductions = paye + nssaEmployee + aidsLevy + zimdef
      const netPay = grossPay - totalDeductions

      await db.payslip.create({
        data: {
          staffId: staff.id,
          periodMonth: month,
          periodYear: year,
          basicSalary: staff.basicSalary,
          housingAllowance: staff.housingAllowance,
          transportAllowance: staff.transportAllowance,
          responsibilityAllowance: staff.responsibilityAllowance,
          overtime: 0,
          grossPay,
          paye: Math.round(paye * 100) / 100,
          nssaEmployee: Math.round(nssaEmployee * 100) / 100,
          nssaEmployer: Math.round(nssaEmployer * 100) / 100,
          aidsLevy: Math.round(aidsLevy * 100) / 100,
          zimdef: Math.round(zimdef * 100) / 100,
          pension: 0,
          medicalAid: 0,
          funeralPolicy: 0,
          otherDeductions: 0,
          netPay: Math.round(netPay * 100) / 100,
          status: 'APPROVED',
        },
      })

      results.push({ staffId: staff.id, status: 'created', netPay: Math.round(netPay * 100) / 100 })
    }

    return NextResponse.json({
      message: `Payroll processed for ${month}/${year}`,
      processed: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'already_exists').length,
      results,
    }, { status: 201 })
  } catch (error) {
    console.error('Error processing payroll:', error)
    return NextResponse.json({ error: 'Failed to process payroll' }, { status: 500 })
  }
}
