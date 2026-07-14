import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'

export async function GET(request: Request) {
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
    const where: Record<string, unknown> = { schoolId }
    if (user && user !== 'ALL') where.performedBy = user
    if (moduleFilter && moduleFilter !== 'ALL') where.entity = moduleFilter
    if (action && action !== 'ALL') where.action = action
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59Z')
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    // Get unique values for filters
    const allLogs = await db.auditLog.findMany({ where: { schoolId }, take: 1000 })
    const users = [...new Set(allLogs.map((l) => l.performedBy).filter(Boolean))] as string[]
    const modules = [...new Set(allLogs.map((l) => l.entity))]
    const actions = [...new Set(allLogs.map((l) => l.action))]

    return NextResponse.json({
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users,
      modules,
      actions,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'SUPER_ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { action, entity, entityId, performedBy, details, beforeValue, afterValue } = body

    if (!action || !entity) {
      return NextResponse.json({ error: 'Action and entity are required' }, { status: 400 })
    }

    await logAudit({
      action,
      entity,
      entityId: entityId || null,
      schoolId: authResult.session.user.schoolId,
      details,
      beforeValue,
      afterValue,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
