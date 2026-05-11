import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
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
  try {
    const body = await request.json()
    const currentYear = new Date().getFullYear()
    const lastPayment = await db.feePayment.findFirst({
      where: { receiptNumber: { startsWith: `RCP${currentYear}` } },
      orderBy: { receiptNumber: 'desc' },
    })
    let sequence = 1
    if (lastPayment) { sequence = parseInt(lastPayment.receiptNumber.slice(-3)) + 1 }
    const receiptNumber = `RCP${currentYear}${sequence.toString().padStart(3, '0')}`

    const payment = await db.feePayment.create({
      data: {
        receiptNumber, studentId: body.studentId, invoiceId: body.invoiceId,
        parentId: body.parentId, amount: body.amount,
        paymentMethod: body.paymentMethod || 'CASH', currency: body.currency || 'USD',
        exchangeRate: body.exchangeRate || 1, reference: body.reference,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    })

    if (body.invoiceId) {
      const invoice = await db.feeInvoice.findUnique({ where: { id: body.invoiceId } })
      if (invoice) {
        const newAmountPaid = invoice.amountPaid + body.amount
        const newBalance = invoice.totalAmount - newAmountPaid
        let newStatus = 'PENDING'
        if (newBalance <= 0) newStatus = 'PAID'
        else if (newAmountPaid > 0) newStatus = 'PARTIAL'

        await db.feeInvoice.update({
          where: { id: body.invoiceId },
          data: { amountPaid: newAmountPaid, balance: Math.max(0, newBalance), status: newStatus },
        })
      }
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })

    const payment = await db.feePayment.update({
      where: { id },
      data: { isReversed: updates.isReversed },
      include: { student: { select: { firstName: true, lastName: true } } },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })

    // Soft delete - reverse the payment
    const payment = await db.feePayment.update({
      where: { id },
      data: { isReversed: true },
    })

    // Reverse invoice update
    if (payment.invoiceId) {
      const invoice = await db.feeInvoice.findUnique({ where: { id: payment.invoiceId } })
      if (invoice) {
        const newAmountPaid = Math.max(0, invoice.amountPaid - payment.amount)
        const newBalance = invoice.totalAmount - newAmountPaid
        let newStatus = 'PENDING'
        if (newAmountPaid <= 0) newStatus = 'PENDING'
        else if (newBalance > 0) newStatus = 'PARTIAL'
        else newStatus = 'PAID'

        await db.feeInvoice.update({
          where: { id: payment.invoiceId },
          data: { amountPaid: newAmountPaid, balance: Math.max(0, newBalance), status: newStatus },
        })
      }
    }

    return NextResponse.json({ message: 'Payment reversed successfully', payment })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Failed to reverse payment' }, { status: 500 })
  }
}
