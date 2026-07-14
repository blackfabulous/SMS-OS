import { Prisma } from '@prisma/client'
import { db } from './db'
import { getServerSession } from './auth'
import { currentSchoolId } from '@/server/tenant-context'

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined
  return value as Prisma.InputJsonValue
}

export async function logAudit(params: {
  action: string
  entity: string
  entityId?: string | null
  schoolId?: string | null
  details?: string
  beforeValue?: unknown
  afterValue?: unknown
}): Promise<void> {
  try {
    const session = await getServerSession()
    const userId = session?.user?.id ?? null
    const schoolId = params.schoolId ?? session?.user?.schoolId ?? currentSchoolId()
    if (!schoolId) return

    await db.auditLog.create({
      data: {
        schoolId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        performedBy: userId,
        actorId: userId,
        details: params.details || null,
        beforeValue: toJson(params.beforeValue),
        afterValue: toJson(params.afterValue),
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
  schoolId?: string | null
  details?: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}): Promise<void> {
  try {
    const schoolId = params.schoolId ?? currentSchoolId()
    await db.auditLog.create({
      data: {
        schoolId,
        action: params.event,
        entity: 'SECURITY',
        performedBy: params.userId ?? null,
        actorId: params.userId ?? null,
        details: params.details || null,
        afterValue: toJson({
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
