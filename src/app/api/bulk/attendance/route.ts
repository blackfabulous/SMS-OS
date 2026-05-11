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

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'Records array cannot be empty' },
        { status: 400 }
      )
    }

    // Validate each record has required fields
    for (let i = 0; i < records.length; i++) {
      if (!records[i].studentId || !records[i].status) {
        return NextResponse.json(
          { error: `Record at index ${i} is missing studentId or status` },
          { status: 400 }
        )
      }
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK']
      if (!validStatuses.includes(records[i].status)) {
        return NextResponse.json(
          { error: `Invalid status '${records[i].status}' at index ${i}. Valid: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate class exists
    const classData = await db.class.findUnique({
      where: { id: classId },
      include: { grade: true },
    })
    if (!classData) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 })
    }

    // Determine the term - find the term that contains the given date
    const attendanceDate = new Date(date)
    let term = await db.term.findFirst({
      where: {
        startDate: { lte: attendanceDate },
        endDate: { gte: attendanceDate },
      },
    })

    if (!term) {
      // Fallback to current term
      term = await db.term.findFirst({
        where: { isCurrent: true },
      })
    }

    if (!term) {
      return NextResponse.json({ error: 'No term found for the given date' }, { status: 400 })
    }

    // Reset date time to start of day for consistent comparison
    const dateOnly = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate())

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (const record of records) {
      try {
        // Check if attendance record already exists for this student on this date in this term
        const existing = await db.attendance.findFirst({
          where: {
            studentId: record.studentId,
            date: dateOnly,
            termId: term.id,
          },
        })

        if (existing) {
          // Update existing record (upsert behavior)
          await db.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              remarks: record.remarks ?? existing.remarks,
            },
          })
          updated++
        } else {
          // Create new record
          await db.attendance.create({
            data: {
              studentId: record.studentId,
              termId: term.id,
              date: dateOnly,
              status: record.status,
              remarks: record.remarks || null,
              attendanceType: 'DAILY',
            },
          })
          created++
        }
      } catch {
        errors.push(`Failed to process attendance for student ${record.studentId}`)
      }
    }

    // Log audit entry
    try {
      await db.auditLog.create({
        data: {
          action: 'BULK_ATTENDANCE',
          entity: 'Attendance',
          details: `Recorded attendance for ${created + updated} students in ${classData.name} on ${dateOnly.toISOString().split('T')[0]}`,
        },
      })
    } catch {
      // Audit log failure should not break the operation
    }

    return NextResponse.json({
      created,
      updated,
      errors: errors.length > 0 ? errors : [],
      message: `${created + updated} attendance record${created + updated !== 1 ? 's' : ''} processed (${created} new, ${updated} updated)`,
    })
  } catch (error) {
    console.error('Bulk attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk attendance' },
      { status: 500 }
    )
  }
}
