/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GitHub Trending - Early Trend Detection
 * 
 * Scans GitHub trending repositories to detect early market opportunities.
 * Finds repos gaining stars rapidly BEFORE mainstream adoption.
 * 
 * Key Features:
 * - Scans by niche topics and keywords
 * - Scores trends: velocity + recency + relevance + validation
 * - Generates actionable opportunity reports
 * - Detects hot trends requiring immediate action
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TrendingRepo {
  name: string;
  full_name: string;
  description: string;
  url: string;
  stars: number;
  created_at: string;
  pushed_at: string;
  language: string;
  topics: string[];
  age_days: number;
  stars_per_day: number;
}

interface TrendAnalysis {
  repo: TrendingRepo;
  velocityScore: number;
  recencyScore: number;
  relevanceScore: number;
  validationScore: number;
  trendScore: number;
  opportunityType: string;
  recommendedAction: string;
}

// ============================================================================
// TRENDING REPO SCANNER
// ============================================================================

/**
 * Scan GitHub for trending repositories
 */
async function scanTrendingRepos(
  octokit: Octokit,
  topics: string[],
  keywords: string[]
): Promise<TrendingRepo[]> {
  const repos: TrendingRepo[] = [];
  
  // Calculate date thresholds
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  try {
    // Search by topics (most reliable)
    for (const topic of topics.slice(0, 3)) {
      const query = `topic:${topic} stars:>50 pushed:>${thirtyDaysAgo.toISOString().split('T')[0]}`;
      
      try {
        const { data } = await octokit.search.repos({
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 30
        });
        
        for (const repo of data.items) {
          const createdAt = new Date(repo.created_at);
          const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const starsPerDay = repo.stargazers_count / Math.max(ageDays, 1);
          
          repos.push({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || '',
            url: repo.html_url,
            stars: repo.stargazers_count,
            created_at: repo.created_at,
            pushed_at: repo.pushed_at,
            language: repo.language || 'Unknown',
            topics: repo.topics || [],
            age_days: ageDays,
            stars_per_day: starsPerDay
          });
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`  ⚠️  Failed to search topic ${topic}:`, error.message);
      }
    }
    
    // Search by keywords (for repos created recently)
    for (const keyword of keywords.slice(0, 2)) {
      const query = `${keyword} created:>${ninetyDaysAgo.toISOString().split('T')[0]} stars:>50`;
      
      try {
        const { data } = await octokit.search.repos({
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 20
        });
        
        for (const repo of data.items) {
          const createdAt = new Date(repo.created_at);
          const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const starsPerDay = repo.stargazers_count / Math.max(ageDays, 1);
          
          repos.push({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || '',
            url: repo.html_url,
            stars: repo.stargazers_count,
            created_at: repo.created_at,
            pushed_at: repo.pushed_at,
            language: repo.language || 'Unknown',
            topics: repo.topics || [],
            age_days: ageDays,
            stars_per_day: starsPerDay
          });
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`  ⚠️  Failed to search keyword ${keyword}:`, error.message);
      }
    }
    
    // Deduplicate by full_name
    const uniqueRepos = Array.from(
      new Map(repos.map(r => [r.full_name, r])).values()
    );
    
    // Filter for actual trending (created in last 90 days OR high velocity)
    const trending = uniqueRepos.filter(r => 
      r.age_days <= 90 || r.stars_per_day > 5
    );
    
    return trending;
    
  } catch (error: any) {
    console.error('Error scanning trending repos:', error.message);
    return [];
  }
}

// ============================================================================
// TREND ANALYZER
// ============================================================================

/**
 * Analyze a trending repository and calculate scores
 */
function analyzeTrend(
  repo: TrendingRepo,
  keywords: string[]
): TrendAnalysis {
  const analysis: TrendAnalysis = {
    repo,
    velocityScore: 0,
    recencyScore: 0,
    relevanceScore: 0,
    validationScore: 0,
    trendScore: 0,
    opportunityType: '',
    recommendedAction: ''
  };
  
  // VELOCITY SCORE (0-40)
  if (repo.stars_per_day > 500) {
    analysis.velocityScore = 40;
  } else if (repo.stars_per_day > 100) {
    analysis.velocityScore = 30;
  } else if (repo.stars_per_day > 50) {
    analysis.velocityScore = 20;
  } else if (repo.stars_per_day > 10) {
    analysis.velocityScore = 10;
  }
  
  // RECENCY SCORE (0-30)
  if (repo.age_days < 7) {
    analysis.recencyScore = 30;
  } else if (repo.age_days < 30) {
    analysis.recencyScore = 20;
  } else if (repo.age_days < 90) {
    analysis.recencyScore = 10;
  } else {
    analysis.recencyScore = 5;
  }
  
  // RELEVANCE SCORE (0-20)
  const fullText = `${repo.name} ${repo.description}`.toLowerCase();
  const matchCount = keywords.filter(k => 
    fullText.includes(k.toLowerCase())
  ).length;
  
  if (matchCount >= 3) {
    analysis.relevanceScore = 20;
  } else if (matchCount >= 2) {
    analysis.relevanceScore = 15;
  } else if (matchCount >= 1) {
    analysis.relevanceScore = 10;
  } else if (repo.topics.length > 0) {
    analysis.relevanceScore = 5;
  }
  
  // VALIDATION SCORE (0-10)
  if (repo.stars > 1000) {
    analysis.validationScore = 10;
  } else if (repo.stars > 500) {
    analysis.validationScore = 7;
  } else if (repo.stars > 100) {
    analysis.validationScore = 5;
  } else {
    analysis.validationScore = 2;
  }
  
  // TOTAL SCORE
  analysis.trendScore = analysis.velocityScore + 
                       analysis.recencyScore + 
                       analysis.relevanceScore + 
                       analysis.validationScore;
  
  // Determine opportunity type
  analysis.opportunityType = determineOpportunityType(repo, analysis);
  
  // Generate recommendation
  analysis.recommendedAction = generateRecommendation(repo, analysis);
  
  return analysis;
}

/**
 * Determine opportunity type based on analysis
 */
function determineOpportunityType(
  repo: TrendingRepo,
  analysis: TrendAnalysis
): string {
  const types = [];
  
  if (analysis.trendScore >= 80) {
    types.push('🔥 HOT TREND: Build competing version immediately');
  } else if (analysis.trendScore >= 60) {
    types.push('📈 RISING: Strong growth, consider building alternative');
  } else if (analysis.trendScore >= 40) {
    types.push('🌱 EMERGING: Early stage, monitor for growth');
  }
  
  if (repo.stars_per_day > 100) {
    types.push('⚡ VIRAL: Extremely rapid growth');
  }
  
  if (repo.age_days < 30) {
    types.push('🆕 BRAND NEW: First-mover opportunity');
  }
  
  // Determine compete vs complement
  const descLower = repo.description.toLowerCase();
  if (descLower.includes('tool') || descLower.includes('app')) {
    types.push('🎯 COMPETE: Build better version');
  }
  if (descLower.includes('library') || descLower.includes('framework')) {
    types.push('🔌 COMPLEMENT: Build tool using this');
  }
  
  return types.length > 0 
    ? types.join('\n')
    : 'Monitor for opportunity development';
}

/**
 * Generate actionable recommendations
 */
function generateRecommendation(
  repo: TrendingRepo,
  analysis: TrendAnalysis
): string {
  const recommendations = [];
  
  if (analysis.trendScore >= 80) {
    recommendations.push('IMMEDIATE ACTION REQUIRED');
    recommendations.push('1. Analyze what makes this repo popular');
    recommendations.push('2. Build competing/better version this week');
    recommendations.push('3. Launch while trend is hot');
    recommendations.push(`4. Market as "better alternative to ${repo.name}"`);
  } else if (analysis.trendScore >= 60) {
    recommendations.push('STRONG OPPORTUNITY');
    recommendations.push('1. Study the repo and user feedback');
    recommendations.push('2. Identify missing features/improvements');
    recommendations.push('3. Build within 2-4 weeks');
    recommendations.push('4. Launch before trend peaks');
  } else if (analysis.trendScore >= 40) {
    recommendations.push('MONITOR CLOSELY');
    recommendations.push('1. Watch star growth over next week');
    recommendations.push('2. If growth accelerates, move to build');
    recommendations.push('3. Otherwise, add to watchlist');
  } else {
    recommendations.push('LOW PRIORITY');
    recommendations.push('Continue monitoring, not urgent');
  }
  
  return recommendations.join('\n');
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

/**
 * Generate markdown report for a niche
 */
function generateReport(
  nicheId: string,
  nicheName: string,
  analyses: TrendAnalysis[]
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# GitHub Trending Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Trending Repositories:** ${analyses.length}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## 📈 What is GitHub Trending?\n\n`;
  markdown += `Repositories gaining stars rapidly = early market signals.\n`;
  markdown += `Detect trends BEFORE mainstream adoption.\n\n`;
  markdown += `**Trend Scoring:**\n`;
  markdown += `- 80-100: 🔥🔥🔥 Hot - build immediately\n`;
  markdown += `- 60-79: 🔥🔥 Rising - strong opportunity\n`;
  markdown += `- 40-59: 🔥 Emerging - monitor closely\n\n`;
  markdown += `---\n\n`;
  
  // Sort by trend score
  const sorted = analyses.sort((a, b) => b.trendScore - a.trendScore);
  
  sorted.slice(0, 20).forEach((item, index) => {
    const { repo } = item;
    
    markdown += `## ${index + 1}. ${repo.full_name}\n\n`;
    
    markdown += `**Trend Score:** ${item.trendScore}/100 `;
    if (item.trendScore >= 80) markdown += '🔥🔥🔥';
    else if (item.trendScore >= 60) markdown += '🔥🔥';
    else if (item.trendScore >= 40) markdown += '🔥';
    markdown += '\n\n';
    
    markdown += `**Description:** ${repo.description}\n\n`;
    
    markdown += `**Repository Metrics:**\n`;
    markdown += `- Stars: ${repo.stars.toLocaleString()}\n`;
    markdown += `- Growth Rate: ${Math.round(repo.stars_per_day)} stars/day\n`;
    markdown += `- Age: ${Math.round(repo.age_days)} days\n`;
    markdown += `- Language: ${repo.language}\n`;
    markdown += `- Topics: ${repo.topics.join(', ') || 'None'}\n\n`;
    
    markdown += `**Trend Analysis:**\n`;
    markdown += `- Velocity Score: ${item.velocityScore}/40\n`;
    markdown += `- Recency Score: ${item.recencyScore}/30\n`;
    markdown += `- Relevance Score: ${item.relevanceScore}/20\n`;
    markdown += `- Validation Score: ${item.validationScore}/10\n\n`;
    
    markdown += `**🎯 Opportunity Type:**\n`;
    markdown += `${item.opportunityType}\n\n`;
    
    markdown += `**✅ Recommended Action:**\n`;
    markdown += `${item.recommendedAction}\n\n`;
    
    markdown += `**🔗 Link:** ${repo.url}\n\n`;
    markdown += `---\n\n`;
  });
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  const hotTrends = analyses.filter(a => a.trendScore >= 80).length;
  const rising = analyses.filter(a => a.trendScore >= 60 && a.trendScore < 80).length;
  const avgVelocity = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.repo.stars_per_day, 0) / analyses.length)
    : 0;
  
  markdown += `**Hot Trends (80+):** ${hotTrends}\n`;
  markdown += `**Rising Trends (60-79):** ${rising}\n`;
  markdown += `**Average Growth:** ${avgVelocity} stars/day\n\n`;
  
  if (hotTrends > 0) {
    markdown += `⚡ **Urgent:** ${hotTrends} hot trends require immediate action\n`;
  }
  
  return markdown;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main function to run GitHub Trending analysis
 */
export async function runGitHubTrending(): Promise<void> {
  console.log('📈 GitHub Trending - Starting...');
  
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });
  
  const allNiches = await loadNicheConfig();
  const niches = getEnabledNiches(allNiches);
  console.log(`📂 Found ${niches.length} enabled niches`);
  
  const results = [];
  
  for (const niche of niches) {
    console.log(`\n📈 Scanning trending: ${niche.id}`);
    
    // Scan trending repos
    console.log(`  → Searching GitHub trending...`);
    const repos = await scanTrendingRepos(
      octokit,
      niche.monitoring.github_topics,
      niche.monitoring.keywords
    );
    
    console.log(`  → Found ${repos.length} trending repositories`);
    
    // Analyze trends
    const analyses: TrendAnalysis[] = [];
    for (const repo of repos) {
      const analysis = analyzeTrend(repo, niche.monitoring.keywords);
      
      // Only include if has meaningful trend score
      if (analysis.trendScore >= 40) {
        analyses.push(analysis);
      }
    }
    
    console.log(`  → Found ${analyses.length} significant trends`);
    
    // Generate report
    const report = generateReport(niche.id, niche.name, analyses);
    
    // Save report
    const date = new Date().toISOString().split('T')[0];
    const filename = `data/reports/github-trending-${niche.id}-${date}.md`;
    fs.mkdirSync('data/reports', { recursive: true });
    fs.writeFileSync(filename, report);
    
    console.log(`  → Report saved: ${filename}`);
    
    const hotTrends = analyses.filter(a => a.trendScore >= 80).length;
    
    results.push({
      niche: niche.id,
      trends: analyses.length,
      hot: hotTrends,
      file: filename
    });
  }
  
  console.log('\n✅ Complete!');
  console.log(`Generated ${results.length} reports`);
  
  // Summary
  results.forEach(r => {
    console.log(`  - ${r.niche}: ${r.trends} trends (${r.hot} hot)`);
  });
}
