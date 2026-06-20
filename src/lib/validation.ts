import { NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { logSecurityEvent } from './audit'

export function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root'
    if (!formatted[path]) formatted[path] = []
    formatted[path].push(issue.message)
  }
  return formatted
}

export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    logSecurityEvent({
      event: 'INPUT_VALIDATION_FAILED',
      details: `Validation failed: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`,
      severity: 'LOW',
    }).catch(() => {})
    return {
      error: NextResponse.json(
        { error: 'Validation failed', details: formatZodError(result.error) },
        { status: 400 }
      ),
    }
  }

  return { data: result.data }
}

// ─── Common reusable schemas ──────────────────────────────────────────────

export const idSchema = z.string().uuid().or(z.string().min(1))
export const positiveNumberSchema = z.coerce.number().nonnegative()
export const emailSchema = z.string().email().optional().or(z.literal(''))
export const phoneSchema = z.string().min(1).optional().or(z.literal(''))
