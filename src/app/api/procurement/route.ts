import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'

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

    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('FORBIDDEN', 'School not configured')
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

      return ok({
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

      return ok({
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
      totalPOValue: Number((await db.purchaseOrder.aggregate({ where: { schoolId }, _sum: { totalAmount: true } }))._sum.totalAmount ?? 0),
    }

    return ok({
      data: purchaseOrders,
      total: poTotal,
      page,
      totalPages: Math.ceil(poTotal / limit),
      stats,
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch procurement data')
    return fail('INTERNAL', 'Failed to fetch procurement data')
  }
}

// POST /api/procurement - Create purchase order, vendor, or requisition
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const school = await db.school.findUnique({ where: { id: authResult.session.user.schoolId } })
    const schoolId = school?.id

    if (!schoolId) {
      return fail('FORBIDDEN', 'School not configured')
    }

    // Create Purchase Order
    if (action === 'createPO') {
      const { title, description, supplierId, items, requestedBy, expectedDate } = body
      if (!title) {
        return fail('VALIDATION', 'Title is required')
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
                schoolId,
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
      return ok(po, 201)
    }

    // Add Vendor
    if (action === 'addVendor') {
      const { name, contactPerson, phone, email, address, taxNumber, bankName, bankAccount } = body
      if (!name) {
        return fail('VALIDATION', 'Vendor name is required')
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
      return ok(vendor, 201)
    }

    // Create Requisition
    if (action === 'createRequisition') {
      const { title, description, requestedBy, department, estimatedCost, priority } = body
      if (!title) {
        return fail('VALIDATION', 'Title is required')
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
      return ok(req, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use createPO, addVendor, or createRequisition')
  } catch (error) {
    logger.error({ err: error }, 'Failed to process procurement request')
    return fail('INTERNAL', 'Failed to process procurement request')
  }
}

// PUT /api/procurement - Update purchase order, vendor, or requisition
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }

    if (type === 'purchaseOrder') {
      const owned = await db.purchaseOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Purchase order not found')
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
      return ok(po)
    }

    if (type === 'vendor') {
      const owned = await db.supplier.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Vendor not found')
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
      return ok(vendor)
    }

    if (type === 'requisition') {
      const owned = await db.requisition.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Requisition not found')
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
      return ok(req)
    }

    return fail('VALIDATION', 'Invalid type')
  } catch (error) {
    logger.error({ err: error }, 'Failed to update procurement record')
    return fail('INTERNAL', 'Failed to update procurement record')
  }
}

// DELETE /api/procurement - Delete procurement record
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) {
      return fail('VALIDATION', 'ID is required')
    }

    // Verify the target belongs to the caller's school before mutating.
    if (type === 'vendor') {
      const owned = await db.supplier.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Vendor not found')
      await db.supplier.update({ where: { id }, data: { isActive: false } })
    } else if (type === 'requisition') {
      const owned = await db.requisition.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Requisition not found')
      await db.requisition.delete({ where: { id } })
    } else {
      const owned = await db.purchaseOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
      if (!owned) return fail('NOT_FOUND', 'Purchase order not found')
      await db.purchaseOrder.delete({ where: { id } })
    }

    logAudit({ action: 'DELETE', entity: 'procurement', entityId: (id ?? undefined) }).catch(() => {})
    return ok({ deleted: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete procurement record')
    return fail('INTERNAL', 'Failed to delete procurement record')
  }
}
