export interface TtlCacheOptions {
  /** Upper bound on stored entries; when full, the oldest entry is dropped. */
  maxEntries: number;
  /** Clock in milliseconds; injectable so tests do not need real time to pass. */
  now?: () => number;
}

interface Entry<V> {
  value: V;
  expiresAt: number;
}

/**
 * A small in-memory cache with a time-to-live per entry.
 *
 * - Concurrent requests for the same missing key share one load (no stampede on the upstream).
 * - A failed load is never stored, so the next request tries again.
 * - The size is bounded, so callers who vary the key (e.g. every page number) cannot grow it forever.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, Entry<V>>();
  private readonly loading = new Map<string, Promise<V>>();
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(options: TtlCacheOptions) {
    this.maxEntries = options.maxEntries;
    this.now = options.now ?? Date.now;
  }

  get size(): number {
    return this.entries.size;
  }

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Returns the cached value, or runs `load` and caches its result for `ttlMs`. */
  async getOrLoad(key: string, ttlMs: number, load: () => Promise<V>): Promise<V> {
    // A TTL of zero (or less) switches caching off for this call.
    if (ttlMs <= 0) return load();

    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = this.loading.get(key);
    if (pending !== undefined) return pending;

    const promise = load().then(
      (value) => {
        this.loading.delete(key);
        this.set(key, value, ttlMs);
        return value;
      },
      (error: unknown) => {
        this.loading.delete(key);
        throw error;
      },
    );
    this.loading.set(key, promise);
    return promise;
  }

  clear(): void {
    this.entries.clear();
    this.loading.clear();
  }

  private set(key: string, value: V, ttlMs: number): void {
    // Re-insert so the Map's insertion order stays "oldest first".
    this.entries.delete(key);
    while (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.delete(oldest.value);
    }
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }
}
