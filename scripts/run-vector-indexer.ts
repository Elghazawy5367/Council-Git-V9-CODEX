// scripts/run-vector-indexer.ts
// Incremental nightly vector indexer
// Runs after all intelligence features complete (scheduled after quality-pipeline)
// Only processes reports created since the last indexer run — never re-indexes
//
// Triggered by: .github/workflows/vector-indexer.yml (daily at 11 PM UTC)
// Run manually: npm run vector-index

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import {
  ensureCollection,
  indexBatch,
  getStats,
  generatePointId,
  healthCheck,
  type IntelligencePoint,
} from '../src/lib/memory/vector-store';

// ── State file — tracks the last successful run timestamp ────────────────────

const STATE_FILE = path.join(process.cwd(), 'data', '.vector-index-state.json');

interface IndexState {
  lastRunTimestamp: number;
  totalIndexed: number;
  lastRunDate: string;
}

function readState(): IndexState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(raw) as IndexState;
    }
  } catch {
    // ignore — use default
  }
  // Default: index everything from the last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    lastRunTimestamp: weekAgo,
    totalIndexed: 0,
    lastRunDate: new Date(weekAgo).toISOString(),
  };
}

function writeState(state: IndexState): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Niche and feature maps (same as index-existing-reports.ts) ───────────────

const KNOWN_NICHES = [
  'neurodivergent-digital-products',
  'freelancers-consultants',
  'etsy-sellers',
  'digital-educators',
  'podcast-transcription-seo',
];

const FEATURE_PREFIXES: Record<string, string> = {
  'phantom-scout':       'phantom-scout',
  'mining-drill':        'mining-drill',
  'reddit-sniper':       'reddit-sniper',
  'reddit-pain-points':  'reddit-pain-points',
  'viral-radar':         'viral-radar',
  'hackernews':          'hackernews',
  'github-trending':     'github-trending',
  'stargazer':           'stargazer',
  'goldmine':            'goldmine',
  'fork-evolution':      'fork-evolution',
  'github-discussions':  'github-discussions',
  'quality-pipeline':    'quality-pipeline',
  'market-gaps':         'market-gaps',
};

// ── Filename parser ───────────────────────────────────────────────────────────

interface ParsedFilename {
  feature: string;
  niche: string;
  date: string;
  timestamp: number;
  valid: boolean;
}

function parseFilename(filename: string): ParsedFilename {
  const base = path.basename(filename, '.md');
  const invalid: ParsedFilename = {
    feature: '', niche: '', date: '', timestamp: 0, valid: false,
  };

  const dateMatch = base.match(/-(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) return invalid;

  const date = dateMatch[1];
  const withoutDate = base.slice(0, base.length - date.length - 1);
  const timestamp = new Date(date).getTime();
  if (isNaN(timestamp)) return invalid;

  let matchedNiche = '';
  let matchedFeature = '';

  for (const niche of KNOWN_NICHES) {
    if (withoutDate.endsWith(niche)) {
      matchedNiche = niche;
      const featureRaw = withoutDate.slice(0, withoutDate.length - niche.length - 1);

      for (const [prefix, canonical] of Object.entries(FEATURE_PREFIXES)) {
        if (featureRaw === prefix || featureRaw.startsWith(prefix)) {
          matchedFeature = canonical;
          break;
        }
      }
      if (!matchedFeature) matchedFeature = featureRaw;
      break;
    }
  }

  if (!matchedNiche || !matchedFeature) return invalid;
  return { feature: matchedFeature, niche: matchedNiche, date, timestamp, valid: true };
}

// ── Content extractor ─────────────────────────────────────────────────────────

const SCORE_PATTERN = /\*\*Score:\*\*\s*(\d+)/i;
const HEADING_PATTERN = /^#{1,3}\s+(.+)$/m;

function extractPoints(
  filePath: string,
  feature: string,
  niche: string,
  date: string,
  timestamp: number
): IntelligencePoint[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  if (content.trim().length < 50) return [];

  const sections = content.split(/^(?=#{2,3}\s)/m).filter(s => s.trim().length > 40);
  const points: IntelligencePoint[] = [];

  for (const [idx, section] of sections.entries()) {
    const headingMatch = section.match(HEADING_PATTERN);
    const title = headingMatch ? headingMatch[1].trim() : `${feature} item ${idx + 1}`;

    const scoreMatch = section.match(SCORE_PATTERN);
    const qualityScore = scoreMatch ? Math.min(100, parseInt(scoreMatch[1], 10)) : 55;

    const tags: string[] = [];
    if (/adhd|neurodivergent|autism/i.test(section)) tags.push('neurodivergent');
    if (/pain|frustrated|broken|hate|annoying/i.test(section)) tags.push('pain-point');
    if (/pay|budget|\$|purchase/i.test(section)) tags.push('buying-intent');
    if (/abandon|goldmine|unmaintained/i.test(section)) tags.push('opportunity');

    const trimmedContent = section
      .replace(/^#{1,3}\s+.+$/m, '')
      .trim()
      .slice(0, 800);

    if (trimmedContent.length > 30) {
      points.push({
        id: generatePointId(filePath, `${title}-${idx}`),
        niche,
        feature,
        content: trimmedContent,
        title,
        qualityScore,
        timestamp,
        reportDate: date,
        sourcePath: filePath,
        tags,
      });
    }
  }

  // Fallback: whole doc as single point
  if (points.length === 0) {
    const mainHeading = content.match(HEADING_PATTERN);
    points.push({
      id: generatePointId(filePath, 'full'),
      niche,
      feature,
      content: content.slice(0, 800),
      title: mainHeading ? mainHeading[1].trim() : `${feature} report`,
      qualityScore: 50,
      timestamp,
      reportDate: date,
      sourcePath: filePath,
      tags: [],
    });
  }

  return points;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const runStart = Date.now();

  console.log('[VectorIndexer] Starting incremental indexer...');
  console.log(`[VectorIndexer] Run time: ${new Date().toISOString()}`);

  // Verify connection
  const healthy = await healthCheck();
  if (!healthy) {
    throw new Error(
      '[VectorIndexer] Qdrant connection failed. Check QDRANT_URL and QDRANT_API_KEY secrets.'
    );
  }

  await ensureCollection();

  // Read last run state
  const state = readState();
  const cutoffTimestamp = state.lastRunTimestamp;
  console.log(`[VectorIndexer] Indexing reports newer than: ${new Date(cutoffTimestamp).toISOString()}`);

  // Find all report files
  const allFiles = [
    ...await glob('data/reports/**/*.md', { cwd: process.cwd() }),
    ...await glob('data/intelligence/**/*.md', { cwd: process.cwd() }),
  ];

  // Filter to files newer than last run
  const newFiles = allFiles.filter(filePath => {
    const parsed = parseFilename(filePath);
    return parsed.valid && parsed.timestamp > cutoffTimestamp;
  });

  console.log(`[VectorIndexer] Found ${newFiles.length} new files to index (of ${allFiles.length} total)`);

  if (newFiles.length === 0) {
    console.log('[VectorIndexer] No new reports since last run. Nothing to index.');
    writeState({
      lastRunTimestamp: runStart,
      totalIndexed: state.totalIndexed,
      lastRunDate: new Date(runStart).toISOString(),
    });
    return;
  }

  // Extract intelligence points from new files
  const allPoints: IntelligencePoint[] = [];

  for (const filePath of newFiles) {
    const parsed = parseFilename(filePath);
    if (!parsed.valid) continue;

    const points = extractPoints(
      filePath,
      parsed.feature,
      parsed.niche,
      parsed.date,
      parsed.timestamp
    );
    allPoints.push(...points);
  }

  console.log(`[VectorIndexer] Extracted ${allPoints.length} chunks for indexing`);

  // Index into Qdrant
  const indexed = await indexBatch(allPoints);

  // Persist state
  const newState: IndexState = {
    lastRunTimestamp: runStart,
    totalIndexed: state.totalIndexed + indexed,
    lastRunDate: new Date(runStart).toISOString(),
  };
  writeState(newState);

  // Final report
  const stats = await getStats();
  console.log('');
  console.log('[VectorIndexer] ✅ Incremental indexing complete');
  console.log(`[VectorIndexer] New chunks indexed: ${indexed}`);
  console.log(`[VectorIndexer] Total in collection: ${stats.totalPoints}`);
  console.log(`[VectorIndexer] Cumulative total indexed: ${newState.totalIndexed}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[VectorIndexer] ❌ Fatal: ${msg}`);
    process.exit(1);
  });
