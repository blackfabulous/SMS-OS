import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const studentId = searchParams.get('studentId') || ''
    const termId = searchParams.get('termId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (studentId) where.studentId = studentId
    if (termId) where.termId = termId

    const [data, total] = await Promise.all([
      db.feeInvoice.findMany({
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
          term: {
            include: { academicYear: true },
          },
          items: true,
          payments: {
            include: {
              parent: {
                select: { firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.feeInvoice.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Auto-generate invoice number
    const currentYear = new Date().getFullYear()
    const lastInvoice = await db.feeInvoice.findFirst({
      where: {
        invoiceNumber: { startsWith: `INV${currentYear}` },
      },
      orderBy: { invoiceNumber: 'desc' },
    })

    let sequence = 1
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.slice(-3))
      sequence = lastSequence + 1
    }

    const invoiceNumber = `INV${currentYear}${sequence.toString().padStart(3, '0')}`

    // Calculate total from items
    const items = body.items || []
    const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0)

    const invoice = await db.feeInvoice.create({
      data: {
        invoiceNumber,
        studentId: body.studentId,
        termId: body.termId,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
        status: 'PENDING',
        items: {
          create: items.map((item: { description: string; amount: number; feeType: string }) => ({
            description: item.description,
            amount: item.amount,
            feeType: item.feeType,
          })),
        },
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
        items: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
