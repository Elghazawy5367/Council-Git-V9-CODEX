import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { ICacheStrategy, MemoryCacheStrategy, CacheLevel } from './cache.strategy';

/**
 * Global Adaptive Cache Manager
 * Routes requests dynamically prioritizing fast (Memory) over slow (Disk) caches.
 */
class AdaptiveCacheManager {
  private memoryCache: ICacheStrategy;
  private diskCachePath: string;

  constructor() {
    this.memoryCache = new MemoryCacheStrategy();
    this.diskCachePath = process.cwd() ? path.join(process.cwd(), '.cache') : '.cache';
  }

  /**
   * Generates a deterministic hash for complex objects (e.g. LLM prompts, AST query blobs)
   */
  private generateKeyHash(prefix: string, payload: any): string {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Initializes the physical disk wrapper if running in Node.js
   */
  async ensureDiskCache(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
         await fs.mkdir(this.diskCachePath, { recursive: true });
      }
    } catch {}
  }

  /**
   * Adaptive Cache Wrapper
   * Intercepts a computation or API call. If the payload exists in memory, returns instantly.
   * If not, falls back to disk. If not on disk, executes the function and caches the result.
   */
  async withCache<T>(
    identifier: string,
    operation: () => Promise<T>,
    options: { ttlMs: number; level: CacheLevel; dynamicPayload?: any }
  ): Promise<T> {
    
    // 1. Generate unique deterministic key
    const safeKey = options.dynamicPayload 
      ? this.generateKeyHash(identifier, options.dynamicPayload)
      : identifier;

    // 2. Try Memory Cache (Fastest subset)
    if (options.level === 'memory' || options.level === 'computation') {
      const memHit = await this.memoryCache.get<T>(safeKey);
      if (memHit) {
        if (process.env.DEBUG_CACHE) console.info(`[CACHE:HIT:MEMORY] ${identifier}`);
        return memHit;
      }
    }

    // 3. Try Disk Cache (Node.js environments)
    if (options.level === 'disk' && typeof window === 'undefined') {
      try {
        const diskFile = path.join(this.diskCachePath, `${safeKey}.json`);
        const data = await fs.readFile(diskFile, 'utf8');
        const parsed = JSON.parse(data);
        if (Date.now() <= parsed.expiresAt) {
          if (process.env.DEBUG_CACHE) console.info(`[CACHE:HIT:DISK] ${identifier}`);
          // Back-populate memory cache for faster subsequent hits
          await this.memoryCache.set(safeKey, parsed.data, options.ttlMs);
          return parsed.data as T;
        }
      } catch (e) {
        // Cache miss
      }
    }

    // 4. Cache Miss - Execute Target Pipeline
    const result = await operation();

    // 5. Store Result in Cache Layers dynamically
    await this.memoryCache.set(safeKey, result, options.ttlMs);

    if (options.level === 'disk' && typeof window === 'undefined') {
      try {
        await this.ensureDiskCache();
        const diskFile = path.join(this.diskCachePath, `${safeKey}.json`);
        await fs.writeFile(diskFile, JSON.stringify({
          data: result,
          expiresAt: Date.now() + options.ttlMs
        }));
      } catch (e) {
        console.warn(`[CACHE:WARN] Failed to write disk cache for ${identifier}`);
      }
    }

    return result;
  }
}

export const cacheManager = new AdaptiveCacheManager();
