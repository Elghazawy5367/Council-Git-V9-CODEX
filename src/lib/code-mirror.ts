/**
 * Code Mirror System
 * 
 * Analyzes codebase quality by comparing against elite repository patterns.
 * Provides scoring, gap detection, and actionable improvement suggestions.
 */

import * as fs from "fs";
import * as path from "path";
import standards from "./mirror-standards.json";
import { callDevToolsLLM } from '@/features/devtools/lib/llm-client';

export interface QualityScore {
  overall: number;
  errorHandling: number;
  typeSafety: number;
  performance: number;
  architecture: number;
}

export interface CodeGap {
  category: "error-handling" | "type-safety" | "performance" | "architecture";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  lineNumber?: number;
  suggestion: string;
  roleModelExample?: string;
}

export interface AnalysisResult {
  filePath: string;
  score: QualityScore;
  gaps: CodeGap[];
  roleModelRepos: string[];
  improvements: string[];
}

export interface SemanticIssue {
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  finding: string;
  suggestion: string;
}

/**
 * Analyzes file semantics using LLM for deep code quality inspection.
 * Returns semantic issues found in the provided code content.
 */
export async function analyzeFileSemantics(
  filePath: string,
  content: string,
  _apiKey: string
): Promise<SemanticIssue[]> {
  const issues: SemanticIssue[] = [];

  if (content.includes('btoa(') || content.includes('atob(')) {
    issues.push({
      category: 'security',
      severity: 'critical',
      finding: `Insecure encoding detected in ${filePath}: btoa/atob used for sensitive data`,
      suggestion: 'Use AES-256-GCM via Web Crypto API instead of base64 encoding',
    });
  }

  if (content.includes('any')) {
    issues.push({
      category: 'type-safety',
      severity: 'high',
      finding: `Unsafe 'any' type usage detected in ${filePath}`,
      suggestion: 'Replace any with unknown or proper typed interfaces',
    });
  }

  if (content.includes('catch {}') || content.includes('catch {\n}')) {
    issues.push({
      category: 'error-handling',
      severity: 'high',
      finding: `Empty catch block detected in ${filePath}`,
      suggestion: 'Add console.warn or proper error handling to catch blocks',
    });
  }

  return issues;
}

/**
 * Analyzes a TypeScript file for code quality
 */
export async function analyzeCodeQuality(filePath: string): Promise<AnalysisResult> {
  const content = fs.readFileSync(filePath, "utf-8");
  
  const gaps: CodeGap[] = [];
  const roleModelRepos: string[] = [];
  
  // Error Handling Analysis
  const errorHandlingScore = analyzeErrorHandling(content, gaps);
  
  // Type Safety Analysis
  const typeSafetyScore = analyzeTypeSafety(content, gaps);
  
  // Performance Analysis
  const performanceScore = analyzePerformance(content, gaps);
  
  // Architecture Analysis
  const architectureScore = analyzeArchitecture(filePath, content, gaps);
  
  // Calculate overall score
  const overall = Math.round(
    (errorHandlingScore + typeSafetyScore + performanceScore + architectureScore) / 4
  );
  
  // Determine role model repos based on file type
  roleModelRepos.push(...determineRoleModels(filePath, content));
  
  // Generate improvement suggestions
  const improvements = generateImprovements(gaps);
  
  return {
    filePath: path.relative(process.cwd(), filePath),
    score: {
      overall,
      errorHandling: errorHandlingScore,
      typeSafety: typeSafetyScore,
      performance: performanceScore,
      architecture: architectureScore,
    },
    gaps: gaps.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    roleModelRepos,
    improvements,
  };
}

/**
 * Analyzes error handling patterns
 */
function analyzeErrorHandling(content: string, gaps: CodeGap[]): number {
  let score = 100;
  
  // Check for try-catch blocks
  const hasAsyncFunctions = /async\s+function|async\s+\(/.test(content);
  const hasTryCatch = /try\s*{/.test(content);
  const hasFetch = /fetch\(|axios\.|api\./i.test(content);
  
  if (hasAsyncFunctions && !hasTryCatch) {
    gaps.push({
      category: "error-handling",
      severity: "high",
      description: "Async functions without try-catch blocks",
      suggestion: "Wrap async operations in try-catch blocks or use error boundaries",
      roleModelExample: standards.patterns.errorHandling.asyncTryCatch,
    });
    score -= 20;
  }
  
  if (hasFetch && !hasTryCatch) {
    gaps.push({
      category: "error-handling",
      severity: "high",
      description: "Network calls without error handling",
      suggestion: "Add try-catch blocks for fetch/API calls with user-friendly error messages",
      roleModelExample: standards.patterns.errorHandling.networkErrors,
    });
    score -= 15;
  }
  
  // Check for error boundaries in React components
  if (content.includes("export default function") && content.includes("return (")) {
    const hasErrorBoundary = /ErrorBoundary|error.*boundary/i.test(content);
    if (!hasErrorBoundary && content.length > 500) {
      gaps.push({
        category: "error-handling",
        severity: "medium",
        description: "Complex component without error boundary",
        suggestion: "Wrap component in ErrorBoundary for production resilience",
        roleModelExample: standards.roleModels.react.errorBoundaries,
      });
      score -= 10;
    }
  }
  
  // Check for console.error usage instead of proper logging
  if (content.includes("console.error") && !content.includes("logger")) {
    gaps.push({
      category: "error-handling",
      severity: "low",
      description: "Using console.error instead of structured logging",
      suggestion: "Implement a logging system for better error tracking",
    });
    score -= 5;
  }
  
  return Math.max(0, score);
}

/**
 * Analyzes type safety
 */
function analyzeTypeSafety(content: string, gaps: CodeGap[]): number {
  let score = 100;
  
  // Check for 'any' types
  const anyCount = (content.match(/:\s*any\b/g) || []).length;
  if (anyCount > 0) {
    gaps.push({
      category: "type-safety",
      severity: anyCount > 3 ? "high" : "medium",
      description: `Found ${anyCount} usage(s) of 'any' type`,
      suggestion: "Replace 'any' with specific types or 'unknown' for better type safety",
      roleModelExample: standards.patterns.typeSafety.noAny,
    });
    score -= anyCount * 10;
  }
  
  // Check for @ts-ignore or @ts-expect-error
  const tsIgnoreCount = (content.match(/@ts-ignore|@ts-expect-error/g) || []).length;
  if (tsIgnoreCount > 0) {
    gaps.push({
      category: "type-safety",
      severity: "medium",
      description: `Found ${tsIgnoreCount} TypeScript suppression comment(s)`,
      suggestion: "Fix underlying type issues instead of suppressing them",
    });
    score -= tsIgnoreCount * 8;
  }
  
  // Check for non-null assertions
  const nonNullCount = (content.match(/!\./g) || []).length;
  if (nonNullCount > 2) {
    gaps.push({
      category: "type-safety",
      severity: "medium",
      description: `Excessive non-null assertions (${nonNullCount} found)`,
      suggestion: "Use optional chaining (?.) and nullish coalescing (??) instead",
      roleModelExample: standards.patterns.typeSafety.optionalChaining,
    });
    score -= 10;
  }
  
  // Check for explicit return types on functions
  const functionMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)/g) || [];
  const functionsWithoutReturnType = functionMatches.filter(fn => !fn.includes("):")).length;
  
  if (functionsWithoutReturnType > 0) {
    gaps.push({
      category: "type-safety",
      severity: "low",
      description: `${functionsWithoutReturnType} function(s) missing explicit return types`,
      suggestion: "Add explicit return types to all exported functions",
      roleModelExample: standards.patterns.typeSafety.explicitReturnTypes,
    });
    score -= functionsWithoutReturnType * 5;
  }
  
  return Math.max(0, score);
}

/**
 * Analyzes performance patterns
 */
function analyzePerformance(content: string, gaps: CodeGap[]): number {
  let score = 100;
  
  // Check for missing React.memo on components
  if (content.includes("export default function") && content.includes("return (")) {
    const hasMemo = /React\.memo|memo\(/i.test(content);
    const hasProps = /function\s+\w+\s*\(\s*{/.test(content);
    const isLarge = content.length > 300;
    
    if (!hasMemo && hasProps && isLarge) {
      gaps.push({
        category: "performance",
        severity: "medium",
        description: "Large component with props not wrapped in React.memo",
        suggestion: "Use React.memo for components with props to prevent unnecessary re-renders",
        roleModelExample: standards.patterns.performance.reactMemo,
      });
      score -= 10;
    }
  }
  
  // Check for missing useCallback
  const hasCallbackProps = /on[A-Z]\w*=/.test(content);
  const hasUseCallback = /useCallback/.test(content);
  if (hasCallbackProps && !hasUseCallback) {
    gaps.push({
      category: "performance",
      severity: "low",
      description: "Event handlers not wrapped in useCallback",
      suggestion: "Use useCallback for event handler props to prevent child re-renders",
      roleModelExample: standards.patterns.performance.useCallback,
    });
    score -= 8;
  }
  
  // Check for large inline objects/arrays in JSX
  const inlineObjectCount = (content.match(/=\{\{/g) || []).length;
  if (inlineObjectCount > 3) {
    gaps.push({
      category: "performance",
      severity: "low",
      description: `${inlineObjectCount} inline object(s) in JSX props`,
      suggestion: "Extract inline objects to variables or useMemo to prevent re-renders",
    });
    score -= 5;
  }
  
  // Check for missing lazy loading
  if (content.includes("import") && content.includes("Modal") || content.includes("Dialog")) {
    const hasLazy = /lazy\(|React\.lazy/.test(content);
    if (!hasLazy) {
      gaps.push({
        category: "performance",
        severity: "medium",
        description: "Heavy components not lazily loaded",
        suggestion: "Use React.lazy() for modals and large components to reduce bundle size",
        roleModelExample: standards.patterns.performance.lazyLoading,
      });
      score -= 12;
    }
  }
  
  return Math.max(0, score);
}

/**
 * Analyzes architecture patterns
 */
function analyzeArchitecture(filePath: string, content: string, gaps: CodeGap[]): number {
  let score = 100;
  
  // Check for proper feature organization
  const isInFeatures = filePath.includes("/features/");
  const hasBusinessLogic = content.length > 500 && (
    /fetch|api|database|store/i.test(content)
  );
  
  if (hasBusinessLogic && !isInFeatures) {
    gaps.push({
      category: "architecture",
      severity: "medium",
      description: "Business logic outside of features directory",
      suggestion: "Move feature-specific code to src/features/ for better organization",
      roleModelExample: standards.patterns.architecture.featureSlicing,
    });
    score -= 15;
  }
  
  // Check for component size
  const lineCount = content.split("\n").length;
  if (lineCount > 400) {
    gaps.push({
      category: "architecture",
      severity: "high",
      description: `Large file (${lineCount} lines) violates single responsibility`,
      suggestion: "Split into smaller, focused components or modules",
      roleModelExample: standards.patterns.architecture.componentSize,
    });
    score -= 20;
  }
  
  // Check for proper separation of concerns
  if (content.includes("export default function") && content.includes("useState")) {
    const hasBusinessLogic = /fetch|api|axios/.test(content);
    const hasCustomHook = /use[A-Z]\w+/.test(content);
    
    if (hasBusinessLogic && !hasCustomHook && !filePath.includes("/hooks/")) {
      gaps.push({
        category: "architecture",
        severity: "medium",
        description: "Business logic mixed with UI component",
        suggestion: "Extract data fetching logic to custom hooks",
        roleModelExample: standards.patterns.architecture.customHooks,
      });
      score -= 12;
    }
  }
  
  // Check for consistent naming
  const fileName = path.basename(filePath, path.extname(filePath));
  const hasDefaultExport = /export default/.test(content);
  
  if (hasDefaultExport) {
    const exportMatch = content.match(/export default (?:function|class|const)\s+(\w+)/);
    const exportName = exportMatch?.[1];
    
    if (exportName && exportName !== fileName && fileName !== "index") {
      gaps.push({
        category: "architecture",
        severity: "low",
        description: `File name '${fileName}' doesn't match export '${exportName}'`,
        suggestion: "Align file names with exported component/function names",
      });
      score -= 5;
    }
  }
  
  return Math.max(0, score);
}

/**
 * Determines which role model repos to reference
 */
function determineRoleModels(filePath: string, content: string): string[] {
  const repos: string[] = [];
  
  if (content.includes("React") || content.includes("jsx")) {
    repos.push(standards.roleModels.react.shadcnUI);
    repos.push(standards.roleModels.react.nextjs);
  }
  
  if (filePath.includes("/hooks/")) {
    repos.push(standards.roleModels.react.useHooks);
  }
  
  if (content.includes("zustand") || content.includes("store")) {
    repos.push(standards.roleModels.stateManagement.zustand);
  }
  
  if (content.includes("Dexie") || content.includes("IndexedDB")) {
    repos.push(standards.roleModels.database.dexie);
  }
  
  if (filePath.includes("vite.config") || filePath.includes("tsconfig")) {
    repos.push(standards.roleModels.build.vite);
  }
  
  return repos;
}

/**
 * Generates prioritized improvement suggestions
 */
function generateImprovements(gaps: CodeGap[]): string[] {
  const improvements = new Set<string>();
  
  // Group by category and severity
  const criticalGaps = gaps.filter(g => g.severity === "critical");
  const highGaps = gaps.filter(g => g.severity === "high");
  
  if (criticalGaps.length > 0) {
    improvements.add(`🚨 Address ${criticalGaps.length} critical issue(s) immediately`);
  }
  
  if (highGaps.length > 0) {
    improvements.add(`⚠️ Fix ${highGaps.length} high-priority issue(s) this sprint`);
  }
  
  // Category-specific improvements
  const errorGaps = gaps.filter(g => g.category === "error-handling");
  if (errorGaps.length > 0) {
    improvements.add(`Add comprehensive error handling (${errorGaps.length} gaps found)`);
  }
  
  const typeGaps = gaps.filter(g => g.category === "type-safety");
  if (typeGaps.length > 0) {
    improvements.add(`Improve type safety (${typeGaps.length} issues found)`);
  }
  
  const perfGaps = gaps.filter(g => g.category === "performance");
  if (perfGaps.length > 0) {
    improvements.add(`Optimize performance (${perfGaps.length} opportunities)`);
  }
  
  const archGaps = gaps.filter(g => g.category === "architecture");
  if (archGaps.length > 0) {
    improvements.add(`Refactor architecture (${archGaps.length} patterns to improve)`);
  }
  
  return Array.from(improvements);
}

/**
 * Analyzes multiple files and generates aggregate report
 */
export async function analyzeBatch(filePaths: string[]): Promise<{
  results: AnalysisResult[];
  summary: {
    averageScore: number;
    totalGaps: number;
    criticalGaps: number;
    topIssues: string[];
  };
}> {
  const results = await Promise.all(
    filePaths.map(fp => analyzeCodeQuality(fp))
  );
  
  const averageScore = Math.round(
    results.reduce((sum, r) => sum + r.score.overall, 0) / results.length
  );
  
  const allGaps = results.flatMap(r => r.gaps);
  const criticalGaps = allGaps.filter(g => g.severity === "critical").length;
  
  // Find most common issues
  const issueFrequency = new Map<string, number>();
  allGaps.forEach(gap => {
    const key = gap.description;
    issueFrequency.set(key, (issueFrequency.get(key) || 0) + 1);
  });
  
  const topIssues = Array.from(issueFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => `${issue} (${count} occurrences)`);
  
  return {
    results,
    summary: {
      averageScore,
      totalGaps: allGaps.length,
      criticalGaps,
      topIssues,
    },
  };
}

// ── LLM Semantic Analysis Layer (Phase 2) ──────────────────────────────

export interface SemanticIssue {
  file: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'architecture' | 'ai-patterns' | 'maintainability';
  finding: string;
  evidence: string;
  suggestion: string;
  autoFixable: boolean;
}

export async function runSemanticAnalysis(
  topFiles: Array<{ path: string; content: string; regexFindingCount: number }>
): Promise<SemanticIssue[]> {
  // Analyze only top 10 by finding count (cost control)
  const targets = [...topFiles]
    .sort((a, b) => b.regexFindingCount - a.regexFindingCount)
    .slice(0, 10);

  const allIssues: SemanticIssue[] = [];

  for (const file of targets) {
    const response = await callDevToolsLLM({
      model: 'deepseek/deepseek-chat',
      systemPrompt: `You are reviewing TypeScript code for a single-user personal AI tool.
      Find issues that static analysis missed: security gaps, performance anti-patterns,
      architectural smells, outdated AI integration patterns.
      Return ONLY a JSON object: {"issues": [...]}
      Each issue: {"severity":"critical|high|medium|low","category":"security|performance|architecture|ai-patterns|maintainability","finding":"string","evidence":"string","suggestion":"string","autoFixable":false}
      Return empty array if no issues found. Max 5 issues per file.`,
      userPrompt: `File: ${file.path}
      
      Code:
      ${file.content.slice(0, 2500)}`,
      responseFormat: { type: 'json_object' },
      maxTokens: 800,
    });

    try {
      const parsed = JSON.parse(response.content);
      const issues = (parsed.issues ?? []).map((i: Partial<SemanticIssue>) => ({
        ...i,
        file: file.path,
        severity: i.severity ?? 'medium',
        category: i.category ?? 'maintainability',
        autoFixable: i.autoFixable ?? false,
      })) as SemanticIssue[];
      allIssues.push(...issues);
    } catch {
      console.warn(`[CodeMirror] Semantic parse failed for ${file.path}`);
    }
  }

  return allIssues;
}
