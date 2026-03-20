// scripts/run-github-discussions.ts
// CLI runner for GitHub Discussions Intelligence feature
// Matches exact scaffolding pattern of all other feature runners in this project

import { runGitHubDiscussions } from '../src/lib/github-discussions';

async function main(): Promise<void> {
  console.log('[run-github-discussions] Starting GitHub Discussions Intelligence...');
  console.log(`[run-github-discussions] Timestamp: ${new Date().toISOString()}`);

  try {
    await runGitHubDiscussions();
    console.log('[run-github-discussions] ✅ Completed successfully');
    process.exit(0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[run-github-discussions] ❌ Fatal error: ${msg}`);
    process.exit(1);
  }
}

main();
