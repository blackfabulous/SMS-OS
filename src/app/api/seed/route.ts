import { validateRole } from '@/lib/api-auth'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { seedDatabase } from '@/lib/seed-data'

export async function POST(request: Request) {
  // Block seeding in production entirely
  if (process.env.NODE_ENV === 'production') {
    return fail('FORBIDDEN', 'Seeding is disabled in production')
  }

  // Require SUPER_ADMIN or ADMIN authentication
  const authResult = await validateRole(['SUPER_ADMIN', 'ADMIN'])
  if ('error' in authResult) return authResult.error

  // Require a shared secret header to prevent accidental triggering
  const seedSecret = request.headers.get('x-seed-secret')
  if (!process.env.SEED_SECRET || seedSecret !== process.env.SEED_SECRET) {
    return fail('FORBIDDEN', 'Invalid or missing seed secret (x-seed-secret header)')
  }

  try {
    const result = await seedDatabase()
    return ok({ message: 'Database seeded successfully', ...result }, 201)
  } catch (error) {
    logger.error({ err: error }, 'Error seeding database')
    return fail('INTERNAL', 'Failed to seed database', { details: error instanceof Error ? error.message : 'Unknown error' })
  }
}
