// src/lib/github-discussions.ts
// GitHub Discussions Intelligence Feature
// Mines developer long-form conversations — richer signal than Issues
// Discussions contain "I wish there was...", "why doesn't X exist", "I've been manually..."
// These are the highest-intent buying signals on GitHub

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ── Types ──────────────────────────────────────────────────────────────────────

interface NicheConfig {
  id: string;
  name: string;
  enabled?: boolean;
  monitoring?: {
    keywords?: string[];
    subreddits?: string[];
    github_topics?: string[];
    github_search_queries?: string[];
  };
}

interface Discussion {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  upvoteCount: number;
  commentCount: number;
  authorLogin: string;
  repoFullName: string;
  repoStars: number;
  url: string;
  category: string;
  painScore: number;
  buyingIntentScore: number;
  totalScore: number;
  signals: string[];
}

interface DiscussionSearchResult {
  search: {
    discussionCount: number;
    nodes: RawDiscussionNode[];
  };
}

interface RawDiscussionNode {
  __typename: string;
  id: string;
  title: string;
  body: string;
  createdAt: string;
  upvoteCount: number;
  url: string;
  author: { login: string } | null;
  comments: { totalCount: number };
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
  };
  category: { name: string };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface DiscussionsReport {
  niche: string;
  nicheName: string;
  date: string;
  totalFound: number;
  highValueCount: number;
  discussions: Discussion[];
  topPainThemes: string[];
  summary: string;
}

// ── Pain & Intent Signal Keywords ─────────────────────────────────────────────

const PAIN_KEYWORDS: string[] = [
  'i wish', 'wish there was', 'nobody has built', 'tired of', 'every time i have to',
  'frustrated', 'annoying', 'broken', 'painful', 'hate that', 'why doesn\'t',
  'there should be', 'would love', 'been manually', 'no good solution',
  'looking for a tool', 'does anyone know a way', 'has anyone solved',
  'been struggling', 'waste time', 'still not possible', 'missing feature',
];

const BUYING_INTENT_KEYWORDS: string[] = [
  'would pay', 'willing to pay', 'how much does', 'is there a paid',
  'alternative to', 'looking for something like', 'recommend a tool',
  'switched to', 'started using', 'just discovered', 'we use',
  'our team uses', 'budget for', 'worth it', 'subscription',
];

const VALIDATION_KEYWORDS: string[] = [
  'saved us', 'solved our problem', 'finally', 'game changer',
  'works perfectly', 'highly recommend', 'been using for',
  'already using', 'production', 'customers', 'users love',
];

// ── GraphQL Query ─────────────────────────────────────────────────────────────

const DISCUSSIONS_SEARCH_QUERY = `
  query NicheDiscussions($searchQuery: String!, $limit: Int!) {
    search(query: $searchQuery, type: DISCUSSION, first: $limit) {
      discussionCount
      nodes {
        __typename
        ... on Discussion {
          id
          title
          body
          createdAt
          upvoteCount
          url
          author { login }
          comments { totalCount }
          repository {
            nameWithOwner
            stargazerCount
          }
          category { name }
        }
      }
    }
  }
`;

// ── Core Executor ─────────────────────────────────────────────────────────────

async function executeGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
  retries = 3
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Council-Git-V9/1.0',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (response.status === 403) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        if (remaining === '0') {
          const reset = response.headers.get('X-RateLimit-Reset');
          const waitMs = reset
            ? Math.max(0, parseInt(reset) * 1000 - Date.now())
            : 60_000;
          console.warn(`[Discussions] Rate limit. Waiting ${Math.ceil(waitMs / 1000)}s...`);
          await sleep(Math.min(waitMs, 300_000));
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`GitHub GraphQL HTTP ${response.status}`);
      }

      const result = await response.json() as GraphQLResponse<T>;

      if (result.errors?.length) {
        throw new Error(result.errors.map(e => e.message).join('; '));
      }

      if (!result.data) throw new Error('No data returned');

      return result.data;

    } catch (error) {
      if (attempt === retries - 1) throw error;
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error('GraphQL failed after retries');
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scorePainSignals(text: string): { score: number; signals: string[] } {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  let score = 0;

  for (const kw of PAIN_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 8;
      signals.push(`pain: "${kw}"`);
    }
  }

  return { score: Math.min(score, 60), signals };
}

function scoreBuyingIntent(text: string): { score: number; signals: string[] } {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  let score = 0;

  // Budget mentions (strong signal)
  const budgetMatches = text.match(/\$[\d,]+|\d+\s*(usd|dollars|per month|\/mo|\/year)/gi);
  if (budgetMatches) {
    score += 20;
    signals.push(`budget: "${budgetMatches[0]}"`);
  }

  for (const kw of BUYING_INTENT_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 5;
      signals.push(`intent: "${kw}"`);
    }
  }

  for (const kw of VALIDATION_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 4;
      signals.push(`validation: "${kw}"`);
    }
  }

  return { score: Math.min(score, 40), signals };
}

function scoreEngagement(discussion: RawDiscussionNode): number {
  let score = 0;

  // Upvotes — strong community validation
  if (discussion.upvoteCount > 50) score += 20;
  else if (discussion.upvoteCount > 20) score += 15;
  else if (discussion.upvoteCount > 5) score += 8;

  // Comments — active conversation
  if (discussion.comments.totalCount > 30) score += 15;
  else if (discussion.comments.totalCount > 10) score += 10;
  else if (discussion.comments.totalCount > 3) score += 5;

  // Repository credibility — high-star repos = quality audience
  if (discussion.repository.stargazerCount > 5000) score += 10;
  else if (discussion.repository.stargazerCount > 1000) score += 6;

  return Math.min(score, 30);
}

function calculateTotalScore(
  painScore: number,
  buyingIntentScore: number,
  engagementScore: number
): number {
  return Math.min(100, painScore + buyingIntentScore + engagementScore);
}

// ── Niche Search ─────────────────────────────────────────────────────────────

async function searchNicheDiscussions(
  niche: NicheConfig,
  token: string,
  limit = 50
): Promise<Discussion[]> {
  const keywords = niche.monitoring?.keywords ?? [];
  const topics = niche.monitoring?.github_topics ?? [];

  // Build search queries from niche config
  const searchTerms = [...keywords.slice(0, 4), ...topics.slice(0, 2)];
  if (searchTerms.length === 0) {
    searchTerms.push(niche.id.replace(/-/g, ' '));
  }

  const allDiscussions: Discussion[] = [];
  const seenIds = new Set<string>();

  for (const term of searchTerms.slice(0, 3)) {
    await sleep(800); // respectful pacing between queries

    try {
      const searchQuery = `${term} is:unanswered`;

      console.log(`[Discussions][${niche.id}] Query: "${searchQuery}"`);

      const data = await executeGraphQL<DiscussionSearchResult>(
        DISCUSSIONS_SEARCH_QUERY,
        { searchQuery, limit: Math.min(limit, 30) },
        token
      );

      const rawDiscussions = data.search.nodes
        .filter((n): n is RawDiscussionNode => n.__typename === 'Discussion');

      for (const raw of rawDiscussions) {
        if (seenIds.has(raw.id)) continue;
        seenIds.add(raw.id);

        const fullText = `${raw.title} ${raw.body}`.slice(0, 3000);
        const { score: painScore, signals: painSignals } = scorePainSignals(fullText);
        const { score: buyingScore, signals: buyingSignals } = scoreBuyingIntent(fullText);
        const engagementScore = scoreEngagement(raw);
        const totalScore = calculateTotalScore(painScore, buyingScore, engagementScore);

        allDiscussions.push({
          id: raw.id,
          title: raw.title,
          body: raw.body.slice(0, 800),
          createdAt: raw.createdAt,
          upvoteCount: raw.upvoteCount,
          commentCount: raw.comments.totalCount,
          authorLogin: raw.author?.login ?? 'unknown',
          repoFullName: raw.repository.nameWithOwner,
          repoStars: raw.repository.stargazerCount,
          url: raw.url,
          category: raw.category.name,
          painScore,
          buyingIntentScore: buyingScore,
          totalScore,
          signals: [...painSignals, ...buyingSignals],
        });
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Discussions][${niche.id}] Query "${term}" failed: ${msg}`);
    }
  }

  // Sort by total score descending
  return allDiscussions.sort((a, b) => b.totalScore - a.totalScore);
}

// ── Theme Extraction ─────────────────────────────────────────────────────────

function extractPainThemes(discussions: Discussion[]): string[] {
  const themeCounts: Record<string, number> = {};

  for (const d of discussions) {
    const text = `${d.title} ${d.body}`.toLowerCase();

    // Extract noun phrases around pain keywords
    const painMatches = PAIN_KEYWORDS.filter(kw => text.includes(kw));
    for (const match of painMatches) {
      themeCounts[match] = (themeCounts[match] ?? 0) + 1;
    }
  }

  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([theme, count]) => `${theme} (${count}x)`);
}

// ── Report Generation ─────────────────────────────────────────────────────────

function generateMarkdownReport(report: DiscussionsReport): string {
  const highValue = report.discussions.filter(d => d.totalScore >= 60);
  const medValue = report.discussions.filter(
    d => d.totalScore >= 40 && d.totalScore < 60
  );

  const lines: string[] = [
    `# GitHub Discussions Intelligence — ${report.nicheName}`,
    `**Date:** ${report.date}  `,
    `**Niche:** ${report.niche}  `,
    `**Total Discussions Found:** ${report.totalFound}  `,
    `**High-Value (Score ≥60):** ${report.highValueCount}  `,
    '',
    '---',
    '',
    '## Top Pain Themes',
    '',
    ...report.topPainThemes.map(t => `- ${t}`),
    '',
    '---',
    '',
    '## 💎 High-Value Discussions (Score ≥60)',
    '',
  ];

  for (const d of highValue.slice(0, 15)) {
    lines.push(`### [${d.title}](${d.url})`);
    lines.push(`**Repo:** ${d.repoFullName} (⭐ ${d.repoStars.toLocaleString()})  `);
    lines.push(
      `**Score:** ${d.totalScore}/100 | Pain: ${d.painScore} | Intent: ${d.buyingIntentScore} | Engagement: ${d.upvoteCount} upvotes, ${d.commentCount} comments  `
    );
    lines.push(`**Signals:** ${d.signals.slice(0, 5).join(', ')}  `);
    lines.push(`**Category:** ${d.category}  `);
    lines.push('');
    lines.push(`> ${d.body.replace(/\n/g, ' ').slice(0, 300)}...`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (medValue.length > 0) {
    lines.push('## 🥈 Medium-Value Discussions (Score 40–59)');
    lines.push('');
    for (const d of medValue.slice(0, 8)) {
      lines.push(
        `- **[${d.title}](${d.url})** — Score: ${d.totalScore} | ${d.repoFullName} | ${d.signals.slice(0, 2).join(', ')}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

export async function runGitHubDiscussions(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('[Discussions] GITHUB_TOKEN environment variable is not set');
  }

  const configPath = path.join(process.cwd(), 'config', 'target-niches.yaml');
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(raw) as { niches: NicheConfig[] };
  const niches = config.niches.filter(n => n.enabled !== false);

  const date = new Date().toISOString().split('T')[0];

  fs.mkdirSync('data/reports', { recursive: true });
  fs.mkdirSync('data/opportunities', { recursive: true });

  let totalDiscussions = 0;

  for (const niche of niches) {
    console.log(`\n[Discussions] Processing niche: ${niche.id}`);

    try {
      const discussions = await searchNicheDiscussions(niche, token);
      const highValueCount = discussions.filter(d => d.totalScore >= 60).length;
      const topPainThemes = extractPainThemes(discussions);

      const report: DiscussionsReport = {
        niche: niche.id,
        nicheName: niche.name,
        date,
        totalFound: discussions.length,
        highValueCount,
        discussions,
        topPainThemes,
        summary: `Found ${discussions.length} discussions, ${highValueCount} high-value (score ≥60) with actionable pain signals`,
      };

      // Save markdown report
      const mdPath = `data/reports/github-discussions-${niche.id}-${date}.md`;
      fs.writeFileSync(mdPath, generateMarkdownReport(report));

      // Save JSON for programmatic access
      const jsonPath = `data/opportunities/github-discussions-${niche.id}-${date}.json`;
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

      console.log(
        `[Discussions][${niche.id}] ✅ ${discussions.length} found, ${highValueCount} high-value`
      );

      totalDiscussions += discussions.length;

      // Respect rate limits between niches
      await sleep(2000);

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Discussions][${niche.id}] ❌ Failed: ${msg}`);
      // Continue with next niche — never abort the whole run
    }
  }

  console.log(`\n[Discussions] Complete. Total: ${totalDiscussions} discussions across ${niches.length} niches`);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
