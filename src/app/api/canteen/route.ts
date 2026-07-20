import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import {
  listCanteen,
  createCanteenItem,
  recordCanteenTransaction,
  updateCanteenItem,
  deleteCanteenItem,
  handleCanteenError,
} from '@/server/services/canteen'

// GET /api/canteen - List menu items, sales, stock with category/status filters
export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // items | sales | stock
    const category = searchParams.get('category')
    const status = searchParams.get('status') // active | low_stock | inactive
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const paymentMethod = searchParams.get('paymentMethod')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const result = await listCanteen(tenantResult.schoolId, {
      type,
      category,
      status,
      search,
      page,
      limit,
      paymentMethod,
      dateFrom,
      dateTo,
    })
    return ok(result)
  } catch (error) {
    const { code, message } = handleCanteenError(error, 'Failed to fetch canteen data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// POST /api/canteen - Create menu item or record sale
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (action === 'addItem') {
      const item = await createCanteenItem(schoolId, body)
      return ok(item, 201)
    }

    if (action === 'transaction') {
      const transaction = await recordCanteenTransaction(schoolId, body)
      return ok(transaction, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use addItem or transaction')
  } catch (error) {
    const { code, message } = handleCanteenError(error, 'Failed to process canteen request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// PUT /api/canteen - Update menu item
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const schoolId = authResult.session.user.schoolId
    const item = await updateCanteenItem(schoolId, body)
    return ok(item)
  } catch (error) {
    const { code, message } = handleCanteenError(error, 'Failed to update canteen item')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// DELETE /api/canteen - Soft delete menu item
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return fail('VALIDATION', 'ID is required')

    const schoolId = authResult.session.user.schoolId
    const result = await deleteCanteenItem(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleCanteenError(error, 'Failed to delete canteen item')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
