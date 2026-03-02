import { callDevToolsLLM } from './llm-client';

export interface TwinProfile {
  yourRepoName: string;
  targetRepoName: string;
  analyzedAt: number;
  alignmentScore: number;
  dimensions: Array<{
    name: string;
    yourScore: number;
    targetScore: number;
    gap: number;
    advice: string;
  }>;
  adoptionPlan: Array<{
    priority: number;
    change: string;
    effort: 'low' | 'medium' | 'high';
    estimatedImpact: string;
  }>;
}

export async function analyzeTwinDNA(
  yourFiles: Array<{ path: string; content: string }>,
  targetRepo: string
): Promise<TwinProfile> {
  // 1. Fetch target repo sample via GitHub API
  const treeRes = await fetch(
    `https://api.github.com/repos/${targetRepo}/git/trees/HEAD?recursive=1`
  );
  const tree = treeRes.ok ? (await treeRes.json()).tree : [];
  const tsFiles = (tree as Array<{path: string; type: string}>)
    .filter(f => f.type === 'blob' && f.path.endsWith('.ts') && !f.path.includes('node_modules'))
    .slice(0, 8);

  const targetSamples = await Promise.allSettled(
    tsFiles.map(async f => {
      const res = await fetch(
        `https://raw.githubusercontent.com/${targetRepo}/HEAD/${f.path}`
      );
      return res.ok ? `// ${f.path}\n${(await res.text()).slice(0, 600)}` : '';
    })
  );
  const targetCode = targetSamples
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => (r as PromiseFulfilledResult<string>).value)
    .join('\n\n---\n\n')
    .slice(0, 5000);

  const yourCode = yourFiles
    .map(f => `// ${f.path}\n${f.content.slice(0, 600)}`)
    .join('\n\n---\n\n')
    .slice(0, 4000);

  // 2. LLM comparison
  const response = await callDevToolsLLM({
    model: 'anthropic/claude-sonnet-4-5',
    systemPrompt: `You are a code archaeology expert comparing two codebases.
    Produce a structured TwinProfile JSON — no markdown, no preamble.
    
    JSON schema:
    {
      "alignmentScore": 0,
      "dimensions": [{"name":"string","yourScore":0,"targetScore":0,"gap":0,"advice":"string"}],
      "adoptionPlan": [{"priority":1,"change":"string","effort":"low|medium|high","estimatedImpact":"string"}]
    }
    
    Dimensions to score (yourScore and targetScore each 0-100):
    - Type Safety, Error Handling, Architecture Clarity, AI Integration Patterns,
      Test Coverage, Code Organization`,
    userPrompt: `YOUR CODEBASE SAMPLE (Council-Git-V9):
    ${yourCode}
    
    TARGET CODEBASE SAMPLE (${targetRepo}):
    ${targetCode}
    
    Compare honestly. Where is the target ahead? Where are you ahead?
    Adoption plan: max 5 items, sorted by priority (1=do first).`,
    responseFormat: { type: 'json_object' },
    maxTokens: 1500,
  });

  const parsed = JSON.parse(response.content);
  return {
    yourRepoName: 'Council-Git-V9',
    targetRepoName: targetRepo,
    analyzedAt: Date.now(),
    alignmentScore: parsed.alignmentScore ?? 0,
    dimensions: parsed.dimensions ?? [],
    adoptionPlan: parsed.adoptionPlan ?? [],
  };
}
