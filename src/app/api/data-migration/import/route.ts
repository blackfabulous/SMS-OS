import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { importData, handleDataMigrationError } from '@/server/services/data-migration'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await importData(authResult.session.user.schoolId, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleDataMigrationError(error, 'Data migration failed')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
