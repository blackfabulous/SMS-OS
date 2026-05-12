import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if cached PrismaClient has the expected models (handles schema migrations in dev)
if (globalForPrisma.prisma && typeof (globalForPrisma.prisma as Record<string, unknown>).websitePage === 'undefined') {
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db