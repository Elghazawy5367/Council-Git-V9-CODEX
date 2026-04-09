# Dependency Map

## Internal Dependency Graph (high-level)

```text
main.tsx
  └─ App.tsx
      ├─ pages/*
      ├─ components/layout/*
      └─ feature components
            └─ feature stores / unified stores
                 └─ services/*
                      └─ lib/* integration clients
                           └─ external APIs
```

## Key Internal Chains

1. `src/main.tsx` → app bootstrap/protection/db initialization.
2. `src/App.tsx` → route-level composition and lazy loading.
3. `src/stores/council.store.ts` ↔ `src/services/council.service.ts` (core council execution chain).
4. `src/lib/mcp-servers/index.ts` → GitHub/Reddit/Memory tool registries.
5. `scripts/*.ts` → direct service/lib execution for automation pipelines.

## External Dependencies (critical)

- **Runtime UI**: React, React Router, Zustand, TanStack Query, Radix UI, Tailwind.
- **Build**: Vite, TypeScript, SWC plugin.
- **AI/Integrations**: OpenRouter API clients, Octokit (GitHub), Reddit JSON access patterns.
- **MCP**: `@modelcontextprotocol/sdk`.
- **Storage/Vector**: Dexie, Qdrant client.

## High-Risk Dependency Areas

- External API SDK/version behavior changes (`@octokit/*`, MCP SDK).
- Tooling scripts that depend on environment variables/tokens.
- Browser bundle safety around Node-only packages (guarded in `vite.config.ts`).

## Circular Dependency Scan (heuristic)

- A local import graph scan did **not** identify multi-file circular chains in `src`.
- Potential self-reference anomalies were detected and require manual spot-checking if touched.

## Redundant Utility / Dead-Code Candidates (heuristic)

Requires Manual Verification:
- Similar-named legacy/new modules (e.g., v1/v2 variants) may overlap in responsibility.
- Historical or demo/example modules may not be part of active runtime paths.
- Archive docs and attached assets are intentionally non-runtime artifacts.
