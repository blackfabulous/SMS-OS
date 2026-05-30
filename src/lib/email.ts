import 'server-only'

/**
 * Minimal email sender. Uses the Resend REST API when RESEND_API_KEY is set
 * (no SDK dependency), otherwise logs to the server console so flows are
 * testable in development. Returns true if the message was accepted/handled.
 */
interface SendArgs {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev'

  if (!apiKey) {
    // Dev fallback — surface the content so the flow can be exercised locally.
    console.info(`[email:dev] To: ${to}\nSubject: ${subject}\n${text ?? html}`)
    return true
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, text }),
    })
    if (!res.ok) {
      console.error('[email] Resend error', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('[email] send failed', err)
    return false
  }
}

export function resetPasswordEmail(link: string, schoolName: string) {
  const subject = `Reset your ${schoolName} portal password`
  const text = `We received a request to reset your password.\n\nReset it here (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can safely ignore this email.`
  const html = `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0f172a">
    <h2 style="color:#047857;margin:0 0 12px">Reset your password</h2>
    <p style="line-height:1.6;color:#334155">We received a request to reset your ${schoolName} portal password. Click the button below to choose a new one. This link is valid for <strong>1 hour</strong>.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#059669;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">Reset password</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">If the button doesn't work, paste this link into your browser:<br><a href="${link}" style="color:#059669;word-break:break-all">${link}</a></p>
    <p style="font-size:13px;color:#94a3b8;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  </div>`
  return { subject, text, html }
}
