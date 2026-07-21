import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: '**/*.setup.ts' },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'], testIgnore: '**/*.setup.ts' },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] }, dependencies: ['setup'], testIgnore: '**/*.setup.ts' },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'bun run build && bun run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { PLAYWRIGHT_E2E: 'true' },
      },
})
