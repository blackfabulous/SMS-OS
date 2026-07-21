import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import {
  listTransport,
  assignStudentToTransport,
  addTransportRoute,
  addVehicle,
  updateTransportRoute,
  updateVehicle,
  updateTransportAssignment,
  deleteTransportRoute,
  deleteVehicle,
  deleteTransportAssignment,
  handleTransportError,
} from '@/server/services/transport'

// GET /api/transport — List routes with vehicle and student assignment info
export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listTransport(tenantResult.schoolId, { search, isActive, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleTransportError(error, 'Failed to fetch transport data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// POST /api/transport — Create route / vehicle / assign student to route
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action } = body
    const schoolId = authResult.session.user.schoolId

    if (action === 'assign') {
      const assignment = await assignStudentToTransport(schoolId, body)
      return ok(assignment, 201)
    }

    if (action === 'addRoute') {
      const route = await addTransportRoute(schoolId, body)
      return ok(route, 201)
    }

    if (action === 'addVehicle') {
      const vehicle = await addVehicle(schoolId, body)
      return ok(vehicle, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use: assign, addRoute, or addVehicle')
  } catch (error) {
    const { code, message } = handleTransportError(error, 'Failed to process transport request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// PUT /api/transport — Update route / vehicle / assignment
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'route') {
      const route = await updateTransportRoute(schoolId, id, updates)
      return ok(route)
    }

    if (type === 'vehicle') {
      const vehicle = await updateVehicle(schoolId, id, updates)
      return ok(vehicle)
    }

    const assignment = await updateTransportAssignment(schoolId, id, updates)
    return ok(assignment)
  } catch (error) {
    const { code, message } = handleTransportError(error, 'Failed to update transport record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

// DELETE /api/transport?id=xxx&type=route|vehicle|assignment
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'route') {
      const result = await deleteTransportRoute(schoolId, id)
      return ok(result)
    }

    if (type === 'vehicle') {
      const result = await deleteVehicle(schoolId, id)
      return ok(result)
    }

    const result = await deleteTransportAssignment(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleTransportError(error, 'Failed to delete transport record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
