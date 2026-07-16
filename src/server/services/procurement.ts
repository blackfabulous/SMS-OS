import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  type?: string | null
  status?: string | null
  search?: string
  page?: number
  limit?: number
}

interface POItemInput {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export async function listProcurement(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''

  if (params.type === 'vendors') {
    const vendorWhere: Record<string, unknown> = { schoolId, isActive: true }
    if (params.status === 'inactive') vendorWhere.isActive = false
    if (search) {
      vendorWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.supplier.findMany({
        where: vendorWhere,
        include: { purchaseOrders: { select: { id: true, status: true, totalAmount: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.supplier.count({ where: vendorWhere }),
    ])

    return { data, total, page, totalPages: Math.ceil(total / limit) }
  }

  if (params.type === 'requisitions') {
    const reqWhere: Record<string, unknown> = { schoolId }
    if (params.status) reqWhere.status = params.status.toUpperCase()
    if (search) {
      reqWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requestedBy: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.requisition.findMany({
        where: reqWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.requisition.count({ where: reqWhere }),
    ])

    return { data, total, page, totalPages: Math.ceil(total / limit) }
  }

  const poWhere: Record<string, unknown> = { schoolId }
  if (params.status) poWhere.status = params.status.toUpperCase()
  if (search) {
    poWhere.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { requestedBy: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [purchaseOrders, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where: poWhere,
      include: { supplier: true, items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.purchaseOrder.count({ where: poWhere }),
  ])

  const stats = {
    totalPOs: total,
    pendingApproval: await db.purchaseOrder.count({ where: { schoolId, status: 'PENDING' } }),
    approved: await db.purchaseOrder.count({ where: { schoolId, status: 'APPROVED' } }),
    received: await db.purchaseOrder.count({ where: { schoolId, status: 'RECEIVED' } }),
    cancelled: await db.purchaseOrder.count({ where: { schoolId, status: 'CANCELLED' } }),
    totalVendors: await db.supplier.count({ where: { schoolId, isActive: true } }),
    pendingRequisitions: await db.requisition.count({ where: { schoolId, status: 'PENDING' } }),
    totalPOValue: Number((await db.purchaseOrder.aggregate({ where: { schoolId }, _sum: { totalAmount: true } }))._sum.totalAmount ?? 0),
  }

  return { data: purchaseOrders, total, page, totalPages: Math.ceil(total / limit), stats }
}

export async function createProcurement(schoolId: string, body: Record<string, unknown>) {
  const action = String(body.action || '')

  if (action === 'createPO') {
    const { title, description, supplierId, items, requestedBy, expectedDate } = body as {
      title?: string
      description?: string
      supplierId?: string
      items?: POItemInput[]
      requestedBy?: string
      expectedDate?: string
    }
    if (!title) throw new AppError('VALIDATION', 'Title is required')

    const currentYear = new Date().getFullYear()
    const lastPO = await db.purchaseOrder.findFirst({
      where: { orderNumber: { startsWith: `PO${currentYear}` } },
      orderBy: { orderNumber: 'desc' },
    })
    const nextNum = lastPO ? parseInt(lastPO.orderNumber.slice(-4)) + 1 : 1
    const orderNumber = `PO${currentYear}${String(nextNum).padStart(4, '0')}`

    const totalAmount = (items || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0)

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
          create: (items || []).map((item) => ({
            schoolId,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
          })),
        },
      },
      include: { items: true, supplier: true },
    })

    logAudit({ action: 'CREATE', entity: 'procurement', entityId: po.id, afterValue: po }).catch(() => {})
    return po
  }

  if (action === 'addVendor') {
    const { name, contactPerson, phone, email, address, taxNumber, bankName, bankAccount } = body as {
      name?: string
      contactPerson?: string
      phone?: string
      email?: string
      address?: string
      taxNumber?: string
      bankName?: string
      bankAccount?: string
    }
    if (!name) throw new AppError('VALIDATION', 'Vendor name is required')

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
    logAudit({ action: 'CREATE', entity: 'procurement', entityId: vendor.id, afterValue: vendor }).catch(() => {})
    return vendor
  }

  if (action === 'createRequisition') {
    const { title, description, requestedBy, department, estimatedCost, priority } = body as {
      title?: string
      description?: string
      requestedBy?: string
      department?: string
      estimatedCost?: number
      priority?: string
    }
    if (!title) throw new AppError('VALIDATION', 'Title is required')

    const req = await db.requisition.create({
      data: {
        schoolId,
        title,
        description: description || null,
        requestedBy: requestedBy || null,
        department: department || null,
        estimatedCost: estimatedCost || null,
        status: 'PENDING',
        priority: (priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
      },
    })
    logAudit({ action: 'CREATE', entity: 'procurement', entityId: req.id, afterValue: req }).catch(() => {})
    return req
  }

  throw new AppError('VALIDATION', 'Invalid action. Use createPO, addVendor, or createRequisition')
}

export async function updateProcurement(
  schoolId: string,
  body: { id?: string; type?: string; [key: string]: unknown },
) {
  const { id, type, ...updates } = body
  if (!id) throw new AppError('VALIDATION', 'ID is required')

  if (type === 'purchaseOrder') {
    const owned = await db.purchaseOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) throw new AppError('NOT_FOUND', 'Purchase order not found')
    const po = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: updates.status as 'PENDING' | 'CANCELLED' | 'APPROVED' | 'DRAFT' | 'RECEIVED' | undefined,
        approvedBy: updates.approvedBy as string | undefined,
        title: updates.title as string | undefined,
        description: updates.description as string | undefined,
      },
      include: { items: true, supplier: true },
    })
    logAudit({ action: 'UPDATE', entity: 'procurement', entityId: po.id, afterValue: po }).catch(() => {})
    return po
  }

  if (type === 'vendor') {
    const owned = await db.supplier.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) throw new AppError('NOT_FOUND', 'Vendor not found')
    const vendor = await db.supplier.update({
      where: { id },
      data: {
        name: updates.name as string | undefined,
        contactPerson: updates.contactPerson as string | undefined,
        phone: updates.phone as string | undefined,
        email: updates.email as string | undefined,
        address: updates.address as string | undefined,
        taxNumber: updates.taxNumber as string | undefined,
        bankName: updates.bankName as string | undefined,
        bankAccount: updates.bankAccount as string | undefined,
        isActive: updates.isActive as boolean | undefined,
      },
    })
    logAudit({ action: 'UPDATE', entity: 'procurement', entityId: vendor.id, afterValue: vendor }).catch(() => {})
    return vendor
  }

  if (type === 'requisition') {
    const owned = await db.requisition.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) throw new AppError('NOT_FOUND', 'Requisition not found')
    const req = await db.requisition.update({
      where: { id },
      data: {
        status: updates.status as 'PENDING' | 'CANCELLED' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | undefined,
        title: updates.title as string | undefined,
        description: updates.description as string | undefined,
        estimatedCost: updates.estimatedCost as number | undefined,
        priority: updates.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | undefined,
      },
    })
    logAudit({ action: 'UPDATE', entity: 'procurement', entityId: req.id, afterValue: req }).catch(() => {})
    return req
  }

  throw new AppError('VALIDATION', 'Invalid type')
}

export async function deleteProcurement(schoolId: string, id: string, type: string | null) {
  if (type === 'vendor') {
    const owned = await db.supplier.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) throw new AppError('NOT_FOUND', 'Vendor not found')
    await db.supplier.update({ where: { id }, data: { isActive: false } })
  } else if (type === 'requisition') {
    const owned = await db.requisition.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) throw new AppError('NOT_FOUND', 'Requisition not found')
    await db.requisition.delete({ where: { id } })
  } else {
    const owned = await db.purchaseOrder.findFirst({ where: { id, schoolId }, select: { id: true } })
    if (!owned) throw new AppError('NOT_FOUND', 'Purchase order not found')
    await db.purchaseOrder.delete({ where: { id } })
  }

  logAudit({ action: 'DELETE', entity: 'procurement', entityId: id }).catch(() => {})
  return { deleted: true }
}

export function handleProcurementError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return { code: 'INTERNAL' as const, message: fallbackMessage, details: error instanceof Error ? error.message : 'Unknown error' }
}
