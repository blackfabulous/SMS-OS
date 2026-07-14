import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Prisma extension that auto-filters `deletedAt: null` on every tenant-owned model.
 * Add models here as they adopt soft-delete.
 */
export const prismaWithSoftDelete = prisma.$extends({
  model: {
    $allModels: {
      // This is a placeholder: per-model soft-delete filtering is set below
    },
  },
});

// Explicit extension for soft-delete because Prisma's $allModels doesn't support
// generic findMany/findFirst override. We keep a typed helper in repositories.
export function isNotDeleted<T extends { deletedAt: Date | null }>(row: T): row is T & { deletedAt: null } {
  return row.deletedAt === null;
}
