/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Quality Pipeline - Intelligence Filtering
 * 
 * META feature that reads all intelligence reports, scores quality,
 * filters noise, and creates curated high-quality summaries.
 * 
 * Purpose: Transform 50+ daily reports into actionable top 10-20 opportunities
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

// ============================================================================
// TYPES
// ============================================================================

interface ReportItem {
  feature: string;
  title: string;
  baseScore: number;
  content: string;
  date: string;
  sourceFile: string;
}

interface QualityAnalysis {
  item: ReportItem;
  baseQuality: number;
  recencyBonus: number;
  signalBonus: number;
  validationBonus: number;
  totalQuality: number;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  reasoning: string[];
}

// ============================================================================
// REPORT LOADER
// ============================================================================

async function loadAllReports(
  nicheId: string,
  daysBack: number = 7
): Promise<ReportItem[]> {
  const items: ReportItem[] = [];
  const reportsDir = path.join(process.cwd(), 'data', 'reports');
  
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysBack);
  
  const features = [
    'mining-drill',
    'reddit-sniper',
    'reddit-pain-points',
    'viral-radar',
    'hackernews',
    'goldmine',
    'fork-evolution',
    'stargazer',
    'github-trending'
  ];
  
  for (const feature of features) {
    const pattern = path.join(reportsDir, `${feature}-${nicheId}-*.md`);
    const files = await glob(pattern);
    
    for (const file of files) {
      const match = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (!match) continue;
      
      const fileDate = new Date(match[1]);
      if (fileDate < threshold) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      const extracted = extractItemsFromReport(feature, content, match[1], file);
      items.push(...extracted);
    }
  }
  
  return items;
}

function extractItemsFromReport(
  feature: string,
  content: string,
  date: string,
  sourceFile: string
): ReportItem[] {
  const items: ReportItem[] = [];
  
  // Split by ## headings (individual items)
  const sections = content.split(/^## /m);
  
  for (const section of sections) {
    if (section.trim().length < 50) continue;
    
    const lines = section.split('\n');
    const title = lines[0]?.trim() || 'Untitled';
    
    // Skip summary sections
    if (title.toLowerCase().includes('summary') || 
        title.toLowerCase().includes('what is') ||
        title.toLowerCase().includes('what are') ||
        title.toLowerCase().includes('📊') ||
        title.toLowerCase().includes('🔍')) {
      continue;
    }
    
    // Extract base score based on feature
    let baseScore = 50; // default
    
    if (feature === 'reddit-sniper') {
      const scoreMatch = section.match(/Intent Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'reddit-pain-points') {
      const scoreMatch = section.match(/Pain Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'viral-radar') {
      const scoreMatch = section.match(/Viral Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'github-trending') {
      const scoreMatch = section.match(/Trend Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'goldmine') {
      const scoreMatch = section.match(/Goldmine Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'fork-evolution') {
      const scoreMatch = section.match(/Opportunity Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'stargazer') {
      const scoreMatch = section.match(/Quality Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'hackernews') {
      const scoreMatch = section.match(/HN Score:\*\*\s*(\d+)\/100/);
      baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } else if (feature === 'mining-drill') {
      // Mining Drill doesn't have explicit scores, estimate from indicators
      const criticalMatch = section.match(/Priority:\s*(Critical|High|Medium)/i);
      if (criticalMatch) {
        const priority = criticalMatch[1].toLowerCase();
        if (priority === 'critical') baseScore = 85;
        else if (priority === 'high') baseScore = 70;
        else baseScore = 55;
      }
    }
    
    items.push({
      feature,
      title,
      baseScore,
      content: section,
      date,
      sourceFile
    });
  }
  
  return items;
}

// ============================================================================
// QUALITY SCORER
// ============================================================================

function scoreQuality(item: ReportItem): QualityAnalysis {
  const analysis: QualityAnalysis = {
    item,
    baseQuality: 0,
    recencyBonus: 0,
    signalBonus: 0,
    validationBonus: 0,
    totalQuality: 0,
    tier: 'bronze',
    reasoning: []
  };
  
  // BASE QUALITY (0-60 points)
  // Normalize feature score (0-100) to 0-60
  analysis.baseQuality = Math.min(Math.round(item.baseScore * 0.6), 60);
  analysis.reasoning.push(`Base score from ${item.feature}: ${item.baseScore}/100`);
  
  // RECENCY BONUS (0-20 points)
  const itemDate = new Date(item.date);
  const now = new Date();
  const ageHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
  
  if (ageHours < 24) {
    analysis.recencyBonus = 20;
    analysis.reasoning.push('Posted <24h ago: +20 recency');
  } else if (ageHours < 72) {
    analysis.recencyBonus = 15;
    analysis.reasoning.push('Posted 1-3 days ago: +15 recency');
  } else if (ageHours < 168) {
    analysis.recencyBonus = 10;
    analysis.reasoning.push('Posted 3-7 days ago: +10 recency');
  } else {
    analysis.recencyBonus = 5;
    analysis.reasoning.push('Posted >7 days ago: +5 recency');
  }
  
  // SIGNAL STRENGTH (0-10 points)
  const content = item.content.toLowerCase();
  
  // High engagement indicators
  if (content.includes('comments') || content.includes('upvotes') || content.includes('stars')) {
    const commentMatch = content.match(/(\d+)\s*comments/);
    const upvoteMatch = content.match(/(\d+)\s*(upvotes|points|score)/);
    const starsMatch = content.match(/(\d+)\s*stars/);
    
    const comments = commentMatch ? parseInt(commentMatch[1]) : 0;
    const upvotes = upvoteMatch ? parseInt(upvoteMatch[1]) : 0;
    const stars = starsMatch ? parseInt(starsMatch[1]) : 0;
    
    if (comments > 100 || upvotes > 1000 || stars > 1000) {
      analysis.signalBonus = 10;
      analysis.reasoning.push('High engagement: +10 signal');
    } else if (comments > 50 || upvotes > 500 || stars > 500) {
      analysis.signalBonus = 7;
      analysis.reasoning.push('Moderate engagement: +7 signal');
    } else if (comments > 10 || upvotes > 100 || stars > 100) {
      analysis.signalBonus = 5;
      analysis.reasoning.push('Some engagement: +5 signal');
    } else {
      analysis.signalBonus = 2;
    }
  } else {
    analysis.signalBonus = 2;
  }
  
  // VALIDATION BONUS (0-10 points)
  if (content.includes('$') || content.includes('budget') || content.includes('willing to pay')) {
    analysis.validationBonus += 10;
    analysis.reasoning.push('Budget mentioned: +10 validation');
  } else if (content.includes('users') || content.includes('customers') || /\d+\s*(users|customers)/.test(content)) {
    analysis.validationBonus += 7;
    analysis.reasoning.push('Users mentioned: +7 validation');
  } else if (content.includes('company') || content.includes('team') || content.includes('startup')) {
    analysis.validationBonus += 7;
    analysis.reasoning.push('Company usage: +7 validation');
  } else if (content.includes('need') || content.includes('require') || content.includes('looking for')) {
    analysis.validationBonus += 5;
    analysis.reasoning.push('Specific needs: +5 validation');
  } else {
    analysis.validationBonus += 2;
  }
  
  analysis.validationBonus = Math.min(analysis.validationBonus, 10);
  
  // TOTAL QUALITY
  analysis.totalQuality = analysis.baseQuality + 
                         analysis.recencyBonus + 
                         analysis.signalBonus + 
                         analysis.validationBonus;
  
  // Determine tier
  if (analysis.totalQuality >= 90) {
    analysis.tier = 'platinum';
  } else if (analysis.totalQuality >= 80) {
    analysis.tier = 'gold';
  } else if (analysis.totalQuality >= 70) {
    analysis.tier = 'silver';
  } else {
    analysis.tier = 'bronze';
  }
  
  return analysis;
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

function generateReport(
  nicheId: string,
  nicheName: string,
  analyses: QualityAnalysis[]
): string {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Quality Pipeline Report: ${nicheName}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niche:** ${nicheId}\n`;
  markdown += `**Total Items Analyzed:** ${analyses.length}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## 🔍 What is Quality Pipeline?\n\n`;
  markdown += `Automatic quality scoring across all intelligence features.\n`;
  markdown += `Focus on high-quality signals, filter out noise.\n\n`;
  markdown += `**Quality Tiers:**\n`;
  markdown += `- 90-100: 💎 PLATINUM - Must pursue immediately\n`;
  markdown += `- 80-89: 🥇 GOLD - Strong opportunity\n`;
  markdown += `- 70-79: 🥈 SILVER - Worth considering\n`;
  markdown += `- <70: 🥉 BRONZE - Filtered out\n\n`;
  markdown += `---\n\n`;
  
  // Sort by quality
  const sorted = analyses.sort((a, b) => b.totalQuality - a.totalQuality);
  
  // Filter high-quality only (70+)
  const highQuality = sorted.filter(a => a.totalQuality >= 70);
  
  // Group by tier
  const platinum = highQuality.filter(a => a.tier === 'platinum');
  const gold = highQuality.filter(a => a.tier === 'gold');
  const silver = highQuality.filter(a => a.tier === 'silver');
  
  // Platinum tier
  if (platinum.length > 0) {
    markdown += `## 💎 PLATINUM TIER (90-100)\n\n`;
    markdown += `**Must pursue immediately**\n\n`;
    
    platinum.forEach((item, index) => {
      markdown += formatQualityItem(item, index + 1);
    });
  }
  
  // Gold tier
  if (gold.length > 0) {
    markdown += `## 🥇 GOLD TIER (80-89)\n\n`;
    markdown += `**Strong opportunities**\n\n`;
    
    gold.forEach((item, index) => {
      markdown += formatQualityItem(item, index + 1);
    });
  }
  
  // Silver tier
  if (silver.length > 0) {
    markdown += `## 🥈 SILVER TIER (70-79)\n\n`;
    markdown += `**Worth considering**\n\n`;
    
    silver.slice(0, 10).forEach((item, index) => {
      markdown += formatQualityItem(item, index + 1);
    });
    
    if (silver.length > 10) {
      markdown += `\n*Showing top 10 of ${silver.length} silver tier items*\n\n`;
    }
  }
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `| Tier | Count | Avg Quality |\n`;
  markdown += `|------|-------|-------------|\n`;
  markdown += `| 💎 Platinum | ${platinum.length} | ${avgQuality(platinum)}/100 |\n`;
  markdown += `| 🥇 Gold | ${gold.length} | ${avgQuality(gold)}/100 |\n`;
  markdown += `| 🥈 Silver | ${silver.length} | ${avgQuality(silver)}/100 |\n`;
  markdown += `| 🥉 Bronze (filtered) | ${sorted.length - highQuality.length} | <70 |\n`;
  markdown += '\n';
  
  // Priority actions
  if (platinum.length > 0) {
    markdown += `## ⚡ PRIORITY ACTIONS\n\n`;
    markdown += `**This Week:**\n`;
    platinum.slice(0, 3).forEach((item, i) => {
      markdown += `${i + 1}. ${item.item.title} (${item.item.feature})\n`;
    });
    markdown += '\n';
  }
  
  // Feature performance
  if (highQuality.length > 0) {
    markdown += `## 📈 Feature Performance\n\n`;
    const byFeature = highQuality.reduce((acc, item) => {
      if (!acc[item.item.feature]) {
        acc[item.item.feature] = [];
      }
      acc[item.item.feature].push(item);
      return acc;
    }, {} as Record<string, QualityAnalysis[]>);
    
    markdown += `| Feature | High-Quality Items | Avg Quality |\n`;
    markdown += `|---------|-------------------|-------------|\n`;
    Object.entries(byFeature)
      .sort((a, b) => avgQuality(b[1]) - avgQuality(a[1]))
      .forEach(([feature, items]) => {
        markdown += `| ${feature} | ${items.length} | ${avgQuality(items)}/100 |\n`;
      });
    markdown += '\n';
  }
  
  return markdown;
}

function formatQualityItem(analysis: QualityAnalysis, index: number): string {
  let markdown = `### ${index}. ${analysis.item.title}\n\n`;
  
  markdown += `**Quality Score:** ${analysis.totalQuality}/100 `;
  if (analysis.tier === 'platinum') markdown += '💎';
  else if (analysis.tier === 'gold') markdown += '🥇';
  else if (analysis.tier === 'silver') markdown += '🥈';
  markdown += '\n\n';
  
  markdown += `**Source:** ${analysis.item.feature}\n`;
  markdown += `**Date:** ${analysis.item.date}\n\n`;
  
  markdown += `**Quality Breakdown:**\n`;
  markdown += `- Base Quality: ${analysis.baseQuality}/60\n`;
  markdown += `- Recency Bonus: ${analysis.recencyBonus}/20\n`;
  markdown += `- Signal Strength: ${analysis.signalBonus}/10\n`;
  markdown += `- Validation: ${analysis.validationBonus}/10\n\n`;
  
  markdown += `**Why High Quality:**\n`;
  analysis.reasoning.forEach(reason => {
    markdown += `  - ${reason}\n`;
  });
  markdown += '\n';
  
  // Excerpt from original
  const excerpt = analysis.item.content.split('\n').slice(0, 5).join('\n');
  const excerptText = excerpt.substring(0, 200).trim();
  if (excerptText) {
    markdown += `**Excerpt:**\n`;
    markdown += `> ${excerptText}...\n\n`;
  }
  
  markdown += `**Source File:** ${path.basename(analysis.item.sourceFile)}\n\n`;
  markdown += `---\n\n`;
  
  return markdown;
}

function avgQuality(items: QualityAnalysis[]): number {
  if (items.length === 0) return 0;
  return Math.round(
    items.reduce((sum, i) => sum + i.totalQuality, 0) / items.length
  );
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

export async function runQualityPipeline(): Promise<void> {

  const allNiches = await loadNicheConfig();
  const niches = getEnabledNiches(allNiches);

  const results = [];
  
  for (const niche of niches) {

    // Load all reports
        const items = await loadAllReports(niche.id, 7);

    if (items.length === 0) {
            continue;
    }
    
    // Score quality
        const analyses = items.map(item => scoreQuality(item));
    
    // Filter high-quality
    const highQuality = analyses.filter(a => a.totalQuality >= 70);

    const platinum = highQuality.filter(a => a.tier === 'platinum').length;
    const gold = highQuality.filter(a => a.tier === 'gold').length;
    

    // Generate report
    const report = generateReport(niche.id, niche.name, analyses);
    
    // Save report
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(process.cwd(), 'data', 'intelligence', `quality-pipeline-${niche.id}-${date}.md`);
    fs.mkdirSync(path.join(process.cwd(), 'data', 'intelligence'), { recursive: true });
    fs.writeFileSync(filename, report);
    

    results.push({
      niche: niche.id,
      total: items.length,
      highQuality: highQuality.length,
      platinum,
      gold,
      file: filename
    });
  }
  

  // Summary
  if (results.length > 0) {
        results.forEach(r => {
          });
  }
}
