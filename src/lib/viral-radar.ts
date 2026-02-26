/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Viral Radar - Trending Content Scanner
 * 
 * Scans Reddit and HackerNews for viral content trending RIGHT NOW.
 * Uses public APIs - no authentication required.
 * 
 * Priority: HIGH
 * Effort: Medium
 */

import * as fs from 'fs';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

// Configuration constants
const API_REQUEST_DELAY_MS = 2000; // Delay between consecutive API requests (rate limiting)
const MAX_SUBREDDITS_PER_NICHE = 3; // Limit subreddits to scan per niche
const MIN_SCORE_REDDIT_ALL = 500; // Minimum score for r/all posts
const MIN_SCORE_REDDIT_NICHE = 100; // Minimum score for niche subreddit posts
const MIN_SCORE_HACKERNEWS = 50; // Minimum score for HackerNews stories
const MIN_VIRAL_SCORE = 40; // Minimum viral score for report inclusion
const MIN_KEYWORD_LENGTH = 4; // Minimum word length for cross-platform matching

interface NicheConfig {
  id: string;
  name: string;
  monitoring: {
    keywords: string[];
    subreddits: string[];
  };
  enabled?: boolean;
}

interface YamlConfig {
  niches: NicheConfig[];
}

interface ViralContent {
  platform: string;
  title: string;
  url: string;
  score: number;
  comments: number;
  created: number;
  age_hours: number;
  growth_rate: number;
  source: string;
}

interface ViralAnalysis {
  content: ViralContent;
  viralScore: number;
  growthScore: number;
  engagementScore: number;
  recencyScore: number;
  crossPlatformScore: number;
  opportunity: string;
  contentIdeas: string[];
}

/**
 * Scan Reddit for trending content
 */
async function scanRedditTrending(
  keywords: string[],
  subreddits: string[]
): Promise<ViralContent[]> {
  const viralContent: ViralContent[] = [];
  
  try {
    // Scan r/all hot posts
    console.log('    → Checking r/all hot...');
    const allUrl = 'https://www.reddit.com/r/all/hot.json?limit=100';
    const allResponse = await fetch(allUrl, {
      headers: {
        'User-Agent': 'Council-App/1.0 (Viral Radar)'
      }
    });
    
    if (!allResponse.ok) {
      console.error('    ✗ Reddit API error:', allResponse.status);
      return viralContent;
    }
    
    const allData = await allResponse.json();
    
    // Filter for niche keywords
    if (allData?.data?.children) {
      for (const child of allData.data.children) {
        const post = child.data;
        const titleLower = post.title.toLowerCase();
        const selftextLower = (post.selftext || '').toLowerCase();
        
        // Check if contains niche keywords
        const matchesKeywords = keywords.some(keyword =>
          titleLower.includes(keyword.toLowerCase()) ||
          selftextLower.includes(keyword.toLowerCase())
        );
        
        if (matchesKeywords && post.score > MIN_SCORE_REDDIT_ALL) {
          const ageHours = (Date.now() / 1000 - post.created_utc) / 3600;
          const growthRate = post.score / Math.max(ageHours, 1);
          
          viralContent.push({
            platform: 'Reddit',
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            score: post.score,
            comments: post.num_comments,
            created: post.created_utc,
            age_hours: ageHours,
            growth_rate: growthRate,
            source: `r/${post.subreddit}`
          });
        }
      }
    }
    
    console.log(`    ✓ Found ${viralContent.length} items from r/all`);
    
    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
    
    // Scan niche-specific subreddits
    for (const subreddit of subreddits.slice(0, MAX_SUBREDDITS_PER_NICHE)) {
      const cleanSubreddit = subreddit.replace(/^r\//, '');
      console.log(`    → Checking r/${cleanSubreddit}...`);
      
      const subUrl = `https://www.reddit.com/r/${cleanSubreddit}/top.json?t=day&limit=50`;
      const subResponse = await fetch(subUrl, {
        headers: {
          'User-Agent': 'Council-App/1.0 (Viral Radar)'
        }
      });
      
      if (!subResponse.ok) {
        console.log(`    ✗ Skipped r/${cleanSubreddit}`);
        continue;
      }
      
      const subData = await subResponse.json();
      
      if (subData?.data?.children) {
        let subredditCount = 0;
        for (const child of subData.data.children) {
          const post = child.data;
          const ageHours = (Date.now() / 1000 - post.created_utc) / 3600;
          const growthRate = post.score / Math.max(ageHours, 1);
          
          // Only include if posted in last 24 hours and has good engagement
          if (ageHours < 24 && post.score > MIN_SCORE_REDDIT_NICHE) {
            viralContent.push({
              platform: 'Reddit',
              title: post.title,
              url: `https://reddit.com${post.permalink}`,
              score: post.score,
              comments: post.num_comments,
              created: post.created_utc,
              age_hours: ageHours,
              growth_rate: growthRate,
              source: `r/${post.subreddit}`
            });
            subredditCount++;
          }
        }
        console.log(`    ✓ Found ${subredditCount} items from r/${cleanSubreddit}`);
      }
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
    }
    
  } catch (error: any) {
    console.error('    ✗ Error scanning Reddit:', error.message);
  }
  
  return viralContent;
}

/**
 * Scan HackerNews for trending content
 */
async function scanHackerNewsTrending(
  keywords: string[]
): Promise<ViralContent[]> {
  const viralContent: ViralContent[] = [];
  
  try {
    console.log('    → Checking HackerNews front page...');
    const url = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30';
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('    ✗ HN API error:', response.status);
      return viralContent;
    }
    
    const data = await response.json();
    
    if (data?.hits) {
      for (const hit of data.hits) {
        const titleLower = (hit.title || '').toLowerCase();
        
        // Check if contains niche keywords
        const matchesKeywords = keywords.some(keyword =>
          titleLower.includes(keyword.toLowerCase())
        );
        
        if (matchesKeywords && hit.points > MIN_SCORE_HACKERNEWS) {
          const created = new Date(hit.created_at).getTime() / 1000;
          const ageHours = (Date.now() / 1000 - created) / 3600;
          const growthRate = hit.points / Math.max(ageHours, 1);
          
          viralContent.push({
            platform: 'HackerNews',
            title: hit.title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            score: hit.points,
            comments: hit.num_comments || 0,
            created,
            age_hours: ageHours,
            growth_rate: growthRate,
            source: 'HN Front Page'
          });
        }
      }
    }
    
    console.log(`    ✓ Found ${viralContent.length} items from HN`);
    
  } catch (error: any) {
    console.error('    ✗ Error scanning HackerNews:', error.message);
  }
  
  return viralContent;
}

/**
 * Analyze virality of content
 */
function analyzeVirality(
  content: ViralContent,
  allContent: ViralContent[]
): ViralAnalysis {
  const analysis: ViralAnalysis = {
    content,
    viralScore: 0,
    growthScore: 0,
    engagementScore: 0,
    recencyScore: 0,
    crossPlatformScore: 0,
    opportunity: '',
    contentIdeas: []
  };
  
  // GROWTH RATE SCORE (0-40)
  if (content.growth_rate > 1000) {
    analysis.growthScore = 40;
  } else if (content.growth_rate > 500) {
    analysis.growthScore = 30;
  } else if (content.growth_rate > 100) {
    analysis.growthScore = 20;
  } else if (content.growth_rate > 50) {
    analysis.growthScore = 10;
  }
  
  // ENGAGEMENT SCORE (0-30)
  const engagementRatio = content.comments / Math.max(content.score, 1);
  if (engagementRatio > 0.3) {
    analysis.engagementScore = 30;
  } else if (engagementRatio > 0.2) {
    analysis.engagementScore = 20;
  } else if (engagementRatio > 0.1) {
    analysis.engagementScore = 10;
  }
  
  // RECENCY SCORE (0-20)
  if (content.age_hours < 3) {
    analysis.recencyScore = 20;
  } else if (content.age_hours < 6) {
    analysis.recencyScore = 15;
  } else if (content.age_hours < 12) {
    analysis.recencyScore = 10;
  } else if (content.age_hours < 24) {
    analysis.recencyScore = 5;
  }
  
  // CROSS-PLATFORM SCORE (0-10)
  // Check if similar topic on other platforms
  const titleWords = content.title.toLowerCase().split(' ').filter(w => w.length > MIN_KEYWORD_LENGTH);
  const similarContent = allContent.filter(other =>
    other.platform !== content.platform &&
    titleWords.some(word => other.title.toLowerCase().includes(word))
  );
  
  if (similarContent.length >= 2) {
    analysis.crossPlatformScore = 10;
  } else if (similarContent.length >= 1) {
    analysis.crossPlatformScore = 7;
  } else {
    analysis.crossPlatformScore = 3;
  }
  
  // TOTAL SCORE
  analysis.viralScore = analysis.growthScore + 
                       analysis.engagementScore + 
                       analysis.recencyScore + 
                       analysis.crossPlatformScore;
  
  // Generate opportunity
  analysis.opportunity = generateOpportunity(content, analysis);
  
  // Generate content ideas
  analysis.contentIdeas = generateContentIdeas(content);
  
  return analysis;
}

function generateOpportunity(content: ViralContent, analysis: ViralAnalysis): string {
  const opportunities = [];
  
  if (analysis.viralScore >= 80) {
    opportunities.push('🔥 EXTREMELY VIRAL: Create content NOW while trending');
  } else if (analysis.viralScore >= 60) {
    opportunities.push('📈 TRENDING: Good opportunity to ride the wave');
  }
  
  if (analysis.recencyScore >= 15) {
    opportunities.push('⚡ FRESH: Still early, maximum reach potential');
  }
  
  if (analysis.crossPlatformScore >= 7) {
    opportunities.push('🌐 CROSS-PLATFORM: Topic trending on multiple sites');
  }
  
  if (content.growth_rate > 500) {
    opportunities.push('🚀 RAPID GROWTH: Exponential engagement happening');
  }
  
  return opportunities.length > 0
    ? opportunities.join('\n')
    : 'Monitor for continued growth';
}

function generateContentIdeas(content: ViralContent): string[] {
  const ideas = [];
  
  // Based on what's going viral, suggest content to create
  ideas.push(`Create response/commentary on: "${content.title}"`);
  ideas.push(`Write tutorial based on viral topic`);
  ideas.push(`Create tool/solution mentioned in discussion`);
  
  if (content.platform === 'Reddit') {
    ideas.push(`Reply to top comments with your solution`);
    ideas.push(`Create similar content in your niche subreddits`);
  }
  
  if (content.platform === 'HackerNews') {
    ideas.push(`Build on the idea with technical implementation`);
    ideas.push(`Create "Show HN" with similar concept`);
  }
  
  return ideas;
}

/**
 * Generate markdown report
 */
function generateReport(
  nicheId: string,
  nicheName: string,
  analyses: ViralAnalysis[]
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Viral Radar Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Viral Content Found:** ${analyses.length}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## 📡 What is Viral Content?\n\n`;
  markdown += `Content experiencing rapid, exponential growth in engagement.\n`;
  markdown += `Capitalize on viral trends for 10-100x organic reach.\n\n`;
  markdown += `**Viral Scoring:**\n`;
  markdown += `- 80-100: 🔥🔥🔥 Extremely viral - act NOW\n`;
  markdown += `- 60-79: 🔥🔥 Trending - good opportunity\n`;
  markdown += `- 40-59: 🔥 Growing - monitor\n\n`;
  markdown += `---\n\n`;
  
  // Sort by viral score
  const sorted = analyses.sort((a, b) => b.viralScore - a.viralScore);
  
  sorted.slice(0, 20).forEach((item, index) => {
    const { content, viralScore } = item;
    
    markdown += `## ${index + 1}. ${content.title}\n\n`;
    
    markdown += `**Viral Score:** ${viralScore}/100 `;
    if (viralScore >= 80) markdown += '🔥🔥🔥';
    else if (viralScore >= 60) markdown += '🔥🔥';
    else if (viralScore >= 40) markdown += '🔥';
    markdown += '\n\n';
    
    markdown += `**Platform:** ${content.platform}\n`;
    markdown += `**Source:** ${content.source}\n`;
    markdown += `**Score:** ${content.score.toLocaleString()}\n`;
    markdown += `**Comments:** ${content.comments}\n`;
    markdown += `**Age:** ${content.age_hours.toFixed(1)} hours\n`;
    markdown += `**Growth Rate:** ${Math.round(content.growth_rate)} points/hour\n\n`;
    
    markdown += `**Viral Metrics:**\n`;
    markdown += `- Growth Score: ${item.growthScore}/40\n`;
    markdown += `- Engagement Score: ${item.engagementScore}/30\n`;
    markdown += `- Recency Score: ${item.recencyScore}/20\n`;
    markdown += `- Cross-Platform Score: ${item.crossPlatformScore}/10\n\n`;
    
    markdown += `**🎯 Opportunity:**\n`;
    markdown += `${item.opportunity}\n\n`;
    
    markdown += `**💡 Content Ideas:**\n`;
    item.contentIdeas.slice(0, 5).forEach(idea => {
      markdown += `  - ${idea}\n`;
    });
    markdown += '\n';
    
    markdown += `**🔗 Link:** ${content.url}\n\n`;
    markdown += `---\n\n`;
  });
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  const extremelyViral = analyses.filter(a => a.viralScore >= 80).length;
  const trending = analyses.filter(a => a.viralScore >= 60 && a.viralScore < 80).length;
  const crossPlatform = analyses.filter(a => a.crossPlatformScore >= 7).length;
  
  markdown += `**Extremely Viral (80+):** ${extremelyViral}\n`;
  markdown += `**Trending (60-79):** ${trending}\n`;
  markdown += `**Cross-Platform:** ${crossPlatform}\n\n`;
  
  if (extremelyViral > 0) {
    markdown += `⚡ **Urgent Action:** Create content on ${extremelyViral} extremely viral topics NOW\n`;
  }
  
  return markdown;
}

/**
 * Main function - Run Viral Radar
 */
export async function runViralRadar(): Promise<void> {
  console.log('📡 Viral Radar - Starting...');
  
  const allNiches = await loadNicheConfig();
  const niches = getEnabledNiches(allNiches);
  console.log(`📂 Found ${niches.length} enabled niches`);
  
  const results = [];
  
  for (const niche of niches) {
    console.log(`\n📡 Scanning viral content: ${niche.id}`);
    
    // Scan Reddit
    console.log(`  → Scanning Reddit...`);
    const redditContent = await scanRedditTrending(
      niche.monitoring.keywords,
      niche.monitoring.subreddits
    );
    console.log(`  ✓ Total Reddit items: ${redditContent.length}`);
    
    // Scan HackerNews
    console.log(`  → Scanning HackerNews...`);
    const hnContent = await scanHackerNewsTrending(niche.monitoring.keywords);
    console.log(`  ✓ Total HN items: ${hnContent.length}`);
    
    // Combine all content
    const allContent = [...redditContent, ...hnContent];
    
    // Analyze virality
    const analyses: ViralAnalysis[] = [];
    for (const content of allContent) {
      const analysis = analyzeVirality(content, allContent);
      
      // Only include if has meaningful viral score
      if (analysis.viralScore >= MIN_VIRAL_SCORE) {
        analyses.push(analysis);
      }
    }
    
    console.log(`  ✓ Found ${analyses.length} viral items (score ≥ 40)`);
    
    // Generate report
    const report = generateReport(niche.id, niche.name, analyses);
    
    // Save report
    const date = new Date().toISOString().split('T')[0];
    const filename = `data/reports/viral-radar-${niche.id}-${date}.md`;
    fs.mkdirSync('data/reports', { recursive: true });
    fs.writeFileSync(filename, report);
    
    console.log(`  ✓ Report saved: ${filename}`);
    
    const extremelyViral = analyses.filter(a => a.viralScore >= 80).length;
    
    results.push({
      niche: niche.id,
      items: analyses.length,
      extremelyViral,
      file: filename
    });
  }
  
  console.log('\n✅ Viral Radar Complete!');
  console.log(`📊 Generated ${results.length} reports`);
  
  // Summary
  results.forEach(r => {
    console.log(`  - ${r.niche}: ${r.items} viral items (${r.extremelyViral} extremely viral)`);
  });
}