// OpenRouter AI Client - Real API integration with Unified Synthesis
import { Expert, ExecutionMode } from '@/features/council/lib/types';
import { buildSystemPrompt, MAGNIFICENT_7_FLEET } from '@/lib/config';
import { getPromptBuilder, SYNTHESIS_TIERS } from '@/lib/synthesis-engine';
import type { SynthesisTier } from '@/lib/types';
import { SynthesisOutputSchema, type SynthesisOutput } from '@/lib/types';
import { calculateWeights, createWeightedOutputs, detectWeightImbalance } from '@/lib/expert-weights';
import { findCachedSynthesis, cacheSynthesis, initSynthesisCache } from '@/lib/synthesis-cache';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

// Calculate cost based on model and tokens
export function calculateCost(modelId: string, promptTokens: number, completionTokens: number): number {
  const model = MAGNIFICENT_7_FLEET.find((m) => m.id === modelId);
  if (!model) return 0;

  // costPer1k is per 1000 output tokens (simplified)
  const outputCost = completionTokens / 1000 * model.costPer1k;
  const inputCost = promptTokens / 1000 * (model.costPer1k * 0.1); // Input typically 10% of output cost
  return outputCost + inputCost;
}

// Non-streaming API call
export async function callExpert(expert: Expert, task: string, mode: ExecutionMode, apiKey: string, additionalContext?: string, previousOutputs?: Record<string, string>): Promise<{
  output: string;
  cost: number;
  tokens: {
    prompt: number;
    completion: number;
  };
}> {
  // Ensure hasWebSearch is always defined
  const expertWithDefaults = {
    ...expert,
    hasWebSearch: expert.hasWebSearch ?? false,
    modeBehavior: {
      ...expert.modeBehavior,
      modeName: expert.modeBehavior.modeName || "defaultMode",
      description: expert.modeBehavior.description || "No description provided",
      isEnabled: expert.modeBehavior.isEnabled ?? true
    }
  };

  // Explicitly cast expertWithDefaults to the expected structure
  const systemPrompt = buildSystemPrompt({
    basePersona: expertWithDefaults.basePersona,
    modeBehavior: expertWithDefaults.modeBehavior,
    hasWebSearch: expertWithDefaults.hasWebSearch,
    knowledge: expertWithDefaults.knowledge.map((file) => ({
      name: file.name,
      content: file.content
    }))
  }, mode, additionalContext);
  let userPrompt = `TASK: ${task}`;

  // For sequential mode, include previous outputs
  if (mode === 'sequential' && previousOutputs && Object.keys(previousOutputs).length > 0) {
    userPrompt += '\n\n--- PREVIOUS EXPERT ANALYSES ---\n';
    for (const [expertId, output] of Object.entries(previousOutputs)) {
      userPrompt += `\n[Expert ${expertId}]:\n${output}\n`;
    }
    userPrompt += '--- END PREVIOUS ANALYSES ---\n\nBuild upon these insights with your unique perspective.';
  }

  // For adversarial mode, you might want to include opposing arguments
  if (mode === 'adversarial' && previousOutputs && Object.keys(previousOutputs).length > 0) {
    userPrompt += '\n\n--- OTHER EXPERT POSITIONS ---\n';
    for (const [expertId, output] of Object.entries(previousOutputs)) {
      userPrompt += `\n[${expertId}]:\n${output}\n`;
    }
    userPrompt += '--- END POSITIONS ---\n\nChallenge these positions and defend your own view.';
  }
  const messages: OpenRouterMessage[] = [{
    role: 'system',
    content: systemPrompt
  }, {
    role: 'user',
    content: userPrompt
  }];
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'The Council V18'
    },
    body: JSON.stringify({
      model: expert.model,
      messages,
      temperature: expert.config.temperature,
      max_tokens: expert.config.maxTokens,
      top_p: expert.config.topP,
      presence_penalty: expert.config.presencePenalty,
      frequency_penalty: expert.config.frequencyPenalty
    })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }
  const data: OpenRouterResponse = await response.json();
  const output = data.choices[0]?.message?.content || 'No response generated';
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  const cost = calculateCost(expert.model, promptTokens, completionTokens);
  return {
    output,
    cost,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens
    }
  };
}

// Streaming API call
export async function callExpertStreaming(expert: Expert, task: string, mode: ExecutionMode, apiKey: string, callbacks: StreamCallbacks, additionalContext?: string, previousOutputs?: Record<string, string>): Promise<{
  cost: number;
}> {
  // Explicitly cast expert to the expected structure
  const systemPrompt = buildSystemPrompt({
    basePersona: expert.basePersona,
    modeBehavior: expert.modeBehavior,
    hasWebSearch: expert.hasWebSearch ?? false,
    knowledge: expert.knowledge.map((file) => ({
      name: file.name,
      content: file.content
    }))
  }, mode, additionalContext);
  let userPrompt = `TASK: ${task}`;
  if (mode === 'sequential' && previousOutputs && Object.keys(previousOutputs).length > 0) {
    userPrompt += '\n\n--- PREVIOUS EXPERT ANALYSES ---\n';
    for (const [expertId, output] of Object.entries(previousOutputs)) {
      userPrompt += `\n[Expert ${expertId}]:\n${output}\n`;
    }
    userPrompt += '--- END PREVIOUS ANALYSES ---\n\nBuild upon these insights.';
  }
  const messages: OpenRouterMessage[] = [{
    role: 'system',
    content: systemPrompt
  }, {
    role: 'user',
    content: userPrompt
  }];
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'The Council V18'
    },
    body: JSON.stringify({
      model: expert.model,
      messages,
      temperature: expert.config.temperature,
      max_tokens: expert.config.maxTokens,
      top_p: expert.config.topP,
      stream: true
    })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let fullText = '';
  let estimatedTokens = 0;
  try {
    while (true) {
      const {
        done,
        value
      } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, {
        stream: true
      });
      const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'));
      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            estimatedTokens += 1; // Rough estimate
            callbacks.onToken(content);
          }
        } catch
        {

          // Skip malformed JSON
        }}}
    callbacks.onComplete(fullText);

    // Estimate cost (rough calculation since streaming doesn\'t return exact tokens)
    const estimatedPromptTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    const cost = calculateCost(expert.model, estimatedPromptTokens, estimatedTokens);
    return {
      cost
    };
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error('Stream error'));
    throw error;
  }
}

// Helper: Sleep for exponential backoff
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: Retry with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (lastError.message.includes('400') || lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError;
      }
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
export interface SynthesisConfig {
  tier?: SynthesisTier;
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  customInstructions?: string;
  structuredOutput?: boolean; // Enable/disable structured JSON parsing
  useWeighting?: boolean; // Enable/disable expert weighting (default: true)
  useCache?: boolean; // Enable/disable semantic caching (default: true)
  useStreaming?: boolean; // Enable/disable streaming output (default: false)
}
export interface StreamingSynthesisCallbacks {
  onToken?: (token: string, fullText: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

// Helper: Parse markdown synthesis into structured format
function parseStructuredSynthesis(markdownText: string): SynthesisOutput | null {
  try {
    // Attempt to extract JSON block if present
    const jsonMatch = markdownText.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return SynthesisOutputSchema.parse(parsed);
    }

    // Fallback: Parse markdown structure
    const consensusMatch = markdownText.match(/##?\s*(?:Consensus|Conclusion|Main Findings?)[:]\s*\n(.*?)(?=\n##|\n\n##|$)/is);
    const insightsMatch = markdownText.match(/##?\s*(?:Key Insights?|Findings?)[:]\s*\n([\s\S]*?)(?=\n##|\n\n##|$)/is);
    const conflictsMatch = markdownText.match(/##?\s*(?:Conflicts?|Disagreements?)[:]\s*\n([\s\S]*?)(?=\n##|\n\n##|$)/is);
    const actionMatch = markdownText.match(/##?\s*(?:Action Items?|Recommendations?)[:]\s*\n([\s\S]*?)(?=\n##|\n\n##|$)/is);

    // Extract bullet points
    const extractBullets = (text: string): string[] => {
      const bullets = text.match(/^[-*]\s+(.+)$/gm);
      return bullets ? bullets.map((b) => b.replace(/^[-*]\s+/, '').trim()) : [];
    };
    const structured: SynthesisOutput = {
      consensus: consensusMatch?.[1]?.trim() || markdownText.split('\n\n')[0] || 'No consensus extracted',
      keyInsights: insightsMatch ? extractBullets(insightsMatch[1]).map((content) => ({
        category: 'general',
        content,
        confidence: 'medium' as const
      })) : [],
      conflicts: conflictsMatch ? extractBullets(conflictsMatch[1]).map((topic) => ({
        topic,
        positions: [],
        severity: 'moderate' as const
      })) : undefined,
      confidence: 'medium',
      actionItems: actionMatch ? extractBullets(actionMatch[1]) : undefined
    };
    return SynthesisOutputSchema.parse(structured);
  } catch (error) {
    return null;
  }
}

// Helper: Build structured output instruction
function buildStructuredPrompt(basePrompt: string, includeWeights: boolean = false): string {
  const weightField = includeWeights ? ',\n  "expertWeights": [ // optional\n    {\n      "expertName": "Expert Name",\n      "weight": 0.85,\n      "normalizedWeight": 0.28\n    }\n  ]' : '';
  return `${basePrompt}

CRITICAL: Format your response as valid JSON following this exact schema:

{
  "consensus": "Main synthesized conclusion (string)",
  "keyInsights": [
    {
      "category": "opportunity|risk|pattern|recommendation",
      "content": "The insight itself",
      "confidence": "low|medium|high",
      "supportingExperts": ["Expert A", "Expert B"] // optional
    }
  ],
  "conflicts": [ // optional
    {
      "topic": "Area of disagreement",
      "positions": ["Position 1", "Position 2"],
      "severity": "minor|moderate|critical"
    }
  ],
  "confidence": "low|medium|high",
  "reasoning": "Explanation of synthesis process", // optional
  "actionItems": ["Action 1", "Action 2"]${weightField}
}

Wrap your JSON response in \`\`\`json and \`\`\` tags.`;
}

// Helper: Build weighted synthesis context
function buildWeightedContext(weights: ReturnType<typeof createWeightedOutputs>, imbalance: ReturnType<typeof detectWeightImbalance>): string {
  // Use array to avoid string concatenation performance issues
  const parts: string[] = ['\n\n--- EXPERT WEIGHT ANALYSIS ---\n\n'];

  // Sort by weight
  const sorted = [...weights].sort((a, b) => b.weight - a.weight);
  parts.push('Expert weights (higher = more reliable):\n');
  
  for (const w of sorted) {
    const percentage = (w.normalizedWeight * 100).toFixed(1);
    const stars = '★'.repeat(Math.ceil(w.weight * 5));
    parts.push(`- ${w.expertName}: ${(w.weight * 100).toFixed(0)}% quality (${percentage}% of total) ${stars}\n`);
  }
  
  parts.push(`\nTop ${Math.min(3, sorted.length)} experts to prioritize: ${sorted.slice(0, 3).map((w) => w.expertName).join(', ')}\n`);
  
  if (imbalance.hasImbalance) {
    parts.push(`\n⚠️ WEIGHT IMBALANCE DETECTED: ${imbalance.warning}\n`);
  }
  
  parts.push('\n--- END WEIGHT ANALYSIS ---\n\n');
  parts.push('**INSTRUCTION**: Prioritize insights from higher-weighted experts in your synthesis. ');
  parts.push('When experts disagree, give more weight to those with higher quality scores.\n');
  
  return parts.join('');
}

// Streaming synthesis function
export async function synthesizeVerdictStreaming(expertOutputs: Record<string, {
  expertName: string;
  output: string;
  model?: string;
}>, task: string, _mode: ExecutionMode, apiKey: string, callbacks: StreamingSynthesisCallbacks, config?: SynthesisConfig): Promise<{
  verdict: string;
  cost: number;
  tier: SynthesisTier;
  structured?: SynthesisOutput;
  weights?: ReturnType<typeof createWeightedOutputs>;
}> {
  const tier = config?.tier || 'balanced';
  const synthesizerModel = config?.model || 'google/gemini-2.0-flash-001';
  const tierConfig = SYNTHESIS_TIERS[tier];
  const temperature = config?.temperature ?? tierConfig.temperature;
  const maxTokens = config?.maxTokens ?? tierConfig.maxTokens;
  const enableStructured = config?.structuredOutput ?? true;
  const useWeighting = config?.useWeighting ?? true;

  // Calculate expert weights if enabled
  let weights: ReturnType<typeof createWeightedOutputs> | undefined;
  let weightContext = '';
  if (useWeighting) {
    weights = createWeightedOutputs(expertOutputs, task);
    const weightAnalysis = calculateWeights(expertOutputs, task);
    const imbalance = detectWeightImbalance(weightAnalysis);
    weightContext = buildWeightedContext(weights, imbalance);
  }

  // Convert expert outputs to array format
  const expertArray = Object.entries(expertOutputs).map(([id, data]) => ({
    name: data.expertName,
    model: id,
    content: data.output
  }));

  // Build prompt
  const promptBuilder = getPromptBuilder(tier);
  let synthesisPrompt = promptBuilder(expertArray, task, config?.customInstructions || '');
  if (useWeighting && weightContext) {
    synthesisPrompt = weightContext + synthesisPrompt;
  }
  if (enableStructured) {
    synthesisPrompt = buildStructuredPrompt(synthesisPrompt, useWeighting);
  }

  // Streaming API call
  let fullText = '';
  let promptTokens = 0;
  let completionTokens = 0;
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': `The Council V18 - Synthesizer (${tier}, Streaming)`
      },
      body: JSON.stringify({
        model: synthesizerModel,
        messages: [{
          role: 'user',
          content: synthesisPrompt
        }],
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Streaming error: ${response.status}`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const {
        done,
        value
      } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, {
        stream: true
      });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            callbacks.onToken?.(token, fullText);
          }

          // Track token usage
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens || 0;
            completionTokens = parsed.usage.completion_tokens || 0;
          }
        } catch (e)
        {

          // Skip invalid JSON lines
        }}}
    callbacks.onComplete?.(fullText);

    // Calculate cost
    const cost = calculateCost(synthesizerModel, promptTokens, completionTokens);

    // Parse structured output if enabled
    const structured = enableStructured ? parseStructuredSynthesis(fullText) : undefined;
    if (structured && useWeighting && weights) {
      structured.expertWeights = weights.map((w) => ({
        expertName: w.expertName,
        weight: w.weight,
        normalizedWeight: w.normalizedWeight
      }));
    }
    return {
      verdict: fullText,
      cost,
      tier,
      structured: structured || undefined,
      weights: useWeighting ? weights : undefined
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

// Unified synthesis function with tiered strategies, resilience, weighted voting, caching, and optional streaming
export async function synthesizeVerdict(expertOutputs: Record<string, {
  expertName: string;
  output: string;
  model?: string;
}>, task: string, mode: ExecutionMode, apiKey: string, config?: SynthesisConfig, streamingCallbacks?: StreamingSynthesisCallbacks): Promise<{
  verdict: string;
  cost: number;
  tier: SynthesisTier;
  structured?: SynthesisOutput;
  weights?: ReturnType<typeof createWeightedOutputs>;
}> {
  const useStreaming = config?.useStreaming ?? false;

  // Route to streaming version if enabled and callbacks provided
  if (useStreaming && streamingCallbacks) {
    return synthesizeVerdictStreaming(expertOutputs, task, mode, apiKey, streamingCallbacks, config);
  }

  // Otherwise use standard batch synthesis
  const tier = config?.tier || 'balanced';
  const synthesizerModel = config?.model || 'google/gemini-2.0-flash-001';
  const fallbackModel = config?.fallbackModel || 'deepseek/deepseek-chat';
  const tierConfig = SYNTHESIS_TIERS[tier];
  const temperature = config?.temperature ?? tierConfig.temperature;
  const maxTokens = config?.maxTokens ?? tierConfig.maxTokens;
  const enableStructured = config?.structuredOutput ?? true; // Default: enabled
  const useWeighting = config?.useWeighting ?? true; // Default: enabled
  const useCache = config?.useCache ?? true; // Default: enabled

  // Initialize cache
  if (useCache) {
    await initSynthesisCache();
  }

  // Check cache first if enabled
  if (useCache) {
    const cached = await findCachedSynthesis(expertOutputs, task, tier);
    if (cached) {
      return {
        verdict: cached.verdict,
        cost: 0,
        // No cost for cache hit
        tier,
        structured: cached.structured,
        weights: useWeighting ? createWeightedOutputs(expertOutputs, task) : undefined
      };
    }
  }

  // Calculate expert weights if enabled
  let weights: ReturnType<typeof createWeightedOutputs> | undefined;
  let weightContext = '';
  if (useWeighting) {
    weights = createWeightedOutputs(expertOutputs, task);
    const weightAnalysis = calculateWeights(expertOutputs, task);
    const imbalance = detectWeightImbalance(weightAnalysis);
    weightContext = buildWeightedContext(weights, imbalance);
    if (imbalance.hasImbalance) {
      console.warn('Weight imbalance detected in expert outputs');
    }}

  // Convert expert outputs to array format for synthesis-engine
  const expertArray = Object.entries(expertOutputs).map(([id, data]) => ({
    name: data.expertName,
    model: id,
    content: data.output
  }));

  // Build prompt using synthesis-engine's tiered strategies
  const promptBuilder = getPromptBuilder(tier);
  let synthesisPrompt = promptBuilder(expertArray, task, config?.customInstructions || '');

  // Add weight context if enabled
  if (useWeighting && weightContext) {
    synthesisPrompt = weightContext + synthesisPrompt;
  }

  // Add structured output instructions if enabled
  if (enableStructured) {
    synthesisPrompt = buildStructuredPrompt(synthesisPrompt, useWeighting);
  }

  // Main synthesis call with retry
  const callSynthesis = async (model: string): Promise<{
    verdict: string;
    cost: number;
    structured?: SynthesisOutput;
  }> => {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': `The Council V18 - Synthesizer (${tier})`
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: synthesisPrompt
        }],
        temperature,
        max_tokens: maxTokens
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Synthesis error: ${response.status}`);
    }
    const data: OpenRouterResponse = await response.json();
    const verdict = data.choices[0]?.message?.content || 'Synthesis failed';
    const modelConfig = MAGNIFICENT_7_FLEET.find((m) => m.id === model);
    const cost = modelConfig ? calculateCost(model, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0) : 0;

    // Parse structured output if enabled
    const structured = enableStructured ? parseStructuredSynthesis(verdict) : undefined;

    // Add weight info to structured output if both are enabled
    if (structured && useWeighting && weights) {
      structured.expertWeights = weights.map((w) => ({
        expertName: w.expertName,
        weight: w.weight,
        normalizedWeight: w.normalizedWeight
      }));
    }
    return {
      verdict,
      cost,
      structured: structured || undefined
    };
  };
  try {
    // Try primary model with retry
    const result = await retryWithBackoff(() => callSynthesis(synthesizerModel), 3);

    // Cache the result if enabled
    if (useCache && result.verdict) {
      await cacheSynthesis(expertOutputs, task, tier, result.verdict, result.structured, result.cost);
    }
    return {
      ...result,
      tier,
      weights: useWeighting ? weights : undefined
    };
  } catch (primaryError) {
    try {
      // Fallback to secondary model
      const result = await retryWithBackoff(() => callSynthesis(fallbackModel), 2);

      // Cache the fallback result if enabled
      if (useCache && result.verdict) {
        await cacheSynthesis(expertOutputs, task, tier, result.verdict, result.structured, result.cost);
      }
      return {
        ...result,
        tier,
        weights: useWeighting ? weights : undefined
      };
    } catch (fallbackError) {
      // Both failed, throw comprehensive error
      throw new Error(`Synthesis failed with both primary (${synthesizerModel}) and fallback (${fallbackModel}) models. ` + `Last error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }
}

// Fixed type mismatch for Expert and ExecutionMode
export async function generateOutput(expert: Expert, task: string, mode: ExecutionMode, additionalContext?: string, previousOutputs?: Record<string, string>): Promise<{
  output: string;
  cost: number;
  tokens: {
    prompt: number;
    completion: number;
  };
}> {
  const systemPrompt = buildSystemPrompt({
    basePersona: expert.basePersona,
    modeBehavior: {
      separated: expert.modeBehavior.separated,
      synthesis: expert.modeBehavior.synthesis,
      debate: expert.modeBehavior.debate,
      pipeline: expert.modeBehavior.pipeline
    },
    hasWebSearch: expert.hasWebSearch ?? false,
    knowledge: expert.knowledge
  }, mode, additionalContext);
  let userPrompt = `TASK: ${task}`;

  // For sequential mode, include previous outputs
  if (mode === 'sequential' && previousOutputs && Object.keys(previousOutputs).length > 0) {
    userPrompt += '\n\n--- PREVIOUS EXPERT ANALYSES ---\n';
    for (const [expertId, output] of Object.entries(previousOutputs)) {
      userPrompt += `\n[Expert ${expertId}]:\n${output}\n`;
    }
    userPrompt += '--- END PREVIOUS ANALYSES ---\n\nBuild upon these insights.';
  }

  // Use systemPrompt in the API call

  // Temporary usage to avoid unused variable error

  // Placeholder for API call
  return {
    output: 'Generated output',
    cost: 0,
    tokens: {
      prompt: 0,
      completion: 0
    }
  };
}