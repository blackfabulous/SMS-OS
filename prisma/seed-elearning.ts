/**
 * Seed sample e-learning data (courses, resources, assignments) for local dev.
 * Idempotent-ish: skips if courses already exist for the school.
 *
 *   npx tsx prisma/seed-elearning.ts
 */
import { PrismaClient, type ResourceType, type AssignmentStatus } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const school = await db.school.findFirst()
  if (!school) {
    console.error('No school found — run the core seed first.')
    process.exit(1)
  }
  const schoolId = school.id

  const existing = await db.course.count({ where: { schoolId } })
  if (existing > 0) {
    console.log(`Courses already present (${existing}) — skipping e-learning seed.`)
    return
  }

  const courses = [
    { name: 'Mathematics', instructor: 'Mr. Hove', enrollmentCount: 42, syllabusCompletion: 68, description: 'O-Level Mathematics covering algebra, geometry, and statistics.' },
    { name: 'English Language', instructor: 'Mrs. Mlambo', enrollmentCount: 48, syllabusCompletion: 72, description: 'O-Level English Language: comprehension and composition.' },
    { name: 'Physics', instructor: 'Mrs. Ncube', enrollmentCount: 28, syllabusCompletion: 45, description: 'O-Level Physics covering mechanics, electricity, and optics.' },
    { name: 'Biology', instructor: 'Mrs. Dube', enrollmentCount: 35, syllabusCompletion: 62, description: 'O-Level Biology: human biology, plants, and ecology.' },
    { name: 'History', instructor: 'Mr. Moyo', enrollmentCount: 40, syllabusCompletion: 78, description: 'Zimbabwe and African history with world history components.' },
  ]

  const created: Record<string, string> = {}
  for (const c of courses) {
    const row = await db.course.create({ data: { schoolId, ...c } })
    created[c.name] = row.id
  }

  const resources = [
    { course: 'Mathematics', title: 'Algebra & Functions — Notes Pack', resourceType: 'NOTES', fileSize: 2_516_582, downloads: 89, uploadedBy: 'Mr. Hove', url: 'https://example.org/maths/algebra-notes.pdf' },
    { course: 'Mathematics', title: 'Quadratic Equations — Video Tutorial', resourceType: 'VIDEO', fileSize: 47_185_920, downloads: 67, uploadedBy: 'Mr. Hove', url: 'https://example.org/maths/quadratics.mp4' },
    { course: 'Mathematics', title: 'ZIMSEC 2024 Maths Paper 1', resourceType: 'PAST_EXAM_PAPER', fileSize: 1_887_437, downloads: 156, uploadedBy: 'Admin', url: 'https://example.org/maths/zimsec-2024-p1.pdf' },
    { course: 'English Language', title: 'Comprehension Skills', resourceType: 'NOTES', fileSize: 3_250_585, downloads: 78, uploadedBy: 'Mrs. Mlambo', url: 'https://example.org/eng/comprehension.pdf' },
    { course: 'Physics', title: "Newton's Laws — Video Series", resourceType: 'VIDEO', fileSize: 125_829_120, downloads: 33, uploadedBy: 'Mrs. Ncube', url: 'https://example.org/physics/newtons-laws.mp4' },
    { course: 'Biology', title: 'Cell Structure Worksheet', resourceType: 'WORKSHEET', fileSize: 838_860, downloads: 25, uploadedBy: 'Mrs. Dube', url: 'https://example.org/bio/cell-worksheet.pdf' },
  ]
  for (const r of resources) {
    await db.courseResource.create({
      data: {
        courseId: created[r.course],
        title: r.title,
        resourceType: r.resourceType as ResourceType,
        url: r.url,
        fileSize: r.fileSize,
        downloads: r.downloads,
        uploadedBy: r.uploadedBy,
      },
    })
  }

  const assignments = [
    { course: 'Mathematics', title: 'Quadratic Equations Test', maxMarks: 100, status: 'OPEN', submissionsCount: 28, avgScore: 62, dueDate: '2026-06-20' },
    { course: 'English Language', title: 'Comprehension Exercise 3', maxMarks: 50, status: 'GRADING', submissionsCount: 45, avgScore: 71, dueDate: '2026-06-18' },
    { course: 'Physics', title: 'Forces & Motion Practical Report', maxMarks: 30, status: 'CLOSED', submissionsCount: 22, avgScore: 58, dueDate: '2026-06-12' },
    { course: 'Biology', title: 'Cell Biology Diagram Test', maxMarks: 40, status: 'OPEN', submissionsCount: 20, avgScore: null, dueDate: '2026-06-22' },
  ]
  for (const a of assignments) {
    await db.courseAssignment.create({
      data: {
        courseId: created[a.course],
        title: a.title,
        maxMarks: a.maxMarks,
        status: a.status as AssignmentStatus,
        submissionsCount: a.submissionsCount,
        avgScore: a.avgScore,
        dueDate: new Date(a.dueDate),
      },
    })
  }

  console.log(`Seeded ${courses.length} courses, ${resources.length} resources, ${assignments.length} assignments.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
