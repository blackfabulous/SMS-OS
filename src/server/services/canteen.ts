import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  type?: string | null
  category?: string | null
  status?: string | null
  search?: string
  page?: number
  limit?: number
  paymentMethod?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export async function listCanteen(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''

  if (params.type === 'sales') {
    const txWhere: Record<string, unknown> = { schoolId }
    if (params.paymentMethod) txWhere.paymentMethod = params.paymentMethod
    if (params.status) txWhere.status = params.status
    if (params.dateFrom || params.dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (params.dateFrom) dateFilter.gte = new Date(params.dateFrom)
      if (params.dateTo) dateFilter.lte = new Date(params.dateTo)
      txWhere.createdAt = dateFilter
    }

    const [transactions, total, totalRevenue] = await Promise.all([
      db.canteenTransaction.findMany({
        where: txWhere,
        include: { items: { include: { item: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.canteenTransaction.count({ where: txWhere }),
      db.canteenTransaction.aggregate({
        where: txWhere,
        _sum: { totalAmount: true },
      }),
    ])

    return {
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    }
  }

  if (params.type === 'stock') {
    const stockWhere: Record<string, unknown> = { schoolId }
    if (params.category) stockWhere.category = params.category
    if (params.status === 'low_stock') {
      stockWhere.stockQuantity = { lte: 5 }
    } else if (params.status === 'inactive') {
      stockWhere.isActive = false
    } else {
      stockWhere.isActive = true
    }
    if (search) {
      stockWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total, lowStockItems] = await Promise.all([
      db.canteenItem.findMany({
        where: stockWhere,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.canteenItem.count({ where: stockWhere }),
      db.canteenItem.findMany({
        where: { schoolId, isActive: true, stockQuantity: { lte: 5 } },
      }),
    ])

    return {
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      lowStockItems,
    }
  }

  const where: Record<string, unknown> = { schoolId, isActive: true }
  if (params.category) where.category = params.category
  if (params.status === 'inactive') where.isActive = false
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [items, total, totalItems, lowStockCount, todayTransactions, categoryBreakdown] = await Promise.all([
    db.canteenItem.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    db.canteenItem.count({ where }),
    db.canteenItem.count({ where: { schoolId, isActive: true } }),
    db.canteenItem.count({ where: { schoolId, isActive: true, stockQuantity: { lte: 5 } } }),
    db.canteenTransaction.findMany({
      where: { schoolId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    db.canteenItem.groupBy({
      by: ['category'],
      where: { schoolId, isActive: true },
      _count: { id: true },
    }),
  ])

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + Number(t.totalAmount), 0)

  return {
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalItems,
      lowStockItems: lowStockCount,
      todayRevenue,
      todayTransactions: todayTransactions.length,
      categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category, count: c._count.id })),
    },
  }
}

export async function createCanteenItem(schoolId: string, body: Record<string, unknown>) {
  const { name, category, price, costPrice, stockQuantity, reorderLevel } = body as {
    name?: string
    category?: string
    price?: number
    costPrice?: number
    stockQuantity?: number
    reorderLevel?: number
  }

  if (!name) {
    throw new AppError('VALIDATION', 'Item name is required')
  }

  const item = await db.canteenItem.create({
    data: {
      schoolId,
      name,
      category: (category as any) || 'FOOD',
      price: price || 0,
      costPrice: costPrice || 0,
      stockQuantity: stockQuantity || 0,
      reorderLevel: reorderLevel ?? 5,
    },
  })

  logAudit({ action: 'CREATE', entity: 'canteen', entityId: item.id, schoolId, afterValue: item }).catch(() => {})
  return item
}

interface TransactionItemInput {
  itemId: string
  quantity?: number
  unitPrice?: number
}

export async function recordCanteenTransaction(schoolId: string, body: Record<string, unknown>) {
  const { buyerType, buyerId, buyerName, paymentMethod, items } = body as {
    buyerType?: string
    buyerId?: string
    buyerName?: string
    paymentMethod?: string
    items?: TransactionItemInput[]
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('VALIDATION', 'Items are required')
  }

  const currentYear = new Date().getFullYear()
  const lastTx = await db.canteenTransaction.findFirst({
    where: { schoolId, transactionNumber: { startsWith: `CTX${currentYear}` } },
    orderBy: { transactionNumber: 'desc' },
  })
  const nextNum = lastTx ? parseInt(lastTx.transactionNumber.slice(-4)) + 1 : 1
  const transactionNumber = `CTX${currentYear}${String(nextNum).padStart(4, '0')}`

  const totalAmount = items.reduce((sum: number, item: TransactionItemInput) => {
    const quantity = item.quantity || 1
    const unitPrice = item.unitPrice || 0
    return sum + quantity * unitPrice
  }, 0)

  const transaction = await db.canteenTransaction.create({
    data: {
      schoolId,
      transactionNumber,
      buyerType: (buyerType as any) || 'STUDENT',
      buyerId: buyerId || null,
      buyerName: buyerName || 'Walk-in',
      totalAmount,
      paymentMethod: (paymentMethod as any) || 'CASH',
      status: 'COMPLETED',
      items: {
        create: items.map((item) => {
          const quantity = item.quantity || 1
          const unitPrice = item.unitPrice || 0
          return {
            schoolId,
            itemId: item.itemId,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
          }
        }),
      },
    },
    include: { items: { include: { item: true } } },
  })

  for (const item of items) {
    const quantity = item.quantity || 1
    await db.canteenItem.update({
      where: { id: item.itemId },
      data: { stockQuantity: { decrement: quantity } },
    })
  }

  logAudit({ action: 'CREATE', entity: 'canteen', entityId: transaction.id, schoolId, afterValue: transaction }).catch(
    () => {},
  )
  return transaction
}

export async function updateCanteenItem(schoolId: string, body: Record<string, unknown>) {
  const { id, ...updates } = body as { id?: string; [key: string]: unknown }
  if (!id) {
    throw new AppError('VALIDATION', 'ID is required')
  }

  const owned = await db.canteenItem.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Canteen item not found')

  const item = await db.canteenItem.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      category: updates.category as any,
      price: updates.price as number | undefined,
      costPrice: updates.costPrice as number | undefined,
      stockQuantity: updates.stockQuantity as number | undefined,
      reorderLevel: updates.reorderLevel as number | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'canteen', entityId: item.id, schoolId, afterValue: item }).catch(() => {})
  return item
}

export async function deleteCanteenItem(schoolId: string, id: string) {
  const owned = await db.canteenItem.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Canteen item not found')

  await db.canteenItem.update({ where: { id }, data: { isActive: false } })

  logAudit({ action: 'DELETE', entity: 'canteen', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleCanteenError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
