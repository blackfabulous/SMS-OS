import { NextResponse } from 'next/server'

/**
 * Standard API response envelope (blueprint §3.1).
 * Success → { data }. Error → { error: { code, message, details? } }.
 * Use ok()/fail() in every route handler for a consistent contract.
 */

export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'

export const ERROR_STATUS: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export function fail(code: ApiErrorCode, message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status: ERROR_STATUS[code] },
  )
}

/** Build the error body without a Response (useful for tests / composition). */
export function errorBody(code: ApiErrorCode, message: string, details?: unknown) {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } }
}
