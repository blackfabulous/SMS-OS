export interface IdempotencyStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export function idempotencyKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter((p): p is string | number => p !== undefined && p !== null).join(":");
}

/**
 * Wrap a mutating function with idempotency semantics.
 * If the key has been seen before, return the stored result.
 * Otherwise execute `fn`, store the result, and return it.
 */
export async function withIdempotency<T>(
  store: IdempotencyStore,
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = 3600
): Promise<T> {
  const cached = await store.get<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  await store.set(key, result, ttlSeconds);
  return result;
}
