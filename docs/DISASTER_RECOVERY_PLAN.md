# Disaster Recovery Plan (DRP)
*Target: Council-Git-V9-CODEX*
*Path: `/docs/DISASTER_RECOVERY_PLAN.md`*
*Date: 2026-04-10*

## Overview
This Disaster Recovery Plan defines the failover, mitigation, and rollback logic for the three most common catastrophic failure scenarios previously isolated within the architectural design of the application.

---

## 1. Third-Party Dependency Failure
**Scenario:** Primary LLM routing via `openrouter.ts` revokes the API key, or GitHub's API rate limits drop internal `scout.ts` functionality to 0.
**Detection Engine:** Identifiable instantly via our `/profiling/latency.profile.ts` integration throwing `success: false` bounds internally.

**Failover Logic:**
1. **Cache Fallback (Primary Defense):** On API failure, the request pipeline automatically swaps to `<AdaptiveCacheManager>(level: 'disk')`. Stale intelligence payloads are returned to the user with a `"STALE_FALLBACK"` warning UI badge, preventing a white-screen breakage.
2. **Offline Local Model (Secondary Defense):** `OpenRouterService` should trigger an internal fallback to hitting `localhost:11434` (Ollama) transparently if the `success: false` boundary persists past 3 retries.
3. **Rollback Plan:** Remove the deployed commit reverting to the previous known-good API endpoint schema if the provider fundamentally altered their OpenAPI graph, triggering our AST maps to fail dynamically.

---

## 2. Local State & Data Corruption
**Scenario:** Local `.cache/*.json` layers become malformatted due to abrupt kill signals (e.g., process terminating while Node is flushing AST maps to disk), causing `JSON.parse` crashes on reboot.
**Detection Engine:** Fails synchronously at boot during `runtime.validation.ts`.

**Backup & Recovery Routines:**
1. **Cache Eviction Protocol:** Modify boot sequences in `cache.manager.ts`. If `fs.readFile` coupled with `JSON.parse` throws an exception, the manager must aggressively block and execute `fs.rmSync(this.diskCachePath, { recursive: true, force: true })`, rebuilding the `.cache` folder from scratch automatically.
2. **Config Vault Backup:** State properties in `council.store.ts` must sync to localStorage. If memory fragmentation is detected, the `Zustand` store hydration module gracefully falls back to `{ defaultInitialState }` mapping, ensuring the user environment resets safely rather than panicking. 

---

## 3. Catastrophic Runtime Crash
**Scenario:** The Node V8 engine entirely starves out and is locked by synchronous loops, or React crashes entirely triggering the White-Screen DOM kill switch.
**Detection Engine:** `[PROFILE:PERF]` threshold exceeded (>5000ms limit).

**Failover Logic:**
1. **Client UI Shielding:** Captured fully natively by our custom `/observability/error-boundary.tsx` React component. It quarantines the broken child tree and renders a stylized reload fallback. It logs context strictly to `CRITICAL` via `logger.ts`.
2. **Backend Daemon Rollback:** Run the core logic CLI through standard PM2 (Production Process Manager) or Docker health bounds configured to instantly `restart on crash`. Node crashes emit unhandled exceptions; PM2 captures the exit code (1) and restarts the background sync within 5 seconds.

## Resolution Workflow Protocol
If a tier-1 failure occurs on production (branch `main`):
1. Lock merges to `main`.
2. Escalate via the GitHub Actions hook engineered in `.github/workflows/maintenance.yml` (Issue generation tracking).
3. If code-bound, revert the commit automatically. If dependency-bound, clear local caches.
