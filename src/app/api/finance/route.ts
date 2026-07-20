import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import { getFinancialDashboard, reverseFinancePayment, handleFinanceError } from '@/server/services/finance'

export async function GET() {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const result = await getFinancialDashboard(tenantResult.schoolId)
    return ok(result)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to fetch financial dashboard')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id } = body

    if (action === 'reversePayment' && id) {
      const payment = await reverseFinancePayment(authResult.session.user.schoolId, id)
      return ok(payment)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to update finance record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
