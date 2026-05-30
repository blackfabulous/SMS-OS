import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, User } from 'lucide-react'
import { getNewsBySlug, getSchool, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  if (!article) return { title: 'Article not found' }
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  const description = article.metaDescription || article.excerpt || `${article.title} — ${name}`
  return {
    title: article.metaTitle || `${article.title} — ${name}`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      images: article.featuredImage ? [article.featuredImage] : undefined,
    },
  }
}

function fmt(d: Date | string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  if (!article) notFound()

  return (
    <>
      <PageHero
        eyebrow={article.category}
        title={article.title}
        crumbs={[{ label: 'News', href: '/news' }, { label: 'Article' }]}
      />

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {fmt(article.publishedAt ?? article.createdAt)}</span>
          {article.authorName && <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {article.authorName}</span>}
        </div>

        {article.excerpt && <p className="mt-6 text-lg font-medium leading-relaxed text-foreground/90">{article.excerpt}</p>}

        <div className="mt-6 space-y-4 leading-relaxed text-foreground/85">
          {article.content.split(/\n+/).filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="mt-12 border-t border-border/60 pt-6">
          <Link href="/news" className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
            <ArrowLeft className="h-4 w-4" /> Back to all news
          </Link>
        </div>
      </article>
    </>
  )
}
