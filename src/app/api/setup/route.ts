import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { createSchoolSetup, getSetupOptions, handleSetupError } from '@/server/services/setup'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['SUPER_ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const data = await request.json()
    const result = await createSchoolSetup(data)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handleSetupError(error, 'Failed to create school setup')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function GET() {
  return ok(getSetupOptions())
}
