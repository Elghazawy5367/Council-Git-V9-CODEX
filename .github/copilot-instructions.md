# The Council - Copilot Instructions

**The Council** is a React + TypeScript AI orchestration app that queries multiple AI models via OpenRouter and synthesizes their outputs. Built for a solo founder with zero infrastructure costs and includes advanced intelligence/research capabilities.

> Use this file to understand the repo's architecture, coding conventions, key files, and high-level workflows. For detailed developer guides, consult `README.md` and the `docs/` folder.

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript 5.8 + Vite 6
- **State**: Zustand stores (feature-based)
- **Storage**: Dexie (IndexedDB wrapper) + idb-keyval
- **UI**: Radix UI primitives + Tailwind CSS + shadcn/ui
- **AI**: OpenRouter API (usage-based)
- **Routing**: React Router v6
- **Intelligence**: Scout system for GitHub research, Mirror for code quality analysis

### Feature Organization
```
src/
├── features/
│   ├── council/          # Core AI orchestration
│   │   ├── api/          # ai-client.ts (OpenRouter integration)
│   │   ├── components/   # ExpertCard, SynthesisCard, etc.
│   │   ├── hooks/        # useExecuteSynthesis, etc.
│   │   ├── lib/          # types.ts, synthesis logic, persona-library.ts
│   │   └── store/        # Zustand stores (expert, execution, memory)
│   └── settings/         # API key management, synthesis config
├── components/
│   ├── ErrorBoundary.tsx # Production error handling (react-error-boundary)
│   └── primitives/       # Radix UI + shadcn/ui components
├── lib/
│   ├── db.ts            # Dexie schema + migrations
│   ├── synthesis-engine.ts # Multi-tier synthesis strategies
│   ├── config.ts        # System prompts, model configurations
│   ├── scout.ts         # GitHub intelligence extraction system
│   ├── plugin-manager.ts # Extensible plugin architecture
│   └── report-generator.ts # Intelligence reporting
├── plugins/
│   └── core-ai-expert/  # Plugin system for extensible expert types
├── scripts/
│   ├── run-mirror.ts    # Code quality analysis tool
│   ├── quality-pipeline.ts # Automated quality improvement
│   └── validate-architecture.ts # Architecture compliance checking
└── pages/
    └── Index.tsx        # Main Council interface
```

### State Management Pattern
Each feature has its own Zustand store with a consistent pattern:
```typescript
// Example: src/features/council/store/expert-store.ts
export const useExpertStore = create<ExpertState>((set) => ({
  experts: [],
  addExpert: (expert) => set((state) => ({ experts: [...state.experts, expert] })),
  // ... other actions
}));
```

**Key stores:**
- `useExpertStore` - Manages expert configurations and outputs
- `useExecutionStore` - Tracks synthesis execution state
- `useControlPanelStore` - UI state (active expert count, execution mode)
- `useSettingsStore` - API keys, synthesis config (persisted to localStorage)
- `useMemoryStore` - Cross-session persistent memory (IndexedDB via idb-keyval)

**Persona Library**: [src/features/council/lib/persona-library.ts](src/features/council/lib/persona-library.ts)
- 7 pre-configured expert personas (Blue Ocean Strategist, Ruthless Validator, etc.)
- Team presets for common workflows (Opportunity Discovery, Idea Validation)
- Framework-based experts with specific methodologies (ERRC Grid, Mom Test, Bullseye Framework)

## Critical Patterns

### 1. AI Client Architecture
**File**: [src/features/council/api/ai-client.ts](src/features/council/api/ai-client.ts)

The `callExpert()` function handles all OpenRouter API calls:
- Builds system prompts from expert persona + mode behavior
- Supports 4 execution modes: `separated`, `synthesis`, `debate`, `pipeline`
- Pipeline mode includes previous expert outputs in the prompt
- Returns both output text and cost calculations

```typescript
// Always ensure hasWebSearch and modeBehavior defaults
const expertWithDefaults = {
  ...expert,
  hasWebSearch: expert.hasWebSearch ?? false,
  modeBehavior: { ...expert.modeBehavior, isEnabled: true }
};
```

### 2. Database Migrations (Dexie)
**File**: [src/lib/db.ts](src/lib/db.ts)

Uses versioned schema migrations:
```typescript
this.version(2)
  .stores({ experts: "++id, name, role, model, persona" })
  .upgrade(async (tx) => {
    return tx.table("experts").toCollection().modify(expert => {
      if (!expert.persona) expert.persona = `Specialist in ${expert.role}`;
    });
  });
```

**When adding new fields:** Always create a new version and provide an upgrade function.

### 3. Synthesis Strategies
**File**: [src/lib/synthesis-engine.ts](src/lib/synthesis-engine.ts)

Three tiers with different prompt styles:
- **Quick** (⚡): Fast consensus extraction, ~15s
- **Balanced** (🎯): Deduplication + Chain-of-Thought, ~25s
- **Deep** (🔍): Multi-pass refinement, ~45s

Each tier has specific temperature, max tokens, and prompt templates. The actual execution is in `useExecuteSynthesis` hook.

### 4. Error Boundaries
**File**: [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)

Uses `react-error-boundary` library. All app routes wrapped in `<RootErrorBoundary>` in [App.tsx](src/App.tsx). Provides:
- Mobile-friendly fallback UI
- Development-only error stack traces
- Retry and home navigation buttons

### 5. Code Splitting
Lazy-load heavy components:
```typescript
const SettingsModal = lazy(() => import("@/features/settings/components/SettingsModal"));
```

Used for modals and sidebars to reduce initial bundle size (<2MB target).

### 6. Plugin Architecture
**Files**: [src/lib/plugin-manager.ts](src/lib/plugin-manager.ts), [src/plugins/](src/plugins/)

Extensible expert system using plugin pattern:
- Expert plugins implement `ExpertPlugin` interface with `renderConfig`, `execute`, `validateConfig`
- Plugin manager handles registration and lifecycle
- Enables adding new expert types without modifying core code

```typescript
// Register new expert plugin
const myPlugin: ExpertPlugin = {
  id: 'my-expert',
  renderConfig: (config, onChange) => /* React component */,
  execute: async (input, config) => /* AI processing */
};
pluginManager.registerExpertPlugin(myPlugin);
```

## Development Workflow

### Prerequisites
- Node.js 18+ and npm
- `OpenRouter` API key for Council features
- Optional GitHub token for better GitHub API rate limits

### Install
```bash
npm install
```

### Commands
```bash
npm run dev               # Start Vite dev server
npm run typecheck         # TypeScript validation (strict mode enabled)
npm run lint              # ESLint
npm run build             # Production build
npm run mirror            # Code quality analysis
npm run quality           # Mirror + self-improve pipeline
npm run scout             # GitHub intelligence scan
npm run scout:blue-ocean  # Blue Ocean opportunity discovery
```

### TypeScript Strict Mode
**Config**: [tsconfig.json](tsconfig.json)
- `strict: true` enforced
- `noUnusedLocals` and `noUnusedParameters` enabled
- Path aliases: `@/*` → `src/*`, `@features/*` → `src/features/*`

**Rules:**
- No `any` types (use `unknown` or proper types)
- All functions must have explicit return types
- API responses validated with Zod (see `@features/council/lib/types.ts`)

### Council Memory System
**File**: [src/features/council/lib/council-memory.ts](src/features/council/lib/council-memory.ts)
- Cross-session persistent memory using idb-keyval
- Stores insights, patterns, user preferences, domain knowledge
- Automatic relevance scoring and pruning (max 100 entries)
- Memory types: `insight`, `pattern`, `user_preference`, `domain_knowledge`

### Intelligence & Quality Tools
**Scout System**: [src/lib/scout.ts](src/lib/scout.ts)
- GitHub intelligence extraction for market research
- Blue Ocean opportunity discovery via repository analysis
- Commands: `npm run scout`, `npm run scout:blue-ocean`
- Returns: Pain points, product opportunities, emerging trends

**Mirror System**: [scripts/run-mirror.ts](scripts/run-mirror.ts)
- Code quality analysis against elite repository standards
- Generates markdown reports with gaps and suggestions
- Commands: `npm run mirror`, `npm run quality`

**Self-Improve System**: [src/lib/self-improve.ts](src/lib/self-improve.ts)
- Learns patterns from successful GitHub repositories
- Extracts positioning, pricing, features, and architecture patterns
- Generates high-confidence patterns with evidence
- Automatically updates knowledge base markdown files

**Quality Pipeline**: [scripts/quality-pipeline.ts](scripts/quality-pipeline.ts)
- Combines Code Mirror + Self-Improve for automated quality enhancement
- Analyzes gaps and learns patterns in one workflow
- Can auto-apply fixes and generate PRs
- Commands: `npm run quality` (mirror + improve), `npm run improve` (pipeline only)

**Architecture Validation**: [scripts/validate-architecture.ts](scripts/validate-architecture.ts)
- Enforces feature isolation (no cross-feature imports)
- Detects `any` types and architectural violations
- Plugin system compliance checking

### Constraints (Tablet-First)
- **No Docker** - dev container for cloud environments only
- **Vite only** - fast, lightweight, SWC for transpilation
- **Bundle size**: Keep total < 2MB (use lazy loading)
- **Dependencies**: Avoid packages >2MB or native bindings

## Integration Points

### OpenRouter API
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Key stored**: `useSettingsStore().openRouterKey` (encrypted in localStorage via vault system)
- **Cost tracking**: `calculateCost()` in ai-client.ts uses model-specific pricing

### IndexedDB (Dexie)
- **Tables**: `experts`, `sessions`
- **Initialization**: Call `initDatabase()` on app start
- **Schema changes**: Always use versioned migrations in db.ts

### Council Memory System
**File**: [src/features/council/lib/council-memory.ts](src/features/council/lib/council-memory.ts)
- Cross-session persistent memory using idb-keyval
- Stores insights, patterns, user preferences, domain knowledge
- Automatic relevance scoring and pruning (max 100 entries)
- Memory types: `insight`, `pattern`, `user_preference`, `domain_knowledge`

## Intelligence System Workflows

### Code Quality Analysis (Mirror)
```bash
npm run mirror  # Analyze codebase, generate markdown report
```
**Output**: Compares code against elite repo standards, identifies gaps with severity levels
**Typical findings**: Missing error handling, unsafe type usage, performance anti-patterns
**Integration**: Results feed into quality pipeline for improvement recommendations

### GitHub Market Research (Scout)
```bash
npm run scout                    # Full intelligence scan
npm run scout:blue-ocean         # Find abandoned goldmines
npm run scout:report             # Generate actionable report
```
**Output**: Pain points clustered by category, product opportunities ranked by impact/effort ratio, emerging trends
**Data stored**: `data/opportunities/latest.json`, `data/reports/`, `data/intelligence/`

### Self-Improvement Learning
```bash
npm run learn                    # Analyze successful repositories
```
**Output**: High-confidence success patterns with evidence, updates to `src/lib/knowledge-base/`
**Knowledge updated**: positioning, pricing, features, architecture patterns from successful projects

### Full Quality Pipeline
```bash
npm run quality    # Mirror + Learn in one flow (recommended)
npm run improve    # Just the learning/fix generation phase
```
**Workflow**: Analyze current code → Learn from elite repos → Cross-reference findings → Generate PR with fixes
**Output**: Quality report + improvement recommendations + optional PR template

## Common Tasks

### Adding a New Expert Field
1. Update `Expert` interface in [src/features/council/lib/types.ts](src/features/council/lib/types.ts)
2. Create new Dexie version in [src/lib/db.ts](src/lib/db.ts)
3. Add migration logic to populate existing records
4. Update UI components that display experts

### Adding a New Execution Mode
1. Add mode to `ExecutionMode` type in types.ts
2. Update `ModeBehavior` interface with new prompt field
3. Modify `buildSystemPrompt()` in [src/lib/config.ts](src/lib/config.ts)
4. Update `callExpert()` in ai-client.ts to handle mode-specific logic

### Adding a New Radix UI Component
1. Use existing pattern from [src/components/primitives/](src/components/primitives/)
2. Follow shadcn/ui conventions (e.g., `primitives/button.tsx`)
3. Use `class-variance-authority` for variants
4. Export from primitives directory

### Adding a New Expert Plugin
1. Create plugin directory in [src/plugins/](src/plugins/)
2. Implement `ExpertPlugin` interface with required methods
3. Register plugin via `pluginManager.registerExpertPlugin()`
4. Add config component for plugin-specific settings

### Running Intelligence Analysis

See "Intelligence System Workflows" above for detailed command reference.

## Important Files to Reference

- **[src/lib/config.ts](src/lib/config.ts)** - Model configurations, system prompts, execution modes
- **[src/lib/types.ts](src/lib/types.ts)** - Global type definitions (SynthesisConfig, etc.)
- **[src/features/council/lib/types.ts](src/features/council/lib/types.ts)** - Council-specific types (Expert, ModeBehavior)
- **[src/features/council/lib/persona-library.ts](src/features/council/lib/persona-library.ts)** - Pre-configured expert personas and teams
- **[src/lib/scout.ts](src/lib/scout.ts)** - GitHub intelligence extraction and opportunity discovery
- **[src/lib/plugin-manager.ts](src/lib/plugin-manager.ts)** - Plugin system architecture
- **[src/pages/Index.tsx](src/pages/Index.tsx)** - Main UI layout and grid logic

## Conventions

- **File naming**: kebab-case for files, PascalCase for React components
- **Component structure**: `ComponentName.tsx` with default export
- **Hooks**: Prefix with `use`, place in `features/[feature]/hooks/`
- **Types**: Co-locate in `lib/types.ts` within feature, or global in `src/lib/types.ts`
- **Imports**: Use path aliases (`@/` and `@features/`)

## Budget & Philosophy

- **Zero infrastructure costs** - No Firebase, Supabase, AWS, etc.
- **Personal use only** - Single user, no auth/multi-tenancy
- **Usage-based AI** - Pay per API call (OpenRouter)
- **Offline-capable** - IndexedDB for persistence, works without network
- **Solo-maintainable** - Clear patterns, minimal abstractions

## Quality Workflow

**Before major changes:**
1. Run `npm run typecheck` to verify TypeScript compliance
2. Run `npm run lint` to check code quality (watch for `any` types)
3. Run `npm run quality` for architecture validation
4. Use `scripts/validate-architecture.ts` for feature isolation compliance

**Error Resolution Pattern:**
- TypeScript errors block commits (strict mode)
- Fix `any` types immediately (architectural requirement)
- Plugin system prevents tight coupling between features
- Use incremental migration patterns for safe refactoring

## Recent Additions (Jan 7, 2026)

### Intelligence Systems
**Code Mirror** - Analyzes code quality against elite repository standards
**Scout** - GitHub intelligence extraction for market research and Blue Ocean opportunities
**Self-Improve** - Learns patterns from successful repositories in any niche
**Quality Pipeline** - Combines Mirror analysis with Self-Improving for automated improvements

These systems enable the Council to improve its own decision-making by analyzing what works in the broader ecosystem.

## Critical Gotchas

**Database Migrations**: If you modify any data structure used by Dexie stores:
1. Never mutate existing version numbers
2. Create a new `.version(N+1)` entry
3. Provide an `.upgrade()` function to migrate old data
4. Test migrations against both empty and populated databases

**TypeScript Strict Mode**: The app enforces `strict: true`. Common violations:
- Using `any` anywhere (this will fail CI) - use `unknown` instead
- Missing return types on exported functions
- Unhandled null/undefined in optional chains

**Feature Isolation**: Strictly no cross-feature imports except:
- Shared types from `@/lib/types.ts`
- Global utilities from `@/lib/utils.ts`
- Violating this triggers architecture validation errors

**Store Initialization**: Always call `initDatabase()` in `main.tsx` on app startup before rendering. The Dexie database won't work correctly without this.

---

**Last Updated**: January 7, 2026  
**For questions on patterns**: Check existing implementation in `src/features/council/` before creating new patterns.  
**Need to add something?**: Ask yourself: "Does this already exist in `src/features/council/`?" If yes, reuse it. If no, follow the patterns exactly.
