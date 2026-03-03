/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Abandoned Goldmine Detector
 * Finds high-value abandoned repositories across multiple niches
 * using multi-niche configuration from config/target-niches.yaml
 * 
 * This file contains both:
 * 1. Browser-safe functions for UI components (findGoldmines, calculateGoldmineMetrics, etc.)
 * 2. Node.js CLI functions for intelligence workflows (runGoldmineDetector)
 */

import { Octokit } from '@octokit/rest';
import { isNode, getRuntimeRequire } from './env';
import type { NicheConfig } from './types';

// ============================================================================
// SHARED TYPES - Used by both browser and Node.js code
// ============================================================================

export interface Goldmine {
  owner: string;
  name: string;
  full_name: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastUpdate: string;
  daysSinceUpdate: number;
  url: string;
  description: string | null;
  language: string | null;
  goldmineScore: number;
  valueScore: number;
  abandonmentScore: number;
  demandScore: number;
  license: string | null;
  hasWiki: boolean;
  hasPages: boolean;
  topics: string[];
  created_at: string;
}

// Type alias for browser compatibility
export type Opportunity = Goldmine;

export interface RebuildOpportunity {
  type: 'direct-modernization' | 'improved-alternative' | 'saas-version' | 'niche-focus';
  description: string;
  techStack: string[];
  timeEstimate: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

export interface MonetizationStrategy {
  model: string;
  priceRange: string;
  estimatedMRR: string;
  targetCustomers: string;
}

// ============================================================================
// BROWSER-SAFE FUNCTIONS (for UI components)
// ============================================================================

/**
 * Find goldmines from a list of repositories (browser-safe)
 * Simple scoring without API calls
 */
export function findGoldmines(repositories: Opportunity[]): Opportunity[] {
  return repositories
    .filter(repo => repo.goldmineScore >= 50)
    .sort((a, b) => b.goldmineScore - a.goldmineScore);
}

/**
 * Calculate goldmine metrics for a repository (browser-safe)
 */
export function calculateGoldmineMetrics(repo: Opportunity): {
  goldmineScore: number;
  valueScore: number;
  abandonmentScore: number;
  demandScore: number;
  estimatedPrice: number;
  effort: 'easy' | 'medium' | 'hard';
} {
  // Value score (0-40): Based on stars and documentation
  let valueScore = 0;
  if (repo.stars > 10000) valueScore += 20;
  else if (repo.stars > 5000) valueScore += 15;
  else if (repo.stars > 2000) valueScore += 10;
  else valueScore += 5;
  
  if (repo.hasWiki || repo.hasPages) valueScore += 5;
  if (repo.description && repo.description.length > 50) valueScore += 5;
  
  const daysSinceCreation = calculateDaysSince(repo.created_at);
  if (daysSinceCreation > 365 * 2) valueScore += 10;
  else if (daysSinceCreation > 365) valueScore += 5;
  
  // Abandonment score (0-30)
  let abandonmentScore = 0;
  if (repo.daysSinceUpdate > 730) abandonmentScore += 30;
  else if (repo.daysSinceUpdate > 365) abandonmentScore += 20;
  else if (repo.daysSinceUpdate > 180) abandonmentScore += 10;
  
  // Demand score (0-30)
  let demandScore = 0;
  if (repo.forks > 500) demandScore += 10;
  else if (repo.forks > 200) demandScore += 7;
  else if (repo.forks > 50) demandScore += 5;
  else demandScore += 2;
  
  if (repo.openIssues > 100) demandScore += 10;
  else if (repo.openIssues > 50) demandScore += 7;
  else if (repo.openIssues > 20) demandScore += 5;
  
  // Calculate total
  const goldmineScore = Math.min(100, valueScore + abandonmentScore + demandScore);
  
  // Estimate pricing based on stars
  let estimatedPrice = 0;
  if (repo.stars > 10000) estimatedPrice = 97;
  else if (repo.stars > 5000) estimatedPrice = 49;
  else if (repo.stars > 2000) estimatedPrice = 29;
  else estimatedPrice = 9;
  
  // Estimate effort
  let effort: 'easy' | 'medium' | 'hard' = 'medium';
  if (repo.stars < 2000) effort = 'easy';
  else if (repo.stars > 10000) effort = 'hard';
  
  return {
    goldmineScore,
    valueScore,
    abandonmentScore,
    demandScore,
    estimatedPrice,
    effort,
  };
}

/**
 * Categorize goldmines by effort level (browser-safe)
 */
export function categorizeGoldmines(goldmines: Opportunity[]): {
  easyWins: Opportunity[];
  mediumEffort: Opportunity[];
  highEffort: Opportunity[];
} {
  const easyWins: Opportunity[] = [];
  const mediumEffort: Opportunity[] = [];
  const highEffort: Opportunity[] = [];
  
  goldmines.forEach(goldmine => {
    const metrics = calculateGoldmineMetrics(goldmine);
    if (metrics.effort === 'easy') {
      easyWins.push(goldmine);
    } else if (metrics.effort === 'medium') {
      mediumEffort.push(goldmine);
    } else {
      highEffort.push(goldmine);
    }
  });
  
  return { easyWins, mediumEffort, highEffort };
}

/**
 * Generate action plan for goldmines (browser-safe)
 */
export function generateActionPlan(goldmine: Opportunity): string {
  const metrics = calculateGoldmineMetrics(goldmine);
  
  let plan = `# Action Plan: ${goldmine.full_name}\n\n`;
  plan += `**Goldmine Score:** ${metrics.goldmineScore}/100\n`;
  plan += `**Estimated Price Point:** $${metrics.estimatedPrice}\n`;
  plan += `**Effort Level:** ${metrics.effort}\n\n`;
  
  plan += `## Quick Stats\n`;
  plan += `- ⭐ ${goldmine.stars.toLocaleString()} stars\n`;
  plan += `- 🍴 ${goldmine.forks.toLocaleString()} forks\n`;
  plan += `- 🐛 ${goldmine.openIssues} open issues\n`;
  plan += `- 📅 Last update: ${goldmine.daysSinceUpdate} days ago\n\n`;
  
  plan += `## Opportunity\n`;
  plan += `This abandoned project has proven demand (${goldmine.stars.toLocaleString()} stars) `;
  plan += `but hasn't been updated in ${goldmine.daysSinceUpdate} days. `;
  plan += `The ${goldmine.openIssues} open issues represent unmet needs.\n\n`;
  
  plan += `## Recommended Approach\n`;
  if (metrics.effort === 'easy') {
    plan += `- Fork and modernize the codebase\n`;
    plan += `- Fix critical issues from the backlog\n`;
    plan += `- Add basic documentation and examples\n`;
    plan += `- Launch as open source to build trust\n`;
  } else if (metrics.effort === 'medium') {
    plan += `- Study the codebase architecture\n`;
    plan += `- Identify key pain points from issues\n`;
    plan += `- Build improved alternative with modern stack\n`;
    plan += `- Offer migration guide for existing users\n`;
  } else {
    plan += `- Conduct deep user research\n`;
    plan += `- Design comprehensive solution\n`;
    plan += `- Build SaaS version with better UX\n`;
    plan += `- Target enterprise customers\n`;
  }
  
  return plan;
}

/**
 * Generate goldmine report (browser-safe)
 */
export function generateGoldmineReport(goldmines: Opportunity[]): string {
  let report = `# Goldmine Detector Report\n\n`;
  report += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  report += `**Goldmines Found:** ${goldmines.length}\n\n`;
  report += `---\n\n`;
  
  if (goldmines.length === 0) {
    report += `No goldmines found.\n`;
    return report;
  }
  
  goldmines.slice(0, 10).forEach((goldmine, index) => {
    const metrics = calculateGoldmineMetrics(goldmine);
    report += `## ${index + 1}. ${goldmine.full_name}\n\n`;
    report += `**Goldmine Score:** ${metrics.goldmineScore}/100\n`;
    report += `**Stars:** ${goldmine.stars.toLocaleString()}\n`;
    report += `**Forks:** ${goldmine.forks.toLocaleString()}\n`;
    report += `**Open Issues:** ${goldmine.openIssues}\n`;
    report += `**Days Since Update:** ${goldmine.daysSinceUpdate}\n`;
    report += `**Estimated Price:** $${metrics.estimatedPrice}\n`;
    report += `**Effort:** ${metrics.effort}\n`;
    report += `**URL:** ${goldmine.url}\n\n`;
    if (goldmine.description) {
      report += `**Description:** ${goldmine.description}\n\n`;
    }
    report += `---\n\n`;
  });
  
  return report;
}

// ============================================================================
// SHARED HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate days since a date
 */
function calculateDaysSince(dateString: string): number {
  const then = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - then.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ============================================================================
// NODE.JS CLI FUNCTIONS (for intelligence workflows)
// ============================================================================

import { loadNicheConfig, getEnabledNiches } from './config-loader';

/**
 * Calculate goldmine score (0-100)
 * - Value score (0-40): Stars, documentation, past activity
 * - Abandonment score (0-30): Days abandoned, no responses
 * - Demand score (0-30): Active forks, recent issues, recent stars
 */
function calculateGoldmineScore(repo: any, commits: any[], issues: any[]): {
  total: number;
  valueScore: number;
  abandonmentScore: number;
  demandScore: number;
} {
  let valueScore = 0;
  let abandonmentScore = 0;
  let demandScore = 0;

  // VALUE SCORE (0-40)
  // Stars indicate proven demand
  if (repo.stargazers_count > 10000) valueScore += 20;
  else if (repo.stargazers_count > 5000) valueScore += 15;
  else if (repo.stargazers_count > 2000) valueScore += 10;
  else valueScore += 5;

  // Documentation indicates quality
  if (repo.has_wiki || repo.has_pages) valueScore += 5;
  if (repo.description && repo.description.length > 50) valueScore += 5;

  // Past activity indicates maturity
  const daysSinceCreation = calculateDaysSince(repo.created_at);
  if (daysSinceCreation > 365 * 2) valueScore += 10; // Mature project
  else if (daysSinceCreation > 365) valueScore += 5;

  // ABANDONMENT SCORE (0-30)
  const daysSinceUpdate = calculateDaysSince(repo.updated_at);
  if (daysSinceUpdate > 730) abandonmentScore += 30; // 2+ years
  else if (daysSinceUpdate > 365) abandonmentScore += 20; // 1-2 years
  else if (daysSinceUpdate > 180) abandonmentScore += 10; // 6-12 months

  // No recent commits
  const recentCommits = commits.filter((c: any) => {
    const commitDate = new Date(c.commit.author.date);
    const monthsAgo = (Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo < 6;
  });
  if (recentCommits.length === 0) abandonmentScore += 0; // Already counted in update time

  // DEMAND SCORE (0-30)
  // Active forks indicate ongoing demand
  if (repo.forks_count > 500) demandScore += 10;
  else if (repo.forks_count > 200) demandScore += 7;
  else if (repo.forks_count > 50) demandScore += 5;
  else demandScore += 2;

  // Open issues indicate unmet needs
  if (repo.open_issues_count > 100) demandScore += 10;
  else if (repo.open_issues_count > 50) demandScore += 7;
  else if (repo.open_issues_count > 20) demandScore += 5;

  // Recent issues indicate current demand
  const recentIssues = issues.filter((issue: any) => {
    const issueDate = new Date(issue.created_at);
    const monthsAgo = (Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo < 6;
  });
  if (recentIssues.length > 10) demandScore += 10;
  else if (recentIssues.length > 5) demandScore += 5;

  const total = Math.min(100, valueScore + abandonmentScore + demandScore);
  
  return { total, valueScore, abandonmentScore, demandScore };
}

/**
 * Search for abandoned repositories
 */
async function searchAbandonedRepos(
  octokit: Octokit,
  topics: string[],
  keywords: string[]
): Promise<any[]> {
  const repos: any[] = [];
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  const dateStr = oneYearAgo.toISOString().split('T')[0];

  // Search by topics
  for (const topic of topics.slice(0, 3)) { // Limit to 3 topics to avoid rate limits
    try {
      console.log(`    → Searching topic: ${topic}`);
      const { data } = await octokit.search.repos({
        q: `topic:${topic} stars:>1000 pushed:<${dateStr}`,
        sort: 'stars',
        order: 'desc',
        per_page: 30
      });
      repos.push(...data.items);
      
      // Rate limiting: 1 second between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`    ⚠️ Error searching topic ${topic}:`, error.message);
      if (error.status === 403) {
        console.log('    Rate limited. Waiting 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  }

  // Deduplicate by repository ID
  const uniqueRepos = Array.from(
    new Map(repos.map(r => [r.id, r])).values()
  );

  return uniqueRepos;
}

/**
 * Analyze repository for goldmine potential
 */
async function analyzeGoldmine(
  octokit: Octokit,
  repo: any
): Promise<Goldmine | null> {
  try {
    const [owner, name] = repo.full_name.split('/');
    
    // Get recent commits
    let commits: any[] = [];
    try {
      const { data: commitData } = await octokit.repos.listCommits({
        owner,
        repo: name,
        per_page: 100
      });
      commits = commitData;
    } catch (error: any) {
      console.error(`      ⚠️ Could not fetch commits: ${error.message}`);
    }

    // Get recent issues
    let issues: any[] = [];
    try {
      const { data: issueData } = await octokit.issues.listForRepo({
        owner,
        repo: name,
        state: 'open',
        sort: 'created',
        direction: 'desc',
        per_page: 100
      });
      issues = issueData.filter((i: any) => !i.pull_request);
    } catch (error: any) {
      console.error(`      ⚠️ Could not fetch issues: ${error.message}`);
    }

    // Rate limiting between repo analyses
    await new Promise(resolve => setTimeout(resolve, 1000));

    const daysSinceUpdate = calculateDaysSince(repo.updated_at || repo.pushed_at);
    
    // Filter: Must be abandoned for >180 days
    if (daysSinceUpdate < 180) {
      return null;
    }

    // Calculate goldmine score
    const scores = calculateGoldmineScore(repo, commits, issues);

    const goldmine: Goldmine = {
      owner,
      name,
      full_name: repo.full_name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      lastUpdate: repo.updated_at || repo.pushed_at,
      daysSinceUpdate,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      goldmineScore: scores.total,
      valueScore: scores.valueScore,
      abandonmentScore: scores.abandonmentScore,
      demandScore: scores.demandScore,
      license: repo.license?.spdx_id || null,
      hasWiki: repo.has_wiki,
      hasPages: repo.has_pages,
      topics: repo.topics || [],
      created_at: repo.created_at
    };

    return goldmine;
  } catch (error: any) {
    console.error(`    ⚠️ Error analyzing ${repo.full_name}:`, error.message);
    return null;
  }
}

/**
 * Extract top unmet needs from issues
 */
async function extractUnmetNeeds(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string[]> {
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      sort: 'comments',
      direction: 'desc',
      per_page: 20
    });

    const needs = issues
      .filter((i: any) => !i.pull_request)
      .slice(0, 10)
      .map((i: any) => `${i.title} (${i.comments} comments)`);

    return needs;
  } catch (error: any) {
    console.error(`    ⚠️ Could not extract needs: ${error.message}`);
    return [];
  }
}

/**
 * Generate rebuild opportunity
 */
function generateRebuildOpportunity(goldmine: Goldmine): RebuildOpportunity {
  const language = goldmine.language || 'Unknown';
  
  let type: RebuildOpportunity['type'] = 'direct-modernization';
  let description = '';
  let techStack: string[] = [];
  let timeEstimate = '';
  let difficultyLevel: RebuildOpportunity['difficultyLevel'] = 'medium';

  // Determine rebuild type based on characteristics
  if (goldmine.stars > 5000 && goldmine.openIssues > 50) {
    type = 'improved-alternative';
    description = `Build improved version with modern tech stack addressing top ${Math.min(goldmine.openIssues, 20)} feature requests`;
    timeEstimate = '8-12 weeks';
    difficultyLevel = 'hard';
  } else if (goldmine.stars > 2000) {
    type = 'saas-version';
    description = 'Convert to hosted SaaS version with managed infrastructure and support';
    timeEstimate = '6-10 weeks';
    difficultyLevel = 'medium';
  } else {
    type = 'direct-modernization';
    description = 'Modernize dependencies, fix security issues, and add requested features';
    timeEstimate = '4-6 weeks';
    difficultyLevel = 'easy';
  }

  // Suggest modern tech stack
  if (language === 'JavaScript' || language === 'TypeScript') {
    techStack = ['TypeScript', 'Vite', 'React', 'Tailwind CSS'];
  } else if (language === 'Python') {
    techStack = ['Python 3.11+', 'FastAPI', 'PostgreSQL', 'Docker'];
  } else if (language === 'Go') {
    techStack = ['Go 1.21+', 'Chi Router', 'PostgreSQL', 'Docker'];
  } else if (language === 'Ruby') {
    techStack = ['Ruby 3.2+', 'Rails 7', 'PostgreSQL', 'Tailwind CSS'];
  } else {
    techStack = ['Modern framework', 'Docker', 'PostgreSQL'];
  }

  return { type, description, techStack, timeEstimate, difficultyLevel };
}

/**
 * Generate monetization strategy
 */
function generateMonetizationStrategy(goldmine: Goldmine): MonetizationStrategy[] {
  const strategies: MonetizationStrategy[] = [];

  // Freemium SaaS
  const freemiumMRR = Math.round(goldmine.stars * 0.01 * 29); // 1% conversion at $29/mo
  strategies.push({
    model: 'Freemium SaaS',
    priceRange: '$29-99/month',
    estimatedMRR: `$${freemiumMRR.toLocaleString()}-${(freemiumMRR * 3).toLocaleString()}`,
    targetCustomers: `${Math.round(goldmine.stars * 0.01)} paying users (1% of stargazers)`
  });

  // One-time license
  const licenseMRR = Math.round(goldmine.stars * 0.005 * 149); // 0.5% conversion at $149 one-time
  strategies.push({
    model: 'One-time License',
    priceRange: '$149-499 lifetime',
    estimatedMRR: `$${Math.round(licenseMRR / 12).toLocaleString()}/month (amortized)`,
    targetCustomers: `${Math.round(goldmine.stars * 0.005)} buyers`
  });

  // Enterprise support
  if (goldmine.stars > 5000) {
    strategies.push({
      model: 'Enterprise Support',
      priceRange: '$999-4,999/month',
      estimatedMRR: '$3,000-15,000',
      targetCustomers: '3-5 enterprise customers'
    });
  }

  return strategies;
}

/**
 * Generate markdown report for a niche
 */
function generateReport(
  nicheId: string,
  nicheName: string,
  goldmines: Goldmine[],
  unmetNeeds: Map<string, string[]>
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Goldmine Detector Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Goldmines Found:** ${goldmines.length}\n\n`;
  
  if (goldmines.length === 0) {
    markdown += `## No Goldmines Found\n\n`;
    markdown += `No abandoned repositories matching goldmine criteria were found in this niche.\n\n`;
    markdown += `**Goldmine Criteria:**\n`;
    markdown += `- Stars > 1,000 (proven demand)\n`;
    markdown += `- Abandoned > 180 days (no competition)\n`;
    markdown += `- Open Issues > 20 (unmet needs)\n`;
    markdown += `- Permissive license (can rebuild)\n\n`;
    return markdown;
  }

  markdown += `---\n\n`;

  // Top 15 goldmines
  goldmines.slice(0, 15).forEach((goldmine, index) => {
    const rebuildOpp = generateRebuildOpportunity(goldmine);
    const monetization = generateMonetizationStrategy(goldmine);
    const needs = unmetNeeds.get(goldmine.full_name) || [];

    // Goldmine header
    markdown += `## ${index + 1}. ${goldmine.full_name}\n\n`;
    
    // Score with emojis
    const scoreEmoji = goldmine.goldmineScore >= 80 ? '💎💎💎' : 
                       goldmine.goldmineScore >= 60 ? '💎💎' : '💎';
    markdown += `**Goldmine Score:** ${goldmine.goldmineScore}/100 ${scoreEmoji}\n\n`;

    // Description
    if (goldmine.description) {
      markdown += `${goldmine.description}\n\n`;
    }

    // Repository Metrics
    markdown += `**Repository Metrics:**\n`;
    markdown += `- ⭐ Stars: ${goldmine.stars.toLocaleString()}\n`;
    markdown += `- 📅 Last Update: ${goldmine.daysSinceUpdate} days ago\n`;
    markdown += `- 🐛 Open Issues: ${goldmine.openIssues}\n`;
    markdown += `- 🍴 Active Forks: ${goldmine.forks}\n`;
    markdown += `- 💻 Language: ${goldmine.language || 'Unknown'}\n`;
    markdown += `- 📜 License: ${goldmine.license || 'Unknown'}\n\n`;

    // Score Breakdown
    markdown += `**Score Breakdown:**\n`;
    markdown += `- Value Score: ${goldmine.valueScore}/40 (stars, docs, maturity)\n`;
    markdown += `- Abandonment Score: ${goldmine.abandonmentScore}/30 (time inactive)\n`;
    markdown += `- Demand Score: ${goldmine.demandScore}/30 (forks, issues)\n\n`;

    // Top Unmet Needs
    if (needs.length > 0) {
      markdown += `**Top Unmet Needs:**\n`;
      needs.slice(0, 5).forEach(need => {
        markdown += `- ${need}\n`;
      });
      markdown += `\n`;
    }

    // Rebuild Opportunity
    markdown += `**Rebuild Opportunity (${rebuildOpp.type}):**\n`;
    markdown += `${rebuildOpp.description}\n\n`;
    markdown += `- **Difficulty:** ${rebuildOpp.difficultyLevel}\n`;
    markdown += `- **Time Estimate:** ${rebuildOpp.timeEstimate}\n`;
    markdown += `- **Tech Stack:** ${rebuildOpp.techStack.join(', ')}\n\n`;

    // Monetization
    markdown += `**Monetization Strategies:**\n`;
    monetization.forEach(strategy => {
      markdown += `- **${strategy.model}:** ${strategy.priceRange}\n`;
      markdown += `  - Estimated MRR: ${strategy.estimatedMRR}\n`;
      markdown += `  - Target: ${strategy.targetCustomers}\n`;
    });
    markdown += `\n`;

    markdown += `🔗 **Repository:** ${goldmine.url}\n\n`;
    markdown += `---\n\n`;
  });

  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `**Top 3 Goldmines:**\n`;
  goldmines.slice(0, 3).forEach((g, i) => {
    markdown += `${i + 1}. **${g.full_name}** (Score: ${g.goldmineScore}/100) - ${g.stars.toLocaleString()} stars, ${g.daysSinceUpdate} days abandoned\n`;
  });
  markdown += `\n`;

  const avgScore = Math.round(goldmines.reduce((sum, g) => sum + g.goldmineScore, 0) / goldmines.length);
  markdown += `**Average Goldmine Score:** ${avgScore}/100\n`;
  markdown += `**Total Stars Represented:** ${goldmines.reduce((sum, g) => sum + g.stars, 0).toLocaleString()}\n`;
  markdown += `**Total Open Issues:** ${goldmines.reduce((sum, g) => sum + g.openIssues, 0).toLocaleString()}\n\n`;

  markdown += `**Recommended Action:**\n`;
  markdown += `Start with the top 3 goldmines. They have the highest scores and represent validated demand with clear unmet needs.\n\n`;

  markdown += `---\n\n`;
  markdown += `*Generated by Council Goldmine Detector*\n`;
  
  return markdown;
}

/**
 * Main function to run Goldmine Detector across all niches
 */
export async function runGoldmineDetector(): Promise<void> {
  console.log('💎 Goldmine Detector - Starting...');
  
  if (!isNode) return;
  const fs = getRuntimeRequire()('fs');
  const path = getRuntimeRequire()('path');

  try {
    const allNiches = await loadNicheConfig();
    const niches = getEnabledNiches(allNiches);
    console.log(`📂 Found ${niches.length} enabled niches`);
    
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    const octokit = new Octokit({ auth: githubToken });
    const results = [];

    for (const niche of niches) {
      console.log(`\n💎 Processing: ${niche.id}`);
      
      // Get topics and keywords from nested monitoring structure or fallback
      const topics = niche.monitoring?.github_topics || niche.github_topics || [];
      const keywords = niche.monitoring?.keywords || niche.keywords || [];
      
      if (topics.length === 0) {
        console.log(`  ⚠️ No GitHub topics configured for ${niche.id}, skipping...`);
        continue;
      }

      // Search for abandoned repositories
      const repos = await searchAbandonedRepos(octokit, topics, keywords);
      console.log(`  → Found ${repos.length} potentially abandoned repos`);

      // Analyze each repository
      const goldmines: Goldmine[] = [];
      const unmetNeeds = new Map<string, string[]>();

      for (const repo of repos.slice(0, 30)) { // Limit to 30 to avoid rate limits
        console.log(`    Analyzing: ${repo.full_name}`);
        const goldmine = await analyzeGoldmine(octokit, repo);
        
        if (goldmine && goldmine.goldmineScore >= 50) {
          goldmines.push(goldmine);
          
          // Extract unmet needs from issues
          const needs = await extractUnmetNeeds(octokit, goldmine.owner, goldmine.name);
          unmetNeeds.set(goldmine.full_name, needs);
        }
      }

      // Sort by goldmine score
      goldmines.sort((a, b) => b.goldmineScore - a.goldmineScore);

      console.log(`  ✅ Found ${goldmines.length} goldmines (score >= 50)`);

      // Generate report
      const report = generateReport(niche.id, niche.name, goldmines, unmetNeeds);

      // Save report
      const date = new Date().toISOString().split('T')[0];
      const reportsDir = path.join(process.cwd(), 'data', 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });

      const filename = path.join(reportsDir, `goldmine-${niche.id}-${date}.md`);
      fs.writeFileSync(filename, report);

      console.log(`  📄 Report saved: data/reports/goldmine-${niche.id}-${date}.md`);

      results.push({
        niche: niche.id,
        goldmines: goldmines.length,
        file: `data/reports/goldmine-${niche.id}-${date}.md`
      });
    }

    console.log('\n✅ Goldmine Detector Complete!');
    console.log(`Generated ${results.length} reports:`);
    results.forEach(r => {
      console.log(`  - ${r.niche}: ${r.goldmines} goldmines`);
    });
  } catch (error) {
    console.error('❌ Goldmine Detector failed:', error);
    throw error;
  }
}
