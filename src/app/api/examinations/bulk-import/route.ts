import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'

// ─── ZIMSEC Bulk Import - Results Endpoint ───────────────────────────────────
// Accepts bulk ZIMSEC results and creates/updates candidate records.
// Supports both JSON and CSV file upload formats.

interface ZimsecResultEntry {
  studentNumber: string
  subject: string
  grade: string
  marks?: number
  year: number
  level: 'O-Level' | 'A-Level'
  session?: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; studentNumber: string; error: string }>
}

// ─── POST: Bulk Import ZIMSEC Results ───────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const contentType = request.headers.get('content-type') || ''

    let results: ZimsecResultEntry[] = []

    // Handle JSON body (direct API call)
    if (contentType.includes('application/json')) {
      const body = await request.json()

      if (body.results && Array.isArray(body.results)) {
        results = body.results
      } else if (Array.isArray(body)) {
        results = body
      } else {
        logAudit({ action: 'CREATE', entity: 'bulk-import' }).catch(() => {})
        return fail('VALIDATION', 'Expected { results: [...] } or an array of result entries')
      }
    } else {
      // Handle form data (CSV file upload)
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        logAudit({ action: 'CREATE', entity: 'bulk-import' }).catch(() => {})
        return fail('VALIDATION', 'No file uploaded. Please upload a CSV file or send JSON data.')
      }

      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())

      if (lines.length < 2) {
        logAudit({ action: 'CREATE', entity: 'bulk-import' }).catch(() => {})
        return fail('VALIDATION', 'CSV file must have a header row and at least one data row')
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())

      const colIndex = {
        studentNumber: headers.indexOf('studentnumber'),
        subject: headers.indexOf('subject'),
        grade: headers.indexOf('grade'),
        marks: headers.indexOf('marks'),
        year: headers.indexOf('year'),
        level: headers.indexOf('level'),
        session: headers.indexOf('session'),
      }

      if (colIndex.studentNumber === -1 || colIndex.subject === -1 || colIndex.grade === -1 || colIndex.year === -1 || colIndex.level === -1) {
        logAudit({ action: 'CREATE', entity: 'bulk-import' }).catch(() => {})
        return fail('VALIDATION', 'Missing required columns. Expected: studentNumber, subject, grade, marks, year, level, session')
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))

        const studentNumber = values[colIndex.studentNumber] || ''
        const subject = values[colIndex.subject] || ''
        const gradeVal = values[colIndex.grade] || ''
        const marksVal = colIndex.marks !== -1 ? parseFloat(values[colIndex.marks]) : undefined
        const yearVal = parseInt(values[colIndex.year]) || 0
        const levelVal = values[colIndex.level] || ''
        const sessionVal = colIndex.session !== -1 ? values[colIndex.session] : undefined

        if (!studentNumber || !subject || !gradeVal || !yearVal || !levelVal) {
          continue // Skip invalid rows silently for CSV import
        }

        // Normalize level
        const normalizedLevel = levelVal.toUpperCase().includes('A') ? 'A-Level' : 'O-Level'

        results.push({
          studentNumber,
          subject,
          grade: gradeVal,
          marks: isNaN(marksVal as number) ? undefined : marksVal,
          year: yearVal,
          level: normalizedLevel as 'O-Level' | 'A-Level',
          session: sessionVal || undefined,
        })
      }
    }

    if (results.length === 0) {
      logAudit({ action: 'CREATE', entity: 'bulk-import' }).catch(() => {})
      return fail('VALIDATION', 'No valid result entries provided')
    }

    // Process results
    const importResult: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    }

    // Validate grades
    const validGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'U', '1', '2', '3', '4', '5', '6', '7', '8', '9']

    // Group results by student for efficient processing
    const resultsByStudent = new Map<string, ZimsecResultEntry[]>()
    for (const entry of results) {
      if (!resultsByStudent.has(entry.studentNumber)) {
        resultsByStudent.set(entry.studentNumber, [])
      }
      resultsByStudent.get(entry.studentNumber)!.push(entry)
    }

    for (const [studentNumber, studentResults] of resultsByStudent) {
      try {
        // Find student by studentNumber
        const student = await db.student.findFirst({
          where: { studentNumber, schoolId },
        })

        if (!student) {
          importResult.errors.push({
            row: 0,
            studentNumber,
            error: `Student with number "${studentNumber}" not found`,
          })
          importResult.skipped += studentResults.length
          continue
        }

        // Validate all grades for this student
        const invalidGrades = studentResults.filter(
          r => !validGrades.includes(r.grade.toUpperCase())
        )
        if (invalidGrades.length > 0) {
          importResult.errors.push({
            row: 0,
            studentNumber,
            error: `Invalid grades: ${invalidGrades.map(g => g.grade).join(', ')}. Must be one of: ${validGrades.join(', ')}`,
          })
          importResult.skipped += invalidGrades.length
        }

        const validResults = studentResults.filter(
          r => validGrades.includes(r.grade.toUpperCase())
        )

        if (validResults.length === 0) {
          continue
        }

        // Determine exam level and year from results
        const firstResult = validResults[0]
        const examLevel = firstResult.level.toUpperCase().includes('A') ? 'A_LEVEL' : 'O_LEVEL'
        const examYear = firstResult.year

        // Create or update ZimsecCandidate
        const existingCandidate = await db.zimsecCandidate.findFirst({
          where: {
            studentId: student.id,
            examYear,
          },
        })

        // Build subjects list from valid results
        const subjectsData = validResults.map(r => ({
          subject: r.subject,
          grade: r.grade.toUpperCase(),
          marks: r.marks,
          session: r.session,
        }))

        if (existingCandidate) {
          // Update existing candidate - merge subjects
          const existingSubjects = existingCandidate.subjects
            ? JSON.parse(existingCandidate.subjects)
            : []

          const mergedSubjects = [...existingSubjects]
          for (const newSubject of subjectsData) {
            const existingIdx = mergedSubjects.findIndex(
              (s: { subject: string }) => s.subject === newSubject.subject
            )
            if (existingIdx >= 0) {
              mergedSubjects[existingIdx] = newSubject
            } else {
              mergedSubjects.push(newSubject)
            }
          }

          await db.zimsecCandidate.update({
            where: { id: existingCandidate.id },
            data: {
              subjects: JSON.stringify(mergedSubjects),
              registrationStatus: 'REGISTERED',
            },
          })

          importResult.imported += validResults.length
        } else {
          // Create new ZimsecCandidate
          await db.zimsecCandidate.create({
            data: {
              schoolId,
              studentId: student.id,
              centreNumber: student.schoolId ? 'CN-001' : null,
              candidateNumber: `C-${studentNumber}`,
              examLevel,
              examYear,
              registrationStatus: 'REGISTERED',
              subjects: JSON.stringify(subjectsData),
              totalFees: 0,
              feesPaid: 0,
            },
          })

          importResult.imported += validResults.length
        }

        // Also create assessment marks for each subject result
        for (const result of validResults) {
          try {
            // Find the subject
            const subject = await db.subject.findFirst({
              where: { name: { contains: result.subject, mode: 'insensitive' } },
            })

            if (subject) {
              // Find current term
              const currentTerm = await db.term.findFirst({
                where: { isCurrent: true },
                orderBy: { createdAt: 'desc' },
              })

              if (currentTerm) {
                // Check if assessment already exists for this subject/term
                const existingAssessment = await db.assessment.findFirst({
                  where: {
                    subjectId: subject.id,
                    termId: currentTerm.id,
                    name: { contains: 'ZIMSEC', mode: 'insensitive' },
                  },
                })

                if (existingAssessment) {
                  // Upsert the mark
                  const numericMarks = result.marks || (
                    result.grade === 'A*' ? 95 : result.grade === 'A' ? 85 :
                    result.grade === 'B' ? 75 : result.grade === 'C' ? 65 :
                    result.grade === 'D' ? 55 : result.grade === 'E' ? 45 :
                    result.grade === 'U' ? 25 : parseInt(result.grade) * 10 || 50
                  )

                  await db.assessmentMark.upsert({
                    where: {
                      assessmentId_studentId: {
                        assessmentId: existingAssessment.id,
                        studentId: student.id,
                      },
                    },
                    create: {
                      schoolId,
                      assessmentId: existingAssessment.id,
                      studentId: student.id,
                      marksObtained: numericMarks,
                      grade: result.grade.toUpperCase(),
                    },
                    update: {
                      marksObtained: numericMarks,
                      grade: result.grade.toUpperCase(),
                    },
                  })
                }
              }
            }
          } catch {
            // Skip assessment mark creation errors silently
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        importResult.errors.push({
          row: 0,
          studentNumber,
          error: `Failed to process: ${errorMessage}`,
        })
        importResult.skipped += studentResults.length
      }
    }

    logAudit({ action: 'CREATE', entity: 'bulk-import' }).catch(() => {})
    return ok({
      success: true,
      imported: importResult.imported,
      skipped: importResult.skipped,
      errors: importResult.errors.slice(0, 50),
      message: `Import complete: ${importResult.imported} results imported, ${importResult.skipped} skipped, ${importResult.errors.length} errors`,
    })
  } catch (error) {
    logger.error({ err: error }, 'ZIMSEC bulk import error')
    return fail('INTERNAL', 'Failed to process ZIMSEC results import')
  }
}
