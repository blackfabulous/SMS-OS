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
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          term: { include: { academicYear: true } },
          items: true,
          payments: { include: { parent: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.feeInvoice.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const currentYear = new Date().getFullYear()
    const lastInvoice = await db.feeInvoice.findFirst({
      where: { invoiceNumber: { startsWith: `INV${currentYear}` } },
      orderBy: { invoiceNumber: 'desc' },
    })
    let sequence = 1
    if (lastInvoice) { sequence = parseInt(lastInvoice.invoiceNumber.slice(-3)) + 1 }
    const invoiceNumber = `INV${currentYear}${sequence.toString().padStart(3, '0')}`

    const items = body.items || []
    const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0)

    const invoice = await db.feeInvoice.create({
      data: {
        invoiceNumber, studentId: body.studentId, termId: body.termId,
        totalAmount, amountPaid: 0, balance: totalAmount,
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(), status: 'PENDING',
        items: { create: items.map((item: { description: string; amount: number; feeType: string }) => ({ description: item.description, amount: item.amount, feeType: item.feeType })) },
      },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } }, items: true },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })

    const invoice = await db.feeInvoice.update({
      where: { id },
      data: { status: updates.status, dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } }, items: true },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })

    // Only allow cancelling unpaid invoices
    const invoice = await db.feeInvoice.findUnique({ where: { id } })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    if (invoice.amountPaid > 0) return NextResponse.json({ error: 'Cannot delete invoice with payments' }, { status: 400 })

    await db.invoiceItem.deleteMany({ where: { invoiceId: id } })
    await db.feeInvoice.delete({ where: { id } })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
