import type { Metadata } from 'next'
import { ImageIcon } from 'lucide-react'
import { getSchool, getGalleryImages, SITE_FALLBACK } from '@/lib/public-data'
import { PageHero } from '../_components/page-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchool()
  const name = school?.name ?? SITE_FALLBACK.name
  return {
    title: `Gallery — ${name}`,
    description: `A visual journey through life at ${name} — academics, sport, events and campus.`,
  }
}

export default async function GalleryPage() {
  const images = await getGalleryImages(60)

  return (
    <>
      <PageHero eyebrow="Life at school" title="Gallery" subtitle="Moments from the classroom, the sports field and our school community." crumbs={[{ label: 'Gallery' }]} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {images.length > 0 ? (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {images.map((img) => (
              <figure key={img.id} className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-border/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt={img.title ?? 'School gallery image'} className="w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                {(img.title || img.category) && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {img.title ?? img.category}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Our photo gallery is coming soon. Please check back shortly.</p>
          </div>
        )}
      </div>
    </>
  )
}
