import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const assets = await db.asset.findMany({
      where: { isDisposed: false },
      include: { maintenanceRequests: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { name: 'asc' },
    })

    const maintenanceRequests = await db.maintenanceRequest.findMany({
      include: { asset: { select: { id: true, name: true, assetTag: true, location: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const totalAssets = assets.length
    const goodCondition = assets.filter((a) => a.condition === 'GOOD' || a.condition === 'NEW').length
    const fairCondition = assets.filter((a) => a.condition === 'FAIR').length
    const poorCondition = assets.filter((a) => a.condition === 'POOR').length
    const pendingMaintenance = await db.maintenanceRequest.count({ where: { status: 'PENDING' } })
    const totalAssetValue = assets.reduce((sum, a) => sum + a.purchaseCost, 0)

    const categoryBreakdown = await db.asset.groupBy({
      by: ['category'],
      where: { isDisposed: false },
      _count: { id: true },
      _sum: { purchaseCost: true },
    })

    const maintenanceByStatus = await db.maintenanceRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    return NextResponse.json({
      assets,
      maintenanceRequests,
      stats: { totalAssets, goodCondition, fairCondition, poorCondition, pendingMaintenance, totalAssetValue },
      categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category || 'Uncategorized', count: c._count.id, value: c._sum.purchaseCost || 0 })),
      maintenanceByStatus: maintenanceByStatus.map((m) => ({ status: m.status, count: m._count.id })),
    })
  } catch (error) {
    console.error('Failed to fetch inventory data:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'addAsset') {
      const { name, category, location, purchaseCost, condition, schoolId, donorSource, custodian } = body
      if (!name || !category) return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })

      let sid = schoolId
      if (!sid) { const school = await db.school.findFirst(); sid = school?.id }

      const assetCount = await db.asset.count()
      const assetTag = `AST-${String(assetCount + 1).padStart(5, '0')}`

      const asset = await db.asset.create({
        data: {
          schoolId: sid || 'default', assetTag, name, category,
          location: location || null, purchaseCost: purchaseCost ? parseFloat(String(purchaseCost)) : 0,
          purchaseDate: new Date(), condition: condition || 'GOOD',
          donorSource: donorSource || null, custodian: custodian || null,
        },
      })
      return NextResponse.json(asset, { status: 201 })
    }

    if (action === 'requestMaintenance') {
      const { assetId, description, priority, category, schoolId, estimatedCost } = body
      if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 })

      let sid = schoolId
      if (!sid) { const school = await db.school.findFirst(); sid = school?.id }

      const request = await db.maintenanceRequest.create({
        data: {
          assetId: assetId || null, schoolId: sid || 'default',
          category: category || 'GENERAL', description, priority: priority || 'MEDIUM',
          status: 'PENDING', estimatedCost: estimatedCost ? parseFloat(String(estimatedCost)) : null,
        },
        include: { asset: { select: { name: true, assetTag: true, location: true } } },
      })
      return NextResponse.json(request, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process inventory request:', error)
    return NextResponse.json({ error: 'Failed to process inventory request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

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
      },
    })
    return NextResponse.json(asset)
  } catch (error) {
    console.error('Failed to update inventory record:', error)
    return NextResponse.json({ error: 'Failed to update inventory record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

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
