# Architecture Model

## Repository Structure (functional areas)

```text
.
├── src/
│   ├── main.tsx                    # runtime bootstrap
│   ├── App.tsx                     # router + top-level providers
│   ├── pages/                      # route-level pages
│   ├── features/                   # domain modules (council, automation, dashboard, devtools, settings)
│   ├── stores/                     # unified Zustand stores
│   ├── services/                   # business/service layer
│   ├── lib/                        # shared runtime, integrations, MCP servers, utilities
│   ├── components/                 # reusable UI + primitives
│   ├── contexts/                   # React context providers
│   └── plugins/                    # plugin extension points
├── scripts/                        # CLI automation/intelligence workflows
├── config/                         # YAML configuration for niches/features
├── docs/                           # guides, references, canonical AI docs
├── knowledge/                      # external knowledge inputs
└── data/                           # generated reports/artifacts
```

## Entry Points

- **Web app entry**: `src/main.tsx`
- **App composition**: `src/App.tsx`
- **Primary route component**: `src/pages/Index.tsx`
- **Tooling/runtime scripts**: `scripts/*.ts` via `package.json` scripts
- **MCP server entry**: `scripts/run-mcp-server.ts` using `src/lib/mcp-servers/index.ts`

## Module Boundaries

- `features/*`: domain-specific UI + state + helpers.
- `stores/*`: unified global stores and compatibility target for deprecated feature stores.
- `services/*`: operational logic (API orchestration, synthesis, intelligence workflows).
- `lib/*`: shared low-level utilities and external integration clients.
- `plugins/*`: pluggable expert extensions with typed interfaces.

## State Flow (high level)

```text
UI Components
   ↓ (actions/selectors)
Zustand Stores (src/stores)
   ↓
Service Layer (src/services)
   ↓
Integration Clients (src/lib/*, feature API clients)
   ↓
External APIs (OpenRouter, GitHub, Reddit, etc.)
```

## UI Layer Mapping

- Layout shell: `src/components/layout/*`
- Route pages: `src/pages/*`
- Domain screens: `src/features/*/components/*`
- Shared primitives: `src/components/primitives/*`

## Plugin Model

- Plugin contracts: `src/lib/plugins.ts`
- Plugin registration lifecycle: `src/lib/plugin-manager.ts`
- Built-in plugin example: `src/plugins/core-ai-expert/`

## Build Tooling and Runtime Modules

- Vite + React SWC build pipeline (`vite.config.ts`).
- TypeScript strict config (`tsconfig*.json`).
- Browser build excludes Node-only packages in Vite config to prevent bundling runtime conflicts.

## Architecture Risks (observed)

- Large concentration files in `src/lib/*` and some feature components (>500 LOC) increase review/test risk.
- Transition state between deprecated feature stores and unified stores can drift if not documented during edits.
- Mixed app/runtime + script/runtime modules require careful Node vs browser boundary enforcement.
