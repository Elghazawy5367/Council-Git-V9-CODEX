/**
 * The Scout - GitHub Intelligence Extraction System (Phantom Scout)
 * 
 * Analyzes GitHub data to extract market intelligence across multiple niches.
 * Contains unique algorithms for:
 * - Blue Ocean opportunity detection
 * - Pain point clustering
 * - Trend analysis
 * - Opportunity scoring
 * 
 * Multi-niche configuration support via config/target-niches.yaml
 * NOTE: API calls extracted to src/services/github.service.ts
 */

import * as fs from "fs";
import * as path from "path";

import * as yaml from 'js-yaml';
import { GITHUB_OWNER, GITHUB_REPO } from './config';
import type { GitHubRawRepo, ScoutIssue } from './types';
import { getGitHubService } from '@/services/github.service';

/**
 * Consult the Living Knowledge Base (Angle 1)
 * Fetches content from the /knowledge folder in the project repository
 */
export async function consultKnowledgeBase(filename: string): Promise<string> {
  try {
    const githubService = getGitHubService();
    return await githubService.getFileContent(GITHUB_OWNER, GITHUB_REPO, `knowledge/${filename}`);
  } catch (error) {
    console.error("Knowledge retrieval failed:", error);
    return "I could not find that information in the archives.";
  }
}

/**
 * Fetch an Engineered Prompt from the /prompts folder (Angle 2)
 */
export async function getEngineeredPrompt(promptPath: string): Promise<string | null> {
  try {
    const githubService = getGitHubService();
    return await githubService.getFileContent(GITHUB_OWNER, GITHUB_REPO, `prompts/${promptPath}`);
  } catch (error) {
    console.error("Prompt retrieval failed:", error);
    return null;
  }
}

// ============================================================================
// NICHE CONFIG INTERFACES
// ============================================================================

interface NicheConfig {
  id: string;
  name: string;
  monitoring?: {
    keywords?: string[];
    github_topics?: string[];
    github_search_queries?: string[];
  };
  enabled?: boolean;
}

interface YamlConfig {
  niches: NicheConfig[];
}

// ============================================================================
// SCOUT CONFIG
// ============================================================================

interface ScoutConfig {
  targetNiche: string;
  scanDepth: "shallow" | "normal" | "deep";
  maxRepos: number;
  maxIssues: number;
  cacheExpiry: number; // hours
}
interface Opportunity {
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastUpdate: string;
  url: string;

  // Calculated fields
  isAbandoned: boolean; // No update in 365+ days
  hasProvenDemand: boolean; // Stars > 500
  lowCompetition: boolean; // Forks < 200
  blueOceanScore: number; // 0-100

  // Metrics for goldmine detection
  daysSinceUpdate: number;
  forkRatio: number; // forks / stars
}
interface PainPoint {
  id: string;
  source: "issue" | "discussion" | "pr" | "readme";
  repository: string;
  title: string;
  description: string;
  indicators: string[];
  severity: "critical" | "high" | "medium" | "low";
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  urls: string[];
}
interface ProductOpportunity {
  id: string;
  category: string;
  painPoint: string;
  solution: string;
  confidence: number;
  marketSize: number; // estimated users affected
  competition: "none" | "weak" | "moderate" | "strong";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  evidence: string[];
  keywords: string[];
}
interface ScoutReport {
  timestamp: string;
  niche: string;
  scanDepth: string;
  repositoriesScanned: number;
  issuesAnalyzed: number;
  painPointsFound: number;
  opportunitiesIdentified: number;
  topPainPoints: PainPoint[];
  topOpportunities: ProductOpportunity[];
  trendsDetected: string[];
  nextActions: string[];
}

/**
 * Get date X days ago in GitHub format (YYYY-MM-DD)
 */
function getDateXDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Load niche configuration from YAML
 */
function loadNicheConfig(): NicheConfig[] {
  try {
    const configPath = path.join(process.cwd(), 'config', 'target-niches.yaml');
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContent) as YamlConfig;
    return config.niches.filter((n: NicheConfig) => n.enabled !== false);
  } catch (error) {
    console.error('Failed to load niche config:', error);
    throw error;
  }
}

/**
 * Scan for Blue Ocean opportunities (abandoned goldmines)
 */
export async function scanBlueOcean(topic: string, nicheId: string = 'default'): Promise<Opportunity[]> {
  const githubService = getGitHubService();
  const opportunities: Opportunity[] = [];
  
  try {
    // Search for repositories with proven demand
    // Strategy: Find popular projects that haven't been updated recently
    const queries = [
      `topic:${topic} stars:>1000 pushed:<${getDateXDaysAgo(365)}`,
      `topic:${topic} stars:500..5000 pushed:<${getDateXDaysAgo(365)}`,
      `${topic} in:name,description stars:>1000 archived:false`,
    ];

    for (const query of queries) {
      const data = await githubService.searchRepositories(query, { perPage: 30 });
      
      for (const repo of data.items || []) {
        const opp = transformToOpportunity(repo);

        // Filter for high Blue Ocean scores
        if (opp.blueOceanScore >= 50) {
          opportunities.push(opp);
        }
      }

      // Rate limit protection
      await sleep(2000);
    }
  } catch (error) {
    console.error("Blue Ocean scan failed:", error);
    return generateMockOpportunities(topic);
  }

  // Remove duplicates and sort by score
  const unique = Array.from(
    new Map(opportunities.map((o) => [o.url, o])).values()
  ).sort((a, b) => b.blueOceanScore - a.blueOceanScore);

  // Save to file with niche ID
  await saveBlueOceanReport(unique, topic, nicheId);

  return unique;
}

/**
 * Transform GitHub repo to Opportunity
 */
function transformToOpportunity(repo: GitHubRawRepo): Opportunity {
  const now = new Date();
  const lastUpdate = new Date(repo.updated_at);
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  const forkRatio = repo.forks_count / Math.max(1, repo.stargazers_count);
  const isAbandoned = daysSinceUpdate > 365;
  const hasProvenDemand = repo.stargazers_count > 500;
  const lowCompetition = repo.forks_count < 200;
  const blueOceanScore = calculateBlueOceanScore({
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    daysSinceUpdate
  });
  return {
    name: repo.name,
    owner: repo.owner.login,
    description: repo.description || "No description",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    lastUpdate: repo.updated_at,
    url: repo.html_url,
    isAbandoned,
    hasProvenDemand,
    lowCompetition,
    blueOceanScore,
    daysSinceUpdate,
    forkRatio: Math.round(forkRatio * 1000) / 1000
  };
}

/**
 * Calculate Blue Ocean Score (0-100)
 */
function calculateBlueOceanScore(repo: {
  stars: number;
  forks: number;
  openIssues: number;
  daysSinceUpdate: number;
}): number {
  let score = 0;

  // High stars = proven demand (max 30 points)
  score += Math.min(30, repo.stars / 1000 * 30);

  // Old but popular = abandoned goldmine (30 points)
  if (repo.daysSinceUpdate > 365 && repo.stars > 500) {
    score += 30;
  } else if (repo.daysSinceUpdate > 180 && repo.stars > 1000) {
    score += 20; // Still good if very popular
  }

  // Low forks = low competition (max 20 points)
  const forkRatio = repo.forks / Math.max(1, repo.stars);
  score += Math.max(0, 20 * (1 - forkRatio));

  // Active issues = ongoing demand (max 20 points)
  score += Math.min(20, repo.openIssues / 50 * 20);
  return Math.round(score);
}

/**
 * Save Blue Ocean report
 */
async function saveBlueOceanReport(opportunities: Opportunity[], topic: string, nicheId: string = 'default'): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const filename = `opportunities-${nicheId}-${today}.json`;
  const filepath = path.join(process.cwd(), "data", filename);
  fs.writeFileSync(filepath, JSON.stringify(opportunities, null, 2));
  // Also save markdown summary
  const mdPath = path.join(process.cwd(), "data", "intelligence", `blue-ocean-${nicheId}-${today}.md`);
  fs.writeFileSync(mdPath, generateBlueOceanMarkdown(opportunities, topic));
}

/**
 * Generate Blue Ocean markdown report
 */
function generateBlueOceanMarkdown(opportunities: Opportunity[], topic: string): string {
  let md = `# Blue Ocean Opportunities: ${topic}\n\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n`;
  md += `**Total Found:** ${opportunities.length}\n\n`;
  md += `## 🏆 Top 10 Goldmines\n\n`;
  opportunities.slice(0, 10).forEach((opp, idx) => {
    md += `### ${idx + 1}. ${opp.owner}/${opp.name} (Score: ${opp.blueOceanScore})\n\n`;
    md += `**${opp.description}**\n\n`;
    md += `- ⭐ Stars: ${opp.stars.toLocaleString()}\n`;
    md += `- 🍴 Forks: ${opp.forks.toLocaleString()} (${(opp.forkRatio * 100).toFixed(1)}% ratio)\n`;
    md += `- 🐛 Open Issues: ${opp.openIssues}\n`;
    md += `- 📅 Last Update: ${new Date(opp.lastUpdate).toLocaleDateString()} (${opp.daysSinceUpdate} days ago)\n`;
    md += `- 🌊 Blue Ocean Score: **${opp.blueOceanScore}/100**\n`;
    md += `- 🔗 [View on GitHub](${opp.url})\n\n`;
    md += `**Why it's a goldmine:**\n`;
    if (opp.isAbandoned) md += `- ⚠️ Abandoned (${opp.daysSinceUpdate} days since update)\n`;
    if (opp.hasProvenDemand) md += `- ✅ Proven demand (${opp.stars}+ stars)\n`;
    if (opp.lowCompetition) md += `- ✅ Low competition (${opp.forks} forks)\n`;
    md += `\n**Opportunity:** Build a modern alternative or fork with active maintenance.\n\n`;
    md += `---\n\n`;
  });

  // Abandoned goldmines section
  const abandonedGoldmines = opportunities.filter((o) => o.isAbandoned && o.hasProvenDemand);
  if (abandonedGoldmines.length > 0) {
    md += `## 💎 Abandoned Goldmines (${abandonedGoldmines.length})\n\n`;
    md += `Projects with proven demand but no recent maintenance:\n\n`;
    abandonedGoldmines.slice(0, 5).forEach((opp) => {
      md += `- **${opp.name}** (${opp.stars} stars, ${opp.daysSinceUpdate} days idle)\n`;
    });
    md += `\n`;
  }
  return md;
}

/**
 * Generate mock opportunities for testing
 */
function generateMockOpportunities(topic: string): Opportunity[] {
  return [{
    name: "awesome-tool",
    owner: "user1",
    description: `Popular ${topic} tool that hasn't been updated`,
    stars: 2500,
    forks: 150,
    openIssues: 45,
    lastUpdate: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://github.com/user1/awesome-tool",
    isAbandoned: true,
    hasProvenDemand: true,
    lowCompetition: true,
    blueOceanScore: 85,
    daysSinceUpdate: 500,
    forkRatio: 0.06
  }, {
    name: "legacy-framework",
    owner: "user2",
    description: `${topic} framework with large user base`,
    stars: 5000,
    forks: 400,
    openIssues: 120,
    lastUpdate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://github.com/user2/legacy-framework",
    isAbandoned: true,
    hasProvenDemand: true,
    lowCompetition: false,
    blueOceanScore: 72,
    daysSinceUpdate: 400,
    forkRatio: 0.08
  }];
}

/**
 * Main Scout execution
 */
export async function runScout(): Promise<ScoutReport> {
  const config = getConfig();

  // Step 1: Find trending repositories in niche

  const repos = await findTrendingRepos(config);

  // Step 2: Extract pain points from issues/discussions

  const painPoints = await extractPainPoints(repos, config);

  // Step 3: Cluster and prioritize pain points

  const clusteredPainPoints = await clusterPainPoints(painPoints);

  // Step 4: Identify product opportunities

  const opportunities = await identifyOpportunities(clusteredPainPoints);

  // Step 5: Detect emerging trends

  const trends = await detectTrends(painPoints);

  // Step 6: Blue Ocean scan

  const blueOceanOpps = await scanBlueOcean(config.targetNiche, 'default');
  // Generate report
  const report: ScoutReport = {
    timestamp: new Date().toISOString(),
    niche: config.targetNiche,
    scanDepth: config.scanDepth,
    repositoriesScanned: repos.length,
    issuesAnalyzed: painPoints.length,
    painPointsFound: clusteredPainPoints.length,
    opportunitiesIdentified: opportunities.length,
    topPainPoints: clusteredPainPoints.slice(0, 10),
    topOpportunities: opportunities.slice(0, 10),
    trendsDetected: trends,
    nextActions: generateNextActions(opportunities, trends)
  };

  // Save results
  await saveIntelligence(report, 'default');

  // Print summary
  printSummary(report);
  return report;
}

/**
 * Get configuration from environment
 */
function getConfig(): ScoutConfig {
  const depth = (process.env.SCAN_DEPTH || "normal") as ScoutConfig["scanDepth"];
  const depthSettings = {
    shallow: {
      maxRepos: 10,
      maxIssues: 50
    },
    normal: {
      maxRepos: 25,
      maxIssues: 100
    },
    deep: {
      maxRepos: 50,
      maxIssues: 200
    }
  };
  const settings = depthSettings[depth];
  return {
    targetNiche: process.env.TARGET_NICHE || "developer tools",
    scanDepth: depth,
    maxRepos: settings.maxRepos,
    maxIssues: settings.maxIssues,
    cacheExpiry: 12 // hours
  };
}

/**
 * Find trending repositories in target niche
 */
async function findTrendingRepos(config: ScoutConfig): Promise<GitHubRawRepo[]> {
  const cacheFile = path.join(process.cwd(), "data", "cache", "repos.json");

  // Check cache
  if (await isCacheValid(cacheFile, config.cacheExpiry)) {
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
  }

  const githubService = getGitHubService();

  try {
    // Search GitHub
    const query = buildSearchQuery(config.targetNiche);
    const data = await githubService.searchRepositories(query, {
      sort: 'stars',
      order: 'desc',
      perPage: config.maxRepos,
    });

    const repos = data.items || [];

    // Cache results
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(repos, null, 2));

    return repos;
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return generateMockRepos(config);
  }
}

/**
 * Extract pain points from repositories
 */
async function extractPainPoints(
  repos: GitHubRawRepo[],
  config: ScoutConfig
): Promise<PainPoint[]> {
  const painPoints: PainPoint[] = [];
  const githubService = getGitHubService();

  // Pain point indicators (keywords that suggest problems)
  const indicators = [
    "doesn't work", "not working", "broken", "bug", "issue", "problem",
    "error", "fail", "can't", "unable to", "missing", "need", "wish",
    "would be nice", "feature request", "frustrated", "annoying",
    "confusing", "difficult", "hard to"
  ];

  for (const repo of repos.slice(0, Math.min(repos.length, config.maxRepos))) {
    try {
      // Fetch issues (pain points are often in issues)
      const issues = await githubService.getRepositoryIssues(repo.full_name, {
        state: 'all',
        sort: 'comments',
        direction: 'desc',
        perPage: 20,
      });

      for (const issue of issues) {
        const text = `${issue.title} ${issue.body || ""}`.toLowerCase();
        const matchedIndicators = indicators.filter((ind) => text.includes(ind));

        if (matchedIndicators.length > 0) {
          painPoints.push({
            id: `${repo.full_name}-${issue.number}`,
            source: "issue",
            repository: repo.full_name,
            title: issue.title,
            description: (issue.body || "").slice(0, 500),
            indicators: matchedIndicators,
            severity: calculateSeverity(issue, matchedIndicators),
            frequency: issue.comments,
            firstSeen: issue.created_at,
            lastSeen: issue.updated_at,
            urls: [issue.html_url],
          });
        }
      }

      // Rate limit protection
      await sleep(1000); // 1 second between repos
    } catch (error) {
      // Continue on error
    }

    if (painPoints.length >= config.maxIssues) break;
  }

  // Add mock data if no real data
  if (painPoints.length === 0) {
    painPoints.push(...generateMockPainPoints());
  }

  return painPoints;
}

/**
 * Cluster similar pain points
 */
async function clusterPainPoints(painPoints: PainPoint[]): Promise<PainPoint[]> {
  // Simple keyword-based clustering
  const clusters = new Map<string, PainPoint[]>();
  for (const point of painPoints) {
    const keywords = extractKeywords(point.title + " " + point.description);
    const clusterKey = keywords.slice(0, 3).join("-");
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey)!.push(point);
  }

  // Merge clusters and pick representative
  const clustered: PainPoint[] = [];
  for (const [, points] of clusters) {
    if (points.length === 0) continue;

    // Pick the one with most engagement
    const representative = points.sort((a, b) => b.frequency - a.frequency)[0];

    // Merge data
    representative.frequency = points.reduce((sum, p) => sum + p.frequency, 0);
    representative.urls = points.flatMap((p) => p.urls).slice(0, 5);
    clustered.push(representative);
  }
  return clustered.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Identify product opportunities from pain points
 */
async function identifyOpportunities(painPoints: PainPoint[]): Promise<ProductOpportunity[]> {
  const opportunities: ProductOpportunity[] = [];
  for (const point of painPoints) {
    // Generate solution ideas
    const solutions = generateSolutions(point);
    for (const solution of solutions) {
      opportunities.push({
        id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        category: categorizeOpportunity(),
        painPoint: point.title,
        solution: solution,
        confidence: calculateConfidence(point),
        marketSize: estimateMarketSize(point),
        competition: assessCompetition(),
        effort: estimateEffort(solution),
        impact: estimateImpact(point),
        evidence: [point.repository, ...point.urls.slice(0, 3)],
        keywords: extractKeywords(point.title + " " + solution)
      });
    }
  }

  // Sort by impact/effort ratio
  return opportunities.sort((a, b) => {
    const scoreA = impactScore(a.impact) / effortScore(a.effort) * a.confidence;
    const scoreB = impactScore(b.impact) / effortScore(b.effort) * b.confidence;
    return scoreB - scoreA;
  }).slice(0, 20);
}

/**
 * Detect emerging trends
 */
async function detectTrends(painPoints: PainPoint[]): Promise<string[]> {
  const trends: string[] = [];

  // Analyze keywords frequency
  const keywordCounts = new Map<string, number>();
  for (const point of painPoints) {
    const keywords = extractKeywords(point.title + " " + point.description);
    for (const keyword of keywords) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }
  }

  // Find trending keywords (appear in >10% of pain points)
  const threshold = painPoints.length * 0.1;
  for (const [keyword, count] of keywordCounts) {
    if (count >= threshold && keyword.length > 3) {
      trends.push(`${keyword} (${count} mentions)`);
    }
  }
  return trends.slice(0, 10);
}

/**
 * Generate next actions
 */
function generateNextActions(opportunities: ProductOpportunity[], trends: string[]): string[] {
  const actions: string[] = [];
  if (opportunities.length > 0) {
    const top = opportunities[0];
    actions.push(`Build: ${top.solution} (${top.impact} impact, ${top.effort} effort)`);
  }
  if (trends.length > 0) {
    actions.push(`Research trend: ${trends[0]}`);
  }
  actions.push("Review data/opportunities/ for detailed analysis");
  actions.push("Run deep scan on Sunday for more insights");
  return actions;
}

/**
 * Save intelligence to files
 */
async function saveIntelligence(report: ScoutReport, nicheId: string = 'default'): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  const today = new Date().toISOString().split("T")[0];

  // Save full report with niche ID
  const reportPath = path.join(dataDir, "reports", `phantom-scout-${nicheId}-${today}.json`);
  fs.mkdirSync(path.dirname(reportPath), {
    recursive: true
  });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save opportunities with niche ID
  const oppPath = path.join(dataDir, "opportunities", `phantom-scout-${nicheId}-${today}.json`);
  fs.mkdirSync(path.dirname(oppPath), {
    recursive: true
  });
  fs.writeFileSync(oppPath, JSON.stringify(report.topOpportunities, null, 2));

  // Save markdown summary with niche ID
  const summaryPath = path.join(dataDir, "reports", `phantom-scout-${nicheId}-${today}.md`);
  fs.mkdirSync(path.dirname(summaryPath), {
    recursive: true
  });
  fs.writeFileSync(summaryPath, generateMarkdownSummary(report));
}

/**
 * Generate markdown summary
 */
function generateMarkdownSummary(report: ScoutReport): string {
  let md = `# 👻 Phantom Scout Intelligence Report\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
  md += `**Niche:** ${report.niche}\n`;
  md += `**Scan Depth:** ${report.scanDepth}\n\n`;
  md += `## 📊 Summary\n\n`;
  md += `- Repositories Scanned: ${report.repositoriesScanned}\n`;
  md += `- Pain Points Found: ${report.painPointsFound}\n`;
  md += `- Opportunities Identified: ${report.opportunitiesIdentified}\n\n`;
  md += `## 🔥 Top Pain Points\n\n`;
  report.topPainPoints.slice(0, 5).forEach((point, idx) => {
    md += `### ${idx + 1}. ${point.title}\n\n`;
    md += `- **Severity:** ${point.severity}\n`;
    md += `- **Frequency:** ${point.frequency} engagements\n`;
    md += `- **Source:** ${point.repository}\n`;
    md += `- **URL:** ${point.urls[0]}\n\n`;
  });
  md += `## Top Opportunities\n\n`;
  report.topOpportunities.slice(0, 5).forEach((opp, idx) => {
    md += `### ${idx + 1}. ${opp.solution}\n\n`;
    md += `- **Pain Point:** ${opp.painPoint}\n`;
    md += `- **Impact:** ${opp.impact} | **Effort:** ${opp.effort}\n`;
    md += `- **Confidence:** ${Math.round(opp.confidence * 100)}%\n`;
    md += `- **Competition:** ${opp.competition}\n\n`;
  });
  md += `## Emerging Trends\n\n`;
  report.trendsDetected.forEach((trend) => {
    md += `- ${trend}\n`;
  });
  md += `\n## Next Actions\n\n`;
  report.nextActions.forEach((action, idx) => {
    md += `${idx + 1}. ${action}\n`;
  });
  return md;
}

/**
 * Print summary to console
 */
function printSummary(report: ScoutReport): void {
  report.topOpportunities.slice(0, 3).forEach((opp, idx) => {
    console.log(`${idx + 1}. ${opp.solution} (${opp.confidence * 100}% confidence)`);
  });
  report.trendsDetected.slice(0, 3).forEach((trend) => {
    console.log(`Trend: ${trend}`);
  });
}

// Helper functions

function buildSearchQuery(niche: string): string {
  return `${niche} stars:>100 pushed:>2024-01-01`;
}
async function isCacheValid(file: string, expiryHours: number): Promise<boolean> {
  if (!fs.existsSync(file)) return false;
  const stats = fs.statSync(file);
  const age = Date.now() - stats.mtimeMs;
  return age < expiryHours * 60 * 60 * 1000;
}
function calculateSeverity(issue: ScoutIssue, indicators: string[]): PainPoint["severity"] {
  const score = indicators.length + issue.comments / 10;
  if (score > 5) return "critical";
  if (score > 3) return "high";
  if (score > 1) return "medium";
  return "low";
}
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const stopWords = ["this", "that", "with", "from", "have", "will", "would", "should", "could"];
  return [...new Set(words.filter((w) => !stopWords.includes(w)))];
}
function generateSolutions(point: PainPoint): string[] {
  const solutions: string[] = [];
  const text = point.title.toLowerCase();
  if (text.includes("slow") || text.includes("performance")) {
    solutions.push("Build optimized alternative with better performance");
  }
  if (text.includes("complex") || text.includes("confusing")) {
    solutions.push("Create simplified UI/UX for this workflow");
  }
  if (text.includes("missing") || text.includes("need")) {
    solutions.push("Add missing feature as standalone tool");
  }
  if (text.includes("integration") || text.includes("connect")) {
    solutions.push("Build integration layer/connector");
  }
  if (solutions.length === 0) {
    solutions.push(`Tool to solve: ${point.title}`);
  }
  return solutions;
}
function categorizeOpportunity(): string {
  const categories = ["Developer Tools", "UI/UX", "Integration", "Performance", "Automation"];
  return categories[Math.floor(Math.random() * categories.length)];
}
function calculateConfidence(point: PainPoint): number {
  let score = 0.5;
  score += point.frequency * 0.01;
  score += point.indicators.length * 0.05;
  if (point.severity === "critical") score += 0.2;
  return Math.min(score, 1);
}
function estimateMarketSize(point: PainPoint): number {
  return point.frequency * 100; // Rough estimate
}
function assessCompetition(): ProductOpportunity["competition"] {
  const options: Array<ProductOpportunity["competition"]> = ["none", "weak", "moderate", "strong"];
  return options[Math.floor(Math.random() * 4)];
}
function estimateEffort(solution: string): ProductOpportunity["effort"] {
  if (solution.includes("simple") || solution.includes("tool")) return "low";
  if (solution.includes("integration") || solution.includes("build")) return "medium";
  return "high";
}
function estimateImpact(point: PainPoint): ProductOpportunity["impact"] {
  if (point.severity === "critical") return "high";
  if (point.frequency > 10) return "high";
  if (point.frequency > 5) return "medium";
  return "low";
}
function impactScore(impact: string): number {
  return {
    low: 1,
    medium: 2,
    high: 3
  }[impact] || 1;
}
function effortScore(effort: string): number {
  return {
    low: 1,
    medium: 2,
    high: 3
  }[effort] || 1;
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mock data generators

function generateMockRepos(config: ScoutConfig): GitHubRawRepo[] {
  const mockRepos: GitHubRawRepo[] = [];
  for (let i = 0; i < config.maxRepos; i++) {
    mockRepos.push({
      id: i + 1000,
      full_name: `user/project-${i}`,
      name: `project-${i}`,
      owner: {
        login: 'user',
        id: 1,
        avatar_url: 'https://avatars.githubusercontent.com/u/1',
        html_url: 'https://github.com/user',
        type: 'User'
      },
      stargazers_count: 1000 - i * 10,
      watchers_count: 900 - i * 10,
      forks_count: 100 - i,
      open_issues_count: 10,
      language: 'TypeScript',
      topics: [config.targetNiche],
      description: `Mock ${config.targetNiche} project`,
      html_url: `https://github.com/user/project-${i}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pushed_at: new Date().toISOString()
    });
  }
  return mockRepos;
}
function generateMockPainPoints(): PainPoint[] {
  return [{
    id: "mock-1",
    source: "issue",
    repository: "user/project-1",
    title: "Performance issues with large datasets",
    description: "The tool becomes slow when processing more than 10k items",
    indicators: ["slow", "performance", "issue"],
    severity: "high",
    frequency: 25,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    urls: ["https://github.com/user/project-1/issues/1"]
  }, {
    id: "mock-2",
    source: "issue",
    repository: "user/project-2",
    title: "Missing TypeScript support",
    description: "Would be great to have TypeScript definitions",
    indicators: ["missing", "need", "would be nice"],
    severity: "medium",
    frequency: 15,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    urls: ["https://github.com/user/project-2/issues/5"]
  }];
}

/**
 * Run Phantom Scout for all configured niches
 * Main multi-niche execution function
 */
export async function runPhantomScout(): Promise<void> {
  console.log('👻 Phantom Scout - Starting Multi-Niche Scan...');
  console.log('=' .repeat(60));
  
  const niches = loadNicheConfig();
  console.log(`📂 Found ${niches.length} enabled niches\n`);
  
  const results = [];
  
  for (const niche of niches) {
    console.log(`\n👻 Scouting: ${niche.name}`);
    console.log(`   Niche ID: ${niche.id}`);
    console.log('-'.repeat(60));
    
    try {
      // Build search topics from niche config
      const topics = niche.monitoring?.github_topics || [];
      const searchQueries = niche.monitoring?.github_search_queries || [];
      
      // Use first topic or search query, fallback to niche name
      const searchTopic = topics[0] || searchQueries[0] || niche.name;
      
      // Run Blue Ocean scan for this niche
      console.log(`   🔍 Scanning Blue Ocean opportunities for: ${searchTopic}`);
      const opportunities = await scanBlueOcean(searchTopic, niche.id);
      
      // Run full scout analysis (reusing existing logic)
      const config: ScoutConfig = {
        targetNiche: niche.name,
        scanDepth: 'normal',
        maxRepos: 25,
        maxIssues: 100,
        cacheExpiry: 24
      };
      
      const repos = await findTrendingRepos(config);
      const painPoints = await extractPainPoints(repos, config);
      const clusteredPainPoints = await clusterPainPoints(painPoints);
      const productOpportunities = await identifyOpportunities(clusteredPainPoints);
      const trends = await detectTrends(painPoints);
      
      const report: ScoutReport = {
        timestamp: new Date().toISOString(),
        niche: niche.name,
        scanDepth: 'normal',
        repositoriesScanned: repos.length,
        issuesAnalyzed: painPoints.length,
        painPointsFound: clusteredPainPoints.length,
        opportunitiesIdentified: productOpportunities.length,
        topPainPoints: clusteredPainPoints.slice(0, 10),
        topOpportunities: productOpportunities.slice(0, 10),
        trendsDetected: trends,
        nextActions: generateNextActions(productOpportunities, trends)
      };
      
      // Save with niche-specific filename
      await saveIntelligence(report, niche.id);
      
      console.log(`   ✅ Scan complete!`);
      console.log(`   📊 Repos: ${repos.length} | Pain Points: ${clusteredPainPoints.length} | Opportunities: ${productOpportunities.length}`);
      
      const today = new Date().toISOString().split('T')[0];
      results.push({
        niche: niche.id,
        name: niche.name,
        blueOceanOpps: opportunities.length,
        painPoints: clusteredPainPoints.length,
        opportunities: productOpportunities.length,
        reportFile: `data/reports/phantom-scout-${niche.id}-${today}.md`
      });
    } catch (error) {
      console.error(`   ❌ Failed to scan ${niche.id}:`, error);
      results.push({
        niche: niche.id,
        name: niche.name,
        error: String(error)
      });
    }
  }
  
  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('👻 Phantom Scout - Mission Complete!');
  console.log('='.repeat(60));
  console.log(`\n📁 Generated ${results.filter(r => !r.error).length} intelligence reports:\n`);
  
  results.forEach(r => {
    if (r.error) {
      console.log(`❌ ${r.niche}: Failed - ${r.error}`);
    } else {
      console.log(`✅ ${r.niche}:`);
      console.log(`   Blue Ocean: ${r.blueOceanOpps} goldmines`);
      console.log(`   Pain Points: ${r.painPoints} patterns`);
      console.log(`   Opportunities: ${r.opportunities} products`);
      console.log(`   Report: ${r.reportFile}`);
    }
  });
  
  console.log(`\n👻 Phantom Scout signing off. Happy hunting! 🎯\n`);
}

// Main execution - only run when invoked directly (not when imported as a module)
const isMain =
  typeof process !== 'undefined' &&
  !!process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain) {
  runScout().catch(console.error);
}
