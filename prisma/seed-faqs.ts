/**
 * Seeds default FAQs for the first school (idempotent — only when none exist).
 *   npx tsx prisma/seed-faqs.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const DEFAULT_FAQS = [
  { question: 'What are the admission requirements?', answer: 'Admission requires a completed application form, the learner’s birth certificate, the most recent school report, and a transfer letter where applicable. Entry assessments may apply for some grades.', category: 'Admissions', sortOrder: 0 },
  { question: 'When does the application window open?', answer: 'Applications for the next intake are open throughout the year, with priority given to early applicants. Visit the Admissions page to apply online.', category: 'Admissions', sortOrder: 1 },
  { question: 'What curriculum do you follow?', answer: 'We follow the ZIMSEC-aligned curriculum from Early Childhood Development (ECD) through to Advanced Level, complemented by a strong co-curricular programme.', category: 'Academics', sortOrder: 2 },
  { question: 'Do you offer boarding facilities?', answer: 'Please contact our admissions office for the latest information on boarding availability, facilities and fees.', category: 'General', sortOrder: 3 },
  { question: 'How are school fees paid?', answer: 'Fees can be paid per term via the accepted payment methods configured by the school. A detailed fee schedule is available on the Admissions page.', category: 'Fees', sortOrder: 4 },
  { question: 'How can I contact the school?', answer: 'You can reach us through the Contact page, by phone, or by email. Our office is open during regular school hours on weekdays.', category: 'General', sortOrder: 5 },
]

async function main() {
  const school = await db.school.findFirst()
  if (!school) { console.error('No school record found.'); process.exit(1) }

  const existing = await db.faq.count({ where: { schoolId: school.id } })
  if (existing === 0) {
    await db.faq.createMany({ data: DEFAULT_FAQS.map((f) => ({ ...f, schoolId: school.id })) })
    console.log(`Seeded ${DEFAULT_FAQS.length} FAQs`)
  } else {
    console.log(`FAQs already present (${existing}) — skipped`)
  }
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
