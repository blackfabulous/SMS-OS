import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let schoolId: string | undefined
    const school = await db.school.findFirst()
    schoolId = school?.id

    if (type === 'vendors') {
      const [vendors, total] = await Promise.all([
        db.supplier.findMany({ where: { schoolId, isActive: true }, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
        db.supplier.count({ where: { schoolId, isActive: true } }),
      ])
      return NextResponse.json({ data: vendors, total, page, totalPages: Math.ceil(total / limit) })
    }

    if (type === 'requisitions') {
      const reqWhere: Record<string, unknown> = { schoolId }
      if (status) reqWhere.status = status
      const [requisitions, reqTotal] = await Promise.all([
        db.requisition.findMany({ where: reqWhere, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        db.requisition.count({ where: reqWhere }),
      ])
      return NextResponse.json({ data: requisitions, total: reqTotal, page, totalPages: Math.ceil(reqTotal / limit) })
    }

    // Default: purchase orders
    const poWhere: Record<string, unknown> = { schoolId }
    if (status) poWhere.status = status

    const [purchaseOrders, poTotal] = await Promise.all([
      db.purchaseOrder.findMany({
        where: poWhere,
        include: { supplier: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.purchaseOrder.count({ where: poWhere }),
    ])

    const stats = {
      totalPOs: poTotal,
      pendingApproval: await db.purchaseOrder.count({ where: { schoolId, status: 'PENDING' } }),
      approved: await db.purchaseOrder.count({ where: { schoolId, status: 'APPROVED' } }),
      received: await db.purchaseOrder.count({ where: { schoolId, status: 'RECEIVED' } }),
      totalVendors: await db.supplier.count({ where: { schoolId, isActive: true } }),
      pendingRequisitions: await db.requisition.count({ where: { schoolId, status: 'PENDING' } }),
    }

    return NextResponse.json({ data: purchaseOrders, total: poTotal, page, totalPages: Math.ceil(poTotal / limit), stats })
  } catch (error) {
    console.error('Failed to fetch procurement data:', error)
    return NextResponse.json({ error: 'Failed to fetch procurement data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    let schoolId = body.schoolId
    if (!schoolId) { const school = await db.school.findFirst(); schoolId = school?.id }

    if (action === 'createPO') {
      const { title, description, supplierId, items, requestedBy, expectedDate } = body
      if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

      const currentYear = new Date().getFullYear()
      const lastPO = await db.purchaseOrder.findFirst({ where: { orderNumber: { startsWith: `PO${currentYear}` } }, orderBy: { orderNumber: 'desc' } })
      const nextNum = lastPO ? parseInt(lastPO.orderNumber.slice(-4)) + 1 : 1
      const orderNumber = `PO${currentYear}${String(nextNum).padStart(4, '0')}`

      const totalAmount = (items || []).reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0)

      const po = await db.purchaseOrder.create({
        data: {
          schoolId: schoolId || 'default', orderNumber, title,
          description: description || null, supplierId: supplierId || null,
          totalAmount, status: 'DRAFT', requestedBy: requestedBy || null,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          items: { create: (items || []).map((item: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => ({ description: item.description, quantity: item.quantity || 1, unitPrice: item.unitPrice || 0, totalPrice: item.totalPrice || 0 })) },
        },
        include: { items: true, supplier: true },
      })

      return NextResponse.json(po, { status: 201 })
    }

    if (action === 'addVendor') {
      const { name, contactPerson, phone, email, address } = body
      if (!name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })

      const vendor = await db.supplier.create({
        data: { schoolId: schoolId || 'default', name, contactPerson: contactPerson || null, phone: phone || null, email: email || null, address: address || null },
      })
      return NextResponse.json(vendor, { status: 201 })
    }

    if (action === 'createRequisition') {
      const { title, description, requestedBy, department, estimatedCost, priority } = body
      if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

      const req = await db.requisition.create({
        data: { schoolId: schoolId || 'default', title, description: description || null, requestedBy: requestedBy || null, department: department || null, estimatedCost: estimatedCost || null, status: 'PENDING', priority: priority || 'MEDIUM' },
      })
      return NextResponse.json(req, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process procurement request:', error)
    return NextResponse.json({ error: 'Failed to process procurement request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'purchaseOrder') {
      const po = await db.purchaseOrder.update({
        where: { id },
        data: { status: updates.status, approvedBy: updates.approvedBy, title: updates.title, description: updates.description },
        include: { items: true, supplier: true },
      })
      return NextResponse.json(po)
    }

    if (type === 'vendor') {
      const vendor = await db.supplier.update({
        where: { id },
        data: { name: updates.name, contactPerson: updates.contactPerson, phone: updates.phone, email: updates.email, address: updates.address },
      })
      return NextResponse.json(vendor)
    }

    if (type === 'requisition') {
      const req = await db.requisition.update({
        where: { id },
        data: { status: updates.status, title: updates.title, description: updates.description, estimatedCost: updates.estimatedCost, priority: updates.priority },
      })
      return NextResponse.json(req)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update procurement record:', error)
    return NextResponse.json({ error: 'Failed to update procurement record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'vendor') {
      await db.supplier.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'requisition') {
      await db.requisition.delete({ where: { id } })
    } else {
      await db.purchaseOrder.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete procurement record:', error)
    return NextResponse.json({ error: 'Failed to delete procurement record' }, { status: 500 })
  }
}
