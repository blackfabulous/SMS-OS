import { seedDatabase } from '@/lib/seed-data'

async function main() {
  console.log('🌱 Seeding database...')
  const result = await seedDatabase()
  console.log('✅ Seeded:', result.school)
  console.table(result.stats)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .then(() => process.exit(0))
