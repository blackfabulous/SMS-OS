export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryable?: (error: unknown) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fullJitter(cap: number): number {
  return Math.random() * cap;
}

function exponentialBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return fullJitter(cap);
}

function defaultRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    // Retry on transient network/DB errors. Do not retry validation or auth errors.
    const transientCodes = new Set([
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "EAI_AGAIN",
      "P1001",
      "P1002",
      "P1008",
      "P1017",
    ]);
    return transientCodes.has((error as { code?: string }).code ?? "");
  }
  return false;
}

/**
 * Retry an async function with exponential backoff and full jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 100,
    maxDelayMs = 30000,
    retryable = defaultRetryable,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts - 1 || !retryable(error)) {
        throw error;
      }

      const delay = exponentialBackoff(attempt, baseDelayMs, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export interface CircuitBreakerState {
  status: "closed" | "open" | "half-open";
  failures: number;
  nextAttemptAt: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = { status: "closed", failures: 0, nextAttemptAt: 0 };

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.status === "open") {
      if (Date.now() < this.state.nextAttemptAt) {
        throw new Error("Circuit breaker is open");
      }
      this.state.status = "half-open";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.state = { status: "closed", failures: 0, nextAttemptAt: 0 };
  }

  private onFailure() {
    const failures = this.state.failures + 1;
    const status = failures >= this.options.failureThreshold ? "open" : "closed";
    this.state = {
      status,
      failures,
      nextAttemptAt: status === "open" ? Date.now() + this.options.resetTimeoutMs : 0,
    };
  }
}
