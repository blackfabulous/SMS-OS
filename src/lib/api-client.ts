import type { ApiErrorCode } from '@/server/http'

export class ApiError extends Error {
  code: ApiErrorCode
  details?: unknown

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })

  let json: { data?: T; error?: { code: ApiErrorCode; message: string; details?: unknown } } | null = null
  try {
    json = await res.json()
  } catch {
    // Non-JSON response; fall through to status check.
  }

  if (!res.ok || json?.error) {
    const error = json?.error
    throw new ApiError(
      error?.code || 'INTERNAL',
      error?.message || `Request failed (${res.status})`,
      error?.details,
    )
  }

  if (!json || !('data' in json)) {
    throw new ApiError('INTERNAL', 'Invalid response envelope')
  }

  return json.data as T
}

export async function apiPost<T = unknown, TBody = unknown>(url: string, body: TBody): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function apiPut<T = unknown, TBody = unknown>(url: string, body: TBody): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function apiDelete<T = unknown>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE' })
}
