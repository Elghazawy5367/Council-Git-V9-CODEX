# Comprehensive System Validation Framework
*Target: Council-Git-V9-CODEX*
*Path: `/validation/`*

## Overview
Because the project does not utilize a traditional unit testing framework (like Vitest or Jest), the validation architecture relies entirely on Node.js processes executed via `tsx` and programmatic AST analysis using `ts-morph`. This approach ensures type safety, dependency integrity, import map resolution, and build stability without needing thousands of manually written test cases.

## Validation Targets Detected
The following nodes act as anchors for the validation logic:
1. **Entry Points:** `src/main.tsx`, Vite aliases (`@/`).
2. **Core Contexts:** `src/stores/council.store.ts`, `src/stores/analytics.store.ts`.
3. **External I/O:** `src/services/github-client.ts`, `src/services/openrouter.ts`.

---

## 1. Build Verification (`build.validation.ts`)
**Purpose:** Ensures the repository can compile and the Vite bundler resolves all chunks manually specified in `vite.config.ts`.
**Rules:**
- `tsc --noEmit` must return exit code 0.
- `npm run build` (Vite) must succeed and yield the `dist/` folder.
**Execution:** `npx tsx validation/build.validation.ts`

## 2. Dependency Integrity (`dependency.validation.ts`)
**Purpose:** Prevents package drift and ensures that critical build layers haven't been uninstalled.
**Rules:**
- Validates the presence of `react`, `vite`, `typescript`, `zustand`, and `ts-morph` in `package.json`.
- Identifies the executing Node runtime to prevent version mismatch errors.
**Execution:** `npx tsx validation/dependency.validation.ts`

## 3. Import Resolution & Circular Checks (`import.validation.ts`)
**Purpose:** Dynamically parses the AST (Abstract Syntax Tree) to find orphaned files and broken relative links.
**Rules:**
- Spawns a `ts-morph` instance attached to `tsconfig.json`.
- Parses every `getImportDeclarations()` in all `sourceFiles`.
- Flags any relative (`./` or `../`) and path-aliased (`@/`) import that cannot statically resolve, bypassing standard runtime crashes.
**Execution:** `npx tsx validation/import.validation.ts`

## 4. Runtime & Initialization Initialization (`runtime.validation.ts`)
**Purpose:** Tests whether the pre-flight conditions required for the server to spin up are fulfilled.
**Rules:**
- Checks for vital configuration templates (e.g., `.env.example`).
- Ensures base initialization anchors like `index.html` and central state stores exist on disk before Vite starts dev mode.
**Execution:** `npx tsx validation/runtime.validation.ts`

---
**How to use:**
Create a composite npm script wrapper in `package.json` to execute these checks in your CI/CD pipeline, e.g.:
`"validate:all": "tsx validation/dependency.validation.ts && tsx validation/import.validation.ts && tsx validation/build.validation.ts"`
