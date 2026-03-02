import { callExpert } from '@/features/council/api/ai-client';
import { type HeistPrompt } from '@/lib/db';

const FABRIC_API_BASE = 'https://api.github.com/repos/danielmiessler/fabric/contents/patterns';

export async function fetchFabricPrompts(githubToken?: string): Promise<HeistPrompt[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (githubToken) headers['Authorization'] = `token ${githubToken}`;

  const response = await fetch(FABRIC_API_BASE, { headers });
  if (!response.ok) throw new Error('Failed to fetch Fabric patterns');

  const patterns: any[] = await response.json();
  const results: HeistPrompt[] = [];

  // Limit to 20 for now to avoid massive API usage/waiting
  const limitedPatterns = patterns.slice(0, 20);

  for (const p of limitedPatterns) {
    try {
      const contentResp = await fetch(`${FABRIC_API_BASE}/${p.name}/system.md`, { headers });
      if (!contentResp.ok) continue;

      const contentData = await contentResp.json();
      const content = atob(contentData.content);

      results.push({
        id: p.name,
        name: p.name.replace(/-/g, ' '),
        content,
        wordCount: content.split(/\s+/).length,
        category: 'uncategorized',
        qualityScore: 0,
        useCases: [],
        lastUpdated: Date.now()
      });
    } catch (e) {
      console.warn(`Failed to fetch content for ${p.name}`);
    }
  }

  return results;
}

export async function categorizePrompt(prompt: HeistPrompt, apiKey: string): Promise<HeistPrompt> {
  const response = await callExpert(
    {
      name: "Prompt Strategist",
      role: "AI Prompt Engineering Expert",
      model: "google/gemini-2.0-flash",
      basePersona: "Categorize AI prompts accurately. Return ONLY JSON.",
      config: { temperature: 0, maxTokens: 200, topP: 1, presencePenalty: 0, frequencyPenalty: 0 },
      knowledge: [],
      hasWebSearch: false,
      modeBehavior: { separated: "", synthesis: "", debate: "", pipeline: "" }
    },
    `Categorize this AI prompt. Return ONLY JSON: {"category":"string","qualityScore":0-100,"useCases":["string"]}

    PROMPT CONTENT:
    ${prompt.content.slice(0, 1000)}`,
    "separated",
    apiKey,
    undefined,
    undefined,
    { type: 'json_object' }
  );

  try {
    const meta = JSON.parse(response.output);
    return { ...prompt, ...meta };
  } catch (error) {
    return { ...prompt, category: 'analysis', qualityScore: 70 };
  }
}
