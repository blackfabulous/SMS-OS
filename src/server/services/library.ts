import 'server-only'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { AppError, isAppError } from '@/lib/errors'

interface ListParams {
  search?: string
  category?: string
  status?: string // available | issued | overdue
  page?: number
  limit?: number
}

export async function listLibrary(schoolId: string, params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const skip = (page - 1) * limit
  const search = params.search ?? ''
  const statusFilter = params.status ?? ''

  const bookFilter: Record<string, unknown> = { schoolId, isActive: true }
  if (search) {
    bookFilter.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { publisher: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (params.category && params.category !== 'ALL') {
    bookFilter.category = params.category
  }

  if (statusFilter === 'available') {
    bookFilter.availableCopies = { gt: 0 }
  } else if (statusFilter === 'issued') {
    bookFilter.availableCopies = 0
    bookFilter.totalCopies = { gt: 0 }
  }

  const [books, bookTotal, totalCopiesAgg, today] = await Promise.all([
    statusFilter === 'overdue'
      ? Promise.resolve([])
      : db.libraryBook.findMany({
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
          skip,
          take: limit,
        }),
    statusFilter === 'overdue'
      ? Promise.resolve(0)
      : db.libraryBook.count({ where: bookFilter }),
    db.libraryBook.aggregate({
      where: { schoolId, isActive: true },
      _sum: { totalCopies: true, availableCopies: true },
    }),
    Promise.resolve(new Date()),
  ])

  const [transactions, transactionTotal, overdueTransactions] = await Promise.all([
    db.libraryTransaction.findMany({
      where: { schoolId },
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.libraryTransaction.count({ where: { schoolId } }),
    db.libraryTransaction.findMany({
      where: { schoolId, transactionType: 'ISSUE', returnDate: null, dueDate: { lt: today } },
      include: {
        book: { select: { id: true, title: true, author: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  const totalBooks = await db.libraryBook.count({ where: { schoolId, isActive: true } })
  const totalCopies = totalCopiesAgg._sum.totalCopies || 0
  const availableCopies = totalCopiesAgg._sum.availableCopies || 0
  const issuedCount = totalCopies - availableCopies

  const overdueWithFines = overdueTransactions.map((t) => {
    const daysOverdue = t.dueDate
      ? Math.ceil((today.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const fine = daysOverdue * 1
    return { ...t, daysOverdue, calculatedFine: fine }
  })

  const categories = await db.libraryBook.groupBy({
    by: ['category'],
    where: { schoolId, isActive: true, category: { not: null } },
    _count: { id: true },
  })

  if (statusFilter === 'overdue') {
    return {
      books: [],
      bookTotal: 0,
      transactions: overdueWithFines,
      overdue: overdueWithFines,
      stats: {
        totalBooks,
        totalCopies,
        availableCopies,
        issuedCount,
        overdueCount: overdueTransactions.length,
      },
      categories: [],
      pagination: {
        page,
        limit,
        totalBooks,
        totalPages: Math.ceil(overdueTransactions.length / limit),
      },
    }
  }

  return {
    books,
    bookTotal,
    transactions,
    overdue: overdueWithFines,
    stats: {
      totalBooks,
      totalCopies,
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
  }
}

export async function issueLibraryBook(
  schoolId: string,
  body: { bookId?: string; studentId?: string; dueDate?: string },
) {
  const { bookId, studentId, dueDate } = body
  if (!bookId || !studentId) {
    throw new AppError('VALIDATION', 'bookId and studentId are required')
  }

  const book = await db.libraryBook.findUnique({ where: { id: bookId, schoolId } })
  if (!book) throw new AppError('NOT_FOUND', 'Book not found')
  if (book.availableCopies <= 0) throw new AppError('CONFLICT', 'No copies available')

  const transaction = await db.$transaction(async (tx) => {
    const newTransaction = await tx.libraryTransaction.create({
      data: {
        schoolId,
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
      where: { id: bookId, schoolId },
      data: { availableCopies: { decrement: 1 } },
    })
    return newTransaction
  })

  logAudit({ action: 'CREATE', entity: 'library', entityId: transaction.id, schoolId, afterValue: transaction }).catch(
    () => {},
  )
  return transaction
}

export async function returnLibraryBook(
  schoolId: string,
  body: { transactionId?: string; conditionOnReturn?: string; fine?: number },
) {
  const { transactionId, conditionOnReturn, fine } = body
  if (!transactionId) throw new AppError('VALIDATION', 'transactionId is required')

  const transaction = await db.$transaction(async (tx) => {
    const existing = await tx.libraryTransaction.findUnique({ where: { id: transactionId, schoolId } })
    if (!existing || existing.returnDate) {
      throw new AppError('VALIDATION', 'Transaction not found or already returned')
    }

    const updated = await tx.libraryTransaction.update({
      where: { id: transactionId, schoolId },
      data: {
        returnDate: new Date(),
        conditionOnReturn: conditionOnReturn || null,
        fine: fine ?? 0,
      },
      include: {
        book: { select: { title: true, author: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    })
    await tx.libraryBook.update({
      where: { id: existing.bookId, schoolId },
      data: { availableCopies: { increment: 1 } },
    })
    return updated
  })

  logAudit({ action: 'UPDATE', entity: 'library', entityId: transaction.id, schoolId, afterValue: transaction }).catch(
    () => {},
  )
  return transaction
}

export async function addLibraryBook(
  schoolId: string,
  body: {
    isbn?: string
    title?: string
    author?: string
    publisher?: string
    category?: string
    shelfLocation?: string
    totalCopies?: number
  },
) {
  const { isbn, title, author, publisher, category, shelfLocation, totalCopies } = body
  if (!title) throw new AppError('VALIDATION', 'Title is required')

  const book = await db.libraryBook.create({
    data: {
      schoolId,
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

  logAudit({ action: 'CREATE', entity: 'library', entityId: book.id, schoolId, afterValue: book }).catch(() => {})
  return book
}

export async function updateLibraryBook(
  schoolId: string,
  id: string,
  updates: Record<string, unknown>,
) {
  const owned = await db.libraryBook.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Book not found')

  const book = await db.libraryBook.update({
    where: { id, schoolId },
    data: {
      title: updates.title as string | undefined,
      author: updates.author as string | undefined,
      publisher: updates.publisher as string | undefined,
      category: updates.category as string | undefined,
      shelfLocation: updates.shelfLocation as string | undefined,
      isbn: updates.isbn as string | undefined,
      totalCopies: updates.totalCopies as number | undefined,
      availableCopies: updates.availableCopies as number | undefined,
      isActive: updates.isActive as boolean | undefined,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'library', entityId: book.id, schoolId, afterValue: book }).catch(() => {})
  return book
}

export async function updateLibraryTransaction(
  schoolId: string,
  id: string,
  updates: { fine?: number; conditionOnReturn?: string },
) {
  const owned = await db.libraryTransaction.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Transaction not found')

  const transaction = await db.libraryTransaction.update({
    where: { id, schoolId },
    data: {
      fine: updates.fine,
      conditionOnReturn: updates.conditionOnReturn,
    },
  })

  logAudit({ action: 'UPDATE', entity: 'library', entityId: transaction.id, schoolId, afterValue: transaction }).catch(
    () => {},
  )
  return transaction
}

export async function deleteLibraryBook(schoolId: string, id: string) {
  const owned = await db.libraryBook.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Book not found')

  await db.libraryBook.update({ where: { id, schoolId }, data: { isActive: false } })
  logAudit({ action: 'DELETE', entity: 'library', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export async function deleteLibraryTransaction(schoolId: string, id: string) {
  const owned = await db.libraryTransaction.findFirst({ where: { id, schoolId }, select: { id: true } })
  if (!owned) throw new AppError('NOT_FOUND', 'Transaction not found')

  await db.libraryTransaction.delete({ where: { id, schoolId } })
  logAudit({ action: 'DELETE', entity: 'library', entityId: id, schoolId }).catch(() => {})
  return { deleted: true, id }
}

export function handleLibraryError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
