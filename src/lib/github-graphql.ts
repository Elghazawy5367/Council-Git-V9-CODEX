// src/lib/github-graphql.ts
// GitHub GraphQL API v4 client
// Replaces 6 separate REST calls per repository with a single query
// Rate limit: same GITHUB_TOKEN, same 5000 requests/hour authenticated
// Cost unit: "nodes" — 5000 nodes per request, each repo field costs ~1 node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NicheConfig {
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

export interface RepoIntelligence {
  owner: string;
  name: string;
  fullName: string;
  stargazerCount: number;
  forkCount: number;
  openIssueCount: number;
  discussionCount: number;
  dependentCount: number;
  watcherCount: number;
  hasWiki: boolean;
  hasPages: boolean;
  isArchived: boolean;
  pushedAt: string;
  createdAt: string;
  description: string | null;
  primaryLanguage: string | null;
  topics: string[];
  fundingLinks: FundingLink[];
  recentReleases: Release[];
  daysSinceUpdate: number;
}

export interface FundingLink {
  platform: string;
  url: string;
}

export interface Release {
  name: string;
  publishedAt: string;
  description: string;
  isPrerelease: boolean;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: unknown[]; path?: unknown[] }>;
}

export interface RepoSearchResult {
  search: {
    repositoryCount: number;
    nodes: RawRepoNode[];
  };
}

export interface RawRepoNode {
  __typename: string;
  owner: { login: string };
  name: string;
  stargazerCount: number;
  forkCount: number;
  watchers: { totalCount: number };
  openIssues: { totalCount: number };
  discussions: { totalCount: number };
  isArchived: boolean;
  hasWikiEnabled: boolean;
  hasProjectsEnabled: boolean;
  pushedAt: string;
  createdAt: string;
  description: string | null;
  primaryLanguage: { name: string } | null;
  repositoryTopics: {
    nodes: Array<{ topic: { name: string } }>;
  };
  fundingLinks: FundingLink[];
  releases: {
    nodes: Array<{
      name: string;
      publishedAt: string;
      description: string;
      isPrerelease: boolean;
    }>;
  };
}

// ── GraphQL Queries ────────────────────────────────────────────────────────────

// Single query that replaces:
// GET /search/repositories (1 call)
// GET /repos/{owner}/{repo} (1 call per repo)
// GET /repos/{owner}/{repo}/issues (1 call per repo)
// GET /repos/{owner}/{repo}/forks (1 call per repo)
// GET /repos/{owner}/{repo}/topics (1 call per repo)
// GET /repos/{owner}/{repo}/releases (1 call per repo)
// = 1 + 5N REST calls → 1 GraphQL query

const NICHE_REPO_SEARCH_QUERY = `
  query NicheRepoIntelligence($searchQuery: String!, $limit: Int!) {
    search(query: $searchQuery, type: REPOSITORY, first: $limit) {
      repositoryCount
      nodes {
        __typename
        ... on Repository {
          owner { login }
          name
          stargazerCount
          forkCount
          watchers { totalCount }
          openIssues: issues(states: OPEN) { totalCount }
          discussions { totalCount }
          isArchived
          hasWikiEnabled
          hasProjectsEnabled
          pushedAt
          createdAt
          description
          primaryLanguage { name }
          repositoryTopics(first: 10) {
            nodes { topic { name } }
          }
          fundingLinks {
            platform
            url
          }
          releases(last: 3, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              name
              publishedAt
              description
              isPrerelease
            }
          }
        }
      }
    }
  }
`;

const SINGLE_REPO_QUERY = `
  query SingleRepoIntelligence($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      owner { login }
      name
      stargazerCount
      forkCount
      watchers { totalCount }
      openIssues: issues(states: OPEN) { totalCount }
      discussions { totalCount }
      isArchived
      hasWikiEnabled
      hasProjectsEnabled
      pushedAt
      createdAt
      description
      primaryLanguage { name }
      repositoryTopics(first: 10) {
        nodes { topic { name } }
      }
      fundingLinks {
        platform
        url
      }
      releases(last: 3, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          name
          publishedAt
          description
          isPrerelease
        }
      }
    }
  }
`;

// ── Core GraphQL Executor ─────────────────────────────────────────────────────

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
          console.warn(`[GraphQL] Rate limit hit. Waiting ${Math.ceil(waitMs / 1000)}s...`);
          await sleep(Math.min(waitMs, 300_000));
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`GitHub GraphQL HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as GraphQLResponse<T>;

      if (result.errors && result.errors.length > 0) {
        const messages = result.errors.map(e => e.message).join('; ');
        throw new Error(`GraphQL errors: ${messages}`);
      }

      if (!result.data) {
        throw new Error('GraphQL returned no data and no errors');
      }

      return result.data;

    } catch (error) {
      if (attempt === retries - 1) throw error;
      const waitMs = 1000 * Math.pow(2, attempt);
      console.warn(`[GraphQL] Attempt ${attempt + 1} failed. Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }

  throw new Error(`GraphQL request failed after ${retries} attempts`);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search repositories for a niche using a single GraphQL query.
 * Equivalent to 1 + 5N REST API calls but costs only 1 GraphQL request.
 */
export async function searchNicheRepositories(
  niche: NicheConfig,
  options: {
    minStars?: number;
    maxRepos?: number;
    token: string;
  }
): Promise<RepoIntelligence[]> {
  const { minStars = 50, maxRepos = 30, token } = options;

  const topics = niche.monitoring?.github_topics ?? [];
  const queries = niche.monitoring?.github_search_queries ?? [];

  // Build search query from niche config
  const topicParts = topics.map(t => `topic:${t}`).join(' ');
  const keywordParts = (niche.monitoring?.keywords ?? []).slice(0, 3).join(' OR ');
  const searchQuery = [
    topicParts || keywordParts || niche.id.replace(/-/g, ' '),
    `stars:>=${minStars}`,
    'sort:stars',
  ].filter(Boolean).join(' ');

  console.log(`[GraphQL] Searching: "${searchQuery}" (limit: ${maxRepos})`);

  const data = await executeGraphQL<RepoSearchResult>(
    NICHE_REPO_SEARCH_QUERY,
    { searchQuery, limit: Math.min(maxRepos, 100) },
    token
  );

  const repos = data.search.nodes
    .filter((n): n is RawRepoNode => n.__typename === 'Repository')
    .map(normalizeRepo);

  // Also run any custom search queries defined in niche config
  if (queries.length > 0) {
    for (const customQuery of queries.slice(0, 2)) {
      await sleep(500); // be gentle between queries
      try {
        const customData = await executeGraphQL<RepoSearchResult>(
          NICHE_REPO_SEARCH_QUERY,
          {
            searchQuery: `${customQuery} stars:>=${minStars}`,
            limit: 10,
          },
          token
        );
        const customRepos = customData.search.nodes
          .filter((n): n is RawRepoNode => n.__typename === 'Repository')
          .map(normalizeRepo);
        repos.push(...customRepos);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[GraphQL] Custom query "${customQuery}" failed: ${msg}`);
      }
    }
  }

  // Deduplicate by fullName
  const seen = new Set<string>();
  return repos.filter(r => {
    if (seen.has(r.fullName)) return false;
    seen.add(r.fullName);
    return true;
  });
}

/**
 * Get full intelligence for a single repository by owner/name.
 */
export async function getSingleRepoIntelligence(
  owner: string,
  name: string,
  token: string
): Promise<RepoIntelligence | null> {
  try {
    const data = await executeGraphQL<{ repository: RawRepoNode }>(
      SINGLE_REPO_QUERY,
      { owner, name },
      token
    );
    return data.repository ? normalizeRepo(data.repository) : null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[GraphQL] getSingleRepo(${owner}/${name}) failed: ${msg}`);
    return null;
  }
}

// ── Normalization ─────────────────────────────────────────────────────────────

function normalizeRepo(raw: RawRepoNode): RepoIntelligence {
  const pushedAt = new Date(raw.pushedAt);
  const now = new Date();
  const daysSinceUpdate = Math.floor(
    (now.getTime() - pushedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    owner: raw.owner.login,
    name: raw.name,
    fullName: `${raw.owner.login}/${raw.name}`,
    stargazerCount: raw.stargazerCount,
    forkCount: raw.forkCount,
    openIssueCount: raw.openIssues.totalCount,
    discussionCount: raw.discussions.totalCount,
    dependentCount: 0, // Dependents not available in GraphQL — fetched separately if needed
    watcherCount: raw.watchers.totalCount,
    hasWiki: raw.hasWikiEnabled,
    hasPages: raw.hasProjectsEnabled,
    isArchived: raw.isArchived,
    pushedAt: raw.pushedAt,
    createdAt: raw.createdAt,
    description: raw.description,
    primaryLanguage: raw.primaryLanguage?.name ?? null,
    topics: raw.repositoryTopics.nodes.map(n => n.topic.name),
    fundingLinks: raw.fundingLinks,
    recentReleases: raw.releases.nodes.map(r => ({
      name: r.name,
      publishedAt: r.publishedAt,
      description: r.description ?? '',
      isPrerelease: r.isPrerelease,
    })),
    daysSinceUpdate,
  };
}

// ── Config Loader (shared utility) ────────────────────────────────────────────

export function loadNicheConfig(): NicheConfig[] {
  const configPath = path.join(process.cwd(), 'config', 'target-niches.yaml');
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(raw) as { niches: NicheConfig[] };
  return config.niches.filter(n => n.enabled !== false);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Sponsors Signal Scorer (used by goldmine-detector upgrade) ────────────────

export function scoreSponsorSignal(fundingLinks: FundingLink[]): number {
  if (fundingLinks.length === 0) return 0;

  const hasGitHubSponsors = fundingLinks.some(l => l.platform === 'GITHUB');
  const hasOtherFunding = fundingLinks.some(l =>
    ['OPEN_COLLECTIVE', 'PATREON', 'BUY_ME_A_COFFEE', 'LIBERAPAY', 'KO_FI'].includes(l.platform)
  );

  if (hasGitHubSponsors && hasOtherFunding) return 30;
  if (hasGitHubSponsors) return 20;
  if (hasOtherFunding) return 15;
  return 5; // Has some funding link
}
