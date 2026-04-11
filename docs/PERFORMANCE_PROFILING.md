# System Performance Profiling Engine
*Target: Council-Git-V9-CODEX*
*Path: `/profiling/`*

## Overview
A lightweight programmatic profiling engine has been injected into the repository at `/profiling/`. Rather than running heavy third-party profilers that distort native performance bounds (like Chrome DevTools allocation tracking, which costs up to 15% execution latency to hook), these wrappers can safely wrap Hot Paths in production.

This ensures strict boundaries around synchronous blockages and unbounded memory allocation algorithms.

---

## The Profiling Wrappers

### 1. `performance.profile.ts` (CPU & Thread Blockage)
**Target:** Synchronous data loops or heavy `fs` blocking calls (e.g., `prompt-heist.ts`).
**Logic:** Wraps the execution segment in a high-resolution `performance.now()` tier. 
**Threshold:** Configured to emit warnings if any supposedly asynchronous execution context occupies the Event Loop/Thread for > `500ms`.
```typescript
import { profilePerformance } from '@/profiling/performance.profile';

const output = await profilePerformance('AST_Parser', async () => generateGraph());
```

### 2. `memory.profile.ts` (Heap & Allocation Tracker)
**Target:** Mass context array processing or massive string concatenations loading heavy JSON blobs.
**Logic:** Intersects Node's native `process.memoryUsage().heapUsed` before and after function boundaries. It strictly evaluates the allocated delta to detect hidden leaks.
**Threshold:** Triggers Leak Warnings if a single functional context requests > `150MB` heap slice abruptly.
```typescript
import { profileMemory } from '@/profiling/memory.profile';

const results = await profileMemory('Heavy_JSON_Pipeline', async () => processFiles());
```

### 3. `latency.profile.ts` (Network & I/O Target)
**Target:** External data providers (`github-client.ts`, `openrouter.ts`).
**Logic:** Explicit proxy wrapper that only measures the network round-trip timing, discarding internal payload compilation times.
**Threshold:** Warns natively if external API resolution bounds cross exactly `2500ms`, helping isolate third-party degradation from system layer degradation.
```typescript
import { profileLatency } from '@/profiling/latency.profile';

const issue = await profileLatency('GitHub_Fetch', async () => github.getIssue());
```

---
## Non-Destructive Integrity
Functional application logic inside `src/` has **not** been modified. These wrappers act exclusively as opt-in Higher Order Functions (HOFs). You may inject them around any specific block to generate localized performance traces.
