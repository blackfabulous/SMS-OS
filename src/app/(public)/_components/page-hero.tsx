import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface PageHeroProps {
  title: string
  subtitle?: string
  eyebrow?: string
  /** Breadcrumb trail (excluding Home, which is prepended automatically). */
  crumbs?: { label: string; href?: string }[]
}

export function PageHero({ title, subtitle, eyebrow, crumbs = [] }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900">
      {/* Layered ambience for a premium, glassy depth */}
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-emerald-200/80">
          <Link href="/" className="transition-colors hover:text-white">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              {c.href ? <Link href={c.href} className="transition-colors hover:text-white">{c.label}</Link> : <span className="text-white">{c.label}</span>}
            </span>
          ))}
        </nav>
        {eyebrow && (
          <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/30 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-50/85 sm:text-lg">{subtitle}</p>}
      </div>

      {/* Zimbabwe flag accent stripe */}
      <div className="relative flex h-1.5 w-full">
        <span className="flex-1 bg-green-500" />
        <span className="flex-1 bg-yellow-400" />
        <span className="flex-1 bg-red-500" />
        <span className="flex-1 bg-black" />
      </div>
    </section>
  )
}
