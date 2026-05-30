import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSchool, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../../_components/page-hero'
import { ApplyForm } from './apply-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `Apply for Admission — ${name}`,
    description: `Submit your online application to ${name}. It only takes a few minutes.`,
  }
}

export default async function ApplyPage() {
  const school = await getSchool()
  const grades = school
    ? await db.grade.findMany({
        where: { schoolId: school.id, isActive: true },
        orderBy: { sequence: 'asc' },
        select: { name: true },
      })
    : []
  const gradeOptions = grades.map((g) => g.name)

  return (
    <>
      <PageHero
        eyebrow="Online application"
        title="Apply for Admission"
        subtitle="Complete the secure form below. Fields marked with an asterisk (*) are required."
        crumbs={[{ label: 'Admissions', href: '/admissions' }, { label: 'Apply' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ApplyForm gradeOptions={gradeOptions} />
      </div>
    </>
  )
}
