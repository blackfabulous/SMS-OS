import type { Metadata } from 'next'
import Link from 'next/link'
import { Newspaper, ArrowRight } from 'lucide-react'
import { getSchool, getPublishedNews, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `News — ${name}`,
    description: `The latest news, announcements and stories from ${name}.`,
  }
}

function fmt(d: Date | string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
}

export default async function NewsPage() {
  const news = await getPublishedNews(50)

  return (
    <>
      <PageHero eyebrow="Newsroom" title="School News" subtitle="Stay up to date with the latest happenings, achievements and announcements." crumbs={[{ label: 'News' }]} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {news.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <Link key={n.id} href={`/news/${n.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Newspaper className="h-10 w-10 text-white/80" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="inline-block w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{n.category}</span>
                  <h2 className="mt-3 line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{n.title}</h2>
                  {n.excerpt && <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{n.excerpt}</p>}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{fmt(n.publishedAt ?? n.createdAt)}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">Read more <ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No news articles have been published yet. Please check back soon.</p>
          </div>
        )}
      </div>
    </>
  )
}
