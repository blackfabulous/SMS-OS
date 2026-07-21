import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import { RunPayrollSchema } from '@/lib/validations'
import { getPayroll, runPayroll, updatePayslip, deletePayslip, handlePayrollError } from '@/server/services/payroll'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const result = await getPayroll(tenantResult.schoolId, { month, year })
    return ok(result)
  } catch (error) {
    const { code, message } = handlePayrollError(error, 'Failed to fetch payroll data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const parsed = RunPayrollSchema.safeParse(body)
    if (!parsed.success) return fail('VALIDATION', 'Validation failed', parsed.error.issues)

    const result = await runPayroll(authResult.session.user.schoolId, parsed.data)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handlePayrollError(error, 'Failed to process payroll')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Payslip ID is required')

    const payslip = await updatePayslip(schoolId, id, updates)
    return ok(payslip)
  } catch (error) {
    const { code, message } = handlePayrollError(error, 'Failed to update payslip')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'Payslip ID is required')

    const result = await deletePayslip(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handlePayrollError(error, 'Failed to delete payslip')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
