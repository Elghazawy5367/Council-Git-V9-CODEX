# Documentation Coverage Map

## Phase 0 Inventory Summary

Scanned sources:
- `README.md`
- `/docs/**`
- all `*.md` files repository-wide

Inventory snapshot:
- Total markdown files scanned: **154**
- `/docs` markdown files: **117**
  - `/docs/archive`: 69
  - `/docs/guides`: 4
  - `/docs/reference`: 2
  - `/docs` root: 42

## Coverage by Documentation Area

| Area | Primary Files | Coverage | Notes |
|---|---|---:|---|
| Product overview & usage | `README.md`, `docs/INDEX.md` | High | Good onboarding and command references. |
| Feature-specific behavior | `docs/*feature*.md`, guides, archive files | High | Fragmented across many feature docs. |
| Architecture | `README.md` architecture section, `docs/reference/REPOSITORY_ANALYSIS.md`, `docs/CouncilContext-Architecture.md`, `docs/ARCHITECTURE_UPDATE.md` | Medium | Present but split across historical and current docs. |
| Runtime safety / error handling | `docs/reference/web-console-protection.md`, multiple archive error summaries | Medium | Needs single canonical error pattern registry. |
| Refactor rules | `docs/STORE_REFACTORING_GUIDE.md`, `docs/MIGRATION_EXAMPLES.md`, archive refactor summaries | Medium | Existing guidance is migration-specific, not universal safety policy. |
| Tool/MCP integration | `docs/GITHUB_COPILOT_INTEGRATION.md`, MCP code comments, scripts | Low-Medium | No single MCP + tool routing doc previously. |
| Dependency mapping | `docs/reference/REPOSITORY_ANALYSIS.md` | Low-Medium | Some high-level dependency notes; no canonical map file. |
| Sequential reasoning workflow for AI agents | scattered in workflow docs and code comments | Low | Missing dedicated policy doc before this change. |

## Overlap and Duplication Hotspots

- **Architecture overlap**: `README.md`, `docs/reference/REPOSITORY_ANALYSIS.md`, `docs/CouncilContext-Architecture.md`, `docs/ARCHITECTURE_UPDATE.md`.
- **Implementation completion overlap**: multiple `*SUMMARY*`, `*IMPLEMENTATION*`, `*COMPLETE*` files (mostly in `/docs/archive`).
- **Feature docs overlap**: paired naming variants exist (e.g., underscore vs hyphen forms for related topics) and may drift over time.

## Potentially Outdated Zones

Likely historical/outdated candidates (heuristic by naming and placement):
- Most files in `/docs/archive/**`.
- `/docs` root files with suffixes like `SUMMARY`, `IMPLEMENTATION`, `COMPLETE`, `QUICK_REFERENCE`.

Requires Manual Verification:
- Any file describing exact build status, deployment status, or “complete” state before **April 8, 2026**.

## Missing Domains Identified

The following canonical domains were missing before this task:
1. Execution rules
2. Unified architecture model
3. Unified runtime system behavior
4. Refactor safety policy (repo-wide)
5. Dependency map (internal + external)
6. Error pattern registry
7. Tool orchestration model
8. MCP compatibility strategy
9. Sequential reasoning workflow

## Reconciliation Plan

- Keep existing docs intact.
- Add canonical AI-facing docs under `/docs` with explicit ownership per domain.
- Link all canonical docs from `/docs/AI_SYSTEM_INDEX.md`.
- Avoid duplicating details already present in `README.md` and existing reference docs.
