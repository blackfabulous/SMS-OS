import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || ''
    const classId = searchParams.get('classId') || ''
    const termId = searchParams.get('termId') || ''

    const where: Record<string, unknown> = {}

    if (date) {
      const targetDate = new Date(date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      where.date = {
        gte: targetDate,
        lt: nextDay,
      }
    }

    if (termId) where.termId = termId

    if (classId) {
      where.student = {
        enrollments: {
          some: {
            classId,
            status: 'ACTIVE',
          },
        },
      }
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: {
                  include: { grade: true },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate summary
    const totalRecords = records.length
    const presentCount = records.filter((r) => r.status === 'PRESENT').length
    const absentCount = records.filter((r) => r.status === 'ABSENT').length
    const lateCount = records.filter((r) => r.status === 'LATE').length
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length

    const summary = {
      total: totalRecords,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      attendanceRate: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0',
    }

    // Group by status
    const byClass: Record<string, { present: number; absent: number; late: number; total: number }> = {}
    for (const record of records) {
      const className = record.student?.enrollments?.[0]?.class?.name || 'Unknown'
      if (!byClass[className]) {
        byClass[className] = { present: 0, absent: 0, late: 0, total: 0 }
      }
      byClass[className].total++
      if (record.status === 'PRESENT') byClass[className].present++
      else if (record.status === 'ABSENT') byClass[className].absent++
      else if (record.status === 'LATE') byClass[className].late++
    }

    return NextResponse.json({
      summary,
      byClass,
      records,
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const records: Array<{
      studentId: string
      termId: string
      date: string
      status: string
      attendanceType?: string
      remarks?: string
    }> = body.records

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'Records array is required' },
        { status: 400 }
      )
    }

    // Create attendance records in bulk
    const created = await db.attendance.createMany({
      data: records.map((record) => ({
        studentId: record.studentId,
        termId: record.termId,
        date: new Date(record.date),
        attendanceType: record.attendanceType || 'DAILY',
        status: record.status || 'PRESENT',
        remarks: record.remarks,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `${created.count} attendance records created`,
      count: created.count,
    }, { status: 201 })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}
