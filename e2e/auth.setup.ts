import { test as setup, expect } from '@playwright/test'
import { ADMIN } from './helpers/auth'

setup('authenticate as admin', async ({ request }) => {
  const csrfRes = await request.get('/api/auth/csrf')
  expect(csrfRes.status()).toBe(200)
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string }

  const loginRes = await request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      email: ADMIN.email,
      password: ADMIN.password,
      callbackUrl: '/dashboard',
      json: 'true',
    },
  })
  expect(loginRes.status()).toBe(200)

  const data = (await loginRes.json()) as { error?: string; url?: string }
  expect(data.error).toBeUndefined()

  await request.storageState({ path: 'e2e/.auth/admin.json' })
})
