import { getServerSession } from '@/lib/auth'
import type { UserRole } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { logSecurityEvent } from './audit'
import { enterTenant } from '@/server/tenant-context'

/**
 * Validates that the request has an authenticated session.
 * Returns the session if valid, or a NextResponse error if not.
 */
export async function validateAuth(): Promise<{
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>
} | { error: NextResponse }> {
  const session = await getServerSession()

  if (!session?.user) {
    logSecurityEvent({ event: 'AUTH_FAILURE', details: 'Unauthenticated request', severity: 'MEDIUM' }).catch(() => {})
    return {
      error: NextResponse.json(
        { error: 'Authentication required', message: 'You must be signed in to access this resource' },
        { status: 401 }
      ),
    }
  }

  // Establish the request's tenant so RLS-scoped queries are constrained to it.
  enterTenant(session.user.schoolId)
  return { session }
}

/**
 * Validates that the request has an authenticated session with the required role(s).
 * Returns the session if valid, or a NextResponse error if not.
 */
export async function validateRole(allowedRoles: UserRole[]): Promise<{
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>
} | { error: NextResponse }> {
  const authResult = await validateAuth()

  if ('error' in authResult) {
    return authResult
  }

  if (!allowedRoles.includes(authResult.session.user.role as UserRole)) {
    logSecurityEvent({
      event: 'UNAUTHORIZED_ACCESS',
      userId: authResult.session.user.id,
      details: `Role ${authResult.session.user.role} not in [${allowedRoles.join(', ')}]`,
      severity: 'HIGH',
    }).catch(() => {})
    return {
      error: NextResponse.json(
        { error: 'Insufficient permissions', message: 'You do not have permission to access this resource' },
        { status: 403 }
      ),
    }
  }

  return authResult
}

/**
 * Validates that the request has an authenticated session from the specified school.
 * This ensures users can only access data from their own school.
 */
export async function validateSchoolAccess(schoolId: string): Promise<{
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>
} | { error: NextResponse }> {
  const authResult = await validateAuth()

  if ('error' in authResult) {
    return authResult
  }

  if (authResult.session.user.schoolId !== schoolId) {
    logSecurityEvent({
      event: 'UNAUTHORIZED_ACCESS',
      userId: authResult.session.user.id,
      details: `School mismatch: user=${authResult.session.user.schoolId}, requested=${schoolId}`,
      severity: 'HIGH',
    }).catch(() => {})
    return {
      error: NextResponse.json(
        { error: 'Access denied', message: 'You can only access data from your own school' },
        { status: 403 }
      ),
    }
  }

  return authResult
}
