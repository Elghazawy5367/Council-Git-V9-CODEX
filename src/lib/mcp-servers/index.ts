// src/lib/mcp-servers/index.ts
// Council Intelligence MCP Server — tool registry
//
// Assembles all MCP tools into a single server instance.
// Run via: scripts/run-mcp-server.ts (StdioServerTransport)
//
// Available tools:
//   github_search_repos        — GitHub repository intelligence (Phase 1)
//   github_get_repo            — Single repository deep analysis (Phase 1)
//   reddit_scan_niche          — Reddit pain point + buying signal scanner
//   reddit_search              — Targeted Reddit keyword search
//   memory_semantic_search     — Cross-feature semantic search (Phase 2)
//   memory_cross_feature_search — Convergence analysis across sources (Phase 2)
//   memory_get_recent          — Recent high-quality intelligence briefing
//   memory_stats               — Vector store health check

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGitHubTools } from './github-tool';
import { registerRedditTools } from './reddit-tool';
import { registerMemoryTools } from './memory-tool';

// ── Server version ────────────────────────────────────────────────────────────

const SERVER_NAME = 'council-intelligence';
const SERVER_VERSION = '1.0.0';

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create and configure the Council Intelligence MCP server.
 * Registers all tools from Phase 1 (GitHub, Reddit) and Phase 2 (Memory).
 *
 * Usage:
 *   const server = createCouncilMCPServer();
 *   const transport = new StdioServerTransport();
 *   await server.connect(transport);
 */
export function createCouncilMCPServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all tool groups
  registerGitHubTools(server);
  registerRedditTools(server);
  registerMemoryTools(server);

  return server;
}

// ── Tool inventory (for documentation and testing) ────────────────────────────

export const REGISTERED_TOOLS = [
  {
    name: 'github_search_repos',
    category: 'github',
    description: 'Search GitHub repos by niche with full intelligence scoring',
    requiresToken: 'GITHUB_TOKEN',
  },
  {
    name: 'github_get_repo',
    category: 'github',
    description: 'Get deep intelligence for a specific repo by owner/name',
    requiresToken: 'GITHUB_TOKEN',
  },
  {
    name: 'reddit_scan_niche',
    category: 'reddit',
    description: 'Scan all subreddits for a niche, score buying signals',
    requiresToken: null,
  },
  {
    name: 'reddit_search',
    category: 'reddit',
    description: 'Keyword search across specified subreddits',
    requiresToken: null,
  },
  {
    name: 'memory_semantic_search',
    category: 'memory',
    description: 'Natural language search across all indexed intelligence',
    requiresToken: 'QDRANT_API_KEY',
  },
  {
    name: 'memory_cross_feature_search',
    category: 'memory',
    description: 'Find pain convergence across GitHub + Reddit + HN + Discussions',
    requiresToken: 'QDRANT_API_KEY',
  },
  {
    name: 'memory_get_recent',
    category: 'memory',
    description: 'Recent high-quality intelligence for a niche',
    requiresToken: 'QDRANT_API_KEY',
  },
  {
    name: 'memory_stats',
    category: 'memory',
    description: 'Vector store health and statistics',
    requiresToken: 'QDRANT_API_KEY',
  },
] as const;

export type ToolName = typeof REGISTERED_TOOLS[number]['name'];
