/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fork Evolution - Repository Modification Pattern Detection
 * Analyzes how forks modify/improve original repositories to detect
 * product gaps, validated demand, and business opportunities across multiple niches.
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

export interface ForkAnalysis {
  totalForks: number;
  activeForks: number;
  successfulForks: any[]; // Forks with more stars than original
  topForks: any[];
  commonModifications: string[];
  divergentPatterns: string[];
  opportunityScore: number;
}

interface RepoData {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  default_branch: string;
}

/**
 * Search for fork-worthy repositories
 */
async function searchForkWorthyRepos(
  octokit: Octokit,
  topics: string[],
  keywords: string[]
): Promise<RepoData[]> {
  const repos: RepoData[] = [];
  
  for (const topic of topics) {
    try {
      console.log(`    → Searching topic: ${topic}`);
      const { data } = await octokit.search.repos({
        q: `topic:${topic} stars:>1000 forks:>100`,
        sort: 'forks',
        order: 'desc',
        per_page: 20
      });
      repos.push(...data.items as RepoData[]);
      
      // Rate limiting: 1 second between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`    ⚠️ Error searching topic ${topic}:`, error.message);
    }
  }
  
  // Deduplicate by repository ID
  const uniqueRepos = Array.from(
    new Map(repos.map(r => [r.id, r])).values()
  );
  
  return uniqueRepos;
}

/**
 * Extract features from commit messages
 */
function extractFeaturesFromCommits(commits: any[], originalRepo: any): string[] {
  const features: string[] = [];
  const featureKeywords = [
    'add', 'added', 'feature', 'support for', 'implement',
    'new', 'introduce', 'enable', 'allow'
  ];
  
  for (const commit of commits) {
    const message = commit.commit.message.toLowerCase();
    
    // Skip merge commits and version bumps
    if (message.includes('merge') || message.includes('version') || message.includes('bump')) continue;
    
    // Look for feature additions
    for (const keyword of featureKeywords) {
      if (message.includes(keyword)) {
        // Extract the feature being added
        const parts = message.split(keyword);
        if (parts.length > 1) {
          const feature = parts[1].trim().split('\n')[0].split('.')[0];
          if (feature && feature.length > 3 && feature.length < 100) {
            features.push(feature);
          }
        }
        break;
      }
    }
  }
  
  return features;
}

/**
 * Find common patterns across modifications
 */
function findCommonPatterns(modifications: string[]): string[] {
  // Count frequency of each modification
  const counts = new Map<string, number>();
  
  for (const mod of modifications) {
    const normalized = mod.toLowerCase().trim();
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }
  
  // Return modifications that appear in 2+ forks
  const common = Array.from(counts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([mod, count]) => `${mod} (${count} forks)`);
  
  return common;
}

/**
 * Analyze fork ecosystem for a repository
 */
async function analyzeForkEcosystem(
  octokit: Octokit,
  repo: RepoData
): Promise<ForkAnalysis> {
  const analysis: ForkAnalysis = {
    totalForks: repo.forks_count,
    activeForks: 0,
    successfulForks: [],
    topForks: [],
    commonModifications: [],
    divergentPatterns: [],
    opportunityScore: 0
  };
  
  try {
    // Get top 20 forks sorted by stars
    const { data: forks } = await octokit.repos.listForks({
      owner: repo.owner.login,
      repo: repo.name,
      sort: 'stargazers',
      per_page: 20
    });
    
    analysis.topForks = forks;
    
    // Analyze each fork
    for (const fork of forks) {
      // Check if active (commits in last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      if (new Date(fork.updated_at) > ninetyDaysAgo) {
        analysis.activeForks++;
      }
      
      // Check if successful (more stars than original)
      if (fork.stargazers_count > repo.stargazers_count) {
        analysis.successfulForks.push(fork);
      }
      
      // Analyze commit messages to find modifications
      try {
        const { data: commits } = await octokit.repos.listCommits({
          owner: fork.owner.login,
          repo: fork.name,
          per_page: 50
        });
        
        // Extract features from commit messages
        const features = extractFeaturesFromCommits(commits, repo);
        if (features.length > 0) {
          analysis.commonModifications.push(...features);
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        // Silent fail - not all forks will be accessible
      }
    }
    
    // Find common patterns
    analysis.commonModifications = findCommonPatterns(analysis.commonModifications);
    
    // Calculate opportunity score (0-100)
    let score = 0;
    
    // High fork count (max 30 points)
    score += Math.min(repo.forks_count / 100 * 30, 30);
    
    // Active fork ecosystem (max 25 points)
    score += Math.min(analysis.activeForks / 5 * 25, 25);
    
    // Successful forks exist (max 25 points)
    score += Math.min(analysis.successfulForks.length * 15, 25);
    
    // Common modifications (max 20 points)
    score += Math.min(analysis.commonModifications.length * 5, 20);
    
    analysis.opportunityScore = Math.round(Math.min(score, 100));
    
  } catch (error: any) {
    console.error(`      ⚠️ Error analyzing forks:`, error.message);
  }
  
  return analysis;
}

/**
 * Analyze business opportunities from fork patterns
 */
function analyzeBusinessOpportunity(
  repo: RepoData,
  analysis: ForkAnalysis
): string {
  const opportunities: string[] = [];
  
  // Pattern 1: Common modifications = validated demand
  if (analysis.commonModifications.length > 0) {
    opportunities.push('🎯 VALIDATED DEMAND:');
    opportunities.push(`Multiple forks independently added similar features:`);
    analysis.commonModifications.slice(0, 5).forEach(mod => {
      opportunities.push(`  - ${mod}`);
    });
    opportunities.push(`💡 Opportunity: Build version with these features built-in`);
  }
  
  // Pattern 2: Successful fork exists
  if (analysis.successfulForks.length > 0) {
    opportunities.push('\n🏆 PROVEN BETTER APPROACH:');
    analysis.successfulForks.forEach(fork => {
      opportunities.push(`  - ${fork.full_name}: ${fork.stargazers_count} stars (${fork.stargazers_count - repo.stargazers_count} more than original)`);
    });
    opportunities.push(`💡 Opportunity: Study what made these forks more successful`);
  }
  
  // Pattern 3: High fork rate but low original activity
  const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  if (analysis.activeForks > 10 && daysSinceUpdate > 90) {
    opportunities.push('\n💰 ABANDONED + ACTIVE ECOSYSTEM:');
    opportunities.push(`  - Original repo: ${Math.round(daysSinceUpdate)} days since last update`);
    opportunities.push(`  - Active forks: ${analysis.activeForks} still being maintained`);
    opportunities.push(`💡 Opportunity: Build maintained alternative with community's improvements`);
  }
  
  // Pattern 4: High opportunity score
  if (analysis.opportunityScore >= 70) {
    opportunities.push('\n✨ HIGH OPPORTUNITY SCORE:');
    opportunities.push(`  - Score: ${analysis.opportunityScore}/100`);
    opportunities.push(`  - Strong signals: High forks, active ecosystem, clear modifications`);
    opportunities.push(`💡 Opportunity: This is a hot area with proven demand`);
  }
  
  return opportunities.length > 0
    ? opportunities.join('\n')
    : 'Monitor for emerging patterns';
}

/**
 * Generate markdown report for a niche
 */
function generateReport(
  nicheId: string,
  nicheName: string,
  repositories: Array<{repo: RepoData, analysis: ForkAnalysis}>
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Fork Evolution Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Fork-Worthy Repositories:** ${repositories.length}\n\n`;
  markdown += `---\n\n`;
  
  if (repositories.length === 0) {
    markdown += `No fork-worthy repositories found for this niche.\n`;
    return markdown;
  }
  
  // Sort by opportunity score
  const sorted = repositories.sort((a, b) => b.analysis.opportunityScore - a.analysis.opportunityScore);
  
  sorted.slice(0, 15).forEach((item, index) => {
    const { repo, analysis } = item;
    
    markdown += `## ${index + 1}. ${repo.full_name}\n\n`;
    markdown += `**Description:** ${repo.description || 'No description'}\n\n`;
    markdown += `**Opportunity Score:** ${analysis.opportunityScore}/100 `;
    if (analysis.opportunityScore >= 80) markdown += '🔥';
    else if (analysis.opportunityScore >= 60) markdown += '⭐';
    markdown += '\n\n';
    
    markdown += `**Repository Metrics:**\n`;
    markdown += `- Stars: ${repo.stargazers_count.toLocaleString()}\n`;
    markdown += `- Total Forks: ${analysis.totalForks.toLocaleString()}\n`;
    markdown += `- Active Forks (90d): ${analysis.activeForks}\n`;
    markdown += `- Successful Forks: ${analysis.successfulForks.length}\n`;
    markdown += `- Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}\n\n`;
    
    if (analysis.successfulForks.length > 0) {
      markdown += `**🏆 More Popular Forks:**\n`;
      analysis.successfulForks.slice(0, 3).forEach(fork => {
        markdown += `  - [${fork.full_name}](${fork.html_url}) - ${fork.stargazers_count} stars\n`;
      });
      markdown += '\n';
    }
    
    if (analysis.commonModifications.length > 0) {
      markdown += `**🎯 Common Modifications Across Forks:**\n`;
      analysis.commonModifications.slice(0, 8).forEach(mod => {
        markdown += `  - ${mod}\n`;
      });
      markdown += '\n';
    }
    
    markdown += `**Business Opportunity Analysis:**\n`;
    markdown += analyzeBusinessOpportunity(repo, analysis);
    markdown += '\n\n';
    
    markdown += `**Links:**\n`;
    markdown += `- Original: ${repo.html_url}\n`;
    markdown += `- Network Graph: ${repo.html_url}/network\n`;
    if (analysis.topForks.length > 0) {
      markdown += `- Top Fork: ${analysis.topForks[0].html_url}\n`;
    }
    markdown += '\n';
    
    markdown += `---\n\n`;
  });
  
  return markdown;
}

/**
 * Main function to run Fork Evolution across all niches
 */
export async function runForkEvolution(): Promise<void> {
  console.log('🍴 Fork Evolution - Starting...');
  
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.warn('⚠️  Warning: No GITHUB_TOKEN found. Rate limits will be lower.');
  }
  
  const octokit = new Octokit({
    auth: githubToken
  });
  
  try {
    const allNiches = await loadNicheConfig();
    const niches = getEnabledNiches(allNiches);
    console.log(`📂 Found ${niches.length} enabled niches`);
    
    const results = [];
    
    for (const niche of niches) {
      console.log(`\n🍴 Analyzing: ${niche.id}`);
      
      // Get topics from nested monitoring structure or top-level
      const topics = niche.monitoring?.github_topics || niche.github_topics || [];
      const keywords = niche.monitoring?.keywords || niche.keywords || [];
      
      if (topics.length === 0) {
        console.log(`  ⚠️ No GitHub topics defined for ${niche.id}, skipping...`);
        continue;
      }
      
      // Search fork-worthy repositories
      console.log(`  → Searching repositories with high fork counts...`);
      const repos = await searchForkWorthyRepos(
        octokit,
        topics,
        keywords
      );
      
      console.log(`  → Found ${repos.length} fork-worthy repositories`);
      
      // Analyze fork ecosystem for each repo (limit to 15 to avoid rate limits)
      const analyzed: Array<{repo: RepoData, analysis: ForkAnalysis}> = [];
      const reposToAnalyze = repos.slice(0, 15);
      
      for (let i = 0; i < reposToAnalyze.length; i++) {
        const repo = reposToAnalyze[i];
        try {
          console.log(`  → Analyzing forks ${i + 1}/${reposToAnalyze.length}: ${repo.full_name}...`);
          const analysis = await analyzeForkEcosystem(octokit, repo);
          analyzed.push({ repo, analysis });
          
          // Rate limit protection: 2 seconds between fork analyses
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
          console.error(`  ⚠️ Error analyzing ${repo.full_name}:`, error.message);
        }
      }
      
      console.log(`  ✅ Analyzed ${analyzed.length} fork ecosystems`);
      
      // Generate report
      const report = generateReport(niche.id, niche.name, analyzed);
      
      // Save report
      const date = new Date().toISOString().split('T')[0];
      const reportsDir = path.join(process.cwd(), 'data', 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      
      const filename = path.join(reportsDir, `fork-evolution-${niche.id}-${date}.md`);
      fs.writeFileSync(filename, report);
      
      console.log(`  ✅ Report saved: data/reports/fork-evolution-${niche.id}-${date}.md`);
      
      results.push({
        niche: niche.id,
        repositories: analyzed.length,
        file: `data/reports/fork-evolution-${niche.id}-${date}.md`
      });
    }
    
    console.log('\n✅ Complete!');
    console.log(`Generated ${results.length} reports`);
    
    // Summary
    results.forEach(r => {
      console.log(`  - ${r.niche}: ${r.repositories} repos analyzed`);
    });
  } catch (error) {
    console.error('❌ Fork Evolution failed:', error);
    throw error;
  }
}
