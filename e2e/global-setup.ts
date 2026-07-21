import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { loadEnvConfig } from '@next/env'

export default async function globalSetup() {
  loadEnvConfig(process.cwd())
  if (process.env.SKIP_E2E_SETUP) return

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('[e2e setup] DATABASE_URL not set; skipping seed.')
    return
  }

  const seedScript = './prisma/seed.ts'
  if (!existsSync(seedScript)) {
    console.warn(`[e2e setup] ${seedScript} not found; skipping seed.`)
    return
  }

  console.log('[e2e setup] Seeding test database...')
  execSync('bun ./prisma/seed.ts', { stdio: 'inherit', env: process.env })
  console.log('[e2e setup] Seed complete.')
}
