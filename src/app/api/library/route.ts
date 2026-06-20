import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validateAuth, validateRole } from '@/lib/api-auth'

// GET /api/library — List books with transaction status (available/issued/overdue)
// Query params: search, category, status (available|issued|overdue), page, limit
export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const statusFilter = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build book filter
    const bookFilter: Record<string, unknown> = { isActive: true }
    if (search) {
      bookFilter.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category && category !== 'ALL') {
      bookFilter.category = category
    }

    // Status-based filters
    if (statusFilter === 'available') {
      bookFilter.availableCopies = { gt: 0 }
    } else if (statusFilter === 'issued') {
      bookFilter.availableCopies = 0
      bookFilter.totalCopies = { gt: 0 }
    }

    const [books, bookTotal] = await Promise.all([
      db.libraryBook.findMany({
        where: bookFilter,
        include: {
          transactions: {
            where: { transactionType: 'ISSUE', returnDate: null },
            include: {
              student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
            },
            orderBy: { issueDate: 'desc' },
          },
        },
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.libraryBook.count({ where: bookFilter }),
    ])

    // Transactions list with pagination
    const [transactions, transactionTotal] = await Promise.all([
      db.libraryTransaction.findMany({
        include: {
          book: { select: { id: true, title: true, author: true, isbn: true } },
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.libraryTransaction.count(),
    ])

    // Stats
    const totalBooks = await db.libraryBook.count({ where: { isActive: true } })
    const totalCopies = await db.libraryBook.aggregate({
      where: { isActive: true },
      _sum: { totalCopies: true, availableCopies: true },
    })
    const availableCopies = totalCopies._sum.availableCopies || 0
    const issuedCount = (totalCopies._sum.totalCopies || 0) - availableCopies

    // Overdue transactions
    const now = new Date()
    const overdueTransactions = await db.libraryTransaction.findMany({
      where: { transactionType: 'ISSUE', returnDate: null, dueDate: { lt: now } },
      include: {
        book: { select: { id: true, title: true, author: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    })

    const overdueWithFines = overdueTransactions.map((t) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
      )
      const fine = daysOverdue * 1 // $1 per day overdue
      return { ...t, daysOverdue, calculatedFine: fine }
    })

    // Filter overdue if status=overdue
    if (statusFilter === 'overdue') {
      return NextResponse.json({
        books: [],
        bookTotal: 0,
        transactions: overdueWithFines,
        overdue: overdueWithFines,
        stats: {
          totalBooks,
          totalCopies: totalCopies._sum.totalCopies || 0,
          availableCopies,
          issuedCount,
          overdueCount: overdueTransactions.length,
        },
        categories: [],
        pagination: { page, limit, totalBooks, totalPages: Math.ceil(overdueTransactions.length / limit) },
      })
    }

    // Categories breakdown
    const categories = await db.libraryBook.groupBy({
      by: ['category'],
      where: { isActive: true, category: { not: null } },
      _count: { id: true },
    })

    return NextResponse.json({
      books,
      bookTotal,
      transactions,
      overdue: overdueWithFines,
      stats: {
        totalBooks,
        totalCopies: totalCopies._sum.totalCopies || 0,
        availableCopies,
        issuedCount,
        overdueCount: overdueTransactions.length,
      },
      categories: categories.map((c) => ({ category: c.category || 'Uncategorized', count: c._count.id })),
      pagination: {
        page,
        limit,
        totalBooks: bookTotal,
        totalTransactions: transactionTotal,
        totalPages: Math.ceil(bookTotal / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch library data:', error)
    return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 })
  }
}

// POST /api/library — Create book or issue/return transaction
export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'issue') {
      const { bookId, studentId, dueDate } = body
      if (!bookId || !studentId) {
        return NextResponse.json({ error: 'bookId and studentId are required' }, { status: 400 })
      }

      const book = await db.libraryBook.findUnique({ where: { id: bookId } })
      if (!book) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 })
      }
      if (book.availableCopies <= 0) {
        return NextResponse.json({ error: 'No copies available' }, { status: 400 })
      }

      const transaction = await db.$transaction(async (tx) => {
        const newTransaction = await tx.libraryTransaction.create({
          data: {
            bookId,
            studentId,
            transactionType: 'ISSUE',
            issueDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          include: {
            book: { select: { title: true, author: true } },
            student: { select: { firstName: true, lastName: true, studentNumber: true } },
          },
        })
        await tx.libraryBook.update({
          where: { id: bookId },
          data: { availableCopies: { decrement: 1 } },
        })
        return newTransaction
      })
      logAudit({ action: 'CREATE', entity: 'library', entityId: (transaction as any)?.id, afterValue: transaction }).catch(() => {})
      return NextResponse.json(transaction, { status: 201 })
    }

    if (action === 'return') {
      const { transactionId, conditionOnReturn, fine } = body
      if (!transactionId) {
        return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
      }

      const transaction = await db.$transaction(async (tx) => {
        const existing = await tx.libraryTransaction.findUnique({ where: { id: transactionId } })
        if (!existing || existing.returnDate) {
          throw new Error('Transaction not found or already returned')
        }

        const updated = await tx.libraryTransaction.update({
          where: { id: transactionId },
          data: {
            returnDate: new Date(),
            conditionOnReturn: conditionOnReturn || null,
            fine: fine || 0,
          },
          include: {
            book: { select: { title: true, author: true } },
            student: { select: { firstName: true, lastName: true } },
          },
        })
        await tx.libraryBook.update({
          where: { id: existing.bookId },
          data: { availableCopies: { increment: 1 } },
        })
        return updated
      })
      logAudit({ action: 'CREATE', entity: 'library', entityId: (transaction as any)?.id, afterValue: transaction }).catch(() => {})
      return NextResponse.json(transaction)
    }

    if (action === 'addBook') {
      const { isbn, title, author, publisher, category, shelfLocation, totalCopies, schoolId } = body
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }

      let sid = schoolId

      const book = await db.libraryBook.create({
        data: {
          schoolId: sid || 'default',
          isbn: isbn || null,
          title,
          author: author || null,
          publisher: publisher || null,
          category: category || null,
          shelfLocation: shelfLocation || null,
          totalCopies: totalCopies || 1,
          availableCopies: totalCopies || 1,
        },
      })
      logAudit({ action: 'CREATE', entity: 'library', entityId: (book as any)?.id, afterValue: book }).catch(() => {})
      return NextResponse.json(book, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action. Use: issue, return, or addBook' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process library request:', error)
    return NextResponse.json({ error: 'Failed to process library request' }, { status: 500 })
  }
}

// PUT /api/library — Update book or transaction
export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, type, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'book' || updates.title || updates.author || updates.category !== undefined) {
      const book = await db.libraryBook.update({
        where: { id },
        data: {
          title: updates.title,
          author: updates.author,
          publisher: updates.publisher,
          category: updates.category,
          shelfLocation: updates.shelfLocation,
          isbn: updates.isbn,
          totalCopies: updates.totalCopies,
          availableCopies: updates.availableCopies,
          isActive: updates.isActive,
        },
      })
      logAudit({ action: 'UPDATE', entity: 'library', entityId: (book as any)?.id, afterValue: book }).catch(() => {})
      return NextResponse.json(book)
    }

    // Update transaction
    const transaction = await db.libraryTransaction.update({
      where: { id },
      data: {
        fine: updates.fine,
        conditionOnReturn: updates.conditionOnReturn,
      },
    })
    logAudit({ action: 'UPDATE', entity: 'library', entityId: (transaction as any)?.id, afterValue: transaction }).catch(() => {})
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to update library record:', error)
    return NextResponse.json({ error: 'Failed to update library record' }, { status: 500 })
  }
}

// DELETE /api/library?id=xxx&type=book|transaction
export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'book') {
      await db.libraryBook.update({ where: { id }, data: { isActive: false } })
    } else {
      await db.libraryTransaction.delete({ where: { id } })
    }

    logAudit({ action: 'DELETE', entity: 'library', entityId: (id ?? undefined) }).catch(() => {})
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Failed to delete library record:', error)
    return NextResponse.json({ error: 'Failed to delete library record' }, { status: 500 })
  }
}
