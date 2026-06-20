import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/procurement - List purchase orders, vendors, requisitions with status filters
export async function GET(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // purchaseOrders | vendors | requisitions
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Vendors list
    if (type === 'vendors') {
      const vendorWhere: Record<string, unknown> = { schoolId, isActive: true }
      if (status === 'inactive') vendorWhere.isActive = false
      if (search) {
        vendorWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [vendors, total] = await Promise.all([
        db.supplier.findMany({
          where: vendorWhere,
          include: { purchaseOrders: { select: { id: true, status: true, totalAmount: true } } },
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        db.supplier.count({ where: vendorWhere }),
      ])

      return NextResponse.json({
        data: vendors,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    }

    // Requisitions list
    if (type === 'requisitions') {
      const reqWhere: Record<string, unknown> = { schoolId }
      if (status) reqWhere.status = status.toUpperCase()
      if (search) {
        reqWhere.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { requestedBy: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [requisitions, reqTotal] = await Promise.all([
        db.requisition.findMany({
          where: reqWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.requisition.count({ where: reqWhere }),
      ])

      return NextResponse.json({
        data: requisitions,
        total: reqTotal,
        page,
        totalPages: Math.ceil(reqTotal / limit),
      })
    }

    // Default: purchase orders
    const poWhere: Record<string, unknown> = { schoolId }
    if (status) poWhere.status = status.toUpperCase()
    if (search) {
      poWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requestedBy: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [purchaseOrders, poTotal] = await Promise.all([
      db.purchaseOrder.findMany({
        where: poWhere,
        include: { supplier: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.purchaseOrder.count({ where: poWhere }),
    ])

    // Procurement stats
    const stats = {
      totalPOs: poTotal,
      pendingApproval: await db.purchaseOrder.count({ where: { schoolId, status: 'PENDING' } }),
      approved: await db.purchaseOrder.count({ where: { schoolId, status: 'APPROVED' } }),
      received: await db.purchaseOrder.count({ where: { schoolId, status: 'RECEIVED' } }),
      cancelled: await db.purchaseOrder.count({ where: { schoolId, status: 'CANCELLED' } }),
      totalVendors: await db.supplier.count({ where: { schoolId, isActive: true } }),
      pendingRequisitions: await db.requisition.count({ where: { schoolId, status: 'PENDING' } }),
      totalPOValue: (await db.purchaseOrder.aggregate({ where: { schoolId }, _sum: { totalAmount: true } }))._sum.totalAmount || 0,
    }

    return NextResponse.json({
      data: purchaseOrders,
      total: poTotal,
      page,
      totalPages: Math.ceil(poTotal / limit),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch procurement data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch procurement data' },
      { status: 500 }
    )
  }
}

// POST /api/procurement - Create purchase order, vendor, or requisition
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const school = await db.school.findFirst()
    const schoolId = school?.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School not configured' }, { status: 400 })
    }

    // Create Purchase Order
    if (action === 'createPO') {
      const { title, description, supplierId, items, requestedBy, expectedDate } = body
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }

      // Generate PO number
      const currentYear = new Date().getFullYear()
      const lastPO = await db.purchaseOrder.findFirst({
        where: { orderNumber: { startsWith: `PO${currentYear}` } },
        orderBy: { orderNumber: 'desc' },
      })
      const nextNum = lastPO ? parseInt(lastPO.orderNumber.slice(-4)) + 1 : 1
      const orderNumber = `PO${currentYear}${String(nextNum).padStart(4, '0')}`

      const totalAmount = (items || []).reduce(
        (sum: number, item: { totalPrice: number }) => sum + item.totalPrice,
        0
      )

      const po = await db.purchaseOrder.create({
        data: {
          schoolId,
          orderNumber,
          title,
          description: description || null,
          supplierId: supplierId || null,
          totalAmount,
          status: 'DRAFT',
          requestedBy: requestedBy || null,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          items: {
            create: (items || []).map(
              (item: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0,
              })
            ),
          },
        },
        include: { items: true, supplier: true },
      })

      logAudit({ action: 'CREATE', entity: 'procurement', entityId: (po as any)?.id, afterValue: po }).catch(() => {})
      return NextResponse.json(po, { status: 201 })
    }

    // Add Vendor
    if (action === 'addVendor') {
      const { name, contactPerson, phone, email, address, taxNumber, bankName, bankAccount } = body
      if (!name) {
        return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
      }

      const vendor = await db.supplier.create({
        data: {
          schoolId,
          name,
          contactPerson: contactPerson || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          taxNumber: taxNumber || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
        },
      })
      logAudit({ action: 'CREATE', entity: 'procurement', entityId: (vendor as any)?.id, afterValue: vendor }).catch(() => {})
      return NextResponse.json(vendor, { status: 201 })
    }

    // Create Requisition
    if (action === 'createRequisition') {
      const { title, description, requestedBy, department, estimatedCost, priority } = body
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }

      const req = await db.requisition.create({
        data: {
          schoolId,
          title,
          description: description || null,
          requestedBy: requestedBy || null,
          department: department || null,
          estimatedCost: estimatedCost || null,
          status: 'PENDING',
          priority: priority || 'MEDIUM',
        },
      })
      logAudit({ action: 'CREATE', entity: 'procurement', entityId: (req as any)?.id, afterValue: req }).catch(() => {})
      return NextResponse.json(req, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use createPO, addVendor, or createRequisition' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to process procurement request:', error)
    return NextResponse.json(
      { error: 'Failed to process procurement request' },
      { status: 500 }
    )
  }
}

// PUT /api/procurement - Update purchase order, vendor, or requisition
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'purchaseOrder') {
      const po = await db.purchaseOrder.update({
        where: { id },
        data: {
          status: updates.status,
          approvedBy: updates.approvedBy,
          title: updates.title,
          description: updates.description,
        },
        include: { items: true, supplier: true },
      })
      logAudit({ action: 'UPDATE', entity: 'procurement', entityId: (po as any)?.id, afterValue: po }).catch(() => {})
      return NextResponse.json(po)
    }

    if (type === 'vendor') {
      const vendor = await db.supplier.update({
        where: { id },
        data: {
          name: updates.name,
          contactPerson: updates.contactPerson,
          phone: updates.phone,
          email: updates.email,
          address: updates.address,
          taxNumber: updates.taxNumber,
          bankName: updates.bankName,
          bankAccount: updates.bankAccount,
          isActive: updates.isActive,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'procurement', entityId: (vendor as any)?.id, afterValue: vendor }).catch(() => {})
      return NextResponse.json(vendor)
    }

    if (type === 'requisition') {
      const req = await db.requisition.update({
        where: { id },
        data: {
          status: updates.status,
          title: updates.title,
          description: updates.description,
          estimatedCost: updates.estimatedCost,
          priority: updates.priority,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'procurement', entityId: (req as any)?.id, afterValue: req }).catch(() => {})
      return NextResponse.json(req)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update procurement record:', error)
    return NextResponse.json(
      { error: 'Failed to update procurement record' },
      { status: 500 }
    )
  }
}

// DELETE /api/procurement - Delete procurement record
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'vendor') {
      await db.supplier.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'requisition') {
      await db.requisition.delete({ where: { id } })
    } else {
      await db.purchaseOrder.delete({ where: { id } })
    }

    logAudit({ action: 'DELETE', entity: 'procurement', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete procurement record:', error)
    return NextResponse.json(
      { error: 'Failed to delete procurement record' },
      { status: 500 }
    )
  }
}
