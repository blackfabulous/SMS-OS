import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory - Get assets and maintenance requests
export async function GET() {
  try {
    const assets = await db.asset.findMany({
      where: { isDisposed: false },
      include: {
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    })

    const maintenanceRequests = await db.maintenanceRequest.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Stats
    const totalAssets = assets.length
    const goodCondition = assets.filter((a) => a.condition === 'GOOD' || a.condition === 'NEW').length
    const fairCondition = assets.filter((a) => a.condition === 'FAIR').length
    const poorCondition = assets.filter((a) => a.condition === 'POOR').length
    const pendingMaintenance = await db.maintenanceRequest.count({
      where: { status: 'PENDING' },
    })
    const totalAssetValue = assets.reduce((sum, a) => sum + a.purchaseCost, 0)

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

    return NextResponse.json({
      assets,
      maintenanceRequests,
      stats: {
        totalAssets,
        goodCondition,
        fairCondition,
        poorCondition,
        pendingMaintenance,
        totalAssetValue,
      },
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category || 'Uncategorized',
        count: c._count.id,
        value: c._sum.purchaseCost || 0,
      })),
      maintenanceByStatus: maintenanceByStatus.map((m) => ({
        status: m.status,
        count: m._count.id,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch inventory data:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 })
  }
}

// POST /api/inventory - Add asset or request maintenance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'addAsset') {
      const { name, category, location, purchaseCost, condition, schoolId } = body
      if (!name || !category) {
        return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
      }

      let sid = schoolId
      if (!sid) {
        const school = await db.school.findFirst()
        sid = school?.id
      }

      // Generate asset tag
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
          purchaseDate: new Date(),
          condition: condition || 'GOOD',
        },
      })

      return NextResponse.json(asset, { status: 201 })
    }

    if (action === 'requestMaintenance') {
      const { assetId, description, priority, category, schoolId } = body
      if (!description) {
        return NextResponse.json({ error: 'Description is required' }, { status: 400 })
      }

      let sid = schoolId
      if (!sid) {
        const school = await db.school.findFirst()
        sid = school?.id
      }

      const request = await db.maintenanceRequest.create({
        data: {
          assetId: assetId || null,
          schoolId: sid || 'default',
          category: category || 'GENERAL',
          description,
          priority: priority || 'MEDIUM',
          status: 'PENDING',
        },
        include: {
          asset: {
            select: { name: true, assetTag: true, location: true },
          },
        },
      })

      return NextResponse.json(request, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process inventory request:', error)
    return NextResponse.json({ error: 'Failed to process inventory request' }, { status: 500 })
  }
}
