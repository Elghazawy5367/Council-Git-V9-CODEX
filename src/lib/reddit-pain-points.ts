/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Reddit Pain Points - Market Gap Pattern Detector
 * 
 * Extracts complaint patterns from Reddit posts across multiple niches.
 * Finds PATTERNS of complaints = validated market gaps = product opportunities.
 * 
 * Multi-niche configuration support via config/target-niches.yaml
 */

import * as fs from 'fs';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

// ============================================================================
// INTERFACES
// ============================================================================

interface PainPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  url: string;
  created_utc: number;
  score: number;
  num_comments: number;
}

interface ExtractedPain {
  pain: string;
  category: string;
  source_posts: string[];
  user_count: number;
  first_seen: number;
  last_seen: number;
}

interface PainPattern {
  pain: ExtractedPain;
  frequencyScore: number;
  recencyScore: number;
  diversityScore: number;
  totalScore: number;
  opportunity: string;
  examplePosts: string[];
}

// ============================================================================
// REDDIT API SEARCH FOR PAIN SIGNALS
// ============================================================================

async function searchPainSignals(
  subreddit: string,
  painKeywords: string[]
): Promise<PainPost[]> {
  const posts: PainPost[] = [];
  
  // Default pain keywords if not provided
  const defaultPainKeywords = [
    'sucks', 'terrible', 'awful', 'broken', "doesn't work",
    'frustrated', 'hate', 'wish', 'missing', "doesn't have"
  ];
  
  const keywords = painKeywords.length > 0 ? painKeywords : defaultPainKeywords;
  
  // Remove 'r/' prefix if present
  const cleanSubreddit = subreddit.replace(/^r\//, '');
  
  try {
    for (const keyword of keywords.slice(0, 5)) {
      const query = `${keyword}`;
      const url = `https://www.reddit.com/r/${cleanSubreddit}/search.json?` +
        `q=${encodeURIComponent(query)}` +
        `&restrict_sr=1` +
        `&sort=new` +
        `&t=month` +
        `&limit=100`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Council-App/1.0 (Pain Point Analysis)'
        }
      });
      
      if (!response.ok) {
        console.error(`Reddit API error for r/${cleanSubreddit}:`, response.status);
        continue;
      }
      
      const data = await response.json();
      
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
          num_comments: child.data.num_comments
        }));
        
        posts.push(...redditPosts);
      }
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Deduplicate
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
// PAIN POINT EXTRACTION
// ============================================================================

function extractPainPoints(posts: PainPost[]): Map<string, ExtractedPain> {
  const painMap = new Map<string, ExtractedPain>();
  
  const painPatterns = {
    feature_gap: [
      "doesn't have",
      "doesn't support",
      "missing",
      "wish it had",
      "if only",
      "needs",
      "lacks"
    ],
    ux_problem: [
      "hard to",
      "difficult to",
      "confusing",
      "complicated",
      "not intuitive"
    ],
    performance: [
      "slow",
      "buggy",
      "crashes",
      "broken",
      "doesn't work"
    ],
    pricing: [
      "expensive",
      "too costly",
      "overpriced",
      "can't afford"
    ],
    integration: [
      "doesn't integrate",
      "no api",
      "can't connect",
      "no support for"
    ]
  };
  
  for (const post of posts) {
    const fullText = `${post.title} ${post.selftext}`.toLowerCase();
    
    // Extract sentences with pain signals
    const sentences = fullText.split(/[.!?]/);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) continue;
      
      // Determine category
      let category = 'general';
      for (const [cat, patterns] of Object.entries(painPatterns)) {
        if (patterns.some(pattern => trimmed.includes(pattern))) {
          category = cat;
          break;
        }
      }
      
      // Normalize pain point (remove common words, lowercase)
      const normalized = trimmed
        .replace(/\b(i|my|the|a|an|is|are|was|were|be|been|being)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (normalized.length < 15) continue;
      
      // Check if we've seen this pain before (fuzzy matching)
      let existingKey: string | null = null;
      for (const [key] of painMap) {
        if (similarity(normalized, key) > 0.7) {
          existingKey = key;
          break;
        }
      }
      
      if (existingKey) {
        // Update existing pain
        const existing = painMap.get(existingKey)!;
        if (!existing.source_posts.includes(post.id)) {
          existing.source_posts.push(post.id);
          existing.user_count++;
        }
        existing.last_seen = Math.max(existing.last_seen, post.created_utc);
      } else {
        // New pain point
        painMap.set(normalized, {
          pain: trimmed,
          category,
          source_posts: [post.id],
          user_count: 1,
          first_seen: post.created_utc,
          last_seen: post.created_utc
        });
      }
    }
  }
  
  return painMap;
}

// Simple string similarity (Jaccard)
function similarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================

function analyzePainPatterns(
  painMap: Map<string, ExtractedPain>,
  allPosts: PainPost[]
): PainPattern[] {
  const patterns: PainPattern[] = [];
  
  const now = Date.now() / 1000;
  
  for (const [_, pain] of painMap) {
    const pattern: PainPattern = {
      pain,
      frequencyScore: 0,
      recencyScore: 0,
      diversityScore: 0,
      totalScore: 0,
      opportunity: '',
      examplePosts: []
    };
    
    // FREQUENCY SCORE (0-50)
    const mentions = pain.source_posts.length;
    if (mentions >= 20) {
      pattern.frequencyScore = 50;
    } else if (mentions >= 10) {
      pattern.frequencyScore = 30;
    } else if (mentions >= 5) {
      pattern.frequencyScore = 15;
    } else if (mentions >= 2) {
      pattern.frequencyScore = 5;
    }
    
    // RECENCY SCORE (0-30)
    const daysSinceLastMention = (now - pain.last_seen) / (60 * 60 * 24);
    if (daysSinceLastMention <= 30) {
      pattern.recencyScore = 30;
    } else if (daysSinceLastMention <= 60) {
      pattern.recencyScore = 20;
    } else if (daysSinceLastMention <= 90) {
      pattern.recencyScore = 10;
    }
    
    // DIVERSITY SCORE (0-20)
    const uniqueUsers = pain.user_count;
    if (uniqueUsers >= 10) {
      pattern.diversityScore = 20;
    } else if (uniqueUsers >= 5) {
      pattern.diversityScore = 15;
    } else if (uniqueUsers >= 3) {
      pattern.diversityScore = 10;
    } else if (uniqueUsers >= 2) {
      pattern.diversityScore = 5;
    }
    
    // TOTAL SCORE
    pattern.totalScore = pattern.frequencyScore + 
                        pattern.recencyScore + 
                        pattern.diversityScore;
    
    // Generate opportunity
    pattern.opportunity = generateOpportunity(pain, pattern);
    
    // Get example posts
    pattern.examplePosts = pain.source_posts.slice(0, 5);
    
    patterns.push(pattern);
  }
  
  return patterns;
}

function generateOpportunity(pain: ExtractedPain, pattern: PainPattern): string {
  const opportunities = [];
  
  if (pattern.totalScore >= 80) {
    opportunities.push('🔥 MAJOR OPPORTUNITY: High frequency + recent + many users');
  } else if (pattern.totalScore >= 60) {
    opportunities.push('📈 STRONG SIGNAL: Consistent pattern worth addressing');
  }
  
  if (pain.category === 'feature_gap') {
    opportunities.push('💡 BUILD: Add this missing feature to your product');
  } else if (pain.category === 'ux_problem') {
    opportunities.push('🎨 IMPROVE: Make this easier/more intuitive');
  } else if (pain.category === 'performance') {
    opportunities.push('⚡ OPTIMIZE: Build faster/more reliable version');
  } else if (pain.category === 'pricing') {
    opportunities.push('💰 UNDERCUT: Offer better pricing/value');
  } else if (pain.category === 'integration') {
    opportunities.push('🔌 INTEGRATE: Add this integration');
  }
  
  if (pattern.frequencyScore >= 30) {
    opportunities.push(`✅ VALIDATED: ${pain.source_posts.length} mentions = proven demand`);
  }
  
  return opportunities.length > 0
    ? opportunities.join('\n')
    : 'Monitor for increasing frequency';
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

function generateReport(
  nicheId: string,
  nicheName: string,
  patterns: PainPattern[],
  allPosts: PainPost[]
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Reddit Pain Points Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Pain Patterns Found:** ${patterns.length}\n`;
  markdown += `**Posts Analyzed:** ${allPosts.length}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## 💬 What are Pain Point Patterns?\n\n`;
  markdown += `Multiple people complaining about the SAME thing = validated market gap.\n`;
  markdown += `Build solutions that address these patterns.\n\n`;
  markdown += `**Pain Scoring:**\n`;
  markdown += `- 80-100: 🔥🔥🔥 Major opportunity - build this\n`;
  markdown += `- 60-79: 🔥🔥 Strong signal - worth addressing\n`;
  markdown += `- 40-59: 🔥 Moderate pattern - monitor\n\n`;
  markdown += `---\n\n`;
  
  // Sort by total score
  const sorted = patterns.sort((a, b) => b.totalScore - a.totalScore);
  
  sorted.slice(0, 20).forEach((item, index) => {
    const { pain } = item;
    
    const painText = pain.pain.length > 100 ? `${pain.pain.substring(0, 100)}...` : pain.pain;
    markdown += `## ${index + 1}. ${painText}\n\n`;
    
    markdown += `**Pain Score:** ${item.totalScore}/100 `;
    if (item.totalScore >= 80) markdown += '🔥🔥🔥';
    else if (item.totalScore >= 60) markdown += '🔥🔥';
    else if (item.totalScore >= 40) markdown += '🔥';
    markdown += '\n\n';
    
    markdown += `**Category:** ${pain.category.replace('_', ' ')}\n`;
    markdown += `**Mentions:** ${pain.source_posts.length}\n`;
    markdown += `**Unique Users:** ${pain.user_count}\n`;
    markdown += `**First Seen:** ${new Date(pain.first_seen * 1000).toLocaleDateString()}\n`;
    markdown += `**Last Seen:** ${new Date(pain.last_seen * 1000).toLocaleDateString()}\n\n`;
    
    markdown += `**Pain Breakdown:**\n`;
    markdown += `- Frequency Score: ${item.frequencyScore}/50\n`;
    markdown += `- Recency Score: ${item.recencyScore}/30\n`;
    markdown += `- Diversity Score: ${item.diversityScore}/20\n\n`;
    
    markdown += `**🎯 Opportunity:**\n`;
    markdown += `${item.opportunity}\n\n`;
    
    markdown += `**📝 Example Complaints:**\n`;
    const examplePosts = allPosts.filter(p => item.examplePosts.includes(p.id));
    examplePosts.slice(0, 3).forEach(post => {
      markdown += `  - "${post.title}" (r/${post.subreddit})\n`;
    });
    markdown += '\n';
    
    markdown += `---\n\n`;
  });
  
  // Summary by category
  markdown += `## 📊 Summary by Category\n\n`;
  
  const categories = new Map<string, number>();
  for (const pattern of patterns) {
    const cat = pattern.pain.category;
    categories.set(cat, (categories.get(cat) || 0) + 1);
  }
  
  markdown += `| Category | Count | Top Issue |\n`;
  markdown += `|----------|-------|----------|\n`;
  
  for (const [category, count] of categories) {
    const topInCategory = sorted.find(p => p.pain.category === category);
    const topPain = topInCategory?.pain.pain || 'N/A';
    const topIssue = topPain.length > 50 ? `${topPain.substring(0, 50)}...` : topPain;
    markdown += `| ${category.replace('_', ' ')} | ${count} | ${topIssue} |\n`;
  }
  
  markdown += '\n';
  
  // Top 3 opportunities
  markdown += `## 🔥 Top 3 Product Opportunities\n\n`;
  sorted.slice(0, 3).forEach((item, i) => {
    markdown += `**${i + 1}. ${item.pain.category.replace('_', ' ').toUpperCase()}**\n`;
    const painText = item.pain.pain.length > 100 ? `${item.pain.pain.substring(0, 100)}...` : item.pain.pain;
    markdown += `- Pain: ${painText}\n`;
    markdown += `- Mentions: ${item.pain.source_posts.length}\n`;
    markdown += `- Score: ${item.totalScore}/100\n`;
    markdown += `- Action: ${item.opportunity.split('\n')[0]}\n\n`;
  });
  
  return markdown;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function runRedditPainPoints(): Promise<void> {

  const allNiches = await loadNicheConfig();
  const niches = getEnabledNiches(allNiches);

  const results: Array<{
    niche: string;
    patterns: number;
    major: number;
    file: string;
  }> = [];
  
  for (const niche of niches) {

    const allPosts: PainPost[] = [];
    
    // Get subreddits (with backward compatibility)
    const subreddits = niche.monitoring?.subreddits || niche.subreddits || [];
    
    // Get pain signals (optional field)
    const painSignals = niche.monitoring?.pain_signals || niche.pain_signals || [];
    
    // Search each subreddit
    for (const subreddit of subreddits) {

      const posts = await searchPainSignals(
        subreddit,
        painSignals
      );
      
            allPosts.push(...posts);
    }
    

    // Extract pain points
        const painMap = extractPainPoints(allPosts);

    // Analyze patterns
    const patterns = analyzePainPatterns(painMap, allPosts);
    
    // Filter for meaningful patterns (score >= 40)
    const meaningfulPatterns = patterns.filter(p => p.totalScore >= 40);

    // Generate report
    const report = generateReport(niche.id, niche.name, meaningfulPatterns, allPosts);
    
    // Save report
    const date = new Date().toISOString().split('T')[0];
    const filename = `data/reports/reddit-pain-points-${niche.id}-${date}.md`;
    fs.mkdirSync('data/reports', { recursive: true });
    fs.writeFileSync(filename, report);
    

    const majorOpportunities = meaningfulPatterns.filter(p => p.totalScore >= 80).length;
    
    results.push({
      niche: niche.id,
      patterns: meaningfulPatterns.length,
      major: majorOpportunities,
      file: filename
    });
  }
  

  // Summary
  results.forEach(r => {
      });
}
