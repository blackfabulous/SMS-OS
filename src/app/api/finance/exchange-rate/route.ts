import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// In-memory exchange rate storage (would be in DB in production)
let exchangeRate = {
  rate: 26.5,
  lastUpdated: new Date().toISOString(),
  source: 'Reserve Bank of Zimbabwe',
  updatedBy: 'System',
}

// GET /api/finance/exchange-rate - Get current USD/ZiG exchange rate
export async function GET() {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  return ok({
    rate: exchangeRate.rate,
    lastUpdated: exchangeRate.lastUpdated,
    source: exchangeRate.source,
    updatedBy: exchangeRate.updatedBy,
    from: 'USD',
    to: 'ZiG',
    note: 'Exchange rate for Zimbabwe Gold (ZiG) against USD',
  })
}

// PUT /api/finance/exchange-rate - Update exchange rate (admin only)
export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()

    if (!body.rate || typeof body.rate !== 'number' || body.rate <= 0) {
      return fail('VALIDATION', 'Invalid rate. Must be a positive number.')
    }

    exchangeRate = {
      rate: body.rate,
      lastUpdated: new Date().toISOString(),
      source: body.source || 'Manual Update',
      updatedBy: body.updatedBy || 'Admin',
    }

    logAudit({ action: 'UPDATE', entity: 'exchange-rate', entityId: (body?.id ?? undefined) }).catch(() => {})
    return ok({
      message: 'Exchange rate updated successfully',
      rate: exchangeRate.rate,
      lastUpdated: exchangeRate.lastUpdated,
      source: exchangeRate.source,
      updatedBy: exchangeRate.updatedBy,
    })
  } catch (error) {
    logger.error({ err: error }, 'Error updating exchange rate')
    return fail('VALIDATION', 'Invalid request body')
  }
}
