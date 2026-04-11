# Adaptive Caching Framework Strategy
*Target: Council-Git-V9-CODEX*
*Path: `/cache/`*

## Overview
A high-performance caching layer has been established to protect API rate limits and eliminate duplicate heavy CPU evaluations. Rather than relying on simple React caching or heavy memory stores like Redis, `AdaptiveCacheManager` offers a hybrid tier system running natively within Node.js.

---

## 1. The Strategy Nodes 
Located in `/cache/cache.strategy.ts`:

- **Memory Cache (`memory`)**: The tier-1 lookup. It uses a JavaScript `Map<k,v>` dictionary. Access latency is `~0.1ms`. It respects finite `ttlMs` to prevent memory blowouts.
- **Disk Cache (`disk`)**: The tier-2 fallback layer. If heavy external API calls are made and Node process memory restarts, it securely writes the JSON payload to `.cache/` root. Node reads it back immediately, saving `>2500ms` network latency.
- **Computation Cache (`computation`)**: A programmatic wrapper that intercepts function calls based on a hash of the function payload, securely skipping AST parsing or JSON manipulation if the same graph payload is provided twice.

---

## 2. Manager implementation 
Located in `/cache/cache.manager.ts`:

The cache uses deterministic SHA256 hashes generated from the payload context to retrieve hits seamlessly, independent of the frontend caller.

**Implementation Example:**
```typescript
import { cacheManager } from '@/cache/cache.manager';

// Target the previously identified hot-path fetching GitHub trends
const cachedTrending = await cacheManager.withCache(
  'github_trending_daily', // Root Identifier
  async () => {
    return await githubFallback.getTrendingRepos(); // Expensive operation
  },
  { 
    level: 'disk', // Allow persistence across CLI restarts
    ttlMs: 1000 * 60 * 60 * 24, // 24 Hours Cache
    dynamicPayload: { language: 'typescript' } // Cache uniqueness determinator
  }
);
```

## Integration Next Steps
To drastically reduce performance regression detected in the `BOTTLENECK_ANALYSIS.md` report, you should inject `cacheManager.withCache()` explicitly around:
1. `PromptHeist` retrieval hooks (wrapping massive `.md` payload generations).
2. Remote Intelligence fetches (e.g. `scout.ts` operations calling GitHub or external agents).
