import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateRole } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { feeStructureId, gradeIds, classIds, studentIds, academicYearId, termId } = body

    if (!feeStructureId) {
      return NextResponse.json(
        { error: 'feeStructureId is required' },
        { status: 400 }
      )
    }

    if (!gradeIds && !classIds && !studentIds) {
      return NextResponse.json(
        { error: 'At least one of gradeIds, classIds, or studentIds is required' },
        { status: 400 }
      )
    }

    // Validate fee structure
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: { grade: true },
    })
    if (!feeStructure) {
      return NextResponse.json({ error: 'Invalid fee structure ID' }, { status: 400 })
    }

    // Determine the term to use
    let targetTermId = termId
    if (!targetTermId) {
      const currentTerm = await db.term.findFirst({
        where: { isCurrent: true },
      })
      if (!currentTerm) {
        return NextResponse.json({ error: 'No current term found. Provide termId.' }, { status: 400 })
      }
      targetTermId = currentTerm.id
    }

    // Validate the term exists
    const term = await db.term.findUnique({ where: { id: targetTermId } })
    if (!term) {
      return NextResponse.json({ error: 'Invalid term ID' }, { status: 400 })
    }

    // Build the enrollment query to find matching students
    const enrollmentWhere: Record<string, unknown> = { status: 'ACTIVE' }

    if (studentIds && studentIds.length > 0) {
      // Specific student IDs take priority
      enrollmentWhere.studentId = { in: studentIds }
    } else if (classIds && classIds.length > 0) {
      // Filter by specific class IDs
      enrollmentWhere.classId = { in: classIds }
    } else if (gradeIds && gradeIds.length > 0) {
      // Filter by grade IDs
      enrollmentWhere.class = { gradeId: { in: gradeIds } }
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
    let created = 0
    let skipped = 0
    let totalAmount = 0
    const errors: string[] = []

    for (const enrollment of enrollments) {
      try {
        // Check if student already has a pending/paid invoice for this fee structure in this term
        const existingInvoice = await db.feeInvoice.findFirst({
          where: {
            studentId: enrollment.studentId,
            termId: targetTermId,
            items: {
              some: {
                feeType: feeStructure.feeType,
                description: feeStructure.name,
              },
            },
          },
        })

        if (existingInvoice) {
          skipped++
          continue
        }

        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCounter).padStart(4, '0')}`
        invoiceCounter++

        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30) // Default 30-day due date

        await db.feeInvoice.create({
          data: {
            studentId: enrollment.studentId,
            termId: targetTermId,
            invoiceNumber,
            totalAmount: feeStructure.amount,
            amountPaid: 0,
            balance: feeStructure.amount,
            dueDate,
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

        created++
        totalAmount += feeStructure.amount
      } catch {
        errors.push(
          `Failed to create invoice for ${enrollment.student.firstName} ${enrollment.student.lastName}`
        )
      }
    }

    // Log audit entry
    try {
      await db.auditLog.create({
        data: {
          action: 'BULK_FEE_ASSIGNMENT',
          entity: 'FeeInvoice',
          details: `Assigned ${feeStructure.name} (${feeStructure.feeType}) to ${created} students. Total: $${totalAmount.toFixed(2)}`,
        },
      })
    } catch {
      // Audit log failure should not break the operation
    }

    return NextResponse.json({
      created,
      skipped,
      totalAmount,
      errors: errors.length > 0 ? errors : [],
      message: `${created} invoice${created !== 1 ? 's' : ''} created for ${feeStructure.name}, ${skipped} skipped (already invoiced). Total: $${totalAmount.toFixed(2)}`,
    })
  } catch (error) {
    console.error('Bulk fee assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk fee assignment' },
      { status: 500 }
    )
  }
}
