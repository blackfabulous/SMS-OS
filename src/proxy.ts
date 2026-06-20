import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// NOTE: middleware runs in the Edge runtime, so it must NOT import Prisma-backed
// code (e.g. ./lib/audit → ./lib/db). Doing so drags the Node-only Prisma engine
// into the Edge bundle, which Next.js cannot compile (boots fail with an internal
// "reading 'modules'" 500 on every route). Security events that fire here are
// logged to stderr instead; persistent audit logging happens in the API layer.
function logSecurityEventEdge(entry: {
  event: string
  ip: string
  details: string
  severity: string
}): void {
  console.warn(`[security] ${entry.severity} ${entry.event} ip=${entry.ip} :: ${entry.details}`)
}

// ─── Simple in-memory rate limiter (replace with Redis in production) ─────
interface RateLimitEntry {
  count: number
  resetAt: number
  blockedUntil?: number
}

const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  default: { windowMs: 60 * 1000, max: 100 },
  auth: { windowMs: 60 * 1000, max: 20 },
  mutation: { windowMs: 60 * 1000, max: 30 },
}

const BLOCK_THRESHOLD = 500 // DDoS: block if >500 req/min
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes

const store = new Map<string, RateLimitEntry>()

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

function getBucketKey(ip: string, path: string): string {
  if (path.startsWith('/api/auth')) return `auth:${ip}`
  if (path.match(/^\/(api\/.*\/(create|update|delete|bulk|import|seed|setup)|api\/(login|register|logout|reset-password))/)) return `mutation:${ip}`
  return `default:${ip}`
}

function isBlocked(ip: string): boolean {
  const entry = store.get(`block:${ip}`)
  if (!entry?.blockedUntil) return false
  if (Date.now() < entry.blockedUntil) return true
  store.delete(`block:${ip}`)
  return false
}

function blockIP(ip: string): void {
  store.set(`block:${ip}`, { count: 0, resetAt: 0, blockedUntil: Date.now() + BLOCK_DURATION })
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; retryAfter?: number } {
  if (isBlocked(ip)) {
    const entry = store.get(`block:${ip}`)!
    return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil! - Date.now()) / 1000) }
  }

  const bucketKey = getBucketKey(ip, path)
  const limit = RATE_LIMITS[bucketKey.split(':')[0] as keyof typeof RATE_LIMITS] ?? RATE_LIMITS.default
  const now = Date.now()

  let entry = store.get(bucketKey)
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + limit.windowMs }
    store.set(bucketKey, entry)
  } else {
    entry.count++
  }

  // DDoS check
  const totalKey = `total:${ip}`
  let totalEntry = store.get(totalKey)
  if (!totalEntry || now > totalEntry.resetAt) {
    totalEntry = { count: 1, resetAt: now + 60 * 1000 }
    store.set(totalKey, totalEntry)
  } else {
    totalEntry.count++
  }

  if (totalEntry.count > BLOCK_THRESHOLD) {
    blockIP(ip)
    logSecurityEventEdge({ event: 'DDOS_BLOCKED', ip, details: `Blocked IP ${ip} after ${totalEntry.count} requests`, severity: 'CRITICAL' })
    return { allowed: false, retryAfter: BLOCK_DURATION / 1000 }
  }

  if (entry.count > limit.max) {
    logSecurityEventEdge({ event: 'RATE_LIMIT_EXCEEDED', ip, details: `Rate limit exceeded for ${path}`, severity: 'MEDIUM' })
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  return { allowed: true }
}

// ─── Security headers ───────────────────────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

// Paths that are publicly accessible without authentication.
// The public marketing website lives in the (public) route group and must be
// reachable by anonymous visitors and search-engine crawlers.
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/academics',
  '/admissions',
  '/news',
  '/events',
  '/gallery',
  '/contact',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/admissions/apply',
  '/api/contact',
  '/api/password',
  '/robots.txt',
  '/sitemap.xml',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/icons',
  '/images',
  '/public',
]

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => {
    // Root must match exactly — otherwise `startsWith('/')` would mark every
    // path public and disable the auth guard entirely.
    if (p === '/') return path === '/'
    return path === p || path.startsWith(p + '/')
  })
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const ip = getClientIP(request)

  // ─── Page-level auth guard (non-API routes) ───────────────────────────────
  if (!path.startsWith('/api') && !isPublicPath(path)) {
    // Validate the JWT (signature + expiry) rather than just checking that a
    // cookie is present — a stale or forged cookie no longer passes the guard.
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ─── API-only: rate limiting + security headers ────────────────────────────
  if (!path.startsWith('/api')) {
    return NextResponse.next()
  }

  // Rate limiting
  const result = checkRateLimit(ip, path)
  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfter: result.retryAfter }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter),
          ...SECURITY_HEADERS,
        },
      }
    )
  }

  const response = NextResponse.next()

  // Add security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|images/).*)',
  ],
}
