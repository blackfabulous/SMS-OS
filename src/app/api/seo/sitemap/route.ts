import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function formatDate(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0]
}

// GET /api/seo/sitemap - Generate XML sitemap
export async function GET() {
  try {
    const school = await db.school.findFirst()
    const schoolId = school?.id
    const baseUrl = school?.contactEmail ? `https://${school.code.toLowerCase()}.zimschool.co.zw` : 'https://school.zimschool.co.zw'

    const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = []

    // Homepage
    urls.push({ loc: baseUrl, lastmod: formatDate(new Date()), changefreq: 'daily', priority: '1.0' })

    if (schoolId) {
      // Static pages from CMS
      const pages = await db.websitePage.findMany({
        where: { schoolId, isPublished: true },
        select: { slug: true, updatedAt: true },
      })
      for (const page of pages) {
        urls.push({ loc: `${baseUrl}/${escapeXml(page.slug)}`, lastmod: formatDate(page.updatedAt), changefreq: 'weekly', priority: '0.8' })
      }

      // News articles
      const newsArticles = await db.newsArticle.findMany({
        where: { schoolId, isPublished: true },
        select: { slug: true, updatedAt: true },
      })
      for (const article of newsArticles) {
        urls.push({ loc: `${baseUrl}/news/${escapeXml(article.slug)}`, lastmod: formatDate(article.updatedAt), changefreq: 'monthly', priority: '0.6' })
      }

      // Events
      const events = await db.schoolEvent.findMany({
        where: { schoolId },
        select: { id: true, createdAt: true },
      })
      for (const event of events) {
        urls.push({ loc: `${baseUrl}/events/${event.id}`, lastmod: formatDate(event.createdAt), changefreq: 'monthly', priority: '0.5' })
      }
    }

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate sitemap' }, { status: 500 })
  }
}
