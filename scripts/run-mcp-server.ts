// scripts/run-mcp-server.ts
// Council Intelligence MCP Server — stdio entry point
//
// Starts the server using StdioServerTransport so it can be invoked by
// any MCP-compatible client: Claude Desktop, Cursor, VS Code, custom agents.
//
// To register with Claude Desktop, add to claude_desktop_config.json:
// {
//   "mcpServers": {
//     "council-intelligence": {
//       "command": "npx",
//       "args": ["tsx", "scripts/run-mcp-server.ts"],
//       "cwd": "/path/to/Council-Git-V9",
//       "env": {
//         "GITHUB_TOKEN": "your_token",
//         "QDRANT_URL": "your_qdrant_url",
//         "QDRANT_API_KEY": "your_key"
//       }
//     }
//   }
// }
//
// Manual test: npx tsx scripts/run-mcp-server.ts
// Or:          npm run mcp-server

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createCouncilMCPServer, REGISTERED_TOOLS } from '../src/lib/mcp-servers/index';

async function main(): Promise<void> {
  const server = createCouncilMCPServer();
  const transport = new StdioServerTransport();

  // Log tool inventory to stderr (doesn't pollute stdio protocol stream)
  console.error(`[MCP] Council Intelligence Server v1.0.0 starting...`);
  console.error(`[MCP] Registered tools: ${REGISTERED_TOOLS.length}`);
  for (const tool of REGISTERED_TOOLS) {
    const auth = tool.requiresToken ? `(requires ${tool.requiresToken})` : '(no auth)';
    console.error(`[MCP]   • ${tool.name} ${auth}`);
  }
  console.error(`[MCP] Listening on stdio transport...`);

  await server.connect(transport);
}

main().catch(error => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[MCP] Fatal error: ${msg}`);
  process.exit(1);
});
