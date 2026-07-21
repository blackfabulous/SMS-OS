import 'server-only'
import { db } from '@/lib/db'
import { isAppError } from '@/lib/errors'

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function formatDate(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0]
}

export async function generateSitemap(schoolId: string) {
  const school = await db.school.findUnique({ where: { id: schoolId } })
  if (!school) throw new Error('School not found')

  const baseUrl = school.contactEmail ? `https://${school.code.toLowerCase()}.zimschool.co.zw` : 'https://school.zimschool.co.zw'

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = []
  urls.push({ loc: baseUrl, lastmod: formatDate(new Date()), changefreq: 'daily', priority: '1.0' })

  const [pages, newsArticles, events] = await Promise.all([
    db.websitePage.findMany({ where: { schoolId, isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.newsArticle.findMany({ where: { schoolId, isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.schoolEvent.findMany({ where: { schoolId }, select: { id: true, createdAt: true } }),
  ])

  for (const page of pages) {
    urls.push({
      loc: `${baseUrl}/${escapeXml(page.slug)}`,
      lastmod: formatDate(page.updatedAt),
      changefreq: 'weekly',
      priority: '0.8',
    })
  }

  for (const article of newsArticles) {
    urls.push({
      loc: `${baseUrl}/news/${escapeXml(article.slug)}`,
      lastmod: formatDate(article.updatedAt),
      changefreq: 'monthly',
      priority: '0.6',
    })
  }

  for (const event of events) {
    urls.push({
      loc: `${baseUrl}/events/${event.id}`,
      lastmod: formatDate(event.createdAt),
      changefreq: 'monthly',
      priority: '0.5',
    })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return xml
}

export function handleSitemapError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'INTERNAL' as const,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : 'Unknown error',
  }
}
