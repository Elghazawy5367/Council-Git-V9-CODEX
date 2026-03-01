# 🔍 META-FEATURES DEEP AUDIT REPORT

**Project:** Council-Git-V9  
**Audit Date:** March 1, 2026  
**Auditor:** Copilot Deep Analysis  
**Scope:** All meta-features, infrastructure systems, security posture, and 2026 readiness  
**Methodology:** Line-by-line code review with runtime verification

---

## 📋 Executive Summary

The Council codebase contains **12 audited systems** spanning meta-features (self-improve, twin mimicry, prompt heist, code mirror) and infrastructure (data fetching, validation, error handling, security, storage, mobile UI, virtualization, streaming). Of these:

- **9 are WORKING** (with varying quality levels)
- **1 is BROKEN** (Twin Mimicry V1 — CommonJS in ESM context)
- **1 is PHANTOM** (Virtualized Lists — zero implementation)
- **1 is CRITICALLY INSECURE** (Vault — Base64 masquerading as encryption)

**Overall Health:** The core Council orchestration is solid. The meta-features (scout, mirror, learn, heist, twin) are exclusively CLI-based with **zero web UI integration** — a major gap. The vault security is the most urgent finding: API keys are stored in plaintext Base64 in localStorage, recoverable with a single `atob()` call.

**2026 Readiness:** LOW-MEDIUM. The meta-features rely on regex-based pattern extraction instead of LLM-powered analysis. No agentic chains, no structured outputs, no memory-augmented workflows. The infrastructure layer (React Query, Zod, error handling, streaming) is modern and well-implemented.

---

## 📊 Health Scorecard

| ID | Feature | Status | Completeness | Type Safety | Error Handling | Integration | 2026 Ready | Overall |
|----|---------|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| META-01 | Self-Improving Loop | ✅ WORKING | 7/10 | 7/10 | 6/10 | 4/10 | 4/10 | **5.6/10** |
| META-02 | Twin Mimicry (V1+V2) | ❌ BROKEN | 6/10 | 4/10 | 5/10 | 3/10 | 5/10 | **4.6/10** |
| META-03 | The HEIST | ✅ WORKING | 7/10 | 7/10 | 6/10 | 5/10 | 6/10 | **6.2/10** |
| META-04 | Code Mirror | ✅ WORKING | 8/10 | 8/10 | 7/10 | 4/10 | 5/10 | **6.4/10** |
| INFRA-01 | Data Fetching & Cache | ✅ WORKING | 8/10 | 7/10 | 8/10 | 8/10 | 8/10 | **7.8/10** |
| INFRA-02 | Type-Safe Forms | ✅ WORKING | 7/10 | 9/10 | 7/10 | 8/10 | 8/10 | **7.8/10** |
| INFRA-03 | Error Handling | ✅ WORKING | 9/10 | 8/10 | 10/10 | 8/10 | 8/10 | **8.6/10** |
| INFRA-04 | Auth & Security Vault | ⚠️ INSECURE | 6/10 | 8/10 | 6/10 | 7/10 | 3/10 | **6.0/10** |
| INFRA-05 | Local Database | ✅ WORKING | 7/10 | 7/10 | 6/10 | 8/10 | 7/10 | **7.0/10** |
| INFRA-06 | Mobile Drawers | ✅ WORKING | 7/10 | 8/10 | 5/10 | 7/10 | 7/10 | **6.8/10** |
| INFRA-07 | Virtualized Lists | 👻 PHANTOM | 1/10 | 1/10 | 1/10 | 1/10 | 1/10 | **1.0/10** |
| INFRA-08 | Streaming AI | ✅ WORKING | 8/10 | 7/10 | 7/10 | 8/10 | 8/10 | **7.6/10** |

**Aggregate Score: 6.3/10**

---

## 🔬 Detailed Feature Audits

---

### META-01: Self-Improving Loop

| Field | Value |
|-------|-------|
| **Files** | `src/lib/self-improve.ts`, `scripts/run-self-improve.ts` |
| **npm Command** | `npm run learn` → `tsx scripts/run-self-improve.ts` → imports `../src/lib/self-improve` |
| **Status** | ✅ **WORKING** (with mock fallback) |
| **Overall Score** | 5.6/10 |

#### How It Works

The script runs end-to-end: parses CLI args, calls `learnFromSuccess()` which searches GitHub API, extracts patterns (positioning, pricing, features, architecture) from repositories, updates knowledge base markdown files, and generates a report.

Falls back to mock data if GitHub API fails at `self-improve.ts:125`. Uses regex-based pattern extraction — **not** LLM-based analysis.

#### Security Concerns

- Uses `GITHUB_TOKEN` from environment variable for API access
- Writes directly to filesystem (`knowledge/` directory)
- `Buffer.from()` at line 151 is Node-only — no browser-specific code

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 7/10 | Full pipeline from search to knowledge base update |
| Type Safety | 7/10 | No `any` types found |
| Error Handling | 6/10 | Empty catch blocks at lines 119-120 swallow errors silently |
| Integration | 4/10 | CLI-only — no web UI, no API endpoint, no dashboard |
| 2026 Relevance | 4/10 | Regex-based extraction is obsolete for 2026 |

#### UI Status

**No UI exists.** This feature is entirely CLI-based. Should be exposed in a Dev Tools Dashboard with:
- Trigger button to run learning
- Results visualization (patterns found, confidence scores)
- Knowledge base file browser

#### 2026 Gap: 🔴 HIGH

Uses simple regex matching instead of LLM analysis. Missing:
- Structured outputs (JSON mode / function calling)
- Agentic chains for multi-step reasoning
- Memory from past sessions to avoid re-learning
- Confidence scoring with evidence links

---

### META-02: Twin Mimicry (V1 + V2)

| Field | Value |
|-------|-------|
| **Files** | `src/lib/twin-mimicry.ts` (V1), `src/lib/twin-mimicry-v2.ts` (V2) |
| **npm Command** | `npm run twin` → `tsx src/lib/twin-mimicry.ts` |
| **Status** | ❌ **BROKEN** (V1 — CommonJS in ESM context) |
| **Overall Score** | 4.6/10 |

#### How It Works

V1 analyzes git history to extract coding patterns and creates a "digital twin" profile. V2 extends this with MOE (Mixture of Experts) pattern extraction from elite repos: autogen, crewAI, langgraph, open-webui.

#### Critical Bug

V1 uses `require.main === module` at **line 479** for auto-execution. Since `package.json` declares `"type": "module"`, this CommonJS check will **never be true** in an ESM context. The script will import but never execute.

```typescript
// twin-mimicry.ts:479 — BROKEN
if (require.main === module) {
  // This block NEVER executes in ESM
}
```

**Fix:** Replace with:
```typescript
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // ESM-compatible entry point check
}
```

#### Node-Only APIs Used

- `child_process.execSync` at lines 13, 62, 99 — direct shell execution
- `fs.writeFileSync` at lines 399, 456 — filesystem writes
- These are appropriate for CLI scripts but prevent any browser usage

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 6/10 | V1 is feature-complete but broken; V2 has no npm script |
| Type Safety | 4/10 | `eslint-disable @typescript-eslint/no-explicit-any` present; line 137 uses `any` |
| Error Handling | 5/10 | Some try-catch but not comprehensive |
| Integration | 3/10 | CLI-only, no UI, V2 unreachable via npm |
| 2026 Relevance | 5/10 | Direct git shell commands instead of API calls |

#### UI Status

**No UI exists.** Should be in Dev Tools Dashboard with:
- Twin profile viewer
- Pattern comparison between user's code and elite repos
- MOE architecture visualization

#### 2026 Gap: 🔴 HIGH

Direct `execSync('git...')` shell commands are fragile and non-portable. Should use:
- `isomorphic-git` or GitHub API for repo analysis
- LLM-enhanced pattern recognition instead of regex
- Structured comparison framework

---

### META-03: The HEIST

| Field | Value |
|-------|-------|
| **Files** | `src/lib/prompt-heist.ts`, `scripts/heist-prompts.ts`, `src/lib/prompt-heist-examples.ts` |
| **npm Command** | `npm run heist` → `tsx scripts/heist-prompts.ts` |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 6.2/10 |

#### How It Works

Downloads curated prompts from the `danielmiessler/fabric` GitHub repository. Uses local filesystem cache at `prompts/fabric/`. Falls back to GitHub raw content API (`raw.githubusercontent.com`) when needed.

#### Security Concerns

- Makes external HTTP calls to `raw.githubusercontent.com` — no URL validation or sanitization
- Writes files to local filesystem (`prompts/fabric/` directory)
- No integrity checks on downloaded content (no checksums, no signature verification)

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 7/10 | Full download + cache pipeline |
| Type Safety | 7/10 | Properly typed interfaces |
| Error Handling | 6/10 | Basic try-catch with fallbacks |
| Integration | 5/10 | Prompts stored locally but no UI to browse or select them |
| 2026 Relevance | 6/10 | Good concept, needs LLM categorization layer |

#### UI Status

**No UI to browse or select heisted prompts.** Should be accessible from Settings or Dev Tools with:
- Prompt browser with search and categories
- Preview panel with syntax highlighting
- One-click integration with expert persona configuration
- Quality scoring per prompt

#### 2026 Gap: 🟡 MEDIUM

Good concept that needs enhancement:
- Automatic categorization via LLM (tag prompts by domain, task type)
- Prompt quality scoring (structure, specificity, reusability)
- Direct integration with expert persona configuration
- Version tracking for prompt updates

---

### META-04: Code Mirror

| Field | Value |
|-------|-------|
| **Files** | `src/lib/code-mirror.ts`, `src/lib/mirror-standards.json`, `scripts/run-mirror.ts` |
| **npm Command** | `npm run mirror` → `tsx scripts/run-mirror.ts` → imports `analyzeBatch` from `../src/lib/code-mirror` |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 6.4/10 |

#### How It Works

Scans TypeScript files and checks against standards defined in `mirror-standards.json`. Checks include error handling patterns, type safety, performance anti-patterns, and architecture violations. Generates a markdown report with findings ranked by severity.

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 8/10 | Comprehensive rule set, batch analysis, severity ranking |
| Type Safety | 8/10 | Well-typed analysis results |
| Error Handling | 7/10 | Graceful failures per-file, continues batch on error |
| Integration | 4/10 | CLI-only — no UI dashboard, no CI integration |
| 2026 Relevance | 5/10 | Static regex-based analysis is 2023-era tooling |

#### UI Status

**No UI dashboard.** Should be in Quality Dashboard or Dev Tools with:
- Real-time scan results
- Severity-based filtering
- Trend graphs over time
- Click-to-navigate to issues in code

#### 2026 Gap: 🟡 MEDIUM

Static regex-based analysis. Should evolve to:
- LLM-powered semantic analysis (understand intent, not just pattern)
- Auto-fix suggestions with diff previews
- Comparison against actual elite repo code (not just rules)
- Integration with CI/CD pipeline for automated gating

---

### INFRA-01: Data Fetching & Cache (React Query)

| Field | Value |
|-------|-------|
| **Files** | `src/hooks/useGitHub.ts`, `src/hooks/useCommunityIntelligence.ts`, `src/features/council/hooks/use-council-queries.ts`, `src/App.tsx` |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 7.8/10 |

#### How It Works

React Query (`@tanstack/react-query`) is properly integrated:

- **QueryClient** created in `App.tsx:19`
- **QueryClientProvider** wraps the entire app at `App.tsx:36`
- `useGitHub.ts` implements:
  - `staleTime`: 5–60 minutes per query type
  - `gcTime`: 30 minutes to 48 hours
  - `retry`: 1–3 retries per query type
  - `retryDelay`: Exponential backoff
  - `invalidateQueries` used at line 224
- `useCommunityIntelligence.ts` has similar patterns for Reddit and HackerNews APIs
- `use-council-queries.ts` uses `useQuery` (with `enabled: false` pattern) and `useMutation` for synthesis

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 8/10 | Meaningful caching, retry, invalidation |
| Type Safety | 7/10 | Some `any` casts in API response handling |
| Error Handling | 8/10 | Exponential backoff, retry limits |
| Integration | 8/10 | Wraps entire app, used across features |
| 2026 Relevance | 8/10 | React Query is the standard |

---

### INFRA-02: Type-Safe Forms (Zod Validation)

| Field | Value |
|-------|-------|
| **Files** | `src/lib/validation.ts`, `src/lib/types.ts` |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 7.8/10 |

#### How It Works

Zod is used extensively for runtime validation of all external data. Schemas defined in `validation.ts`:
- `GitHubRepoSchema`
- `GitHubSearchResponseSchema`
- `GitHubUserSchema`
- `RedditListingSchema`
- `HackerNewsSearchResponseSchema`
- `BuyingIntentSignalSchema`
- `BlueOceanOpportunitySchema`
- `StargazerQualitySchema`

`validateData()` function wraps all external API data with Zod parsing. `SynthesisOutputSchema` in `types.ts` validates AI model outputs.

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 7/10 | Covers API responses; form inputs less covered |
| Type Safety | 9/10 | Zod → TypeScript inference is excellent |
| Error Handling | 7/10 | Zod errors surfaced but UX could improve |
| Integration | 8/10 | Used at every API boundary |
| 2026 Relevance | 8/10 | Zod is the standard for TypeScript validation |

---

### INFRA-03: Error Handling

| Field | Value |
|-------|-------|
| **Files** | `src/lib/error-handler.ts`, `src/components/ErrorBoundary.tsx`, `src/features/council/api/ai-client.ts` |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 8.6/10 |

#### How It Works

Comprehensive error hierarchy:

```
AppError
  ├── APIError
  ├── ValidationError
  ├── NetworkError
  ├── TimeoutError
  └── RateLimitError
```

`errorRecovery` utility object provides:
- **Retry with exponential backoff** (line 70)
- **withFallback** — graceful fallback values (line 102)
- **gracefulDegrade** — degraded functionality mode (line 114)
- **withTimeout** — timeout wrapper (line 127)
- **createCircuitBreaker** — circuit breaker pattern (line 136)

`ErrorBoundary.tsx` uses `react-error-boundary` with:
- Mobile-friendly fallback UI
- Development-only error stack traces
- Retry and home navigation buttons
- `FeatureErrorBoundary` for per-feature isolation

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 9/10 | Full error taxonomy + recovery strategies |
| Type Safety | 8/10 | Some `any` in catch blocks (TypeScript limitation) |
| Error Handling | 10/10 | Best-in-class for this codebase |
| Integration | 8/10 | Used across AI client and UI boundaries |
| 2026 Relevance | 8/10 | Circuit breaker + retry is production-grade |

---

### INFRA-04: Auth & Security / Encrypted Vault

| Field | Value |
|-------|-------|
| **Files** | `src/features/council/lib/vault.ts` |
| **Status** | ⚠️ **WORKING BUT CRITICALLY INSECURE** |
| **Overall Score** | 6.0/10 |

#### 🚨 CRITICAL SECURITY FINDING

The vault provides an **illusion of security** only. It uses Base64 encoding, not encryption.

**Exact encryption code at `vault.ts:87`:**
```typescript
btoa(keysToStore)  // This is Base64 ENCODING, not encryption
```

**Password hashing at `vault.ts:27-35`:**
```typescript
function simpleHash(str: string): string {
  // djb2-like hash → base36 string
  // 32-bit integer space — trivially brutable
}
```

**Proof of vulnerability** — run this in any browser console when the vault is populated:
```javascript
const vault = localStorage.getItem('council_vault_v18');
if (vault) atob(JSON.parse(vault).encodedKeys);
// Instantly reveals ALL stored API keys in plaintext
```

Session keys are stored in `sessionStorage` as plaintext JSON (line 100).

#### Security Rating: 2/10

This is obfuscation, not security. Any user with browser DevTools access can extract all API keys in seconds.

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 6/10 | Has lock/unlock UX flow, but encryption is fake |
| Type Safety | 8/10 | Well-typed vault state interface |
| Error Handling | 6/10 | Basic error handling for storage operations |
| Integration | 7/10 | Properly integrated with settings flow |
| 2026 Relevance | 3/10 | Base64 is not encryption — unacceptable in 2026 |

#### Recommended Fix

Replace with **Web Crypto API** (zero dependencies, available in all modern browsers):

```typescript
// AES-256-GCM encryption using SubtleCrypto
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
  await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']),
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encoder.encode(plaintext)
);
```

---

### INFRA-05: Local Database

| Field | Value |
|-------|-------|
| **Files** | `src/lib/db.ts` (Dexie), `src/features/council/store/memory-store.ts` (localStorage), `src/lib/synthesis-cache.ts` (idb/openDB), `src/stores/analytics.store.ts` (Dexie) |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 7.0/10 |

#### How It Works

Multiple storage backends serving different purposes:
- **Dexie** (`db.ts`) — sessions, decisions, expert configurations with versioned migrations
- **idb** (`synthesis-cache.ts`) — synthesis cache with `openDB`, versioned schema (lines 40-51), task hash indexing, 7-day expiry, max 100 entries
- **localStorage** (`memory-store.ts`) — memory/settings via Zustand persist middleware
- **Dexie** (`analytics.store.ts`) — analytics data

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 7/10 | Multiple backends for different data lifecycle needs |
| Type Safety | 7/10 | Dexie tables typed, some loose typing in cache |
| Error Handling | 6/10 | **Empty catch blocks** in synthesis-cache.ts at lines 169, 198, 249, 268 |
| Integration | 8/10 | Used across all features |
| 2026 Relevance | 7/10 | Dexie + idb is standard; consider OPFS for large data |

#### Issue: Silent Error Swallowing

```typescript
// synthesis-cache.ts — lines 169, 198, 249, 268
try {
  // ... cache operation
} catch {
  // Empty — errors silently swallowed
}
```

These empty catch blocks can hide data corruption or quota exhaustion. At minimum, log warnings.

---

### INFRA-06: Mobile Drawers

| Field | Value |
|-------|-------|
| **Files** | `src/components/MobileMenu.tsx` |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 6.8/10 |

#### How It Works

Uses Radix UI Sheet component (slide-out panel). Displays:
- Vault status indicator
- Menu items: History, Memory, Settings
- Quick stats dashboard
- Proper `aria` labels
- Responsive design with `md:hidden` breakpoint

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 7/10 | Core navigation covered |
| Type Safety | 8/10 | Properly typed props and state |
| Error Handling | 5/10 | No error boundaries within drawer |
| Integration | 7/10 | Connected to vault store and stats |
| 2026 Relevance | 7/10 | Radix is well-maintained |

---

### INFRA-07: Virtualized Lists

| Field | Value |
|-------|-------|
| **Files** | *(none)* |
| **Status** | 👻 **PHANTOM** |
| **Overall Score** | 1.0/10 |

#### Finding

**Zero implementation exists.** No `react-window`, `react-virtual`, `@tanstack/react-virtual`, or `useVirtualizer` found anywhere in the codebase. `package.json` has no virtualization library as a dependency.

This feature was claimed but never implemented. Any list rendering large datasets (expert outputs, session history, analytics) will cause performance degradation as data grows.

#### Impact

- Session history with 100+ entries will cause jank
- Expert output lists with long content will have layout thrash
- Analytics tables will become unusable at scale

#### Recommended Fix

Install `@tanstack/react-virtual` and apply to:
1. Session history list
2. Expert output cards (when > 5 experts)
3. Analytics data tables

---

### INFRA-08: Streaming AI

| Field | Value |
|-------|-------|
| **Files** | `src/features/council/api/ai-client.ts`, `src/features/council/hooks/use-streaming-synthesis.ts` |
| **Status** | ✅ **WORKING** |
| **Overall Score** | 7.6/10 |

#### How It Works

`callExpertStreaming` function in `ai-client.ts` (lines 140-233):
- Uses `fetch` with `stream: true` in the request body
- Processes SSE (Server-Sent Events) chunks via `ReadableStream` reader (line 189)
- Parses `data: [DONE]` termination signal
- Accumulates tokens for cost calculation

`use-streaming-synthesis.ts` provides a React hook with:
- State management for streaming progress
- Progress tracking (tokens received, estimated completion)
- `AbortController` for user-initiated cancellation
- `synthesizeVerdictStreaming` integration

#### Code Quality

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Completeness | 8/10 | Full streaming pipeline with abort support |
| Type Safety | 7/10 | SSE chunk parsing has loose typing |
| Error Handling | 7/10 | Stream errors caught, abort handled |
| Integration | 8/10 | Used in main synthesis flow |
| 2026 Relevance | 8/10 | SSE streaming is the standard pattern |

---

## 🔒 Special Audit A — Vault Security Deep Dive

### Vulnerability Summary

| Aspect | Finding | Severity |
|--------|---------|----------|
| Encryption | `btoa()` Base64 encoding at `vault.ts:87` | 🔴 CRITICAL |
| Password Hash | `simpleHash()` djb2 to base36 at `vault.ts:27-35` | 🔴 CRITICAL |
| Storage | localStorage — accessible to any JS on the domain | 🟡 MEDIUM |
| Session Keys | sessionStorage as plaintext JSON at line 100 | 🔴 CRITICAL |

### Attack Scenario

1. Open browser DevTools → Console
2. Execute:
   ```javascript
   const vault = localStorage.getItem('council_vault_v18');
   if (vault) console.log(atob(JSON.parse(vault).encodedKeys));
   ```
3. All API keys (OpenRouter, GitHub tokens) revealed instantly

### Password Hash Analysis

```typescript
// vault.ts:27-35
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
```

This produces a **32-bit integer** (4 billion possible values). With modern hardware, the entire keyspace can be brute-forced in under 1 second.

### Security Rating: 2/10

Provides obfuscation only. Any browser extension, XSS attack, or shared computer user can extract all stored API keys.

### Recommended Architecture

```
Password → PBKDF2 (600K iterations, SHA-256) → AES-256-GCM key
API Keys → AES-256-GCM encrypt → localStorage (encrypted blob)
Decrypt requires correct password every session
```

**Zero new dependencies required** — Web Crypto API (`crypto.subtle`) is available in all modern browsers.

---

## 📜 Special Audit B — npm Scripts Verification

| Script | Command | Status | Notes |
|--------|---------|--------|-------|
| `npm run scout` | `tsx src/lib/scout.ts` | ✅ WORKING | Execution guard at lines 987-992 |
| `npm run mirror` | `tsx scripts/run-mirror.ts` | ✅ WORKING | Generates markdown report |
| `npm run quality` | chains mirror + improve | ✅ WORKING | Full quality pipeline |
| `npm run learn` | `tsx scripts/run-self-improve.ts` | ✅ WORKING | Falls back to mock data if no GitHub token |
| `npm run twin` | `tsx src/lib/twin-mimicry.ts` | ❌ BROKEN | `require.main === module` at line 479 — CommonJS check fails in ESM |
| `npm run heist` | `tsx scripts/heist-prompts.ts` | ✅ WORKING | Downloads from fabric repo |
| `npm run studio` | opens browser | ✅ WORKING | Dev environment launcher |

### Broken Script Detail: `npm run twin`

The root cause is at `twin-mimicry.ts:479`:
```typescript
if (require.main === module) {
  main();
}
```

Since `package.json` declares `"type": "module"`, all `.ts` files are treated as ESM by `tsx`. In ESM, `require` is not defined, causing either a ReferenceError or (if shimmed) always evaluating to `false`.

**Fix:** Use ESM-compatible entry check:
```typescript
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

---

## ⚡ Special Audit C — React Query Integration

### Verdict: ✅ MEANINGFUL (Not Cosmetic)

React Query is **genuinely and meaningfully used** across the application. This is not a cosmetic install.

### Evidence

| Location | Usage | Details |
|----------|-------|---------|
| `App.tsx:19` | QueryClient creation | Default config with sensible defaults |
| `App.tsx:36` | QueryClientProvider | Wraps entire application tree |
| `useGitHub.ts` | Full query lifecycle | `staleTime` (5-60 min), `gcTime` (30 min-48 hr), retry (1-3), exponential backoff |
| `useGitHub.ts:224` | `invalidateQueries` | Proper cache invalidation on mutations |
| `useCommunityIntelligence.ts` | Reddit + HN queries | Separate stale times per data source |
| `use-council-queries.ts` | `useQuery` + `useMutation` | `enabled: false` pattern for on-demand queries; mutations for synthesis |

### Assessment

- **Cache strategy**: Appropriate stale times per data type (5 min for fast-changing, 60 min for stable)
- **Error recovery**: Retry counts tuned per endpoint reliability
- **Invalidation**: Manual invalidation used correctly after mutations
- **Query keys**: Properly structured for granular cache control

---

## 🏗️ Special Audit D — Architecture & Feature Configs

### Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Main landing / redirect |
| `/council` | Core Council orchestration UI |
| `/features` | Feature browser |
| `/quality` | Quality dashboard |
| `/analytics` | Analytics & metrics |
| `/features/scout` | Scout intelligence UI |

### Feature Configuration System

`feature-config-store.ts` defines **23+ feature configurations** — a comprehensive feature flag system. `FeatureConfigModal.tsx` provides UI for managing these configs.

### Critical Architecture Gap

**All meta-features (scout, mirror, learn, heist, twin) are CLI-only with zero web UI integration.**

The app has routes and a feature config system, but the meta-features bypass both entirely. They exist as standalone CLI scripts with no:
- API endpoints
- React components
- Route integration
- Dashboard widgets

This creates a split experience: the web app for Council orchestration, and the terminal for everything else.

---

## 🎯 Prioritized Action List

### 🔴 P0 — Critical (Fix Immediately)

| # | Action | Effort | Impact | Files |
|---|--------|--------|--------|-------|
| 1 | **Replace vault Base64 with Web Crypto AES-256-GCM** | 2-3 days | Fixes critical security vulnerability | `vault.ts` |
| 2 | **Fix Twin Mimicry ESM compatibility** | 30 min | Unbreaks `npm run twin` | `twin-mimicry.ts:479` |

### 🟡 P1 — High Priority (This Sprint)

| # | Action | Effort | Impact | Files |
|---|--------|--------|--------|-------|
| 3 | **Add error logging to empty catch blocks** | 1 hour | Prevents silent data corruption | `synthesis-cache.ts:169,198,249,268`, `self-improve.ts:119-120` |
| 4 | **Create Dev Tools Dashboard page** | 3-5 days | Unifies CLI-only features into web UI | New route + components |
| 5 | **Install @tanstack/react-virtual** | 1-2 days | Implements phantom virtualized lists feature | New dependency + list components |

### 🟢 P2 — Medium Priority (Next Sprint)

| # | Action | Effort | Impact | Files |
|---|--------|--------|--------|-------|
| 6 | **Add UI for Prompt HEIST browser** | 2-3 days | Browse/select/integrate heisted prompts | New components |
| 7 | **Upgrade self-improve to LLM-based extraction** | 3-5 days | 2026-ready analysis instead of regex | `self-improve.ts` |
| 8 | **Add npm script for twin-mimicry-v2** | 15 min | V2 becomes runnable | `package.json` |
| 9 | **Replace execSync in twin-mimicry with API calls** | 2-3 days | Portability + security | `twin-mimicry.ts`, `twin-mimicry-v2.ts` |

### ⚪ P3 — Low Priority (Backlog)

| # | Action | Effort | Impact | Files |
|---|--------|--------|--------|-------|
| 10 | **Add LLM-powered Code Mirror analysis** | 5-7 days | Semantic understanding vs regex matching | `code-mirror.ts` |
| 11 | **Integrate mirror results into CI pipeline** | 2-3 days | Automated quality gating | New CI config |
| 12 | **Add prompt quality scoring to HEIST** | 2-3 days | Filter low-quality prompts | `prompt-heist.ts` |

---

## 🖥️ Dev Tools Dashboard Specification

### Purpose

Unify all CLI-only meta-features into a single web dashboard accessible from the main navigation.

### Proposed Route

`/dev-tools` — accessible from both main nav and mobile drawer

### Layout

```
┌─────────────────────────────────────────────────┐
│  Dev Tools Dashboard                    [Refresh]│
├──────────┬──────────────────────────────────────┤
│          │                                       │
│  Sidebar │  Main Content Area                    │
│          │                                       │
│  🔬 Mirror│  [Selected Tool Panel]               │
│  📚 Learn │                                       │
│  👯 Twin  │  - Status indicator                   │
│  🏴 Heist │  - Run button / Last run time         │
│  🔭 Scout │  - Results viewer                     │
│  📊 Quality│ - Configuration options               │
│          │                                       │
├──────────┴──────────────────────────────────────┤
│  Activity Log (last 10 runs with timestamps)     │
└─────────────────────────────────────────────────┘
```

### Panel Specifications

| Tool | Panel Contents |
|------|---------------|
| **Mirror** | Run scan button, severity filter, file-by-file results, trend chart |
| **Learn** | Trigger learning, knowledge base file browser, pattern confidence viewer |
| **Twin** | Twin profile viewer, pattern comparison table, git history visualization |
| **Heist** | Prompt browser with search, category filter, preview panel, integrate button |
| **Scout** | Intelligence results, opportunity cards, pain point clusters |
| **Quality** | Combined mirror + learn pipeline, one-click full analysis |

### Technical Requirements

- Lazy-loaded (`React.lazy`) to keep bundle under 2MB
- Each panel wrapped in `FeatureErrorBoundary`
- Results cached in IndexedDB (Dexie) with 24-hour expiry
- Runs tools via Web Workers or deferred execution (not blocking main thread)
- Mobile-responsive with stacked layout below `md` breakpoint

---

## 📈 Summary Statistics

| Metric | Value |
|--------|-------|
| Total features audited | 12 |
| Working | 9 (75%) |
| Broken | 1 (8%) |
| Phantom | 1 (8%) |
| Critically insecure | 1 (8%) |
| Average quality score | 6.3/10 |
| Empty catch blocks found | 6+ |
| `any` type violations | 2+ files |
| CLI-only features needing UI | 5 |
| Critical security fixes needed | 1 (vault) |
| Estimated total fix effort | ~4-6 weeks |

---

## 🏁 Conclusion

The Council's **core orchestration layer is solid** — React Query, Zod validation, error handling, and streaming are all well-implemented and production-grade. The meta-features (self-improve, twin, heist, mirror) are **functional but isolated** in CLI-land with no web UI integration.

**Three urgent actions:**
1. 🔴 **Fix the vault** — Base64 is not encryption. Use Web Crypto API.
2. 🔴 **Fix twin mimicry** — One-line ESM compatibility fix.
3. 🟡 **Build the Dev Tools Dashboard** — Unify 5 CLI-only tools into the web app.

The infrastructure foundation is strong enough to support these improvements without architectural changes. The biggest 2026 gap is the reliance on regex-based analysis where LLM-powered reasoning would provide dramatically better results.

---

*Report generated by deep code audit. All line numbers reference the codebase at time of analysis.*
