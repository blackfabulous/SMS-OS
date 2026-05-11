import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/canteen - List menu items, sales, stock with category/status filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // items | sales | stock
    const category = searchParams.get('category')
    const status = searchParams.get('status') // active | low_stock | inactive
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const school = await db.school.findFirst()
    const schoolId = school?.id

    // Sales / transactions
    if (type === 'sales') {
      const paymentMethod = searchParams.get('paymentMethod')
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')

      const txWhere: Record<string, unknown> = { schoolId }
      if (paymentMethod) txWhere.paymentMethod = paymentMethod
      if (status) txWhere.status = status
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {}
        if (dateFrom) dateFilter.gte = new Date(dateFrom)
        if (dateTo) dateFilter.lte = new Date(dateTo)
        txWhere.createdAt = dateFilter
      }

      const [transactions, total] = await Promise.all([
        db.canteenTransaction.findMany({
          where: txWhere,
          include: { items: { include: { item: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.canteenTransaction.count({ where: txWhere }),
      ])

      const totalRevenue = await db.canteenTransaction.aggregate({
        where: txWhere,
        _sum: { totalAmount: true },
      })

      return NextResponse.json({
        data: transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      })
    }

    // Stock view - items with stock info
    if (type === 'stock') {
      const stockWhere: Record<string, unknown> = { schoolId }
      if (category) stockWhere.category = category
      if (status === 'low_stock') {
        stockWhere.stockQuantity = { lte: db.canteenItem.fields.reorderLevel ? 5 : 5 }
      } else if (status === 'inactive') {
        stockWhere.isActive = false
      } else {
        stockWhere.isActive = true
      }
      if (search) {
        stockWhere.OR = [
          { name: { contains: search } },
          { category: { contains: search } },
        ]
      }

      const [items, total] = await Promise.all([
        db.canteenItem.findMany({
          where: stockWhere,
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        db.canteenItem.count({ where: stockWhere }),
      ])

      const lowStockItems = await db.canteenItem.findMany({
        where: { schoolId, isActive: true, stockQuantity: { lte: 5 } },
      })

      return NextResponse.json({
        data: items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        lowStockItems,
      })
    }

    // Default: menu items
    const where: Record<string, unknown> = { schoolId, isActive: true }
    if (category) where.category = category
    if (status === 'inactive') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
      ]
    }

    const [items, total] = await Promise.all([
      db.canteenItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.canteenItem.count({ where }),
    ])

    // Statistics
    const totalItems = await db.canteenItem.count({ where: { schoolId, isActive: true } })
    const lowStockCount = await db.canteenItem.count({
      where: { schoolId, isActive: true, stockQuantity: { lte: 5 } },
    })
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTransactions = await db.canteenTransaction.findMany({
      where: { schoolId, createdAt: { gte: todayStart } },
    })
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0)

    const categoryBreakdown = await db.canteenItem.groupBy({
      by: ['category'],
      where: { schoolId, isActive: true },
      _count: { id: true },
    })

    return NextResponse.json({
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalItems,
        lowStockItems: lowStockCount,
        todayRevenue,
        todayTransactions: todayTransactions.length,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch canteen data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch canteen data' },
      { status: 500 }
    )
  }
}

// POST /api/canteen - Create menu item or record sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Add menu item
    if (action === 'addItem') {
      const { name, category, price, costPrice, stockQuantity, reorderLevel } = body
      if (!name) {
        return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
      }

      const item = await db.canteenItem.create({
        data: {
          schoolId,
          name,
          category: category || 'FOOD',
          price: price || 0,
          costPrice: costPrice || 0,
          stockQuantity: stockQuantity || 0,
          reorderLevel: reorderLevel || 5,
        },
      })
      return NextResponse.json(item, { status: 201 })
    }

    // Record sale / transaction
    if (action === 'transaction') {
      const { buyerType, buyerId, buyerName, paymentMethod, items } = body
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'Items are required' }, { status: 400 })
      }

      // Generate transaction number
      const currentYear = new Date().getFullYear()
      const lastTx = await db.canteenTransaction.findFirst({
        where: { transactionNumber: { startsWith: `CTX${currentYear}` } },
        orderBy: { transactionNumber: 'desc' },
      })
      const nextNum = lastTx ? parseInt(lastTx.transactionNumber.slice(-4)) + 1 : 1
      const transactionNumber = `CTX${currentYear}${String(nextNum).padStart(4, '0')}`

      const totalAmount = items.reduce(
        (sum: number, item: { quantity: number; unitPrice: number }) =>
          sum + item.quantity * item.unitPrice,
        0
      )

      const transaction = await db.canteenTransaction.create({
        data: {
          schoolId,
          transactionNumber,
          buyerType: buyerType || 'STUDENT',
          buyerId: buyerId || null,
          buyerName: buyerName || 'Walk-in',
          totalAmount,
          paymentMethod: paymentMethod || 'CASH',
          status: 'COMPLETED',
          items: {
            create: items.map(
              (item: { itemId: string; quantity: number; unitPrice: number }) => ({
                itemId: item.itemId,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
              })
            ),
          },
        },
        include: { items: { include: { item: true } } },
      })

      // Decrease stock for each item
      for (const item of items) {
        await db.canteenItem.update({
          where: { id: item.itemId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }

      return NextResponse.json(transaction, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action. Use addItem or transaction' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process canteen request:', error)
    return NextResponse.json(
      { error: 'Failed to process canteen request' },
      { status: 500 }
    )
  }
}

// PUT /api/canteen - Update menu item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const item = await db.canteenItem.update({
      where: { id },
      data: {
        name: updates.name,
        category: updates.category,
        price: updates.price,
        costPrice: updates.costPrice,
        stockQuantity: updates.stockQuantity,
        reorderLevel: updates.reorderLevel,
        isActive: updates.isActive,
      },
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update canteen item:', error)
    return NextResponse.json(
      { error: 'Failed to update canteen item' },
      { status: 500 }
    )
  }
}

// DELETE /api/canteen - Soft delete menu item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.canteenItem.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Canteen item deleted successfully' })
  } catch (error) {
    console.error('Failed to delete canteen item:', error)
    return NextResponse.json(
      { error: 'Failed to delete canteen item' },
      { status: 500 }
    )
  }
}
