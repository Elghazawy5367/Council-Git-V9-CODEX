# CODEX Execution Rules

This file defines safe execution policy for AI-assisted changes in this repository.

## Core Safety Rules

1. **Do not modify functional source code unless explicitly requested.**
2. **Prefer incremental edits** (small, reviewable patches) over broad rewrites.
3. **Preserve public interfaces** (exports, route paths, script names, store contracts) unless a migration plan is documented.
4. **Preserve existing documentation** and add links instead of replacing context.
5. **Never treat archive docs as canonical** without manual verification.

## Sequential Execution Model

All change workflows should follow:

**Plan → Execute → Validate → Repair → Confirm**

### 1) Plan
- Identify scope (files, features, risks).
- Confirm existing docs that already cover the domain.
- Define non-goals and rollback approach.

### 2) Execute
- Apply smallest safe change set.
- Avoid mixed concerns in one change (documentation + runtime logic should be separate unless required).

### 3) Validate
Minimum validation sequence:
- `npm run typecheck`
- `npm run build`
- optional targeted check(s): `npm run lint` or feature-specific scripts

### 4) Repair
- If validation fails, fix only root-cause issues introduced in current change scope.
- Re-run failed checks.

### 5) Confirm
- Verify expected behavior still holds.
- Confirm no unintended config or API contract drift.

## TypeScript Safety Policies

- Keep `strict` assumptions valid.
- Avoid introducing new untyped boundaries (`any`) when concrete typing is available.
- Preserve path alias behavior (`@/*`) and bundler-compatible imports.
- Keep browser/runtime boundaries explicit (Node-only dependencies must stay outside browser execution paths).

## Build Validation Steps

For doc-only changes:
- At minimum run `npm run typecheck` to confirm no incidental breakage.

For code/config changes (when explicitly requested):
- `npm run typecheck`
- `npm run build`
- Relevant script tests if touched (e.g., `npm run test:heist`, targeted tooling scripts)

## Rollback and Recovery Requirements

- Every change should be recoverable via git history.
- Keep commit boundaries meaningful and atomic.
- If a broad edit is required, split into staged commits.

## Interface Preservation Rules

Treat the following as stability-sensitive interfaces:
- Route map in `src/App.tsx`
- Store APIs used via deprecated compatibility wrappers in `src/features/**/store/*`
- Script command names in `package.json`
- MCP tool names in `src/lib/mcp-servers/index.ts`

If any of these must change, document migration steps in the same PR.
