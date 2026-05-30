import { NextResponse } from 'next/server'
import { validateRole } from '@/lib/api-auth'
import { seedDatabase } from '@/lib/seed-data'

export async function POST(request: Request) {
  // Block seeding in production entirely
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seeding is disabled in production' }, { status: 403 })
  }

  // Require SUPER_ADMIN or ADMIN authentication
  const authResult = await validateRole(['SUPER_ADMIN', 'ADMIN'])
  if ('error' in authResult) return authResult.error

  // Require a shared secret header to prevent accidental triggering
  const seedSecret = request.headers.get('x-seed-secret')
  if (!process.env.SEED_SECRET || seedSecret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Invalid or missing seed secret (x-seed-secret header)' }, { status: 403 })
  }

  try {
    const result = await seedDatabase()
    return NextResponse.json({ message: 'Database seeded successfully', ...result }, { status: 201 })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
