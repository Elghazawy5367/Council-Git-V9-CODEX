# Observability and Runtime Monitoring Plan
*Target: Council-Git-V9-CODEX*
*Path: `/src/lib/observability/`*

## Overview
Based on the requirement to introduce logging and tracking without degrading performance, a lightweight, native, zero-dependency observability layer was implemented.

---

## Architecture Components

### 1. System Logger (`logger.ts`)
**Strategy:** 
A wrapper around the native `console` API that injects timestamps, standardizes `[LEVEL]` tags, and swallows `INFO` logs when the environment is bound to Production (to prevent client-side log spam). It acts as the eventual single-entry point if external aggregators (like Datadog or Sentry) are added later.
- `INFO`: Basic application flow logic (swallowed in production).
- `WARN`: Actionable but non-breaking warnings.
- `ERROR`: Standard caught exceptions.
- `CRITICAL`: High-priority systemic breakages.

### 2. High-Performance Tracer (`tracer.ts`)
**Strategy:**
Using the native browser `performance.now()`, the `withTrace(name, fn)` wrapper measures execution layers async.
- Rather than instrumenting the event loop deeply (which degrades execution speeds by up to 20%), it explicitly wraps pure function calls.
- In production, it only fires log events if a threshold is exceeded (e.g., `> 1000ms`), ensuring background tracing is effectively costless unless a spike is detected.

### 3. Global Error Boundary (`error-boundary.tsx`)
**Strategy:**
A standalone React `Component` class designed to wrap root elements in `main.tsx`. If a deeply nested component cascades into a failure (e.g. `undefined is not an object`), the boundary catches the failure, calls `logger.critical()`, and presents a safe fallback UI avoiding the generic react "white screen of death".

---

## Integration Plan (Next Steps)
Currently, the observability layer is scaffolded. To activate this across the codebase without making disruptive bulk commits right now, focus on the following targets progressively:

**To instrument tracing:**
```typescript
import { withTrace } from '@/lib/observability/tracer';

// Target: src/lib/prompt-heist.ts
const results = await withTrace('PromptHeist.Parse', async () => {
    return runHeavyRegexSynthesis();
});
```

**To activate boundary:**
```tsx
import { SystemErrorBoundary } from '@/lib/observability/error-boundary';

// Target: main.tsx
<SystemErrorBoundary boundaryName="RootApp">
  <App />
</SystemErrorBoundary>
```
