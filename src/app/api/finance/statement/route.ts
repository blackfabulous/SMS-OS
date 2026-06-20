import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireContext } from '@/server/context'
import { buildStatement } from '@/lib/statement'

/**
 * GET /api/finance/statement?studentId=...
 * Returns a chronological fee statement (invoices vs payments, running balance)
 * for a student. Tenant-scoped. ADMIN/BURSAR/TEACHER.
 */
export async function GET(request: Request) {
  const result = await requireContext({ roles: ['ADMIN', 'BURSAR', 'TEACHER', 'SUPER_ADMIN'] })
  if ('error' in result) return result.error
  const { ctx } = result

  const studentId = new URL(request.url).searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId is required' }, { status: 400 })

  const student = await db.student.findFirst({
    where: { id: studentId, schoolId: ctx.schoolId },
    select: { id: true, firstName: true, lastName: true, studentNumber: true },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const [invoices, payments] = await Promise.all([
    db.feeInvoice.findMany({
      where: { studentId },
      select: { invoiceNumber: true, createdAt: true, totalAmount: true },
    }),
    db.feePayment.findMany({
      where: { studentId },
      select: { receiptNumber: true, createdAt: true, amount: true, currency: true, exchangeRate: true, paymentMethod: true, isReversed: true },
    }),
  ])

  const statement = buildStatement(invoices, payments)

  return NextResponse.json({
    student: { id: student.id, name: `${student.firstName} ${student.lastName}`, studentNumber: student.studentNumber },
    statement,
  })
}
