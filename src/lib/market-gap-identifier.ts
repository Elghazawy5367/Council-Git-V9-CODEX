/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Market Gap Identifier - META-FEATURE
 * 
 * Cross-platform analysis to find underserved markets by analyzing reports
 * from all other features (Mining Drill, Reddit Sniper, Pain Points, etc.)
 * 
 * This is NOT a direct platform scanner. It SYNTHESIZES existing reports to find GAPS.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { NicheConfig } from './types';
import { loadNicheConfig, getEnabledNiches } from './config-loader';

// ============================================================================
// INTERFACES
// ============================================================================

interface ReportData {
  feature: string;
  niche: string;
  date: string;
  content: string;
}

interface DemandSignals {
  miningDrillPainPoints: number;
  redditSniperHighIntent: number;
  redditPainPatterns: number;
  hackerNewsBuyingSignals: number;
  totalDemandScore: number;
  evidenceLinks: string[];
}

interface SupplySignals {
  goldmineActiveTools: number;
  forkEvolutionActiveForks: number;
  stargazerQualityRepos: number;
  trendingNewTools: number;
  totalSupplyScore: number;
  existingTools: string[];
}

interface MarketGap {
  niche: string;
  demandSignals: DemandSignals;
  supplySignals: SupplySignals;
  gapScore: number;
  opportunityScore: number;
  category: 'blue_ocean' | 'underserved' | 'growing' | 'saturated' | 'no_opportunity';
  recommendation: string;
  businessModels: string[];
}

// ============================================================================
// REPORT LOADER
// ============================================================================

async function loadRecentReports(nicheId: string, daysBack: number = 7): Promise<ReportData[]> {
  const reports: ReportData[] = [];
  const reportsDir = path.join(process.cwd(), 'data', 'reports');
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysBack);
  
  const features = [
    'mining-drill', 
    'reddit-sniper', 
    'reddit-pain-points', 
    'hackernews', 
    'goldmine', 
    'fork-evolution', 
    'stargazer', 
    'viral-radar',
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
      reports.push({
        feature,
        niche: nicheId,
        date: match[1],
        content
      });
    }
  }
  
  return reports;
}

// ============================================================================
// DEMAND SIGNAL EXTRACTION
// ============================================================================

function extractDemandSignals(reports: ReportData[]): DemandSignals {
  const signals: DemandSignals = {
    miningDrillPainPoints: 0,
    redditSniperHighIntent: 0,
    redditPainPatterns: 0,
    hackerNewsBuyingSignals: 0,
    totalDemandScore: 0,
    evidenceLinks: []
  };
  
  for (const report of reports) {
    const content = report.content;
    
    // Mining Drill: Count pain points (## 1., ## 2., etc.)
    if (report.feature === 'mining-drill') {
      const painMatches = content.match(/##\s+\d+\./g);
      if (painMatches) {
        signals.miningDrillPainPoints += painMatches.length;
        signals.evidenceLinks.push(`Mining Drill (${report.date}): ${painMatches.length} pain points`);
      }
    }
    
    // Reddit Sniper: Count high-intent posts (Intent Score: 80+)
    if (report.feature === 'reddit-sniper') {
      const intentMatches = content.match(/Intent Score:\*\*\s*(\d+)\/100/g);
      if (intentMatches) {
        const highIntent = intentMatches.filter(m => {
          const score = parseInt(m.match(/\d+/)?.[0] || '0');
          return score >= 80;
        }).length;
        if (highIntent > 0) {
          signals.redditSniperHighIntent += highIntent;
          signals.evidenceLinks.push(`Reddit Sniper (${report.date}): ${highIntent} high-intent buyers`);
        }
      }
    }
    
    // Reddit Pain Points: Count major patterns (Pain Score: 80+)
    if (report.feature === 'reddit-pain-points') {
      const patternMatches = content.match(/Pain Score:\*\*\s*(\d+)\/100/g);
      if (patternMatches) {
        const highPain = patternMatches.filter(m => {
          const score = parseInt(m.match(/\d+/)?.[0] || '0');
          return score >= 80;
        }).length;
        if (highPain > 0) {
          signals.redditPainPatterns += highPain;
          signals.evidenceLinks.push(`Reddit Pain Points (${report.date}): ${highPain} major patterns`);
        }
      }
    }
    
    // HackerNews: Count buying signals
    if (report.feature === 'hackernews') {
      const buyingMatches = content.match(/💰 Buying Signals:/g);
      if (buyingMatches) {
        signals.hackerNewsBuyingSignals += buyingMatches.length;
        signals.evidenceLinks.push(`HackerNews (${report.date}): ${buyingMatches.length} buying signals`);
      }
    }
  }
  
  // Calculate total demand score (0-100)
  signals.totalDemandScore = Math.min(
    (signals.miningDrillPainPoints * 0.5) +      // Max 40 points (80 pain points * 0.5)
    (signals.redditSniperHighIntent * 2) +       // Max 20 points (10 high-intent * 2)
    (signals.redditPainPatterns * 2) +           // Max 20 points (10 patterns * 2)
    (signals.hackerNewsBuyingSignals * 1),       // Max 20 points (20 signals * 1)
    100
  );
  
  return signals;
}

// ============================================================================
// SUPPLY SIGNAL EXTRACTION
// ============================================================================

function extractSupplySignals(reports: ReportData[]): SupplySignals {
  const signals: SupplySignals = {
    goldmineActiveTools: 0,
    forkEvolutionActiveForks: 0,
    stargazerQualityRepos: 0,
    trendingNewTools: 0,
    totalSupplyScore: 0,
    existingTools: []
  };
  
  for (const report of reports) {
    const content = report.content;
    
    // Goldmine: Count abandoned tools (fewer = less supply = better gap)
    // Logic: If Goldmine finds abandoned tools, market has SOME activity
    if (report.feature === 'goldmine') {
      const goldmineMatches = content.match(/##\s+\d+\./g);
      if (goldmineMatches) {
        // More abandoned tools = more market activity = higher supply
        signals.goldmineActiveTools += goldmineMatches.length;
      }
    }
    
    // Fork Evolution: Count active forks
    if (report.feature === 'fork-evolution') {
      const forkMatches = content.match(/Active Forks.*?:\s*(\d+)/g);
      if (forkMatches) {
        const totalForks = forkMatches.reduce((sum, m) => {
          const num = parseInt(m.match(/\d+/)?.[0] || '0');
          return sum + num;
        }, 0);
        signals.forkEvolutionActiveForks += totalForks;
      }
    }
    
    // Stargazer: Count quality repos (Quality Score: 70+)
    if (report.feature === 'stargazer') {
      const qualityMatches = content.match(/Quality Score:\*\*\s*(\d+)\/100/g);
      if (qualityMatches) {
        const quality = qualityMatches.filter(m => {
          const score = parseInt(m.match(/\d+/)?.[0] || '0');
          return score >= 70;
        }).length;
        signals.stargazerQualityRepos += quality;
        
        // Extract repo names as existing tools
        const repoMatches = content.match(/##\s+\d+\.\s+([\w-]+\/[\w-]+)/g);
        if (repoMatches) {
          const repos = repoMatches.map(m => m.replace(/##\s+\d+\.\s+/, ''));
          signals.existingTools.push(...repos);
        }
      }
    }
    
    // GitHub Trending: Count trending tools (Trend Score: 60+)
    if (report.feature === 'github-trending') {
      const trendMatches = content.match(/Trend Score:\*\*\s*(\d+)\/100/g);
      if (trendMatches) {
        const trending = trendMatches.filter(m => {
          const score = parseInt(m.match(/\d+/)?.[0] || '0');
          return score >= 60;
        }).length;
        signals.trendingNewTools += trending;
      }
    }
  }
  
  // Calculate total supply score (0-100)
  signals.totalSupplyScore = Math.min(
    (signals.goldmineActiveTools * 10) +         // Max 40 points (4 tools * 10)
    (signals.forkEvolutionActiveForks * 2) +     // Max 30 points (15 forks * 2)
    (signals.stargazerQualityRepos * 5) +        // Max 20 points (4 repos * 5)
    (signals.trendingNewTools * 5),              // Max 10 points (2 trending * 5)
    100
  );
  
  return signals;
}

// ============================================================================
// GAP ANALYSIS
// ============================================================================

function analyzeMarketGap(nicheId: string, nicheName: string, reports: ReportData[]): MarketGap {
  const demandSignals = extractDemandSignals(reports);
  const supplySignals = extractSupplySignals(reports);
  
  const gapScore = demandSignals.totalDemandScore - supplySignals.totalSupplyScore;
  const opportunityScore = Math.round((gapScore * 0.6) + (demandSignals.totalDemandScore * 0.4));
  
  let category: MarketGap['category'];
  if (demandSignals.totalDemandScore >= 80 && supplySignals.totalSupplyScore <= 20) {
    category = 'blue_ocean';
  } else if (demandSignals.totalDemandScore >= 60 && supplySignals.totalSupplyScore <= 40) {
    category = 'underserved';
  } else if (demandSignals.totalDemandScore >= 40 && supplySignals.totalSupplyScore <= 40) {
    category = 'growing';
  } else if (demandSignals.totalDemandScore >= 60 && supplySignals.totalSupplyScore >= 60) {
    category = 'saturated';
  } else {
    category = 'no_opportunity';
  }
  
  return {
    niche: nicheName,
    demandSignals,
    supplySignals,
    gapScore,
    opportunityScore,
    category,
    recommendation: generateRecommendation(category, demandSignals, supplySignals),
    businessModels: generateBusinessModels(category, nicheName)
  };
}

function generateRecommendation(
  category: MarketGap['category'],
  demand: DemandSignals,
  supply: SupplySignals
): string {
  const recommendations = [];
  
  if (category === 'blue_ocean') {
    recommendations.push('🔥🔥🔥 BLUE OCEAN OPPORTUNITY');
    recommendations.push('High demand + zero competition = BUILD IMMEDIATELY');
    recommendations.push('This is a rare, validated, underserved market');
    recommendations.push('Expected success rate: 70-80%');
  } else if (category === 'underserved') {
    recommendations.push('🔥🔥 UNDERSERVED MARKET');
    recommendations.push('Strong demand + low competition = STRONG OPPORTUNITY');
    recommendations.push('Some solutions exist but market still has room');
    recommendations.push('Expected success rate: 50-60%');
  } else if (category === 'growing') {
    recommendations.push('🔥 GROWING MARKET');
    recommendations.push('Moderate demand + low competition = WORTH EXPLORING');
    recommendations.push('Early stage market, could grow significantly');
    recommendations.push('Expected success rate: 30-40%');
  } else if (category === 'saturated') {
    recommendations.push('⚠️ SATURATED MARKET');
    recommendations.push('High demand BUT high competition = DIFFICULT');
    recommendations.push('Only enter if you have unique differentiation');
    recommendations.push('Expected success rate: 10-20%');
  } else {
    recommendations.push('❌ NO CLEAR OPPORTUNITY');
    recommendations.push('Low demand signals = NOT RECOMMENDED');
    recommendations.push('Focus on other niches with stronger signals');
  }
  
  return recommendations.join('\n');
}

function generateBusinessModels(category: MarketGap['category'], nicheName: string): string[] {
  if (category === 'no_opportunity') {
    return ['Not applicable - insufficient demand'];
  }
  
  const models = [
    '💰 SaaS: Monthly subscription ($29-99/month)',
    '💰 One-time: Lifetime access ($97-297)',
    '💰 Freemium: Free tier + paid features ($49-199/month)'
  ];
  
  if (category === 'blue_ocean') {
    models.push('💰 Premium Pricing: First-mover advantage ($199-499/month)');
    models.push('💰 Enterprise: White-glove service ($1,000-5,000/month)');
  }
  
  if (category === 'underserved') {
    models.push('💰 Templates: Sell pre-built solutions ($29-79 each)');
    models.push('💰 Consulting: Help implement ($500-2,000 per project)');
  }
  
  return models;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(gaps: MarketGap[]): string {
  const date = new Date().toISOString().split('T')[0];
  let markdown = `# Market Gap Analysis Report\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Niches Analyzed:** ${gaps.length}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## 🎯 What is Market Gap Analysis?\n\n`;
  markdown += `Cross-platform intelligence synthesis to identify underserved markets.\n\n`;
  markdown += `**Gap Categories:**\n`;
  markdown += `- **Blue Ocean:** High demand (80+) + Zero supply (0-20) = Best!\n`;
  markdown += `- **Underserved:** High demand (60+) + Low supply (20-40) = Strong\n`;
  markdown += `- **Growing:** Medium demand (40+) + Low supply = Worth exploring\n`;
  markdown += `- **Saturated:** High demand + High supply = Difficult\n\n`;
  markdown += `---\n\n`;
  
  const sorted = gaps.sort((a, b) => b.opportunityScore - a.opportunityScore);
  const blueOceans = sorted.filter(g => g.category === 'blue_ocean');
  const underserved = sorted.filter(g => g.category === 'underserved');
  
  if (blueOceans.length > 0) {
    markdown += `## 🌊 BLUE OCEAN OPPORTUNITIES\n\n`;
    blueOceans.forEach((gap, index) => {
      markdown += formatGapReport(gap, index + 1);
    });
  }
  
  if (underserved.length > 0) {
    markdown += `## 📈 UNDERSERVED MARKETS\n\n`;
    underserved.forEach((gap, index) => {
      markdown += formatGapReport(gap, index + 1);
    });
  }
  
  markdown += `## 📊 Summary\n\n`;
  markdown += `| Category | Count | Avg Opportunity Score |\n`;
  markdown += `|----------|-------|-----------------------|\n`;
  
  const categories = ['blue_ocean', 'underserved', 'growing', 'saturated', 'no_opportunity'];
  for (const cat of categories) {
    const matching = gaps.filter(g => g.category === cat);
    if (matching.length > 0) {
      const avgScore = Math.round(matching.reduce((sum, g) => sum + g.opportunityScore, 0) / matching.length);
      markdown += `| ${cat.replace('_', ' ')} | ${matching.length} | ${avgScore}/100 |\n`;
    }
  }
  
  markdown += '\n';
  
  if (blueOceans.length > 0) {
    markdown += `## 🏆 TOP RECOMMENDATION\n\n`;
    markdown += `**Niche:** ${blueOceans[0].niche}\n`;
    markdown += `**Category:** Blue Ocean\n`;
    markdown += `**Opportunity Score:** ${blueOceans[0].opportunityScore}/100\n`;
    markdown += `**Gap Score:** ${blueOceans[0].gapScore}\n\n`;
    markdown += `**Why This is Your Best Bet:**\n`;
    markdown += `- Demand Score: ${blueOceans[0].demandSignals.totalDemandScore}/100 (validated need)\n`;
    markdown += `- Supply Score: ${blueOceans[0].supplySignals.totalSupplyScore}/100 (low competition)\n`;
    markdown += `- Success Probability: 70-80%\n\n`;
    markdown += `**Immediate Action:**\n`;
    markdown += `1. Review demand evidence in detail\n`;
    markdown += `2. Validate with 10-20 customer interviews\n`;
    markdown += `3. Build MVP in 2-4 weeks\n`;
    markdown += `4. Launch to early demand signals (Reddit Sniper posts)\n`;
    markdown += `5. Target: First paying customer within 30 days\n\n`;
  }
  
  return markdown;
}

function formatGapReport(gap: MarketGap, index: number): string {
  let markdown = `### ${index}. ${gap.niche}\n\n`;
  
  markdown += `**Opportunity Score:** ${gap.opportunityScore}/100 `;
  if (gap.opportunityScore >= 90) markdown += '🔥🔥🔥';
  else if (gap.opportunityScore >= 70) markdown += '🔥🔥';
  else if (gap.opportunityScore >= 50) markdown += '🔥';
  markdown += '\n\n';
  
  markdown += `**Gap Analysis:**\n`;
  markdown += `- Demand Score: ${gap.demandSignals.totalDemandScore}/100\n`;
  markdown += `- Supply Score: ${gap.supplySignals.totalSupplyScore}/100\n`;
  markdown += `- Gap Score: ${gap.gapScore}\n`;
  markdown += `- Category: ${gap.category.replace('_', ' ').toUpperCase()}\n\n`;
  
  markdown += `**Demand Evidence:**\n`;
  gap.demandSignals.evidenceLinks.forEach(link => {
    markdown += `  - ${link}\n`;
  });
  markdown += '\n';
  
  if (gap.supplySignals.existingTools.length > 0) {
    markdown += `**Existing Tools:**\n`;
    gap.supplySignals.existingTools.slice(0, 5).forEach(tool => {
      markdown += `  - ${tool}\n`;
    });
    markdown += '\n';
  } else {
    markdown += `**Existing Tools:** None found (BLUE OCEAN!)\n\n`;
  }
  
  markdown += `**Recommendation:**\n${gap.recommendation}\n\n`;
  
  markdown += `**Business Models:**\n`;
  gap.businessModels.forEach(model => {
    markdown += `  - ${model}\n`;
  });
  markdown += '\n---\n\n';
  
  return markdown;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function runMarketGapIdentifier(): Promise<void> {

  const allNiches = await loadNicheConfig();
  const niches = getEnabledNiches(allNiches);

  const gaps: MarketGap[] = [];
  
  for (const niche of niches) {

    const reports = await loadRecentReports(niche.id, 7);

    if (reports.length === 0) {
            continue;
    }
    
        const gap = analyzeMarketGap(niche.id, niche.name, reports);
    

    gaps.push(gap);
    
    const date = new Date().toISOString().split('T')[0];
    const nicheReport = formatGapReport(gap, 1);
    const filename = `data/intelligence/market-gaps-${niche.id}-${date}.md`;
    fs.mkdirSync('data/intelligence', { recursive: true });
    fs.writeFileSync(filename, nicheReport);
    
      }
  
    const consolidatedReport = generateReport(gaps);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `data/intelligence/market-gaps-consolidated-${date}.md`;
  fs.writeFileSync(filename, consolidatedReport);
  

  const blueOceans = gaps.filter(g => g.category === 'blue_ocean').length;
  const underserved = gaps.filter(g => g.category === 'underserved').length;
  

  if (blueOceans > 0) {
          }
}
