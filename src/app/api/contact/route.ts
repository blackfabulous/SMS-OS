import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * PUBLIC contact form endpoint (no auth). Validates + spam-guards the submission.
 * v1 acknowledges receipt and logs server-side; wiring to email/Resend or a
 * persisted inbox is a follow-up (see MASTER-PLAN Phase B auto-reply hook).
 */
const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal('')),
  subject: z.string().min(1).max(160),
  message: z.string().min(1).max(2000),
  // Honeypot — accept any value at the schema level so a filled value doesn't
  // produce a validation error that signals the trap; handled after parsing.
  company: z.string().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the form and try again.', details: parsed.error.issues }, { status: 400 })
  }
  const d = parsed.data

  // Honeypot triggered → silently accept, do nothing.
  if (d.company) {
    return NextResponse.json({ message: 'Thank you — your message has been received.' }, { status: 200 })
  }

  // TODO: deliver via email (Resend) and/or persist to an inbox model.
  console.info(`[contact] ${d.name} <${d.email}> — ${d.subject}`)

  return NextResponse.json(
    { message: 'Thank you for reaching out. We will get back to you shortly.' },
    { status: 200 },
  )
}
