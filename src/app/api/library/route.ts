import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/library - Get books and transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    // Build book filter
    const bookFilter: Record<string, unknown> = { isActive: true }
    if (search) {
      bookFilter.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
        { category: { contains: search } },
      ]
    }
    if (category && category !== 'ALL') {
      bookFilter.category = category
    }

    const books = await db.libraryBook.findMany({
      where: bookFilter,
      include: {
        transactions: {
          where: { transactionType: 'ISSUE', returnDate: null },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentNumber: true,
              },
            },
          },
          orderBy: { issueDate: 'desc' },
        },
      },
      orderBy: { title: 'asc' },
    })

    // All transactions (recent)
    const transactions = await db.libraryTransaction.findMany({
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Stats
    const totalBooks = await db.libraryBook.count({ where: { isActive: true } })
    const totalCopies = await db.libraryBook.aggregate({
      where: { isActive: true },
      _sum: { totalCopies: true, availableCopies: true },
    })
    const availableCopies = totalCopies._sum.availableCopies || 0
    const issuedCount = (totalCopies._sum.totalCopies || 0) - availableCopies

    // Overdue books
    const now = new Date()
    const overdueTransactions = await db.libraryTransaction.findMany({
      where: {
        transactionType: 'ISSUE',
        returnDate: null,
        dueDate: { lt: now },
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    // Calculate fines for overdue
    const overdueWithFines = overdueTransactions.map((t) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
      )
      const fine = daysOverdue * 1 // $1 per day
      return { ...t, daysOverdue, calculatedFine: fine }
    })

    // Categories
    const categories = await db.libraryBook.groupBy({
      by: ['category'],
      where: { isActive: true, category: { not: null } },
      _count: { id: true },
    })

    return NextResponse.json({
      books,
      transactions,
      stats: {
        totalBooks,
        totalCopies: totalCopies._sum.totalCopies || 0,
        availableCopies,
        issuedCount,
        overdueCount: overdueTransactions.length,
      },
      overdue: overdueWithFines,
      categories: categories.map((c) => ({
        category: c.category || 'Uncategorized',
        count: c._count.id,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch library data:', error)
    return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 })
  }
}

// POST /api/library - Issue/return book, add book
export async function POST(request: NextRequest) {
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
        return NextResponse.json({ error: 'No copies available for issue' }, { status: 400 })
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

      return NextResponse.json(transaction, { status: 201 })
    }

    if (action === 'return') {
      const { transactionId, conditionOnReturn, fine } = body
      if (!transactionId) {
        return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
      }

      const transaction = await db.$transaction(async (tx) => {
        const existing = await tx.libraryTransaction.findUnique({
          where: { id: transactionId },
        })
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

      return NextResponse.json(transaction)
    }

    if (action === 'addBook') {
      const { isbn, title, author, publisher, category, shelfLocation, totalCopies, schoolId } = body
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }

      // Find or use provided schoolId
      let sid = schoolId
      if (!sid) {
        const school = await db.school.findFirst()
        sid = school?.id
      }

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

      return NextResponse.json(book, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process library request:', error)
    return NextResponse.json({ error: 'Failed to process library request' }, { status: 500 })
  }
}
