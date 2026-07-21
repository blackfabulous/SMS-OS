import { logger } from '@/lib/logger'
import { fail } from '@/server/http'
import { validateAuth } from '@/lib/api-auth'
import { generateSitemap, handleSitemapError } from '@/server/services/sitemap'

export async function GET() {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  try {
    const xml = await generateSitemap(authResult.session.user.schoolId)
    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    const { code, message } = handleSitemapError(error, 'Failed to generate sitemap')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
