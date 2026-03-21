// scripts/analyse-outcome-patterns.ts
// Outcome Pattern Analyser — the intelligence layer of the feedback loop
//
// PURPOSE: Analyse tracked outcomes to discover which signals actually predict
// verdicts worth pursuing. Produces calibration weights that the synthesis
// pipeline can use to improve scoring over time.
//
// WHAT IT FINDS:
//   - Which niches have highest acted_on rate?
//   - Which confidence score thresholds actually predict success?
//   - Which expert (Blue Ocean / Validator / Architect) is most reliable?
//   - Which feature sources (reddit vs github vs discussions) produce better verdicts?
//
// OUTPUT:
//   data/learning/outcome-patterns.json  — raw pattern analysis
//   data/learning/calibration.json       — weight adjustments for scoring pipeline
//
// Run: npm run analyse-outcomes
// Or:  npx tsx scripts/analyse-outcome-patterns.ts

import fs from 'fs';
import path from 'path';
import { listOutcomes, getOutcomeStats, type OutcomeRecord } from './track-outcomes';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PatternInsight {
  pattern: string;
  evidence: string;
  confidence: number;
  recommendation: string;
}

interface NichePerformance {
  nicheId: string;
  totalVerdicts: number;
  actedOn: number;
  validated: number;
  rejected: number;
  accuracyRate: number;
  avgConfidence: number;
}

interface ConfidenceBracketAnalysis {
  bracket: string;
  range: [number, number];
  total: number;
  successRate: number;
  recommendation: string;
}

interface ExpertReliability {
  expertName: string;
  totalPredictions: number;
  correctPursue: number;
  incorrectPursue: number;
  reliabilityScore: number;
}

interface CalibrationWeights {
  version: number;
  generatedDate: string;
  minConfidenceThreshold: number;
  nicheWeights: Record<string, number>;
  expertWeights: Record<string, number>;
  confidenceMultipliers: Record<string, number>;
  notes: string[];
}

interface OutcomePatterns {
  generatedDate: string;
  totalOutcomes: number;
  overallAccuracy: number;
  nichePerformance: NichePerformance[];
  confidenceBrackets: ConfidenceBracketAnalysis[];
  expertReliability: ExpertReliability[];
  keyInsights: PatternInsight[];
  calibration: CalibrationWeights;
}

// ── Analysers ─────────────────────────────────────────────────────────────────

function analyseByNiche(records: OutcomeRecord[]): NichePerformance[] {
  const byNiche = new Map<string, OutcomeRecord[]>();

  for (const r of records) {
    if (!byNiche.has(r.niche)) byNiche.set(r.niche, []);
    byNiche.get(r.niche)!.push(r);
  }

  return Array.from(byNiche.entries())
    .map(([nicheId, niRecords]) => {
      const total = niRecords.length;
      const actedOn = niRecords.filter(r => r.outcome === 'acted_on').length;
      const validated = niRecords.filter(r => r.outcome === 'validated').length;
      const rejected = niRecords.filter(r => r.outcome === 'rejected').length;
      const decided = actedOn + validated + rejected;
      const accuracyRate = decided > 0 ? Math.round(((actedOn + validated) / decided) * 100) : 0;
      const avgConfidence = total > 0
        ? Math.round(niRecords.reduce((s, r) => s + r.confidenceScore, 0) / total)
        : 0;

      return { nicheId, totalVerdicts: total, actedOn, validated, rejected, accuracyRate, avgConfidence };
    })
    .sort((a, b) => b.accuracyRate - a.accuracyRate);
}

function analyseConfidenceBrackets(records: OutcomeRecord[]): ConfidenceBracketAnalysis[] {
  const brackets: Array<{ label: string; range: [number, number] }> = [
    { label: '90-100% (Platinum)', range: [90, 100] },
    { label: '70-89% (Gold)', range: [70, 89] },
    { label: '50-69% (Silver)', range: [50, 69] },
    { label: '0-49% (Low)', range: [0, 49] },
  ];

  return brackets.map(bracket => {
    const inBracket = records.filter(
      r => r.confidenceScore >= bracket.range[0] && r.confidenceScore <= bracket.range[1]
    );
    const decided = inBracket.filter(r => ['acted_on', 'validated', 'rejected'].includes(r.outcome));
    const correct = decided.filter(r => r.outcome === 'acted_on' || r.outcome === 'validated');
    const successRate = decided.length > 0 ? Math.round((correct.length / decided.length) * 100) : 0;

    let recommendation: string;
    if (successRate >= 70) recommendation = 'Reliable — auto-pursue at this confidence';
    else if (successRate >= 50) recommendation = 'Moderate — pursue with manual review';
    else if (decided.length < 3) recommendation = 'Insufficient data — need more outcomes';
    else recommendation = 'Unreliable — raise quality thresholds';

    return {
      bracket: bracket.label,
      range: bracket.range,
      total: inBracket.length,
      successRate,
      recommendation,
    };
  });
}

function analyseExpertReliability(records: OutcomeRecord[]): ExpertReliability[] {
  const expertMap = new Map<string, { pursue: number; correctPursue: number; incorrectPursue: number }>();

  for (const r of records) {
    if (r.outcome === 'investigating') continue;

    for (const expertVerdict of r.expertVerdicts) {
      // Format: "Blue Ocean Strategist: pursue"
      const parts = expertVerdict.split(': ');
      if (parts.length < 2) continue;

      const expertName = parts[0].trim();
      const verdict = parts[1].trim().toLowerCase();

      if (!expertMap.has(expertName)) {
        expertMap.set(expertName, { pursue: 0, correctPursue: 0, incorrectPursue: 0 });
      }

      const entry = expertMap.get(expertName)!;

      if (verdict === 'pursue') {
        entry.pursue++;
        const wasCorrect = r.outcome === 'acted_on' || r.outcome === 'validated';
        if (wasCorrect) entry.correctPursue++;
        else entry.incorrectPursue++;
      }
    }
  }

  return Array.from(expertMap.entries())
    .map(([expertName, data]) => {
      const total = data.pursue;
      const reliabilityScore = total > 0
        ? Math.round((data.correctPursue / total) * 100)
        : 50; // default neutral until data accumulates

      return {
        expertName,
        totalPredictions: total,
        correctPursue: data.correctPursue,
        incorrectPursue: data.incorrectPursue,
        reliabilityScore,
      };
    })
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore);
}

function generateInsights(
  nichePerf: NichePerformance[],
  brackets: ConfidenceBracketAnalysis[],
  experts: ExpertReliability[],
  records: OutcomeRecord[]
): PatternInsight[] {
  const insights: PatternInsight[] = [];

  // Insight 1: Best performing niche
  const bestNiche = nichePerf[0];
  if (bestNiche && bestNiche.totalVerdicts >= 2) {
    insights.push({
      pattern: 'High-signal niche identified',
      evidence: `${bestNiche.nicheId} has ${bestNiche.accuracyRate}% accuracy across ${bestNiche.totalVerdicts} verdicts`,
      confidence: Math.min(bestNiche.accuracyRate, 95),
      recommendation: `Increase intelligence gathering frequency for ${bestNiche.nicheId}`,
    });
  }

  // Insight 2: Worst performing niche
  const worstNiche = nichePerf[nichePerf.length - 1];
  if (worstNiche && worstNiche.totalVerdicts >= 2 && worstNiche.accuracyRate < 40) {
    insights.push({
      pattern: 'Low-signal niche detected',
      evidence: `${worstNiche.nicheId} has only ${worstNiche.accuracyRate}% accuracy`,
      confidence: 75,
      recommendation: `Review niche configuration — keywords or subreddits may be too broad`,
    });
  }

  // Insight 3: Confidence calibration
  const highBracket = brackets.find(b => b.range[0] === 90);
  const midBracket = brackets.find(b => b.range[0] === 70);
  if (highBracket && highBracket.total >= 3) {
    insights.push({
      pattern: 'Confidence score reliability',
      evidence: `90-100% confidence verdicts have ${highBracket.successRate}% success rate (${highBracket.total} data points)`,
      confidence: 80,
      recommendation: highBracket.successRate >= 70
        ? 'Confidence scores are well-calibrated — trust high-confidence verdicts'
        : 'Confidence scores are over-optimistic — raise quality thresholds',
    });
  }

  // Insight 4: Most reliable expert
  const bestExpert = experts[0];
  if (bestExpert && bestExpert.totalPredictions >= 3) {
    insights.push({
      pattern: 'Most reliable expert signal',
      evidence: `${bestExpert.expertName} has ${bestExpert.reliabilityScore}% reliability on "pursue" recommendations`,
      confidence: Math.min(bestExpert.reliabilityScore, 90),
      recommendation: `Weight ${bestExpert.expertName} more heavily in synthesis consensus`,
    });
  }

  // Insight 5: Volume trend
  const recentRecords = records.filter(r => {
    const daysAgo = (Date.now() - new Date(r.verdictDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  if (recentRecords.length > 0) {
    const recentActedOn = recentRecords.filter(r => r.outcome === 'acted_on').length;
    insights.push({
      pattern: 'Monthly momentum',
      evidence: `${recentActedOn} verdicts acted on in the last 30 days out of ${recentRecords.length} tracked`,
      confidence: 70,
      recommendation: recentActedOn === 0
        ? 'No verdicts acted on recently — review whether quality threshold is too high'
        : `Strong momentum — maintain current intelligence cadence`,
    });
  }

  return insights;
}

function buildCalibrationWeights(
  nichePerf: NichePerformance[],
  brackets: ConfidenceBracketAnalysis[],
  experts: ExpertReliability[]
): CalibrationWeights {
  const notes: string[] = [];

  // Niche weights: 1.0 baseline, +/- based on accuracy
  const nicheWeights: Record<string, number> = {};
  for (const n of nichePerf) {
    if (n.totalVerdicts < 2) {
      nicheWeights[n.nicheId] = 1.0; // insufficient data — keep neutral
    } else {
      // Scale: 0% accuracy → 0.6 weight, 100% accuracy → 1.4 weight
      nicheWeights[n.nicheId] = parseFloat((0.6 + (n.accuracyRate / 100) * 0.8).toFixed(2));
    }
  }

  // Expert weights: 1.0 baseline, +/- based on reliability
  const expertWeights: Record<string, number> = {};
  for (const e of experts) {
    if (e.totalPredictions < 2) {
      expertWeights[e.expertName] = 1.0;
    } else {
      expertWeights[e.expertName] = parseFloat((0.5 + (e.reliabilityScore / 100)).toFixed(2));
    }
  }

  // Confidence multipliers: how much to trust each bracket
  const confidenceMultipliers: Record<string, number> = {};
  for (const b of brackets) {
    const key = b.bracket.split(' ')[0]; // "90-100%"
    if (b.total < 3) {
      confidenceMultipliers[key] = 1.0;
      notes.push(`${key} bracket: insufficient data (${b.total} outcomes), using neutral weight`);
    } else {
      confidenceMultipliers[key] = parseFloat((0.5 + (b.successRate / 100)).toFixed(2));
    }
  }

  // Minimum confidence threshold recommendation
  const highBracket = brackets.find(b => b.range[0] === 70);
  const minThreshold = (highBracket && highBracket.successRate >= 60) ? 70 : 80;

  notes.push(`Generated from ${nichePerf.reduce((s, n) => s + n.totalVerdicts, 0)} total outcomes`);
  notes.push('Weights update automatically as more outcomes are tracked');
  notes.push('Weights are multiplicative — 1.0 = neutral, >1.0 = boost, <1.0 = reduce');

  return {
    version: 1,
    generatedDate: new Date().toISOString().split('T')[0],
    minConfidenceThreshold: minThreshold,
    nicheWeights,
    expertWeights,
    confidenceMultipliers,
    notes,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runOutcomeAnalysis(): Promise<OutcomePatterns> {
  const records = listOutcomes();
  const stats = getOutcomeStats();

  if (records.length === 0) {
    console.log('[PatternAnalyser] No outcomes tracked yet.');
    console.log('[PatternAnalyser] Track outcomes first: npm run track -- --niche=X --outcome=acted_on');

    const empty: OutcomePatterns = {
      generatedDate: new Date().toISOString().split('T')[0],
      totalOutcomes: 0,
      overallAccuracy: 0,
      nichePerformance: [],
      confidenceBrackets: [],
      expertReliability: [],
      keyInsights: [{ pattern: 'No data', evidence: 'No outcomes tracked yet', confidence: 0, recommendation: 'Track outcomes using: npm run track' }],
      calibration: {
        version: 1,
        generatedDate: new Date().toISOString().split('T')[0],
        minConfidenceThreshold: 70,
        nicheWeights: {},
        expertWeights: {},
        confidenceMultipliers: {},
        notes: ['No outcome data available — using default weights'],
      },
    };

    return empty;
  }

  console.log(`[PatternAnalyser] Analysing ${records.length} outcome records...`);

  const nichePerf = analyseByNiche(records);
  const brackets = analyseConfidenceBrackets(records);
  const experts = analyseExpertReliability(records);
  const insights = generateInsights(nichePerf, brackets, experts, records);
  const calibration = buildCalibrationWeights(nichePerf, brackets, experts);

  const patterns: OutcomePatterns = {
    generatedDate: new Date().toISOString().split('T')[0],
    totalOutcomes: stats.total,
    overallAccuracy: stats.accuracyRate,
    nichePerformance: nichePerf,
    confidenceBrackets: brackets,
    expertReliability: experts,
    keyInsights: insights,
    calibration,
  };

  // Write outputs
  const learningDir = path.join(process.cwd(), 'data', 'learning');
  fs.mkdirSync(learningDir, { recursive: true });

  fs.writeFileSync(
    path.join(learningDir, 'outcome-patterns.json'),
    JSON.stringify(patterns, null, 2)
  );

  fs.writeFileSync(
    path.join(learningDir, 'calibration.json'),
    JSON.stringify(calibration, null, 2)
  );

  console.log(`[PatternAnalyser] ✅ Analysis complete`);
  console.log(`[PatternAnalyser] Overall accuracy: ${stats.accuracyRate}%`);
  console.log(`[PatternAnalyser] Key insights: ${insights.length}`);
  console.log(`[PatternAnalyser] Written: data/learning/outcome-patterns.json`);
  console.log(`[PatternAnalyser] Written: data/learning/calibration.json`);

  return patterns;
}

async function main(): Promise<void> {
  await runOutcomeAnalysis();
}

main().catch(err => {
  console.error('[PatternAnalyser] Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
