import { z } from 'zod'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { hashPassword } from '@/lib/auth'

/**
 * PUBLIC: complete a password reset using the token from the emailed link.
 */
const Schema = z.object({
  token: z.string().min(16),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return fail('VALIDATION', 'Invalid request') }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return fail('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid request.')
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')

  try {
    const record = await db.passwordResetToken.findUnique({ where: { tokenHash } })
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return fail('VALIDATION', 'This reset link is invalid or has expired. Please request a new one.')
    }

    const user = await db.user.findUnique({ where: { email: record.email }, select: { id: true } })
    if (!user) {
      return fail('VALIDATION', 'This reset link is no longer valid.')
    }

    const hashed = await hashPassword(parsed.data.password)
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { password: hashed } }),
      db.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
      // Clean up any other outstanding tokens for this account.
      db.passwordResetToken.deleteMany({ where: { email: record.email, usedAt: null } }),
    ])

    return ok({ message: 'Your password has been reset. You can now sign in.' })
  } catch (err) {
    logger.error({ err }, 'reset-password error')
    return fail('INTERNAL', 'Something went wrong. Please try again.')
  }
}
