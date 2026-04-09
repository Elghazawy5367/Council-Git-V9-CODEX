# Architecture v5 Spec (Merged Outline)

Purpose: single, non-duplicative architecture outline that merges the strongest parts of these sources:
- `README.md` (high-level product/system flow)
- `docs/reference/REPOSITORY_ANALYSIS.md` (repo organization + risk lens)
- `docs/CouncilContext-Architecture.md` (deep runtime/state flow)
- `docs/ARCHITECTURE.md` (canonical boundaries + entry points)

---

## 0) Scope and Source-of-Truth Rules

- This file is the canonical architecture outline.
- `README.md` remains product/onboarding focused and links here for technical architecture details.
- `docs/CouncilContext-Architecture.md` remains a subsystem deep-dive reference for council execution internals only.
- `docs/reference/REPOSITORY_ANALYSIS.md` is historical snapshot/reference (not canonical for current state).

---

## 1) System Context (L1)

### 1.1 Product-Level Mission
- Multi-expert AI intelligence platform for opportunity discovery and synthesis.

### 1.2 End-to-End Capability Flow
```text
User Input / Config
  → Intelligence Gathering (Scout/Reddit/HN/Goldmine/etc.)
  → Expert Deliberation (Phase 1)
  → Judge Synthesis (Phase 2)
  → Reports / Decisions / Historical Analytics
```

### 1.3 Architecture Principles
- Feature modularity with shared service/lib layers.
- Safe incremental evolution with compatibility wrappers.
- Runtime boundary safety (browser vs Node/tooling).

---

## 2) Repository and Runtime Topology (L2)

### 2.1 Directory Topology (canonical)
```text
src/
  main.tsx               # bootstrap
  App.tsx                # providers + routing
  pages/                 # route-level views
  features/              # domain modules
  stores/                # unified Zustand stores
  services/              # business orchestration
  lib/                   # shared integrations/utilities/MCP
  components/            # shared UI primitives/layout
  contexts/              # React providers
  plugins/               # pluggable expert extensions
scripts/                 # automation + intelligence runners
config/                  # niche/feature config
knowledge/               # knowledge inputs
data/                    # generated reports/artifacts
docs/                    # canonical + reference docs
```

### 2.2 Entry Points
- App bootstrap: `src/main.tsx`
- App composition + route map: `src/App.tsx`
- Primary runtime route: `src/pages/Index.tsx`
- MCP runtime: `scripts/run-mcp-server.ts` + `src/lib/mcp-servers/index.ts`

---

## 3) Execution and State Architecture (L3)

### 3.1 Runtime Boot Lifecycle
```text
main.tsx
  → protection/init guards
  → DB init (background)
  → root render with providers/boundaries
  → lazy route loading via App.tsx
```

### 3.2 Council Two-Phase Execution Model
```text
Phase 1: Expert execution (parallel baseline)
  Inputs: task + active experts + settings
  Outputs: per-expert responses + status + cost

Phase 2: Judge synthesis
  Inputs: phase-1 outputs + judge mode + synthesis config
  Outputs: synthesis result + verdict + persisted decision
```

### 3.3 State Ownership Model
- UI/feature components dispatch actions/selectors.
- Unified stores hold shared execution/UI state.
- Service layer executes orchestration and external calls.
- Legacy feature stores are compatibility wrappers during migration.

### 3.4 Error and Recovery Behavior
- Prefer partial-failure isolation across expert/API calls.
- Preserve UI responsiveness during non-critical subsystem failures.
- Route high-severity failures to boundaries/toast + retry paths.

---

## 4) Module Boundaries and Contracts (L4)

### 4.1 Boundary Rules
- `features/*`: domain-specific UI + domain state wiring.
- `stores/*`: global shared state contracts.
- `services/*`: workflow/business logic (no view logic).
- `lib/*`: low-level integration/utilities (reusable primitives).
- `plugins/*`: typed extension points for expert behavior.

### 4.2 Interface Stability Contracts
Treat as stability-sensitive:
- Route definitions
- Store APIs (including wrapper compatibility)
- Script command names
- MCP tool names/contracts

### 4.3 Dependency Direction
```text
components/pages/features
  → stores
    → services
      → lib clients/adapters
        → external APIs / data stores
```

---

## 5) Integration Architecture (L5)

### 5.1 External Integrations
- OpenRouter/model APIs (expert and synthesis calls)
- GitHub APIs (scout/repo intelligence)
- Reddit sources (pain/buying signal extraction)
- Optional memory/vector backends (Qdrant patterns)

### 5.2 MCP and Tooling Integration
- MCP server composes tool registries by domain.
- Tool names are treated as public contracts once published.
- Scripts provide reproducible automation entry points.

### 5.3 Data Lifecycle
```text
Task/Input
  → external fetch + expert analysis
  → normalized outputs in stores/services
  → persistence/history/report generation
  → analytics/dashboard consumption
```

---

## 6) Risk Register (Architecture-Level)

### 6.1 Structural Risks
- Large concentration files (>500 LOC) in critical runtime paths.
- Transitional drift between unified stores and deprecated wrappers.
- Documentation drift between canonical docs and historical snapshots.

### 6.2 Dependency Risks
- SDK/API shape and rate-limit volatility.
- Browser bundling of Node-only libraries if boundary controls regress.

### 6.3 Operational Risks
- Environment-variable/token variability across scripts and tools.
- Non-deterministic external data quality affecting workflow outputs.

---

## 7) Quality Gates and Validation (Architecture Changes)

### 7.1 Required Checks
- `npm run typecheck`
- `npm run build` for runtime-impacting architecture changes
- Targeted script checks when script/tool contracts change

### 7.2 Architecture Change Checklist
- Boundary ownership unchanged or explicitly migrated.
- Contract changes documented with migration path.
- No duplicate domain docs created.
- Canonical index links updated.

---

## 8) Documentation Map (No Duplication Policy)

- Canonical:
  - `docs/ARCHITECTURE.md` (compact canonical map)
  - `docs/ARCHITECTURE_V5_SPEC.md` (this merged outline)
- Deep-dive:
  - `docs/CouncilContext-Architecture.md` (council runtime internals)
- Historical/reference:
  - `docs/reference/REPOSITORY_ANALYSIS.md`
- Product/onboarding:
  - `README.md`

---

## 9) Suggested Next Step (Optional)

If approved, promote this outline into:
- `docs/ARCHITECTURE.md` as the primary expanded canonical architecture spec,
- while preserving old `docs/ARCHITECTURE.md` as archived or condensed pointer.
