import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/school-shop - Returns shop data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'School not configured' }, { status: 400 })
    }

    if (section === 'stats') {
      const [totalProducts, totalOrders, revenueResult] = await Promise.all([
        db.schoolShopItem.count({ where: { schoolId, isActive: true } }),
        db.schoolShopOrder.count({ where: { schoolId } }),
        db.schoolShopOrder.aggregate({ where: { schoolId, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      ])
      return NextResponse.json({ success: true, data: { totalProducts, totalOrders, totalRevenue: revenueResult._sum.totalAmount || 0 } })
    }

    const result: Record<string, unknown> = {}

    if (section === 'all' || section === 'products') {
      const where: Record<string, unknown> = { schoolId }
      if (category) where.category = category
      if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
      if (search) where.OR = [{ name: { contains: search } }, { description: { contains: search } }]
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
      result.stats = { totalProducts, totalOrders, totalRevenue: revenueResult._sum.totalAmount || 0 }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Shop GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch shop data' }, { status: 500 })
  }
}

// POST /api/school-shop - Create product or order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body
    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'School not configured' }, { status: 400 })
    }

    if (action === 'createProduct') {
      if (!data?.name || !data?.category || data?.price === undefined) {
        return NextResponse.json({ success: false, error: 'name, category, and price are required' }, { status: 400 })
      }
      const product = await db.schoolShopItem.create({
        data: { schoolId, name: data.name, description: data.description, category: data.category, price: data.price, currency: data.currency || 'USD', imageUrl: data.imageUrl, sizes: data.sizes, colors: data.colors, stockQuantity: data.stockQuantity ?? 0, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 },
      })
      return NextResponse.json({ success: true, data: product }, { status: 201 })
    }

    if (action === 'createOrder') {
      if (!data?.items || !data?.totalAmount) {
        return NextResponse.json({ success: false, error: 'items and totalAmount are required' }, { status: 400 })
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
      return NextResponse.json({ success: true, data: order }, { status: 201 })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Shop POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create shop content' }, { status: 500 })
  }
}

// PUT /api/school-shop - Update product or order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, data } = body

    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    if (action === 'updateProduct') {
      const product = await db.schoolShopItem.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      return NextResponse.json({ success: true, data: product })
    }

    if (action === 'updateOrderStatus') {
      const validStatuses = ['PENDING', 'PROCESSING', 'READY', 'COLLECTED', 'CANCELLED']
      if (!data?.status || !validStatuses.includes(data.status)) {
        return NextResponse.json({ success: false, error: 'Valid status is required (PENDING|PROCESSING|READY|COLLECTED|CANCELLED)' }, { status: 400 })
      }
      const order = await db.schoolShopOrder.update({ where: { id }, data: { status: data.status, updatedAt: new Date() } })
      return NextResponse.json({ success: true, data: order })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Shop PUT error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update shop content' }, { status: 500 })
  }
}

// DELETE /api/school-shop - Delete product or order
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id } = body

    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    if (action === 'deleteProduct') {
      await db.schoolShopItem.delete({ where: { id } })
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    if (action === 'deleteOrder') {
      await db.schoolShopOrder.delete({ where: { id } })
      return NextResponse.json({ success: true, data: { deleted: true } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Shop DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete shop content' }, { status: 500 })
  }
}
