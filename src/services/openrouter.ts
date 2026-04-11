/**
 * OpenRouter Service
 * Handles all LLM API calls via OpenRouter
 * Supports parallel execution with error isolation
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// LLM Configuration
export interface LLMConfig {
  id: string;
  name: string;
  model: string; // OpenRouter model ID
  provider: string;
  enabled: boolean;
  icon: string;
}

// LLM Response
export interface LLMResponse {
  llmId: string;
  llmName: string;
  response: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
  tokens?: { prompt: number; completion: number; total: number };
  cost?: number;
  timestamp: number;
}

// Execution Progress
export interface ExecutionProgress {
  llmId: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  progress: number; // 0-100
}

// Available LLMs via OpenRouter
export const AVAILABLE_LLMS: LLMConfig[] = [
  {
    id: 'gpt4',
    name: 'GPT-4 Turbo',
    model: 'openai/gpt-4-turbo-preview',
    provider: 'OpenAI',
    enabled: true,
    icon: '🤖',
  },
  {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    model: 'anthropic/claude-3.5-sonnet',
    provider: 'Anthropic',
    enabled: true,
    icon: '🧠',
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    model: 'google/gemini-pro',
    provider: 'Google',
    enabled: true,
    icon: '✨',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    model: 'deepseek/deepseek-chat',
    provider: 'DeepSeek',
    enabled: true,
    icon: '🔮',
  },
];

export default class OpenRouterService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Execute all enabled LLMs in parallel
   */
  async executeParallel(
    prompt: string,
    files: File[],
    selectedLLMs: string[],
    onProgress?: (progress: ExecutionProgress) => void
  ): Promise<LLMResponse[]> {
    const llmsToExecute = AVAILABLE_LLMS.filter((llm) => 
      selectedLLMs.includes(llm.id) && llm.enabled
    );

    const promises = llmsToExecute.map(async (llm) => {
      if (onProgress) {
        onProgress({
          llmId: llm.id,
          status: 'running',
          progress: 0,
        });
      }

      try {
        const response = await this.callLLM(llm, prompt, files);
        
        if (onProgress) {
          onProgress({
            llmId: llm.id,
            status: 'complete',
            progress: 100,
          });
        }

        return response;
      } catch (error) {
        if (onProgress) {
          onProgress({
            llmId: llm.id,
            status: 'failed',
            progress: 0,
          });
        }

        return {
          llmId: llm.id,
          llmName: llm.name,
          response: '',
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        };
      }
    });

    const results = await Promise.all(promises);
    return results;
  }

  /**
   * Call a single LLM
   */
  private async callLLM(
    llm: LLMConfig,
    prompt: string,
    files: File[]
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    // Process files if any
    let fullPrompt = prompt;
    if (files.length > 0) {
      const fileContents = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          return `File: ${file.name}\n${text}`;
        })
      );
      fullPrompt = `${prompt}\n\n${fileContents.join('\n\n')}`;
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'The Council V18',
      },
      body: JSON.stringify({
        model: llm.model,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    const usage = data.usage;

    return {
      llmId: llm.id,
      llmName: llm.name,
      response: content,
      status: 'success',
      tokens: usage
        ? {
            prompt: usage.prompt_tokens || 0,
            completion: usage.completion_tokens || 0,
            total: usage.total_tokens || 0,
          }
        : undefined,
      cost: usage ? this.calculateCost(usage.prompt_tokens, usage.completion_tokens) : 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate cost (simplified)
   */
  private calculateCost(promptTokens: number, completionTokens: number): number {
    // Rough estimate: $0.01 per 1000 tokens
    return ((promptTokens + completionTokens) / 1000) * 0.01;
  }
}
