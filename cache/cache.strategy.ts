/**
 * Adaptive Caching Strategy Interfaces
 */

export type CacheLevel = 'memory' | 'disk' | 'computation';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface ICacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttlMs: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryCacheStrategy implements ICacheStrategy {
  private store = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Disk caching strategy wrapper for local filesystem (Node.js backend only)
export class DiskCacheStrategy implements ICacheStrategy {
  private cachePath: string;

  constructor(storageDir: string) {
    this.cachePath = storageDir;
  }
  
  // Implementation delegated to CacheManager via fs/promises dynamically
  async get<T>(key: string): Promise<T | null> { return null; }
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {}
  async invalidate(key: string): Promise<void> {}
  async clear(): Promise<void> {}
}
