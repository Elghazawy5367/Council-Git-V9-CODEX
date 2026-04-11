# Continuous Integration Pipeline Hardening
*Target: Council-Git-V9-CODEX*
*Path: `.github/workflows/build.yml`*

## Overview
While the repository had massive amounts of GitHub automation files (23+ `.yml` scripts dedicated to intelligence, routing, and bot generation), it lacked a fundamental architectural constraint: a dedicated Push/Pull Request Validation build pipeline. Meaning bad merges could potentially slip through into `main`.

A hardened Continuous Integration (CI) execution runner has been created at `.github/workflows/build.yml` to stabilize the deployment workflow.

---

## Architecture Breakdown

### 1. Matrix and Triggers
**Trigger:** Fires on any `push` or `pull_request` against `main` and `develop` branches.
**Environment:** `ubuntu-latest`.
**Matrix Scaling:** Dynamically checks stability across Node.js versions `18.x` and `20.x` concurrently to ensure API compatibility.

### 2. The `fail-fast` Mechanism
By default, long-running intelligence jobs in the other 23 scripts execute regardless of sibling failures. In this pipeline, `fail-fast: true` has been intentionally set inside the Strategy matrix.
**Why:** If Node `18.x` throws a critical type error in `tsc --noEmit`, the entire Github worker pool is safely terminated instantly (including Node `20.x`), preserving Actions billing time and providing immediate feedback.

### 3. Pipeline Step Sequence
1. **Repository Checkout:** Pulled via `actions/checkout@v4`.
2. **Environment Staging:** Setup Node matrix via `actions/setup-node@v4`.
3. **Strict Dependencies:** Uses `npm ci` rather than `npm install` to enforce absolute `package-lock.json` compliance, preventing subtle version drift during builds.
4. **Custom Integrations:** Hooks into the previously built framework files:
    - Runs `validation/dependency.validation.ts`
    - Runs `validation/import.validation.ts`
5. **Standard Verifications:**
    - Type check: `npx tsc --noEmit`
    - Automated Tests: `npx vitest run`
6. **Vite Bundle Step:** Executes `npm run build` to confirm JS/TS transforms and chunk packing (`manualChunks`).
7. **Artifact Export:** Securely archives the output `dist/` directory via `upload-artifact` for 7 days post-verification to ensure reproducible builds.

---

## Expected Outcomes
With this file active, the PR branch panel on GitHub will now natively block merging if any single phase (Dependencies, Imports, Typing, Logic, Bundle) fails dynamically.
