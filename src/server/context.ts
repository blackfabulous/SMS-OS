import type { NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { canPerformAction, type UserRole, type Action } from '@/lib/rbac'
import { fail } from '@/server/http'

/**
 * Unified request context (blueprint §3.2). Resolves the session, the tenant
 * (schoolId) and a policy-checked `can()` in one call — replacing the scattered
 * validateAuth / validateRole / getRequestTenant combos. The policy matrix lives
 * in src/lib/rbac.ts (canPerformAction); this is the single enforcement point.
 */
export interface RequestContext {
  userId: string
  schoolId: string
  role: UserRole
  /** Policy check against the RBAC matrix for a module + action. */
  can: (module: string, action: Action) => boolean
}

export interface RequireContextOptions {
  /** Allow only these roles (coarse gate). */
  roles?: UserRole[]
  /** Require a specific module+action permission (fine gate via the RBAC matrix). */
  module?: string
  action?: Action
}

export async function requireContext(
  opts: RequireContextOptions = {},
): Promise<{ ctx: RequestContext } | { error: NextResponse }> {
  const auth = await validateAuth()
  if ('error' in auth) return { error: auth.error }

  const user = auth.session.user
  const schoolId = user.schoolId
  if (!schoolId) {
    return { error: fail('FORBIDDEN', 'No school is associated with this account') }
  }

  const role = user.role as UserRole

  if (opts.roles && !opts.roles.includes(role)) {
    return { error: fail('FORBIDDEN', 'You do not have permission to access this resource') }
  }
  if (opts.module && opts.action && !canPerformAction(role, opts.module, opts.action)) {
    return { error: fail('FORBIDDEN', `Your role cannot ${opts.action} ${opts.module}`) }
  }

  return {
    ctx: {
      userId: user.id,
      schoolId,
      role,
      can: (module: string, action: Action) => canPerformAction(role, module, action),
    },
  }
}
