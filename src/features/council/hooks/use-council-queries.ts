import { useQuery, useMutation } from "@tanstack/react-query";
import { callExpert } from "@/features/council/api/ai-client";
import { Expert, ExecutionMode, SynthesisConfig, SynthesisResult } from "@/features/council/lib/types";
import { SYNTHESIS_TIERS, getPromptBuilder } from "@/lib/synthesis-engine";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// This helper function encapsulates the direct API call for synthesis.
async function callSynthesisAPI(prompt: string, model: string, temperature: number, maxTokens: number, apiKey: string): Promise<{
  content: string;
  tokens: {
    prompt: number;
    completion: number;
  };
  cost: number;
}> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "The Council V18 - Synthesizer"
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature,
      max_tokens: maxTokens
    })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "Synthesis failed";
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;

  // Simplified cost calculation
  const costPerMillion = model.includes("gemini") ? 0.075 : 0.14;
  const cost = (promptTokens + completionTokens) / 1000000 * costPerMillion;
  return {
    content,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens
    },
    cost
  };
}

// Kept for potential future use, but not the focus of this refactor.
export const useCallExpert = (expert: Expert, task: string, mode: ExecutionMode, apiKey: string, additionalContext?: string, previousOutputs?: Record<string, string>) => {
  return useQuery({
    queryKey: ["callExpert", expert.id, task, mode, additionalContext, previousOutputs],
    queryFn: () => callExpert(expert, task, mode, apiKey, additionalContext, previousOutputs),
    retry: 3,
    enabled: false
  });
};

// Refined 'useExecuteSynthesis' to ensure alignment with 'executeCouncil'
export const useExecuteSynthesis = () => {
  return useMutation<SynthesisResult, Error, {
    expertOutputs: ExpertOutput[];
    task: string;
    config: SynthesisConfig;
    apiKey: string;
    onProgress?: (message: string) => void;
  }>({
    mutationFn: async ({
      expertOutputs,
      task,
      config,
      apiKey,
      onProgress
    }) => {
      const tierConfig = SYNTHESIS_TIERS[config.tier];
      const promptBuilder = getPromptBuilder(config.tier);
      const prompt = promptBuilder(expertOutputs, task, config.customInstructions || '');
      onProgress?.(`Running ${tierConfig.name}...`);
      const primaryModel = config.model || 'google/gemini-2.0-flash-001';
      const fallbackModel = config.fallbackModel || 'deepseek/deepseek-chat';
      try {
        // Attempt to call the primary model
        const result = await callSynthesisAPI(prompt, primaryModel, config.temperature || tierConfig.temperature, config.maxTokens || tierConfig.maxTokens, apiKey);
        return {
          content: result.content,
          tier: config.tier,
          model: primaryModel,
          tokens: result.tokens,
          cost: result.cost
        };
      } catch (error) {
        onProgress?.(`Retrying with fallback model...`);

        // If the primary model fails, the mutation function automatically tries the fallback.
        const result = await callSynthesisAPI(prompt, fallbackModel, config.temperature || tierConfig.temperature, config.maxTokens || tierConfig.maxTokens, apiKey);
        return {
          content: result.content,
          tier: config.tier,
          model: fallbackModel,
          // Report that the fallback model was used
          tokens: result.tokens,
          cost: result.cost
        };
      }
    },
    // If the entire mutationFn (including the fallback attempt) fails,
    // TanStack Query will retry the whole process 2 more times.
    retry: 2
  });
};