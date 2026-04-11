# MODULAR REFACTOR BLUEPRINT
*Target: Council-Git-V9-CODEX*
*Date: 2026-04-09*

## 1. Executive Summary
This blueprint establishes the boundaries for dissecting "God Modules" and overloaded UI components identified in the Master Audit. 
Currently, the codebase exhibits high coupling between data fetching, business rules, and UI rendering. The goal of this phase is *isolation* without *interruption*.

---

## 2. API Domain Extraction (`github-client.ts`)
**Current State:** 308 lines. Tangled responsibility. It manages HTTP retries, API keys, rate-limit pauses, AND highly specific domain logic (Trending Topics, Repository Search, Issues).
**Target State:**
1. `src/features/automation/lib/api/core/GitHubHttpClient.ts`: Purely handles `fetchWithRetry`, Rate Limits, Authorization, and JSON parsing.
2. `src/features/automation/lib/api/services/GitHubIntelligence.ts`: Injects `GitHubHttpClient`. Exposes high-level methods: `getTrendingRepositories()`, `searchByTopics()`.
3. `src/features/automation/lib/api/services/GitHubIssues.ts`: Exposes issue-specific lookups.
**Benefit:** Eliminates the God class, making API evolution modular without risking global rate-limit breakage.

---

## 3. UI/State Separation (The "Hybrid" Components)

### Target A: `ControlPanel.tsx` (480 lines)
**Current State:** Mixes UI layout, file I/O operations, complex condition tracking (`canRunPhase1`, `isPhase2Running`), and Zustand state extraction (`useShallow`).
**Target State:**
- **Hooks Separation:** Create `useCouncilPhases.ts` to encapsulate all `canRunPhase1`, `handlePhase1Click`, and vault validation logic.
- **Component Splits:**
  - `ControlPanel.tsx` (Controller/Layout)
  - `components/ControlPanel/FileUploadSection.tsx` (File Drop/Upload parsing)
  - `components/ControlPanel/ExecutionControls.tsx` (Phase 1 / Phase 2 buttons)
  - `components/ControlPanel/JudgeSelector.tsx` (Tab mode selector)

### Target B: `FeatureConfigModal.tsx` (787 lines)
**Current State:** Enormous file manually rendering 18 hardcoded tabs with repetitive `<Switch>`, `<Input>`, and `<Select>` boilerplates. The Zustand selection block spans 40 lines alone.
**Target State:**
- **Dynamic Configuration Registry:** Create `configRegistry.ts` defining metadata for each panel (Icons, Titles, State Keys).
- **Component Splits:**
  - `FeatureConfigModal.tsx` (Main shell, mapping over the registry)
  - `components/FeatureConfig/ConfigTabHeader.tsx`
  - `components/FeatureConfig/Panels/RedditSniperPanel.tsx`
  - `components/FeatureConfig/Panels/HeistPanel.tsx`
**Benefit:** Adding a new feature configuration goes from a 50-line UI addition to a 5-line registry injection.

---

## 4. Script Complexity Isolation (`prompt-heist.ts`)
**Current State:** File system (fs) logic intertwines with string manipulation headers (`extractMetadata`, `enhancePrompt`) and GitHub fetching fallbacks.
**Target State:**
- `src/lib/heist/HeistStorage.ts`: Handles local `fs` operations (async) and folder traversals.
- `src/lib/heist/HeistNetwork.ts`: Handles the GitHub fallback retrievals.
- `src/lib/heist/PromptEnhancer.ts`: Pure functions only (`enhancePrompt`, `combinePatterns`, `createHybridPrompt`) without side-effects.

---

## 5. Exclusions
- `src/components/primitives/chart.tsx`: Despite being >300 lines, this file contains domain-isolated Shadcn boilerplate. Decoupling this primitive offers low ROI compared to the business logic targets and introduces upgrade fragility. It will be ignored in the modular refactor.

---
*End of Blueprint. DO NOT execute this refactoring sequence without explicit phase authorization.*
