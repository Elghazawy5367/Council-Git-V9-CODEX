// src/lib/mcp-servers/reddit-tool.ts
// Reddit Intelligence MCP Tool
// Wraps the Reddit public API for standardised AI tool invocation
// No auth required — uses public JSON API with User-Agent header only
//
// Exposes two tools:
//   reddit_scan_niche     — scan niche subreddits for pain points + buying signals
//   reddit_search         — targeted keyword search across specified subreddits

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadNicheConfig, type NicheConfig } from '../github-graphql';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
  created_utc: number;
  author: string;
  url: string;
}

interface RedditListing {
  data: {
    children: Array<{ data: RedditPost }>;
    after: string | null;
  };
}

interface ScoredPost {
  post: RedditPost;
  intentScore: number;
  painScore: number;
  totalScore: number;
  signals: string[];
}

// ── Signal Keywords (from KB feature 3 + 4 patterns) ─────────────────────────

const INTENT_TITLE_KEYWORDS: Array<[string, number]> = [
  ['looking for', 20],
  ['need a tool', 18],
  ['recommend', 15],
  ['alternative to', 15],
  ['does anyone', 12],
  ['need help', 10],
  ['?', 8],
];

const BUYING_KEYWORDS: Array<[string, number]> = [
  ['would pay', 20],
  ['willing to pay', 20],
  ['subscription', 12],
  ['pricing', 10],
  ['how much', 10],
  ['budget', 8],
];

const PAIN_KEYWORDS: Array<[string, number]> = [
  ['frustrated', 10],
  ['wish there was', 10],
  ['nobody has built', 10],
  ['tired of', 8],
  ['been manually', 8],
  ['broken', 8],
  ['annoying', 6],
  ['hate that', 6],
  ['why doesn\'t', 6],
  ['no good solution', 6],
];

const URGENCY_KEYWORDS: Array<[string, number]> = [
  ['asap', 15],
  ['urgent', 15],
  ['immediately', 10],
  ['today', 8],
  ['deadline', 8],
];

// ── Scoring ───────────────────────────────────────────────────────────────────

function scorePost(post: RedditPost): ScoredPost {
  const title = post.title.toLowerCase();
  const body = (post.selftext ?? '').toLowerCase();
  const fullText = `${title} ${body}`;
  const signals: string[] = [];
  let intentScore = 0;
  let painScore = 0;

  // Title intent signals
  for (const [kw, pts] of INTENT_TITLE_KEYWORDS) {
    if (title.includes(kw)) {
      intentScore += pts;
      signals.push(`intent: "${kw}"`);
    }
  }

  // Buying signals in full text
  for (const [kw, pts] of BUYING_KEYWORDS) {
    if (fullText.includes(kw)) {
      intentScore += pts;
      signals.push(`buying: "${kw}"`);
    }
  }

  // Budget mention (strong buying signal)
  const budgetMatch = post.selftext?.match(/\$[\d,]+|\d+\s*(usd|dollars|\/mo|\/month|\/year)/i);
  if (budgetMatch) {
    intentScore += 20;
    signals.push(`budget: "${budgetMatch[0]}"`);
  }

  // Pain point signals
  for (const [kw, pts] of PAIN_KEYWORDS) {
    if (fullText.includes(kw)) {
      painScore += pts;
      signals.push(`pain: "${kw}"`);
    }
  }

  // Urgency signals
  for (const [kw, pts] of URGENCY_KEYWORDS) {
    if (fullText.includes(kw)) {
      intentScore += pts;
      signals.push(`urgent: "${kw}"`);
    }
  }

  // Engagement bonus
  const engagementBonus = Math.min(15, (post.num_comments * 2) + (post.score / 50));

  const totalScore = Math.min(100,
    Math.round(intentScore + painScore + engagementBonus)
  );

  return { post, intentScore, painScore, totalScore, signals };
}

// ── Reddit API Fetcher ────────────────────────────────────────────────────────

async function fetchSubreddit(
  subreddit: string,
  sort: 'hot' | 'new' | 'top',
  limit: number,
  query?: string
): Promise<RedditPost[]> {
  const cleanSub = subreddit.replace(/^r\//, '');
  const baseUrl = query
    ? `https://www.reddit.com/r/${cleanSub}/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}&restrict_sr=1`
    : `https://www.reddit.com/r/${cleanSub}/${sort}.json?limit=${limit}&t=week`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Council-Git-V9/1.0 (market intelligence bot)',
          'Accept': 'application/json',
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, attempt);
        await sleep(waitMs);
        continue;
      }

      if (response.status === 404) {
        return []; // subreddit doesn't exist
      }

      if (!response.ok) {
        throw new Error(`Reddit API HTTP ${response.status} for r/${cleanSub}`);
      }

      const data = await response.json() as RedditListing;
      return data.data.children.map(c => c.data);

    } catch (error) {
      if (attempt === 2) throw error;
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  return [];
}

function formatScoredPosts(posts: ScoredPost[], header: string): string {
  if (posts.length === 0) return `${header}\n\nNo relevant posts found.`;

  const lines = [header, '─'.repeat(50)];

  for (const [i, sp] of posts.slice(0, 15).entries()) {
    const age = Math.floor((Date.now() / 1000 - sp.post.created_utc) / 3600);
    const ageStr = age < 24 ? `${age}h ago` : `${Math.floor(age / 24)}d ago`;

    lines.push(
      `\n**${i + 1}.** [${sp.post.title}](https://reddit.com${sp.post.permalink})`,
      `r/${sp.post.subreddit} | Score: ${sp.totalScore}/100 | ` +
      `${sp.post.score} upvotes | ${sp.post.num_comments} comments | ${ageStr}`,
      `Signals: ${sp.signals.slice(0, 4).join(', ')}`,
    );

    if (sp.post.selftext && sp.post.selftext.length > 20) {
      lines.push(`> ${sp.post.selftext.slice(0, 200).replace(/\n/g, ' ')}...`);
    }
  }

  return lines.join('\n');
}

// ── Tool Registration ─────────────────────────────────────────────────────────

export function registerRedditTools(server: McpServer): void {
  // ── Tool 1: reddit_scan_niche ──────────────────────────────────────────────

  server.tool(
    'reddit_scan_niche',
    'Scan subreddits configured for a target niche. Detects buying intent, pain points, and urgency signals. Returns scored posts ordered by opportunity relevance.',
    {
      niche_id: z.string().describe(
        'Target niche ID. One of: neurodivergent-digital-products, ' +
        'freelancers-consultants, etsy-sellers, digital-educators, podcast-transcription-seo'
      ),
      min_score: z.number().min(0).max(100).default(40).describe(
        'Minimum combined score (0-100) to include in results. ' +
        'Use 70+ for high-confidence buying signals, 40+ for pain point discovery.'
      ),
      sort: z.enum(['hot', 'new', 'top']).default('hot').describe(
        'Reddit sort order. "hot" for trending, "new" for fresh signals, "top" for validated demand.'
      ),
    },
    async ({ niche_id, min_score, sort }): Promise<ToolResult> => {
      let niches: NicheConfig[];
      try {
        niches = loadNicheConfig();
      } catch {
        return {
          content: [{ type: 'text', text: 'Error: Cannot load config/target-niches.yaml' }],
        };
      }

      const niche = niches.find(n => n.id === niche_id);
      if (!niche) {
        return {
          content: [{
            type: 'text',
            text: `Niche "${niche_id}" not found. Available: ${niches.map(n => n.id).join(', ')}`,
          }],
        };
      }

      const subreddits = niche.monitoring?.subreddits ?? [];
      if (subreddits.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No subreddits configured for niche "${niche_id}". ` +
                  `Add subreddits to config/target-niches.yaml.`,
          }],
        };
      }

      const allPosts: RedditPost[] = [];

      for (const sub of subreddits.slice(0, 5)) {
        try {
          const posts = await fetchSubreddit(sub, sort, 25);
          allPosts.push(...posts);
          await sleep(1000); // respect rate limits
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[reddit_scan_niche] Failed ${sub}: ${msg}`);
        }
      }

      const scored = allPosts
        .map(scorePost)
        .filter(s => s.totalScore >= min_score)
        .sort((a, b) => b.totalScore - a.totalScore);

      const header =
        `Reddit scan: ${niche.name}\n` +
        `Subreddits: ${subreddits.join(', ')}\n` +
        `Found ${scored.length} posts scoring ≥${min_score}`;

      return {
        content: [{ type: 'text', text: formatScoredPosts(scored, header) }],
      };
    }
  );

  // ── Tool 2: reddit_search ──────────────────────────────────────────────────

  server.tool(
    'reddit_search',
    'Search specific subreddits for a keyword or phrase. Returns scored results with buying intent and pain point analysis.',
    {
      subreddits: z.array(z.string()).min(1).max(5).describe(
        'List of subreddits to search (with or without "r/" prefix). ' +
        'Example: ["r/ADHD", "r/productivity"]'
      ),
      query: z.string().min(2).max(200).describe(
        'Search query. Examples: "tool recommendation", "looking for software", "frustrated with"'
      ),
      min_score: z.number().min(0).max(100).default(30).describe(
        'Minimum combined score to include. Lower = more results, higher = better quality.'
      ),
    },
    async ({ subreddits, query, min_score }): Promise<ToolResult> => {
      const allPosts: RedditPost[] = [];

      for (const sub of subreddits) {
        try {
          const posts = await fetchSubreddit(sub, 'hot', 25, query);
          allPosts.push(...posts);
          await sleep(1000);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[reddit_search] Failed ${sub}: ${msg}`);
        }
      }

      // Deduplicate by post ID
      const seen = new Set<string>();
      const unique = allPosts.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      const scored = unique
        .map(scorePost)
        .filter(s => s.totalScore >= min_score)
        .sort((a, b) => b.totalScore - a.totalScore);

      const header =
        `Reddit search: "${query}"\n` +
        `Subreddits: ${subreddits.join(', ')}\n` +
        `Found ${scored.length} posts scoring ≥${min_score}`;

      return {
        content: [{ type: 'text', text: formatScoredPosts(scored, header) }],
      };
    }
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
