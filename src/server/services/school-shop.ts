import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  section?: string
  category?: string | null
  search?: string | null
  isActive?: string | null
}

export async function getShop(schoolId: string, params: ListParams) {
  const section = params.section || 'all'
  const category = params.category
  const search = params.search
  const isActive = params.isActive

  const result: Record<string, unknown> = {}

  if (section === 'stats' || section === 'all') {
    const [totalProducts, totalOrders, revenueResult] = await Promise.all([
      db.schoolShopItem.count({ where: { schoolId, isActive: true } }),
      db.schoolShopOrder.count({ where: { schoolId } }),
      db.schoolShopOrder.aggregate({
        where: { schoolId, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
    ])
    const stats = {
      totalProducts,
      totalOrders,
      totalRevenue: Number(revenueResult._sum.totalAmount ?? 0),
    }
    if (section === 'stats') return stats
    result.stats = stats
  }

  if (section === 'all' || section === 'products') {
    const where: Record<string, unknown> = { schoolId }
    if (category) where.category = category
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    result.products = await db.schoolShopItem.findMany({ where, orderBy: { sortOrder: 'asc' } })
  }

  if (section === 'all' || section === 'orders') {
    result.orders = await db.schoolShopOrder.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    })
  }

  return result
}

export async function createShopProduct(
  schoolId: string,
  data: {
    name?: string
    description?: string
    category?: string
    price?: number
    currency?: string
    imageUrl?: string
    sizes?: string
    colors?: string
    stockQuantity?: number
    isActive?: boolean
    sortOrder?: number
  },
) {
  if (!data?.name || !data?.category || data?.price === undefined) {
    throw new AppError('VALIDATION', 'name, category, and price are required')
  }

  const product = await db.schoolShopItem.create({
    data: {
      schoolId,
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      currency: (data.currency as any) || 'USD',
      imageUrl: data.imageUrl,
      sizes: data.sizes,
      colors: data.colors,
      stockQuantity: data.stockQuantity ?? 0,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  })

  logAudit({ action: 'CREATE', entity: 'school-shop', entityId: product.id, schoolId, afterValue: product }).catch(
    () => {},
  )
  return product
}

export async function createShopOrder(
  schoolId: string,
  data: {
    studentId?: string
    parentName?: string
    parentPhone?: string
    parentEmail?: string
    items?: unknown
    totalAmount?: number
    currency?: string
    notes?: string
  },
) {
  if (!data?.items || data?.totalAmount === undefined) {
    throw new AppError('VALIDATION', 'items and totalAmount are required')
  }

  const year = new Date().getFullYear()
  const lastOrder = await db.schoolShopOrder.findFirst({
    where: { schoolId, orderNumber: { startsWith: `SHOP${year}` } },
    orderBy: { orderNumber: 'desc' },
  })
  const nextNum = lastOrder ? parseInt(lastOrder.orderNumber.slice(-4)) + 1 : 1
  const orderNumber = `SHOP${year}${String(nextNum).padStart(4, '0')}`

  const order = await db.schoolShopOrder.create({
    data: {
      schoolId,
      orderNumber,
      studentId: data.studentId,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      parentEmail: data.parentEmail,
      items: typeof data.items === 'string' ? data.items : JSON.stringify(data.items),
      totalAmount: data.totalAmount,
      currency: (data.currency as any) || 'USD',
      status: 'PENDING',
      notes: data.notes,
    },
  })

  logAudit({ action: 'CREATE', entity: 'school-shop', entityId: order.id, schoolId, afterValue: order }).catch(() => {})
  return order
}

export async function updateShopProduct(schoolId: string, id: string, data: Record<string, unknown>) {
  const owned = await db.schoolShopItem.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Product not found')

  const product = await db.schoolShopItem.update({
    where: { id, schoolId },
    data: { ...data, updatedAt: new Date() },
  })

  logAudit({ action: 'UPDATE', entity: 'school-shop', entityId: id, schoolId, afterValue: product }).catch(() => {})
  return product
}

export async function updateShopOrderStatus(schoolId: string, id: string, status: string) {
  const validStatuses = ['PENDING', 'PROCESSING', 'READY', 'COLLECTED', 'CANCELLED']
  if (!status || !validStatuses.includes(status)) {
    throw new AppError('VALIDATION', 'Valid status is required (PENDING|PROCESSING|READY|COLLECTED|CANCELLED)')
  }

  const owned = await db.schoolShopOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Order not found')

  const order = await db.schoolShopOrder.update({
    where: { id, schoolId },
    data: { status: status as any, updatedAt: new Date() },
  })

  logAudit({ action: 'UPDATE', entity: 'school-shop', entityId: id, schoolId, afterValue: order }).catch(() => {})
  return order
}

export async function deleteShopProduct(schoolId: string, id: string) {
  const owned = await db.schoolShopItem.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Product not found')

  await db.schoolShopItem.delete({ where: { id, schoolId } })
  logAudit({ action: 'DELETE', entity: 'school-shop', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteShopOrder(schoolId: string, id: string) {
  const owned = await db.schoolShopOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Order not found')

  await db.schoolShopOrder.delete({ where: { id, schoolId } })
  logAudit({ action: 'DELETE', entity: 'school-shop', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleSchoolShopError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
