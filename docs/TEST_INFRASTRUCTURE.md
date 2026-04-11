# Automated Testing Infrastructure
*Target: Council-Git-V9-CODEX*
*Path: `/tests/`*

## Overview
Based on the repository audit, the project lacked an automated testing framework. Because the project leverages Vite, React, and native TypeScript (`tsx`), **Vitest** has been selected as the optimal testing framework. It shares the same configuration pipeline as Vite, ensuring zero conflicting transpilation issues and blazing-fast execution speeds.

We have scaffolded out the foundational `/tests/` architecture covering `smoke`, `integration`, and `unit` boundaries.

---

## Architecture Layout

### 1. `vitest.config.ts`
- Located in the root directory.
- Configures `happy-dom` for component testing.
- Uses `@` path aliases automatically inherited from `vite.config.ts`.
- Excludes `node_modules` and `dist` from coverage providers.

### 2. Smoke Tests (`/tests/smoke/`)
**Target File:** `imports.test.ts`
**Purpose:** Verifies that critical external API services (`github-client.ts`, `openrouter.ts`) and Node.js I/O utilities (`prompt-heist.ts`, `scout.ts`) resolve their dependency trees successfully without crashing. If there is a missing `export` or circular dependency, this fails immediately before deep tests run.

### 3. Integration Tests (`/tests/integration/`)
**Target File:** `stores.test.ts`
**Purpose:** Ensures that the central state managers (`useCouncilStore`, `useAnalyticsStore`) boot up with the correct default states and allow generic mutations. This verifies the application context initialization.

### 4. Unit Tests (`/tests/unit/`)
**Target File:** `types.test.ts`
**Purpose:** Pure functional tests verifying pure functions and TypeScript structural bounds using `vitest` assertions (`toBeTypeOf`, etc.).

---

## Action Required Prior to Execution
Because I did not want to modify existing application properties or execute destructive commands without consent, **you must run the following command to finalize installation:**

```bash
npm install -D vitest @vitest/coverage-v8 happy-dom
```

After installation, add this script manually to your `package.json`:
```json
"test": "vitest run"
```

## Constraints Respected
- **No Functional Logic Modified:** The application behavior remains exactly as it was.
- **Infrastructure Only:** Created the scaffolding exclusively.
