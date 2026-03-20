// src/lib/github-models-client.ts
// Free LLM inference via GitHub Models API
// Uses existing GITHUB_TOKEN — zero additional API keys or cost
// Endpoint: https://models.inference.ai.azure.com/chat/completions
//
// USE THIS FOR: background GitHub Actions tasks
//   - Summarizing intelligence reports
//   - Scoring opportunities with reasoning
//   - Generating pain point themes
//   - Writing brief descriptions
//
// KEEP OPENROUTER FOR: Council MOE UI only
//   - The 7-expert Council deliberation
//   - Synthesis and Judge verdict
//   - Any user-facing AI interaction
//
// Rate limit: 15 requests/minute on free tier (sufficient for all automation)
// Available models as of March 2026:
//   meta-llama-3.1-70b-instruct  — Best for analysis and reasoning
//   phi-4                         — Best for structured output / JSON
//   mistral-nemo                  — Best for fast summarization

// ── Types ──────────────────────────────────────────────────────────────────────

export type GitHubModel =
  | 'meta-llama-3.1-70b-instruct'
  | 'phi-4'
  | 'mistral-nemo';

export interface GitHubModelsMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GitHubModelsOptions {
  model?: GitHubModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface GitHubModelsResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

interface RawCompletionResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

interface RawErrorResponse {
  error: { message: string; code?: string };
}

// ── Rate limit state (in-process, per runner) ─────────────────────────────────

let _lastCallTime = 0;
const MIN_INTERVAL_MS = 4_500; // ~13 req/min, safely under 15/min limit

// ── Core client ───────────────────────────────────────────────────────────────

/**
 * Call GitHub Models API with a user prompt.
 * Handles rate limiting, retries, and error reporting automatically.
 */
export async function callGitHubModels(
  userPrompt: string,
  options: GitHubModelsOptions = {}
): Promise<GitHubModelsResponse> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      '[GitHubModels] GITHUB_TOKEN is not set. ' +
      'This is auto-provided by GitHub Actions — check your workflow env block.'
    );
  }

  const {
    model = 'meta-llama-3.1-70b-instruct',
    maxTokens = 800,
    temperature = 0.3,
    systemPrompt,
  } = options;

  const messages: GitHubModelsMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  return executeWithRateLimit(messages, model, maxTokens, temperature, token);
}

/**
 * Call GitHub Models API with an explicit messages array.
 * Use when you need multi-turn conversation context.
 */
export async function callGitHubModelsWithMessages(
  messages: GitHubModelsMessage[],
  options: GitHubModelsOptions = {}
): Promise<GitHubModelsResponse> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('[GitHubModels] GITHUB_TOKEN is not set.');
  }

  const {
    model = 'meta-llama-3.1-70b-instruct',
    maxTokens = 800,
    temperature = 0.3,
  } = options;

  return executeWithRateLimit(messages, model, maxTokens, temperature, token);
}

// ── Specialised helpers used by intelligence features ─────────────────────────

/**
 * Summarise a markdown intelligence report to 3-5 bullet points.
 * Uses phi-4 for structured output.
 */
export async function summariseReport(
  reportContent: string,
  niche: string
): Promise<string> {
  const trimmed = reportContent.slice(0, 3000); // stay within context

  const response = await callGitHubModels(
    `Summarise the following market intelligence report for the "${niche}" niche into 3-5 concise bullet points. Focus on: top pain points, buying signals, and opportunity scores.\n\n---\n${trimmed}`,
    {
      model: 'phi-4',
      maxTokens: 400,
      temperature: 0.2,
      systemPrompt:
        'You are a market intelligence analyst. Return only a bullet-point summary. No preamble.',
    }
  );

  return response.content;
}

/**
 * Score an opportunity with a brief reasoning explanation.
 * Returns structured JSON: { score: number, reasoning: string, recommendation: string }
 */
export async function scoreOpportunity(
  opportunityTitle: string,
  opportunityDescription: string,
  niche: string
): Promise<{ score: number; reasoning: string; recommendation: string }> {
  const prompt = `Score this market opportunity for a solo founder in the "${niche}" niche.

Opportunity: ${opportunityTitle}
Description: ${opportunityDescription.slice(0, 500)}

Return ONLY valid JSON with these exact keys:
{
  "score": <number 0-100>,
  "reasoning": "<one sentence>",
  "recommendation": "<'pursue' | 'investigate' | 'skip'>"
}`;

  const response = await callGitHubModels(prompt, {
    model: 'phi-4',
    maxTokens: 200,
    temperature: 0.1,
    systemPrompt:
      'You are a market opportunity scorer. Return ONLY valid JSON. No markdown, no preamble.',
  });

  try {
    // Strip any accidental markdown fences
    const cleaned = response.content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as {
      score: number;
      reasoning: string;
      recommendation: string;
    };
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      reasoning: String(parsed.reasoning || ''),
      recommendation: String(parsed.recommendation || 'investigate'),
    };
  } catch {
    return { score: 50, reasoning: 'Parse failed — manual review needed', recommendation: 'investigate' };
  }
}

/**
 * Extract top pain themes from a batch of discussion/issue texts.
 * Uses Llama 70B for best reasoning quality.
 */
export async function extractPainThemes(
  texts: string[],
  niche: string
): Promise<string[]> {
  const combined = texts.slice(0, 15).join('\n\n---\n\n').slice(0, 4000);

  const response = await callGitHubModels(
    `From these community posts in the "${niche}" niche, identify the top 5 recurring pain themes. Each theme should be a short phrase (3-7 words).\n\n${combined}`,
    {
      model: 'meta-llama-3.1-70b-instruct',
      maxTokens: 300,
      temperature: 0.2,
      systemPrompt:
        'You are a market researcher. Return exactly 5 pain themes, one per line, no numbering, no explanation.',
    }
  );

  return response.content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 80)
    .slice(0, 5);
}

// ── Internal execution with rate limiting ─────────────────────────────────────

async function executeWithRateLimit(
  messages: GitHubModelsMessage[],
  model: GitHubModel,
  maxTokens: number,
  temperature: number,
  token: string,
  retries = 3
): Promise<GitHubModelsResponse> {
  // Enforce minimum interval between calls
  const now = Date.now();
  const elapsed = now - _lastCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      _lastCallTime = Date.now();

      const response = await fetch(
        'https://models.inference.ai.azure.com/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
          }),
        }
      );

      if (response.status === 429) {
        // Rate limit — wait and retry
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 15_000;
        console.warn(
          `[GitHubModels] Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...`
        );
        await sleep(waitMs);
        continue;
      }

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errBody = await response.json() as RawErrorResponse;
          errorMsg = errBody.error?.message ?? errorMsg;
        } catch {
          // ignore parse failure
        }
        throw new Error(`[GitHubModels] API error: ${errorMsg}`);
      }

      const data = await response.json() as RawCompletionResponse;

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('[GitHubModels] Empty response from API');
      }

      return {
        content: data.choices[0].message.content,
        model: data.model,
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      };

    } catch (error) {
      if (attempt === retries - 1) throw error;
      const waitMs = 2000 * Math.pow(2, attempt);
      console.warn(
        `[GitHubModels] Attempt ${attempt + 1} failed. Retrying in ${waitMs}ms...`
      );
      await sleep(waitMs);
    }
  }

  throw new Error(`[GitHubModels] Failed after ${retries} attempts`);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Health check — verify GitHub Models API is reachable with current token.
 * Call this once at the start of a workflow to fail fast.
 */
export async function checkGitHubModelsHealth(): Promise<boolean> {
  try {
    await callGitHubModels('Say "ok" in one word.', {
      model: 'phi-4',
      maxTokens: 5,
      temperature: 0,
    });
    return true;
  } catch {
    return false;
  }
}
