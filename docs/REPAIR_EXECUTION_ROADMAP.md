# REPAIR EXECUTION ROADMAP
*Priority-Based Repair Sequence — Derived from Master Audit*
Date: 2026-04-09
Source: `docs/MASTER_AUDIT_CONSOLIDATED.md`

> ⚠️ **Inspection-Only Document.** This roadmap defines what to do and in what order. No code has been modified.

---

## PHASE 1 — Critical Stabilization

> Goal: Eliminate runtime crash vectors and silent failure paths.

### Task 1.1 — Wrap Async Intelligence Fetchers
| Field | Detail |
|---|---|
| **Target Files** | `data/reports/fork-evolution-*.md` generation entrypoints, `scripts/run-stargazer.ts`, `scripts/daily-brief.ts` |
| **Risk** | Unhandled promise rejections crash the script runtime silently, producing empty or missing output artifacts |
| **Repair Action** | Wrap every top-level `await` and `async` function in `scripts/` with explicit `try/catch` blocks; surface a structured error result instead of crashing |
| **Validation** | Run `npm run stargazer` with a bad GITHUB_TOKEN; expect a graceful error message, not a crash/empty output |
| **Rollback** | Revert to previous script version via `git checkout` |

### Task 1.2 — Fix Conditional Assignment Logic Errors
| Field | Detail |
|---|---|
| **Target Files** | `docs/archive/ADVANCED_MEMORY_ARCHITECTURE.md`, `docs/archive/BUILD-FIX-SUMMARY.md`, `docs/archive/COUNCIL_MESSAGING.md` (and any live `.ts/.tsx` files with the same pattern) |
| **Risk** | `if (x = y)` evaluates assignment as condition — always-truthy, creating subtle logic bugs |
| **Repair Action** | Run `npx tsc --noEmit` and lint scan; replace any `=` inside `if` conditions with `===`; remove the false-positive occurrences in archived docs |
| **Validation** | Zero `assignment in condition` warnings from `repo-analyzer.cjs` re-run |
| **Rollback** | `git diff` to review and `git checkout <file>` to revert if regression found |

### Task 1.3 — Remove Console.log From Production Flows
| Field | Detail |
|---|---|
| **Target Files** | All `src/**/*.ts` and `src/**/*.tsx` files flagged by analyzer |
| **Risk** | Leaks context and internal state to the browser console; bloats output and can expose partial reasoning in production |
| **Repair Action** | Replace `console.log` with proper logger utility (`console.warn`/`console.error` or a centralized logger) or delete debug-only lines |
| **Validation** | Re-run `repo-analyzer.cjs`; count of `console.log` warnings should drop to zero in `src/` |
| **Rollback** | `git stash` or `git checkout <file>` |

---

## PHASE 2 — Structural Integrity Repair

> Goal: Reduce file-level bloat and decouple hybrid components.

### Task 2.1 — Decompose `github-client.ts` / `github-api.service.ts`
| Field | Detail |
|---|---|
| **Target Files** | `src/services/github-api.service.ts`, `src/services/github.service.ts` |
| **Risk** | >500 LOC mixing PR data, Issue data, and Repo metadata into a single module — slow to navigate, high merge conflict potential |
| **Repair Action** | Split into three focused modules: `github-repos.service.ts`, `github-issues.service.ts`, `github-prs.service.ts`; re-export from an index file |
| **Validation** | Re-run build (`npm run build`) and type-check (`npm run typecheck`) with zero new errors |
| **Rollback** | `git revert` the split commit if downstream imports break |

### Task 2.2 — Extract Business Logic From `ControlPanel.tsx`
| Field | Detail |
|---|---|
| **Target File** | `src/features/council/components/ControlPanel.tsx` |
| **Risk** | Handles phase execution, vault checks, file validation, and UI rendering simultaneously — impossible to unit test |
| **Repair Action** | Extract execution logic into a custom hook `useCouncilExecution()` and vault logic into `useVaultGuard()`; leave `ControlPanel` as a thin orchestrator |
| **Validation** | Component renders identically; phase execution can be called and tested in isolation |
| **Rollback** | `git checkout -- src/features/council/components/ControlPanel.tsx` |

### Task 2.3 — Extract Business Logic From `FeatureConfigModal.tsx`
| Field | Detail |
|---|---|
| **Target Files** | `src/features/automation/components/FeatureConfigModal.tsx`, `src/features/council/components/FeatureConfigModal.tsx` |
| **Risk** | Intelligence parsing, GitHub/Reddit targeting, and routing logic are all embedded in a modal component |
| **Repair Action** | Extract the intelligence configuration logic into a `useFeatureConfig()` hook and a `FeatureConfigService` class |
| **Validation** | Modal can be opened/closed/saved without side effects; intelligence logic testable in isolation |
| **Rollback** | `git checkout` the affected files |

### Task 2.4 — Decompose `chart.tsx`
| Field | Detail |
|---|---|
| **Target File** | `src/components/primitives/chart.tsx` |
| **Risk** | Overloaded Recharts wrapper (>500 LOC) embedding Council theme logic deeply inside a primitive component |
| **Repair Action** | Split into `ChartBase.tsx` (generic Recharts wrapper) and `CouncilChart.tsx` (theme-aware Council variant) |
| **Validation** | All Dashboard charts render correctly after split |
| **Rollback** | `git checkout -- src/components/primitives/chart.tsx` |

---

## PHASE 3 — Dependency Stabilization

> Goal: Resolve import ambiguities and eliminate dead external wrappers.

### Task 3.1 — Fix Dynamic/Static Import Collision on `control-panel-store`
| Field | Detail |
|---|---|
| **Target Files** | Any file importing `control-panel-store.ts` |
| **Repair Action** | Audit all imports of `control-panel-store.ts`; standardize to either a static import (if always needed) or a lazy dynamic import; do NOT mix both |
| **Validation** | Vite build produces zero chunk splitting warnings for this module |
| **Rollback** | Revert import style if bundle size increases |

### Task 3.2 — Remove Unused External Library Wrappers
| Field | Detail |
|---|---|
| **Target Files** | `src/lib/api-client.ts`, `src/lib/format.ts`, `src/lib/validation.ts` |
| **Risk** | Custom wrappers around standard APIs add unnecessary maintenance surface |
| **Repair Action** | Replace `api-client.ts` with direct Ky/Axios usage; `format.ts` with native `Intl.NumberFormat`; ensure `validation.ts` delegates directly to Zod without intermediary |
| **Validation** | All TypeScript checks pass; no missing imports |
| **Rollback** | Recover original wrappers from git history |

---

## PHASE 4 — Type Safety Hardening

> Goal: Eliminate unsafe `any` escape hatches and lock down type contracts.

### Task 4.1 — Audit and Lock `any` Types in `src/lib/`
| Field | Detail |
|---|---|
| **Target Files** | All `.ts` and `.tsx` files in `src/lib/` containing `any` |
| **Risk** | 123 warnings indicate 100+ implicit `any` escapes that bypass strict type checking |
| **Repair Action** | Run `npx tsc --noEmit --strict 2>&1 | grep any` to locate; replace with explicit typed generics or Zod inferred types |
| **Validation** | Warning count in `repo-analyzer.cjs` drops from 123 toward zero |
| **Rollback** | Isolated per-file changes — revert only broken files |

### Task 4.2 — Add Explicit Return Types to High-Impact Service Functions
| Field | Detail |
|---|---|
| **Target Files** | `src/services/council.service.ts`, `src/services/ruthless-judge.ts`, `src/lib/synthesis-engine.ts` |
| **Risk** | Missing return types on async functions allow type inference to silently become `Promise<any>` |
| **Repair Action** | Add `Promise<ExpertResult>`, `Promise<SynthesisResult>`, etc. return types to every exported async function |
| **Validation** | `npm run typecheck` passes with no new errors; autocomplete shows typed results downstream |
| **Rollback** | `git checkout` per-file |

---

## PHASE 5 — Dead Code Removal

> Goal: Clean repo surface and remove noise from developer view.

### Task 5.1 — Archive Root-Level Markdown Clutter
| Field | Detail |
|---|---|
| **Target Files** | 34 markdown files at repository root (e.g., `DEPLOYMENT.md`, `REVISION_COMPLETE.md`, `COMMIT_READY.md`) |
| **Risk** | Confuse new developers, hide the real `README.md`, and clutter git log |
| **Repair Action** | Run the archive command sequence from `docs/reference/REPOSITORY_ANALYSIS.md` Phase 1 — move to `docs/archive/root-docs/` |
| **Validation** | `ls *.md` at root shows only `README.md` |
| **Rollback** | `git checkout -- *.md` |

### Task 5.2 — Delete or Archive `attached_assets/`
| Field | Detail |
|---|---|
| **Target Directory** | `attached_assets/` (496KB, 14 files) |
| **Risk** | Zero code dependencies; static chat snapshots mislead team on active tooling |
| **Repair Action** | Move to `docs/archive/chat-exports/` or delete after confirming zero code references |
| **Validation** | `grep -r "attached_assets" src/` returns no results |
| **Rollback** | `git checkout` if any reference exists |

### Task 5.3 — Purge Deprecated Store References
| Field | Detail |
|---|---|
| **Target Files** | Any files in `src/features/` still importing from deprecated individual stores |
| **Risk** | Transition state between deprecated feature stores and unified `src/stores` causes stale reads |
| **Repair Action** | Run grep for deprecated store imports; migrate each to the relevant unified Zustand store slice |
| **Validation** | Bundle no longer contains the deprecated store in the final build |
| **Rollback** | Per-file `git revert` |

---

## PHASE 6 — Performance Optimization

> Goal: Reduce bundle size, eliminate re-render vectors, optimize async patterns.

### Task 6.1 — Memoize `CouncilContext.tsx` Selectors
| Field | Detail |
|---|---|
| **Target File** | `src/contexts/CouncilContext.tsx` |
| **Risk** | 6 `useState` calls and heavy JSON payloads cause cascading re-renders in components that consume partial context slices |
| **Repair Action** | Wrap context values in `useMemo`; extract granular selectors using `useContext` + `useMemo` or migrate to Zustand slices |
| **Validation** | React DevTools Profiler shows reduced render count on Council panels after change |
| **Rollback** | `git checkout -- src/contexts/CouncilContext.tsx` |

### Task 6.2 — Lazy-Load Mermaid Diagram Library
| Field | Detail |
|---|---|
| **Target File** | `src/components/primitives/MermaidDiagram.tsx` |
| **Risk** | Mermaid contributes the primary oversized bundle chunk (>500kB flagged by Vite) |
| **Repair Action** | Wrap `mermaid` import in a dynamic `import()` inside a `useEffect`; render a skeleton until the library loads |
| **Validation** | Vite build reports chunk size drops below 500kB threshold for the main bundle |
| **Rollback** | Revert to static import if rendering breaks |

### Task 6.3 — Replace Hardcoded Wait Timers in Intelligence Scripts
| Field | Detail |
|---|---|
| **Target Files** | `scripts/run-stargazer.ts`, `scripts/daily-brief.ts` |
| **Risk** | Fixed `setTimeout` delays never adapt to API backoff headers, causing either rate-limit hits or wasted idle time |
| **Repair Action** | Implement exponential backoff with retry-after header inspection (`Retry-After` from GitHub's 429 responses) |
| **Validation** | Script completes a full niche sweep with no rate-limit errors under normal token conditions |
| **Rollback** | Revert to fixed delay if header parsing is unavailable |

---

## PHASE 7 — Modular Refactor Preparation

> Goal: Set the groundwork for safe future expansion and testing.

### Task 7.1 — Add File-Level JSDoc to Core Services
| Field | Detail |
|---|---|
| **Target Files** | `src/services/council.service.ts`, `src/services/ruthless-judge.ts`, `src/lib/expert-weights.ts`, `src/lib/synthesis-engine.ts` |
| **Risk** | No JSDoc means IDE users get no inline hints and new contributors must read full implementations |
| **Repair Action** | Add `@module`, `@param`, `@returns`, and `@throws` annotations to all exported functions |
| **Validation** | VSCode IntelliSense shows rich hover documentation |
| **Rollback** | N/A — documentation only |

### Task 7.2 — Create `src/stores/validation-store.ts` Slice
| Field | Detail |
|---|---|
| **Target Files** | Multiple components that independently duplicate validation schema fragments |
| **Risk** | Inconsistent validation rules cause divergent error messages and edge case bugs |
| **Repair Action** | Centralize all Zod schemas into a dedicated `validation-store.ts` that exports typed schema factories; delete duplicates |
| **Validation** | `grep -r "z.object" src/` shows all schemas imported from the central store |
| **Rollback** | Restore inline schemas from git |

### Task 7.3 — Create Granular Error Boundaries Per Feature Domain
| Field | Detail |
|---|---|
| **Target Files** | `src/App.tsx`, `src/main.tsx`, `src/features/*/` |
| **Risk** | Single global `ErrorBoundary` in `main.tsx` catches all errors, causing unrelated panels to be wiped when one API call fails |
| **Repair Action** | Wrap each major feature section (`CouncilWorkflow`, `FeaturesDashboard`, `DevtoolsPanel`) with its own `ErrorBoundary` and fallback UI |
| **Validation** | Simulate a forced error in one panel — verify other panels remain functional |
| **Rollback** | Remove domain-level boundaries; fall back to global-only boundary |

---

## Repair Summary

| Phase | Priority | Effort | Risk Reduction |
|-------|----------|--------|----------------|
| Phase 1 — Critical Stabilization | 🔴 Immediate | Low | Prevents silent failures |
| Phase 2 — Structural Integrity | 🟠 High | Medium | Improves maintainability |
| Phase 3 — Dependency Stabilization | 🟠 High | Low | Reduces bundle noise |
| Phase 4 — Type Safety Hardening | 🟡 Medium | Medium | Eliminates type escapes |
| Phase 5 — Dead Code Removal | 🟡 Medium | Low | Reduces clutter |
| Phase 6 — Performance Optimization | 🟢 Standard | Medium | Faster runtime |
| Phase 7 — Refactor Preparation | 🔵 Long-Term | High | Future-proofs architecture |

---

## Top 10 Immediate Fixes (Ranked)

1. **Wrap all async script entrypoints in try/catch** (`scripts/*.ts`) — prevents silent crashes
2. **Fix `if (x = y)` conditional assignment errors** in script logic — logic correctness
3. **Remove `console.log` from `src/` production code** — cleanup + security hygiene
4. **Resolve dynamic + static import collision on `control-panel-store`** — bundle integrity
5. **Decompose `github-api.service.ts`** into scoped modules — reduce file size risk
6. **Extract `useCouncilExecution()` hook from `ControlPanel.tsx`** — testability + clarity
7. **Lock `any` types in `src/lib/` via explicit generics/Zod** — type correctness
8. **Lazy-load Mermaid library** via dynamic `import()` — reduce bundle by ~200kB+
9. **Archive root-level Markdown clutter (34 files)** — developer experience
10. **Add granular `ErrorBoundary` per feature domain** — runtime resilience
