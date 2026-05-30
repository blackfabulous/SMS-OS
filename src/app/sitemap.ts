import type { MetadataRoute } from 'next'
import { getPublishedNews, getUpcomingEvents } from '@/lib/public-data'

// Always generate at request time so newly published CMS content appears.
export const dynamic = 'force-dynamic'

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/academics`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/admissions`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/admissions/apply`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/news`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/events`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/gallery`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.6 },
  ]

  try {
    const [news, events] = await Promise.all([getPublishedNews(500), getUpcomingEvents(500)])
    const newsUrls: MetadataRoute.Sitemap = news.map((n) => ({
      url: `${base}/news/${n.slug}`,
      lastModified: n.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
    const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
      url: `${base}/events/${e.id}`,
      lastModified: e.createdAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    }))
    return [...staticPages, ...newsUrls, ...eventUrls]
  } catch {
    // If the database is unavailable (e.g. at build time), still emit static pages.
    return staticPages
  }
}
