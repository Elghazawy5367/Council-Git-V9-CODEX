// src/lib/mcp-servers/memory-tool.ts
// Semantic Memory MCP Tool
// Wraps Phase 2 vector-store.ts for standardised AI tool invocation
// Enables cross-feature intelligence: find the same pain appearing in GitHub,
// Reddit, HackerNews AND Discussions simultaneously
//
// Exposes two tools:
//   memory_semantic_search       — natural language search across all indexed reports
//   memory_cross_feature_search  — find pain patterns validated across multiple sources

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  semanticSearch,
  findCrossFeaturePatterns,
  getRecentHighQuality,
  getStats,
  healthCheck,
  type SearchResult,
} from '../memory/vector-store';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatSearchResults(results: SearchResult[], query: string): string {
  if (results.length === 0) {
    return (
      `No results found for: "${query}"\n\n` +
      `Tip: Run intelligence features first, then the vector indexer. ` +
      `Check that vector_search: true in config/2026-features.yaml.`
    );
  }

  const lines = [
    `Semantic search: "${query}"`,
    `Found ${results.length} relevant intelligence items`,
    '─'.repeat(50),
  ];

  for (const [i, result] of results.entries()) {
    const p = result.point;
    const similarity = Math.round(result.score * 100);
    const tier =
      p.qualityScore >= 90 ? '💎' :
      p.qualityScore >= 80 ? '🥇' :
      p.qualityScore >= 70 ? '🥈' : '📄';

    lines.push(
      `\n**${i + 1}.** ${tier} ${p.title}`,
      `Feature: ${p.feature} | Niche: ${p.niche} | Date: ${p.reportDate}`,
      `Quality: ${p.qualityScore}/100 | Similarity: ${similarity}%`,
    );

    if (p.tags.length > 0) {
      lines.push(`Tags: ${p.tags.join(', ')}`);
    }

    if (p.content) {
      lines.push(`> ${p.content.slice(0, 300).replace(/\n/g, ' ')}...`);
    }
  }

  return lines.join('\n');
}

function formatCrossFeature(results: SearchResult[], theme: string, niche: string): string {
  if (results.length === 0) {
    return `No cross-feature patterns found for theme "${theme}" in niche "${niche}".`;
  }

  // Group by feature to show convergence
  const byFeature = new Map<string, SearchResult[]>();
  for (const r of results) {
    const feature = r.point.feature;
    if (!byFeature.has(feature)) byFeature.set(feature, []);
    byFeature.get(feature)!.push(r);
  }

  const lines = [
    `Cross-feature analysis: "${theme}"`,
    `Niche: ${niche} | Sources: ${byFeature.size} features | Total: ${results.length} items`,
    '',
    `**Signal Convergence** (same pain across multiple sources = validated market gap)`,
    '─'.repeat(50),
  ];

  // Higher convergence = stronger market signal
  const convergenceScore = byFeature.size;
  const convergenceLabel =
    convergenceScore >= 4 ? '🔥 Very High — pursue immediately' :
    convergenceScore >= 3 ? '✅ High — strong opportunity' :
    convergenceScore >= 2 ? '⚡ Medium — worth investigating' :
    '📌 Low — single source';

  lines.push(`Convergence: ${convergenceLabel} (${convergenceScore} features)\n`);

  for (const [feature, featureResults] of byFeature) {
    lines.push(`**${feature}** (${featureResults.length} items)`);
    for (const r of featureResults.slice(0, 2)) {
      lines.push(`  • ${r.point.title} [Q:${r.point.qualityScore}]`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Tool Registration ─────────────────────────────────────────────────────────

export function registerMemoryTools(server: McpServer): void {
  // ── Tool 1: memory_semantic_search ────────────────────────────────────────

  server.tool(
    'memory_semantic_search',
    'Search all indexed intelligence reports using natural language. Returns the most semantically relevant intelligence items across all features, niches, and time periods. Use for hypothesis validation, historical context, and cross-report synthesis.',
    {
      query: z.string().min(3).max(500).describe(
        'Natural language search query. Examples: ' +
        '"ADHD productivity tool pain points", ' +
        '"freelancers client invoicing frustration", ' +
        '"abandoned podcast tools with high demand"'
      ),
      niche: z.string().optional().describe(
        'Optional niche ID filter. Leave empty to search across all niches.'
      ),
      feature: z.string().optional().describe(
        'Optional feature filter (e.g. "reddit-sniper", "mining-drill", "github-discussions"). ' +
        'Leave empty to search across all intelligence sources.'
      ),
      min_quality: z.number().min(0).max(100).default(50).describe(
        'Minimum quality score (0-100). Use 70+ for Gold-tier items only, 50 for broader results.'
      ),
      limit: z.number().min(1).max(30).default(10).describe(
        'Maximum results to return. Recommended: 10 for focused analysis, 20 for broad survey.'
      ),
      days_back: z.number().min(1).max(365).optional().describe(
        'Optional time filter — only return items from the last N days.'
      ),
    },
    async ({ query, niche, feature, min_quality, limit, days_back }): Promise<ToolResult> => {
      // Check feature flag
      try {
        const healthy = await healthCheck();
        if (!healthy) {
          return {
            content: [{
              type: 'text',
              text: 'Vector store is not available. ' +
                    'Ensure QDRANT_URL and QDRANT_API_KEY are set, ' +
                    'and vector_search: true in config/2026-features.yaml.',
            }],
          };
        }
      } catch {
        return {
          content: [{
            type: 'text',
            text: 'Cannot connect to Qdrant. Check QDRANT_URL and QDRANT_API_KEY secrets.',
          }],
        };
      }

      const since = days_back
        ? new Date(Date.now() - days_back * 24 * 60 * 60 * 1000)
        : undefined;

      try {
        const results = await semanticSearch(query, {
          niche,
          feature,
          minQualityScore: min_quality,
          limit,
          since,
        });

        return {
          content: [{ type: 'text', text: formatSearchResults(results, query) }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Semantic search failed: ${msg}` }],
        };
      }
    }
  );

  // ── Tool 2: memory_cross_feature_search ───────────────────────────────────

  server.tool(
    'memory_cross_feature_search',
    'Find a pain theme appearing across multiple intelligence sources simultaneously. Convergence across features (GitHub Issues + Reddit + HackerNews + Discussions) = validated market gap. Returns a convergence score with items grouped by source.',
    {
      theme: z.string().min(3).max(200).describe(
        'Pain theme to search for across all sources. ' +
        'Examples: "no good ADHD time tracking", "client invoicing pain", "podcast SEO workflow"'
      ),
      niche: z.string().describe(
        'Target niche ID to search within. ' +
        'One of: neurodivergent-digital-products, freelancers-consultants, ' +
        'etsy-sellers, digital-educators, podcast-transcription-seo'
      ),
      limit: z.number().min(5).max(30).default(20).describe(
        'Total results across all features. 20 gives good cross-feature coverage.'
      ),
    },
    async ({ theme, niche, limit }): Promise<ToolResult> => {
      try {
        const healthy = await healthCheck();
        if (!healthy) {
          return {
            content: [{
              type: 'text',
              text: 'Vector store unavailable. Check Qdrant credentials and feature flag.',
            }],
          };
        }

        const results = await findCrossFeaturePatterns(theme, niche, limit);

        return {
          content: [{
            type: 'text',
            text: formatCrossFeature(results, theme, niche),
          }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Cross-feature search failed: ${msg}` }],
        };
      }
    }
  );

  // ── Tool 3: memory_get_recent ──────────────────────────────────────────────

  server.tool(
    'memory_get_recent',
    'Get the highest-quality intelligence items for a niche from the last N days. Useful for daily briefing — surfaces the best opportunities from recent runs without needing a specific query.',
    {
      niche: z.string().describe('Target niche ID.'),
      days_back: z.number().min(1).max(30).default(7).describe(
        'How many days back to look. 7 = last week, 1 = yesterday only.'
      ),
      limit: z.number().min(1).max(30).default(15).describe(
        'Maximum results. 15 gives a solid daily briefing.'
      ),
    },
    async ({ niche, days_back, limit }): Promise<ToolResult> => {
      try {
        const results = await getRecentHighQuality(niche, days_back, limit);
        const header =
          `Recent high-quality intelligence: ${niche}\n` +
          `Last ${days_back} days | Min quality: 70`;

        return {
          content: [{ type: 'text', text: formatSearchResults(results, header) }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Failed to get recent intelligence: ${msg}` }],
        };
      }
    }
  );

  // ── Tool 4: memory_stats ───────────────────────────────────────────────────

  server.tool(
    'memory_stats',
    'Get vector store statistics — total indexed items, collection status, and last index timestamp. Use to verify the memory layer is populated before running searches.',
    {},
    async (): Promise<ToolResult> => {
      try {
        const stats = await getStats();
        const lines = [
          '**Vector Store Status**',
          `Collection exists: ${stats.collectionExists ? '✅ Yes' : '❌ No'}`,
          `Total indexed items: ${stats.totalPoints.toLocaleString()}`,
          `Last indexed: ${stats.lastIndexed ?? 'never'}`,
          '',
        ];

        if (!stats.collectionExists) {
          lines.push(
            '⚠️  Collection not found. To set up:',
            '1. Add QDRANT_URL and QDRANT_API_KEY to GitHub secrets',
            '2. Run: npm run index-reports',
            '3. Set vector_search: true in config/2026-features.yaml',
          );
        } else if (stats.totalPoints === 0) {
          lines.push(
            '⚠️  Collection is empty. Run: npm run index-reports',
          );
        } else {
          lines.push(`Memory layer is ready for semantic search. 🧠`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Stats unavailable: ${msg}` }],
        };
      }
    }
  );
}
