import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  user?: string | null
  module?: string | null
  action?: string | null
  startDate?: string | null
  endDate?: string | null
  page?: number
  limit?: number
}

export async function listAuditLogs(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { schoolId }
  if (params.user && params.user !== 'ALL') where.performedBy = params.user
  if (params.module && params.module !== 'ALL') where.entity = params.module
  if (params.action && params.action !== 'ALL') where.action = params.action
  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(params.startDate)
    if (params.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(params.endDate + 'T23:59:59Z')
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    db.auditLog.count({ where }),
  ])

  const allLogs = await db.auditLog.findMany({ where: { schoolId }, take: 1000 })
  const users = [...new Set(allLogs.map((l) => l.performedBy).filter(Boolean))] as string[]
  const modules = [...new Set(allLogs.map((l) => l.entity))]
  const actions = [...new Set(allLogs.map((l) => l.action))]

  return { data: logs, total, page, totalPages: Math.ceil(total / limit), users, modules, actions }
}

export async function createAuditLog(
  schoolId: string,
  body: {
    action?: string
    entity?: string
    entityId?: string
    performedBy?: string
    details?: string
    beforeValue?: unknown
    afterValue?: unknown
  },
) {
  const { action, entity, entityId, performedBy, details, beforeValue, afterValue } = body
  if (!action || !entity) throw new AppError('VALIDATION', 'Action and entity are required')

  await logAudit({
    action,
    entity,
    entityId: entityId || null,
    schoolId,
    details,
    beforeValue,
    afterValue,
  })

  return { success: true }
}

export function handleAuditError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
