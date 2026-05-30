import { describe, it, expect } from 'vitest'
import { gradeForMark, symbolForMark, computeFinalMark, averageMark, summariseReport, type GradeBand } from '@/lib/grading'
import { getDefault } from '@/lib/settings-schema'

// Use the real default ZIMSEC scale from the settings registry.
const SCALE = getDefault('grading.scale') as GradeBand[]

describe('gradeForMark (ZIMSEC default scale)', () => {
  it('maps marks to the correct band', () => {
    expect(symbolForMark(90, SCALE)).toBe('A')
    expect(symbolForMark(75, SCALE)).toBe('A') // inclusive lower bound
    expect(symbolForMark(74, SCALE)).toBe('B')
    expect(symbolForMark(50, SCALE)).toBe('C')
    expect(symbolForMark(49, SCALE)).toBe('D')
    expect(symbolForMark(30, SCALE)).toBe('E')
    expect(symbolForMark(29, SCALE)).toBe('U')
    expect(symbolForMark(0, SCALE)).toBe('U')
  })

  it('returns the descriptor with the band', () => {
    expect(gradeForMark(80, SCALE)).toMatchObject({ symbol: 'A', descriptor: 'Distinction' })
  })

  it('clamps out-of-range marks', () => {
    expect(symbolForMark(150, SCALE)).toBe('A')
    expect(symbolForMark(-10, SCALE)).toBe('U')
  })

  it('falls back to the lowest band when no band matches', () => {
    const gappy: GradeBand[] = [{ symbol: 'P', min: 50, max: 100, descriptor: 'Pass' }]
    expect(symbolForMark(20, gappy)).toBe('P') // only band → used as fallback
  })
})

describe('computeFinalMark (CA weighting)', () => {
  it('weights CA and exam (30/70 default)', () => {
    // CA 60 @30% + exam 80 @70% = 18 + 56 = 74
    expect(computeFinalMark({ continuousAssessment: 60, exam: 80, caWeight: 30 })).toBe(74)
  })

  it('uses exam alone at full weight when no CA', () => {
    expect(computeFinalMark({ exam: 65, caWeight: 30 })).toBe(65)
  })

  it('uses CA alone at full weight when no exam (running mark)', () => {
    expect(computeFinalMark({ continuousAssessment: 55, caWeight: 30 })).toBe(55)
  })

  it('returns 0 when nothing is recorded', () => {
    expect(computeFinalMark({ caWeight: 30 })).toBe(0)
  })

  it('respects a different CA weight', () => {
    // CA 50 @50% + exam 90 @50% = 25 + 45 = 70
    expect(computeFinalMark({ continuousAssessment: 50, exam: 90, caWeight: 50 })).toBe(70)
  })
})

describe('averageMark + summariseReport', () => {
  it('averages marks', () => {
    expect(averageMark([60, 70, 80])).toBe(70)
    expect(averageMark([])).toBe(0)
  })

  it('summarises subject results into an overall grade', () => {
    const summary = summariseReport(
      [
        { subject: 'Maths', finalMark: 80, grade: 'A' },
        { subject: 'English', finalMark: 60, grade: 'C' },
      ],
      SCALE,
    )
    expect(summary).toEqual({ average: 70, overallGrade: 'B', subjectCount: 2 })
  })

  it('reports a dash overall grade with no subjects', () => {
    expect(summariseReport([], SCALE).overallGrade).toBe('—')
  })
})
