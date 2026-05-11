import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/inventory — List assets with maintenance status
// Query params: search, category, condition, isDisposed, maintenanceStatus, page, limit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const condition = searchParams.get('condition') || ''
    const isDisposedStr = searchParams.get('isDisposed')
    const maintenanceStatus = searchParams.get('maintenanceStatus') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build asset filter
    const assetFilter: Record<string, unknown> = {}
    if (search) {
      assetFilter.OR = [
        { name: { contains: search } },
        { assetTag: { contains: search } },
        { location: { contains: search } },
        { custodian: { contains: search } },
        { donorSource: { contains: search } },
      ]
    }
    if (category && category !== 'ALL') {
      assetFilter.category = category
    }
    if (condition) {
      assetFilter.condition = condition
    }
    if (isDisposedStr !== null) {
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.asset.count({ where: assetFilter }),
    ])

    // Maintenance requests with filter
    const maintenanceFilter: Record<string, unknown> = {}
    if (maintenanceStatus) {
      maintenanceFilter.status = maintenanceStatus
    }
    if (search) {
      maintenanceFilter.OR = [
        { description: { contains: search } },
        { category: { contains: search } },
      ]
    }

    const [maintenanceRequests, maintenanceTotal] = await Promise.all([
      db.maintenanceRequest.findMany({
        where: maintenanceFilter,
        include: {
          asset: { select: { id: true, name: true, assetTag: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.maintenanceRequest.count({ where: maintenanceFilter }),
    ])

    // Stats
    const allActiveAssets = await db.asset.findMany({
      where: { isDisposed: false },
      select: { condition: true, purchaseCost: true, category: true },
    })

    const totalAssets = allActiveAssets.length
    const goodCondition = allActiveAssets.filter((a) => a.condition === 'GOOD' || a.condition === 'NEW').length
    const fairCondition = allActiveAssets.filter((a) => a.condition === 'FAIR').length
    const poorCondition = allActiveAssets.filter((a) => a.condition === 'POOR').length
    const totalAssetValue = allActiveAssets.reduce((sum, a) => sum + a.purchaseCost, 0)

    const pendingMaintenance = await db.maintenanceRequest.count({ where: { status: 'PENDING' } })
    const inProgressMaintenance = await db.maintenanceRequest.count({ where: { status: 'IN_PROGRESS' } })
    const completedMaintenance = await db.maintenanceRequest.count({ where: { status: 'COMPLETED' } })

    // Category breakdown
    const categoryBreakdown = await db.asset.groupBy({
      by: ['category'],
      where: { isDisposed: false },
      _count: { id: true },
      _sum: { purchaseCost: true },
    })

    // Maintenance by status
    const maintenanceByStatus = await db.maintenanceRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    // Maintenance by priority
    const maintenanceByPriority = await db.maintenanceRequest.groupBy({
      by: ['priority'],
      _count: { id: true },
    })

    return NextResponse.json({
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
        value: c._sum.purchaseCost || 0,
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
    })
  } catch (error) {
    console.error('Failed to fetch inventory data:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 })
  }
}

// POST /api/inventory — Create asset or maintenance request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'addAsset') {
      const { name, category, location, purchaseCost, condition, schoolId, donorSource, custodian, purchaseDate } = body
      if (!name || !category) {
        return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
      }

      let sid = schoolId
      if (!sid) {
        const school = await db.school.findFirst()
        sid = school?.id
      }

      const assetCount = await db.asset.count()
      const assetTag = `AST-${String(assetCount + 1).padStart(5, '0')}`

      const asset = await db.asset.create({
        data: {
          schoolId: sid || 'default',
          assetTag,
          name,
          category,
          location: location || null,
          purchaseCost: purchaseCost ? parseFloat(String(purchaseCost)) : 0,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          condition: condition || 'GOOD',
          donorSource: donorSource || null,
          custodian: custodian || null,
        },
      })
      return NextResponse.json(asset, { status: 201 })
    }

    if (action === 'requestMaintenance') {
      const { assetId, description, priority, category, schoolId, estimatedCost } = body
      if (!description) {
        return NextResponse.json({ error: 'Description is required' }, { status: 400 })
      }

      let sid = schoolId
      if (!sid) {
        const school = await db.school.findFirst()
        sid = school?.id
      }

      const maintenanceRequest = await db.maintenanceRequest.create({
        data: {
          assetId: assetId || null,
          schoolId: sid || 'default',
          category: category || 'GENERAL',
          description,
          priority: priority || 'MEDIUM',
          status: 'PENDING',
          estimatedCost: estimatedCost ? parseFloat(String(estimatedCost)) : null,
        },
        include: { asset: { select: { name: true, assetTag: true, location: true } } },
      })
      return NextResponse.json(maintenanceRequest, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action. Use: addAsset or requestMaintenance' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process inventory request:', error)
    return NextResponse.json({ error: 'Failed to process inventory request' }, { status: 500 })
  }
}

// PUT /api/inventory — Update asset or maintenance request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'maintenance') {
      const record = await db.maintenanceRequest.update({
        where: { id },
        data: {
          status: updates.status,
          priority: updates.priority,
          actualCost: updates.actualCost ? parseFloat(String(updates.actualCost)) : undefined,
          description: updates.description,
        },
        include: { asset: { select: { name: true, assetTag: true } } },
      })
      return NextResponse.json(record)
    }

    const asset = await db.asset.update({
      where: { id },
      data: {
        name: updates.name,
        category: updates.category,
        location: updates.location,
        condition: updates.condition,
        custodian: updates.custodian,
        isDisposed: updates.isDisposed,
        donorSource: updates.donorSource,
      },
    })
    return NextResponse.json(asset)
  } catch (error) {
    console.error('Failed to update inventory record:', error)
    return NextResponse.json({ error: 'Failed to update inventory record' }, { status: 500 })
  }
}

// DELETE /api/inventory?id=xxx&type=asset|maintenance
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'maintenance') {
      await db.maintenanceRequest.delete({ where: { id } })
    } else {
      await db.asset.update({ where: { id }, data: { isDisposed: true } })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete inventory record:', error)
    return NextResponse.json({ error: 'Failed to delete inventory record' }, { status: 500 })
  }
}
