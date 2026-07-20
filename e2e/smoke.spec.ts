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

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByRole('heading', { name: /Contact Us/i })).toBeVisible()
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

  test('settings module loads', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await expect(page.getByRole('heading', { name: 'Settings' }).first()).toBeVisible()
  })
})
