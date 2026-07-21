import 'server-only'
import { randomBytes, createHash } from 'crypto'
import { db } from '@/lib/db'
import { sendEmail, resetPasswordEmail } from '@/lib/email'
import { hashPassword } from '@/lib/auth'
import { AppError, isAppError } from '@/lib/errors'

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '')
}

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, isActive: true } })
  if (user && user.isActive) {
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
  return { message: 'If an account exists for that email, a reset link has been sent.' }
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } })
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError('VALIDATION', 'This reset link is invalid or has expired. Please request a new one.')
  }

  const user = await db.user.findUnique({ where: { email: record.email }, select: { id: true } })
  if (!user) throw new AppError('VALIDATION', 'This reset link is no longer valid.')

  const hashed = await hashPassword(password)
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { password: hashed } }),
    db.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
    db.passwordResetToken.deleteMany({ where: { email: record.email, usedAt: null } }),
  ])

  return { message: 'Your password has been reset. You can now sign in.' }
}

export function handlePasswordError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
