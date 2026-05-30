import 'server-only'

/**
 * Minimal SMS/WhatsApp sender via Africa's Talking. Mirrors the pattern in
 * /api/communication/sms/send: real send when AFRICAS_TALKING_API_KEY is set,
 * otherwise a simulated success so flows are testable in development.
 */
const AT_API_KEY = process.env.AFRICAS_TALKING_API_KEY
const AT_USERNAME = process.env.AFRICAS_TALKING_USERNAME || 'sandbox'
const AT_SENDER_ID = process.env.AFRICAS_TALKING_SENDER_ID || 'ZimSchool'

/** Normalise a Zimbabwean phone number to +263 E.164 form. */
export function normalisePhone(phone: string): string {
  let c = phone.replace(/\s/g, '')
  if (c.startsWith('0')) c = '+263' + c.slice(1)
  else if (!c.startsWith('+')) c = '+263' + c
  return c
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  const recipient = normalisePhone(to)

  if (!AT_API_KEY) {
    console.info(`[sms:dev] To: ${recipient}\n${message}`)
    return true
  }

  try {
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey: AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({ username: AT_USERNAME, to: recipient, message, from: AT_SENDER_ID }),
    })
    if (!res.ok) {
      console.error('[sms] Africa\'s Talking error', res.status)
      return false
    }
    return true
  } catch (err) {
    console.error('[sms] send failed', err)
    return false
  }
}
