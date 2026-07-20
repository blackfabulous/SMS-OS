import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { logAudit } from '@/lib/audit'
import { validateRole } from '@/lib/api-auth'
import { importZimsecResults, handleExaminationsError } from '@/server/services/examinations'

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const schoolId = authResult.session.user.schoolId

  try {
    const importResult = await importZimsecResults(request, schoolId)
    logAudit({ action: 'CREATE', entity: 'bulk-import', schoolId, details: `Imported ${importResult.imported} ZIMSEC results` }).catch(() => {})
    return ok({
      success: true,
      imported: importResult.imported,
      skipped: importResult.skipped,
      errors: importResult.errors.slice(0, 50),
      message: `Import complete: ${importResult.imported} results imported, ${importResult.skipped} skipped, ${importResult.errors.length} errors`,
    })
  } catch (error) {
    const { code, message } = handleExaminationsError(error, 'Failed to process ZIMSEC results import')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
