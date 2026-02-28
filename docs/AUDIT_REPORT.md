# Council-Git-V9 — End-to-End Audit Report

**Generated:** 2026-02-28  
**Repository:** https://github.com/Elghazawy5367/Council-Git-V9  
**Auditor:** GitHub Copilot Coding Agent  

---

## Table of Contents

1. [Project Structure Mapping](#1-project-structure-mapping)
   - [1.1 Frontend Framework & Tech Stack](#11-frontend-framework--tech-stack)
   - [1.2 CSS / Styling Approach](#12-css--styling-approach)
   - [1.3 State Management](#13-state-management)
   - [1.4 Routing Architecture](#14-routing-architecture)
   - [1.5 API Layer](#15-api-layer)
   - [1.6 Authentication & Authorization](#16-authentication--authorization)
   - [1.7 Database / Storage Layer](#17-database--storage-layer)
   - [1.8 Third-Party Packages](#18-third-party-packages)
   - [1.9 Folder Tree Summary](#19-folder-tree-summary)
2. [Dashboard Inventory](#2-dashboard-inventory)
   - [2.1 Index / Council Workspace (`/`)](#21-index--council-workspace-)
   - [2.2 Council Workflow (`/council`)](#22-council-workflow-council)
   - [2.3 Automation Dashboard (`/features`)](#23-automation-dashboard-features)
   - [2.4 Quality Dashboard (`/quality`)](#24-quality-dashboard-quality)
   - [2.5 Scout Config (`/features/scout`)](#25-scout-config-featuresscout)
   - [2.6 Analytics Dashboard (embedded)](#26-analytics-dashboard-embedded)
3. [Technical Debt Assessment](#3-technical-debt-assessment)
   - [3.1 Deprecated / Risky Libraries](#31-deprecated--risky-libraries)
   - [3.2 Hardcoded Values & Magic Numbers](#32-hardcoded-values--magic-numbers)
   - [3.3 Responsiveness & Mobile-Friendliness](#33-responsiveness--mobile-friendliness)
   - [3.4 Accessibility (WCAG 2.1 AA)](#34-accessibility-wcag-21-aa)
   - [3.5 Performance Bottlenecks](#35-performance-bottlenecks)
   - [3.6 Missing Error / Loading / Empty States](#36-missing-error--loading--empty-states)
   - [3.7 Duplicated & Dead Code](#37-duplicated--dead-code)
   - [3.8 Security Vulnerabilities](#38-security-vulnerabilities)
4. [Severity Matrix Summary](#4-severity-matrix-summary)
5. [Modernization Recommendations](#5-modernization-recommendations)

---

## 1. Project Structure Mapping

### 1.1 Frontend Framework & Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 (strict mode) |
| Build Tool | Vite | 6.4.1 (SWC transpiler) |
| UI Components | Radix UI primitives + shadcn/ui | various |
| Icons | Lucide React | 0.462.0 |
| Charts | Recharts | 2.15.4 |
| Diagrams | Mermaid | 10.9.5 |
| Markdown | react-markdown + DOMPurify | 10.1.0 / 3.3.1 |
| AI Backend | OpenRouter API | usage-based |

**Framework Version:** React 18 with concurrent features enabled via `createRoot`. SWC is used for transpilation (faster than Babel). TypeScript strict mode is enforced (`strict: true`, `noUnusedLocals`, `noUnusedParameters`).

### 1.2 CSS / Styling Approach

| Aspect | Detail |
|--------|--------|
| Primary CSS | Tailwind CSS 3.4 |
| Design Tokens | HSL CSS variables in `src/index.css` |
| Component Variants | `class-variance-authority` (CVA) |
| Animation | `tailwindcss-animate` |
| Typography | `@tailwindcss/typography` plugin |
| Fonts | Google Fonts — Space Grotesk + JetBrains Mono (runtime import) |
| Theme | Dark-only glassmorphism (purple/blue gradients) — no light-mode support |
| Inline Styles | 10 instances across codebase (low) |

**Design System:** Custom dark theme with CSS variables (`--primary: 262 83% 58%`, `--background: 222 47% 4%`). Glass-morphism pattern (`glass-panel` utility class with backdrop-blur and border opacity). Custom gradient tokens for cards and text.

### 1.3 State Management

The application uses **Zustand v5** with a layered store architecture:

| Store File | Scope | Persistence |
|-----------|-------|-------------|
| `src/stores/council.store.ts` | Unified: experts, execution, control panel | Session memory only |
| `src/features/council/store/expert-store.ts` | Expert list management | Session |
| `src/features/council/store/execution-store.ts` | Execution phase & outputs | Session |
| `src/features/council/store/control-panel-store.ts` | Task, mode, activeExpertCount | Session |
| `src/features/council/store/memory-store.ts` | Cross-session AI memory | IndexedDB via idb-keyval |
| `src/features/council/store/feature-config-store.ts` | Automation feature configs | localStorage via Zustand persist |
| `src/features/settings/store/settings-store.ts` | API keys, synthesis config, vault | localStorage via Zustand persist |
| `src/features/dashboard/store/dashboard-store.ts` | Analytics decision records | Dexie IndexedDB |
| `src/stores/analytics.store.ts` | Aggregated analytics metrics | Session |
| `src/stores/ui.store.ts` | Global UI state | Session |

**Architectural note:** A refactored slice-based architecture exists in `src/stores/slices/` (four slices: `council-control`, `council-execution`, `council-experts`, `council-ui`) and a composed store at `src/stores/council.store.refactored.ts`, but the app still imports from the original `council.store.ts`. The refactored version is unused dead code.

Additionally, `@tanstack/react-query` v5 is used for server-state management (synthesis API calls via `useExecuteSynthesis` hook).

### 1.4 Routing Architecture

**Client-side routing** via React Router v6 with `HashRouter` (hash-based for GitHub Pages compatibility).

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `pages/Index.tsx` | Main Council workspace |
| `/council` | `features/council/components/CouncilWorkflow.tsx` | Full workflow view |
| `/features` | `pages/AutomationDashboard.tsx` | Automation features management |
| `/quality` | `pages/QualityDashboard.tsx` | Code quality metrics |
| `/features/scout` | `pages/features/ScoutConfig.tsx` | Scout intelligence config |
| `*` | `pages/NotFound.tsx` | 404 fallback |

All routes are **lazy-loaded** via `React.lazy()` + `Suspense` for code splitting. A `PageLoader` spinner is shown during load. `HashRouter` is used because the app deploys to GitHub Pages (no server-side routing support).

**Note:** `pages/Dashboard.tsx` and `pages/FeaturesDashboard.tsx` exist as files but are **not registered in any route** — they are orphaned pages.

### 1.5 API Layer

| API | Purpose | Integration Point |
|-----|---------|-------------------|
| OpenRouter API | LLM inference for all AI experts | `src/features/council/api/ai-client.ts` |
| GitHub REST API (Octokit) | Stargazer, Goldmine, Fork Evolution, Trending | `src/services/github-api.service.ts`, various `src/lib/*.ts` |
| Reddit Public JSON API | Reddit Sniper, Reddit Pain Points | `src/services/reddit.service.ts`, `src/lib/reddit-*.ts` |
| HackerNews Algolia API | HackerNews intelligence | `src/lib/hackernews-intelligence.ts` |
| Serper / Google Search | Web search for expert personas | `src/features/council/api/ai-client.ts` (optional) |

**OpenRouter endpoint:** `https://openrouter.ai/api/v1/chat/completions` (non-streaming and streaming modes supported). API key stored in encrypted vault (`src/features/council/lib/vault.ts`) and in `useSettingsStore`.

**Cost tracking:** `calculateCost()` in `ai-client.ts` uses per-model pricing from `MAGNIFICENT_7_FLEET` config array.

### 1.6 Authentication & Authorization

**No user authentication system.** This is a single-user personal tool.

**API key security:** A custom vault system (`src/features/council/lib/vault.ts`) encrypts API keys (OpenRouter, GitHub, Reddit, Serper) using a user-supplied password. Keys stored in encrypted form in `localStorage`. Session keys held in memory only.

**Access model:** All routes are publicly accessible — no role-based access control (RBAC) needed for single-user scenario.

### 1.7 Database / Storage Layer

| Store | Technology | Schema |
|-------|-----------|--------|
| Structured data | Dexie (IndexedDB) | `CouncilDatabase` — tables: `experts`, `sessions`, `decisionRecords` |
| AI memory | idb-keyval (IndexedDB) | Key-value pairs for `CouncilMemory` entries |
| Settings / API config | Zustand persist → localStorage | JSON serialized store state |
| Feature configs | Zustand persist → localStorage | `FeatureConfigStore` state |
| Synthesis cache | Custom IndexedDB cache | `synthesis-cache.ts` |

**Dexie schema versions:**
- v1: `experts`, `sessions`
- v2: Added `persona` field to `experts` + migration
- v3: Added `decisionRecords` analytics table

### 1.8 Third-Party Packages

**Production dependencies (key packages):**

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `react` | 18.3.1 | UI framework | Low |
| `zustand` | 5.0.9 | State management | Low |
| `@tanstack/react-query` | 5.90.20 | Server state | Low |
| `dexie` | 4.2.1 | IndexedDB ORM | Low |
| `react-router-dom` | 6.30.1 | Client routing | Low |
| `recharts` | 2.15.4 | Charts | Low |
| `mermaid` | 10.9.5 | Diagram rendering | Medium (large bundle, XSS surface) |
| `dompurify` | 3.3.1 | HTML sanitization | Low |
| `react-markdown` | 10.1.0 | Markdown rendering | Low |
| `@octokit/rest` | 22.0.1 | GitHub API client | Low |
| `docx` | 9.5.1 | DOCX export | Low |
| `ts-morph` | 27.0.2 | AST manipulation (scripts) | Low |
| `@babel/parser` + `@babel/traverse` | 7.28.6 | Code analysis (scripts) | Low |
| `glob` | 13.0.3 | File globbing | Low |
| `husky` + `lint-staged` | 9.1.7 / 16.2.7 | Git hooks | Low |
| `react-day-picker` | 8.10.1 | Date picker | Low |
| `next-themes` | 0.3.0 | Theme switching | Low — but unused (dark-only) |
| `react-helmet` | 6.1.0 | HTML head management | **Medium** — deprecated, use `react-helmet-async` |

**Dev dependencies:**
- `vite` 6.4.1 + `@vitejs/plugin-react-swc` 3.11.0 — modern, low risk
- `typescript` 5.8.3 — current
- `eslint` 9.32.0 + `typescript-eslint` 8.38.0 — current
- `gh-pages` 6.3.0 — GitHub Pages deployment
- `tsx` 4.21.0 — TypeScript execution for scripts

### 1.9 Folder Tree Summary

```
Council-Git-V9/
├── src/
│   ├── App.tsx                          # Root: routing, providers
│   ├── main.tsx                         # Entry point, DB init
│   ├── index.css                        # Global design tokens (Tailwind + CSS vars)
│   ├── components/
│   │   ├── ErrorBoundary.tsx            # React error boundaries
│   │   ├── EmptyState.tsx               # NoExpertsEmptyState
│   │   ├── LayoutDebugger.tsx           # Dev-only layout debug overlay
│   │   ├── MobileMenu.tsx               # Mobile nav drawer
│   │   └── primitives/                  # ~40 shadcn/ui components
│   ├── contexts/
│   │   └── CouncilContext.tsx           # React context (re-export of store)
│   ├── features/
│   │   ├── council/                     # Core AI orchestration feature
│   │   │   ├── api/ai-client.ts         # OpenRouter integration
│   │   │   ├── components/              # 18 components (Header, ControlPanel, ExpertCard, etc.)
│   │   │   ├── hooks/                   # useExecuteSynthesis, useStreamingSynthesis, useSessionHistory
│   │   │   ├── lib/                     # types, council-memory, persona-library, vault, export, persistence
│   │   │   └── store/                   # 5 Zustand stores
│   │   ├── automation/                  # Automation features dashboard
│   │   │   ├── components/              # FeaturesDashboard, FeatureCard, FeatureConfigModal, ReportsViewer
│   │   │   ├── constants/               # feature-definitions.ts
│   │   │   ├── lib/                     # execution-engine, api clients, feature implementations
│   │   │   ├── store/                   # features-store, reports-store
│   │   │   └── types/                   # feature.types.ts
│   │   ├── dashboard/                   # Analytics dashboard
│   │   │   ├── components/              # DashboardLayout, MetricCard, DecisionTimeline, etc.
│   │   │   └── store/                   # dashboard-store.ts
│   │   └── settings/                    # Settings feature
│   │       ├── components/              # SettingsModal, SynthesisCacheStats
│   │       └── store/                   # settings-store.ts
│   ├── hooks/                           # use-mobile, use-toast, useCommunityIntelligence, useGitHub
│   ├── lib/                             # ~40 shared utilities & intelligence modules
│   ├── pages/                           # 6 page components (Index, AutomationDashboard, QualityDashboard, etc.)
│   ├── plugins/                         # core-ai-expert plugin
│   ├── services/                        # council.service, github.service, openrouter, reddit, ruthless-judge
│   └── stores/                          # Legacy + refactored Zustand stores
├── scripts/                             # ~25 Node.js intelligence scripts (tsx)
├── config/
│   └── target-niches.yaml               # Multi-niche Scout configuration
├── docs/                                # Documentation (100+ files)
├── data/                                # Generated intelligence reports, opportunities
├── prompts/                             # Fabric prompt templates + system prompts
├── knowledge/                           # Domain knowledge markdown files
└── .github/workflows/                   # 18 GitHub Actions CI/CD workflows
```

---

## 2. Dashboard Inventory

### 2.1 Index / Council Workspace (`/`)

**File:** `src/pages/Index.tsx`  
**Purpose:** Primary multi-expert AI decision engine interface.

**Layout:**
- 3-column grid (1/3 left panel + 2/3 right panel)
- Left: ControlPanel + VerdictPanel
- Right: ExpertCard grid (responsive: 1→2→3 cols) + SynthesisCard

**Components rendered:**
| Component | Description |
|-----------|-------------|
| `Header` | Logo, nav links (Automation, Quality), Settings/History/Memory toggles, cost tracker, vault status |
| `ControlPanel` | Task input textarea, file upload, expert count slider (1–N), execution mode tabs (parallel/consensus/adversarial/sequential), judge mode selector, Phase 1 & Phase 2 execution buttons |
| `VerdictPanel` | Live verdict display after synthesis completes; Copy + Expand dialog |
| `ExpertCard` (×N) | Per-expert card: name, model selector, persona editor, temperature/tokens sliders, web-search toggle, knowledge file upload, output display with SafeMarkdown rendering |
| `SynthesisCard` | Synthesis/judge output with tier selector (quick/balanced/deep), synthesis model selector, custom instructions, copy |
| `SettingsModal` (lazy) | API key vault management, synthesis config, model selection |
| `HistoryPanel` (lazy) | Session history sidebar with past decisions |
| `MemoryPanel` (lazy) | AI memory browser — view/delete cross-session memory entries |

**Data sources:**
- `useCouncilStore` — task, experts, execution state, synthesis result
- `useControlPanelStore` — activeExpertCount, mode
- `useSettingsStore` — vault status, showSettings, synthesis config
- `useExpertStore` — experts array
- `useExecutionStore` — cost, outputs, verdict, status
- OpenRouter API (on Phase 1 execution)

**Current interactivity level:** Highly interactive — real-time LLM streaming, file upload, persona configuration, multi-phase execution, drag-and-drop knowledge files.

**Charts/KPIs:** None directly — cost badge in header (total `$X.XXXX`), memory entry count badge.

**User roles:** Single-user (no auth).

---

### 2.2 Council Workflow (`/council`)

**File:** `src/features/council/components/CouncilWorkflow.tsx`  
**Purpose:** Alternative full-screen council workflow view (alternate layout of the same core interaction).

**Components:** Uses `CouncilContext` (wraps the same stores). Renders `InputPanel`, expert grid, `JudgeSection`, `LLMResponseCard`.

**Data sources:** Same as Index — `CouncilContext` / Zustand stores.

**Interactivity:** Same as Index workspace.

**Note:** Contains two `// TODO: Implement` comments (retry logic, feedback tracking).

---

### 2.3 Automation Dashboard (`/features`)

**File:** `src/pages/AutomationDashboard.tsx`  
**Purpose:** Unified control center for 14 intelligence-gathering automation features.

**Layout:** Card grid of feature tiles + Opportunities panel (GoldmineDetector).

**Features managed:**

| Feature ID | Name | Data Source | Schedule |
|------------|------|-------------|----------|
| `scout` | Phantom Scout | GitHub API | Every 8 hours |
| `mirror` | Code Mirror | Local codebase | On-demand |
| `quality` | Quality Pipeline | Mirror + Self-Improve | On-demand |
| `self-improve` | Self-Improve | GitHub API | On-demand |
| `github-trending` | GitHub Trending | GitHub API | Daily |
| `market-gap` | Market Gap Identifier | GitHub + Reddit | Weekly |
| `reddit-sniper` | Reddit Sniper | Reddit JSON API | Daily |
| `reddit-pain-points` | Reddit Pain Points | Reddit JSON API | Daily |
| `viral-radar` | Viral Radar | Twitter / TikTok / Reddit | Daily |
| `hacker-news` | HackerNews Intelligence | HN Algolia API | Daily |
| `twin-mimicry` | Twin Mimicry | GitHub API | Weekly |
| `fork-evolution` | Fork Evolution | GitHub API | Weekly |
| `prompt-heist` | Prompt Heist | Web scraping | Weekly |
| `stargazer-analysis` | Stargazer Analysis | GitHub API | Monthly |

**Components rendered:**
| Component | Description |
|-----------|-------------|
| Feature cards | Status indicator, schedule, last-run timestamp, trigger button |
| `MiningDrillPanel` | Deep GitHub repository excavation |
| `GoldmineDetector` | Displays pre-computed product opportunities from `data/opportunities/` |
| `FeatureConfigModal` (lazy) | Per-feature configuration dialog |

**KPIs / Widgets:**
- Feature status badges (idle/scheduled/active)
- Opportunities count from `loadAllOpportunities()`
- Next-run schedule display (parsed CRON expressions)

**Data sources:**
- `useFeatureConfigStore` — feature config objects
- `loadAllOpportunities()` — reads `data/opportunities/latest.json` via fetch
- GitHub Actions API (workflow dispatch triggers)
- `getSessionKeys()` — vault API keys

**Interactivity:** Click to configure, click to trigger workflows via GitHub Actions API, view generated reports.

---

### 2.4 Quality Dashboard (`/quality`)

**File:** `src/pages/QualityDashboard.tsx`  
**Purpose:** Code quality monitoring — displays pipeline reports, patterns learned from successful repos.

**Layout:** Tabs (Overview, Patterns, Improvements, History) with cards and progress bars.

**Widgets / KPIs:**
| Widget | Data |
|--------|------|
| Average Code Quality Score | `pipelineReport.codeAnalysis.averageScore` (0–100) |
| Critical Issues Count | `pipelineReport.codeAnalysis.criticalIssues` |
| Files Needing Work | `pipelineReport.codeAnalysis.filesNeedingWork` |
| Total Files Analyzed | `pipelineReport.codeAnalysis.totalFiles` |
| Patterns Discovered | `pipelineReport.learningResults.patternsDiscovered` |
| High-Confidence Patterns | `pipelineReport.learningResults.highConfidencePatterns` |
| Recommendations list | Array of strings |
| Score History chart | Recharts line chart of last 10 pipeline runs |
| Success Patterns table | Category, pattern text, confidence %, source repos |

**Data sources:**
- `GET /logs/quality-pipeline-report.json` — pipeline report (static file served from `dist`)
- Mock patterns data (hardcoded `SuccessPattern[]` array in component — **technical debt**)
- No real-time data — snapshot-based from last pipeline run

**Interactivity:** Tab navigation, date range filter (planned, not yet implemented).

**Charts:** Recharts `LineChart` for score history, `Progress` bars for quality scores, confidence %, pattern distribution.

---

### 2.5 Scout Config (`/features/scout`)

**File:** `src/pages/features/ScoutConfig.tsx`  
**Purpose:** Configuration UI for Phantom Scout multi-niche intelligence system.

**Layout:** Form for niche configuration, keyword management, GitHub topic lists.

**Data sources:** `useFeatureConfigStore` → scout config slice. YAML config (`config/target-niches.yaml`) read by scripts.

**Interactivity:** Add/remove keywords, configure niches, save configuration.

---

### 2.6 Analytics Dashboard (embedded)

**File:** `src/features/dashboard/components/DashboardLayout.tsx`  
**Note:** This dashboard is **not mounted in any route** — it is an orphaned component. It is not accessible to users.

**Purpose (as designed):** Council decision analytics.

**Widgets / KPIs:**
| Component | Metric |
|-----------|--------|
| `MetricCard` ×4 | Total Decisions, Avg Duration, Total Cost ($), Success Rate |
| `DecisionTimeline` | Timeline of recent AI council decisions |
| `ModeDistribution` | Pie/bar chart of execution mode usage (parallel/consensus/adversarial/sequential) |
| `CostAnalytics` | Cost breakdown over time (Recharts area chart) |
| `ExpertPerformance` | Per-expert performance comparison |
| `HistoricalView` | Historical decision records table with filtering |

**Data sources:** `useDashboardStore` → Dexie `decisionRecords` table.

**Interactivity:** Date range filter (7d/30d/90d/all), clear data button.

**Severity:** **High** — this entire analytics dashboard is built and functional but unreachable due to missing route registration.

---

## 3. Technical Debt Assessment

### 3.1 Deprecated / Risky Libraries

| Severity | Package | Issue | Recommendation |
|----------|---------|-------|----------------|
| **Medium** | `react-helmet` 6.1.0 | Deprecated. Known memory leak in React concurrent mode; no active maintenance. | Replace with `react-helmet-async` or native React 18 `<title>` management |
| **Medium** | `next-themes` 0.3.0 | Installed but dark-mode is hardcoded — light theme not implemented. CSS `@media` prefers-color-scheme not respected. | Either implement light theme or remove the dependency |
| **Low** | `embla-carousel-react` 8.6.0 | Imported in primitives but no carousel UI surfaces are visible in any page. | Audit usage; remove if unused |
| **Low** | `input-otp` 1.4.2 | OTP input component — no OTP flows exist in the app. | Remove if unused |
| **Low** | `react-day-picker` 8.10.1 | V8 — v9 is current; v8 has known TypeScript issues. | Upgrade to v9 |

### 3.2 Hardcoded Values & Magic Numbers

| Severity | Location | Issue |
|----------|---------|-------|
| **Medium** | `src/stores/analytics.store.ts:81` | `expertConsensusRate: 85` — hardcoded TODO, should be calculated from actual `decisionRecords` |
| **Medium** | `src/lib/viral-radar.ts:21` | `MIN_SCORE_HACKERNEWS = 50` — unexplained magic number with no config mechanism |
| **Low** | `src/lib/config.ts` | Model pricing (`costPer1k`) values for all 9 models hardcoded — will drift as OpenRouter changes pricing |
| **Low** | `src/lib/synthesis-engine.ts` | `estimatedCost: "$0.0003"` etc. are display strings, not computed values |
| **Low** | `src/features/council/store/control-panel-store.ts` | `activeExpertCount` initial value — needs to stay in sync with `DEFAULT_EXPERTS.length` |
| **Low** | Multiple dashboard stores | Date range calculations use `24 * 60 * 60 * 1000` inline — should use `date-fns` (already a dependency) |

### 3.3 Responsiveness & Mobile-Friendliness

| Severity | Area | Issue |
|----------|------|-------|
| **Medium** | `src/pages/Index.tsx` | 3-column grid layout on desktop (`lg:grid-cols-3`) degrades to single column on mobile, but expert cards (`sm:grid-cols-2`) can crowd on small screens with 3+ experts |
| **Medium** | `src/features/dashboard/components/DashboardLayout.tsx` | Analytics dashboard header uses `flex-col md:flex-row` — functional but the tab strip (`TabsList`) has no scroll on narrow viewports, clipping tab labels |
| **Low** | `src/components/MobileMenu.tsx` | Mobile menu exists and is rendered in Header — basic drawer/sheet pattern is correct |
| **Low** | `src/pages/AutomationDashboard.tsx` | Feature cards grid could benefit from a list-view toggle for mobile |
| **Low** | `src/pages/QualityDashboard.tsx` | Recharts charts are not responsive (no `ResponsiveContainer` width management on all charts) |

### 3.4 Accessibility (WCAG 2.1 AA)

| Severity | Issue | Location |
|----------|-------|---------|
| **Critical** | Only **34** `aria-*` and `role=` attributes across all `*.tsx` files — extremely sparse ARIA coverage for a complex interactive app | Global |
| **High** | `ControlPanel.tsx` — Phase 1 / Phase 2 buttons lack `aria-label` describing action and current state (loading, disabled reason) | `ControlPanel.tsx` |
| **High** | `ExpertCard.tsx` — card configuration sliders have no accessible label (`aria-label` or `aria-labelledby`) | `ExpertCard.tsx` |
| **High** | Color-only status indicators (active/inactive expert cards use only color ring) — fail WCAG 1.4.1 (Use of Color) | `ExpertCard.tsx` |
| **High** | Keyboard focus trapping in modals relies entirely on Radix UI `Dialog` — correctly implemented but custom popover layers outside `Dialog` are not trapped | `ExpertExpandedModal.tsx` |
| **Medium** | `Header.tsx` — cost badge (`$X.XXXX`) has no `aria-live` region — cost updates are invisible to screen readers | `Header.tsx` |
| **Medium** | Mermaid diagrams rendered via `MermaidDiagram.tsx` produce raw SVG with no `<title>` or `aria-label` | `primitives/MermaidDiagram.tsx` |
| **Medium** | `VerdictPanel.tsx` — verdict content has no `aria-live="polite"` — new verdicts are not announced to screen readers | `VerdictPanel.tsx` |
| **Low** | Google Fonts loaded at runtime via `@import url(...)` in `index.css` — no `font-display: swap` specified, causing FOIT | `src/index.css` |
| **Low** | Focus-visible ring styles exist (`--ring` variable) but `focus-visible:ring` is not consistently applied to all interactive primitives | Multiple |

### 3.5 Performance Bottlenecks

| Severity | Issue | Location |
|----------|-------|---------|
| **High** | `src/lib/scout.ts` auto-executes `runScout()` and calls `process.exit()` at module load (lines 985–989) — importing this module in a browser or unintended context terminates the process | `src/lib/scout.ts` |
| **High** | **410 `console.log/error/warn` calls** across the codebase — significant noise, some log sensitive data paths | Various |
| **Medium** | Mermaid is loaded as a full production dependency (`import mermaid from 'mermaid'`) — the mermaid bundle is ~1MB. It is rendered inline in `SafeMarkdown.tsx` with no dynamic import | `SafeMarkdown.tsx`, `MermaidDiagram.tsx` |
| **Medium** | `src/features/council/components/LLMResponseCard.tsx` — the component has a `.backup` and `.original.bak` sibling — these non-`.tsx` files are included in Vite's module graph scan, slowing HMR | `council/components/` |
| **Medium** | `src/stores/council.store.refactored.ts` — fully implemented but not used anywhere. Dead code adds to bundle analysis overhead and confuses contributors | `src/stores/` |
| **Medium** | `src/components/primitives/SafeMarkdown.tsx.original` — orphaned file in primitives; Vite processes all files in content globs | `components/primitives/` |
| **Low** | No `React.memo` on `ExpertCard` — with 3–7 experts, any parent re-render triggers re-render of all cards | `ExpertCard.tsx` |
| **Low** | `ControlPanel.tsx` — `useCouncilStore(useShallow(...))` selector is correct, but the store selector function is defined inline, bypassing memoization benefits on each render | `ControlPanel.tsx` |
| **Low** | `useSettingsStore` uses `@ts-expect-error` to silence Zustand v5 persist middleware type mismatch — indicates a type-system workaround that should be revisited | `settings-store.ts:~47` |

### 3.6 Missing Error / Loading / Empty States

| Severity | Missing State | Location |
|----------|--------------|---------|
| **High** | `QualityDashboard` fetches `/logs/quality-pipeline-report.json` — if file is absent (new deploy), the dashboard shows only a loading spinner indefinitely with no empty-state or actionable message | `QualityDashboard.tsx:~63` |
| **High** | `AutomationDashboard` loads opportunities via `loadAllOpportunities()` — API failure shows `toast.error` but the opportunities panel renders as empty with no empty-state UI component | `AutomationDashboard.tsx` |
| **Medium** | `DashboardLayout` — `hasData` check shows "No data yet" text inline but there is no structured empty-state component with CTA (e.g., "Run your first Council session") | `DashboardLayout.tsx` |
| **Medium** | `VerdictPanel` — displays status text for IDLE/EXECUTING/SYNTHESIZING but no dedicated loading skeleton during execution | `VerdictPanel.tsx` |
| **Medium** | `HistoryPanel` — not audited (lazy loaded) but `useSessionHistory` hook lacks error state handling per its implementation | `HistoryPanel.tsx` |
| **Low** | `CouncilWorkflow.tsx` — `// TODO: Implement retry logic` and `// TODO: Implement feedback tracking` indicate planned but missing features | `CouncilWorkflow.tsx:25,31` |

### 3.7 Duplicated & Dead Code

| Severity | Issue | Files |
|----------|-------|-------|
| **High** | **Orphaned pages:** `src/pages/Dashboard.tsx` and `src/pages/FeaturesDashboard.tsx` exist but are not registered in any route in `App.tsx`. They duplicate content visible in registered pages | `pages/Dashboard.tsx`, `pages/FeaturesDashboard.tsx` |
| **High** | **Orphaned store:** `src/stores/council.store.refactored.ts` — fully implemented refactored store using slice architecture exists but is unused. App continues to use the original monolithic `council.store.ts` | `stores/council.store.refactored.ts` |
| **High** | **Orphaned slice architecture:** `src/stores/slices/` directory with 4 slices (`council-control.slice.ts`, `council-execution.slice.ts`, `council-experts.slice.ts`, `council-ui.slice.ts`) — all dead code | `stores/slices/` |
| **Medium** | **Backup source files committed to repo:** `LLMResponseCard.tsx.backup`, `LLMResponseCard.original.bak`, `SafeMarkdown.tsx.original` should not be in version-controlled source | `features/council/components/`, `components/primitives/` |
| **Medium** | `src/contexts/CouncilContext.tsx` wraps the same Zustand stores and re-exports them — adds an unnecessary abstraction layer when components could directly use the stores | `contexts/CouncilContext.tsx` |
| **Medium** | Duplicate `ModeBehavior` interface defined in both `src/lib/types.ts` (global) and `src/features/council/lib/types.ts` (council feature) with overlapping but incompatible fields | `lib/types.ts`, `features/council/lib/types.ts` |
| **Medium** | Duplicate `SynthesisConfig` interface defined in both `src/lib/types.ts` and referenced via import in `settings-store.ts` — same type imported from two different paths depending on consumer | Multiple |
| **Low** | `src/features/automation/` contains `FeaturesDashboard.tsx`, `FeatureCard.tsx`, `FeatureConfigModal.tsx`, `execution-engine.ts`, and `features-store.ts` that parallel similar functionality already in `AutomationDashboard` and `feature-config-store` | `features/automation/` |

### 3.8 Security Vulnerabilities

| Severity | Issue | Location | Status |
|----------|-------|---------|--------|
| **Critical** | `src/lib/scout.ts` calls `process.exit()` at module level (line ~988). If this module is accidentally imported in the browser bundle, it will crash the Node process or, in browser, trigger unrecoverable script failure. More critically, if the module is tree-shaken into the web bundle, it could expose server-side file paths | `src/lib/scout.ts:985-989` | Not fixed |
| **High** | `src/components/primitives/SafeMarkdown.tsx` renders user-controlled markdown content through DOMPurify but also passes content directly to the Mermaid renderer without sanitization. Mermaid processes SVG/code which can embed JavaScript in crafted inputs | `SafeMarkdown.tsx`, `MermaidDiagram.tsx` | Partially mitigated by DOMPurify, but Mermaid path not sanitized |
| **High** | API keys for OpenRouter, GitHub, Reddit, Serper stored in `localStorage` (via Zustand `persist`). Even though the vault encrypts them, the vault password is only validated client-side. If localStorage is accessible via XSS, encrypted blobs can be exfiltrated for offline cracking | `settings-store.ts`, `vault.ts` | By design (single-user), but XSS protection is critical |
| **Medium** | `src/lib/google-studio-hack.ts` — filename and implementation suggest potentially unauthorized API access pattern ("hack" in name). File should be reviewed for compliance with Google ToS | `lib/google-studio-hack.ts` | Unknown |
| **Medium** | `console.log` statements (410 occurrences) in production bundle may leak internal state, API endpoints, and response structures in browser dev tools | Various | Not addressed |
| **Medium** | No Content Security Policy (CSP) headers configured in `vite.config.ts` or `firebase.json`. App renders user-supplied markdown content with Mermaid SVG — CSP is important defense-in-depth | `vite.config.ts`, `firebase.json` | Not configured |
| **Low** | `src/services/github-api.service.ts` sends `GITHUB_TOKEN` in Authorization headers. Token exposed to browser network tab if DevTools open. Acceptable for single-user local use, but a risk if app is ever shared | `github-api.service.ts` | Acceptable for single-user |
| **Low** | Backup source files (`.backup`, `.bak`, `.original`) committed to repo may contain historical API key values or sensitive configurations if they were present at time of backup | `LLMResponseCard.tsx.backup`, etc. | Needs audit |

---

## 4. Severity Matrix Summary

| ID | Area | Finding | Severity | Effort |
|----|------|---------|----------|--------|
| S-01 | Security | `scout.ts` `process.exit()` at module load | **Critical** | Low |
| S-02 | Security | Mermaid content not sanitized (XSS surface) | **High** | Medium |
| S-03 | Accessibility | Near-zero ARIA coverage across the app | **High** | High |
| S-04 | Dead Code | Orphaned pages `Dashboard.tsx`, `FeaturesDashboard.tsx` | **High** | Low |
| S-05 | Dead Code | `council.store.refactored.ts` + full `stores/slices/` directory unused | **High** | Low |
| S-06 | Routing | `DashboardLayout` analytics dashboard unreachable (no route) | **High** | Low |
| S-07 | Performance | `scout.ts` auto-executes at import with `process.exit` | **High** | Low |
| S-08 | Error States | `QualityDashboard` hangs indefinitely if JSON file absent | **High** | Low |
| S-09 | Security | No CSP configured; app renders user markdown + Mermaid | **Medium** | Medium |
| S-10 | Libraries | `react-helmet` deprecated — memory leak in concurrent mode | **Medium** | Low |
| S-11 | Accessibility | Sliders/buttons lack `aria-label` | **Medium** | Low |
| S-12 | Accessibility | `aria-live` missing on verdict, cost badge | **Medium** | Low |
| S-13 | Accessibility | Color-only status indicators on expert cards | **Medium** | Low |
| S-14 | Performance | 410 `console.log` calls in production bundle | **Medium** | Low |
| S-15 | Performance | Mermaid ~1MB loaded synchronously (no dynamic import) | **Medium** | Medium |
| S-16 | Dead Code | Backup files committed to source (`.bak`, `.backup`, `.original`) | **Medium** | Low |
| S-17 | Type Safety | Duplicate `ModeBehavior`/`SynthesisConfig` interfaces | **Medium** | Medium |
| S-18 | Hardcoded | `expertConsensusRate: 85` — hardcoded, not computed | **Medium** | Low |
| S-19 | Libraries | `next-themes` installed but light theme not implemented | **Low** | Low |
| S-20 | Performance | `ExpertCard` missing `React.memo` | **Low** | Low |

---

## 5. Modernization Recommendations

The following high-value improvements are recommended, in priority order:

### Priority 1 — Security & Correctness (Immediate)

1. **Fix `scout.ts` module-level execution** (S-01, S-07): Wrap the auto-execute block in a guard so it only runs when the file is executed directly, not when imported. The idiomatic ESM pattern is:
   ```ts
   const isMain = import.meta.url.startsWith('file:') &&
     !!process.argv[1] &&
     import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
   if (isMain) { runScout(); }
   ```
   Also remove the `process.exit()` call from the module body so other modules can safely import exported functions.

2. **Register the Analytics Dashboard route** (S-06): Add `<Route path="/analytics" element={<Dashboard />} />` (or `/dashboard`) to `App.tsx`. Update Header nav to include Analytics link.

3. **Remove orphaned dead code** (S-04, S-05): Delete `pages/Dashboard.tsx`, `pages/FeaturesDashboard.tsx`, `stores/council.store.refactored.ts`, and `stores/slices/`. Commit the refactored store if it is the intended architecture, or clean it up.

4. **Remove committed backup files** (S-16): Delete `LLMResponseCard.tsx.backup`, `LLMResponseCard.original.bak`, `SafeMarkdown.tsx.original` from version control (add to `.gitignore` for `*.backup`, `*.bak`, `*.original`).

### Priority 2 — Accessibility (Near-Term)

5. **Add `aria-label` to interactive controls** (S-11): Sliders in `ExpertCard` (temperature, maxTokens), Phase 1/Phase 2 buttons in `ControlPanel`, judge mode tabs.

6. **Add `aria-live` regions** (S-12): Wrap `VerdictPanel` output in `<div aria-live="polite">`. Add `aria-live="polite"` to cost badge in `Header`.

7. **Fix color-only status** (S-13): Add icon or text indicator alongside the colored ring on `ExpertCard` (e.g., a "Active" / "Inactive" `Badge` component).

8. **Add `<title>` to Mermaid SVGs** (S-02/accessibility): After Mermaid renders SVG, inject `<title>Diagram</title>` as first child for screen reader compatibility.

### Priority 3 — Performance & Code Quality (Medium-Term)

9. **Dynamic import Mermaid** (S-15): Replace synchronous `import mermaid from 'mermaid'` with `const mermaid = await import('mermaid')` inside the rendering effect. This splits ~1MB out of the initial bundle.

10. **Replace `react-helmet`** (S-10): Migrate to `react-helmet-async` (drop-in replacement) or use native React 18 `<title>` component.

11. **Strip production `console.log`** (S-14): Add `drop_console: true` to Vite `build.minify` options in `vite.config.ts` for production builds. Alternatively use the `vite-plugin-remove-console` plugin.

12. **Memoize `ExpertCard`** (S-20): Wrap with `React.memo` and ensure `updateExpert` is stable (already stable via Zustand store).

13. **Fix `QualityDashboard` empty state** (S-08): Add a proper empty-state component when the pipeline report JSON fetch returns 404/error, with a CTA button to trigger the quality pipeline.

14. **Unify duplicate type definitions** (S-17): Merge `ModeBehavior` and `SynthesisConfig` to a single canonical location in `src/lib/types.ts` and update all imports.

15. **Implement light theme** (S-19): Either fully implement a light theme toggled by `next-themes`, or remove `next-themes` and hard-code `dark` class on `<html>`.

### Priority 4 — Developer Experience (Backlog)

16. **Complete the store refactoring** (S-05): Either fully migrate to the slice-based `council.store.refactored.ts` architecture (which is better designed) or remove it. Mixed architecture creates confusion.

17. **Add CSP headers** (S-09): Configure `Content-Security-Policy` in `firebase.json` hosting headers and/or `vite.config.ts` dev server headers. At minimum: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`.

18. **Extract magic numbers to config** (S-18): Move `MIN_SCORE_HACKERNEWS`, model pricing, synthesis cost estimates to a centralized configuration file with comments explaining their source.

19. **Implement `font-display: swap`**: Update `index.css` Google Fonts `@import` to use `&display=swap` query param (already partially done with the URL — verify).

20. **Address TODO comments** (S-08): Implement retry logic and feedback tracking in `CouncilWorkflow.tsx` or remove the TODO comments if they are no longer planned.

---

*End of Audit Report*
