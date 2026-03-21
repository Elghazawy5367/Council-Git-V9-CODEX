// scripts/generate-learning-report.ts
// Weekly Learning Report Generator
// Synthesises outcome patterns into a human-readable weekly digest.
// Run every Sunday by the self-learning workflow.
// Output: data/learning/weekly-report-{date}.md
//
// Run: npm run learning-report
// Or:  npx tsx scripts/generate-learning-report.ts

import fs from 'fs';
import path from 'path';
import { runOutcomeAnalysis } from './analyse-outcome-patterns';
import { getOutcomeStats, listOutcomes } from './track-outcomes';
import { callGitHubModels } from '../src/lib/github-models-client';

// ── Report Generator ──────────────────────────────────────────────────────────

async function generateNarrativeSummary(
  stats: ReturnType<typeof getOutcomeStats>,
  topInsights: Array<{ pattern: string; evidence: string; recommendation: string }>,
  nicheSummary: string
): Promise<string> {
  // Use GitHub Models (free) to generate the narrative paragraph
  const prompt =
    `You are a market intelligence analyst writing a weekly self-assessment.
    
Based on this data, write a 3-sentence executive summary of what the intelligence system learned this week.
Be specific and actionable. No preamble.

Overall accuracy: ${stats.accuracyRate}%
Total outcomes tracked: ${stats.total}
Acted on: ${stats.byOutcome.acted_on}
Validated: ${stats.byOutcome.validated}
Rejected: ${stats.byOutcome.rejected}

Top insights:
${topInsights.slice(0, 3).map(i => `- ${i.pattern}: ${i.evidence}`).join('\n')}

Niche performance:
${nicheSummary}`;

  try {
    const response = await callGitHubModels(prompt, {
      model: 'phi-4',
      maxTokens: 300,
      temperature: 0.3,
    });
    return response.content.trim();
  } catch {
    // Fallback: construct summary from data
    const topAction = stats.byOutcome.acted_on > 0
      ? `${stats.byOutcome.acted_on} verdict(s) led to action`
      : 'No verdicts acted on yet — system is still accumulating data';
    return (
      `The intelligence system tracked ${stats.total} verdict outcomes this week with ` +
      `${stats.accuracyRate}% overall accuracy. ${topAction}. ` +
      `${topInsights[0]?.recommendation ?? 'Continue tracking outcomes to improve calibration.'}`
    );
  }
}

function buildWeeklyMarkdown(
  patterns: Awaited<ReturnType<typeof runOutcomeAnalysis>>,
  narrativeSummary: string,
  weekDate: string
): string {
  const lines: string[] = [
    `# Weekly Learning Report — ${weekDate}`,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    narrativeSummary,
    '',
    '---',
    '',
    '## Performance Metrics',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total outcomes tracked | ${patterns.totalOutcomes} |`,
    `| Overall accuracy | ${patterns.overallAccuracy}% |`,
    `| Acted on | ${patterns.nichePerformance.reduce((s, n) => s + n.actedOn, 0)} |`,
    `| Validated | ${patterns.nichePerformance.reduce((s, n) => s + n.validated, 0)} |`,
    `| Rejected | ${patterns.nichePerformance.reduce((s, n) => s + n.rejected, 0)} |`,
    '',
    '---',
    '',
    '## Niche Performance',
    '',
  ];

  if (patterns.nichePerformance.length === 0) {
    lines.push('No niche data yet. Track outcomes to populate this section.');
  } else {
    lines.push('| Niche | Verdicts | Accuracy | Avg Confidence |');
    lines.push('|-------|----------|----------|----------------|');
    for (const n of patterns.nichePerformance) {
      const bar = n.accuracyRate >= 70 ? '✅' : n.accuracyRate >= 40 ? '⚡' : '❌';
      lines.push(`| ${n.nicheId} | ${n.totalVerdicts} | ${bar} ${n.accuracyRate}% | ${n.avgConfidence}% |`);
    }
  }

  lines.push('', '---', '', '## Confidence Score Calibration', '');

  for (const b of patterns.confidenceBrackets) {
    if (b.total === 0) continue;
    lines.push(`**${b.bracket}** — ${b.total} verdicts, ${b.successRate}% success rate`);
    lines.push(`→ ${b.recommendation}`, '');
  }

  lines.push('---', '', '## Expert Reliability', '');

  if (patterns.expertReliability.length === 0) {
    lines.push('No expert data yet.');
  } else {
    lines.push('| Expert | Predictions | Reliability |');
    lines.push('|--------|-------------|-------------|');
    for (const e of patterns.expertReliability) {
      const bar = e.reliabilityScore >= 70 ? '🥇' : e.reliabilityScore >= 50 ? '🥈' : '🥉';
      lines.push(`| ${e.expertName} | ${e.totalPredictions} | ${bar} ${e.reliabilityScore}% |`);
    }
  }

  lines.push('', '---', '', '## Key Insights', '');

  if (patterns.keyInsights.length === 0) {
    lines.push('Insufficient data for pattern insights. Track more outcomes.');
  } else {
    for (const insight of patterns.keyInsights) {
      lines.push(`### ${insight.pattern}`);
      lines.push(`**Evidence:** ${insight.evidence}`);
      lines.push(`**Recommendation:** ${insight.recommendation}`);
      lines.push('');
    }
  }

  lines.push('---', '', '## Calibration Weights (Applied Next Run)', '');
  lines.push('```json');
  lines.push(JSON.stringify(patterns.calibration, null, 2));
  lines.push('```', '');

  lines.push(
    '---',
    '',
    `*Generated: ${new Date().toISOString()}*  `,
    `*Source: data/learning/outcomes.json → data/learning/outcome-patterns.json*  `,
    `*Next report: ${getNextSundayDate()}*`,
  );

  return lines.join('\n');
}

function getNextSundayDate(): string {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  return nextSunday.toISOString().split('T')[0];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[LearningReport] Generating weekly learning report...');

  const weekDate = new Date().toISOString().split('T')[0];
  const stats = getOutcomeStats();

  // Run pattern analysis first
  const patterns = await runOutcomeAnalysis();

  // Build niche summary string for narrative
  const nicheSummary = patterns.nichePerformance
    .slice(0, 3)
    .map(n => `${n.nicheId}: ${n.accuracyRate}% accuracy`)
    .join(', ') || 'No niche data';

  // Generate AI narrative
  console.log('[LearningReport] Generating narrative summary...');
  const narrative = await generateNarrativeSummary(stats, patterns.keyInsights, nicheSummary);

  // Build markdown report
  const markdown = buildWeeklyMarkdown(patterns, narrative, weekDate);

  // Write report
  const learningDir = path.join(process.cwd(), 'data', 'learning');
  fs.mkdirSync(learningDir, { recursive: true });

  const reportPath = path.join(learningDir, `weekly-report-${weekDate}.md`);
  fs.writeFileSync(reportPath, markdown);

  // Also write latest symlink-style file for easy access
  const latestPath = path.join(learningDir, 'latest-report.md');
  fs.writeFileSync(latestPath, markdown);

  console.log(`[LearningReport] ✅ Report written: ${reportPath}`);
  console.log(`[LearningReport] Overall accuracy: ${patterns.overallAccuracy}%`);
  console.log(`[LearningReport] Insights generated: ${patterns.keyInsights.length}`);
}

main().catch(err => {
  console.error('[LearningReport] Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
