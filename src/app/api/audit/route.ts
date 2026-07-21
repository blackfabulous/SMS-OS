import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { listAuditLogs, createAuditLog, handleAuditError } from '@/server/services/audit'

export async function GET(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'SUPER_ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const user = searchParams.get('user')
    const moduleFilter = searchParams.get('module')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const schoolId = authResult.session.user.schoolId

    const result = await listAuditLogs(schoolId, { user, module: moduleFilter, action, startDate, endDate, page, limit })
    return ok(result)
  } catch (error) {
    const { code, message } = handleAuditError(error, 'Failed to fetch audit logs')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'SUPER_ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await createAuditLog(authResult.session.user.schoolId, body)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handleAuditError(error, 'Failed to create audit log')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
