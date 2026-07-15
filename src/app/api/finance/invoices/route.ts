import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { requireContext } from '@/server/context'
import { financeStudentScope } from '@/server/finance/scope'
import { CreateInvoiceSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const result = await requireContext()
    if ('error' in result) return result.error
    // Role-aware scope: staff see the whole school; parents/students only their own.
    const scope = await financeStudentScope(result.ctx)
    if (!scope) return ok({ data: [], total: 0, page: 1, totalPages: 0 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const studentId = searchParams.get('studentId') || ''
    const termId = searchParams.get('termId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { ...scope.where }
    if (status) where.status = status
    // Only staff may narrow to an arbitrary student; non-staff are pinned to their own.
    if (scope.staff && studentId) where.studentId = studentId
    if (termId) where.termId = termId

    const [data, total] = await Promise.all([
      db.feeInvoice.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          term: { include: { academicYear: true } },
          items: true,
          payments: {
            include: { parent: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.feeInvoice.count({ where }),
    ])

    return ok({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching invoices')
    return fail('INTERNAL', 'Failed to fetch invoices')
  }
}

export async function POST(request: Request) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error
  const { ctx } = authResult

  try {
    const rawBody = await request.json()

    const parsed = CreateInvoiceSchema.safeParse(rawBody)
    if (!parsed.success) {
      return fail('VALIDATION', 'Validation failed', { details: parsed.error.issues })
    }
    const data = parsed.data

    // Verify student belongs to caller's school
    const student = await db.student.findUnique({
      where: { id: data.studentId, schoolId: ctx.schoolId },
      select: { id: true },
    })
    if (!student) {
      return fail('NOT_FOUND', 'Student not found')
    }

    const currentYear = new Date().getFullYear()
    const lastInvoice = await db.feeInvoice.findFirst({
      where: { schoolId: ctx.schoolId, invoiceNumber: { startsWith: `INV${currentYear}` } },
      orderBy: { invoiceNumber: 'desc' },
    })
    let sequence = 1
    if (lastInvoice) { sequence = parseInt(lastInvoice.invoiceNumber.slice(-3)) + 1 }
    const invoiceNumber = `INV${currentYear}${sequence.toString().padStart(3, '0')}`

    const items = data.items
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    const invoice = await db.feeInvoice.create({
      data: {
        invoiceNumber,
        studentId: data.studentId,
        termId: data.termId,
        schoolId: ctx.schoolId,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            description: item.description,
            amount: item.amount,
            feeType: item.feeType,
            schoolId: ctx.schoolId,
          })),
        },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        items: true,
      },
    })

    logAudit({ action: 'CREATE', entity: 'invoices', entityId: invoice.id, afterValue: invoice }).catch(() => {})
    return ok(invoice, 201)
  } catch (error) {
    logger.error({ err: error }, 'Error creating invoice')
    return fail('INTERNAL', 'Failed to create invoice')
  }
}

export async function PUT(request: Request) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error
  const { ctx } = authResult

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return fail('VALIDATION', 'Invoice ID is required')

    // Verify invoice belongs to a student in the caller's school
    const existing = await db.feeInvoice.findUnique({
      where: { id, student: { schoolId: ctx.schoolId } },
      select: { id: true },
    })
    if (!existing) {
      return fail('NOT_FOUND', 'Invoice not found')
    }

    const invoice = await db.feeInvoice.update({
      where: { id },
      data: { status: updates.status, dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        items: true,
      },
    })

    logAudit({ action: 'UPDATE', entity: 'invoices', entityId: invoice.id, afterValue: invoice }).catch(() => {})
    return ok(invoice)
  } catch (error) {
    logger.error({ err: error }, 'Error updating invoice')
    return fail('INTERNAL', 'Failed to update invoice')
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error
  const { ctx } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return fail('VALIDATION', 'Invoice ID is required')

    const invoice = await db.feeInvoice.findUnique({
      where: { id, student: { schoolId: ctx.schoolId } },
    })
    if (!invoice) return fail('NOT_FOUND', 'Invoice not found')
    if (Number(invoice.amountPaid) > 0) return fail('CONFLICT', 'Cannot delete invoice with payments')

    await db.invoiceItem.deleteMany({ where: { invoiceId: id } })
    await db.feeInvoice.delete({ where: { id } })

    logAudit({ action: 'DELETE', entity: 'invoices', entityId: id }).catch(() => {})
    return ok({ message: 'Invoice deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting invoice')
    return fail('INTERNAL', 'Failed to delete invoice')
  }
}
