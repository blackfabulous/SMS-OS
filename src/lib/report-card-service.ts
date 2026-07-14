import 'server-only'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { computeFinalMark, symbolForMark, averageMark, markToPercent } from '@/lib/grading'

const EXAM_TYPES = new Set(['EXAM', 'FINAL'])

export interface SubjectResult {
  subjectId: string
  subject: string
  ca: number | null
  exam: number | null
  finalMark: number
  grade: string
}

export interface StudentReportComputation {
  studentId: string
  subjects: SubjectResult[]
  average: number
  overallGrade: string
}

/**
 * Generate (or refresh) report cards for every active student in a class for a
 * term: aggregates assessment marks by subject (CA vs exam weighted per the
 * grading.continuousAssessmentWeight setting), computes each subject's final
 * mark + grade from the grading.scale, the overall average + grade, and the
 * class position (rank by average). Persists to ReportCard.
 *
 * Workflow-safe: on re-generation it updates only the COMPUTED fields and never
 * touches status / comments / signatures, so submitted/published cards keep
 * their state. New cards are created in DRAFT.
 */
export async function generateClassReportCards(
  schoolId: string,
  classId: string,
  termId: string,
): Promise<{ generated: number; results: StudentReportComputation[] }> {
  // Tenant + existence guard.
  const klass = await db.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } })
  if (!klass) throw new Error('Class not found')

  const term = await db.term.findFirst({ where: { id: termId }, select: { id: true } })
  if (!term) throw new Error('Term not found')

  const [scale, caWeight] = await Promise.all([
    getSetting(schoolId, 'grading.scale'),
    getSetting(schoolId, 'grading.continuousAssessmentWeight'),
  ])

  // Active students in the class.
  const enrollments = await db.studentEnrollment.findMany({
    where: { classId, status: 'ACTIVE', student: { schoolId } },
    select: { studentId: true },
  })
  const studentIds = enrollments.map((e) => e.studentId)
  if (studentIds.length === 0) return { generated: 0, results: [] }

  // All marks for these students in this term, in one query (no N+1).
  const marks = await db.assessmentMark.findMany({
    where: { studentId: { in: studentIds }, assessment: { termId, schoolId } },
    select: {
      studentId: true,
      marksObtained: true,
      assessment: { select: { subjectId: true, assessmentType: true, totalMarks: true, subject: { select: { name: true } } } },
    },
  })

  // Group marks: studentId → subjectId → { ca:[], exam:[], name }
  type Bucket = { ca: number[]; exam: number[]; name: string }
  const byStudent = new Map<string, Map<string, Bucket>>()
  for (const m of marks) {
    const pct = markToPercent(m.marksObtained, m.assessment.totalMarks)
    const subjMap = byStudent.get(m.studentId) ?? new Map<string, Bucket>()
    const bucket = subjMap.get(m.assessment.subjectId) ?? { ca: [], exam: [], name: m.assessment.subject.name }
    if (EXAM_TYPES.has(m.assessment.assessmentType)) bucket.exam.push(pct)
    else bucket.ca.push(pct)
    subjMap.set(m.assessment.subjectId, bucket)
    byStudent.set(m.studentId, subjMap)
  }

  // Compute per-student results.
  const computations: StudentReportComputation[] = studentIds.map((studentId) => {
    const subjMap = byStudent.get(studentId) ?? new Map<string, Bucket>()
    const subjects: SubjectResult[] = [...subjMap.entries()].map(([subjectId, b]) => {
      const ca = b.ca.length ? averageMark(b.ca) : null
      const exam = b.exam.length ? averageMark(b.exam) : null
      const finalMark = computeFinalMark({ continuousAssessment: ca, exam, caWeight })
      return { subjectId, subject: b.name, ca, exam, finalMark, grade: symbolForMark(finalMark, scale) }
    })
    const average = averageMark(subjects.map((s) => s.finalMark))
    return { studentId, subjects, average, overallGrade: subjects.length ? symbolForMark(average, scale) : '—' }
  })

  // Class position: rank by average desc (students with no marks rank last).
  const ranked = [...computations].sort((a, b) => b.average - a.average)
  const positionOf = new Map<string, number>()
  ranked.forEach((c, i) => positionOf.set(c.studentId, c.subjects.length ? i + 1 : 0))

  // Persist — preserve workflow state on update.
  await db.$transaction(
    computations.map((c) =>
      db.reportCard.upsert({
        where: { studentId_termId: { studentId: c.studentId, termId } },
        create: {
          schoolId,
          studentId: c.studentId,
          termId,
          classId,
          overallGrade: c.overallGrade,
          overallPosition: positionOf.get(c.studentId) || null,
          status: 'DRAFT',
        },
        update: {
          classId,
          overallGrade: c.overallGrade,
          overallPosition: positionOf.get(c.studentId) || null,
        },
      }),
    ),
  )

  return { generated: computations.length, results: computations }
}
