export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'

export class AppError extends Error {
  code: ErrorCode
  details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}
