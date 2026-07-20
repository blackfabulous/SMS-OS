import { test, expect } from '@playwright/test'

test.describe('authenticated critical journeys', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' })

  test('admin views the finance dashboard', async ({ page }) => {
    await page.goto('/dashboard/finance')
    await expect(page.getByRole('heading', { name: 'Finance' }).first()).toBeVisible()
    // Core finance summary cards should be present once data loads.
    await expect(page.getByText(/Total Invoiced|Total Collected|Total Outstanding/i).first()).toBeVisible()
  })

  test('admin searches for and opens a student record', async ({ page }) => {
    await page.goto('/dashboard/students')
    const search = page.getByPlaceholder(/Search by name/i)
    await search.fill('Tendai')
    const row = page.getByRole('row').filter({ hasText: /Tendai/i }).first()
    await expect(row).toBeVisible()
    await row.click()
    await expect(page.getByRole('heading', { name: 'Student Details' }).first()).toBeVisible()
  })
})

test.describe('public critical journeys', () => {
  test('prospective parent submits an admission application', async ({ page }) => {
    await page.goto('/admissions/apply')
    await expect(page.getByRole('heading', { name: 'Apply for Admission' })).toBeVisible()

    // Step 1: Learner details
    await page.getByLabel(/First name/i).fill('Tariro')
    await page.getByLabel(/Last name/i).fill('Moyo')
    await page.getByLabel(/Gender/i).selectOption('MALE')
    await page.getByLabel(/Date of birth/i).fill('2010-05-15')
    await page.getByLabel(/Grade applying for/i).selectOption('Form 1')
    await page.getByRole('button', { name: /Continue/i }).click()

    // Step 2: Guardian details
    await page.getByLabel(/First name/i).fill('John')
    await page.getByLabel(/Last name/i).fill('Moyo')
    await page.getByLabel(/Phone/i).fill('+263772123456')
    await page.getByRole('button', { name: /Continue/i }).click()

    // Step 3: Review & submit
    await page.getByRole('button', { name: /Submit application/i }).click()

    await expect(page.getByRole('heading', { name: 'Application submitted!' })).toBeVisible()
    await expect(page.getByText(/application reference/i)).toBeVisible()
  })
})
