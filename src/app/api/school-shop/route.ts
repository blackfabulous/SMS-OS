import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import {
  getShop,
  createShopProduct,
  createShopOrder,
  updateShopProduct,
  updateShopOrderStatus,
  deleteShopProduct,
  deleteShopOrder,
  handleSchoolShopError,
} from '@/server/services/school-shop'

// GET /api/school-shop - Returns shop data
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const schoolId = authResult.session.user.schoolId
    if (!schoolId) return fail('VALIDATION', 'School not configured')

    const result = await getShop(schoolId, { section, category, search, isActive })
    return ok(result)
  } catch (error) {
    const { code, message } = handleSchoolShopError(error, 'Failed to fetch shop data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// POST /api/school-shop - Create product or order
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, data } = body
    const schoolId = authResult.session.user.schoolId

    if (action === 'createProduct') {
      const product = await createShopProduct(schoolId, data)
      return ok(product, 201)
    }

    if (action === 'createOrder') {
      const order = await createShopOrder(schoolId, data)
      return ok(order, 201)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    const { code, message } = handleSchoolShopError(error, 'Failed to create shop content')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// PUT /api/school-shop - Update product or order status
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id, data } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (action === 'updateProduct') {
      const product = await updateShopProduct(schoolId, id, data)
      return ok(product)
    }

    if (action === 'updateOrderStatus') {
      const order = await updateShopOrderStatus(schoolId, id, data?.status)
      return ok(order)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    const { code, message } = handleSchoolShopError(error, 'Failed to update shop content')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// DELETE /api/school-shop - Delete product or order
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, id } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (action === 'deleteProduct') {
      const result = await deleteShopProduct(schoolId, id)
      return ok(result)
    }

    if (action === 'deleteOrder') {
      const result = await deleteShopOrder(schoolId, id)
      return ok(result)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    const { code, message } = handleSchoolShopError(error, 'Failed to delete shop content')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
