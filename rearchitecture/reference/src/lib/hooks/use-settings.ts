import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { get, post, patch, remove } from "@/lib/api";

export interface Setting {
  key: string;
  value: unknown;
  updatedById?: string | null;
  updatedAt: string;
}

export interface CreateSettingInput {
  key: string;
  value: unknown;
}

export interface UpdateSettingInput {
  value: unknown;
}

const SETTINGS_QUERY_KEY = "settings";

function buildSettingsQueryKey(keys?: string[]) {
  return keys ? [SETTINGS_QUERY_KEY, keys] : [SETTINGS_QUERY_KEY];
}

// GET /api/settings?keys=a,b
export function useSettings(keys?: string[]): UseQueryResult<Setting[]> {
  const queryKey = buildSettingsQueryKey(keys);
  const queryString = keys ? `?keys=${keys.join(",")}` : "";

  return useQuery<Setting[]>({
    queryKey,
    queryFn: () => get<Setting[]>(`/settings${queryString}`),
  });
}

// GET /api/settings/:key
export function useSetting(key: string): UseQueryResult<Setting> {
  return useQuery<Setting>({
    queryKey: [SETTINGS_QUERY_KEY, key],
    queryFn: () => get<Setting>(`/settings/${key}`),
    enabled: Boolean(key),
  });
}

// POST /api/settings
export function useCreateSetting(): UseMutationResult<Setting, Error, CreateSettingInput> {
  const queryClient = useQueryClient();

  return useMutation<Setting, Error, CreateSettingInput>({
    mutationFn: (input) => post<Setting>("/settings", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
    },
  });
}

// PATCH /api/settings/:key
export function useUpdateSetting(key: string): UseMutationResult<Setting, Error, UpdateSettingInput> {
  const queryClient = useQueryClient();

  return useMutation<Setting, Error, UpdateSettingInput>({
    mutationFn: (input) => patch<Setting>(`/settings/${key}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY, key] });
    },
  });
}

// DELETE /api/settings/:key
export function useDeleteSetting(key: string): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => remove<void>(`/settings/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY, key] });
    },
  });
}
