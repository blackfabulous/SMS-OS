// Pure ZIMSEC-style grading logic — no DB/IO, fully unit-testable.
// The grading scale + CA weighting come from the settings registry
// (`grading.scale`, `grading.continuousAssessmentWeight`).

export interface GradeBand {
  symbol: string
  min: number
  max: number
  descriptor: string
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Clamp a mark into the 0–100 range. */
function clampMark(mark: number): number {
  if (Number.isNaN(mark)) return 0
  return Math.max(0, Math.min(100, mark))
}

/**
 * Resolve the grade band for a percentage mark. Bands are inclusive of both
 * bounds. Falls back to the lowest-min band (e.g. "U") if no band matches.
 */
export function gradeForMark(mark: number, scale: GradeBand[]): GradeBand {
  const m = clampMark(mark)
  const band = scale.find((b) => m >= b.min && m <= b.max)
  if (band) return band
  // No exact band → return the one with the lowest minimum (the "fail" band).
  return [...scale].sort((a, b) => a.min - b.min)[0] ?? { symbol: 'U', min: 0, max: 0, descriptor: 'Ungraded' }
}

/** Convenience: just the grade symbol for a mark. */
export function symbolForMark(mark: number, scale: GradeBand[]): string {
  return gradeForMark(mark, scale).symbol
}

export interface FinalMarkInput {
  /** Continuous-assessment mark (tests/assignments), 0–100, or null if none. */
  continuousAssessment?: number | null
  /** Exam mark, 0–100, or null if none. */
  exam?: number | null
  /** CA weight as a percentage (0–100); exam takes the remainder. */
  caWeight: number
}

/**
 * Weighted final mark = CA·caWeight% + exam·(100−caWeight)%.
 * If only one component is present, it is used at full weight (so a term with
 * no exam yet still produces a sensible running mark).
 */
export function computeFinalMark({ continuousAssessment, exam, caWeight }: FinalMarkInput): number {
  const w = Math.max(0, Math.min(100, caWeight))
  const examWeight = 100 - w
  const hasCa = continuousAssessment != null && !Number.isNaN(continuousAssessment)
  const hasExam = exam != null && !Number.isNaN(exam)

  if (hasCa && hasExam) {
    return round2((clampMark(continuousAssessment!) * w) / 100 + (clampMark(exam!) * examWeight) / 100)
  }
  if (hasExam) return round2(clampMark(exam!))
  if (hasCa) return round2(clampMark(continuousAssessment!))
  return 0
}

/** Mean of a set of marks, rounded to 2dp (0 for an empty set). */
export function averageMark(marks: number[]): number {
  if (marks.length === 0) return 0
  return round2(marks.reduce((s, m) => s + m, 0) / marks.length)
}

export interface SubjectResult {
  subject: string
  finalMark: number
  grade: string
}

export interface ReportSummary {
  average: number
  overallGrade: string
  subjectCount: number
}

/** Aggregate per-subject results into an overall average + grade. */
export function summariseReport(results: SubjectResult[], scale: GradeBand[]): ReportSummary {
  const average = averageMark(results.map((r) => r.finalMark))
  return {
    average,
    overallGrade: results.length > 0 ? symbolForMark(average, scale) : '—',
    subjectCount: results.length,
  }
}
