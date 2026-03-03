import { callExpert } from '@/features/council/api/ai-client';
import { githubAPI } from '@/lib/api-client';

export interface TwinProfile {
  alignmentScore: number;
  dimensions: {
    typeSafety: number;
    errorHandling: number;
    architecture: number;
    aiPatterns: number;
    testingPhilosophy: number;
    maintainability: number;
  };
  gaps: Array<{ dimension: string; yourScore: number; targetScore: number; advice: string }>;
  adoptionPlan: Array<{ priority: number; change: string; effort: 'low' | 'medium' | 'high' }>;
}

export async function analyzeTwinDNA(
  yourRepoSample: string,
  targetRepoUrl: string,
  apiKey: string,
  githubToken?: string
): Promise<TwinProfile> {
  // 1. Fetch target repo info
  const [owner, repo] = targetRepoUrl.replace('https://github.com/', '').split('/');
  const headers = githubToken ? { Authorization: `token ${githubToken}` } : {};

  const repoData = await githubAPI.get<any>(`/repos/${owner}/${repo}`, {}, { headers });
  const readmeData = await githubAPI.get<any>(`/repos/${owner}/${repo}/readme`, {}, { headers });
  const readmeContent = atob(readmeData.content);

  // 2. Call LLM for comparison
  const response = await callExpert(
    {
      name: "DNA Architect",
      role: "Elite Code Archaeology Expert",
      model: "anthropic/claude-3.5-sonnet",
      basePersona: "You are a code archaeology expert. Compare two codebases' DNA and produce actionable adoption advice. Return ONLY valid JSON.",
      config: { temperature: 0, maxTokens: 2000, topP: 1, presencePenalty: 0, frequencyPenalty: 0 },
      knowledge: [],
      hasWebSearch: false,
      modeBehavior: { separated: "", synthesis: "", debate: "", pipeline: "" }
    },
    `Compare these two codebases and produce a TwinProfile JSON.

    YOUR CODEBASE SAMPLE:
    ${yourRepoSample.slice(0, 4000)}

    TARGET REPOSITORY (${targetRepoUrl}):
    Description: ${repoData.description}
    README: ${readmeContent.slice(0, 3000)}`,
    "separated",
    apiKey,
    undefined,
    undefined,
    { type: 'json_object' }
  );

  try {
    return JSON.parse(response.output);
  } catch (error) {
    console.error("[TwinAnalyzer] Failed to parse LLM response:", error);
    throw new Error("Failed to analyze Twin DNA");
  }
}
