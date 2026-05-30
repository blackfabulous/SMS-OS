import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
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
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')

  try {
    const record = await db.passwordResetToken.findUnique({ where: { tokenHash } })
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email: record.email }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: 'This reset link is no longer valid.' }, { status: 400 })
    }

    const hashed = await hashPassword(parsed.data.password)
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { password: hashed } }),
      db.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
      // Clean up any other outstanding tokens for this account.
      db.passwordResetToken.deleteMany({ where: { email: record.email, usedAt: null } }),
    ])

    return NextResponse.json({ message: 'Your password has been reset. You can now sign in.' }, { status: 200 })
  } catch (err) {
    console.error('reset-password error', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
