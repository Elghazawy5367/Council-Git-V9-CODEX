// scripts/council-synthesis.ts
// Autonomous Council Synthesis Engine
// Runs after the Quality Pipeline generates data/intelligence/quality-pipeline-*.md
// Reads the top-scored opportunities, routes them through 3 Council expert personas,
// synthesises a final verdict, and writes to data/verdicts/{niche}-{date}.md
//
// Called by: .github/workflows/autonomous-council.yml
// Run manually: npm run synthesise
//
// Cost estimate per full run (all 5 niches):
//   3 experts × 5 niches × ~$0.0003/call (deepseek) ≈ $0.005 per daily run

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ── Types ──────────────────────────────────────────────────────────────────────

interface NicheConfig {
  id: string;
  name: string;
  enabled?: boolean;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ExpertAnalysis {
  expertName: string;
  model: string;
  persona: string;
  analysis: string;
  tokensUsed: number;
}

interface SynthesisVerdict {
  niche: string;
  nicheName: string;
  date: string;
  topOpportunity: string;
  expertAnalyses: ExpertAnalysis[];
  synthesisVerdict: string;
  actionItems: string[];
  confidenceScore: number;
  totalTokensUsed: number;
}

// ── Council Expert Personas (3 of 7 — cost-optimised for daily automation) ────
// Using the 3 cheapest models that cover the critical angles:
// Blue Ocean (market), Ruthless Validator (reality check), Passive Income (monetisation)

const AUTONOMOUS_EXPERTS = [
  {
    name: 'Blue Ocean Strategist',
    model: 'deepseek/deepseek-chat',
    systemPrompt: `You are the Blue Ocean Strategist. Your framework is the ERRC Grid.
You identify markets where competition is irrelevant because demand is unmet.
You look for: high stars + abandoned repos, pain points nobody has solved, niches ignored by SaaS.
Respond in exactly this format:
OPPORTUNITY: [one sentence]
BLUE_OCEAN_ANGLE: [why this is uncontested]
EFFORT_ESTIMATE: [low/medium/high]
REVENUE_POTENTIAL: [$X-Y/month realistic estimate]
VERDICT: [pursue/investigate/skip]`,
  },
  {
    name: 'Ruthless Validator',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    systemPrompt: `You are the Ruthless Validator. Your framework is The Mom Test.
You ruthlessly separate real pain from imagined pain.
Real = people pay for it now, complain about it loudly, have workarounds for it.
Imagined = sounds nice but nobody has budget, urgency, or desperation.
Respond in exactly this format:
REAL_PAIN_SCORE: [0-10]
EVIDENCE: [specific quotes/signals from the data]
RED_FLAGS: [why this might not be real]
MARKET_SIZE_ESTIMATE: [small/medium/large with reasoning]
VERDICT: [pursue/investigate/skip]`,
  },
  {
    name: 'Passive Income Architect',
    model: 'cohere/command-r-08-2024',
    systemPrompt: `You are the Passive Income Architect. Your framework is ROT Analysis (Return on Time).
You design the minimum viable product that generates recurring revenue with minimum maintenance.
You think in: one-time builds, recurring subscriptions, productised services.
Respond in exactly this format:
MVP_DESCRIPTION: [what to build in 2-4 weeks]
PRICING_MODEL: [freemium/subscription/one-time - with price point]
CUSTOMER_ACQUISITION: [how first 10 customers find you, for free]
MONTHLY_RECURRING_TARGET: [$X in 6 months, realistic]
VERDICT: [pursue/investigate/skip]`,
  },
] as const;

// ── OpenRouter Caller ─────────────────────────────────────────────────────────

async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string,
  retries = 3
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add it to GitHub repository secrets.'
    );
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/Elghazawy5367/Council-Git-V9',
          'X-Title': 'Council-Git-V9 Autonomous Synthesis',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 600,
          temperature: 0.4,
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000 * (attempt + 1);
        console.warn(`[Synthesis] Rate limited. Waiting ${waitMs}ms...`);
        await sleep(waitMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { total_tokens: number };
      };

      const content = data.choices?.[0]?.message?.content ?? '';
      const tokensUsed = data.usage?.total_tokens ?? 0;

      return { content, tokensUsed };

    } catch (error) {
      if (attempt === retries - 1) throw error;
      await sleep(2000 * Math.pow(2, attempt));
    }
  }

  throw new Error(`OpenRouter call failed after ${retries} attempts`);
}

// ── Report Reader ─────────────────────────────────────────────────────────────

function getLatestQualityReport(nicheId: string): string | null {
  // Find quality-pipeline reports using fs (no glob needed — flat directory)
  const intelligenceDir = path.join(process.cwd(), 'data', 'intelligence');
  const reportsDir = path.join(process.cwd(), 'data', 'reports');

  const findInDir = (dir: string, prefix: string): string[] => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
      .map(f => path.join(dir, f))
      .sort()
      .reverse();
  };

  // Prefer quality-pipeline reports from data/intelligence/
  const qpFiles = findInDir(intelligenceDir, `quality-pipeline-${nicheId}-`);
  if (qpFiles.length > 0) {
    return fs.readFileSync(qpFiles[0], 'utf8');
  }

  // Fallback: any report from data/reports/ for this niche
  if (!fs.existsSync(reportsDir)) return null;
  const fallbackFiles = fs.readdirSync(reportsDir)
    .filter(f => f.includes(`-${nicheId}-`) && f.endsWith('.md'))
    .map(f => path.join(reportsDir, f))
    .sort()
    .reverse();

  if (fallbackFiles.length === 0) return null;
  return fs.readFileSync(fallbackFiles[0], 'utf8');
}

function extractTopOpportunities(reportContent: string, limit = 3): string {
  // Extract Platinum and Gold sections from quality pipeline report
  const sections = reportContent.split(/^(?=#{2,3}\s)/m);
  const highValue = sections
    .filter(s => /💎|Platinum|🥇|Gold|Score.*[89]\d|Score.*100/i.test(s))
    .slice(0, limit)
    .map(s => s.trim().slice(0, 500))
    .join('\n\n---\n\n');

  if (highValue.length > 0) return highValue;

  // Fallback: first 1500 chars of report
  return reportContent.slice(0, 1500);
}

// ── Synthesis ─────────────────────────────────────────────────────────────────

async function synthesiseNiche(
  niche: NicheConfig,
  reportContent: string,
  date: string
): Promise<SynthesisVerdict> {
  const topOpportunities = extractTopOpportunities(reportContent);
  const expertAnalyses: ExpertAnalysis[] = [];
  let totalTokens = 0;

  console.log(`[Synthesis][${niche.id}] Running 3 expert analyses...`);

  for (const expert of AUTONOMOUS_EXPERTS) {
    const userPrompt =
      `Niche: ${niche.name}\n\n` +
      `Today's top intelligence (${date}):\n\n` +
      `${topOpportunities}`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: expert.systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await callOpenRouter(messages, expert.model);
      expertAnalyses.push({
        expertName: expert.name,
        model: expert.model,
        persona: expert.systemPrompt.split('\n')[0],
        analysis: result.content,
        tokensUsed: result.tokensUsed,
      });
      totalTokens += result.tokensUsed;
      console.log(`[Synthesis][${niche.id}] ✅ ${expert.name} complete (${result.tokensUsed} tokens)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Synthesis][${niche.id}] ❌ ${expert.name} failed: ${msg}`);
      expertAnalyses.push({
        expertName: expert.name,
        model: expert.model,
        persona: expert.systemPrompt.split('\n')[0],
        analysis: `Analysis failed: ${msg}`,
        tokensUsed: 0,
      });
    }

    // Space calls to avoid rate limiting
    await sleep(1500);
  }

  // Extract verdicts from each expert
  const verdicts = expertAnalyses
    .map(e => {
      const match = e.analysis.match(/VERDICT:\s*(pursue|investigate|skip)/i);
      return match ? match[1].toLowerCase() : 'investigate';
    });

  const pursueCnt = verdicts.filter(v => v === 'pursue').length;
  const skipCnt = verdicts.filter(v => v === 'skip').length;
  const confidenceScore = Math.round((pursueCnt / AUTONOMOUS_EXPERTS.length) * 100);

  // Determine overall action
  const overallVerdict =
    pursueCnt >= 2 ? '🔥 PURSUE — Multiple experts aligned' :
    skipCnt >= 2 ? '❌ SKIP — Multiple experts rejected' :
    '🔍 INVESTIGATE — Mixed signals, needs validation';

  // Extract action items from expert analyses
  const actionItems: string[] = [];
  for (const expert of expertAnalyses) {
    const mvp = expert.analysis.match(/MVP_DESCRIPTION:\s*(.+)/i);
    const acquisition = expert.analysis.match(/CUSTOMER_ACQUISITION:\s*(.+)/i);
    if (mvp) actionItems.push(`Build: ${mvp[1].trim().slice(0, 150)}`);
    if (acquisition) actionItems.push(`Acquire: ${acquisition[1].trim().slice(0, 150)}`);
  }

  // Extract top opportunity name from first expert
  const firstAnalysis = expertAnalyses[0]?.analysis ?? '';
  const oppMatch = firstAnalysis.match(/OPPORTUNITY:\s*(.+)/i);
  const topOpportunity = oppMatch
    ? oppMatch[1].trim().slice(0, 200)
    : `${niche.name} market opportunity`;

  // Build synthesis paragraph
  const revenueMatches = expertAnalyses
    .map(e => e.analysis.match(/REVENUE_POTENTIAL:\s*(.+)/i))
    .filter(Boolean)
    .map(m => m![1].trim());

  const synthesisVerdict =
    `${overallVerdict}\n\n` +
    `Expert consensus: ${pursueCnt}/3 recommend pursuing.\n` +
    (revenueMatches.length > 0 ? `Revenue signals: ${revenueMatches[0]}\n` : '') +
    `Confidence: ${confidenceScore}%`;

  return {
    niche: niche.id,
    nicheName: niche.name,
    date,
    topOpportunity,
    expertAnalyses,
    synthesisVerdict,
    actionItems: [...new Set(actionItems)].slice(0, 6),
    confidenceScore,
    totalTokensUsed: totalTokens,
  };
}

// ── Report Writer ─────────────────────────────────────────────────────────────

function generateVerdictMarkdown(verdict: SynthesisVerdict): string {
  const lines: string[] = [
    `# Council Verdict — ${verdict.nicheName}`,
    `**Date:** ${verdict.date}  `,
    `**Confidence:** ${verdict.confidenceScore}%  `,
    `**Tokens used:** ${verdict.totalTokensUsed.toLocaleString()}  `,
    '',
    '---',
    '',
    `## Top Opportunity`,
    '',
    verdict.topOpportunity,
    '',
    '---',
    '',
    `## Council Synthesis`,
    '',
    verdict.synthesisVerdict,
    '',
    '---',
    '',
    `## Expert Analyses`,
    '',
  ];

  for (const expert of verdict.expertAnalyses) {
    lines.push(`### ${expert.expertName}`);
    lines.push(`*Model: ${expert.model}*`);
    lines.push('');
    lines.push('```');
    lines.push(expert.analysis);
    lines.push('```');
    lines.push('');
  }

  if (verdict.actionItems.length > 0) {
    lines.push('---', '', '## Action Items', '');
    for (const item of verdict.actionItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[Synthesis] Council Autonomous Synthesis starting...');
  console.log(`[Synthesis] ${new Date().toISOString()}`);

  const date = new Date().toISOString().split('T')[0];

  // Load enabled niches
  const configPath = path.join(process.cwd(), 'config', 'target-niches.yaml');
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(raw) as { niches: NicheConfig[] };
  const niches = config.niches.filter(n => n.enabled !== false);

  console.log(`[Synthesis] Processing ${niches.length} niches: ${niches.map(n => n.id).join(', ')}`);

  fs.mkdirSync('data/verdicts', { recursive: true });

  let totalCost = 0;
  let successCount = 0;

  for (const niche of niches) {
    console.log(`\n[Synthesis] === ${niche.name} ===`);

    const reportContent = getLatestQualityReport(niche.id);
    if (!reportContent) {
      console.warn(`[Synthesis][${niche.id}] No quality report found — skipping`);
      continue;
    }

    try {
      const verdict = await synthesiseNiche(niche, reportContent, date);

      // Write markdown verdict
      const mdPath = `data/verdicts/${niche.id}-${date}.md`;
      fs.writeFileSync(mdPath, generateVerdictMarkdown(verdict));

      // Write JSON for programmatic access
      const jsonPath = `data/verdicts/${niche.id}-${date}.json`;
      fs.writeFileSync(jsonPath, JSON.stringify(verdict, null, 2));

      totalCost += verdict.totalTokensUsed;
      successCount++;

      console.log(
        `[Synthesis][${niche.id}] ✅ Verdict: ${verdict.synthesisVerdict.split('\n')[0]} ` +
        `(${verdict.confidenceScore}% confidence)`
      );

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Synthesis][${niche.id}] ❌ Failed: ${msg}`);
    }

    // Pause between niches to respect rate limits
    await sleep(3000);
  }

  console.log(`\n[Synthesis] Complete: ${successCount}/${niches.length} niches`);
  console.log(`[Synthesis] Total tokens: ${totalCost.toLocaleString()}`);
  console.log(`[Synthesis] Estimated cost: $${(totalCost * 0.0000003).toFixed(4)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Synthesis] Fatal: ${msg}`);
    process.exit(1);
  });
