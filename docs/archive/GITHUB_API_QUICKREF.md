# GitHub API Service - Quick Reference

TL;DR guide for the professional GitHub API service.

---

## 🚀 Quick Start

```typescript
import { getGitHubAPI } from '@/services/github-api.service';

// Get singleton instance
const github = getGitHubAPI({ token: process.env.GITHUB_TOKEN });

// Search repositories
const repos = await github.searchRepositories('react framework');

// Get repository
const repo = await github.getRepository('facebook', 'react');

// Check rate limit
const status = await github.getRateLimitStatus();
```

---

## 📦 Common Operations

### Search Repositories
```typescript
const result = await github.searchRepositories('language:typescript stars:>1000', {
  sort: 'stars',
  order: 'desc',
  perPage: 30,
});

console.log(`Found ${result.total_count} repositories`);
result.items.forEach(repo => console.log(repo.full_name));
```

### Get Trending
```typescript
const trending = await github.getTrendingRepositories('typescript', 'week');
```

### Get Issues
```typescript
const issues = await github.getRepositoryIssues('owner', 'repo', {
  state: 'open',
  labels: ['bug', 'help-wanted'],
  sort: 'updated',
});
```

### Get Pull Requests
```typescript
const prs = await github.getRepositoryPullRequests('owner', 'repo', {
  state: 'open',
  sort: 'updated',
});
```

### Get Commits
```typescript
const commits = await github.getRepositoryCommits('owner', 'repo', {
  since: new Date('2024-01-01'),
  perPage: 50,
});
```

---

## 🔒 Error Handling

```typescript
import {
  RateLimitError,
  AuthenticationError,
  NotFoundError,
} from '@/services/github-api.service';

try {
  const repo = await github.getRepository('owner', 'name');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Wait until: ${error.resetAt}`);
  } else if (error instanceof AuthenticationError) {
    console.error('Check your GitHub token');
  } else if (error instanceof NotFoundError) {
    console.error('Repository not found');
  }
}
```

---

## 📊 Rate Limit Check

```typescript
const status = await github.getRateLimitStatus();

console.log(`${status.remaining}/${status.limit} remaining`);
console.log(`Resets at: ${status.reset}`);
console.log(`Usage: ${status.percentageUsed.toFixed(2)}%`);

if (status.isNearLimit) {
  console.warn('Approaching rate limit!');
}
```

---

## 💾 Cache Management

```typescript
// Clear all cache
github.clearCache();

// Clear specific cache
github.clearCache('repo:owner/name');

// Get cache stats
const stats = github.getCacheStats();
console.log(`Cache size: ${stats.size}`);
```

---

## 🎯 Example Patterns

### Batch Processing with Rate Limit Check

```typescript
async function processRepositories(repos: string[]) {
  for (const repoName of repos) {
    // Check rate limit
    const status = await github.getRateLimitStatus();
    if (status.remaining < 10) {
      console.log('Low on rate limit, slowing down...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Process repository
    const [owner, name] = repoName.split('/');
    const repo = await github.getRepository(owner, name);
    console.log(`Processed: ${repo.full_name}`);
  }
}
```

### Parallel Requests

```typescript
// Fetch multiple resources in parallel
const [repo, issues, prs, commits] = await Promise.all([
  github.getRepository(owner, name),
  github.getRepositoryIssues(owner, name),
  github.getRepositoryPullRequests(owner, name),
  github.getRepositoryCommits(owner, name),
]);
```

### Search with Pagination

```typescript
async function getAllResults(query: string) {
  let page = 1;
  let allResults = [];
  
  while (true) {
    const result = await github.searchRepositories(query, {
      perPage: 100,
      page,
    });
    
    allResults.push(...result.items);
    
    if (result.items.length < 100) break;
    page++;
  }
  
  return allResults;
}
```

---

## ⚙️ Configuration

```typescript
const github = new GitHubAPIService({
  token: process.env.GITHUB_TOKEN,     // GitHub token
  cacheTTL: 10 * 60 * 1000,           // 10 minutes
  maxRetries: 3,                       // Retry attempts
  retryDelay: 1000,                    // Initial delay (ms)
});
```

---

## 📝 TypeScript Types

```typescript
import type {
  Repository,
  Issue,
  PullRequest,
  Commit,
  RateLimitStatus,
} from '@/services/github-api.service';

async function processRepo(repo: Repository): Promise<void> {
  console.log(`${repo.full_name} has ${repo.stargazers_count} stars`);
}
```

---

## 🆚 vs Old Service

**Old (github.service.ts):**
```typescript
import { getGitHubService } from '@/services/github.service';
const github = getGitHubService(token);
```

**New (github-api.service.ts):**
```typescript
import { getGitHubAPI } from '@/services/github-api.service';
const github = getGitHubAPI({ token });
```

**Benefits:**
- ✅ Full TypeScript types (@octokit)
- ✅ Custom error classes
- ✅ Built-in caching
- ✅ Rate limit monitoring
- ✅ More API coverage

---

## 🚨 Common Issues

### Rate Limit Exceeded
```typescript
// Solution: Wait for reset
if (error instanceof RateLimitError) {
  const waitTime = error.resetAt.getTime() - Date.now();
  await new Promise(resolve => setTimeout(resolve, waitTime));
}
```

### Authentication Failed
```typescript
// Solution: Check token
console.log('Token:', process.env.GITHUB_TOKEN);
// Verify token at: https://github.com/settings/tokens
```

### Resource Not Found
```typescript
// Solution: Verify owner/repo names
if (error instanceof NotFoundError) {
  console.log('Check owner and repo name');
}
```

---

## 📚 Full Documentation

For complete documentation, see:
→ **GITHUB_API_SERVICE_GUIDE.md** (20KB comprehensive guide)

**Includes:**
- Complete API reference
- Error handling patterns
- Rate limit strategies
- Caching best practices
- 5 detailed example queries
- Migration guide
- Troubleshooting

---

## ✅ Checklist

Before using in production:

- [ ] Set GITHUB_TOKEN environment variable
- [ ] Configure cache TTL appropriately
- [ ] Implement error handling
- [ ] Monitor rate limits
- [ ] Test with your use cases
- [ ] Clear cache when needed
- [ ] Handle authentication errors

---

## 🎯 Key Methods

| Method | Purpose |
|--------|---------|
| `searchRepositories()` | Search repositories |
| `getRepository()` | Get specific repo |
| `getTrendingRepositories()` | Get trending repos |
| `getRepositoryIssues()` | Get issues |
| `getRepositoryPullRequests()` | Get PRs |
| `getRepositoryCommits()` | Get commits |
| `getRateLimitStatus()` | Check rate limit |
| `clearCache()` | Clear cache |

---

## 💡 Pro Tips

1. **Use caching** for repeated queries
2. **Monitor rate limits** in loops
3. **Handle errors** specifically
4. **Batch requests** with Promise.all()
5. **Clear cache** after mutations

---

**Ready to use!** 🚀

For questions, see the full guide: `GITHUB_API_SERVICE_GUIDE.md`
