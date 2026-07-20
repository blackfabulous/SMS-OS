import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

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

export async function listExaminationCandidates(schoolId: string, filters: { examLevel?: string; year?: string; registrationStatus?: string; page: number; limit: number }) {
  const where: Record<string, unknown> = { student: { schoolId } }
  if (filters.examLevel) where.examLevel = filters.examLevel
  if (filters.year) where.examYear = parseInt(filters.year)
  if (filters.registrationStatus) where.registrationStatus = filters.registrationStatus

  const [candidates, total] = await Promise.all([
    db.zimsecCandidate.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true, dateOfBirth: true,
            enrollments: { where: { status: 'ACTIVE' as any }, take: 1, include: { class: { include: { grade: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    db.zimsecCandidate.count({ where }),
  ])

  const allCandidates = await db.zimsecCandidate.findMany({ where })
  const stats = {
    totalCandidates: allCandidates.length,
    grade7Count: allCandidates.filter((c) => c.examLevel === 'GRADE_7').length,
    oLevelCount: allCandidates.filter((c) => c.examLevel === 'O_LEVEL').length,
    aLevelCount: allCandidates.filter((c) => c.examLevel === 'A_LEVEL').length,
    registeredCount: allCandidates.filter((c) => c.registrationStatus === 'REGISTERED').length,
    pendingCount: allCandidates.filter((c) => c.registrationStatus === 'PENDING').length,
    confirmedCount: allCandidates.filter((c) => c.registrationStatus === 'CONFIRMED').length,
    registrationProgress: allCandidates.length > 0
      ? Math.round(((allCandidates.filter((c) => c.registrationStatus === 'REGISTERED' || c.registrationStatus === 'CONFIRMED').length) / allCandidates.length) * 100)
      : 0,
  }

  return { data: candidates, total, page: filters.page, totalPages: Math.ceil(total / filters.limit), stats }
}

export async function registerCandidate(schoolId: string, body: any) {
  const ownStudent = await db.student.findFirst({ where: { id: body.studentId, schoolId }, select: { id: true } })
  if (!ownStudent) throw new AppError('NOT_FOUND', 'Student not found')

  const year = body.examYear || new Date().getFullYear()
  const existing = await db.zimsecCandidate.findFirst({
    where: { studentId: body.studentId, examYear: year, student: { schoolId } },
  })
  if (existing) throw new AppError('CONFLICT', 'Candidate already registered for this exam year', { duplicate: true })

  const school = await db.school.findUnique({ where: { id: schoolId } })
  const centreNumber = school?.zimsecCentreNumber || ''
  const existingCount = await db.zimsecCandidate.count({ where: { examYear: year, student: { schoolId } } })
  const candidateNumber = `${centreNumber}/${String(existingCount + 1).padStart(4, '0')}`

  const candidate = await db.zimsecCandidate.create({
    data: {
      schoolId,
      studentId: body.studentId,
      centreNumber,
      candidateNumber,
      examLevel: body.examLevel || 'O_LEVEL',
      examYear: year,
      registrationStatus: 'PENDING',
      subjects: body.subjects || null,
      totalFees: (body.totalFees || 0) as any,
      feesPaid: 0 as any,
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
  })

  logAudit({ action: 'CREATE', entity: 'examinations', entityId: candidate.id, schoolId, afterValue: candidate }).catch(() => {})
  return candidate
}

export async function updateCandidate(schoolId: string, id: string, body: any) {
  const owned = await db.zimsecCandidate.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Candidate not found')

  const { id: _, ...updates } = body
  const candidate = await db.zimsecCandidate.update({
    where: { id },
    data: {
      registrationStatus: updates.registrationStatus,
      subjects: updates.subjects,
      totalFees: updates.totalFees,
      feesPaid: updates.feesPaid,
      examLevel: updates.examLevel,
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
  })

  logAudit({ action: 'UPDATE', entity: 'examinations', entityId: candidate.id, schoolId, afterValue: candidate }).catch(() => {})
  return candidate
}

export async function deleteCandidate(schoolId: string, id: string) {
  const owned = await db.zimsecCandidate.findFirst({ where: { id, student: { schoolId } }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Candidate not found')

  await db.zimsecCandidate.delete({ where: { id } })
  logAudit({ action: 'DELETE', entity: 'examinations', entityId: id, schoolId }).catch(() => {})
  return { message: 'Candidate registration deleted successfully' }
}

export async function importZimsecResults(request: Request, schoolId: string): Promise<ImportResult> {
  const contentType = request.headers.get('content-type') || ''
  let results: ZimsecResultEntry[] = []

  if (contentType.includes('application/json')) {
    const body = await request.json()
    if (body.results && Array.isArray(body.results)) results = body.results
    else if (Array.isArray(body)) results = body
    else throw new AppError('VALIDATION', 'Expected { results: [...] } or an array of result entries')
  } else {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) throw new AppError('VALIDATION', 'No file uploaded. Please upload a CSV file or send JSON data.')

    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) throw new AppError('VALIDATION', 'CSV file must have a header row and at least one data row')

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, '').toLowerCase())
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
      throw new AppError('VALIDATION', 'Missing required columns. Expected: studentNumber, subject, grade, marks, year, level, session')
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
      const studentNumber = values[colIndex.studentNumber] || ''
      const subject = values[colIndex.subject] || ''
      const gradeVal = values[colIndex.grade] || ''
      const marksVal = colIndex.marks !== -1 ? parseFloat(values[colIndex.marks]) : undefined
      const yearVal = parseInt(values[colIndex.year]) || 0
      const levelVal = values[colIndex.level] || ''
      const sessionVal = colIndex.session !== -1 ? values[colIndex.session] : undefined

      if (!studentNumber || !subject || !gradeVal || !yearVal || !levelVal) continue

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

  if (results.length === 0) throw new AppError('VALIDATION', 'No valid result entries provided')

  const importResult: ImportResult = { imported: 0, skipped: 0, errors: [] }
  const validGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'U', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  const resultsByStudent = new Map<string, ZimsecResultEntry[]>()
  for (const entry of results) {
    if (!resultsByStudent.has(entry.studentNumber)) resultsByStudent.set(entry.studentNumber, [])
    resultsByStudent.get(entry.studentNumber)!.push(entry)
  }

  for (const [studentNumber, studentResults] of resultsByStudent) {
    try {
      const student = await db.student.findFirst({ where: { studentNumber, schoolId } })
      if (!student) {
        importResult.errors.push({ row: 0, studentNumber, error: `Student with number "${studentNumber}" not found` })
        importResult.skipped += studentResults.length
        continue
      }

      const invalidGrades = studentResults.filter((r) => !validGrades.includes(r.grade.toUpperCase()))
      if (invalidGrades.length > 0) {
        importResult.errors.push({ row: 0, studentNumber, error: `Invalid grades: ${invalidGrades.map((g) => g.grade).join(', ')}. Must be one of: ${validGrades.join(', ')}` })
        importResult.skipped += invalidGrades.length
      }

      const validResults = studentResults.filter((r) => validGrades.includes(r.grade.toUpperCase()))
      if (validResults.length === 0) continue

      const firstResult = validResults[0]
      const examLevel = firstResult.level.toUpperCase().includes('A') ? 'A_LEVEL' : 'O_LEVEL'
      const examYear = firstResult.year

      const existingCandidate = await db.zimsecCandidate.findFirst({ where: { studentId: student.id, examYear } })
      const subjectsData = validResults.map((r) => ({ subject: r.subject, grade: r.grade.toUpperCase(), marks: r.marks, session: r.session }))

      if (existingCandidate) {
        const existingSubjects = existingCandidate.subjects ? JSON.parse(existingCandidate.subjects) : []
        const mergedSubjects = [...existingSubjects]
        for (const newSubject of subjectsData) {
          const existingIdx = mergedSubjects.findIndex((s: { subject: string }) => s.subject === newSubject.subject)
          if (existingIdx >= 0) mergedSubjects[existingIdx] = newSubject
          else mergedSubjects.push(newSubject)
        }

        await db.zimsecCandidate.update({
          where: { id: existingCandidate.id },
          data: { subjects: JSON.stringify(mergedSubjects), registrationStatus: 'REGISTERED' as any },
        })
        importResult.imported += validResults.length
      } else {
        await db.zimsecCandidate.create({
          data: {
            schoolId,
            studentId: student.id,
            centreNumber: student.schoolId ? 'CN-001' : null,
            candidateNumber: `C-${studentNumber}`,
            examLevel,
            examYear,
            registrationStatus: 'REGISTERED' as any,
            subjects: JSON.stringify(subjectsData),
            totalFees: 0 as any,
            feesPaid: 0 as any,
          },
        })
        importResult.imported += validResults.length
      }

      for (const result of validResults) {
        try {
          const subject = await db.subject.findFirst({ where: { name: { contains: result.subject, mode: 'insensitive' }, schoolId } })
          if (subject) {
            const currentTerm = await db.term.findFirst({ where: { isCurrent: true, schoolId }, orderBy: { createdAt: 'desc' } })
            if (currentTerm) {
              const existingAssessment = await db.assessment.findFirst({
                where: { subjectId: subject.id, termId: currentTerm.id, name: { contains: 'ZIMSEC', mode: 'insensitive' }, schoolId },
              })

              if (existingAssessment) {
                const numericMarks =
                  result.marks ||
                  (result.grade === 'A*' ? 95 : result.grade === 'A' ? 85 : result.grade === 'B' ? 75 : result.grade === 'C' ? 65 : result.grade === 'D' ? 55 : result.grade === 'E' ? 45 : result.grade === 'U' ? 25 : parseInt(result.grade) * 10 || 50)

                await db.assessmentMark.upsert({
                  where: { assessmentId_studentId: { assessmentId: existingAssessment.id, studentId: student.id } },
                  create: { schoolId, assessmentId: existingAssessment.id, studentId: student.id, marksObtained: numericMarks, grade: result.grade.toUpperCase() },
                  update: { marksObtained: numericMarks, grade: result.grade.toUpperCase() },
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
      importResult.errors.push({ row: 0, studentNumber, error: `Failed to process: ${errorMessage}` })
      importResult.skipped += studentResults.length
    }
  }

  return importResult
}

export function handleExaminationsError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
