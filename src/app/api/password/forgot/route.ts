import { z } from 'zod'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requestPasswordReset, handlePasswordError } from '@/server/services/password'

const Schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('VALIDATION', 'Invalid request')
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return fail('VALIDATION', 'Please enter a valid email address.')

  const email = parsed.data.email.toLowerCase().trim()

  try {
    const result = await requestPasswordReset(email)
    return ok(result)
  } catch (err) {
    logger.error({ err }, 'forgot-password error')
    return ok({ message: 'If an account exists for that email, a reset link has been sent.' })
  }
}
