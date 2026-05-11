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
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.feePayment.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Auto-generate receipt number
    const currentYear = new Date().getFullYear()
    const lastPayment = await db.feePayment.findFirst({
      where: {
        receiptNumber: { startsWith: `RCP${currentYear}` },
      },
      orderBy: { receiptNumber: 'desc' },
    })

    let sequence = 1
    if (lastPayment) {
      const lastSequence = parseInt(lastPayment.receiptNumber.slice(-3))
      sequence = lastSequence + 1
    }

    const receiptNumber = `RCP${currentYear}${sequence.toString().padStart(3, '0')}`

    // Create the payment
    const payment = await db.feePayment.create({
      data: {
        receiptNumber,
        studentId: body.studentId,
        invoiceId: body.invoiceId,
        parentId: body.parentId,
        amount: body.amount,
        paymentMethod: body.paymentMethod || 'CASH',
        currency: body.currency || 'USD',
        exchangeRate: body.exchangeRate || 1,
        reference: body.reference,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    })

    // Update the invoice amounts if invoiceId is provided
    if (body.invoiceId) {
      const invoice = await db.feeInvoice.findUnique({
        where: { id: body.invoiceId },
      })

      if (invoice) {
        const newAmountPaid = invoice.amountPaid + body.amount
        const newBalance = invoice.totalAmount - newAmountPaid
        let newStatus = 'PENDING'
        if (newBalance <= 0) {
          newStatus = 'PAID'
        } else if (newAmountPaid > 0) {
          newStatus = 'PARTIAL'
        }

        await db.feeInvoice.update({
          where: { id: body.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balance: Math.max(0, newBalance),
            status: newStatus,
          },
        })
      }
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}
