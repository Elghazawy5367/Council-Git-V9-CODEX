// Lightweight LLM client for devtools features
// Uses the same OpenRouter API as callExpert() but with a simpler interface
// suitable for structured JSON extraction tasks

import { useSettingsStore } from '@/features/settings/store/settings-store';
import { calculateCost } from '@/features/council/api/ai-client';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface LLMCallOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  responseFormat?: { type: 'json_object' };
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCallResult {
  content: string;
  cost: number;
  tokens: { prompt: number; completion: number };
}

function getApiKey(): string {
  const key = useSettingsStore.getState().openRouterKey;
  if (!key) throw new Error('OpenRouter API key not set. Unlock vault first.');
  return key;
}

export async function callDevToolsLLM(options: LLMCallOptions): Promise<LLMCallResult> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model: options.model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt },
    ],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1200,
  };

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'The Council V18 - Dev Tools',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  const cost = calculateCost(options.model, promptTokens, completionTokens);

  return { content, cost, tokens: { prompt: promptTokens, completion: completionTokens } };
}
