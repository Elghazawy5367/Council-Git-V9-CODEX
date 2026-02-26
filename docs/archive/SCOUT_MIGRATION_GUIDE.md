# Scout System Migration Guide

## Overview

The Scout system has been refactored to separate API concerns from analysis logic. This migration extracted ~150 lines of API calls into dedicated service layers.

## What Changed

### Before (845 lines in scout.ts)
- Mixed API calls with analysis algorithms
- Direct `fetch()` calls to GitHub API
- Rate limiting logic embedded in analysis functions

### After (3 files, better separation)

1. **src/services/github.service.ts** (200 lines)
   - GitHub API v3 wrapper using Octokit patterns
   - Rate limiting and retry logic
   - Repository search and issue retrieval
   
2. **src/services/reddit.service.ts** (200 lines)
   - Reddit API wrapper (for future use)
   - Pain point filtering utilities
   - Engagement-based filtering

3. **src/lib/scout.ts** (~837 lines → target ~400 core analysis)
   - Pure analysis algorithms preserved:
     - `calculateBlueOceanScore()` - scoring algorithm
     - `transformToOpportunity()` - data transformation
     - `clusterPainPoints()` - clustering algorithm
     - `identifyOpportunities()` - opportunity detection
     - `detectTrends()` - trend analysis
     - `extractKeywords()` - keyword extraction
   - Uses services for all API calls

## Breaking Changes

**None!** All function signatures and return types are preserved.

### Function Signatures (Unchanged)

```typescript
// Public API - no changes
export async function scanBlueOcean(topic: string): Promise<Opportunity[]>
export async function runScout(): Promise<ScoutReport>
export async function consultKnowledgeBase(filename: string): Promise<string>
export async function getEngineeredPrompt(path: string): Promise<string | null>
```

## Migration Steps

### For Existing Code

No changes required! The refactor maintains backward compatibility.

```typescript
// This still works exactly the same
import { scanBlueOcean, runScout } from '@/lib/scout';

const opportunities = await scanBlueOcean('developer-tools');
const report = await runScout();
```

### For New Code Using Services Directly

If you want to use the new services for other purposes:

```typescript
import { getGitHubService } from '@/services/github.service';
import { getRedditService } from '@/services/reddit.service';

// GitHub operations
const githubService = getGitHubService();
const repos = await githubService.searchRepositories('topic:react stars:>1000');
const issues = await githubService.getRepositoryIssues('owner/repo');

// Reddit operations (future use)
const redditService = getRedditService();
const posts = await redditService.searchPosts('developer tools');
const painPoints = redditService.filterPainPoints(posts);
```

## Service API Reference

### GitHubService

```typescript
class GitHubService {
  // Search repositories by query
  searchRepositories(query: string, options?: {
    sort?: 'stars' | 'forks' | 'updated';
    order?: 'asc' | 'desc';
    perPage?: number;
    page?: number;
  }): Promise<{ items: GitHubRawRepo[]; total_count: number }>

  // Get repository issues
  getRepositoryIssues(fullName: string, options?: {
    state?: 'open' | 'closed' | 'all';
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    perPage?: number;
  }): Promise<ScoutIssue[]>

  // Get repository details
  getRepository(fullName: string): Promise<GitHubRawRepo>

  // Get file content
  getFileContent(owner: string, repo: string, path: string, branch?: string): Promise<string>

  // Check rate limits
  getRateLimit(): Promise<{ limit: number; remaining: number; reset: Date }>
}
```

### RedditService

```typescript
class RedditService {
  // Search posts
  searchPosts(query: string, options?: {
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
    subreddit?: string;
  }): Promise<RedditPost[]>

  // Get subreddit posts
  getSubredditPosts(subreddit: string, options?: {
    sort?: 'hot' | 'new' | 'top' | 'rising';
    timeRange?: string;
    limit?: number;
  }): Promise<{ posts: RedditPost[]; after: string | null }>

  // Filter posts
  filterPostsByKeywords(posts: RedditPost[], keywords: string[], excludeKeywords?: string[]): RedditPost[]
  filterByEngagement(posts: RedditPost[], minUpvotes?: number, minComments?: number): RedditPost[]
  filterPainPoints(posts: RedditPost[]): RedditPost[]
}
```

## Analysis Algorithms Preserved

All unique Scout analysis algorithms remain in `scout.ts`:

### 1. Blue Ocean Scoring
```typescript
function calculateBlueOceanScore(repo: {
  stars: number;
  forks: number;
  openIssues: number;
  daysSinceUpdate: number;
}): number
```
**Algorithm:**
- High stars (>500) = proven demand (30 points)
- Abandoned (365+ days) + popular = goldmine (30 points)
- Low fork ratio = low competition (20 points)
- Active issues = ongoing demand (20 points)

### 2. Pain Point Clustering
```typescript
async function clusterPainPoints(painPoints: PainPoint[]): Promise<PainPoint[]>
```
**Algorithm:**
- Keyword-based clustering (first 3 keywords form cluster key)
- Merges similar pain points
- Picks most engaged representative
- Aggregates frequency and URLs

### 3. Trend Detection
```typescript
async function detectTrends(painPoints: PainPoint[]): Promise<string[]>
```
**Algorithm:**
- Extracts keywords from all pain points
- Counts keyword frequency
- Identifies keywords appearing in >10% of pain points
- Returns top 10 trending topics

### 4. Opportunity Identification
```typescript
async function identifyOpportunities(painPoints: PainPoint[]): Promise<ProductOpportunity[]>
```
**Algorithm:**
- Generates solutions based on pain point keywords
- Calculates impact/effort ratio
- Scores by confidence × (impact / effort)
- Returns top 20 opportunities

### 5. Severity Calculation
```typescript
function calculateSeverity(issue: ScoutIssue, indicators: string[]): "critical" | "high" | "medium" | "low"
```
**Algorithm:**
- Score = indicator count + (comments / 10)
- >5 = critical, >3 = high, >1 = medium, else low

## Environment Variables

Same as before:

```bash
GITHUB_TOKEN=ghp_your_token_here  # Required for API access
TARGET_NICHE=developer-tools       # Optional, default: "developer tools"
SCAN_DEPTH=normal                  # Optional: shallow|normal|deep
```

## Testing

Run the same commands:

```bash
# Full scout run
npm run scout

# Blue Ocean scan
npm run scout:blue-ocean

# Generate report
npm run scout:report
```

## Benefits of This Refactor

1. **Separation of Concerns**
   - API logic isolated in services
   - Analysis algorithms remain pure
   - Easier to test and maintain

2. **Reusability**
   - GitHub service can be used by other features
   - Reddit service ready for future intelligence gathering
   - Analysis algorithms remain independent

3. **Better Error Handling**
   - Centralized retry logic in services
   - Rate limiting handled at service level
   - Cleaner error messages

4. **Future Extensibility**
   - Easy to add new data sources (HackerNews, ProductHunt)
   - Analysis algorithms can work with any data source
   - Service patterns can be replicated for other APIs

## Rollback Plan

If issues arise, the original scout.ts is preserved in git history:

```bash
# View original version
git show HEAD~1:src/lib/scout.ts

# Rollback if needed
git checkout HEAD~1 -- src/lib/scout.ts
```

## Support

For questions or issues:
1. Check TypeScript errors: `npm run typecheck`
2. Review service implementations in `src/services/`
3. Compare with existing clients in `src/features/automation/lib/api/`

## Related Files

- `src/services/github.service.ts` - GitHub API wrapper
- `src/services/reddit.service.ts` - Reddit API wrapper  
- `src/lib/scout.ts` - Core analysis algorithms
- `src/lib/types.ts` - Shared type definitions
- `src/features/automation/lib/api/github-client.ts` - Similar pattern reference
