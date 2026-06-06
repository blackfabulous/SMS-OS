import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { getRequestTenant } from '@/lib/tenant'
import { validateRole } from '@/lib/api-auth'
import { CreatePaymentSchema, type CreatePaymentInput } from '@/lib/validations'
import { applyPayment, reversePayment, toBaseAmount } from '@/lib/finance-calc'
import { getSetting } from '@/lib/settings'
import { notifyStudentGuardian } from '@/lib/notifications'

function generateReceiptNumber(year: number): string {
  // Timestamp in base36 + 4 random hex chars = collision-resistant without a DB counter
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')
  return `RCP${year}${ts}${rnd}`
}

// Create the payment and update the linked invoice's balance atomically.
// The payment record stores the original amount/currency/rate (what the payer
// tendered); the invoice balance is reduced by `baseAmount` (converted to the
// invoice/base currency) so multi-currency payments settle correctly.
async function createPaymentTxn(
  receiptNumber: string,
  data: CreatePaymentInput,
  amount: number,
  baseAmount: number,
) {
  return db.$transaction(async (tx) => {
    const newPayment = await tx.feePayment.create({
      data: {
        receiptNumber,
        studentId: data.studentId,
        invoiceId: data.invoiceId || null,
        parentId: data.parentId || null,
        amount,
        paymentMethod: data.paymentMethod || 'CASH',
        currency: data.currency || 'USD',
        exchangeRate: data.exchangeRate || 1,
        reference: data.reference || null,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    })

    if (data.invoiceId) {
      const invoice = await tx.feeInvoice.findUnique({ where: { id: data.invoiceId } })
      if (invoice) {
        await tx.feeInvoice.update({
          where: { id: data.invoiceId },
          data: applyPayment(invoice, baseAmount),
        })
      }
    }

    return newPayment
  })
}

export async function GET(request: Request) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { student: { schoolId } }
    if (studentId) where.studentId = studentId
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      db.feePayment.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          parent: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.feePayment.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const rawBody = await request.json()

    const parsed = CreatePaymentSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
    }
    const data = parsed.data
    const amount = data.amount
    // Convert the tendered amount to the invoice/base currency for balance math.
    const baseAmount = toBaseAmount(amount, data.exchangeRate)

    // Enforce the school's accepted payment methods (settings-driven).
    if (data.paymentMethod) {
      const allowed = await getSetting(session.user.schoolId, 'finance.paymentMethods')
      if (!allowed.includes(data.paymentMethod.toUpperCase() as (typeof allowed)[number])) {
        return NextResponse.json(
          { error: `Payment method "${data.paymentMethod}" is not enabled. Allowed: ${allowed.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Verify student belongs to the caller's school
    const student = await db.student.findUnique({
      where: { id: data.studentId, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Validate amount (in base currency) against invoice balance before any writes
    if (data.invoiceId) {
      const invoice = await db.feeInvoice.findUnique({
        where: { id: data.invoiceId, student: { schoolId: session.user.schoolId } },
      })
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      if (baseAmount > invoice.balance + 0.01) {
        return NextResponse.json(
          { error: `Payment of $${baseAmount.toFixed(2)} (base) exceeds outstanding balance of $${invoice.balance.toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    const year = new Date().getFullYear()

    // Create payment + update invoice atomically. Retry on the (extremely rare)
    // receiptNumber unique-constraint collision with a freshly generated number.
    let payment: Awaited<ReturnType<typeof createPaymentTxn>> | null = null
    const MAX_ATTEMPTS = 5
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        payment = await createPaymentTxn(generateReceiptNumber(year), data, amount, baseAmount)
        break
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code
        if (code === 'P2002' && attempt < MAX_ATTEMPTS) continue // duplicate receipt number — retry
        throw err
      }
    }
    if (!payment) {
      return NextResponse.json({ error: 'Failed to generate a unique receipt number' }, { status: 500 })
    }

    logAudit({ action: 'CREATE', entity: 'payments', entityId: payment.id, afterValue: payment }).catch(() => {})

    // Send a receipt acknowledgement to the guardian (fire-and-forget, original currency).
    const receiptNumber = payment.receiptNumber
    void notifyStudentGuardian(session.user.schoolId, data.studentId, (studentName) => ({
      type: 'payment.received',
      studentName,
      amount,
      currency: data.currency || 'USD',
      receiptNumber,
    })).catch(() => {})

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })

    // Verify the payment belongs to a student in the caller's school
    const existing = await db.feePayment.findUnique({
      where: { id },
      select: { student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const payment = await db.feePayment.update({
      where: { id },
      data: { isReversed: updates.isReversed },
      include: { student: { select: { firstName: true, lastName: true } } },
    })

    logAudit({ action: 'UPDATE', entity: 'payments', entityId: payment.id, afterValue: payment }).catch(() => {})
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const authResult = await validateRole(['ADMIN', 'BURSAR'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })

    // Verify ownership before reversing
    const existing = await db.feePayment.findUnique({
      where: { id },
      select: { isReversed: true, student: { select: { schoolId: true } } },
    })
    if (!existing || existing.student.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    if (existing.isReversed) {
      return NextResponse.json({ error: 'Payment is already reversed' }, { status: 409 })
    }

    // Reverse payment + restore invoice balance in a single transaction
    const result = await db.$transaction(async (tx) => {
      const payment = await tx.feePayment.update({
        where: { id },
        data: { isReversed: true },
      })

      if (payment.invoiceId) {
        const invoice = await tx.feeInvoice.findUnique({ where: { id: payment.invoiceId } })
        if (invoice) {
          await tx.feeInvoice.update({
            where: { id: payment.invoiceId },
            data: reversePayment(invoice, payment.amount),
          })
        }
      }

      return payment
    })

    logAudit({ action: 'DELETE', entity: 'payments', entityId: id }).catch(() => {})
    return NextResponse.json({ message: 'Payment reversed successfully', payment: result })
  } catch (error) {
    console.error('Error reversing payment:', error)
    return NextResponse.json({ error: 'Failed to reverse payment' }, { status: 500 })
  }
}
