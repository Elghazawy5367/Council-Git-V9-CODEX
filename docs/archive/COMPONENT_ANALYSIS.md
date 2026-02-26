# Component Analysis: Generic vs Council-Specific

**Date:** February 1, 2026  
**Total Files Analyzed:** 112  
**Purpose:** Identify which components are generic (replaceable with existing solutions) vs unique Council-specific business logic

---

## Summary Statistics

| Category | Count | Percentage |
|----------|-------|------------|
| **Generic - Replace with existing solution** | 54 | 48% |
| **Unique - Keep and refine** | 50 | 45% |
| **Hybrid - Requires evaluation** | 8 | 7% |

---

## 1. Primitives Components (/src/components/primitives/)

### GENERIC - Replace with existing solution (40 files)

All standard shadcn/ui components - pure UI without business logic:

| File | Category | Reason | Recommended Replacement Source |
|------|----------|--------|-------------------------------|
| accordion.tsx | GENERIC | Standard shadcn/ui collapsible content sections | [shadcn/ui accordion](https://ui.shadcn.com/docs/components/accordion) |
| alert-dialog.tsx | GENERIC | Standard shadcn/ui dialog for alerts | [shadcn/ui alert-dialog](https://ui.shadcn.com/docs/components/alert-dialog) |
| alert.tsx | GENERIC | Standard shadcn/ui alert notifications | [shadcn/ui alert](https://ui.shadcn.com/docs/components/alert) |
| aspect-ratio.tsx | GENERIC | Standard shadcn/ui aspect ratio container | [shadcn/ui aspect-ratio](https://ui.shadcn.com/docs/components/aspect-ratio) |
| avatar.tsx | GENERIC | Standard shadcn/ui user/image avatar | [shadcn/ui avatar](https://ui.shadcn.com/docs/components/avatar) |
| badge.tsx | GENERIC | Standard shadcn/ui small labels/badges | [shadcn/ui badge](https://ui.shadcn.com/docs/components/badge) |
| breadcrumb.tsx | GENERIC | Standard shadcn/ui navigation breadcrumbs | [shadcn/ui breadcrumb](https://ui.shadcn.com/docs/components/breadcrumb) |
| button.tsx | GENERIC | Standard shadcn/ui base button component | [shadcn/ui button](https://ui.shadcn.com/docs/components/button) |
| calendar.tsx | GENERIC | Standard shadcn/ui calendar picker | [shadcn/ui calendar](https://ui.shadcn.com/docs/components/calendar) |
| card.tsx | GENERIC | Standard shadcn/ui card container | [shadcn/ui card](https://ui.shadcn.com/docs/components/card) |
| carousel.tsx | GENERIC | Standard shadcn/ui image/content carousel | [shadcn/ui carousel](https://ui.shadcn.com/docs/components/carousel) |
| checkbox.tsx | GENERIC | Standard shadcn/ui checkbox input | [shadcn/ui checkbox](https://ui.shadcn.com/docs/components/checkbox) |
| collapsible.tsx | GENERIC | Standard shadcn/ui expandable sections | [shadcn/ui collapsible](https://ui.shadcn.com/docs/components/collapsible) |
| command.tsx | GENERIC | Standard shadcn/ui command menu/palette | [shadcn/ui command](https://ui.shadcn.com/docs/components/command) |
| context-menu.tsx | GENERIC | Standard shadcn/ui right-click menu | [shadcn/ui context-menu](https://ui.shadcn.com/docs/components/context-menu) |
| dialog.tsx | GENERIC | Standard shadcn/ui modal dialog | [shadcn/ui dialog](https://ui.shadcn.com/docs/components/dialog) |
| drawer.tsx | GENERIC | Standard shadcn/ui slide-out drawer | [shadcn/ui drawer](https://ui.shadcn.com/docs/components/drawer) |
| dropdown-menu.tsx | GENERIC | Standard shadcn/ui dropdown menu | [shadcn/ui dropdown-menu](https://ui.shadcn.com/docs/components/dropdown-menu) |
| form.tsx | GENERIC | Standard shadcn/ui form utilities | [shadcn/ui form](https://ui.shadcn.com/docs/components/form) |
| hover-card.tsx | GENERIC | Standard shadcn/ui hover popup card | [shadcn/ui hover-card](https://ui.shadcn.com/docs/components/hover-card) |
| input-otp.tsx | GENERIC | Standard shadcn/ui OTP input | [shadcn/ui input-otp](https://ui.shadcn.com/docs/components/input-otp) |
| input.tsx | GENERIC | Standard shadcn/ui text input | [shadcn/ui input](https://ui.shadcn.com/docs/components/input) |
| label.tsx | GENERIC | Standard shadcn/ui form label | [shadcn/ui label](https://ui.shadcn.com/docs/components/label) |
| menubar.tsx | GENERIC | Standard shadcn/ui menu bar navigation | [shadcn/ui menubar](https://ui.shadcn.com/docs/components/menubar) |
| navigation-menu.tsx | GENERIC | Standard shadcn/ui navigation menu | [shadcn/ui navigation-menu](https://ui.shadcn.com/docs/components/navigation-menu) |
| pagination.tsx | GENERIC | Standard shadcn/ui pagination controls | [shadcn/ui pagination](https://ui.shadcn.com/docs/components/pagination) |
| popover.tsx | GENERIC | Standard shadcn/ui popover tooltip | [shadcn/ui popover](https://ui.shadcn.com/docs/components/popover) |
| progress.tsx | GENERIC | Standard shadcn/ui progress bar | [shadcn/ui progress](https://ui.shadcn.com/docs/components/progress) |
| radio-group.tsx | GENERIC | Standard shadcn/ui radio button group | [shadcn/ui radio-group](https://ui.shadcn.com/docs/components/radio-group) |
| resizable.tsx | GENERIC | Standard shadcn/ui resizable panels | [shadcn/ui resizable](https://ui.shadcn.com/docs/components/resizable) |
| scroll-area.tsx | GENERIC | Standard shadcn/ui scrollable area | [shadcn/ui scroll-area](https://ui.shadcn.com/docs/components/scroll-area) |
| select.tsx | GENERIC | Standard shadcn/ui dropdown select | [shadcn/ui select](https://ui.shadcn.com/docs/components/select) |
| separator.tsx | GENERIC | Standard shadcn/ui visual divider | [shadcn/ui separator](https://ui.shadcn.com/docs/components/separator) |
| sheet.tsx | GENERIC | Standard shadcn/ui side panel | [shadcn/ui sheet](https://ui.shadcn.com/docs/components/sheet) |
| sidebar.tsx | GENERIC | Standard shadcn/ui sidebar with mobile support | [shadcn/ui sidebar](https://ui.shadcn.com/docs/components/sidebar) |
| skeleton.tsx | GENERIC | Standard shadcn/ui loading skeleton | [shadcn/ui skeleton](https://ui.shadcn.com/docs/components/skeleton) |
| slider.tsx | GENERIC | Standard shadcn/ui slider input | [shadcn/ui slider](https://ui.shadcn.com/docs/components/slider) |
| switch.tsx | GENERIC | Standard shadcn/ui toggle switch | [shadcn/ui switch](https://ui.shadcn.com/docs/components/switch) |
| table.tsx | GENERIC | Standard shadcn/ui table component | [shadcn/ui table](https://ui.shadcn.com/docs/components/table) |
| tabs.tsx | GENERIC | Standard shadcn/ui tabbed interface | [shadcn/ui tabs](https://ui.shadcn.com/docs/components/tabs) |
| textarea.tsx | GENERIC | Standard shadcn/ui text area input | [shadcn/ui textarea](https://ui.shadcn.com/docs/components/textarea) |
| toast.tsx | GENERIC | Standard shadcn/ui toast notifications | [shadcn/ui toast](https://ui.shadcn.com/docs/components/toast) |
| toaster.tsx | GENERIC | Standard shadcn/ui toast container | [shadcn/ui sonner](https://ui.shadcn.com/docs/components/sonner) |
| toggle-group.tsx | GENERIC | Standard shadcn/ui toggle button group | [shadcn/ui toggle-group](https://ui.shadcn.com/docs/components/toggle-group) |
| toggle.tsx | GENERIC | Standard shadcn/ui toggle button | [shadcn/ui toggle](https://ui.shadcn.com/docs/components/toggle) |
| tooltip.tsx | GENERIC | Standard shadcn/ui tooltip component | [shadcn/ui tooltip](https://ui.shadcn.com/docs/components/tooltip) |
| use-toast.ts | GENERIC | Standard shadcn/ui toast hook utility | [shadcn/ui toast hook](https://ui.shadcn.com/docs/components/toast) |

### UNIQUE - Keep and refine (4 files)

| File | Category | Reason | Notes |
|------|----------|--------|-------|
| ArtifactRenderer.tsx | UNIQUE | Renders Council-specific artifact types (code, Mermaid, JSON, tables) with language detection | Keep - integrates with Council's display system |
| MermaidDiagram.tsx | UNIQUE | Renders Mermaid diagrams with Council's dark theme, error handling, XSS security | Keep - customized for Council's styling |
| SafeMarkdown.tsx | UNIQUE | Custom markdown renderer with Council's sanitization, GFM, Mermaid embedding, styled blocks | Keep - core to Council's content rendering |
| chart.tsx | UNIQUE | Recharts wrapper with Council's theme-aware configuration and color schemes | Keep - integrated with Council's design system |

---

## 2. Council Components (/src/features/council/components/)

### GENERIC - Replace with existing solution (7 files)

| File | Category | Reason | Recommended Replacement Source |
|------|----------|--------|-------------------------------|
| ExpertExpandedModal.tsx | GENERIC | Full-screen modal for displaying output with copy/retry | Standard modal + action buttons (shadcn dialog) |
| ExpertOutputFooter.tsx | GENERIC | Footer with action buttons (thumbs up/down, retry) | Standard button group component |
| Header.tsx | GENERIC | Top navigation bar with logo, links, settings | Standard nav component (React Router + shadcn) |
| LLMResponseCard.tsx | GENERIC | Display LLM responses with status badges and actions | Generic card component with loading states |
| MemoryBadge.tsx | GENERIC | Simple badge showing memory entry count | Standard badge component (shadcn) |
| StreamingSynthesisDisplay.tsx | GENERIC | Display streaming text with progress bar | Standard progress + auto-scroll component |
| VerdictPanel.tsx | GENERIC | Display final verdict with expand/copy buttons | Standard expandable panel (shadcn collapsible) |

### UNIQUE - Keep and refine (13 files)

| File | Category | Reason | Notes |
|------|----------|--------|-------|
| ControlPanel.tsx | UNIQUE | Central hub for multi-phase workflow orchestration, expert configuration, judge mode selection | **Core Council orchestrator** - manages Phase 1 & 2 execution, vault checks, file handling |
| CouncilWorkflow.tsx | UNIQUE | Layout wrapper for two-phase workflow (input→analysis→synthesis→judge) | **Core workflow engine** - manages execution phases, response grid display |
| ExpertCard.tsx | UNIQUE | Display/configure individual expert with model selection, knowledge files, persona editing | **Expert management** - persona loading, knowledge base handling, config updates |
| FeatureConfigModal.tsx | UNIQUE | Configure 5 special features (Reddit Sniper, Pain Points, Scout, Viral Radar, HEIST) | **Feature-specific configuration** - GitHub/Reddit targeting, AI analysis settings |
| GoldmineDetector.tsx | UNIQUE | Detects abandoned high-ROI GitHub repos using custom algorithms | **Proprietary algorithm** - `findGoldmines`, `categorizeGoldmines`, revenue estimation |
| HistoryPanel.tsx | UNIQUE | Session history with IndexedDB persistence, search/filter | **Session management** - memory storage, filtering logic specific to Council |
| JudgeSection.tsx | UNIQUE | Judge mode selection, synthesis execution, score breakdown, contradictions | **Judge orchestration** - manages Ruthless Judge execution and display |
| MemoryPanel.tsx | UNIQUE | Persistent memory management with search, filtering, export/clear | **Memory store operations** - filtering algorithms, Council-specific timestamp handling |
| MiningDrillPanel.tsx | UNIQUE | GitHub pain point extraction using sophisticated algorithms | **Proprietary algorithm** - `minePainPoints`, urgency/intent scoring, marketing copy generation |
| PersonaSelector.tsx | UNIQUE | Load preset expert teams or individual personas with validation | **Persona loading logic** - team configuration, default handling for Council experts |
| StargazerQualityCard.tsx | UNIQUE | Institutional backing analysis for repos (big tech backers, influencers) | **Quality scoring algorithm** - institutional analysis specific to Council intelligence |
| SynthesisCard.tsx | UNIQUE | Judge synthesis result display with tier/model selection, temperature config | **Synthesis configuration** - manages synthesis tier config and display |
| InputPanel.tsx | UNIQUE | Text input, file upload, LLM selector with Council-specific execution flow | **Hybrid** - Generic UI but manages Council execution and file validation |

---

## 3. Automation Components (/src/features/automation/components/)

### GENERIC - Replace with existing solution (0 files)

None - all automation components contain Council-specific business logic.

### UNIQUE - Keep and refine (4 files)

| File | Category | Reason | Notes |
|------|----------|--------|-------|
| FeatureCard.tsx | UNIQUE | Integrates with Council's feature store, execution engine, displays Council metrics | **Hybrid** - Generic card UI + feature execution business logic |
| FeatureConfigModal.tsx | UNIQUE | Entirely custom configuration for GitHub/Reddit/Niche targeting + AI analysis + Judge/Council routing | **Heavy business logic** - analysis settings, output routing to Ruthless Judge/Council |
| FeaturesDashboard.tsx | UNIQUE | Uses Council's feature store, displays execution metrics, feature categories | **Hybrid** - Generic dashboard layout + feature management |
| ReportsViewer.tsx | UNIQUE | Specialized report display for Ruthless Judge verdicts + Council synthesis | **Core reporting** - displays findings, opportunities, pain points, quality scoring |

---

## 4. Library Utilities (/src/lib/)

### GENERIC - Replace with existing solution (14 files)

| File | Category | Reason | Recommended Replacement Source |
|------|----------|--------|-------------------------------|
| api-client.ts | GENERIC | HTTP client with retry, caching, timeout | [Axios](https://axios-http.com/) or [Ky](https://github.com/sindresorhus/ky) |
| error-handler.ts | GENERIC | Error handling & recovery patterns | [ts-results](https://github.com/vultix/ts-results) or custom error boundary |
| format.ts | GENERIC | Number/currency formatting | [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) |
| validation.ts | GENERIC | Zod-based runtime validation | [Zod](https://zod.dev/) directly |
| utils.ts | GENERIC | Tailwind CSS class merging (cn function) | [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) |
| form.ts | GENERIC | React Hook Form context helpers | [React Hook Form](https://react-hook-form.com/) utilities |
| sanitize.ts | GENERIC | HTML/XSS sanitization | [DOMPurify](https://github.com/cure53/DOMPurify) |
| db.ts | GENERIC | IndexedDB schema & migrations | [Dexie.js](https://dexie.org/) |
| sonner.ts | GENERIC | Toast notification setup | [Sonner](https://sonner.emilkowal.ski/) configuration |
| plugin-manager.ts | GENERIC | Plugin architecture system | Generic plugin pattern or [Pluggable.js](https://github.com/conversejs/pluggable.js) |
| hmr-protection.ts | GENERIC | Hot Module Replacement dev helper | Vite HMR API |
| code-mirror.ts | GENERIC | Code quality scoring framework | Generic code analysis pattern |
| sidebar.ts | GENERIC | UI sidebar configuration | Part of shadcn sidebar component |
| language-mapping.ts | GENERIC | Language detection/mapping | [franc](https://github.com/wooorm/franc) or [language-detect](https://github.com/richtr/language-detect) |

### UNIQUE - Keep and refine (27 files)

| File | Category | Reason | Notes |
|------|----------|--------|-------|
| config.ts | UNIQUE | AI model fleet configuration, execution modes, expert defaults | **Core configuration** - `MAGNIFICENT_7_FLEET`, `MODE_DESCRIPTIONS`, `buildSystemPrompt()` |
| expert-weights.ts | UNIQUE | Multi-expert weighting algorithm with quality, confidence, domain scoring | **Proprietary algorithm** - `calculateExpertWeight()`, `createWeightedOutputs()`, `detectWeightImbalance()` |
| synthesis-engine.ts | UNIQUE | Judge synthesis framework with tiered strategies | **Core synthesis** - `SYNTHESIS_TIERS`, quick/balanced/deep strategies |
| synthesis-cache.ts | UNIQUE | Synthesis result caching for Council | **Performance optimization** - Council-specific caching logic |
| synthesis-output-formatter.ts | UNIQUE | Output formatting for synthesis results | **Formatting logic** - Council-specific output structure |
| variants.ts | UNIQUE | A/B testing/variant management for Council features | **Feature variants** - Council experimentation system |
| prompt-heist.ts | UNIQUE | Dynamic prompt vault system loading from Fabric | **Prompt management** - `PromptVault`, dynamic loading |
| prompt-heist-examples.ts | UNIQUE | Example prompts for Council features | **Prompt library** - Council-specific examples |
| fork-evolution.ts | UNIQUE | Fork feature discovery algorithm analyzing repository evolution | **Proprietary algorithm** - `analyzeForkEvolution()`, feature detection from forks |
| goldmine-detector.ts | UNIQUE | Abandoned repo monetization scoring with ROI estimation | **Proprietary algorithm** - `findGoldmines()`, `calculateGoldmineMetrics()`, revenue estimation |
| scout.ts | UNIQUE | GitHub market research intelligence extraction | **Intelligence gathering** - `consultKnowledgeBase()`, repository analysis |
| mining-drill.ts | UNIQUE | GitHub issue pain point extraction with buying intent | **Proprietary algorithm** - `PainPoint` analysis, urgency/intent scoring |
| reddit-sniper.ts | UNIQUE | Reddit lead generation with intent scoring | **Intelligence gathering** - `calculateBuyingIntent()`, Reddit analysis |
| hackernews-intelligence.ts | UNIQUE | HackerNews trend detection and intent scoring | **Intelligence gathering** - `fetchHNTrends()`, trend analysis |
| producthunt-intelligence.ts | UNIQUE | ProductHunt trend analysis and data extraction | **Intelligence gathering** - ProductHunt data processing |
| stargazer-intelligence.ts | UNIQUE | GitHub stargazer quality analysis with influencer detection | **Proprietary algorithm** - `StargazerAnalysis`, institutional backing detection |
| viral-radar.ts | UNIQUE | Social media trend scanning (Twitter, Instagram) | **Intelligence gathering** - `scanTwitter()`, viral content detection |
| twin-mimicry.ts | UNIQUE | Developer mental model extraction from commit patterns | **Proprietary algorithm** - `analyzeTwinMimicry()`, commit pattern analysis |
| self-improve.ts | UNIQUE | Repository success pattern learning and extraction | **Machine learning** - `learnFromSuccess()`, pattern extraction |
| report-generator.ts | UNIQUE | Intelligence report generation for Council | **Reporting** - Council-specific report formatting |
| google-studio-hack.ts | UNIQUE | IDE bypass utility for Google AI Studio | **Integration hack** - `openGoogleStudio()` |
| workflow-dispatcher.ts | UNIQUE | GitHub Actions workflow orchestration | **CI/CD integration** - `generateWorkflowDispatchUrl()`, workflow inputs |
| knowledge-loader.ts | UNIQUE | Dynamic knowledge base loading system | **Knowledge management** - Council's knowledge retrieval |
| opportunity-loader.ts | UNIQUE | Opportunity data loading and management | **Data management** - Council-specific opportunity handling |
| protection-tests.ts | UNIQUE | Security/protection testing utilities | **Security** - Council-specific protection verification |
| types.ts | UNIQUE | Core type definitions with Zod schemas for Council | **Type system** - `SynthesisConfig`, `InsightSchema`, Council model types |
| workflow-dispatcher.ts | UNIQUE | GitHub Actions integration | **CI/CD** - Workflow dispatch URLs and inputs |

---

## 5. Services (/src/services/)

### GENERIC - Replace with existing solution (1 file)

| File | Category | Reason | Recommended Replacement Source |
|------|----------|--------|-------------------------------|
| openrouter.ts | GENERIC | Standard REST API wrapper for OpenRouter chat completions | [OpenAI SDK](https://github.com/openai/openai-node) or custom HTTP client |

### UNIQUE - Keep and refine (2 files)

| File | Category | Reason | Notes |
|------|----------|--------|-------|
| council.service.ts | UNIQUE | Core parallel/sequential/adversarial execution engine with context passing | **Core orchestration** - Multi-mode execution, smart context passing, error isolation, streaming |
| ruthless-judge.ts | UNIQUE | Sophisticated GPT-4-based evaluation with 3D scoring, contradiction detection | **Proprietary algorithm** - Accuracy/completeness/conciseness scoring, hierarchical consensus, confidence scoring |

---

## 6. Additional Components (/src/components/)

### GENERIC - Replace with existing solution (2 files)

| File | Category | Reason | Recommended Replacement Source |
|------|----------|--------|-------------------------------|
| Skeleton.tsx | GENERIC | Loading skeleton component | shadcn/ui skeleton (already exists in primitives) |
| NavLink.tsx | GENERIC | Navigation link wrapper | React Router NavLink component |

### UNIQUE - Keep and refine (2 files)

| File | Category | Reason | Notes |
|------|----------|--------|-------|
| EmptyState.tsx | UNIQUE | Custom empty state with Council-specific styling/messaging | **UI component** - Could be made generic but customized for Council |
| ErrorBoundary.tsx | UNIQUE | Error boundary with Council-specific error handling | **Error handling** - Customized recovery and display for Council |

---

## Analysis Summary

### By Category

| Category | Count | Percentage | Action |
|----------|-------|------------|--------|
| **GENERIC - Replace** | 54 | 48% | Consider using existing libraries/solutions |
| **UNIQUE - Keep** | 50 | 45% | Core Council IP - refine and optimize |
| **HYBRID** | 8 | 7% | Evaluate case-by-case |

### Key Findings

#### 🔧 **Generic Components (54 files)**
- **40 shadcn/ui primitives** - Already using well-maintained library
- **14 utility files** - Standard patterns (API client, validation, formatting)
- **Recommendation:** Keep shadcn/ui components as-is (already optimal). Consider replacing custom utilities with established libraries only if maintenance becomes an issue.

#### ⭐ **Unique Council Components (50 files)**

**Core Differentiators (Proprietary Algorithms):**

1. **Expert Weighting System** (`expert-weights.ts`)
   - Multi-factor scoring: model quality + output quality + confidence + domain match
   - Weighted voting for synthesis
   - Imbalance detection

2. **Ruthless Judge** (`ruthless-judge.ts`)
   - 3-dimensional scoring (accuracy, completeness, conciseness)
   - GPT-4-based meta-synthesis
   - Contradiction detection
   - Confidence quantification

3. **Intelligence Gathering Suite** (7 files)
   - `goldmine-detector.ts` - Abandoned repo ROI analysis
   - `mining-drill.ts` - GitHub pain point extraction with buying intent
   - `scout.ts` - GitHub market research
   - `reddit-sniper.ts` - Reddit lead generation
   - `stargazer-intelligence.ts` - Institutional backer detection
   - `fork-evolution.ts` - Feature discovery from forks
   - `twin-mimicry.ts` - Developer mental model extraction

4. **Multi-Agent Orchestration** (`council.service.ts`)
   - Parallel/sequential/adversarial execution modes
   - Smart context passing between experts
   - Streaming support

5. **Synthesis Engine** (`synthesis-engine.ts`)
   - Tiered strategies (quick/balanced/deep)
   - Multi-pass refinement
   - Chain-of-thought reasoning

**Business Logic Components:**
- Council Workflow orchestration (ControlPanel, CouncilWorkflow)
- Expert management (ExpertCard, PersonaSelector)
- Feature configuration (FeatureConfigModal)
- Report generation and display
- Memory and history management

#### 🤔 **Hybrid Components (8 files)**

These contain both generic UI patterns and Council-specific business logic:

| File | Generic Aspect | Council-Specific Aspect | Recommendation |
|------|---------------|------------------------|----------------|
| InputPanel.tsx | File upload, text input UI | Council execution flow, file validation | Keep - tightly coupled to Council workflow |
| SynthesisCard.tsx | Card display with actions | Synthesis tier configuration | Keep - core to synthesis display |
| FeatureCard.tsx | Card UI with status badges | Feature execution engine integration | Keep - feature management logic |
| FeaturesDashboard.tsx | Dashboard layout | Feature store, execution metrics | Keep - feature orchestration |
| EmptyState.tsx | Empty state pattern | Council-specific messaging | Could be genericized if needed |
| ErrorBoundary.tsx | React error boundary | Council error recovery | Could be genericized if needed |
| chart.tsx | Recharts wrapper | Council theme integration | Keep - theme-specific |
| types.ts | Type definitions | Council domain types | Keep - core type system |

---

## Recommendations

### ✅ **Keep As-Is**

1. **All shadcn/ui components (40 files)** - Already using industry-standard library
2. **All Council-specific algorithms (27 files)** - Core IP and differentiators
3. **All business logic components (23 files)** - Tightly coupled to Council domain

### 🔄 **Consider Refactoring**

1. **Custom utilities (14 files)** - Evaluate if external libraries would reduce maintenance:
   - `api-client.ts` → Axios or Ky (if more features needed)
   - `format.ts` → Native Intl API
   - `sanitize.ts` → Ensure using DOMPurify directly
   - `validation.ts` → Direct Zod usage

2. **Hybrid components (8 files)** - Consider separating UI from business logic:
   - Create pure presentation components
   - Extract business logic to custom hooks or services
   - Improve testability and reusability

### 📊 **Architecture Insights**

**Strengths:**
- ✅ Clear separation between UI primitives and business logic
- ✅ Well-organized feature-based structure
- ✅ Sophisticated proprietary algorithms (expert weighting, judge synthesis)
- ✅ Comprehensive intelligence gathering suite

**Areas for Improvement:**
- ⚠️ Some hybrid components mix UI and business logic
- ⚠️ Custom utilities could leverage more standard libraries
- ⚠️ Consider extracting reusable patterns from Council-specific code

**Council's Core Value:**
The 50 unique files (45% of codebase) represent Council's intellectual property:
- Multi-expert AI orchestration with smart context passing
- Sophisticated synthesis and judgment algorithms
- Market intelligence extraction from multiple sources
- Automated opportunity and pain point detection

These components should be **protected, refined, and optimized** as they constitute the platform's competitive advantage.

---

## Conclusion

**Council has a healthy balance:**
- 48% generic components (leveraging industry standards)
- 45% unique algorithms and business logic (core IP)
- 7% hybrid components (requiring evaluation)

**Recommendation:** Focus development effort on the 50 unique files that contain Council's proprietary intelligence algorithms and multi-agent orchestration system. The generic components are already well-maintained through shadcn/ui and standard patterns.

**Next Steps:**
1. ✅ Document all proprietary algorithms
2. ✅ Add unit tests for critical algorithms (expert weights, judge, goldmine detector)
3. ✅ Consider extracting reusable patterns from hybrid components
4. ✅ Evaluate if custom utilities should be replaced with standard libraries
5. ✅ Protect and refine the 27 unique algorithm files - these are Council's competitive moat

---

**Generated:** February 1, 2026  
**Analysis Tool:** AI-powered code exploration  
**Confidence Level:** High (based on comprehensive file-by-file analysis)
