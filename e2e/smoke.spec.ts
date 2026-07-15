import { test, expect } from '@playwright/test'

test.describe('public pages', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ZimSchool Pro/)
    await expect(page.locator('text=ZimSchool Pro').first()).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('form')).toBeVisible()
  })
})
