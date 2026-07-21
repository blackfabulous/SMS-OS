import type { Page } from '@playwright/test'

export const ADMIN = {
  email: 'admin@zimschool.co.zw',
  password: 'password123',
}

export async function loginAsAdmin(page: Page) {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  // 1. Get CSRF token (Playwright request context handles cookies automatically)
  const csrfRes = await page.request.get(`${baseUrl}/api/auth/csrf`)
  if (csrfRes.status() !== 200) {
    throw new Error(`Failed to fetch CSRF token: ${csrfRes.status()}`)
  }
  const csrfData = (await csrfRes.json()) as { csrfToken: string }

  // 2. Submit credentials to NextAuth credentials callback
  const loginRes = await page.request.post(`${baseUrl}/api/auth/callback/credentials`, {
    form: {
      csrfToken: csrfData.csrfToken,
      email: ADMIN.email,
      password: ADMIN.password,
      callbackUrl: `${baseUrl}/dashboard`,
      json: 'true',
    },
  })

  if (loginRes.status() !== 200) {
    const text = await loginRes.text().catch(() => '')
    throw new Error(`Login failed: ${loginRes.status()} ${text}`)
  }

  const loginData = (await loginRes.json()) as { url?: string; error?: string }
  if (loginData.error) {
    throw new Error(`Login error: ${loginData.error}`)
  }

  // 3. Navigate to dashboard with the session cookie now in the shared context
  await page.goto('/dashboard', { waitUntil: 'networkidle' })
  await page.getByRole('heading').first().waitFor()
}
