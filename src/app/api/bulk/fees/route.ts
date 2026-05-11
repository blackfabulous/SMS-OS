import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gradeId, classId, feeStructureId, dueDate, studentIds } = body

    if (!feeStructureId || !dueDate) {
      return NextResponse.json(
        { error: 'feeStructureId and dueDate are required' },
        { status: 400 }
      )
    }

    if (!gradeId && !classId) {
      return NextResponse.json(
        { error: 'Either gradeId or classId is required' },
        { status: 400 }
      )
    }

    // Validate fee structure
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
    })
    if (!feeStructure) {
      return NextResponse.json({ error: 'Invalid fee structure ID' }, { status: 400 })
    }

    // Get the current term
    const currentTerm = await db.term.findFirst({
      where: { isCurrent: true },
    })

    if (!currentTerm) {
      return NextResponse.json({ error: 'No current term found' }, { status: 400 })
    }

    // Get active students based on grade/class
    const enrollmentWhere: Record<string, unknown> = { status: 'ACTIVE' }
    if (classId) {
      enrollmentWhere.classId = classId
    } else if (gradeId) {
      enrollmentWhere.class = { gradeId: gradeId }
    }

    if (studentIds && studentIds.length > 0) {
      enrollmentWhere.studentId = { in: studentIds }
    }

    const enrollments = await db.studentEnrollment.findMany({
      where: enrollmentWhere,
      include: { student: true },
      distinct: ['studentId'],
    })

    if (enrollments.length === 0) {
      return NextResponse.json(
        { error: 'No active students found for the selected criteria' },
        { status: 400 }
      )
    }

    // Get the last invoice number for generating the next one
    const lastInvoice = await db.feeInvoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    })

    let invoiceCounter = 1
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/)
      if (match) {
        invoiceCounter = parseInt(match[1]) + 1
      }
    }

    // Create invoices for each student
    let createdCount = 0
    const errors: string[] = []

    for (const enrollment of enrollments) {
      try {
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCounter).padStart(4, '0')}`
        invoiceCounter++

        await db.feeInvoice.create({
          data: {
            studentId: enrollment.studentId,
            termId: currentTerm.id,
            invoiceNumber,
            totalAmount: feeStructure.amount,
            amountPaid: 0,
            balance: feeStructure.amount,
            dueDate: new Date(dueDate),
            status: 'PENDING',
            items: {
              create: {
                description: feeStructure.name,
                amount: feeStructure.amount,
                feeType: feeStructure.feeType,
              },
            },
          },
        })

        createdCount++
      } catch (err) {
        errors.push(
          `Failed to create invoice for ${enrollment.student.firstName} ${enrollment.student.lastName}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${createdCount} invoice${createdCount !== 1 ? 's' : ''} created for ${feeStructure.name}`,
    })
  } catch (error) {
    console.error('Bulk fee assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk fee assignment' },
      { status: 500 }
    )
  }
}
