'use client'

import { useId } from 'react'

export interface PartnerItem {
  id: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
}

/**
 * Seamless, auto-scrolling marquee of partner / accreditation logos.
 * Each partner renders as a solid "logo chip" card so the wall reads as
 * premium and is clearly visible even before real logo image files are
 * uploaded from the admin CMS (text falls back to a refined wordmark chip).
 */
export function PartnerCarousel({ partners }: { partners: PartnerItem[] }) {
  const id = useId().replace(/:/g, '')
  if (partners.length === 0) return null

  // Duplicate the track so the loop is seamless.
  const track = [...partners, ...partners]
  const duration = Math.max(22, partners.length * 6)

  return (
    <div className="group relative w-full overflow-hidden py-2">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent sm:w-32" />

      <style>{`
        @keyframes marquee-${id} { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-${id} { animation: marquee-${id} ${duration}s linear infinite; }
        .group:hover .marquee-${id} { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .marquee-${id} { animation: none; } }
      `}</style>

      <ul className={`marquee-${id} flex w-max items-stretch gap-5 sm:gap-7`}>
        {track.map((p, i) => {
          const inner = p.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.logoUrl}
              alt={p.name}
              className="h-9 w-auto max-w-[150px] object-contain sm:h-11"
              loading="lazy"
            />
          ) : (
            <span className="whitespace-nowrap text-base font-bold tracking-tight text-foreground/75 transition-colors group-hover:text-foreground sm:text-lg">
              {p.name}
            </span>
          )
          const chip = (
            <div className="partner-glass-card flex h-[72px] items-center justify-center px-8 transition-all duration-300">
              {inner}
            </div>
          )
          return (
            <li key={`${p.id}-${i}`} className="flex shrink-0 items-center">
              {p.websiteUrl ? (
                <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={p.name}>
                  {chip}
                </a>
              ) : (
                chip
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
