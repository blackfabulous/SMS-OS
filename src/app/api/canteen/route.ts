import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category
    if (search) {
      where.OR = [{ name: { contains: search } }, { category: { contains: search } }]
    }

    const [items, total] = await Promise.all([
      db.canteenItem.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
      db.canteenItem.count({ where }),
    ])

    const transactions = await db.canteenTransaction.findMany({
      include: { items: { include: { item: true } } },
      orderBy: { createdAt: 'desc' }, take: 50,
    })

    const totalItems = await db.canteenItem.count({ where: { isActive: true } })
    const lowStockCount = await db.canteenItem.count({ where: { isActive: true, stockQuantity: { lte: 5 } } })
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayTransactions = await db.canteenTransaction.findMany({ where: { createdAt: { gte: todayStart } } })
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0)

    const categoryBreakdown = await db.canteenItem.groupBy({ by: ['category'], where: { isActive: true }, _count: { id: true } })

    return NextResponse.json({
      items, transactions, total, page, totalPages: Math.ceil(total / limit),
      stats: { totalItems, lowStockItems: lowStockCount, todayRevenue, todayTransactions: todayTransactions.length,
        categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category, count: c._count.id })) },
    })
  } catch (error) {
    console.error('Failed to fetch canteen data:', error)
    return NextResponse.json({ error: 'Failed to fetch canteen data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    if (action === 'addItem') {
      const { name, category, price, costPrice, stockQuantity, reorderLevel } = body
      if (!name) return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
      const item = await db.canteenItem.create({
        data: { schoolId: schoolId || 'default', name, category: category || 'FOOD', price: price || 0, costPrice: costPrice || 0, stockQuantity: stockQuantity || 0, reorderLevel: reorderLevel || 5 },
      })
      return NextResponse.json(item, { status: 201 })
    }

    if (action === 'transaction') {
      const { buyerType, buyerId, buyerName, paymentMethod, items } = body
      if (!items || !Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'Items are required' }, { status: 400 })

      const currentYear = new Date().getFullYear()
      const lastTx = await db.canteenTransaction.findFirst({ where: { transactionNumber: { startsWith: `CTX${currentYear}` } }, orderBy: { transactionNumber: 'desc' } })
      const nextNum = lastTx ? parseInt(lastTx.transactionNumber.slice(-4)) + 1 : 1
      const transactionNumber = `CTX${currentYear}${String(nextNum).padStart(4, '0')}`
      const totalAmount = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)

      const transaction = await db.canteenTransaction.create({
        data: {
          schoolId: schoolId || 'default', transactionNumber,
          buyerType: buyerType || 'STUDENT', buyerId: buyerId || null,
          buyerName: buyerName || 'Walk-in', totalAmount,
          paymentMethod: paymentMethod || 'CASH', status: 'COMPLETED',
          items: { create: items.map((item: { itemId: string; quantity: number; unitPrice: number }) => ({ itemId: item.itemId, quantity: item.quantity || 1, unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice })) },
        },
        include: { items: { include: { item: true } } },
      })

      for (const item of items) {
        await db.canteenItem.update({ where: { id: item.itemId }, data: { stockQuantity: { decrement: item.quantity } } })
      }

      return NextResponse.json(transaction, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process canteen request:', error)
    return NextResponse.json({ error: 'Failed to process canteen request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const item = await db.canteenItem.update({ where: { id }, data: { name: updates.name, category: updates.category, price: updates.price, costPrice: updates.costPrice, stockQuantity: updates.stockQuantity, reorderLevel: updates.reorderLevel, isActive: updates.isActive } })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update canteen item:', error)
    return NextResponse.json({ error: 'Failed to update canteen item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.canteenItem.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Canteen item deleted successfully' })
  } catch (error) {
    console.error('Failed to delete canteen item:', error)
    return NextResponse.json({ error: 'Failed to delete canteen item' }, { status: 500 })
  }
}
