# Deep Logic Analysis: The Council Core Engine

This document provides a technical deep dive into the core intelligence orchestration logic of The Council.

## ⚖️ The Ruthless Judge (Synthesis Engine)

The synthesis engine (`src/lib/synthesis-engine.ts`) is responsible for unifying disparate expert perspectives into a single actionable verdict. It uses a tiered approach to reasoning:

### 1. Tiered Reasoning Strategies
- **Quick (Standard Synthesis):** Fast extraction of consensus and unique insights without explicit step-by-step reasoning. Best for simple queries.
- **Balanced (Chain-of-Thought):** Forces the model to extract evidence, cluster claims, and detect conflicts *before* delivering the final verdict. This significantly improves accuracy in complex scenarios.
- **Deep (Tree-of-Thought):** The model explores multiple interpretive branches (Consensus-First, Conflict-First, and Complementary) and scores them before selecting the most accurate path for final synthesis.

### 2. Strategic Formatting
The engine uses high-contrast Markdown formatting (## ⚖️ CONSENSUS, ## ⚔️ CONTRADICTIONS) to ensure the output is readable and clearly identifies areas of expert disagreement.

## 🤖 AI Client Orchestration

The AI Client (`src/features/council/api/ai-client.ts`) handles the technical integration with OpenRouter and manages the multi-agent lifecycle.

### 1. Expert Weighting Algorithm
Before synthesis, the client calls `calculateWeights` which evaluates:
- **Domain Relevance:** Does the expert's specialty match the task?
- **Output Quality:** (Placeholder for future metrics)
- **Model Capability:** Higher weights for larger/more capable models (e.g., DeepSeek V3 vs GPT-4o Mini).
The Judge is then provided with a "Weight Analysis" context, instructing it to prioritize insights from higher-weighted experts.

### 2. Resilience & Error Handling
- **Retry with Backoff:** All API calls use exponential backoff to handle rate limits and transient network failures.
- **Model Fallback:** If the primary synthesis model (e.g., Gemini 2.0 Flash) fails after 3 retries, the system automatically falls back to a secondary model (e.g., DeepSeek Chat).

### 3. Execution Modes
- **Parallel:** Default. Experts run independently.
- **Sequential:** Each expert sees the outputs of previous experts, allowing for iterative refinement.
- **Adversarial:** Experts are explicitly shown opposing views and instructed to challenge them.

## 🧠 Efficiency & Performance

### 1. Semantic Caching
The system uses a synthesis cache (`src/lib/synthesis-cache.ts`) to avoid redundant API calls. If the same set of expert outputs and the same task are submitted, the system returns a cached verdict instantly.

### 2. Cost Management
Token usage is tracked in real-time. Input costs are estimated at 10% of output costs to provide a unified "Expert Cost" metric across different providers.

### 3. Streaming SSE
The client implements a robust `TextDecoder` and `getReader()` loop to handle Server-Sent Events from OpenRouter, providing immediate visual feedback to the user as the agents "think."
