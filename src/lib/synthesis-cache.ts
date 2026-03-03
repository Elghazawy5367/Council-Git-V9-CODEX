// Synthesis Cache - Semantic caching for expert outputs
import { openDB, IDBPDatabase } from 'idb';
import type { SynthesisOutput } from './types';
interface CachedSynthesis {
  id: string;
  contentHash: string;
  expertHashes: string[];
  task: string;
  taskHash: string;
  verdict: string;
  structured?: SynthesisOutput;
  tier: string;
  cost: number;
  timestamp: number;
  hitCount: number;
  expertCount: number;
}
interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalSaved: number;
  cacheSize: number;
  oldestEntry: number;
  newestEntry: number;
}
const DB_NAME = 'council-synthesis-cache';
const DB_VERSION = 1;
const STORE_NAME = 'syntheses';
const MAX_CACHE_SIZE = 100; // Maximum cached entries
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SIMILARITY_THRESHOLD = 0.85; // 85% similarity required for cache hit

let db: IDBPDatabase | null = null;

/**
 * Initialize cache database
 */
export async function initSynthesisCache(): Promise<void> {
  if (db) return;
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: 'id'
        });
        store.createIndex('taskHash', 'taskHash');
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('hitCount', 'hitCount');
      }
    }
  });
}

/**
 * Generate hash for content (simple but effective)
 */
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate normalized hash for task (case-insensitive, whitespace-normalized)
 */
function generateTaskHash(task: string): string {
  const normalized = task.toLowerCase().trim().replace(/\s+/g, ' ');
  return generateHash(normalized);
}

/**
 * Calculate Jaccard similarity between two sets of words
 * Note: Reserved for future fuzzy matching implementation
 */
// function calculateJaccardSimilarity(text1: string, text2: string): number {
//   const words1 = new Set(text1.toLowerCase().split(/\s+/));
//   const words2 = new Set(text2.toLowerCase().split(/\s+/));
//   
//   const intersection = new Set([...words1].filter(x => words2.has(x)));
//   const union = new Set([...words1, ...words2]);
//   
//   return union.size > 0 ? intersection.size / union.size : 0;
// }

/**
 * Find cached synthesis by similarity
 */
export async function findCachedSynthesis(expertOutputs: Record<string, {
  expertName: string;
  output: string;
}>, task: string, tier: string): Promise<CachedSynthesis | null> {
  await initSynthesisCache();
  if (!db) return null;
  const taskHash = generateTaskHash(task);
  const now = Date.now();
  try {
    // Get all entries for this task hash
    const entries = await db.getAllFromIndex(STORE_NAME, 'taskHash', taskHash);

    // Filter by tier and age
    const validEntries = entries.filter((entry) => entry.tier === tier && now - entry.timestamp < MAX_AGE_MS && entry.expertCount === Object.keys(expertOutputs).length);
    if (validEntries.length === 0) return null;

    // Find most similar entry
    let bestMatch: CachedSynthesis | null = null;
    let bestSimilarity = 0;
    for (const entry of validEntries) {
      // Reconstruct expert outputs from cache (we don't store full outputs, just hashes)
      // For now, use simple content hash comparison
      const currentHashes = Object.values(expertOutputs).map((e) => generateHash(e.output));

      // Check if hashes match (exact match)
      const hashesMatch = currentHashes.length === entry.expertHashes.length && currentHashes.every((h, i) => h === entry.expertHashes[i]);
      if (hashesMatch) {
        bestMatch = entry;
        bestSimilarity = 1.0;
        break;
      }
    }

    // If no exact match, return null (we could implement fuzzy matching here)
    if (bestSimilarity >= SIMILARITY_THRESHOLD && bestMatch) {
      // Update hit count
      bestMatch.hitCount++;
      await db.put(STORE_NAME, bestMatch);
      return bestMatch;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Store synthesis result in cache
 */
export async function cacheSynthesis(expertOutputs: Record<string, {
  expertName: string;
  output: string;
}>, task: string, tier: string, verdict: string, structured: SynthesisOutput | undefined, cost: number): Promise<void> {
  await initSynthesisCache();
  if (!db) return;
  const taskHash = generateTaskHash(task);
  const expertHashes = Object.values(expertOutputs).map((e) => generateHash(e.output));
  const contentHash = generateHash(verdict);
  const id = `${taskHash}_${contentHash}_${Date.now()}`;
  const entry: CachedSynthesis = {
    id,
    contentHash,
    expertHashes,
    task,
    taskHash,
    verdict,
    structured,
    tier,
    cost,
    timestamp: Date.now(),
    hitCount: 0,
    expertCount: Object.keys(expertOutputs).length
  };
  try {
    await db.add(STORE_NAME, entry);
    // Cleanup old entries if cache is too large
    await cleanupCache();
  } catch (error) {
    console.warn('[SynthesisCache] Operation failed silently:', error);
  }
}

/**
 * Cleanup old or excess cache entries
 */
async function cleanupCache(): Promise<void> {
  if (!db) return;
  try {
    const allEntries = await db.getAll(STORE_NAME);
    if (allEntries.length <= MAX_CACHE_SIZE) {
      return;
    }

    // Sort by hit count (ascending) and age (oldest first)
    const sorted = allEntries.sort((a, b) => {
      // Prioritize entries with fewer hits
      if (a.hitCount !== b.hitCount) {
        return a.hitCount - b.hitCount;
      }
      // Then by age (oldest first)
      return a.timestamp - b.timestamp;
    });

    // Remove excess entries
    const toRemove = sorted.slice(0, allEntries.length - MAX_CACHE_SIZE);
    for (const entry of toRemove) {
      await db.delete(STORE_NAME, entry.id);
    }
  } catch (error) {
    console.warn('[SynthesisCache] Operation failed silently:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  await initSynthesisCache();
  if (!db) {
    return {
      totalEntries: 0,
      totalHits: 0,
      totalSaved: 0,
      cacheSize: 0,
      oldestEntry: 0,
      newestEntry: 0
    };
  }
  try {
    const allEntries = await db.getAll(STORE_NAME);
    const totalHits = allEntries.reduce((sum, e) => sum + e.hitCount, 0);
    const totalSaved = allEntries.reduce((sum, e) => sum + e.cost * e.hitCount, 0);
    const timestamps = allEntries.map((e) => e.timestamp);
    return {
      totalEntries: allEntries.length,
      totalHits,
      totalSaved,
      cacheSize: JSON.stringify(allEntries).length,
      oldestEntry: Math.min(...timestamps, Date.now()),
      newestEntry: Math.max(...timestamps, 0)
    };
  } catch (error) {
    return {
      totalEntries: 0,
      totalHits: 0,
      totalSaved: 0,
      cacheSize: 0,
      oldestEntry: 0,
      newestEntry: 0
    };
  }
}

/**
 * Clear all cache entries
 */
export async function clearSynthesisCache(): Promise<void> {
  await initSynthesisCache();
  if (!db) return;
  try {
    await db.clear(STORE_NAME);
  } catch (error) {
    console.warn('[SynthesisCache] Operation failed silently:', error);
  }
}

/**
 * Remove expired cache entries
 */
export async function removeExpiredEntries(): Promise<number> {
  await initSynthesisCache();
  if (!db) return 0;
  const now = Date.now();
  let removedCount = 0;
  try {
    const allEntries = await db.getAll(STORE_NAME);
    for (const entry of allEntries) {
      if (now - entry.timestamp > MAX_AGE_MS) {
        await db.delete(STORE_NAME, entry.id);
        removedCount++;
      }
    }
    if (removedCount > 0) {
      // Entries removed successfully
    }
  } catch (error) {
    console.warn('[SynthesisCache] Operation failed silently:', error);
  }
  return removedCount;
}