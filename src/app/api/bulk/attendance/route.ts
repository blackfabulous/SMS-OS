import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, date, records } = body

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'classId, date, and records array are required' },
        { status: 400 }
      )
    }

    // Validate class exists
    const classData = await db.class.findUnique({
      where: { id: classId },
      include: { grade: true },
    })
    if (!classData) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 })
    }

    // Get the current term
    const currentTerm = await db.term.findFirst({
      where: { isCurrent: true },
    })
    if (!currentTerm) {
      return NextResponse.json({ error: 'No current term found' }, { status: 400 })
    }

    const attendanceDate = new Date(date)
    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    for (const record of records) {
      try {
        if (!record.studentId || !record.status) {
          errors.push(`Invalid record: missing studentId or status`)
          continue
        }

        // Check if attendance record already exists for this student on this date
        const existing = await db.attendance.findFirst({
          where: {
            studentId: record.studentId,
            date: attendanceDate,
            termId: currentTerm.id,
          },
        })

        if (existing) {
          // Update existing record
          await db.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              remarks: record.remarks || existing.remarks,
            },
          })
          updatedCount++
        } else {
          // Create new record
          await db.attendance.create({
            data: {
              studentId: record.studentId,
              termId: currentTerm.id,
              date: attendanceDate,
              status: record.status,
              remarks: record.remarks || null,
              attendanceType: 'DAILY',
            },
          })
          createdCount++
        }
      } catch (err) {
        errors.push(`Failed to process attendance for student ${record.studentId}`)
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${createdCount + updatedCount} attendance record${createdCount + updatedCount !== 1 ? 's' : ''} processed (${createdCount} new, ${updatedCount} updated)`,
    })
  } catch (error) {
    console.error('Bulk attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk attendance' },
      { status: 500 }
    )
  }
}
