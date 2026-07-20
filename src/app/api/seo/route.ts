import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getSEO, createSEO, updateSEO, deleteSEO, handleSEOError } from '@/server/services/seo'

export async function GET(request: NextRequest) {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('pageSlug')
    const schoolId = authResult.session.user.schoolId

    if (!schoolId) return fail('FORBIDDEN', 'School not configured')

    const result = await getSEO(schoolId, pageSlug)
    return ok(result)
  } catch (error) {
    const { code, message } = handleSEOError(error, 'Failed to fetch SEO data')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const schoolId = authResult.session.user.schoolId
    if (!schoolId) return fail('FORBIDDEN', 'School not configured')

    const seoSetting = await createSEO(schoolId, body)
    return ok(seoSetting, 201)
  } catch (error) {
    const { code, message } = handleSEOError(error, 'Failed to create SEO setting')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...fieldsToUpdate } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')
    if (!schoolId) return fail('FORBIDDEN', 'School not configured')

    const seoSetting = await updateSEO(schoolId, id, fieldsToUpdate)
    return ok(seoSetting)
  } catch (error) {
    const { code, message } = handleSEOError(error, 'Failed to update SEO setting')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await validateRole(['ADMIN'])
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id } = body
    const schoolId = authResult.session.user.schoolId

    if (!id) return fail('VALIDATION', 'ID is required')
    if (!schoolId) return fail('FORBIDDEN', 'School not configured')

    const result = await deleteSEO(schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleSEOError(error, 'Failed to delete SEO setting')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
