import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { listCommunications, sendCommunication, updateCommunication, deleteCommunication, handleCommunicationsError } from '@/server/services/communications'

export async function GET(request: NextRequest) {
  const tenantResult = await getRequestTenant()
  if ('error' in tenantResult) return tenantResult.error
  const { schoolId } = tenantResult

  try {
    const { searchParams } = new URL(request.url)
    const data = await listCommunications(schoolId, {
      channel: searchParams.get('channel') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    })
    return ok(data)
  } catch (error) {
    const { code, message } = handleCommunicationsError(error, 'Failed to fetch communications')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const result = await sendCommunication(schoolId, body)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handleCommunicationsError(error, 'Failed to send communication')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return fail('VALIDATION', 'Communication ID is required')

    const result = await updateCommunication(schoolId, id, updates)
    return ok(result)
  } catch (error) {
    const { code, message } = handleCommunicationsError(error, 'Failed to update communication')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return fail('VALIDATION', 'Communication ID is required')

    const result = await deleteCommunication(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleCommunicationsError(error, 'Failed to delete communication')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
