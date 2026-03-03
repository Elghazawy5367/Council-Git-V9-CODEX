/**
 * Reddit Sniper - High-Intent Buying Signal Detector
 * 
 * Detects Reddit posts with high buying intent across multiple niches.
 * Scores posts 0-100 based on intent signals and generates actionable reports.
 * 
 * Multi-niche configuration support via config/target-niches.yaml
 */

import * as fs from 'fs';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

// ============================================================================
// INTERFACES
// ============================================================================

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  url: string;
  created_utc: number;
  score: number;
  num_comments: number;
  permalink: string;
}

interface IntentAnalysis {
  intentScore: number;
  buyingSignals: string[];
  specificNeeds: string[];
  budget: string | null;
  timeframe: string | null;
  currentSolution: string | null;
  recommendedAction: string;
}

// ============================================================================
// REDDIT API SEARCH
// ============================================================================

async function searchReddit(
  subreddit: string,
  keywords: string[]
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  
  // Remove 'r/' prefix if present
  const cleanSubreddit = subreddit.replace(/^r\//, '');
  
  try {
    // Search using top 3 keywords to avoid rate limiting
    for (const keyword of keywords.slice(0, 3)) {
      const query = `${keyword} (looking OR need OR recommend OR best)`;
      const url = `https://www.reddit.com/r/${cleanSubreddit}/search.json?` +
        `q=${encodeURIComponent(query)}` +
        `&restrict_sr=1` +
        `&sort=new` +
        `&t=week` +
        `&limit=100`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Council-App/1.0 (Intelligence Gathering)'
        }
      });
      
      if (!response.ok) {
        console.error(`Reddit API error: ${response.status}`);
        continue;
      }
      
      const data = await response.json() as any;
      
      if (data?.data?.children) {
        const redditPosts = data.data.children.map((child: any) => ({
          id: child.data.id,
          title: child.data.title,
          selftext: child.data.selftext,
          author: child.data.author,
          subreddit: child.data.subreddit,
          url: `https://reddit.com${child.data.permalink}`,
          created_utc: child.data.created_utc,
          score: child.data.score,
          num_comments: child.data.num_comments,
          permalink: child.data.permalink
        }));
        
        posts.push(...redditPosts);
      }
      
      // Rate limit protection: 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Deduplicate by post ID
    const uniquePosts = Array.from(
      new Map(posts.map(p => [p.id, p])).values()
    );
    
    return uniquePosts;
    
  } catch (error: any) {
    console.error(`Error searching r/${cleanSubreddit}:`, error.message);
    return [];
  }
}

// ============================================================================
// INTENT SCORING SYSTEM
// ============================================================================

function analyzeIntent(post: RedditPost): IntentAnalysis {
  const analysis: IntentAnalysis = {
    intentScore: 0,
    buyingSignals: [],
    specificNeeds: [],
    budget: null,
    timeframe: null,
    currentSolution: null,
    recommendedAction: ''
  };
  
  const titleLower = post.title.toLowerCase();
  const bodyLower = post.selftext.toLowerCase();
  const fullText = `${titleLower} ${bodyLower}`;
  
  // BASE SCORE (0-50 points)
  if (titleLower.includes('looking for')) {
    analysis.intentScore += 20;
    analysis.buyingSignals.push('Looking for solution');
  }
  if (titleLower.includes('need')) {
    analysis.intentScore += 15;
    analysis.buyingSignals.push('Expressed need');
  }
  if (titleLower.includes('recommend') || titleLower.includes('suggestion')) {
    analysis.intentScore += 15;
    analysis.buyingSignals.push('Asking for recommendations');
  }
  if (titleLower.includes('?')) {
    analysis.intentScore += 10;
  }
  
  // BUDGET SIGNAL (0-20 points)
  const budgetPatterns = [
    /\$\d+/,
    /budget.*\$\d+/i,
    /willing to pay/i,
    /price range/i,
    /up to \$/i
  ];
  
  for (const pattern of budgetPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      analysis.budget = match[0];
      if (fullText.match(/\$\d+/)) {
        analysis.intentScore += 20;
      } else {
        analysis.intentScore += 15;
      }
      analysis.buyingSignals.push(`Budget mentioned: ${match[0]}`);
      break;
    }
  }
  
  // URGENCY SIGNAL (0-15 points)
  if (fullText.includes('asap') || fullText.includes('urgent')) {
    analysis.intentScore += 15;
    analysis.timeframe = 'ASAP';
    analysis.buyingSignals.push('Urgent need');
  } else if (fullText.includes('deadline') || fullText.includes('soon')) {
    analysis.intentScore += 10;
    analysis.timeframe = 'Soon';
    analysis.buyingSignals.push('Time-sensitive');
  } else if (fullText.includes('next week') || fullText.includes('this month')) {
    analysis.intentScore += 5;
    const match = fullText.match(/(next week|this month|next month)/i);
    analysis.timeframe = match ? match[0] : 'Near-term';
  }
  
  // DETAIL SIGNAL (0-15 points)
  const requirementPatterns = [
    'need it to',
    'must have',
    'looking for something that',
    'want to be able to',
    'should support',
    'needs to',
    'has to'
  ];
  
  let requirementCount = 0;
  for (const pattern of requirementPatterns) {
    if (fullText.includes(pattern)) {
      requirementCount++;
      const sentences = post.selftext.split(/[.!?]/);
      const matching = sentences.find(s => 
        s.toLowerCase().includes(pattern)
      );
      if (matching && matching.trim().length > 10) {
        analysis.specificNeeds.push(matching.trim());
      }
    }
  }
  
  if (requirementCount >= 3) {
    analysis.intentScore += 15;
  } else if (requirementCount >= 2) {
    analysis.intentScore += 10;
  } else if (requirementCount >= 1) {
    analysis.intentScore += 5;
  }
  
  // Detect current solution
  const solutionPatterns = [
    /currently using (\w+)/i,
    /switching from (\w+)/i,
    /tried (\w+) but/i,
    /alternative to (\w+)/i
  ];
  
  for (const pattern of solutionPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      analysis.currentSolution = match[1];
      break;
    }
  }
  
  // Determine recommended action
  if (analysis.intentScore >= 80) {
    analysis.recommendedAction = 'HIGH PRIORITY: Reply with solution immediately';
  } else if (analysis.intentScore >= 60) {
    analysis.recommendedAction = 'MEDIUM PRIORITY: Reply if you have exact solution';
  } else if (analysis.intentScore >= 40) {
    analysis.recommendedAction = 'LOW PRIORITY: Monitor for more details';
  } else {
    analysis.recommendedAction = 'SKIP: Intent too low';
  }
  
  return analysis;
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

function generateReport(
  nicheId: string,
  nicheName: string,
  signals: Array<{post: RedditPost, analysis: IntentAnalysis}>
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Reddit Sniper Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**High-Intent Signals:** ${signals.length}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## 🎯 What is a High-Intent Signal?\n\n`;
  markdown += `Reddit posts where users are actively looking for solutions RIGHT NOW.\n`;
  markdown += `These are your hottest leads - people ready to buy.\n\n`;
  markdown += `**Intent Scoring:**\n`;
  markdown += `- 80-100: 🔥🔥🔥 Reply immediately\n`;
  markdown += `- 60-79: 🔥🔥 Strong interest\n`;
  markdown += `- 40-59: 🔥 Moderate interest\n\n`;
  markdown += `---\n\n`;
  
  // Sort by intent score
  const sorted = signals.sort((a, b) => b.analysis.intentScore - a.analysis.intentScore);
  
  sorted.forEach((item, index) => {
    const { post, analysis } = item;
    
    markdown += `## ${index + 1}. ${post.title}\n\n`;
    
    markdown += `**Intent Score:** ${analysis.intentScore}/100 `;
    if (analysis.intentScore >= 80) markdown += '🔥🔥🔥';
    else if (analysis.intentScore >= 60) markdown += '🔥🔥';
    else if (analysis.intentScore >= 40) markdown += '🔥';
    markdown += '\n\n';
    
    markdown += `**Post Details:**\n`;
    markdown += `- Subreddit: r/${post.subreddit}\n`;
    markdown += `- Author: u/${post.author}\n`;
    markdown += `- Score: ${post.score} upvotes\n`;
    markdown += `- Comments: ${post.num_comments}\n`;
    markdown += `- Posted: ${new Date(post.created_utc * 1000).toLocaleDateString()}\n\n`;
    
    if (analysis.buyingSignals.length > 0) {
      markdown += `**🎯 Buying Signals:**\n`;
      analysis.buyingSignals.forEach(signal => {
        markdown += `  - ${signal}\n`;
      });
      markdown += '\n';
    }
    
    if (analysis.budget) {
      markdown += `**💰 Budget:** ${analysis.budget}\n\n`;
    }
    
    if (analysis.timeframe) {
      markdown += `**⏰ Timeframe:** ${analysis.timeframe}\n\n`;
    }
    
    if (analysis.currentSolution) {
      markdown += `**🔄 Current Solution:** ${analysis.currentSolution}\n\n`;
    }
    
    if (analysis.specificNeeds.length > 0) {
      markdown += `**📋 Specific Needs:**\n`;
      analysis.specificNeeds.slice(0, 5).forEach(need => {
        markdown += `  - ${need}\n`;
      });
      markdown += '\n';
    }
    
    if (post.selftext && post.selftext.length > 50) {
      markdown += `**Post Content:**\n`;
      markdown += `> ${post.selftext.substring(0, 500)}${post.selftext.length > 500 ? '...' : ''}\n\n`;
    }
    
    markdown += `**✅ Recommended Action:**\n`;
    markdown += `${analysis.recommendedAction}\n\n`;
    
    if (analysis.intentScore >= 60) {
      markdown += `**💡 Reply Template:**\n`;
      markdown += `\`\`\`\n`;
      markdown += `Hey! I saw you're looking for [solution].\n\n`;
      markdown += `I actually built [your product] specifically for this.\n`;
      markdown += `It handles [specific needs mentioned].\n\n`;
      markdown += `Happy to answer any questions!\n`;
      markdown += `\`\`\`\n\n`;
    }
    
    markdown += `**🔗 Link:** ${post.url}\n\n`;
    markdown += `---\n\n`;
  });
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  const highIntent = signals.filter(s => s.analysis.intentScore >= 80).length;
  const mediumIntent = signals.filter(s => s.analysis.intentScore >= 60 && s.analysis.intentScore < 80).length;
  const withBudget = signals.filter(s => s.analysis.budget).length;
  
  markdown += `**High-Intent Signals (80+):** ${highIntent}\n`;
  markdown += `**Medium-Intent Signals (60-79):** ${mediumIntent}\n`;
  markdown += `**Posts with Budget:** ${withBudget}\n\n`;
  
  if (highIntent > 0) {
    markdown += `⚡ **Action Required:** Reply to ${highIntent} high-intent posts immediately\n`;
  }
  
  return markdown;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function runRedditSniper(): Promise<void> {

  const allNiches = await loadNicheConfig();
  const niches = getEnabledNiches(allNiches);

  const results = [];
  
  for (const niche of niches) {

    const allSignals: Array<{post: RedditPost, analysis: IntentAnalysis}> = [];
    
    // Get subreddits and keywords from nested monitoring structure
    const subreddits = niche.monitoring?.subreddits || niche.subreddits || [];
    const keywords = niche.monitoring?.keywords || niche.keywords || [];
    
    // Search each subreddit
    for (const subreddit of subreddits) {
      const cleanSubreddit = subreddit.replace(/^r\//, '');

      const posts = await searchReddit(subreddit, keywords);

      // Analyze each post
      for (const post of posts) {
        const analysis = analyzeIntent(post);
        
        // Only include if has meaningful intent (40+ score)
        if (analysis.intentScore >= 40) {
          allSignals.push({ post, analysis });
        }
      }
      
      // Rate limit protection: 2 seconds between subreddit searches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    

    // Generate report
    const report = generateReport(niche.id, niche.name, allSignals);
    
    // Save report
    const date = new Date().toISOString().split('T')[0];
    const filename = `data/reports/reddit-sniper-${niche.id}-${date}.md`;
    fs.mkdirSync('data/reports', { recursive: true });
    fs.writeFileSync(filename, report);
    

    const highIntent = allSignals.filter(s => s.analysis.intentScore >= 80).length;
    
    results.push({
      niche: niche.id,
      signals: allSignals.length,
      highIntent,
      file: filename
    });
  }
  

  // Summary
  results.forEach(r => {
      });
}