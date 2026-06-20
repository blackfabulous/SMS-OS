import { db } from './db'
import { getServerSession } from './auth'

export async function logAudit(params: {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_CREATE' | 'BULK_UPDATE' | 'BULK_DELETE'
  entity: string
  entityId?: string | null
  details?: string
  beforeValue?: unknown
  afterValue?: unknown
}): Promise<void> {
  try {
    const session = await getServerSession()
    const userId = session?.user?.id ?? null

    await db.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        performedBy: userId,
        details: params.details || null,
        beforeValue: params.beforeValue ? JSON.stringify(params.beforeValue) : null,
        afterValue: params.afterValue ? JSON.stringify(params.afterValue) : null,
      },
    })
  } catch {
    // Silently fail — never break the main operation
  }
}

export async function logSecurityEvent(params: {
  event: 'RATE_LIMIT_EXCEEDED' | 'AUTH_FAILURE' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'DDOS_BLOCKED' | 'CSRF_VIOLATION' | 'INPUT_VALIDATION_FAILED'
  ip?: string
  userId?: string | null
  details?: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: params.event,
        entity: 'SECURITY',
        performedBy: params.userId ?? null,
        details: params.details || null,
        afterValue: JSON.stringify({
          ip: params.ip ?? null,
          severity: params.severity ?? 'MEDIUM',
          timestamp: new Date().toISOString(),
        }),
      },
    })
  } catch {
    // Silently fail — never break the main operation
  }
}
