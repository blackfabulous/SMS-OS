import { z } from 'zod'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { resetPassword, handlePasswordError } from '@/server/services/password'

const Schema = z.object({
  token: z.string().min(16),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('VALIDATION', 'Invalid request')
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return fail('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid request.')
  }

  try {
    const result = await resetPassword(parsed.data.token, parsed.data.password)
    return ok(result)
  } catch (err) {
    const { code, message } = handlePasswordError(err, 'Something went wrong. Please try again.')
    if (code === 'INTERNAL') logger.error({ err }, 'reset-password error')
    return fail(code, message)
  }
}
