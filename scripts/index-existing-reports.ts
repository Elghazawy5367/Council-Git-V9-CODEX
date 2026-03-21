// scripts/index-existing-reports.ts
// ONE-TIME historical indexer — run once after Qdrant is set up
// Reads ALL existing markdown reports from data/reports/ and data/intelligence/
// Parses metadata from filenames, chunks content, indexes into Qdrant
//
// Run with: npx tsx scripts/index-existing-reports.ts
// Or:       npm run index-reports
//
// After this runs, the nightly vector-indexer.yml workflow keeps it current.

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

// ── Known niche IDs (from config/target-niches.yaml) ─────────────────────────

const KNOWN_NICHES = [
  'neurodivergent-digital-products',
  'freelancers-consultants',
  'etsy-sellers',
  'digital-educators',
  'podcast-transcription-seo',
];

// ── Known feature prefixes (determines report category) ──────────────────────

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

// ── Metadata Parser ───────────────────────────────────────────────────────────

interface ParsedFilename {
  feature: string;
  niche: string;
  date: string;
  valid: boolean;
}

/**
 * Parse feature, niche, and date from filenames like:
 *   phantom-scout-neurodivergent-digital-products-2026-03-20.md
 *   mining-drill-etsy-sellers-2026-03-18.md
 *   quality-pipeline-freelancers-consultants-2026-03-15.md
 */
function parseFilename(filename: string): ParsedFilename {
  const base = path.basename(filename, '.md');
  const invalid: ParsedFilename = { feature: '', niche: '', date: '', valid: false };

  // Date is always the last 10 characters: YYYY-MM-DD
  const dateMatch = base.match(/-(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) return invalid;

  const date = dateMatch[1];
  const withoutDate = base.slice(0, base.length - date.length - 1);

  // Try to match a known niche from the remaining string
  let matchedNiche = '';
  let matchedFeature = '';

  for (const niche of KNOWN_NICHES) {
    if (withoutDate.endsWith(niche)) {
      matchedNiche = niche;
      // Feature is everything before the niche
      const featureRaw = withoutDate.slice(0, withoutDate.length - niche.length - 1);

      // Map to canonical feature name
      for (const [prefix, canonical] of Object.entries(FEATURE_PREFIXES)) {
        if (featureRaw === prefix || featureRaw.startsWith(prefix)) {
          matchedFeature = canonical;
          break;
        }
      }

      if (!matchedFeature) matchedFeature = featureRaw; // use raw if not in map

      break;
    }
  }

  if (!matchedNiche || !matchedFeature) return invalid;

  return { feature: matchedFeature, niche: matchedNiche, date, valid: true };
}

// ── Content Chunker ───────────────────────────────────────────────────────────

interface ContentChunk {
  title: string;
  content: string;
  qualityScore: number;
  tags: string[];
}

const QUALITY_SCORE_PATTERN = /\*\*Score:\*\*\s*(\d+)/i;
const HEADING_PATTERN = /^#{1,3}\s+(.+)$/m;
const PLATINUM_PATTERN = /💎|Platinum|90-100/;
const GOLD_PATTERN = /🥇|Gold\b|80-89/;
const SILVER_PATTERN = /🥈|Silver\b|70-79/;

/**
 * Extract the most valuable chunks from a markdown intelligence report.
 * Preserves the top sections by quality tier where parseable.
 * Falls back to chunking by heading for reports without explicit scoring.
 */
function chunkReport(content: string, feature: string): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // Split on markdown headings (## and ###)
  const sections = content.split(/^(?=#{2,3}\s)/m).filter(s => s.trim().length > 50);

  for (const section of sections) {
    const headingMatch = section.match(HEADING_PATTERN);
    const title = headingMatch ? headingMatch[1].trim() : `${feature} insight`;

    // Extract score if present
    const scoreMatch = section.match(QUALITY_SCORE_PATTERN);
    let qualityScore = 50; // default mid-quality

    if (scoreMatch) {
      qualityScore = Math.min(100, parseInt(scoreMatch[1], 10));
    } else if (PLATINUM_PATTERN.test(section)) {
      qualityScore = 92;
    } else if (GOLD_PATTERN.test(section)) {
      qualityScore = 84;
    } else if (SILVER_PATTERN.test(section)) {
      qualityScore = 74;
    }

    // Extract tags from content
    const tags: string[] = [];
    if (/adhd|neurodivergent/i.test(section)) tags.push('neurodivergent');
    if (/pain point|frustrated|broken/i.test(section)) tags.push('pain-point');
    if (/buying|would pay|budget|\$/i.test(section)) tags.push('buying-intent');
    if (/abandoned|goldmine|no maintenance/i.test(section)) tags.push('opportunity');
    if (/urgent|asap|critical/i.test(section)) tags.push('urgent');

    // Trim content to fit context window
    const trimmedContent = section
      .replace(/^#{1,3}\s+.+$/m, '') // remove heading line
      .trim()
      .slice(0, 800);

    if (trimmedContent.length > 30) {
      chunks.push({
        title,
        content: trimmedContent,
        qualityScore,
        tags,
      });
    }
  }

  // If no sections found, index the whole document as one chunk
  if (chunks.length === 0 && content.length > 50) {
    const mainHeading = content.match(HEADING_PATTERN);
    chunks.push({
      title: mainHeading ? mainHeading[1].trim() : `${feature} report`,
      content: content.slice(0, 800),
      qualityScore: 50,
      tags: [],
    });
  }

  return chunks;
}

// ── File Processor ────────────────────────────────────────────────────────────

async function processFile(filePath: string): Promise<IntelligencePoint[]> {
  const parsed = parseFilename(filePath);
  if (!parsed.valid) return [];

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  if (content.trim().length < 50) return [];

  const chunks = chunkReport(content, parsed.feature);
  const timestamp = new Date(parsed.date).getTime();

  return chunks.map((chunk, idx) => ({
    id: generatePointId(filePath, `${chunk.title}-${idx}`),
    niche: parsed.niche,
    feature: parsed.feature,
    content: chunk.content,
    title: chunk.title,
    qualityScore: chunk.qualityScore,
    timestamp,
    reportDate: parsed.date,
    sourcePath: filePath,
    tags: chunk.tags,
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[IndexReports] Starting historical report indexer...');
  console.log(`[IndexReports] Timestamp: ${new Date().toISOString()}`);
  console.log('');

  // Pre-flight: verify Qdrant connection
  console.log('[IndexReports] Checking Qdrant connection...');
  const healthy = await healthCheck();
  if (!healthy) {
    throw new Error(
      '[IndexReports] Cannot connect to Qdrant. ' +
      'Ensure QDRANT_URL and QDRANT_API_KEY are set correctly.'
    );
  }
  console.log('[IndexReports] ✅ Qdrant connection verified');

  // Ensure collection exists
  await ensureCollection();

  // Gather all report files
  const reportPatterns = [
    'data/reports/**/*.md',
    'data/intelligence/**/*.md',
  ];

  const allFiles: string[] = [];
  for (const pattern of reportPatterns) {
    const files = await glob(pattern, { cwd: process.cwd() });
    allFiles.push(...files);
  }

  console.log(`[IndexReports] Found ${allFiles.length} markdown files`);

  if (allFiles.length === 0) {
    console.log('[IndexReports] No reports found. Run intelligence features first.');
    return;
  }

  // Process files into intelligence points
  const allPoints: IntelligencePoint[] = [];
  let skippedFiles = 0;

  for (const filePath of allFiles) {
    const points = await processFile(filePath);
    if (points.length === 0) {
      skippedFiles++;
    } else {
      allPoints.push(...points);
    }
  }

  console.log(`[IndexReports] Extracted ${allPoints.length} indexable chunks from ${allFiles.length - skippedFiles} files`);
  console.log(`[IndexReports] Skipped ${skippedFiles} unparseable files`);

  // Index in batches
  console.log('[IndexReports] Indexing into Qdrant...');
  const indexed = await indexBatch(allPoints);

  // Report final stats
  const stats = await getStats();
  console.log('');
  console.log('[IndexReports] ✅ Historical indexing complete');
  console.log(`[IndexReports] Points indexed this run: ${indexed}`);
  console.log(`[IndexReports] Total points in collection: ${stats.totalPoints}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[IndexReports] ❌ Fatal error: ${msg}`);
    process.exit(1);
  });
