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
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-emerald-200/80">
          <Link href="/" className="transition-colors hover:text-white">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              {c.href ? <Link href={c.href} className="transition-colors hover:text-white">{c.label}</Link> : <span className="text-white">{c.label}</span>}
            </span>
          ))}
        </nav>
        {eyebrow && <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-emerald-300">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-50/85 sm:text-lg">{subtitle}</p>}
      </div>
      <div className="relative flex h-1.5 w-full">
        <span className="flex-1 bg-green-500" />
        <span className="flex-1 bg-yellow-400" />
        <span className="flex-1 bg-red-500" />
        <span className="flex-1 bg-black" />
      </div>
    </section>
  )
}
