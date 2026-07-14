export interface RateLimitStore {
  /** Increment a counter and return the new value. The counter should expire after `windowMs`. */
  increment(key: string, windowMs: number): Promise<number>;
  /** Get the current count without incrementing. */
  get(key: string): Promise<number>;
  /** Reset a counter. */
  reset(key: string): Promise<void>;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return 1;
    }

    entry.count += 1;
    return entry.count;
  }

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt < Date.now()) return 0;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Fixed-window rate limiter.
 * Simple and stateless on the store side, but can allow small bursts at window boundaries.
 */
export async function fixedWindow(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const count = await store.increment(key, windowMs);
  const resetAt = new Date(Date.now() + windowMs);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

export interface TokenBucketOptions {
  capacity: number;
  refillRatePerSecond: number;
}

export interface TokenBucketState {
  tokens: number;
  lastRefillAt: number;
}

export class InMemoryTokenBucketStore {
  private buckets = new Map<string, TokenBucketState>();

  getState(key: string): TokenBucketState {
    return this.buckets.get(key) ?? { tokens: 0, lastRefillAt: Date.now() };
  }

  setState(key: string, state: TokenBucketState): void {
    this.buckets.set(key, state);
  }
}

/**
 * Token-bucket rate limiter.
 * More burst-tolerant than fixed-window. In production, keep bucket state in Redis.
 */
export function tokenBucket(
  store: InMemoryTokenBucketStore,
  key: string,
  options: TokenBucketOptions
): RateLimitResult {
  const now = Date.now();
  const { capacity, refillRatePerSecond } = options;
  const state = store.getState(key);

  const elapsedSeconds = (now - state.lastRefillAt) / 1000;
  const tokens = Math.min(capacity, state.tokens + elapsedSeconds * refillRatePerSecond);

  const allowed = tokens >= 1;
  const newTokens = allowed ? tokens - 1 : tokens;

  store.setState(key, { tokens: newTokens, lastRefillAt: now });

  return {
    allowed,
    remaining: Math.floor(newTokens),
    resetAt: new Date(now + (1 / refillRatePerSecond) * 1000),
  };
}
