import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

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
    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('VALIDATION', 'School not configured')
    }

    if (section === 'stats') {
      const [totalProducts, totalOrders, revenueResult] = await Promise.all([
        db.schoolShopItem.count({ where: { schoolId, isActive: true } }),
        db.schoolShopOrder.count({ where: { schoolId } }),
        db.schoolShopOrder.aggregate({ where: { schoolId, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      ])
      return ok({ totalProducts, totalOrders, totalRevenue: Number(revenueResult._sum.totalAmount ?? 0) })
    }

    const result: Record<string, unknown> = {}

    if (section === 'all' || section === 'products') {
      const where: Record<string, unknown> = { schoolId }
      if (category) where.category = category
      if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
      if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }]
      result.products = await db.schoolShopItem.findMany({ where, orderBy: { sortOrder: 'asc' } })
    }

    if (section === 'all' || section === 'orders') {
      result.orders = await db.schoolShopOrder.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } })
    }

    if (section === 'all') {
      const [totalProducts, totalOrders, revenueResult] = await Promise.all([
        db.schoolShopItem.count({ where: { schoolId, isActive: true } }),
        db.schoolShopOrder.count({ where: { schoolId } }),
        db.schoolShopOrder.aggregate({ where: { schoolId, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      ])
      result.stats = { totalProducts, totalOrders, totalRevenue: Number(revenueResult._sum.totalAmount ?? 0) }
    }

    return ok(result)
  } catch (error) {
    logger.error({ err: error }, 'Shop GET error')
    return fail('INTERNAL', 'Failed to fetch shop data')
  }
}

// POST /api/school-shop - Create product or order
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, data } = body
    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('VALIDATION', 'School not configured')
    }

    if (action === 'createProduct') {
      if (!data?.name || !data?.category || data?.price === undefined) {
        return fail('VALIDATION', 'name, category, and price are required')
      }
      const product = await db.schoolShopItem.create({
        data: { schoolId, name: data.name, description: data.description, category: data.category, price: data.price, currency: data.currency || 'USD', imageUrl: data.imageUrl, sizes: data.sizes, colors: data.colors, stockQuantity: data.stockQuantity ?? 0, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 },
      })
      logAudit({ action: 'CREATE', entity: 'school-shop' }).catch(() => {})
      return ok(product, 201)
    }

    if (action === 'createOrder') {
      if (!data?.items || !data?.totalAmount) {
        return fail('VALIDATION', 'items and totalAmount are required')
      }
      const year = new Date().getFullYear()
      const lastOrder = await db.schoolShopOrder.findFirst({
        where: { orderNumber: { startsWith: `SHOP${year}` } },
        orderBy: { orderNumber: 'desc' },
      })
      const nextNum = lastOrder ? parseInt(lastOrder.orderNumber.slice(-4)) + 1 : 1
      const orderNumber = `SHOP${year}${String(nextNum).padStart(4, '0')}`

      const order = await db.schoolShopOrder.create({
        data: { schoolId, orderNumber, studentId: data.studentId, parentName: data.parentName, parentPhone: data.parentPhone, parentEmail: data.parentEmail, items: typeof data.items === 'string' ? data.items : JSON.stringify(data.items), totalAmount: data.totalAmount, currency: data.currency || 'USD', status: 'PENDING', notes: data.notes },
      })
      logAudit({ action: 'CREATE', entity: 'school-shop' }).catch(() => {})
      return ok(order, 201)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    logger.error({ err: error }, 'Shop POST error')
    return fail('INTERNAL', 'Failed to create shop content')
  }
}

// PUT /api/school-shop - Update product or order status
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action, id, data } = body

    if (!id) return fail('VALIDATION', 'ID is required')

    if (action === 'updateProduct') {
      const owned = await db.schoolShopItem.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      const product = await db.schoolShopItem.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'school-shop', entityId: (body?.id ?? undefined) }).catch(() => {})
      return ok(product)
    }

    if (action === 'updateOrderStatus') {
      const validStatuses = ['PENDING', 'PROCESSING', 'READY', 'COLLECTED', 'CANCELLED']
      if (!data?.status || !validStatuses.includes(data.status)) {
        return fail('VALIDATION', 'Valid status is required (PENDING|PROCESSING|READY|COLLECTED|CANCELLED)')
      }
      const ownedOrder = await db.schoolShopOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!ownedOrder) return fail('NOT_FOUND', 'Not found')
      const order = await db.schoolShopOrder.update({ where: { id }, data: { status: data.status, updatedAt: new Date() } })
      logAudit({ action: 'UPDATE', entity: 'school-shop', entityId: (body?.id ?? undefined) }).catch(() => {})
      return ok(order)
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    logger.error({ err: error }, 'Shop PUT error')
    return fail('INTERNAL', 'Failed to update shop content')
  }
}

// DELETE /api/school-shop - Delete product or order
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action, id } = body

    if (!id) return fail('VALIDATION', 'ID is required')

    if (action === 'deleteProduct') {
      const owned = await db.schoolShopItem.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.schoolShopItem.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'school-shop', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }
    if (action === 'deleteOrder') {
      const owned = await db.schoolShopOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Not found')
      await db.schoolShopOrder.delete({ where: { id } })
      logAudit({ action: 'DELETE', entity: 'school-shop', entityId: (id ?? undefined) }).catch(() => {})
      return ok({ deleted: true })
    }

    return fail('VALIDATION', 'Invalid action')
  } catch (error) {
    logger.error({ err: error }, 'Shop DELETE error')
    return fail('INTERNAL', 'Failed to delete shop content')
  }
}
