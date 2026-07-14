import { AppError } from "@/lib/errors";

/**
 * Typed response envelope for every API boundary.
 * - success: { data: T }
 * - error:   { error: { code, message, details? } }
 */

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: Record<string, unknown> } };

export function ok<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

export function fail(
  code: string,
  message: string,
  details?: Record<string, unknown>
): { success: false; error: { code: string; message: string; details?: Record<string, unknown> } } {
  return { success: false, error: { code, message, details } };
}

export function fromAppError(err: AppError): { success: false; error: { code: string; message: string; details?: Record<string, unknown> } } {
  return fail(err.code, err.message, err.details);
}

export function fromUnknown(err: unknown): { success: false; error: { code: string; message: string } } {
  if (err instanceof AppError) {
    return fromAppError(err);
  }
  if (err instanceof Error) {
    return fail("INTERNAL_ERROR", err.message);
  }
  return fail("INTERNAL_ERROR", "An unexpected error occurred");
}
