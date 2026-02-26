# Council Code Analyzer V2 - Complete Guide

**Self-Improve V2** analyzes unique Council algorithm implementations for performance, type safety, optimization opportunities, and test coverage gaps.

---

## Overview

### What It Does

Analyzes **27+ unique Council algorithm files** for:
1. **Performance Bottlenecks** - O(n²) loops, blocking operations, inefficiencies
2. **Type Safety Issues** - 'any' types, missing return types, unsafe access
3. **Algorithm Optimizations** - Repeated calculations, better data structures
4. **Test Coverage Gaps** - Missing tests, untested error paths, complex logic

### What It Excludes

- ❌ shadcn/ui components (`src/components/primitives/`)
- ❌ Generic utilities (`utils.ts`, `format.ts`)
- ❌ Type definition files (`types.ts`)
- ❌ Configuration files (`config.ts`, `db.ts`)
- ❌ Generic API wrappers

---

## Target Files (27+ Algorithms)

### Core Services (3 files)
- `src/services/ruthless-judge.ts` - Iterative refinement, convergence detection
- `src/services/council.service.ts` - Expert orchestration, message passing
- `src/services/openrouter.ts` - LLM API integration

### Analysis Engines (4 files)
- `src/lib/synthesis-engine.ts` - Multi-tier synthesis (quick/balanced/deep)
- `src/lib/expert-weights.ts` - Weight calculation algorithms
- `src/lib/synthesis-cache.ts` - Caching strategies
- `src/lib/synthesis-output-formatter.ts` - Output formatting

### Intelligence Tools (4 files)
- `src/lib/scout.ts` - Blue Ocean detection, pain point clustering
- `src/lib/goldmine-detector.ts` - ROI calculation, goldmine scoring
- `src/lib/mining-drill.ts` - Pain point extraction, buying intent scoring
- `src/lib/reddit-sniper.ts` - Lead generation, urgency scoring

### Market Intelligence (4 files)
- `src/lib/producthunt-intelligence.ts` - Product Hunt analysis
- `src/lib/hackernews-intelligence.ts` - Hacker News trending
- `src/lib/stargazer-intelligence.ts` - GitHub stargazer analysis
- `src/lib/viral-radar.ts` - Viral content detection

### Specialized Algorithms (5 files)
- `src/lib/twin-mimicry.ts` - Developer profiling
- `src/lib/twin-mimicry-v2.ts` - MOE pattern extraction
- `src/lib/fork-evolution.ts` - Fork relationship analysis
- `src/lib/code-mirror.ts` - Code quality analysis
- `src/lib/prompt-heist.ts` - Prompt engineering analysis

### Data Processing (4 files)
- `src/lib/knowledge-loader.ts` - Knowledge base loading
- `src/lib/opportunity-loader.ts` - Opportunity data management
- `src/lib/report-generator.ts` - Report generation algorithms
- `src/lib/workflow-dispatcher.ts` - Workflow automation

### Security & Validation (3 files)
- `src/lib/sanitize.ts` - Input sanitization
- `src/lib/validation.ts` - Data validation algorithms
- `src/lib/error-handler.ts` - Error handling strategies
- `src/lib/protection-tests.ts` - Security protection tests

---

## Usage

### CLI Commands

**Analyze All Council Algorithms:**
```bash
npx tsx src/lib/self-improve-v2.ts
```

**Analyze Specific File:**
```bash
npx tsx src/lib/self-improve-v2.ts --file scout.ts
npx tsx src/lib/self-improve-v2.ts --file ruthless-judge.ts
```

**Focus on Specific Analysis Type:**
```bash
# Performance only
npx tsx src/lib/self-improve-v2.ts --focus performance

# Type safety only
npx tsx src/lib/self-improve-v2.ts --focus type-safety

# Optimizations only
npx tsx src/lib/self-improve-v2.ts --focus optimization

# Test coverage only
npx tsx src/lib/self-improve-v2.ts --focus test-coverage
```

**Get Help:**
```bash
npx tsx src/lib/self-improve-v2.ts --help
```

### Programmatic Usage

```typescript
import { analyzeCouncilCode } from '@/lib/self-improve-v2';

// Analyze all files
const result = await analyzeCouncilCode();

// Analyze specific files
const result = await analyzeCouncilCode({
  targetFiles: ['src/lib/scout.ts', 'src/services/ruthless-judge.ts'],
});

// Focus on specific analysis types
const result = await analyzeCouncilCode({
  analysisTypes: ['performance', 'type-safety'],
});

// Custom output directory
const result = await analyzeCouncilCode({
  outputDir: './my-analysis',
});

// Access results
console.log(`Total Issues: ${result.summary.totalIssues}`);
console.log(`Critical: ${result.summary.criticalIssues}`);
console.log(result.summary.topRecommendations);
```

---

## Analysis Types

### 1. Performance Bottleneck Detection

**What It Detects:**
- **O(n²) Nested Loops** - forEach inside forEach
- **Synchronous Blocking** - readFileSync, readdirSync
- **Large Iterations** - Complex operations in loops
- **Chained Operations** - Multiple passes over arrays
- **Missing Caching** - Repeated expensive calculations

**Example Issue:**
```json
{
  "type": "performance",
  "file": "src/lib/scout.ts",
  "function": "clusterPainPoints",
  "issue": "Nested loops detected (O(n²) complexity)",
  "severity": "high",
  "impact": "Performance degrades significantly with large datasets",
  "recommendation": "Use Map or Set for O(1) lookups",
  "codeExample": "const map = new Map(items.map(i => [i.key, i]));\nresults.forEach(r => { const item = map.get(r.key); });",
  "estimatedImpact": "Can reduce time complexity from O(n²) to O(n)"
}
```

**Real Example from Scout.ts:**
```typescript
// PROBLEM: O(n²) complexity
function clusterPainPoints(painPoints) {
  const clusters = [];
  painPoints.forEach(point1 => {
    painPoints.forEach(point2 => {  // ← Nested loop!
      if (similar(point1, point2)) {
        clusters.push([point1, point2]);
      }
    });
  });
  return clusters;
}

// SOLUTION: O(n) with Map
function clusterPainPoints(painPoints) {
  const keywordMap = new Map();
  
  // O(n) - Single pass
  painPoints.forEach(point => {
    const key = generateKey(point);
    if (!keywordMap.has(key)) {
      keywordMap.set(key, []);
    }
    keywordMap.get(key).push(point);
  });
  
  // Convert to clusters
  return Array.from(keywordMap.values());
}
```

### 2. Type Safety Analysis

**What It Detects:**
- **'any' Types** - Bypasses type checking
- **Missing Return Types** - Functions without explicit types
- **Unsafe Property Access** - Nested access without optional chaining
- **Missing Type Guards** - Runtime validation needed
- **Implicit Coercion** - Unintended type conversions

**Example Issue:**
```json
{
  "type": "type-safety",
  "file": "src/lib/mining-drill.ts",
  "line": 62,
  "issue": "Use of 'any' type bypasses type checking",
  "severity": "high",
  "recommendation": "Define proper interface or use unknown type",
  "codeExample": "interface GitHubIssue { comments: number; created_at: string; labels: Label[]; reactions?: { total_count: number }; }"
}
```

**Real Example from Mining-Drill.ts:**
```typescript
// PROBLEM: any type
function calculateUrgency(issue: any): number {  // ← any type!
  let score = 0;
  score += Math.min(30, issue.comments * 3);
  // ... more calculations
  return score;
}

// SOLUTION: Proper interface
interface GitHubIssue {
  comments: number;
  created_at: string;
  labels: Label[];
  reactions?: {
    total_count: number;
  };
}

function calculateUrgency(issue: GitHubIssue): number {
  let score = 0;
  score += Math.min(30, issue.comments * 3);
  // Now type-safe!
  return score;
}
```

### 3. Optimization Opportunities

**What It Detects:**
- **Repeated Calculations** - Computing same value multiple times
- **filter().map() Chains** - Two passes instead of one
- **Multiple Array Iterations** - Unnecessary passes
- **Missing React.useMemo** - Expensive computations without memoization
- **Array Creation in Loops** - Memory allocations

**Example Issue:**
```json
{
  "type": "optimization",
  "file": "src/lib/goldmine-detector.ts",
  "function": "findGoldmines",
  "issue": "Repeated forkRatio calculation",
  "recommendation": "Calculate once and store result",
  "codeExample": "const reposWithRatio = repos.map(r => ({ ...r, forkRatio: r.forks / r.stars }));",
  "benefit": "Reduces redundant division operations"
}
```

**Real Example from Goldmine-Detector.ts:**
```typescript
// PROBLEM: Repeated calculation
function findGoldmines(opportunities) {
  return opportunities
    .filter(repo => {
      const forkRatio = repo.forks / repo.stars;  // Calculated
      return forkRatio < 0.2;
    })
    .sort((a, b) => {
      const ratioA = a.forks / a.stars;  // Recalculated!
      const ratioB = b.forks / b.stars;
      return ratioA - ratioB;
    });
}

// SOLUTION: Calculate once
function findGoldmines(opportunities) {
  // Calculate once in map phase
  const enhanced = opportunities.map(repo => ({
    ...repo,
    forkRatio: repo.forks / repo.stars
  }));
  
  // Now use cached value
  return enhanced
    .filter(repo => repo.forkRatio < 0.2)
    .sort((a, b) => a.forkRatio - b.forkRatio);
}
```

### 4. Test Coverage Analysis

**What It Detects:**
- **Missing Test Files** - No .test.ts file for algorithm
- **Untested Error Paths** - try/catch without error tests
- **High Complexity** - Complex logic without tests
- **Algorithm Performance** - No performance benchmarks
- **Priority Scoring** - Which tests matter most

**Example Issue:**
```json
{
  "type": "test-coverage",
  "file": "src/services/ruthless-judge.ts",
  "function": "All exported functions",
  "issue": "No test file found (8 exported functions)",
  "priority": "high",
  "complexity": 16,
  "recommendation": "Create ruthless-judge.test.ts with tests",
  "testExample": "describe('RuthlessJudge', () => {\n  test('judge', () => { ... });\n});"
}
```

**Test Example:**
```typescript
// MISSING: ruthless-judge.test.ts

// RECOMMENDED:
import { RuthlessJudgeService } from './ruthless-judge';

describe('RuthlessJudgeService', () => {
  let judge: RuthlessJudgeService;

  beforeEach(() => {
    judge = new RuthlessJudgeService('test-api-key');
  });

  test('judge synthesizes multiple responses', async () => {
    const responses = [
      { id: '1', content: 'Response 1', model: 'gpt-4' },
      { id: '2', content: 'Response 2', model: 'claude-3' },
    ];

    const result = await judge.judge(responses);

    expect(result.unifiedResponse).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.scoreBreakdown).toHaveProperty('1');
  });

  test('handles convergence detection', async () => {
    const responses = [/* ... */];

    const result = await judge.judge(responses, {
      enableIterativeRefinement: true,
      convergenceThreshold: 85,
    });

    expect(result.convergenceAchieved).toBe(true);
    expect(result.refinementRounds).toBeLessThanOrEqual(3);
  });

  test('handles errors gracefully', async () => {
    const invalidResponses = [];

    await expect(judge.judge(invalidResponses)).rejects.toThrow();
  });
});
```

---

## Output Reports

### JSON Reports (Machine-Readable)

**Location:** `data/analysis/`

**Files:**
1. `performance-bottlenecks.json` - All performance issues
2. `type-safety-issues.json` - All type safety problems
3. `optimization-opportunities.json` - All optimization suggestions
4. `test-coverage-gaps.json` - All test coverage gaps

**Format:**
```json
{
  "type": "performance",
  "file": "src/lib/scout.ts",
  "function": "clusterPainPoints",
  "line": 42,
  "issue": "Nested loops detected",
  "severity": "high",
  "impact": "Performance degrades with large datasets",
  "recommendation": "Use Map for O(1) lookups",
  "codeExample": "...",
  "estimatedImpact": "O(n²) → O(n)"
}
```

### Markdown Report (Human-Readable)

**Location:** `data/reports/council-code-analysis.md`

**Sections:**
1. **Executive Summary** - Total issues, priorities, top recommendations
2. **Performance Issues** - Detailed analysis with code examples
3. **Type Safety Issues** - All type problems with fixes
4. **Optimization Opportunities** - Suggested improvements with benefits
5. **Test Coverage Gaps** - Missing tests with examples
6. **Implementation Roadmap** - Prioritized action plan

**Example:**
```markdown
# Council Code Analysis Report

*Generated: 2/2/2026, 2:30:00 PM*

**Files Analyzed:** 27

---

## Executive Summary

- **Total Issues Found:** 42
- **Critical Issues:** 2
- **High Priority Issues:** 8

### Top Recommendations

1. 🚨 Fix 2 critical performance bottleneck(s)
2. 🔒 Replace 8 'any' type(s) with proper interfaces
3. ⚡ Optimize 3 O(n²) algorithm(s) to O(n)
4. 🧪 Add test coverage for 4 untested module(s)
5. 🎯 Apply 5 quick optimization(s)

---

## 🚀 Performance Issues

### 1. Nested loops detected (O(n²) complexity)

**File:** `src/lib/scout.ts`
**Function:** clusterPainPoints
**Severity:** HIGH
**Impact:** Performance degrades significantly with large datasets

**Recommendation:**
Use Map or Set for O(1) lookups instead of nested loops

**Code Example:**
```typescript
// Use Map for O(1) lookups
const map = new Map(items.map(i => [i.key, i]));
results.forEach(r => { const item = map.get(r.key); });
```

*Estimated Impact: Can reduce time complexity from O(n²) to O(n)*

---
```

---

## Console Output

```
🔍 Council Code Analyzer V2
──────────────────────────────────────────────────
Analyzing 27 algorithm files...

📄 Analyzing ruthless-judge.ts...
📄 Analyzing synthesis-engine.ts...
📄 Analyzing scout.ts...
📄 Analyzing goldmine-detector.ts...
📄 Analyzing mining-drill.ts...
📄 Analyzing reddit-sniper.ts...
📄 Analyzing expert-weights.ts...
📄 Analyzing synthesis-cache.ts...
📄 Analyzing twin-mimicry.ts...
📄 Analyzing twin-mimicry-v2.ts...
📄 Analyzing fork-evolution.ts...
📄 Analyzing code-mirror.ts...
📄 Analyzing prompt-heist.ts...
📄 Analyzing producthunt-intelligence.ts...
📄 Analyzing hackernews-intelligence.ts...
📄 Analyzing stargazer-intelligence.ts...
📄 Analyzing viral-radar.ts...
📄 Analyzing knowledge-loader.ts...
📄 Analyzing opportunity-loader.ts...
📄 Analyzing report-generator.ts...
📄 Analyzing workflow-dispatcher.ts...
📄 Analyzing sanitize.ts...
📄 Analyzing validation.ts...
📄 Analyzing error-handler.ts...
📄 Analyzing protection-tests.ts...
📄 Analyzing council.service.ts...
📄 Analyzing openrouter.ts...

✅ Analysis complete!
──────────────────────────────────────────────────

📊 ANALYSIS SUMMARY
──────────────────────────────────────────────────
Total Issues: 42
  - Critical: 2
  - High Priority: 8

📈 Breakdown:
  - Performance: 12
  - Type Safety: 15
  - Optimizations: 8
  - Test Gaps: 7

🎯 Top Recommendations:
  1. 🚨 Fix 2 critical performance bottleneck(s)
  2. 🔒 Replace 8 'any' type(s) with proper interfaces
  3. ⚡ Optimize 3 O(n²) algorithm(s) to O(n)
  4. 🧪 Add test coverage for 4 untested module(s)
  5. 🎯 Apply 5 quick optimization(s)

📁 Reports saved to:
  - data/analysis/*.json (detailed JSON reports)
  - data/reports/council-code-analysis.md (comprehensive guide)
```

---

## Implementation Roadmap

### Immediate (This Week)

**Priority: CRITICAL**

1. **Fix O(n²) Algorithms**
   - scout.ts: clusterPainPoints() → Use Map
   - Expected Impact: 10-100x speedup on large datasets

2. **Replace 'any' Types**
   - mining-drill.ts: calculateUrgency(issue: any)
   - mining-drill.ts: detectBuyingIntent(issue: any)
   - Expected Impact: Catch bugs at compile time

3. **Add Critical Tests**
   - ruthless-judge.test.ts: convergence logic
   - synthesis-engine.test.ts: tier selection
   - Expected Impact: Prevent regressions

### Short-term (This Month)

**Priority: HIGH**

1. **Apply Optimizations**
   - goldmine-detector.ts: Pre-calculate forkRatio
   - expert-weights.ts: Cache weight calculations
   - Expected Impact: 2-5x speedup

2. **Improve Type Safety**
   - Add return types to all functions
   - Use optional chaining (?.)
   - Expected Impact: Better IDE support, fewer bugs

3. **Expand Test Coverage**
   - Add error case tests
   - Add performance benchmarks
   - Target: 80%+ coverage

### Long-term (This Quarter)

**Priority: MEDIUM**

1. **Refactor Complex Functions**
   - Break down high-complexity functions
   - Extract reusable utilities
   - Expected Impact: Better maintainability

2. **Performance Profiling**
   - Profile real-world usage
   - Identify actual bottlenecks
   - Optimize based on data

3. **Comprehensive Testing**
   - Integration tests
   - End-to-end scenarios
   - Performance regression tests

---

## Best Practices

### Performance

**DO:**
- ✅ Use Map/Set for lookups instead of nested loops
- ✅ Calculate expensive operations once
- ✅ Use async/await for I/O operations
- ✅ Batch operations when possible
- ✅ Cache frequently used calculations

**DON'T:**
- ❌ Use nested forEach/for loops (O(n²))
- ❌ Use synchronous file operations
- ❌ Recalculate same values multiple times
- ❌ Create arrays/objects in tight loops
- ❌ Chain multiple array operations unnecessarily

### Type Safety

**DO:**
- ✅ Define proper interfaces for data structures
- ✅ Add explicit return types to functions
- ✅ Use optional chaining (?.) for nested access
- ✅ Use type guards for runtime validation
- ✅ Prefer unknown over any

**DON'T:**
- ❌ Use 'any' type (bypasses type checking)
- ❌ Skip return type annotations
- ❌ Access nested properties without checks
- ❌ Use implicit type coercion
- ❌ Ignore TypeScript errors

### Optimization

**DO:**
- ✅ Combine filter().map() into single reduce()
- ✅ Pre-calculate repeated values
- ✅ Use React.useMemo for expensive computations
- ✅ Pre-allocate arrays when size known
- ✅ Use intermediate variables for clarity

**DON'T:**
- ❌ Chain multiple array operations
- ❌ Calculate same value in filter and sort
- ❌ Create new objects unnecessarily
- ❌ Skip memoization in React components
- ❌ Iterate over arrays multiple times

### Testing

**DO:**
- ✅ Test all exported functions
- ✅ Test error cases and edge conditions
- ✅ Add performance benchmarks for algorithms
- ✅ Use test.each for multiple scenarios
- ✅ Test complex logic paths

**DON'T:**
- ❌ Skip tests for "simple" functions
- ❌ Only test happy paths
- ❌ Ignore high-complexity functions
- ❌ Skip performance tests for algorithms
- ❌ Forget to test error handling

---

## Troubleshooting

### "File not found" Errors

**Problem:** Some target files don't exist

**Solution:**
```bash
# Check if files exist
ls -la src/lib/scout.ts
ls -la src/services/ruthless-judge.ts

# Run analysis on existing files only
npx tsx src/lib/self-improve-v2.ts --file scout.ts
```

### "No issues found"

**Problem:** Analysis doesn't detect any issues

**Possible Causes:**
1. Code is already well-optimized
2. Exclusion patterns too broad
3. Analysis types not enabled

**Solution:**
```typescript
// Check what's being analyzed
const result = await analyzeCouncilCode({
  targetFiles: ['src/lib/scout.ts'],  // Specific file
  analysisTypes: ['performance', 'type-safety', 'optimization', 'test-coverage'],  // All types
  excludePatterns: [],  // No exclusions
});
```

### Reports not generating

**Problem:** JSON/Markdown reports not created

**Solution:**
```bash
# Ensure output directories exist
mkdir -p data/analysis
mkdir -p data/reports

# Check permissions
ls -la data/

# Run with custom output dir
npx tsx src/lib/self-improve-v2.ts --output ./my-reports
```

---

## API Reference

### analyzeCouncilCode(config?)

Main analysis function.

**Parameters:**
```typescript
interface AnalysisConfig {
  targetFiles?: string[];        // Files to analyze (default: all Council files)
  analysisTypes?: AnalysisType[];  // Types of analysis to run
  excludePatterns?: RegExp[];    // Patterns to exclude
  outputDir?: string;            // Output directory for reports
}

type AnalysisType = 'performance' | 'type-safety' | 'optimization' | 'test-coverage';
```

**Returns:**
```typescript
interface CouncilAnalysisResult {
  timestamp: string;
  filesAnalyzed: number;
  performanceIssues: PerformanceIssue[];
  typeSafetyIssues: TypeSafetyIssue[];
  optimizationOpportunities: OptimizationOpportunity[];
  testCoverageGaps: TestCoverageGap[];
  summary: {
    criticalIssues: number;
    highPriorityIssues: number;
    totalIssues: number;
    topRecommendations: string[];
  };
}
```

### Issue Types

```typescript
interface PerformanceIssue {
  type: 'performance';
  file: string;
  function: string;
  line?: number;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendation: string;
  codeExample?: string;
  estimatedImpact?: string;
}

interface TypeSafetyIssue {
  type: 'type-safety';
  file: string;
  line?: number;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  codeExample?: string;
}

interface OptimizationOpportunity {
  type: 'optimization';
  file: string;
  function: string;
  issue: string;
  recommendation: string;
  codeExample?: string;
  benefit: string;
}

interface TestCoverageGap {
  type: 'test-coverage';
  file: string;
  function: string;
  issue: string;
  priority: 'low' | 'medium' | 'high';
  complexity: number;
  recommendation: string;
  testExample?: string;
}
```

---

## Comparison with V1

| Feature | V1 (self-improve.ts) | V2 (self-improve-v2.ts) |
|---------|---------------------|------------------------|
| **Purpose** | Learn from GitHub repos | Analyze Council code |
| **Target** | External repositories | Internal algorithms |
| **Analysis** | Success patterns | Code quality issues |
| **Output** | Knowledge base markdown | JSON + Markdown reports |
| **Focus** | Positioning, pricing, features | Performance, types, tests |
| **Use Case** | Learn best practices | Improve code quality |
| **Frequency** | Periodic learning | Continuous improvement |

**Both versions are valuable:**
- **Use V1** when you want to learn from successful repositories
- **Use V2** when you want to improve Council's own code

---

## Summary

**Self-Improve V2** is a comprehensive code analysis tool that:

✅ **Targets** 27+ unique Council algorithm files  
✅ **Detects** performance bottlenecks, type issues, optimizations, test gaps  
✅ **Provides** actionable recommendations with code examples  
✅ **Generates** detailed reports (JSON + Markdown)  
✅ **Excludes** non-algorithm code (UI, utilities)  
✅ **Maintains** 100% backward compatibility  

**Run it regularly** to maintain high code quality and catch issues early!

```bash
npx tsx src/lib/self-improve-v2.ts
```

---

*Last updated: 2/2/2026*
