export interface Cache<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

export class InMemoryCache<T> implements Cache<T> {
  private store = new Map<string, { value: T; expiresAt?: number }>();

  async get(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }
}

export function cacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter((p): p is string | number => p !== undefined && p !== null).join(":");
}

/**
 * Stale-while-revalidate style wrapper.
 * Returns the cached value immediately if present, then refreshes it in the background.
 */
export async function staleWhileRevalidate<T>(
  cache: Cache<T>,
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  const cached = await cache.get(key);
  if (cached !== undefined) {
    fn().then((value) => cache.set(key, value, ttlSeconds)).catch(() => {});
    return cached;
  }

  const value = await fn();
  await cache.set(key, value, ttlSeconds);
  return value;
}
