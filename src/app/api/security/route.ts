import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { getRequestTenant } from '@/lib/tenant'
import { validateAuth, validateRole } from '@/lib/api-auth'
import {
  listSecurity,
  checkInVisitor,
  checkOutVisitor,
  reportSecurityIncident,
  updateVisitor,
  updateSecurityIncident,
  deleteVisitor,
  deleteSecurityIncident,
  handleSecurityError,
} from '@/server/services/security'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status')
    const incidentType = searchParams.get('incidentType')
    const severity = searchParams.get('severity')
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listSecurity(tenantResult.schoolId, {
      type: type || null,
      status,
      incidentType,
      severity,
      search,
      dateFrom,
      dateTo,
      page,
      limit,
    })
    return ok(result)
  } catch (error) {
    const { code, message } = handleSecurityError(error, 'Failed to fetch security data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'checkIn' || action === 'registerVisitor') {
      const visitor = await checkInVisitor(schoolId, body)
      return ok(visitor, 201)
    }

    if (action === 'checkOut') {
      const visitor = await checkOutVisitor(schoolId, body.visitorId)
      return ok(visitor)
    }

    if (action === 'reportIncident') {
      const incident = await reportSecurityIncident(schoolId, body)
      return ok(incident, 201)
    }

    return fail('VALIDATION', 'Invalid action. Use checkIn, checkOut, or reportIncident')
  } catch (error) {
    const { code, message } = handleSecurityError(error, 'Failed to process security request')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, type, ...updates } = body
    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'incident') {
      const incident = await updateSecurityIncident(schoolId, id, updates)
      return ok(incident)
    }

    const visitor = await updateVisitor(schoolId, id, updates)
    return ok(visitor)
  } catch (error) {
    const { code, message } = handleSecurityError(error, 'Failed to update security record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return fail('VALIDATION', 'ID is required')

    if (type === 'incident') {
      const result = await deleteSecurityIncident(schoolId, id)
      return ok(result)
    }

    const result = await deleteVisitor(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleSecurityError(error, 'Failed to delete security record')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
