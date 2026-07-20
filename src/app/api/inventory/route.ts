import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import {
  listInventory,
  addAsset,
  requestMaintenance,
  updateAsset,
  updateMaintenanceRequest,
  deleteAsset,
  deleteMaintenanceRequest,
  handleInventoryError,
} from '@/server/services/inventory'

// GET /api/inventory — List assets with maintenance status
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const condition = searchParams.get('condition') || ''
    const isDisposed = searchParams.get('isDisposed')
    const maintenanceStatus = searchParams.get('maintenanceStatus') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listInventory(authResult.session.user.schoolId, {
      search,
      category,
      condition,
      isDisposed,
      maintenanceStatus,
      page,
      limit,
    })
    return ok(result)
  } catch (error) {
    const { code, message } = handleInventoryError(error, 'Failed to fetch inventory data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// POST /api/inventory — Create asset or maintenance request
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (action === 'addAsset') {
      const asset = await addAsset(schoolId, body)
      return ok(asset, 201)
    }

    if (action === 'requestMaintenance') {
      const maintenanceRequest = await requestMaintenance(schoolId, body)
      return ok(maintenanceRequest, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use: addAsset or requestMaintenance')
  } catch (error) {
    const { code, message } = handleInventoryError(error, 'Failed to process inventory request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// PUT /api/inventory — Update asset or maintenance request
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'maintenance') {
      const record = await updateMaintenanceRequest(schoolId, id, updates)
      return ok(record)
    }

    const asset = await updateAsset(schoolId, id, updates)
    return ok(asset)
  } catch (error) {
    const { code, message } = handleInventoryError(error, 'Failed to update inventory record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// DELETE /api/inventory?id=xxx&type=asset|maintenance
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'maintenance') {
      const result = await deleteMaintenanceRequest(schoolId, id)
      return ok(result)
    }

    const result = await deleteAsset(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleInventoryError(error, 'Failed to delete inventory record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
