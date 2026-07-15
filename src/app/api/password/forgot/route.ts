import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { sendEmail, resetPasswordEmail } from '@/lib/email'

/**
 * PUBLIC: request a password-reset link. Always returns 200 with the same
 * message regardless of whether the email exists (no user enumeration).
 */
const Schema = z.object({ email: z.string().email() })

const GENERIC = { message: 'If an account exists for that email, a reset link has been sent.' }

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return fail('VALIDATION', 'Invalid request') }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return fail('VALIDATION', 'Please enter a valid email address.')
  const email = parsed.data.email.toLowerCase().trim()

  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, isActive: true } })
    if (user && user.isActive) {
      // Invalidate any prior unused tokens for this email, then mint a new one.
      await db.passwordResetToken.deleteMany({ where: { email, usedAt: null } })
      const rawToken = randomBytes(32).toString('hex')
      const tokenHash = createHash('sha256').update(rawToken).digest('hex')
      await db.passwordResetToken.create({
        data: { email, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      })

      const school = await db.school.findFirst({ select: { name: true } })
      const link = `${siteUrl()}/reset-password?token=${rawToken}`
      const { subject, html, text } = resetPasswordEmail(link, school?.name ?? 'ZimSchool')
      await sendEmail({ to: email, subject, html, text })
    }
  } catch (err) {
    // Never reveal internal errors to the caller; log and still return generic.
    logger.error({ err }, 'forgot-password error')
  }

  return ok(GENERIC)
}
