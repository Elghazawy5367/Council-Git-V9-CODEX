/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * HackerNews Intelligence - Tech Trends & Buying Signals
 * Extracts pain points, buying signals, and validation from HackerNews
 * using multi-niche configuration from config/target-niches.yaml
 */

import * as fs from 'fs';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

export interface HNStory {
  objectID: string;
  title: string;
  url: string;
  points: number;
  num_comments: number;
  created_at: string;
  author: string;
}

export interface HNComment {
  text: string;
  author: string;
  points?: number;
}

export interface ExtractedSignals {
  painPoints: string[];
  buyingSignals: string[];
  productMentions: string[];
  validations: string[];
}

export interface StoryAnalysis {
  story: HNStory;
  engagementScore: number;
  commentQualityScore: number;
  signalScore: number;
  totalScore: number;
  signals: ExtractedSignals;
}

/**
 * Search HackerNews using Algolia API
 */
async function searchHackerNews(
  keywords: string[],
  minPoints: number = 50
): Promise<HNStory[]> {
  const stories: HNStory[] = [];
  
  // Search last 90 days
  const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
  
  // Combine keywords into search queries
  const queries = [
    keywords.join(' OR '),
    `"Show HN" ${keywords[0]}`,
    `"Ask HN" ${keywords[0]}`,
    keywords.slice(0, 2).join(' ')
  ];
  
  for (const query of queries) {
    try {
      const url = `https://hn.algolia.com/api/v1/search?` +
        `query=${encodeURIComponent(query)}` +
        `&tags=story` +
        `&numericFilters=points>${minPoints},created_at_i>${ninetyDaysAgo}` +
        `&hitsPerPage=30`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.hits) {
        stories.push(...data.hits);
      }
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`Error searching HN for "${query}":`, error.message);
    }
  }
  
  // Deduplicate by objectID
  const uniqueStories = Array.from(
    new Map(stories.map(s => [s.objectID, s])).values()
  );
  
  return uniqueStories;
}

/**
 * Fetch story comments from HackerNews
 */
async function fetchStoryComments(storyId: string): Promise<HNComment[]> {
  try {
    const url = `https://hn.algolia.com/api/v1/items/${storyId}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const comments: HNComment[] = [];
    
    function extractComments(commentNode: any): void {
      if (commentNode.text) {
        comments.push({
          text: commentNode.text,
          author: commentNode.author,
          points: commentNode.points
        });
      }
      
      if (commentNode.children) {
        commentNode.children.forEach((child: any) => extractComments(child));
      }
    }
    
    if (data.children) {
      data.children.forEach((child: any) => extractComments(child));
    }
    
    return comments;
  } catch (error: any) {
    console.error(`Error fetching comments for ${storyId}:`, error.message);
    return [];
  }
}

/**
 * Helper to strip HTML and split into sentences
 */
function stripHtmlAndSplit(text: string): { cleanText: string; sentences: string[] } {
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  const sentences = cleanText.split(/[.!?]/);
  return { cleanText, sentences };
}

/**
 * Extract signals from comments
 */
function extractSignals(comments: HNComment[]): ExtractedSignals {
  const signals: ExtractedSignals = {
    painPoints: [],
    buyingSignals: [],
    productMentions: [],
    validations: []
  };
  
  const painKeywords = [
    'frustrated', 'annoying', 'terrible', 'awful',
    'wish there was', 'if only', 'why doesn\'t',
    'the problem with', 'broken', 'doesn\'t work',
    'hate how', 'painful to', 'difficult to'
  ];
  
  const buyingKeywords = [
    'would pay', 'i\'d pay', 'shut up and take my money',
    '$', 'pricing', 'where can i buy', 'just bought',
    'switched from', 'now using', 'at our company', 'we use'
  ];
  
  const validationKeywords = [
    'saved us', 'increased our', 'reduced our',
    'been using for', 'solved our problem',
    'works great', 'highly recommend'
  ];
  
  for (const comment of comments) {
    // Strip HTML once and reuse
    const { cleanText, sentences } = stripHtmlAndSplit(comment.text);
    const lowerText = cleanText.toLowerCase();
    
    // Extract pain points
    for (const keyword of painKeywords) {
      if (lowerText.includes(keyword)) {
        const matching = sentences.find(s => 
          s.toLowerCase().includes(keyword)
        );
        if (matching && matching.trim().length > 10 && matching.trim().length < 300) {
          signals.painPoints.push(matching.trim());
          break;
        }
      }
    }
    
    // Extract buying signals
    for (const keyword of buyingKeywords) {
      if (lowerText.includes(keyword)) {
        const matching = sentences.find(s => 
          s.toLowerCase().includes(keyword)
        );
        if (matching && matching.trim().length > 10 && matching.trim().length < 300) {
          signals.buyingSignals.push(matching.trim());
          break;
        }
      }
    }
    
    // Extract validations
    for (const keyword of validationKeywords) {
      if (lowerText.includes(keyword)) {
        const matching = sentences.find(s => 
          s.toLowerCase().includes(keyword)
        );
        if (matching && matching.trim().length > 10 && matching.trim().length < 300) {
          signals.validations.push(matching.trim());
          break;
        }
      }
    }
  }
  
  return signals;
}

/**
 * Analyze a story with scoring
 */
async function analyzeStory(story: HNStory): Promise<StoryAnalysis> {
  const analysis: StoryAnalysis = {
    story,
    engagementScore: 0,
    commentQualityScore: 0,
    signalScore: 0,
    totalScore: 0,
    signals: {
      painPoints: [],
      buyingSignals: [],
      productMentions: [],
      validations: []
    }
  };
  
  // Engagement score (0-40)
  if (story.points >= 500) {
    analysis.engagementScore = 40;
  } else if (story.points >= 200) {
    analysis.engagementScore = 30;
  } else if (story.points >= 100) {
    analysis.engagementScore = 20;
  } else if (story.points >= 50) {
    analysis.engagementScore = 10;
  }
  
  // Comment quality score (0-30)
  if (story.num_comments >= 60) {
    analysis.commentQualityScore = 30;
  } else if (story.num_comments >= 30) {
    analysis.commentQualityScore = 20;
  } else if (story.num_comments >= 10) {
    analysis.commentQualityScore = 10;
  }
  
  // Fetch and analyze comments
  const comments = await fetchStoryComments(story.objectID);
  analysis.signals = extractSignals(comments);
  
  // Signal score (0-30)
  if (analysis.signals.painPoints.length > 0) {
    analysis.signalScore += 10;
  }
  if (analysis.signals.buyingSignals.length > 0) {
    analysis.signalScore += 10;
  }
  if (analysis.signals.validations.length > 0) {
    analysis.signalScore += 10;
  }
  
  // Total score
  analysis.totalScore = analysis.engagementScore + 
                       analysis.commentQualityScore + 
                       analysis.signalScore;
  
  return analysis;
}

/**
 * Analyze business opportunity from story and signals
 */
function analyzeBusinessOpportunity(story: HNStory, signals: ExtractedSignals): string {
  const opportunities = [];
  
  if (signals.buyingSignals.length > 0) {
    opportunities.push('💰 BUYING INTENT: Users expressing willingness to pay');
  }
  
  if (signals.painPoints.length >= 3) {
    opportunities.push('😫 CLEAR PAIN: Multiple users frustrated with current solutions');
  }
  
  if (signals.validations.length > 0) {
    opportunities.push('✅ VALIDATED: Users confirm this solves real problem');
  }
  
  if (story.title.toLowerCase().includes('show hn')) {
    opportunities.push('🚀 NEW PRODUCT: Fresh product launch to learn from');
  }
  
  return opportunities.length > 0
    ? opportunities.join('\n')
    : 'Monitor for community sentiment and product fit';
}

/**
 * Generate markdown report
 */
function generateReport(
  nicheId: string,
  nicheName: string,
  analyses: StoryAnalysis[]
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# HackerNews Intelligence Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Stories Analyzed:** ${analyses.length}\n\n`;
  markdown += `---\n\n`;
  
  // Sort by total score
  const sorted = analyses.sort((a, b) => b.totalScore - a.totalScore);
  
  sorted.slice(0, 20).forEach((item, index) => {
    const { story, signals, totalScore } = item;
    
    markdown += `## ${index + 1}. ${story.title}\n\n`;
    
    markdown += `**HN Score:** ${totalScore}/100 `;
    if (totalScore >= 80) markdown += '🔥🔥🔥';
    else if (totalScore >= 60) markdown += '🔥🔥';
    else if (totalScore >= 40) markdown += '🔥';
    markdown += '\n\n';
    
    markdown += `**Engagement:**\n`;
    markdown += `- Points: ${story.points}\n`;
    markdown += `- Comments: ${story.num_comments}\n`;
    markdown += `- Author: ${story.author}\n`;
    markdown += `- Date: ${new Date(story.created_at).toLocaleDateString()}\n\n`;
    
    if (signals.painPoints.length > 0) {
      markdown += `**😫 Pain Points Mentioned:**\n`;
      signals.painPoints.slice(0, 5).forEach(pain => {
        markdown += `  - "${pain}"\n`;
      });
      markdown += '\n';
    }
    
    if (signals.buyingSignals.length > 0) {
      markdown += `**💰 Buying Signals:**\n`;
      signals.buyingSignals.slice(0, 5).forEach(signal => {
        markdown += `  - "${signal}"\n`;
      });
      markdown += '\n';
    }
    
    if (signals.validations.length > 0) {
      markdown += `**✅ Validation Signals:**\n`;
      signals.validations.slice(0, 3).forEach(validation => {
        markdown += `  - "${validation}"\n`;
      });
      markdown += '\n';
    }
    
    markdown += `**Business Opportunity:**\n`;
    markdown += analyzeBusinessOpportunity(story, signals);
    markdown += '\n\n';
    
    markdown += `**Links:**\n`;
    markdown += `- HN Discussion: https://news.ycombinator.com/item?id=${story.objectID}\n`;
    if (story.url) {
      markdown += `- Original: ${story.url}\n`;
    }
    markdown += '\n';
    
    markdown += `---\n\n`;
  });
  
  return markdown;
}

/**
 * Main function - Run HackerNews Intelligence
 */
export async function runHackerNewsIntelligence(): Promise<void> {

  const allNiches = await loadNicheConfig();
  const niches = getEnabledNiches(allNiches);

  const results = [];
  
  for (const niche of niches) {

    // Get keywords from monitoring config (with fallback)
    const keywords = niche.monitoring?.keywords || niche.keywords || [];
    
    if (keywords.length === 0) {
            continue;
    }
    
    // Search HN stories
        const stories = await searchHackerNews(keywords);
    

    // Analyze top stories
    const analyses: StoryAnalysis[] = [];
    for (const story of stories.slice(0, 25)) {
      try {
                const analysis = await analyzeStory(story);
        
        // Only include if has some signal value
        if (analysis.totalScore >= 30) {
          analyses.push(analysis);
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error: any) {
        console.error(`  ⚠️ Error analyzing story:`, error.message);
      }
    }
    

    // Generate report
    const report = generateReport(niche.id, niche.name, analyses);
    
    // Save report
    const date = new Date().toISOString().split('T')[0];
    const filename = `data/reports/hackernews-${niche.id}-${date}.md`;
    fs.mkdirSync('data/reports', { recursive: true });
    fs.writeFileSync(filename, report);
    

    results.push({
      niche: niche.id,
      stories: analyses.length,
      file: filename
    });
  }
  

  // Summary
  results.forEach(r => {
      });
}
