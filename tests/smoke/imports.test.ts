import { describe, it, expect } from 'vitest';

// Dynamically import core chunks to ensure they resolve without crashing Node
describe('Smoke Tests: Core Imports', () => {
  it('should successfully import github-client service', async () => {
    const module = await import('@/features/automation/lib/api/github-client');
    expect(module).toBeDefined();
    expect(module.GitHubTrendingService).toBeDefined();
  });

  it('should successfully import openrouter service', async () => {
    const module = await import('@/services/openrouter');
    expect(module).toBeDefined();
    expect(module.OpenRouterService).toBeDefined();
  });

  it('should successfully import prompt-heist utility', async () => {
    const module = await import('@/lib/prompt-heist');
    expect(module).toBeDefined();
    expect(module.getPatternsByCategory).toBeDefined();
  });

  it('should successfully import scout utility', async () => {
    const module = await import('@/lib/scout');
    expect(module).toBeDefined();
  });
});
