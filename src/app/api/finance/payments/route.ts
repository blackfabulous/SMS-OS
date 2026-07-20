import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'
import { requireContext } from '@/server/context'
import { financeStudentScope } from '@/server/finance/scope'
import { CreatePaymentSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { withIdempotency, idempotencyKeyFromRequest } from '@/lib/idempotency'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import {
  createPaymentWithDefaults,
  findPayment,
  listPayments,
  markPaymentReversed,
  reversePaymentById,
} from '@/server/services/payment-service'

function generateReceiptNumber(year: number): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')
  return `RCP${year}${ts}${rnd}`
}

export async function GET(request: Request) {
  const result = await requireContext()
  if ('error' in result) return result.error

  try {
    const scope = await financeStudentScope(result.ctx)
    if (!scope) return ok({ data: [], total: 0, page: 1, totalPages: 0 })

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const extra: Record<string, unknown> = { ...scope.where }
    if (scope.staff && studentId) extra.studentId = studentId
    if (paymentMethod) extra.paymentMethod = paymentMethod as any
    if (startDate || endDate) {
      extra.createdAt = {}
      if (startDate) (extra.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (extra.createdAt as Record<string, unknown>).lte = new Date(endDate)
    }

    const { data, total } = await listPayments(result.ctx.schoolId, {
      where: extra as any,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return ok({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching payments')
    return fail('INTERNAL', 'Failed to fetch payments')
  }
}

export async function POST(request: Request) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error
  const { ctx } = authResult

  const rateLimit = await checkRateLimit('payment:create', ctx.userId, {
    windowSeconds: 60,
    maxRequests: 20,
  })
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.result.resetAt.getTime() - Date.now()) / 1000))
    return fail('RATE_LIMITED', 'Rate limit exceeded', {
      limit: rateLimit.result.limit,
      remaining: rateLimit.result.remaining,
      resetAt: rateLimit.result.resetAt.toISOString(),
    })
  }

  try {
    const rawBody = await request.json()

    const parsed = CreatePaymentSchema.safeParse(rawBody)
    if (!parsed.success) {
      return fail('VALIDATION', 'Validation failed', parsed.error.issues)
    }
    const data = parsed.data
    const year = new Date().getFullYear()
    const idempotencyKey = idempotencyKeyFromRequest(request)

    const { result: paymentId } = await withIdempotency(
      'payment',
      idempotencyKey,
      86400,
      async () => {
        let id: string | null = null
        const MAX_ATTEMPTS = 5
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const payment = await createPaymentWithDefaults(ctx.schoolId, data, generateReceiptNumber(year))
            id = payment.id
            break
          } catch (err: unknown) {
            const code = (err as { code?: string })?.code
            if (code === 'P2002' && attempt < MAX_ATTEMPTS) continue
            throw err
          }
        }
        if (!id) {
          throw new AppError('INTERNAL', 'Failed to generate a unique receipt number')
        }
        return id
      },
    )

    const payment = await findPayment(ctx.schoolId, paymentId)
    if (!payment) {
      return fail('INTERNAL', 'Payment was created but could not be retrieved')
    }

    return ok(payment, 201)
  } catch (error) {
    logger.error({ err: error }, 'Error recording payment')
    if (isAppError(error)) {
      return fail(error.code, error.message, error.details)
    }
    return fail('INTERNAL', 'Failed to record payment')
  }
}

export async function PUT(request: Request) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error
  const { ctx } = authResult

  try {
    const body = await request.json()
    const { id } = body
    if (!id) {
      return fail('VALIDATION', 'Payment ID is required')
    }

    const payment = await markPaymentReversed(ctx.schoolId, id)
    return ok(payment)
  } catch (error) {
    logger.error({ err: error }, 'Error updating payment')
    if (isAppError(error)) {
      return fail(error.code, error.message, error.details)
    }
    return fail('INTERNAL', 'Failed to update payment')
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error
  const { ctx } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return fail('VALIDATION', 'Payment ID is required')
    }

    const existing = await findPayment(ctx.schoolId, id)
    if (!existing) {
      return fail('NOT_FOUND', 'Payment not found')
    }
    if (existing.isReversed) {
      return fail('CONFLICT', 'Payment is already reversed')
    }

    const payment = await reversePaymentById(ctx.schoolId, id)
    logAudit({ action: 'DELETE', entity: 'payments', entityId: id, schoolId: ctx.schoolId }).catch(() => {})
    return ok({ message: 'Payment reversed successfully', payment })
  } catch (error) {
    logger.error({ err: error }, 'Error reversing payment')
    if (isAppError(error)) {
      return fail(error.code, error.message, error.details)
    }
    return fail('INTERNAL', 'Failed to reverse payment')
  }
}
