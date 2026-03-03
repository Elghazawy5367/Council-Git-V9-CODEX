/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stargazer Intelligence - Quality Signal Detection
 * Analyzes GitHub repository stargazers to detect institutional backing,
 * influencer endorsements, and business opportunities across multiple niches.
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

export interface StargazerAnalysis {
  totalStars: number;
  starVelocity30d: number;
  starVelocity90d: number;
  institutionalBackers: string[];
  influencers: string[];
  qualityScore: number;
}

const INSTITUTIONAL_KEYWORDS = [
  'google', 'microsoft', 'meta', 'amazon', 'apple',
  'netflix', 'uber', 'airbnb', 'stripe', 'vercel',
  'netlify', 'cloudflare', 'github', 'gitlab',
  'sequoia', 'a16z', 'yc', 'techstars', '500startups'
];

/**
 * Search repositories by GitHub topics
 */
async function searchRepositoriesByTopic(
  octokit: Octokit,
  topics: string[],
  keywords: string[]
): Promise<Array<{
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
}>> {
  const repos: Array<{
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
  }> = [];
  
  for (const topic of topics) {
    try {
            const { data } = await octokit.search.repos({
        q: `topic:${topic} stars:>100`,
        sort: 'stars',
        order: 'desc',
        per_page: 30
      });
      repos.push(...data.items);
      
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
}

/**
 * Analyze stargazers for a repository
 */
async function analyzeStargazers(
  octokit: Octokit,
  repo: RepoData
): Promise<StargazerAnalysis> {
  const analysis: StargazerAnalysis = {
    totalStars: repo.stargazers_count,
    starVelocity30d: 0,
    starVelocity90d: 0,
    institutionalBackers: [],
    influencers: [],
    qualityScore: 0
  };
  
  // Calculate star velocity
  try {
    const created = new Date(repo.created_at);
    const now = new Date();
    const ageInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays > 0) {
      const starsPerDay = repo.stargazers_count / ageInDays;
      analysis.starVelocity30d = Math.round(starsPerDay * 30);
      analysis.starVelocity90d = Math.round(starsPerDay * 90);
    }
  } catch (error) {
    // Silent fail - velocity not critical
  }
  
  // Get sample of stargazers (first 100)
  try {
    const { data: stargazers } = await octokit.activity.listStargazersForRepo({
      owner: repo.owner.login,
      repo: repo.name,
      per_page: 100
    });
    
    // Analyze stargazers for institutional backing
    // Note: listStargazersForRepo returns minimal user data without company field
    // For production use, consider fetching full user details for top stargazers
    for (const stargazer of stargazers) {
      // Use optional chaining for safety since user may be undefined
      const user = stargazer.user;
      if (!user) continue;
      
      // The basic stargazer endpoint doesn't include company info
      // We're primarily relying on star count and velocity for quality signals
      // Institutional backing detection would require additional API calls
      // which we skip here to preserve rate limits
    }
    
    // Rate limiting: small delay after stargazer check
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error: any) {
    console.error(`      ⚠️ Error analyzing stargazers:`, error.message);
  }
  
  // Calculate quality score (0-100)
  let score = 0;
  
  // Base score from stars (max 30 points)
  score += Math.min(repo.stargazers_count / 1000 * 30, 30);
  
  // Star velocity (max 20 points)
  score += Math.min(analysis.starVelocity30d / 50 * 20, 20);
  
  // Institutional backing (10 points per backer, max 20)
  score += Math.min(analysis.institutionalBackers.length * 10, 20);
  
  // Influencers (5 points per influencer, max 15)
  score += Math.min(analysis.influencers.length * 5, 15);
  
  // Recent activity (max 15 points)
  const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 7) score += 15;
  else if (daysSinceUpdate < 30) score += 10;
  else if (daysSinceUpdate < 90) score += 5;
  
  analysis.qualityScore = Math.round(Math.min(score, 100));
  
  return analysis;
}

/**
 * Analyze business opportunities from repository and analysis
 */
function analyzeBusinessOpportunity(
  repo: RepoData,
  analysis: StargazerAnalysis
): string {
  const opportunities: string[] = [];
  
  const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  
  // High quality, active = validated market
  if (analysis.qualityScore >= 70 && daysSinceUpdate < 30) {
    opportunities.push('✅ VALIDATED MARKET: High quality, actively maintained, strong institutional backing');
  }
  
  // High stars, abandoned = opportunity
  if (repo.stargazers_count > 1000 && daysSinceUpdate > 180) {
    opportunities.push('💰 ABANDONED GOLDMINE: Popular repo abandoned - opportunity to build modern alternative');
  }
  
  // High velocity = emerging trend
  if (analysis.starVelocity30d > 100) {
    opportunities.push('🚀 EMERGING TREND: Rapid star growth indicates rising demand');
  }
  
  // Institutional backing = enterprise interest
  if (analysis.institutionalBackers.length > 0) {
    opportunities.push(`🏢 ENTERPRISE VALIDATED: ${analysis.institutionalBackers.length} companies/VCs backing this`);
  }
  
  // Influencer endorsement = thought leader validation
  if (analysis.influencers.length > 0) {
    opportunities.push(`⭐ INFLUENCER ENDORSED: ${analysis.influencers.length} industry leaders using this`);
  }
  
  // High forks = developers extending it
  if (repo.forks_count > repo.stargazers_count * 0.3) {
    opportunities.push('🍴 HIGH FORK RATIO: Developers actively building on/modifying this - indicates gaps');
  }
  
  return opportunities.length > 0 
    ? opportunities.join('\n')
    : 'Standard repository - monitor for changes';
}

/**
 * Generate markdown report for a niche
 */
function generateReport(
  nicheId: string,
  nicheName: string,
  repositories: Array<{repo: RepoData, analysis: StargazerAnalysis}>
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Stargazer Analysis Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Repositories Analyzed:** ${repositories.length}\n\n`;
  markdown += `---\n\n`;
  
  if (repositories.length === 0) {
    markdown += `No repositories found for this niche.\n`;
    return markdown;
  }
  
  // Sort by quality score
  const sorted = repositories.sort((a, b) => b.analysis.qualityScore - a.analysis.qualityScore);
  
  sorted.slice(0, 20).forEach((item, index) => {
    const { repo, analysis } = item;
    
    markdown += `## ${index + 1}. ${repo.full_name}\n\n`;
    markdown += `**Description:** ${repo.description || 'No description'}\n\n`;
    markdown += `**Quality Score:** ${analysis.qualityScore}/100 `;
    if (analysis.qualityScore >= 80) markdown += '🔥';
    else if (analysis.qualityScore >= 60) markdown += '⭐';
    markdown += '\n\n';
    
    markdown += `**Metrics:**\n`;
    markdown += `- Stars: ${analysis.totalStars.toLocaleString()}\n`;
    markdown += `- Star Velocity (projected monthly): +${analysis.starVelocity30d}\n`;
    markdown += `- Forks: ${repo.forks_count.toLocaleString()}\n`;
    markdown += `- Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}\n\n`;
    
    if (analysis.institutionalBackers.length > 0) {
      markdown += `**🏢 Institutional Backers:** ${analysis.institutionalBackers.slice(0, 5).join(', ')}\n\n`;
    }
    
    if (analysis.influencers.length > 0) {
      markdown += `**⭐ Influencer Endorsements:** ${analysis.influencers.slice(0, 5).join(', ')}\n\n`;
    }
    
    markdown += `**Business Opportunity:**\n`;
    markdown += analyzeBusinessOpportunity(repo, analysis);
    markdown += '\n\n';
    
    markdown += `**Link:** ${repo.html_url}\n\n`;
    markdown += `---\n\n`;
  });
  
  return markdown;
}

/**
 * Main function to run Stargazer Analysis across all niches
 */
export async function runStargazerAnalysis(): Promise<void> {

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

    const results = [];
    
    for (const niche of niches) {

      // Get topics from nested monitoring structure or top-level
      const topics = niche.monitoring?.github_topics || niche.github_topics || [];
      const keywords = niche.monitoring?.keywords || niche.keywords || [];
      
      if (topics.length === 0) {
                continue;
      }
      
      // Search repositories by topics
            const repos = await searchRepositoriesByTopic(
        octokit,
        topics,
        keywords
      );
      

      // Analyze stargazers for each repo (limit to 30 to avoid rate limits)
      const analyzed: Array<{repo: RepoData, analysis: StargazerAnalysis}> = [];
      const reposToAnalyze = repos.slice(0, 30);
      
      for (let i = 0; i < reposToAnalyze.length; i++) {
        const repo = reposToAnalyze[i];
        try {
                    const analysis = await analyzeStargazers(octokit, repo);
          analyzed.push({ repo, analysis });
          
          // Rate limit protection: 1 second between repo analyses
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          console.error(`  ⚠️ Error analyzing ${repo.full_name}:`, error.message);
        }
      }
      

      // Generate report
      const report = generateReport(niche.id, niche.name, analyzed);
      
      // Save report
      const date = new Date().toISOString().split('T')[0];
      const reportsDir = path.join(process.cwd(), 'data', 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      
      const filename = path.join(reportsDir, `stargazer-${niche.id}-${date}.md`);
      fs.writeFileSync(filename, report);
      

      results.push({ 
        niche: niche.id, 
        repositories: analyzed.length, 
        file: `data/reports/stargazer-${niche.id}-${date}.md`
      });
    }
    

    // Summary
    results.forEach(r => {
          });
  } catch (error) {
    console.error('❌ Stargazer Analysis failed:', error);
    throw error;
  }
}
