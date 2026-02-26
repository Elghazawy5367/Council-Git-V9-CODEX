# Onboarding Guide: The Council Intelligence Platform

Welcome to **The Council**, a sophisticated multi-agent intelligence platform designed for market discovery, technical analysis, and strategic synthesis.

## 🏗️ Core Architecture: Two-Phase Workflow

The Council operates on a unique two-phase architecture designed to maximize insight depth while minimizing bias.

### Phase 1: Expert Parallel Analysis
- **Execution:** Multiple specialized AI agents (Experts) analyze the input in parallel.
- **Independence:** Experts do not see each other's work during this phase to prevent "groupthink."
- **Variety:** Experts can be configured with different models (The Magnificent 7 Fleet), personas (Architect, Logician, Strategist), and specialized knowledge bases.

### Phase 2: Strategic Synthesis (The Judge)
- **Consolidation:** The outputs from Phase 1 are gathered and passed to a "Judge."
- **Modes:**
  - **Ruthless Judge:** Filters weak arguments and highlights only high-confidence insights.
  - **Consensus Judge:** Finds common ground and builds a unified perspective.
  - **Debate Judge:** Highlights conflicts and weighs opposing arguments.
  - **Pipeline Judge:** Sequential refinement where insights are built upon layer by layer.

## 📦 State Management & Stores

The project has transitioned from a legacy `CouncilContext` to a **Unified Store Architecture** using Zustand.

- **Unified Council Store:** `src/stores/council.store.ts` (Handles the main workflow).
- **Analytics Store:** `src/stores/analytics.store.ts` (Tracks decision history and metrics).
- **Settings Store:** `src/stores/settings.store.ts` (API keys, Vault status, and global configs).

**Migration Note:** Files in `src/features/*/store/` are now deprecated proxies. Always use the unified stores in the root `src/stores/` directory for new components.

## 🔒 Security: The Vault

The platform uses a "Vault" system for secure API key management.
- Keys are never stored in plain text in `localStorage`.
- They are encrypted/encoded and stored in the Vault.
- The Vault must be "unlocked" with a password to load keys into the active session.
- Implementation: `src/lib/vault.ts`.

## 🛠️ Intelligence Tools (Scripts)

The platform includes several standalone intelligence engines:
- **Scout:** GitHub opportunity detection (`src/lib/scout.ts`).
- **Mining Drill:** Deep pain point extraction from repo issues.
- **Goldmine Detector:** Identifies high-demand, low-competition abandoned projects.
- **Viral Radar:** Scans for emerging trends in real-time.

## 🚀 Development Workflow

1. **Architecture Check:** Run `npm run validate-architecture` (scripts/validate-architecture.ts) to ensure no circular dependencies or cross-feature violations.
2. **Type Safety:** The project uses TypeScript strictly. Run `npm run type-check` before submitting.
3. **Intelligence Testing:** Use `npx tsx scripts/test-all-features.ts` to verify the execution of intelligence algorithms.

## 📂 Directory Structure

- `src/features/`: UI-specific components organized by domain.
- `src/stores/`: Unified state management.
- `src/services/`: API wrappers and core business logic.
- `src/lib/`: Reusable algorithms and shared utilities.
- `scripts/`: CLI tools for intelligence gathering and maintenance.
- `docs/archive/`: Historical implementation summaries and feature briefs.
