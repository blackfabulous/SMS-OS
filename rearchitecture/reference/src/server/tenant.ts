import { prisma } from "@/server/db/prisma";
import { Prisma, Role } from "@prisma/client";

export interface AuthContext {
  userId: string;
  schoolId: string;
  role: Role;
}

export interface TenantContext extends AuthContext {
  can: (action: string, resource: string) => boolean;
}

/**
 * Default base filter applied to every tenant-owned query.
 */
export function tenantBase(schoolId: string) {
  return {
    schoolId,
    deletedAt: null,
  };
}

/**
 * Runs a Prisma transaction with `SET LOCAL app.current_school_id` so that
 * Postgres RLS policies see the tenant context. This is safe for PgBouncer/Supabase
 * transaction-pooled connections because `LOCAL` is scoped to the current transaction.
 */
export async function withTenantTransaction<T>(
  schoolId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL app.current_school_id = ${schoolId}`;
    return callback(tx);
  });
}

/**
 * Sets the tenant context for the current connection. Prefer `withTenantTransaction`
 * unless you are on a long-lived, dedicated connection (e.g. a migration script).
 */
export async function setTenantConnection(schoolId: string) {
  await prisma.$executeRaw`SET LOCAL app.current_school_id = ${schoolId}`;
}
