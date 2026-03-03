/**
 * Self-Improve V2 - Council Code Analyzer
 * 
 * Analyzes ONLY unique Council algorithm files for:
 * - Performance bottlenecks
 * - Type safety issues
 * - Algorithm optimizations
 * - Missing test coverage
 * 
 * EXCLUDES:
 * - shadcn/ui components
 * - Generic utilities
 * - Third-party wrappers
 */

import * as fs from 'fs';
import * as path from 'path';

// Target Council algorithm files (27+ unique implementations)
const COUNCIL_ALGORITHM_FILES = [
  // Core services
  'src/services/ruthless-judge.ts',
  'src/services/council.service.ts',
  
  // Analysis engines
  'src/lib/synthesis-engine.ts',
  'src/lib/expert-weights.ts',
  'src/lib/synthesis-cache.ts',
  'src/lib/synthesis-output-formatter.ts',
  
  // Intelligence tools
  'src/lib/scout.ts',
  'src/lib/goldmine-detector.ts',
  'src/lib/mining-drill.ts',
  'src/lib/reddit-sniper.ts',
  
  // Market intelligence
  'src/lib/producthunt-intelligence.ts',
  'src/lib/hackernews-intelligence.ts',
  'src/lib/stargazer-intelligence.ts',
  'src/lib/viral-radar.ts',
  
  // Specialized algorithms
  'src/lib/twin-mimicry.ts',
  'src/lib/twin-mimicry-v2.ts',
  'src/lib/fork-evolution.ts',
  'src/lib/code-mirror.ts',
  'src/lib/prompt-heist.ts',
  'src/lib/self-improve.ts',
  
  // Knowledge and data processing
  'src/lib/knowledge-loader.ts',
  'src/lib/opportunity-loader.ts',
  'src/lib/report-generator.ts',
  'src/lib/workflow-dispatcher.ts',
  
  // Security and validation
  'src/lib/sanitize.ts',
  'src/lib/validation.ts',
  'src/lib/error-handler.ts',
  'src/lib/protection-tests.ts',
];

// Patterns to exclude
const EXCLUDE_PATTERNS = [
  /src\/components\/primitives/,  // shadcn/ui
  /\.test\./,                      // Test files
  /utils\.ts$/,                    // Generic utils
  /format\.ts$/,                   // Generic formatters
  /types\.ts$/,                    // Type definitions only
  /config\.ts$/,                   // Configuration
  /db\.ts$/,                       // Database wrapper
  /api-client\.ts$/,               // Generic API client
];

export interface PerformanceIssue {
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

export interface TypeSafetyIssue {
  type: 'type-safety';
  file: string;
  line?: number;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  codeExample?: string;
}

export interface OptimizationOpportunity {
  type: 'optimization';
  file: string;
  function: string;
  issue: string;
  recommendation: string;
  codeExample?: string;
  benefit: string;
}

export interface TestCoverageGap {
  type: 'test-coverage';
  file: string;
  function: string;
  issue: string;
  priority: 'low' | 'medium' | 'high';
  complexity: number;
  recommendation: string;
  testExample?: string;
}

export interface CouncilAnalysisResult {
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

export interface AnalysisConfig {
  targetFiles?: string[];
  analysisTypes?: Array<'performance' | 'type-safety' | 'optimization' | 'test-coverage'>;
  excludePatterns?: RegExp[];
  outputDir?: string;
}

/**
 * Analyze Council code for issues and opportunities
 */
export async function analyzeCouncilCode(config: AnalysisConfig = {}): Promise<CouncilAnalysisResult> {
  const {
    targetFiles = COUNCIL_ALGORITHM_FILES,
    analysisTypes = ['performance', 'type-safety', 'optimization', 'test-coverage'],
    excludePatterns = EXCLUDE_PATTERNS,
    outputDir = path.join(process.cwd(), 'data', 'analysis'),
  } = config;


  const performanceIssues: PerformanceIssue[] = [];
  const typeSafetyIssues: TypeSafetyIssue[] = [];
  const optimizationOpportunities: OptimizationOpportunity[] = [];
  const testCoverageGaps: TestCoverageGap[] = [];

  let filesAnalyzed = 0;

  for (const relativeFilePath of targetFiles) {
    // Skip if matches exclude pattern
    if (excludePatterns.some(pattern => pattern.test(relativeFilePath))) {
      continue;
    }

    const filePath = path.join(process.cwd(), relativeFilePath);
    
    if (!fs.existsSync(filePath)) {
            continue;
    }

    const code = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(relativeFilePath);
    
        filesAnalyzed++;

    // Performance analysis
    if (analysisTypes.includes('performance')) {
      performanceIssues.push(...analyzePerformance(relativeFilePath, code));
    }

    // Type safety analysis
    if (analysisTypes.includes('type-safety')) {
      typeSafetyIssues.push(...analyzeTypeSafety(relativeFilePath, code));
    }

    // Optimization opportunities
    if (analysisTypes.includes('optimization')) {
      optimizationOpportunities.push(...findOptimizations(relativeFilePath, code));
    }

    // Test coverage gaps
    if (analysisTypes.includes('test-coverage')) {
      testCoverageGaps.push(...analyzeTestCoverage(relativeFilePath, code));
    }
  }


  // Generate summary
  const criticalIssues = performanceIssues.filter(i => i.severity === 'critical').length +
                         typeSafetyIssues.filter(i => i.severity === 'high').length;
  
  const highPriorityIssues = performanceIssues.filter(i => i.severity === 'high').length +
                             typeSafetyIssues.filter(i => i.severity === 'high').length +
                             testCoverageGaps.filter(i => i.priority === 'high').length;

  const totalIssues = performanceIssues.length + typeSafetyIssues.length +
                      optimizationOpportunities.length + testCoverageGaps.length;

  const topRecommendations = generateTopRecommendations(
    performanceIssues,
    typeSafetyIssues,
    optimizationOpportunities,
    testCoverageGaps
  );

  const result: CouncilAnalysisResult = {
    timestamp: new Date().toISOString(),
    filesAnalyzed,
    performanceIssues,
    typeSafetyIssues,
    optimizationOpportunities,
    testCoverageGaps,
    summary: {
      criticalIssues,
      highPriorityIssues,
      totalIssues,
      topRecommendations,
    },
  };

  // Save results
  fs.mkdirSync(outputDir, { recursive: true });
  await saveAnalysisResults(result, outputDir);

  // Print summary
  printSummary(result);

  return result;
}

/**
 * Analyze code for performance bottlenecks
 */
function analyzePerformance(file: string, code: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  // Detect nested loops (O(n²) complexity)
  const nestedLoopPattern = /\.forEach\([^)]+\{[^}]*\.forEach\(/g;
  const nestedForPattern = /for\s*\([^)]+\)\s*\{[^}]*for\s*\(/g;
  
  if (nestedLoopPattern.test(code) || nestedForPattern.test(code)) {
    issues.push({
      type: 'performance',
      file,
      function: extractFunctionName(code, 'forEach'),
      issue: 'Nested loops detected (O(n²) complexity)',
      severity: 'high',
      impact: 'Performance degrades significantly with large datasets',
      recommendation: 'Use Map or Set for O(1) lookups instead of nested loops',
      codeExample: '// Use Map for O(1) lookups\nconst map = new Map(items.map(i => [i.key, i]));\nresults.forEach(r => { const item = map.get(r.key); });',
      estimatedImpact: 'Can reduce time complexity from O(n²) to O(n)',
    });
  }

  // Detect synchronous blocking operations
  if (code.includes('readFileSync') || code.includes('readdirSync')) {
    issues.push({
      type: 'performance',
      file,
      function: 'File I/O',
      issue: 'Synchronous file operations detected',
      severity: 'medium',
      impact: 'Blocks event loop, reduces responsiveness',
      recommendation: 'Use async file operations (readFile, readdir)',
      codeExample: 'const content = await fs.promises.readFile(path, "utf-8");',
    });
  }

  // Detect large iterations without streaming
  if (/\.forEach\([^)]*\{[^}]{200,}\}/.test(code)) {
    issues.push({
      type: 'performance',
      file,
      function: extractFunctionName(code, 'forEach'),
      issue: 'Large iteration with complex operations',
      severity: 'medium',
      impact: 'May cause memory spikes and slow execution',
      recommendation: 'Consider processing in batches or using streams',
    });
  }

  // Detect repeated calculations in loops
  if (/\.map\([^)]*\{[^}]*\.reduce\(/.test(code) || /\.filter\([^)]*\{[^}]*\.filter\(/.test(code)) {
    issues.push({
      type: 'performance',
      file,
      function: extractFunctionName(code, 'map'),
      issue: 'Chained array operations (may recalculate)',
      severity: 'low',
      impact: 'Multiple passes over array',
      recommendation: 'Combine operations into single reduce or use intermediate variables',
      codeExample: '// Instead of .filter().map()\nconst result = items.reduce((acc, item) => {\n  if (condition) acc.push(transform(item));\n  return acc;\n}, []);',
    });
  }

  // Detect missing caching for expensive operations
  if (code.includes('calculateBlueOceanScore') && !code.includes('memo') && !code.includes('cache')) {
    issues.push({
      type: 'performance',
      file,
      function: 'Scoring algorithms',
      issue: 'Expensive calculations without caching',
      severity: 'medium',
      impact: 'Redundant computations slow down analysis',
      recommendation: 'Add memoization for frequently called calculations',
      codeExample: 'const scoreCache = new Map();\nfunction getCachedScore(repo) {\n  if (!scoreCache.has(repo.id)) {\n    scoreCache.set(repo.id, calculateScore(repo));\n  }\n  return scoreCache.get(repo.id);\n}',
    });
  }

  return issues;
}

/**
 * Analyze code for type safety issues
 */
function analyzeTypeSafety(file: string, code: string): TypeSafetyIssue[] {
  const issues: TypeSafetyIssue[] = [];

  // Detect 'any' types
  const anyMatches = code.match(/:\s*any\b/g);
  if (anyMatches && anyMatches.length > 0) {
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (/:\s*any\b/.test(line)) {
        issues.push({
          type: 'type-safety',
          file,
          line: index + 1,
          issue: `Use of 'any' type bypasses type checking`,
          severity: 'high',
          recommendation: 'Define proper interface or use unknown type with type guards',
          codeExample: '// Instead of: function process(data: any)\ninterface ProcessData { id: string; value: number; }\nfunction process(data: ProcessData) { ... }',
        });
      }
    });
  }

  // Detect missing return types
  const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+\w+\([^)]*\)\s*\{/g;
  const matches = code.matchAll(functionPattern);
  
  for (const match of matches) {
    const beforeFunction = code.slice(Math.max(0, match.index! - 50), match.index);
    if (!beforeFunction.includes(':')) {
      issues.push({
        type: 'type-safety',
        file,
        issue: `Function without explicit return type: ${match[0].slice(0, 50)}`,
        severity: 'medium',
        recommendation: 'Add explicit return type annotation',
        codeExample: 'function calculate(...): ResultType { ... }',
      });
    }
  }

  // Detect unsafe property access
  if (/\w+\.\w+\.\w+/.test(code) && !code.includes('?.') && code.includes('undefined')) {
    issues.push({
      type: 'type-safety',
      file,
      issue: 'Nested property access without optional chaining',
      severity: 'medium',
      recommendation: 'Use optional chaining (?.) for nested property access',
      codeExample: 'const value = obj?.prop?.nested ?? defaultValue;',
    });
  }

  // Detect implicit any in destructuring
  if (/const\s*\{\s*\w+\s*\}\s*=/.test(code) && !code.includes(': {')) {
    issues.push({
      type: 'type-safety',
      file,
      issue: 'Destructuring without type annotation',
      severity: 'low',
      recommendation: 'Add type annotation to destructured variables',
      codeExample: 'const { id, name }: User = user;',
    });
  }

  return issues;
}

/**
 * Find optimization opportunities
 */
function findOptimizations(file: string, code: string): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  // Detect repeated calculations
  if (/repo\.forks\s*\/\s*repo\.stars/g.test(code)) {
    const matches = code.match(/repo\.forks\s*\/\s*repo\.stars/g);
    if (matches && matches.length > 1) {
      opportunities.push({
        type: 'optimization',
        file,
        function: 'Repository analysis',
        issue: 'Repeated forkRatio calculation',
        recommendation: 'Calculate once and store result',
        codeExample: 'const reposWithRatio = repos.map(r => ({ ...r, forkRatio: r.forks / r.stars }));',
        benefit: 'Reduces redundant division operations',
      });
    }
  }

  // Detect filter + map chain
  if (/\.filter\([^)]+\)\.map\(/g.test(code)) {
    opportunities.push({
      type: 'optimization',
      file,
      function: extractFunctionName(code, 'filter'),
      issue: 'Separate filter and map operations',
      recommendation: 'Combine into single reduce operation',
      codeExample: 'const result = items.reduce((acc, item) => {\n  if (condition(item)) acc.push(transform(item));\n  return acc;\n}, []);',
      benefit: 'Single pass instead of two, reduces intermediate array allocation',
    });
  }

  // Detect multiple array iterations
  const arrayMethodPattern = /\.(filter|map|reduce|forEach|find|some|every)\(/g;
  const arrayMatches = code.match(arrayMethodPattern);
  if (arrayMatches && arrayMatches.length > 3) {
    opportunities.push({
      type: 'optimization',
      file,
      function: 'Array processing',
      issue: `Multiple array iterations (${arrayMatches.length} operations)`,
      recommendation: 'Consider combining operations or using intermediate variables',
      benefit: 'Reduces passes over the array',
    });
  }

  // Detect missing React.useMemo in React files
  if (file.includes('components') && code.includes('const ') && /=\s*\w+\.map\(/.test(code) && !code.includes('useMemo')) {
    opportunities.push({
      type: 'optimization',
      file,
      function: 'React component',
      issue: 'Expensive computation without useMemo',
      recommendation: 'Wrap expensive computations in useMemo',
      codeExample: 'const results = useMemo(() => items.map(transform), [items]);',
      benefit: 'Prevents unnecessary recalculation on re-renders',
    });
  }

  // Detect array creation in loops
  if (/for\s*\([^)]+\)\s*\{[^}]*new Array/.test(code) || /forEach[^}]*new Array/.test(code)) {
    opportunities.push({
      type: 'optimization',
      file,
      function: 'Array creation',
      issue: 'Creating arrays inside loops',
      recommendation: 'Pre-allocate arrays or use array builder pattern',
      benefit: 'Reduces memory allocations',
    });
  }

  return opportunities;
}

/**
 * Analyze test coverage gaps
 */
function analyzeTestCoverage(file: string, code: string): TestCoverageGap[] {
  const gaps: TestCoverageGap[] = [];

  // Check if test file exists
  const testFile = file.replace('.ts', '.test.ts');
  const testPath = path.join(process.cwd(), testFile);
  
  if (!fs.existsSync(testPath)) {
    // Extract exported functions
    const exportedFunctions = code.match(/export\s+(?:async\s+)?function\s+(\w+)/g);
    
    if (exportedFunctions && exportedFunctions.length > 0) {
      gaps.push({
        type: 'test-coverage',
        file,
        function: 'All exported functions',
        issue: `No test file found (${exportedFunctions.length} exported functions)`,
        priority: 'high',
        complexity: exportedFunctions.length * 2,
        recommendation: `Create ${testFile} with tests for all exported functions`,
        testExample: 'describe("ModuleName", () => {\n  test("functionName", () => {\n    expect(functionName()).toBe(expected);\n  });\n});',
      });
    }
  }

  // Detect error handling without tests
  if ((code.includes('try {') || code.includes('catch')) && !code.includes('.test.')) {
    gaps.push({
      type: 'test-coverage',
      file,
      function: 'Error handling',
      issue: 'Error paths may not be tested',
      priority: 'high',
      complexity: 3,
      recommendation: 'Add tests for error cases and edge conditions',
      testExample: 'test("handles errors gracefully", async () => {\n  await expect(functionWithError()).rejects.toThrow();\n});',
    });
  }

  // Detect complex logic (high cyclomatic complexity)
  const ifStatements = (code.match(/if\s*\(/g) || []).length;
  const switches = (code.match(/switch\s*\(/g) || []).length;
  const ternaries = (code.match(/\?[^?]*:/g) || []).length;
  const complexity = ifStatements + switches * 2 + ternaries;

  if (complexity > 10) {
    gaps.push({
      type: 'test-coverage',
      file,
      function: 'Complex conditional logic',
      issue: `High cyclomatic complexity (${complexity} decision points)`,
      priority: 'medium',
      complexity,
      recommendation: 'Add comprehensive tests covering all branches',
      testExample: 'test.each([\n  [input1, expected1],\n  [input2, expected2],\n])("handles case %p", (input, expected) => {\n  expect(func(input)).toBe(expected);\n});',
    });
  }

  // Detect algorithms without performance tests
  if (file.includes('algorithm') || code.includes('calculate') || code.includes('Score')) {
    gaps.push({
      type: 'test-coverage',
      file,
      function: 'Algorithm performance',
      issue: 'Algorithm may lack performance tests',
      priority: 'medium',
      complexity: 2,
      recommendation: 'Add performance benchmarks for algorithms',
      testExample: 'test("performs efficiently with large dataset", () => {\n  const largeData = Array(10000).fill(0).map(createItem);\n  const start = Date.now();\n  algorithm(largeData);\n  const duration = Date.now() - start;\n  expect(duration).toBeLessThan(1000); // Should complete in <1s\n});',
    });
  }

  return gaps;
}

/**
 * Generate top recommendations based on all findings
 */
function generateTopRecommendations(
  performance: PerformanceIssue[],
  typeSafety: TypeSafetyIssue[],
  optimizations: OptimizationOpportunity[],
  testGaps: TestCoverageGap[]
): string[] {
  const recommendations: string[] = [];

  // Critical performance issues
  const criticalPerf = performance.filter(i => i.severity === 'critical');
  if (criticalPerf.length > 0) {
    recommendations.push(`🚨 Fix ${criticalPerf.length} critical performance bottleneck(s)`);
  }

  // High severity type safety
  const highTypeSafety = typeSafety.filter(i => i.severity === 'high');
  if (highTypeSafety.length > 0) {
    recommendations.push(`🔒 Replace ${highTypeSafety.length} 'any' type(s) with proper interfaces`);
  }

  // O(n²) complexity issues
  const nestedLoops = performance.filter(i => i.issue.includes('nested'));
  if (nestedLoops.length > 0) {
    recommendations.push(`⚡ Optimize ${nestedLoops.length} O(n²) algorithm(s) to O(n) with Map/Set`);
  }

  // Missing tests
  const highPriorityTests = testGaps.filter(i => i.priority === 'high');
  if (highPriorityTests.length > 0) {
    recommendations.push(`🧪 Add test coverage for ${highPriorityTests.length} untested module(s)`);
  }

  // Easy optimization wins
  if (optimizations.length > 0) {
    recommendations.push(`🎯 Apply ${Math.min(5, optimizations.length)} quick optimization(s)`);
  }

  // If no critical issues, focus on incremental improvements
  if (recommendations.length === 0) {
    recommendations.push('✅ No critical issues found - focus on incremental improvements');
  }

  return recommendations.slice(0, 5);
}

/**
 * Save analysis results to files
 */
async function saveAnalysisResults(result: CouncilAnalysisResult, outputDir: string): Promise<void> {
  // Save JSON reports
  fs.writeFileSync(
    path.join(outputDir, 'performance-bottlenecks.json'),
    JSON.stringify(result.performanceIssues, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'type-safety-issues.json'),
    JSON.stringify(result.typeSafetyIssues, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'optimization-opportunities.json'),
    JSON.stringify(result.optimizationOpportunities, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'test-coverage-gaps.json'),
    JSON.stringify(result.testCoverageGaps, null, 2)
  );

  // Save comprehensive markdown report
  const report = generateMarkdownReport(result);
  const reportDir = path.join(process.cwd(), 'data', 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'council-code-analysis.md'),
    report
  );
}

/**
 * Generate comprehensive markdown report
 */
function generateMarkdownReport(result: CouncilAnalysisResult): string {
  let md = '# Council Code Analysis Report\n\n';
  md += `*Generated: ${new Date(result.timestamp).toLocaleString()}*\n\n`;
  md += `**Files Analyzed:** ${result.filesAnalyzed}\n\n`;
  md += '---\n\n';

  // Executive Summary
  md += '## Executive Summary\n\n';
  md += `- **Total Issues Found:** ${result.summary.totalIssues}\n`;
  md += `- **Critical Issues:** ${result.summary.criticalIssues}\n`;
  md += `- **High Priority Issues:** ${result.summary.highPriorityIssues}\n\n`;
  
  md += '### Top Recommendations\n\n';
  result.summary.topRecommendations.forEach((rec, i) => {
    md += `${i + 1}. ${rec}\n`;
  });
  md += '\n---\n\n';

  // Performance Issues
  if (result.performanceIssues.length > 0) {
    md += '## 🚀 Performance Issues\n\n';
    result.performanceIssues.forEach((issue, i) => {
      md += `### ${i + 1}. ${issue.issue}\n\n`;
      md += `**File:** \`${issue.file}\`\n`;
      md += `**Function:** ${issue.function}\n`;
      md += `**Severity:** ${issue.severity.toUpperCase()}\n`;
      md += `**Impact:** ${issue.impact}\n\n`;
      md += `**Recommendation:**\n${issue.recommendation}\n\n`;
      if (issue.codeExample) {
        md += '**Code Example:**\n```typescript\n' + issue.codeExample + '\n```\n\n';
      }
      if (issue.estimatedImpact) {
        md += `*Estimated Impact: ${issue.estimatedImpact}*\n\n`;
      }
      md += '---\n\n';
    });
  }

  // Type Safety Issues
  if (result.typeSafetyIssues.length > 0) {
    md += '## 🔒 Type Safety Issues\n\n';
    result.typeSafetyIssues.forEach((issue, i) => {
      md += `### ${i + 1}. ${issue.issue}\n\n`;
      md += `**File:** \`${issue.file}\`\n`;
      if (issue.line) {
        md += `**Line:** ${issue.line}\n`;
      }
      md += `**Severity:** ${issue.severity.toUpperCase()}\n\n`;
      md += `**Recommendation:**\n${issue.recommendation}\n\n`;
      if (issue.codeExample) {
        md += '**Code Example:**\n```typescript\n' + issue.codeExample + '\n```\n\n';
      }
      md += '---\n\n';
    });
  }

  // Optimization Opportunities
  if (result.optimizationOpportunities.length > 0) {
    md += '## ⚡ Optimization Opportunities\n\n';
    result.optimizationOpportunities.forEach((opp, i) => {
      md += `### ${i + 1}. ${opp.issue}\n\n`;
      md += `**File:** \`${opp.file}\`\n`;
      md += `**Function:** ${opp.function}\n`;
      md += `**Benefit:** ${opp.benefit}\n\n`;
      md += `**Recommendation:**\n${opp.recommendation}\n\n`;
      if (opp.codeExample) {
        md += '**Code Example:**\n```typescript\n' + opp.codeExample + '\n```\n\n';
      }
      md += '---\n\n';
    });
  }

  // Test Coverage Gaps
  if (result.testCoverageGaps.length > 0) {
    md += '## 🧪 Test Coverage Gaps\n\n';
    result.testCoverageGaps.forEach((gap, i) => {
      md += `### ${i + 1}. ${gap.issue}\n\n`;
      md += `**File:** \`${gap.file}\`\n`;
      md += `**Function:** ${gap.function}\n`;
      md += `**Priority:** ${gap.priority.toUpperCase()}\n`;
      md += `**Complexity:** ${gap.complexity}/10\n\n`;
      md += `**Recommendation:**\n${gap.recommendation}\n\n`;
      if (gap.testExample) {
        md += '**Test Example:**\n```typescript\n' + gap.testExample + '\n```\n\n';
      }
      md += '---\n\n';
    });
  }

  // Implementation Roadmap
  md += '## 📋 Implementation Roadmap\n\n';
  md += '### Immediate (This Week)\n\n';
  md += '- Fix critical performance bottlenecks\n';
  md += '- Replace high-severity any types\n';
  md += '- Add tests for untested critical paths\n\n';
  
  md += '### Short-term (This Month)\n\n';
  md += '- Apply quick optimization wins\n';
  md += '- Improve type safety across modules\n';
  md += '- Expand test coverage to 80%+\n\n';
  
  md += '### Long-term (This Quarter)\n\n';
  md += '- Refactor O(n²) algorithms\n';
  md += '- Add comprehensive integration tests\n';
  md += '- Performance profiling and benchmarks\n\n';

  md += '---\n\n';
  md += '*Generated by Council Code Analyzer V2*\n';

  return md;
}

/**
 * Print summary to console
 */
function printSummary(result: CouncilAnalysisResult): void {
  // Silent in production
}

/**
 * Extract function name from code context
 */
function extractFunctionName(code: string, keyword: string): string {
  const pattern = new RegExp(`function\\s+(\\w+)[^{]*${keyword}`, 'i');
  const match = code.match(pattern);
  return match ? match[1] : 'unknown';
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const config: AnalysisConfig = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      config.targetFiles = [args[i + 1]];
      i++;
    } else if (args[i] === '--focus' && args[i + 1]) {
      config.analysisTypes = [args[i + 1] as any];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Council Code Analyzer V2

Usage:
  npx tsx src/lib/self-improve-v2.ts [options]

Options:
  --file <filename>    Analyze specific file
  --focus <type>       Focus on specific analysis type
                       (performance, type-safety, optimization, test-coverage)
  --help, -h          Show this help

Examples:
  npx tsx src/lib/self-improve-v2.ts
  npx tsx src/lib/self-improve-v2.ts --file scout.ts
  npx tsx src/lib/self-improve-v2.ts --focus performance
      `);
      process.exit(0);
    }
  }

  analyzeCouncilCode(config)
    .then(() => {
            process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}
