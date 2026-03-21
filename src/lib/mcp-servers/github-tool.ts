// src/lib/mcp-servers/github-tool.ts
// GitHub Intelligence MCP Tool
// Wraps Phase 1 github-graphql.ts for standardised AI tool invocation
//
// Exposes two tools:
//   github_search_repos  — find repositories by niche/topic + scoring
//   github_get_repo      — get full intelligence for a specific repo

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  searchNicheRepositories,
  getSingleRepoIntelligence,
  scoreSponsorSignal,
  loadNicheConfig,
  type NicheConfig,
  type RepoIntelligence,
} from '../github-graphql';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatRepo(repo: RepoIntelligence): string {
  const sponsorScore = scoreSponsorSignal(repo.fundingLinks);
  const tier =
    sponsorScore >= 20 ? '💰 Sponsored' :
    repo.daysSinceUpdate > 730 ? '⚠️  Abandoned' :
    repo.daysSinceUpdate > 365 ? '🕐 Stale' : '✅ Active';

  const lines = [
    `**${repo.fullName}** [${tier}]`,
    `Stars: ${repo.stargazerCount.toLocaleString()} | Forks: ${repo.forkCount} | Issues: ${repo.openIssueCount} | Discussions: ${repo.discussionCount}`,
    `Last updated: ${repo.daysSinceUpdate} days ago`,
    `Language: ${repo.primaryLanguage ?? 'unknown'}`,
    `Topics: ${repo.topics.slice(0, 5).join(', ') || 'none'}`,
  ];

  if (repo.description) {
    lines.push(`Description: ${repo.description.slice(0, 200)}`);
  }

  if (repo.fundingLinks.length > 0) {
    lines.push(`Funding: ${repo.fundingLinks.map(f => f.platform).join(', ')}`);
  }

  if (repo.recentReleases.length > 0) {
    lines.push(`Latest release: ${repo.recentReleases[0].name} (${repo.recentReleases[0].publishedAt.slice(0, 10)})`);
  }

  return lines.join('\n');
}

function formatRepoList(repos: RepoIntelligence[], query: string): string {
  if (repos.length === 0) {
    return `No repositories found for query: "${query}"`;
  }

  const header = `Found ${repos.length} repositories for "${query}"\n${'─'.repeat(50)}`;
  const body = repos
    .slice(0, 20)
    .map((repo, i) => `\n**${i + 1}.** ${formatRepo(repo)}`)
    .join('\n\n');

  return `${header}${body}`;
}

// ── Tool Registration ─────────────────────────────────────────────────────────

export function registerGitHubTools(server: McpServer): void {
  // ── Tool 1: github_search_repos ────────────────────────────────────────────

  server.tool(
    'github_search_repos',
    'Search GitHub repositories for a target niche. Returns repository intelligence including stars, issues, discussions, funding links, and abandonment signals. Use for Blue Ocean opportunity discovery.',
    {
      niche_id: z.string().describe(
        'Target niche ID from config/target-niches.yaml. ' +
        'One of: neurodivergent-digital-products, freelancers-consultants, ' +
        'etsy-sellers, digital-educators, podcast-transcription-seo'
      ),
      min_stars: z.number().min(0).max(100000).default(50).describe(
        'Minimum star count filter. Use 50 for broad discovery, 500 for proven demand, 5000 for established markets.'
      ),
      max_results: z.number().min(1).max(50).default(20).describe(
        'Maximum repositories to return. Recommended: 20 for analysis, 10 for quick scan.'
      ),
    },
    async ({ niche_id, min_stars, max_results }): Promise<ToolResult> => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return {
          content: [{
            type: 'text',
            text: 'Error: GITHUB_TOKEN environment variable is not set. ' +
                  'This is auto-provided in GitHub Actions workflows.',
          }],
        };
      }

      let niches: NicheConfig[];
      try {
        niches = loadNicheConfig();
      } catch {
        return {
          content: [{
            type: 'text',
            text: 'Error: Could not load config/target-niches.yaml. ' +
                  'Ensure the file exists in the repository root.',
          }],
        };
      }

      const niche = niches.find(n => n.id === niche_id);
      if (!niche) {
        const available = niches.map(n => n.id).join(', ');
        return {
          content: [{
            type: 'text',
            text: `Error: Niche "${niche_id}" not found. Available niches: ${available}`,
          }],
        };
      }

      try {
        const repos = await searchNicheRepositories(niche, {
          minStars: min_stars,
          maxRepos: max_results,
          token,
        });

        return {
          content: [{
            type: 'text',
            text: formatRepoList(repos, `${niche.name} (min ${min_stars} stars)`),
          }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `GitHub search failed: ${msg}` }],
        };
      }
    }
  );

  // ── Tool 2: github_get_repo ────────────────────────────────────────────────

  server.tool(
    'github_get_repo',
    'Get full intelligence for a specific GitHub repository by owner/name. Returns stars, forks, issues, discussions, funding, releases, and abandonment analysis.',
    {
      owner: z.string().describe('Repository owner (username or organisation). Example: "microsoft"'),
      repo: z.string().describe('Repository name. Example: "vscode"'),
    },
    async ({ owner, repo }): Promise<ToolResult> => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return {
          content: [{
            type: 'text',
            text: 'Error: GITHUB_TOKEN is not set.',
          }],
        };
      }

      try {
        const repoData = await getSingleRepoIntelligence(owner, repo, token);

        if (!repoData) {
          return {
            content: [{
              type: 'text',
              text: `Repository ${owner}/${repo} not found or not accessible.`,
            }],
          };
        }

        return {
          content: [{ type: 'text', text: formatRepo(repoData) }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Failed to fetch ${owner}/${repo}: ${msg}` }],
        };
      }
    }
  );
}
