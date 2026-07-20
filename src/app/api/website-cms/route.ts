import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getCMSData, processCMS, handleWebsiteCMSError } from '@/server/services/website-cms'

export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'
    const data = await getCMSData(authResult.session.user.schoolId, section)
    return ok(data)
  } catch (error) {
    const { code, message } = handleWebsiteCMSError(error, 'Failed to fetch CMS data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await processCMS(body.action, authResult.session.user.schoolId, body)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handleWebsiteCMSError(error, 'Failed to create CMS content')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await processCMS(body.action, authResult.session.user.schoolId, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleWebsiteCMSError(error, 'Failed to update CMS content')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const result = await processCMS(body.action, authResult.session.user.schoolId, body)
    return ok(result)
  } catch (error) {
    const { code, message } = handleWebsiteCMSError(error, 'Failed to delete CMS content')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
