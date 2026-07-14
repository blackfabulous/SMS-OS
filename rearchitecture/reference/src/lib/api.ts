import { ApiResponse } from "@/server/api/response";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(code);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(body.error.code, body.error.details);
  }

  return body.data;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  return parseResponse<T>(res);
}

export function get<T>(path: string) {
  return api<T>(path, { method: "GET" });
}

export function post<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function patch<T>(path: string, body: unknown) {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function remove<T>(path: string) {
  return api<T>(path, { method: "DELETE" });
}
