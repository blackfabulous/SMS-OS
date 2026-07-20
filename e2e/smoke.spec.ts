import { test, expect } from '@playwright/test'

test.describe('public pages', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Excellence in Education/)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.locator('form')).toBeVisible()
  })

  test('contact page loads and submits', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByRole('heading', { name: /Contact Us/i })).toBeVisible()

    await page.getByLabel(/Name/i).fill('Test User')
    await page.getByLabel(/Email/i).fill('test@example.com')
    await page.getByLabel(/Phone/i).fill('+263772000000')
    await page.getByLabel(/Subject/i).fill('E2E smoke test')
    await page.getByLabel(/Message/i).fill('This is a test message from Playwright.')
    await page.getByRole('button', { name: /Send message/i }).click()

    await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible()
  })

  test('admissions apply page loads', async ({ page }) => {
    await page.goto('/admissions/apply')
    await expect(page.getByRole('heading', { name: /Apply for Admission/i })).toBeVisible()
  })
})

test.describe('authenticated smoke', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' })

  test('dashboard loads', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible()
  })

  test('finance module loads', async ({ page }) => {
    await page.goto('/dashboard/finance')
    await expect(page.getByRole('heading', { name: 'Finance' }).first()).toBeVisible()
  })

  test('students module loads', async ({ page }) => {
    await page.goto('/dashboard/students')
    await expect(page.getByRole('heading', { name: 'Students' }).first()).toBeVisible()
  })

  test('students module searches', async ({ page }) => {
    await page.goto('/dashboard/students')
    const search = page.getByPlaceholder(/Search by name/i)
    await search.fill('Tendai')
    await expect(page.getByRole('row').filter({ hasText: /Tendai/i }).first()).toBeVisible()
  })

  test('staff module loads', async ({ page }) => {
    await page.goto('/dashboard/staff')
    await expect(page.getByRole('heading', { name: 'Staff' }).first()).toBeVisible()
  })

  test('timetable module loads', async ({ page }) => {
    await page.goto('/dashboard/timetable')
    await expect(page.getByRole('heading', { name: 'Timetable' }).first()).toBeVisible()
  })

  test('settings module loads', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await expect(page.getByRole('heading', { name: 'Settings' }).first()).toBeVisible()
  })
})
