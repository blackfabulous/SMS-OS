import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { apiFetch, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api-client'

export { ApiError }

export function useApiQuery<T = unknown>(
  key: unknown[],
  url: string,
  options?: Omit<UseQueryOptions<T, ApiError, T>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: () => apiFetch<T>(url),
    ...options,
  })
}

export function useApiMutation<TBody = unknown, TData = unknown>(
  url: string,
  options?: Omit<UseMutationOptions<TData, ApiError, TBody>, 'mutationFn' | 'mutationKey'>,
) {
  return useMutation<TData, ApiError, TBody>({
    mutationFn: (body) => apiPost<TData, TBody>(url, body),
    ...options,
  })
}

export function useApiPut<TBody = unknown, TData = unknown>(
  url: string,
  options?: Omit<UseMutationOptions<TData, ApiError, TBody>, 'mutationFn' | 'mutationKey'>,
) {
  return useMutation<TData, ApiError, TBody>({
    mutationFn: (body) => apiPut<TData, TBody>(url, body),
    ...options,
  })
}

export function useApiDelete<TData = unknown>(
  url: string,
  options?: Omit<UseMutationOptions<TData, ApiError, string>, 'mutationFn' | 'mutationKey'>,
) {
  return useMutation<TData, ApiError, string>({
    mutationFn: (id) => apiDelete(`${url}?id=${encodeURIComponent(id)}`),
    ...options,
  })
}

export { useQueryClient }
