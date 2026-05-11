'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseApiOptions {
  immediate?: boolean
}

export function useApi<T>(url: string, options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetcher = useCallback(async (fetchUrl?: string) => {
    const targetUrl = fetchUrl || url
    if (!targetUrl) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(targetUrl)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const json = await res.json()
      setData(json)
      return json
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [url])

  const post = useCallback(async (body: unknown, actionUrl?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(actionUrl || url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `API error: ${res.status}`)
      }
      const json = await res.json()
      return json
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url])

  const put = useCallback(async (body: unknown, actionUrl?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(actionUrl || url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `API error: ${res.status}`)
      }
      const json = await res.json()
      return json
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url])

  const remove = useCallback(async (id: string, params?: Record<string, string>, actionUrl?: string) => {
    setLoading(true)
    setError(null)
    try {
      const searchParams = new URLSearchParams({ id, ...params })
      const res = await fetch(`${actionUrl || url}?${searchParams}`, { method: 'DELETE' })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `API error: ${res.status}`)
      }
      const json = await res.json()
      return json
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (options?.immediate !== false) {
      fetcher()
    }
  }, [fetcher, options?.immediate])

  const refetch = useCallback(() => fetcher(), [fetcher])

  return { data, loading, error, refetch, post, put, remove }
}
