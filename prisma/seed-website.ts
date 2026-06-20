/**
 * Seeds the public-website theme + partner logos for the first school.
 * Idempotent: upserts the SiteTheme row and only creates default partners
 * when none exist yet. Safe to re-run.
 *
 *   npx tsx prisma/seed-website.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const DEFAULT_STATS = [
  { value: '{students}', label: 'Students Enrolled' },
  { value: '{staff}', label: 'Qualified Staff' },
  { value: '96%', label: 'ZIMSEC Pass Rate' },
  { value: '{years}', label: 'Years of Service' },
]

const DEFAULT_VALUES = [
  { icon: 'ShieldCheck', title: 'Discipline & Integrity', desc: 'A safe, structured environment where respect, honesty and responsibility are lived daily.' },
  { icon: 'Lightbulb', title: 'Innovation & Curiosity', desc: 'Modern labs, ICT and an innovation centre that turn questions into discovery and skill.' },
  { icon: 'Heart', title: 'Care & Belonging', desc: 'Small classes and attentive mentors who know every learner by name and nurture their gifts.' },
  { icon: 'Target', title: 'Results That Open Doors', desc: 'A proven track record of university placements, scholarships and confident, work-ready graduates.' },
]

const DEFAULT_TESTIMONIALS = [
  { quote: 'The teachers here genuinely care. My daughter went from struggling in Maths to earning an A in her ZIMSEC O-Levels.', name: 'Mrs. T. Moyo', role: 'Parent, Form 4' },
  { quote: 'Beyond academics, I learned leadership through debate and sport. I walked into university already prepared.', name: 'Tatenda C.', role: 'Alumnus, Class of 2022' },
  { quote: 'A disciplined, welcoming community with facilities that rival the best schools in the province.', name: 'Mr. R. Ncube', role: 'Parent & SDC Member' },
]

const DEFAULT_PARTNERS = [
  { name: 'ZIMSEC', websiteUrl: 'https://www.zimsec.co.zw', category: 'ACCREDITATION', sortOrder: 0 },
  { name: 'Cambridge International', websiteUrl: 'https://www.cambridgeinternational.org', category: 'ACCREDITATION', sortOrder: 1 },
  { name: 'MoPSE', websiteUrl: 'http://www.mopse.gov.zw', category: 'ACCREDITATION', sortOrder: 2 },
  { name: 'HEXCO', websiteUrl: 'https://www.hexco.co.zw', category: 'ACCREDITATION', sortOrder: 3 },
  { name: 'Better Schools Programme ZW', category: 'PARTNER', sortOrder: 4 },
  { name: 'University of Zimbabwe', websiteUrl: 'https://www.uz.ac.zw', category: 'PARTNER', sortOrder: 5 },
]

async function main() {
  const school = await db.school.findFirst()
  if (!school) {
    console.error('No school record found — run the main seed first.')
    process.exit(1)
  }

  const theme = await db.siteTheme.upsert({
    where: { schoolId: school.id },
    update: {}, // don't clobber admin edits on re-run
    create: {
      schoolId: school.id,
      heroSubtitle:
        'We nurture confident, disciplined and curious young Zimbabweans — combining rigorous academics with character, sport and service so every learner leaves ready to thrive.',
      statsJson: JSON.stringify(DEFAULT_STATS),
      valuesJson: JSON.stringify(DEFAULT_VALUES),
      testimonialsJson: JSON.stringify(DEFAULT_TESTIMONIALS),
    },
  })
  console.log(`SiteTheme ready (id=${theme.id})`)

  const existing = await db.partner.count({ where: { schoolId: school.id } })
  if (existing === 0) {
    await db.partner.createMany({
      data: DEFAULT_PARTNERS.map((p) => ({ ...p, schoolId: school.id })),
    })
    console.log(`Seeded ${DEFAULT_PARTNERS.length} partners`)
  } else {
    console.log(`Partners already present (${existing}) — skipped`)
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
