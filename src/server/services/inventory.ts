import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string
  category?: string
  condition?: string
  isDisposed?: string | null
  maintenanceStatus?: string
  page?: number
  limit?: number
}

export async function listInventory(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const category = params.category ?? ''
  const condition = params.condition ?? ''
  const isDisposedStr = params.isDisposed
  const maintenanceStatus = params.maintenanceStatus ?? ''

  const assetFilter: Record<string, unknown> = { schoolId }
  if (search) {
    assetFilter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { assetTag: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { custodian: { contains: search, mode: 'insensitive' } },
      { donorSource: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category && category !== 'ALL') assetFilter.category = category
  if (condition) assetFilter.condition = condition
  if (isDisposedStr !== null && isDisposedStr !== undefined && isDisposedStr !== '') {
    assetFilter.isDisposed = isDisposedStr === 'true'
  } else {
    assetFilter.isDisposed = false
  }

  const [assets, assetTotal] = await Promise.all([
    db.asset.findMany({
      where: assetFilter,
      include: {
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    db.asset.count({ where: assetFilter }),
  ])

  const maintenanceFilter: Record<string, unknown> = { schoolId }
  if (maintenanceStatus) maintenanceFilter.status = maintenanceStatus
  if (search) {
    maintenanceFilter.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [maintenanceRequests, maintenanceTotal] = await Promise.all([
    db.maintenanceRequest.findMany({
      where: maintenanceFilter,
      include: { asset: { select: { id: true, name: true, assetTag: true, location: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.maintenanceRequest.count({ where: maintenanceFilter }),
  ])

  const allActiveAssets = await db.asset.findMany({
    where: { schoolId, isDisposed: false },
    select: { condition: true, purchaseCost: true, category: true },
  })

  const totalAssets = allActiveAssets.length
  const goodCondition = allActiveAssets.filter((a) => a.condition === 'GOOD' || a.condition === 'NEW' || a.condition === 'EXCELLENT').length
  const fairCondition = allActiveAssets.filter((a) => a.condition === 'FAIR').length
  const poorCondition = allActiveAssets.filter((a) => a.condition === 'POOR').length
  const totalAssetValue = allActiveAssets.reduce((sum, a) => sum + Number(a.purchaseCost || 0), 0)

  const [pendingMaintenance, inProgressMaintenance, completedMaintenance] = await Promise.all([
    db.maintenanceRequest.count({ where: { schoolId, status: 'PENDING' } }),
    db.maintenanceRequest.count({ where: { schoolId, status: 'IN_PROGRESS' } }),
    db.maintenanceRequest.count({ where: { schoolId, status: 'COMPLETED' } }),
  ])

  const [categoryBreakdown, maintenanceByStatus, maintenanceByPriority] = await Promise.all([
    db.asset.groupBy({
      by: ['category'],
      where: { schoolId, isDisposed: false },
      _count: { id: true },
      _sum: { purchaseCost: true },
    }),
    db.maintenanceRequest.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: { id: true },
    }),
    db.maintenanceRequest.groupBy({
      by: ['priority'],
      where: { schoolId },
      _count: { id: true },
    }),
  ])

  return {
    assets,
    maintenanceRequests,
    stats: {
      totalAssets,
      goodCondition,
      fairCondition,
      poorCondition,
      pendingMaintenance,
      inProgressMaintenance,
      completedMaintenance,
      totalAssetValue,
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category || 'Uncategorized',
      count: c._count.id,
      value: Number(c._sum.purchaseCost ?? 0),
    })),
    maintenanceByStatus: maintenanceByStatus.map((m) => ({ status: m.status, count: m._count.id })),
    maintenanceByPriority: maintenanceByPriority.map((m) => ({ priority: m.priority, count: m._count.id })),
    pagination: {
      page,
      limit,
      totalAssets: assetTotal,
      totalMaintenance: maintenanceTotal,
      totalPages: Math.ceil(assetTotal / limit),
    },
  }
}

export async function addAsset(
  schoolId: string,
  body: {
    name?: string
    category?: string
    location?: string
    purchaseCost?: number | string
    condition?: string
    donorSource?: string
    custodian?: string
    purchaseDate?: string
  },
) {
  const { name, category, location, purchaseCost, condition, donorSource, custodian, purchaseDate } = body
  if (!name || !category) throw new AppError('VALIDATION', 'Name and category are required')

  const assetCount = await db.asset.count({ where: { schoolId } })
  const assetTag = `AST-${String(assetCount + 1).padStart(5, '0')}`

  const asset = await db.asset.create({
    data: {
      schoolId,
      assetTag,
      name,
      category,
      location: location || null,
      purchaseCost: purchaseCost != null ? Number(purchaseCost) : 0,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      condition: (condition as any) || 'GOOD',
      donorSource: donorSource || null,
      custodian: custodian || null,
    },
  })

  logAudit({ action: 'CREATE', entity: 'inventory', entityId: asset.id, schoolId, afterValue: asset }).catch(() => {})
  return asset
}

export async function requestMaintenance(
  schoolId: string,
  body: {
    assetId?: string | null
    description?: string
    priority?: string
    category?: string
    estimatedCost?: number | string
  },
) {
  const { assetId, description, priority, category, estimatedCost } = body
  if (!description) throw new AppError('VALIDATION', 'Description is required')

  if (assetId) {
    const asset = await db.asset.findFirst({ where: { id: assetId, schoolId }, select: { id: true } })
    if (!asset) throw new AppError('NOT_FOUND', 'Asset not found')
  }

  const maintenanceRequest = await db.maintenanceRequest.create({
    data: {
      assetId: assetId || null,
      schoolId,
      category: category || 'GENERAL',
      description,
      priority: (priority as any) || 'MEDIUM',
      status: 'PENDING',
      estimatedCost: estimatedCost != null ? Number(estimatedCost) : null,
    },
    include: { asset: { select: { name: true, assetTag: true, location: true } } },
  })

  logAudit({
    action: 'CREATE',
    entity: 'inventory',
    entityId: maintenanceRequest.id,
    schoolId,
    afterValue: maintenanceRequest,
  }).catch(() => {})
  return maintenanceRequest
}

export async function updateAsset(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.asset.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Asset not found')

  const asset = await db.asset.update({
    where: { id },
    data: {
      name: updates.name as string | undefined,
      category: updates.category as string | undefined,
      location: updates.location as string | undefined,
      condition: updates.condition as any,
      custodian: updates.custodian as string | undefined,
      isDisposed: updates.isDisposed as boolean | undefined,
      donorSource: updates.donorSource as string | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'inventory', entityId: asset.id, schoolId, afterValue: asset }).catch(() => {})
  return asset
}

export async function updateMaintenanceRequest(schoolId: string, id: string, updates: Record<string, unknown>) {
  const owned = await db.maintenanceRequest.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Maintenance request not found')

  const record = await db.maintenanceRequest.update({
    where: { id },
    data: {
      status: updates.status as any,
      priority: updates.priority as any,
      actualCost: updates.actualCost != null ? Number(updates.actualCost) : undefined,
      description: updates.description as string | undefined,
    },
    include: { asset: { select: { name: true, assetTag: true } } },
  })

  logAudit({ action: 'UPDATE', entity: 'inventory', entityId: record.id, schoolId, afterValue: record }).catch(() => {})
  return record
}

export async function deleteAsset(schoolId: string, id: string) {
  const owned = await db.asset.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Asset not found')

  await db.asset.update({ where: { id }, data: { isDisposed: true } })
  logAudit({ action: 'DELETE', entity: 'inventory', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteMaintenanceRequest(schoolId: string, id: string) {
  const owned = await db.maintenanceRequest.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Maintenance request not found')

  await db.maintenanceRequest.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'inventory', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleInventoryError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
