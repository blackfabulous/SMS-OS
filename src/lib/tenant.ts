import { validateAuth } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function getRequestTenant(_request?: Request): Promise<
  { schoolId: string } | { error: NextResponse }
> {
  const authResult = await validateAuth()

  if ('error' in authResult) {
    return { error: authResult.error }
  }

  const schoolId = authResult.session.user.schoolId

  if (!schoolId) {
    return {
      error: NextResponse.json(
        { error: 'Tenant not found', message: 'No school associated with this account' },
        { status: 403 }
      ),
    }
  }

  return { schoolId }
}
