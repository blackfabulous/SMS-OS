import type { SiteTheme } from '@prisma/client'

/**
 * Shared types + resolver for the public-site theme & home content.
 * Turns a raw `SiteTheme` row (or null) into a fully-populated, typed object
 * with JSON fields parsed and sensible fallbacks applied, so the public page
 * never has to deal with nulls or unparsed JSON.
 */

export interface ThemeStat { value: string; label: string }
export interface ThemeValue { icon: string; title: string; desc: string }
export interface ThemeTestimonial { quote: string; name: string; role: string }

export const DEFAULT_STATS: ThemeStat[] = [
  { value: '{students}', label: 'Students Enrolled' },
  { value: '{staff}', label: 'Qualified Staff' },
  { value: '96%', label: 'ZIMSEC Pass Rate' },
  { value: '{years}', label: 'Years of Service' },
]

export const DEFAULT_VALUES: ThemeValue[] = [
  { icon: 'ShieldCheck', title: 'Discipline & Integrity', desc: 'A safe, structured environment where respect, honesty and responsibility are lived daily.' },
  { icon: 'Lightbulb', title: 'Innovation & Curiosity', desc: 'Modern labs, ICT and an innovation centre that turn questions into discovery and skill.' },
  { icon: 'Heart', title: 'Care & Belonging', desc: 'Small classes and attentive mentors who know every learner by name and nurture their gifts.' },
  { icon: 'Target', title: 'Results That Open Doors', desc: 'A proven track record of university placements, scholarships and confident, work-ready graduates.' },
]

export const DEFAULT_TESTIMONIALS: ThemeTestimonial[] = [
  { quote: 'The teachers here genuinely care. My daughter went from struggling in Maths to earning an A in her ZIMSEC O-Levels.', name: 'Mrs. T. Moyo', role: 'Parent, Form 4' },
  { quote: 'Beyond academics, I learned leadership through debate and sport. I walked into university already prepared.', name: 'Tatenda C.', role: 'Alumnus, Class of 2022' },
  { quote: 'A disciplined, welcoming community with facilities that rival the best schools in the province.', name: 'Mr. R. Ncube', role: 'Parent & SDC Member' },
]

/** Schema-mirroring defaults for the scalar theme tokens (used when no row exists). */
export const THEME_DEFAULTS = {
  primaryColor: '#047857',
  secondaryColor: '#0f766e',
  accentColor: '#facc15',
  darkColor: '#022c22',
  headingFont: 'Geist',
  bodyFont: 'Geist',
  radius: '0.75rem',
  heroImageUrl: '/images/campus-hero.jpg',
  heroBadge: null as string | null,
  heroHeadline: null as string | null,
  heroMotto: null as string | null,
  heroSubtitle: 'We nurture confident, disciplined and curious young Zimbabweans — combining rigorous academics with character, sport and service so every learner leaves ready to thrive.',
  heroPrimaryLabel: 'Apply for Admission',
  heroPrimaryHref: '/admissions/apply',
  heroSecondaryLabel: 'Discover Our School',
  heroSecondaryHref: '/about',
  overlayFrom: '#022c22',
  overlayTo: '#134e4a',
  overlayOpacity: 80,
  showStats: true,
  showPartners: true,
  showValues: true,
  showGallery: true,
  showTestimonials: true,
  showNews: true,
  showEvents: true,
}

export type ResolvedTheme = typeof THEME_DEFAULTS & {
  stats: ThemeStat[]
  values: ThemeValue[]
  testimonials: ThemeTestimonial[]
}

function parseArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

/** Normalise a raw SiteTheme row (or null) into a fully-resolved theme. */
export function resolveTheme(row: SiteTheme | null): ResolvedTheme {
  if (!row) {
    return {
      ...THEME_DEFAULTS,
      stats: DEFAULT_STATS,
      values: DEFAULT_VALUES,
      testimonials: DEFAULT_TESTIMONIALS,
    }
  }
  return {
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    accentColor: row.accentColor,
    darkColor: row.darkColor,
    headingFont: row.headingFont,
    bodyFont: row.bodyFont,
    radius: row.radius,
    heroImageUrl: row.heroImageUrl,
    heroBadge: row.heroBadge,
    heroHeadline: row.heroHeadline,
    heroMotto: row.heroMotto,
    heroSubtitle: row.heroSubtitle || THEME_DEFAULTS.heroSubtitle,
    heroPrimaryLabel: row.heroPrimaryLabel,
    heroPrimaryHref: row.heroPrimaryHref,
    heroSecondaryLabel: row.heroSecondaryLabel,
    heroSecondaryHref: row.heroSecondaryHref,
    overlayFrom: row.overlayFrom,
    overlayTo: row.overlayTo,
    overlayOpacity: row.overlayOpacity,
    showStats: row.showStats,
    showPartners: row.showPartners,
    showValues: row.showValues,
    showGallery: row.showGallery,
    showTestimonials: row.showTestimonials,
    showNews: row.showNews,
    showEvents: row.showEvents,
    stats: parseArray<ThemeStat>(row.statsJson, DEFAULT_STATS),
    values: parseArray<ThemeValue>(row.valuesJson, DEFAULT_VALUES),
    testimonials: parseArray<ThemeTestimonial>(row.testimonialsJson, DEFAULT_TESTIMONIALS),
  }
}

/** Convert a hex colour (#rrggbb) to an "r g b" triple for rgb()/opacity use. */
export function hexToRgb(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return '4 120 87' // emerald-700 fallback
  return `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`
}
