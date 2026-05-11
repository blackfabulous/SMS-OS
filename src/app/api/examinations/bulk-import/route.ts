import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have a header row and at least one data row' },
        { status: 400 }
      )
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
    const requiredColumns = ['candidatenumber', 'subject', 'grade', 'year', 'level']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}. Expected: candidateNumber, subject, grade, year, level` },
        { status: 400 }
      )
    }

    const colIndex = {
      candidateNumber: headers.indexOf('candidatenumber'),
      subject: headers.indexOf('subject'),
      grade: headers.indexOf('grade'),
      year: headers.indexOf('year'),
      level: headers.indexOf('level'),
    }

    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []
    const resultsMap: Record<string, { subjects: string[]; grades: string[] }> = {}

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))

      const candidateNumber = values[colIndex.candidateNumber] || ''
      const subject = values[colIndex.subject] || ''
      const grade = values[colIndex.grade] || ''
      const year = values[colIndex.year] || ''
      const level = values[colIndex.level] || ''

      if (!candidateNumber || !subject || !grade || !year || !level) {
        errors.push(`Row ${i + 1}: Missing required values`)
        continue
      }

      // Validate grade
      const validGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'U', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      if (!validGrades.includes(grade.toUpperCase())) {
        errors.push(`Row ${i + 1}: Invalid grade "${grade}". Must be one of: ${validGrades.join(', ')}`)
        continue
      }

      // Validate level
      const validLevels = ['O_LEVEL', 'O-LEVEL', 'O LEVEL', 'A_LEVEL', 'A-LEVEL', 'A LEVEL', 'GRADE_7', 'GRADE 7']
      const normalizedLevel = level.toUpperCase().replace(/[\s-]/g, '_')
      if (!validLevels.includes(normalizedLevel)) {
        errors.push(`Row ${i + 1}: Invalid level "${level}". Must be O-Level, A-Level, or Grade 7`)
        continue
      }

      // Track results per candidate
      const key = `${candidateNumber}-${year}-${level}`
      if (!resultsMap[key]) {
        resultsMap[key] = { subjects: [], grades: [] }
      }
      resultsMap[key].subjects.push(subject)
      resultsMap[key].grades.push(grade)
    }

    // Create/update ZimsecCandidate records
    for (const [key, data] of Object.entries(resultsMap)) {
      const [candidateNumber, yearStr, levelRaw] = key.split('-')
      const examYear = parseInt(yearStr)
      const normalizedLevel = levelRaw.replace(/[\s-]/g, '_')

      try {
        // Try to find existing candidate by candidateNumber
        const existing = await db.zimsecCandidate.findFirst({
          where: { candidateNumber },
        })

        if (existing) {
          // Update existing
          await db.zimsecCandidate.update({
            where: { id: existing.id },
            data: {
              subjects: JSON.stringify([...new Set([...(existing.subjects ? JSON.parse(existing.subjects) : []), ...data.subjects])]),
            },
          })
          updatedCount++
        } else {
          // Create new - find a student to link (use first student without existing candidate as fallback)
          const studentWithoutCandidate = await db.student.findFirst({
            where: {
              zimsecCandidate: null,
              enrollmentStatus: 'ACTIVE',
            },
          })

          if (studentWithoutCandidate) {
            await db.zimsecCandidate.create({
              data: {
                studentId: studentWithoutCandidate.id,
                candidateNumber,
                examLevel: normalizedLevel === 'GRADE_7' ? 'GRADE_7' : normalizedLevel === 'A_LEVEL' ? 'A_LEVEL' : 'O_LEVEL',
                examYear,
                registrationStatus: 'REGISTERED',
                subjects: JSON.stringify(data.subjects),
                totalFees: 0,
                feesPaid: 0,
              },
            })
            createdCount++
          } else {
            errors.push(`Candidate ${candidateNumber}: No available student to link`)
          }
        }
      } catch (err) {
        errors.push(`Candidate ${candidateNumber}: Failed to create/update record`)
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
      message: `Import complete: ${createdCount} created, ${updatedCount} updated, ${errors.length} errors`,
    })
  } catch (error) {
    console.error('ZIMSEC bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to process ZIMSEC results import' },
      { status: 500 }
    )
  }
}
