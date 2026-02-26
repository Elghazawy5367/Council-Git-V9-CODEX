# Professional GitHub API Integration Guide

Complete guide to using the enhanced GitHub API service with @octokit/rest.

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Features](#features)
5. [Service Class Structure](#service-class-structure)
6. [Error Handling](#error-handling)
7. [Rate Limit Monitoring](#rate-limit-monitoring)
8. [Caching Strategy](#caching-strategy)
9. [Example Queries](#example-queries)
10. [TypeScript Types](#typescript-types)
11. [Migration Guide](#migration-guide)
12. [Best Practices](#best-practices)

---

## Overview

The `GitHubAPIService` provides a professional, production-ready interface to the GitHub API with:

- **Type Safety**: Full TypeScript types using @octokit/rest
- **Error Handling**: Custom error classes for different failure scenarios
- **Rate Limiting**: Automatic monitoring and graceful handling
- **Caching**: Built-in caching layer with configurable TTL
- **Retry Logic**: Automatic retries with exponential backoff
- **Comprehensive Coverage**: Repositories, issues, PRs, commits

---

## Installation

The required dependencies are already installed:

```bash
npm install @octokit/rest @octokit/auth-token
```

---

## Quick Start

### Basic Usage

```typescript
import { GitHubAPIService } from '@/services/github-api.service';

// Initialize with token
const github = new GitHubAPIService({
  token: process.env.GITHUB_TOKEN,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
});

// Search repositories
const repos = await github.searchRepositories('language:typescript stars:>1000');

// Get a specific repository
const repo = await github.getRepository('facebook', 'react');

// Check rate limit
const rateLimit = await github.getRateLimitStatus();
console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
```

### Singleton Pattern

```typescript
import { getGitHubAPI } from '@/services/github-api.service';

// Get singleton instance
const github = getGitHubAPI({ token: process.env.GITHUB_TOKEN });

// Use anywhere in your app
const issues = await github.getRepositoryIssues('owner', 'repo');
```

---

## Features

### 1. Repository Operations

```typescript
// Search repositories
const searchResults = await github.searchRepositories(
  'react framework',
  {
    sort: 'stars',
    order: 'desc',
    perPage: 30,
    page: 1,
  }
);

// Get trending repositories
const trending = await github.getTrendingRepositories('typescript', 'week');

// Get specific repository
const repo = await github.getRepository('microsoft', 'vscode');
```

### 2. Issue Operations

```typescript
// Get repository issues
const issues = await github.getRepositoryIssues('owner', 'repo', {
  state: 'open',
  sort: 'updated',
  labels: ['bug', 'help-wanted'],
  perPage: 50,
});

// Get specific issue
const issue = await github.getIssue('owner', 'repo', 123);

// Search issues across GitHub
const searchResults = await github.searchIssues(
  'is:issue is:open label:bug language:typescript'
);
```

### 3. Pull Request Operations

```typescript
// Get repository pull requests
const prs = await github.getRepositoryPullRequests('owner', 'repo', {
  state: 'open',
  sort: 'updated',
  order: 'desc',
});

// Get specific pull request
const pr = await github.getPullRequest('owner', 'repo', 456);

// Get recent PRs across repositories
const recentPRs = await github.getRecentPullRequests(
  'is:pr is:open language:typescript',
  7 // last 7 days
);
```

### 4. Commit Operations

```typescript
// Get repository commits
const commits = await github.getRepositoryCommits('owner', 'repo', {
  sha: 'main',
  author: 'username',
  since: new Date('2024-01-01'),
  perPage: 50,
});

// Get specific commit
const commit = await github.getCommit('owner', 'repo', 'abc123');
```

### 5. File Content

```typescript
// Get file from repository
const content = await github.getFileContent(
  'owner',
  'repo',
  'README.md',
  'main'
);
```

---

## Service Class Structure

### Constructor

```typescript
interface GitHubAPIConfig {
  token?: string;           // GitHub token (defaults to env)
  baseUrl?: string;         // API base URL
  cacheTTL?: number;        // Cache TTL in milliseconds (default: 5min)
  maxRetries?: number;      // Max retry attempts (default: 3)
  retryDelay?: number;      // Initial retry delay (default: 1s)
}

const github = new GitHubAPIService({
  token: 'ghp_xxxxx',
  cacheTTL: 10 * 60 * 1000,  // 10 minutes
  maxRetries: 5,
  retryDelay: 2000,           // 2 seconds
});
```

### Methods Overview

**Repository Methods:**
- `searchRepositories(query, options)` - Search repositories
- `getRepository(owner, repo)` - Get specific repository
- `getTrendingRepositories(language, since)` - Get trending repos

**Issue Methods:**
- `getRepositoryIssues(owner, repo, options)` - Get repository issues
- `getIssue(owner, repo, number)` - Get specific issue
- `searchIssues(query, options)` - Search issues globally

**Pull Request Methods:**
- `getRepositoryPullRequests(owner, repo, options)` - Get PRs
- `getPullRequest(owner, repo, number)` - Get specific PR
- `getRecentPullRequests(query, days)` - Get recent PRs

**Commit Methods:**
- `getRepositoryCommits(owner, repo, options)` - Get commits
- `getCommit(owner, repo, ref)` - Get specific commit

**Utility Methods:**
- `getFileContent(owner, repo, path, ref)` - Get file content
- `getRateLimitStatus()` - Check rate limit status
- `clearCache(key?)` - Clear cache
- `getCacheStats()` - Get cache statistics

---

## Error Handling

### Custom Error Classes

```typescript
import {
  GitHubAPIError,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
} from '@/services/github-api.service';

try {
  const repo = await github.getRepository('owner', 'repo');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limit hit. Resets at: ${error.resetAt}`);
    console.log(`Remaining: ${error.remaining}/${error.limit}`);
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid GitHub token');
  } else if (error instanceof NotFoundError) {
    console.error('Repository not found');
  } else if (error instanceof GitHubAPIError) {
    console.error(`API Error: ${error.message} (${error.statusCode})`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Error Types

**RateLimitError**
- Thrown when GitHub API rate limit is exceeded
- Properties: `resetAt`, `limit`, `remaining`
- Status code: 429

**AuthenticationError**
- Thrown when authentication fails
- Check your GitHub token
- Status code: 401

**NotFoundError**
- Thrown when resource doesn't exist
- Check owner/repo/number
- Status code: 404

**GitHubAPIError**
- Generic API error
- Contains status code and response

### Retry Logic

The service automatically retries failed requests with exponential backoff:

```typescript
// Default configuration
maxRetries: 3
initialDelay: 1000ms
backoff: exponential (1s, 2s, 4s)

// Does NOT retry on:
- AuthenticationError (401)
- NotFoundError (404)
- RateLimitError (429)
```

---

## Rate Limit Monitoring

### Check Rate Limit Status

```typescript
const status = await github.getRateLimitStatus();

console.log(`Limit: ${status.limit}`);
console.log(`Remaining: ${status.remaining}`);
console.log(`Reset at: ${status.reset}`);
console.log(`Usage: ${status.percentageUsed.toFixed(2)}%`);
console.log(`Near limit: ${status.isNearLimit}`); // true if >90% used
```

### Automatic Rate Limit Handling

The service automatically:

1. **Checks rate limit** before each API call
2. **Warns** when usage exceeds 90%
3. **Throws RateLimitError** when limit is reached
4. **Includes reset time** in error for client handling

### Best Practices

```typescript
// Check rate limit periodically
async function monitorRateLimit() {
  const status = await github.getRateLimitStatus();
  
  if (status.isNearLimit) {
    console.warn('Approaching rate limit, slowing down...');
    // Implement backoff strategy
  }
  
  if (status.remaining === 0) {
    const waitTime = status.reset.getTime() - Date.now();
    console.log(`Waiting ${waitTime}ms for rate limit reset`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

// Use in loops
for (const repo of repositories) {
  await monitorRateLimit();
  const data = await github.getRepository(repo.owner, repo.name);
}
```

---

## Caching Strategy

### How It Works

1. **Cache Key**: Generated from method + parameters
2. **TTL**: Configurable per instance (default: 5 minutes)
3. **Storage**: In-memory Map
4. **Expiry**: Automatic based on timestamp

### Cache Configuration

```typescript
// Global cache TTL
const github = new GitHubAPIService({
  cacheTTL: 10 * 60 * 1000, // 10 minutes
});

// Per-method TTL (manual caching)
const data = await github.getCached(
  'custom-key',
  async () => fetchData(),
  30 * 60 * 1000 // 30 minutes
);
```

### Cache Management

```typescript
// Clear specific cache
github.clearCache('repo:owner/name');

// Clear all cache
github.clearCache();

// Get cache statistics
const stats = github.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Cached keys: ${stats.keys.join(', ')}`);
```

### Cache Keys

Format: `{type}:{identifier}:{options}`

Examples:
```
search:repos:react framework:{"sort":"stars"}
repo:facebook/react
issues:owner/repo:{"state":"open"}
pr:owner/repo:123
commit:owner/repo:abc123
```

### When to Clear Cache

```typescript
// After modifying data
await github.createIssue(/* ... */);
github.clearCache(`issues:${owner}/${repo}`);

// On user action
button.onClick = () => {
  github.clearCache(); // Refresh all data
  loadData();
};

// Periodic refresh
setInterval(() => {
  github.clearCache();
}, 30 * 60 * 1000); // Every 30 minutes
```

---

## Example Queries

### 1. Get Trending Repositories

```typescript
/**
 * Find trending repositories by language
 */
async function getTrendingTypeScriptRepos() {
  const github = getGitHubAPI();
  
  // Last week's trending TypeScript repos
  const repos = await github.getTrendingRepositories('typescript', 'week');
  
  repos.forEach(repo => {
    console.log(`${repo.full_name}: ${repo.stargazers_count} stars`);
  });
  
  return repos;
}
```

### 2. Find Help-Wanted Issues

```typescript
/**
 * Find good first issues for contributors
 */
async function findGoodFirstIssues(language: string = 'typescript') {
  const github = getGitHubAPI();
  
  const query = `is:issue is:open label:"good first issue" language:${language}`;
  
  const result = await github.searchIssues(query, {
    sort: 'updated',
    order: 'desc',
    perPage: 50,
  });
  
  return result.items.map(issue => ({
    title: issue.title,
    repo: issue.repository_url.split('/').slice(-2).join('/'),
    url: issue.html_url,
    comments: issue.comments,
  }));
}
```

### 3. Analyze Repository Activity

```typescript
/**
 * Get repository activity metrics
 */
async function getRepositoryActivity(owner: string, repo: string) {
  const github = getGitHubAPI();
  
  // Get recent data
  const [repository, issues, prs, commits] = await Promise.all([
    github.getRepository(owner, repo),
    github.getRepositoryIssues(owner, repo, { state: 'all', perPage: 100 }),
    github.getRepositoryPullRequests(owner, repo, { state: 'all', perPage: 100 }),
    github.getRepositoryCommits(owner, repo, { perPage: 100 }),
  ]);
  
  // Calculate metrics
  const openIssues = issues.filter(i => i.state === 'open').length;
  const openPRs = prs.filter(pr => pr.state === 'open').length;
  const recentCommits = commits.filter(c => {
    const date = new Date(c.commit.author?.date || 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date > weekAgo;
  }).length;
  
  return {
    name: repository.full_name,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues,
    openPRs,
    recentCommits,
    lastUpdate: new Date(repository.updated_at),
    isActive: recentCommits > 5,
  };
}
```

### 4. Find Popular PRs

```typescript
/**
 * Get most commented pull requests
 */
async function getPopularPullRequests(query: string = 'is:pr is:open') {
  const github = getGitHubAPI();
  
  const result = await github.searchIssues(query, {
    sort: 'comments',
    order: 'desc',
    perPage: 30,
  });
  
  return result.items.map(pr => ({
    title: pr.title,
    url: pr.html_url,
    comments: pr.comments,
    state: pr.state,
    createdAt: new Date(pr.created_at),
  }));
}
```

### 5. Repository Health Check

```typescript
/**
 * Assess repository health and maintenance
 */
async function checkRepositoryHealth(owner: string, repo: string) {
  const github = getGitHubAPI();
  
  const repository = await github.getRepository(owner, repo);
  const issues = await github.getRepositoryIssues(owner, repo, {
    state: 'open',
    perPage: 100,
  });
  
  // Calculate health metrics
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(repository.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const oldIssues = issues.filter(issue => {
    const age = Date.now() - new Date(issue.created_at).getTime();
    return age > 90 * 24 * 60 * 60 * 1000; // 90 days
  });
  
  return {
    name: repository.full_name,
    health: {
      isActive: daysSinceUpdate < 30,
      hasRecentActivity: daysSinceUpdate < 7,
      hasLicense: !!repository.license,
      hasDocumentation: !!repository.has_wiki || !!repository.has_pages,
      openIssues: issues.length,
      staleIssues: oldIssues.length,
      stalePercentage: (oldIssues.length / issues.length) * 100,
    },
  };
}
```

---

## TypeScript Types

### Exported Types

All types are exported from the service:

```typescript
import type {
  Repository,
  Issue,
  PullRequest,
  Commit,
  SearchRepositoriesResponse,
  SearchIssuesResponse,
  RateLimit,
  RateLimitStatus,
  SearchOptions,
  IssueSearchOptions,
  GitHubAPIConfig,
} from '@/services/github-api.service';
```

### Type Definitions

**Repository**
```typescript
type Repository = RestEndpointMethodTypes['repos']['get']['response']['data'];
```

**Issue**
```typescript
type Issue = RestEndpointMethodTypes['issues']['get']['response']['data'];
```

**PullRequest**
```typescript
type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data'];
```

**Commit**
```typescript
type Commit = RestEndpointMethodTypes['repos']['getCommit']['response']['data'];
```

### Using Types

```typescript
import type { Repository, Issue } from '@/services/github-api.service';

async function processRepository(repo: Repository): Promise<void> {
  console.log(`Processing ${repo.full_name}`);
  console.log(`Stars: ${repo.stargazers_count}`);
  console.log(`Language: ${repo.language}`);
}

async function processIssue(issue: Issue): Promise<void> {
  console.log(`Issue #${issue.number}: ${issue.title}`);
  console.log(`State: ${issue.state}`);
  console.log(`Comments: ${issue.comments}`);
}
```

---

## Migration Guide

### From github.service.ts

If you're using the existing `github.service.ts`, here's how to migrate:

**Old (github.service.ts):**
```typescript
import { getGitHubService } from '@/services/github.service';

const github = getGitHubService(token);
const repos = await github.searchRepositories('react', { sort: 'stars' });
```

**New (github-api.service.ts):**
```typescript
import { getGitHubAPI } from '@/services/github-api.service';

const github = getGitHubAPI({ token });
const repos = await github.searchRepositories('react', { sort: 'stars' });
```

### Key Differences

1. **Type Safety**: New service uses @octokit/rest types
2. **Error Handling**: Custom error classes instead of generic errors
3. **Caching**: Built-in caching layer
4. **Rate Limiting**: Automatic monitoring and warnings
5. **Methods**: More comprehensive API coverage

### Coexistence

Both services can coexist:

```typescript
// Old service (fetch-based)
import { getGitHubService } from '@/services/github.service';

// New service (octokit-based)
import { getGitHubAPI } from '@/services/github-api.service';

// Use both
const oldService = getGitHubService();
const newService = getGitHubAPI();
```

---

## Best Practices

### 1. Token Management

```typescript
// ✅ Good: Use environment variable
const github = new GitHubAPIService({
  token: process.env.GITHUB_TOKEN,
});

// ✅ Good: Pass token securely
const github = getGitHubAPI({
  token: await getSecureToken(),
});

// ❌ Bad: Hardcode token
const github = new GitHubAPIService({
  token: 'ghp_hardcodedtoken',
});
```

### 2. Error Handling

```typescript
// ✅ Good: Handle specific errors
try {
  const repo = await github.getRepository(owner, name);
} catch (error) {
  if (error instanceof NotFoundError) {
    return null; // Repository doesn't exist
  }
  if (error instanceof RateLimitError) {
    await waitForReset(error.resetAt);
    return retry();
  }
  throw error; // Re-throw unexpected errors
}

// ❌ Bad: Catch and ignore
try {
  const repo = await github.getRepository(owner, name);
} catch {
  // Silent failure
}
```

### 3. Rate Limit Management

```typescript
// ✅ Good: Monitor rate limits
async function batchProcess(items: string[]) {
  for (const item of items) {
    const status = await github.getRateLimitStatus();
    
    if (status.isNearLimit) {
      await delay(5000); // Slow down
    }
    
    await processItem(item);
  }
}

// ❌ Bad: Ignore rate limits
async function batchProcess(items: string[]) {
  await Promise.all(items.map(processItem)); // May hit rate limit
}
```

### 4. Caching Usage

```typescript
// ✅ Good: Use cache for repeated queries
const github = new GitHubAPIService({
  cacheTTL: 10 * 60 * 1000, // 10 minutes
});

// ✅ Good: Clear cache when data changes
await github.createIssue(/* ... */);
github.clearCache(`issues:${owner}/${repo}`);

// ❌ Bad: Too short TTL (wasted API calls)
const github = new GitHubAPIService({
  cacheTTL: 1000, // 1 second - too short
});
```

### 5. Parallel Requests

```typescript
// ✅ Good: Batch related requests
const [repo, issues, prs] = await Promise.all([
  github.getRepository(owner, name),
  github.getRepositoryIssues(owner, name),
  github.getRepositoryPullRequests(owner, name),
]);

// ❌ Bad: Sequential when parallel is possible
const repo = await github.getRepository(owner, name);
const issues = await github.getRepositoryIssues(owner, name);
const prs = await github.getRepositoryPullRequests(owner, name);
```

---

## Troubleshooting

### Rate Limit Errors

```typescript
// Handle rate limit gracefully
try {
  const repos = await github.searchRepositories(query);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limit reached. Resets at ${error.resetAt}`);
    // Option 1: Wait and retry
    const waitTime = error.resetAt.getTime() - Date.now();
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return github.searchRepositories(query);
    
    // Option 2: Use cached data
    // Option 3: Notify user to try later
  }
}
```

### Authentication Issues

```typescript
// Verify token is valid
const github = getGitHubAPI({ token: process.env.GITHUB_TOKEN });

try {
  const status = await github.getRateLimitStatus();
  console.log('Token is valid:', status);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid or expired token');
    // Prompt user for new token
  }
}
```

### Cache Issues

```typescript
// Clear cache if seeing stale data
github.clearCache(); // Clear all

// Or clear specific cache
github.clearCache('repo:owner/name');

// Check cache statistics
const stats = github.getCacheStats();
console.log(`Cache size: ${stats.size}, keys: ${stats.keys}`);
```

---

## Summary

The `GitHubAPIService` provides a production-ready GitHub API client with:

✅ **Type Safety** - Full TypeScript support  
✅ **Error Handling** - Custom error classes  
✅ **Rate Limiting** - Automatic monitoring  
✅ **Caching** - Built-in with TTL  
✅ **Retry Logic** - Exponential backoff  
✅ **Comprehensive** - Repos, issues, PRs, commits  

**Ready for production use!** 🚀
