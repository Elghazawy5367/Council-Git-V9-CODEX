#!/usr/bin/env tsx
/**
 * Report Manager - Hierarchical Report Management System
 *
 * Transforms the flat data/reports/ directory into a hierarchical,
 * self-managing system with automatic archiving, symlinks, and registry indexing.
 *
 * Usage:
 *   npm run reports:organize   - Migrate flat files to feature/niche/date hierarchy
 *   npm run reports:archive    - Archive reports older than 60 days
 *   npm run reports:registry   - Generate JSON registry indexes
 *   npm run reports:all        - Run all three operations
 *
 * Options:
 *   --dry-run    Show what would happen without making changes
 *   --days=N     Archive reports older than N days (default: 60)
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportMetadata {
  feature: string;
  niche: string;
  date: string;
  path: string;
  size_bytes: number;
  quality_score: number;
  items_found: number;
  status: 'complete' | 'partial' | 'insufficient_data';
  last_modified: string;
}

interface Registry {
  generated_at: string;
  total_reports: number;
  by_feature: Record<string, Record<string, ReportMetadata[]>>;
  reports: ReportMetadata[];
}

interface ArchiveIndex {
  generated_at: string;
  total_archived: number;
  by_month: Record<string, ReportMetadata[]>;
  reports: ReportMetadata[];
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REPORTS_DIR = path.join(ROOT, 'data', 'reports');
const INTELLIGENCE_DIR = path.join(ROOT, 'data', 'intelligence');
const ARCHIVE_DIR = path.join(ROOT, 'data', 'archive');
const REGISTRY_DIR = path.join(ROOT, 'data', 'registry');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a flat report filename into its components.
 * Supported patterns:
 *   {feature}-{niche}-{YYYY-MM-DD}.md
 *   {feature}-{niche1}-{niche2}-{YYYY-MM-DD}.md  (niche may contain hyphens)
 *
 * The date is always the last YYYY-MM-DD segment before .md.
 */
function parseReportFilename(filename: string): { feature: string; niche: string; date: string } | null {
  const base = filename.replace(/\.md$/, '');
  // Date is always the last 10 characters in YYYY-MM-DD format
  const dateMatch = base.match(/^(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) return null;

  const date = dateMatch[2];
  const featureNiche = dateMatch[1];

  // Known multi-word features that contain hyphens
  const knownFeatures = [
    'fork-evolution',
    'reddit-sniper',
    'reddit-pain-points',
    'github-trending',
    'viral-radar',
    'hackernews',
    'stargazer',
    'goldmine',
    'mining-drill',
    'market-gap',
  ];

  let feature = '';
  let niche = '';

  for (const f of knownFeatures) {
    if (featureNiche.startsWith(f + '-')) {
      feature = f;
      niche = featureNiche.slice(f.length + 1);
      break;
    }
  }

  // Fallback: first hyphen-separated token is the feature
  if (!feature) {
    const firstHyphen = featureNiche.indexOf('-');
    if (firstHyphen === -1) return null;
    feature = featureNiche.slice(0, firstHyphen);
    niche = featureNiche.slice(firstHyphen + 1);
  }

  if (!niche) return null;
  return { feature, niche, date };
}

/**
 * Parse a filename from data/intelligence/ into feature/niche/date.
 * Supported patterns:
 *   blue-ocean-{YYYY-MM-DD}.md                  → scout / blue-ocean / date
 *   market-gaps-consolidated-{YYYY-MM-DD}.md     → market-gaps / consolidated / date
 *   market-gaps-{niche}-{YYYY-MM-DD}.md          → market-gaps / niche / date
 *   quality-pipeline-{niche}-{YYYY-MM-DD}.md     → quality-pipeline / niche / date
 */
function parseIntelligenceFilename(filename: string): { feature: string; niche: string; date: string } | null {
  const base = filename.replace(/\.md$/, '');
  const dateMatch = base.match(/^(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) return null;

  const date = dateMatch[2];
  const rest = dateMatch[1];

  // Scout: blue-ocean (no niche, just the date)
  if (rest === 'blue-ocean') {
    return { feature: 'scout', niche: 'blue-ocean', date };
  }

  // Market-gap-identifier: market-gaps-{niche}
  if (rest.startsWith('market-gaps-')) {
    const niche = rest.slice('market-gaps-'.length);
    return { feature: 'market-gaps', niche, date };
  }

  // Quality pipeline: quality-pipeline-{niche}
  if (rest.startsWith('quality-pipeline-')) {
    const niche = rest.slice('quality-pipeline-'.length);
    return { feature: 'quality-pipeline', niche, date };
  }

  return null;
}

/**
 * Calculate a quality score (0–100) based on file contents.
 * Larger files with more structured content score higher.
 */
function calculateQualityScore(content: string, sizeBytes: number): number {
  if (sizeBytes < 300) return 0;

  let score = 0;
  // Size contribution (max 40 pts)
  score += Math.min(40, Math.floor(sizeBytes / 500));
  // Section headings (## ) count (max 30 pts)
  const headings = (content.match(/^##\s/gm) || []).length;
  score += Math.min(30, headings * 3);
  // List items (* or -) count (max 20 pts)
  const listItems = (content.match(/^[\*\-]\s/gm) || []).length;
  score += Math.min(20, listItems);
  // Links count (max 10 pts)
  const links = (content.match(/https?:\/\//g) || []).length;
  score += Math.min(10, links);

  return Math.min(100, score);
}

/**
 * Count meaningful items (repos, stories, signals) in the report.
 */
function countItems(content: string): number {
  // Count top-level numbered items or repo headings
  const numbered = (content.match(/^## \d+\./gm) || []).length;
  if (numbered > 0) return numbered;
  // Fallback: count H2 headings
  return (content.match(/^## /gm) || []).length;
}

/**
 * Extract metadata from a report file.
 */
function extractMetadata(filePath: string, feature: string, niche: string, date: string): ReportMetadata {
  const stat = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const sizeBytes = stat.size;
  const qualityScore = calculateQualityScore(content, sizeBytes);
  const itemsFound = countItems(content);

  let status: ReportMetadata['status'];
  if (sizeBytes >= 1000) {
    status = 'complete';
  } else if (sizeBytes >= 300) {
    status = 'partial';
  } else {
    status = 'insufficient_data';
  }

  return {
    feature,
    niche,
    date,
    path: filePath,
    size_bytes: sizeBytes,
    quality_score: qualityScore,
    items_found: itemsFound,
    status,
    last_modified: stat.mtime.toISOString(),
  };
}

/**
 * Ensure a directory exists (mkdir -p).
 */
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create or update a symlink. On platforms that don't support symlinks
 * (e.g., Windows without developer mode) we fall back to a copy.
 */
function createSymlink(target: string, linkPath: string, dryRun: boolean): void {
  if (dryRun) {
    console.log(`  [symlink] ${linkPath} → ${target}`);
    return;
  }
  // Remove existing symlink/file
  if (fs.existsSync(linkPath) || fs.lstatSync(linkPath).isSymbolicLink?.()) {
    fs.unlinkSync(linkPath);
  }
  try {
    fs.symlinkSync(target, linkPath);
  } catch {
    // Fallback: copy the file
    fs.copyFileSync(path.join(path.dirname(linkPath), target), linkPath);
  }
}

// ---------------------------------------------------------------------------
// Core Operations
// ---------------------------------------------------------------------------

/**
 * Organize: migrate flat {feature}-{niche}-{date}.md files into
 * data/reports/{feature}/{niche}/{date}.md hierarchy.
 *
 * Only processes files that are directly in the reports root (not already
 * in sub-directories).
 */
export async function organizeReports(dryRun = false): Promise<void> {
  console.log('\n📁 Organizing reports into hierarchical structure...');
  if (dryRun) console.log('   (dry-run mode – no changes will be made)\n');

  const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });
  const flatFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('.')
  );

  let moved = 0;
  let skipped = 0;

  for (const entry of flatFiles) {
    const parsed = parseReportFilename(entry.name);
    if (!parsed) {
      console.log(`  ⚠️  Could not parse: ${entry.name}`);
      skipped++;
      continue;
    }

    const { feature, niche, date } = parsed;
    const srcPath = path.join(REPORTS_DIR, entry.name);
    const destDir = path.join(REPORTS_DIR, feature, niche);
    const destPath = path.join(destDir, `${date}.md`);

    if (fs.existsSync(destPath)) {
      // Already organised
      skipped++;
      continue;
    }

    console.log(`  📄 ${entry.name}`);
    console.log(`     → ${path.relative(ROOT, destPath)}`);

    if (!dryRun) {
      ensureDir(destDir);
      fs.renameSync(srcPath, destPath);
    }
    moved++;
  }

  console.log(`\n  ✅ Moved: ${moved}  Skipped: ${skipped}`);
}

/**
 * OrganizeIntelligenceReports: migrate Scout, Market-gap, and Quality-pipeline
 * files from data/intelligence/ into data/reports/{feature}/{niche}/YYYY-MM-DD.md.
 *
 * Only processes known patterns; other files (e.g. latest.md) are skipped.
 */
export async function organizeIntelligenceReports(dryRun = false): Promise<void> {
  console.log('\n🧠 Organizing intelligence reports (scout / market-gaps / quality-pipeline)...');
  if (dryRun) console.log('   (dry-run mode – no changes will be made)\n');

  if (!fs.existsSync(INTELLIGENCE_DIR)) {
    console.log('  ℹ️  data/intelligence/ not found, skipping.');
    return;
  }

  const entries = fs.readdirSync(INTELLIGENCE_DIR, { withFileTypes: true });
  const flatFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('.')
  );

  let moved = 0;
  let skipped = 0;

  for (const entry of flatFiles) {
    // Skip existing symlinks (e.g. latest.md)
    const fullPath = path.join(INTELLIGENCE_DIR, entry.name);
    try {
      if (fs.lstatSync(fullPath).isSymbolicLink()) {
        skipped++;
        continue;
      }
    } catch {
      skipped++;
      continue;
    }

    const parsed = parseIntelligenceFilename(entry.name);
    if (!parsed) {
      console.log(`  ⚠️  Skipped (unrecognised pattern): ${entry.name}`);
      skipped++;
      continue;
    }

    const { feature, niche, date } = parsed;
    const destDir = path.join(REPORTS_DIR, feature, niche);
    const destPath = path.join(destDir, `${date}.md`);

    if (fs.existsSync(destPath)) {
      skipped++;
      continue;
    }

    console.log(`  📄 intelligence/${entry.name}`);
    console.log(`     → ${path.relative(ROOT, destPath)}`);

    if (!dryRun) {
      ensureDir(destDir);
      fs.renameSync(fullPath, destPath);
    }
    moved++;
  }

  console.log(`\n  ✅ Moved: ${moved}  Skipped: ${skipped}`);
}

/**
 * UpdateLatestSymlinks: create/update latest.md symlinks in each
 * data/reports/{feature}/{niche}/ directory pointing to the newest date.
 */
export async function updateLatestSymlinks(dryRun = false): Promise<void> {
  console.log('\n🔗 Updating latest.md symlinks...');
  if (dryRun) console.log('   (dry-run mode)\n');

  if (!fs.existsSync(REPORTS_DIR)) return;

  let updated = 0;

  const features = fs.readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const feature of features) {
    const featureDir = path.join(REPORTS_DIR, feature);
    const niches = fs.readdirSync(featureDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const niche of niches) {
      const nicheDir = path.join(featureDir, niche);
      const dateMds = fs.readdirSync(nicheDir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
        .sort()
        .reverse();

      if (dateMds.length === 0) continue;

      const latest = dateMds[0]; // Most recent (sorted desc)
      const linkPath = path.join(nicheDir, 'latest.md');

      console.log(`  🔗 ${feature}/${niche}/latest.md → ${latest}`);

      if (!dryRun) {
        // Remove existing symlink safely
        try {
          if (fs.existsSync(linkPath) || fs.lstatSync(linkPath).isSymbolicLink()) {
            fs.unlinkSync(linkPath);
          }
        } catch {
          // ignore if not exists
        }
        try {
          fs.symlinkSync(latest, linkPath);
        } catch {
          // Fallback: copy
          fs.copyFileSync(path.join(nicheDir, latest), linkPath);
        }
      }
      updated++;
    }
  }

  console.log(`\n  ✅ Updated: ${updated} symlinks`);
}

/**
 * ArchiveOldReports: move reports older than `daysOld` from
 * data/reports/{feature}/{niche}/ to data/archive/{YYYY-MM}/{feature}/{niche}/.
 */
export async function archiveOldReports(daysOld = 60, dryRun = false): Promise<void> {
  console.log(`\n📦 Archiving reports older than ${daysOld} days...`);
  if (dryRun) console.log('   (dry-run mode)\n');

  if (!fs.existsSync(REPORTS_DIR)) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  let archived = 0;

  const features = fs.readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const feature of features) {
    const featureDir = path.join(REPORTS_DIR, feature);
    const niches = fs.readdirSync(featureDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const niche of niches) {
      const nicheDir = path.join(featureDir, niche);
      const mdFiles = fs.readdirSync(nicheDir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));

      for (const file of mdFiles) {
        const dateStr = file.replace('.md', '');
        const fileDate = new Date(dateStr);
        if (isNaN(fileDate.getTime()) || fileDate >= cutoff) continue;

        const monthBucket = dateStr.slice(0, 7); // YYYY-MM
        const srcPath = path.join(nicheDir, file);
        const destDir = path.join(ARCHIVE_DIR, monthBucket, feature, niche);
        const destPath = path.join(destDir, file);

        console.log(`  📦 ${path.relative(ROOT, srcPath)}`);
        console.log(`     → ${path.relative(ROOT, destPath)}`);

        if (!dryRun) {
          ensureDir(destDir);
          fs.renameSync(srcPath, destPath);
        }
        archived++;
      }

      // Remove empty niche/feature directories after archiving
      if (!dryRun) {
        try {
          const remaining = fs.readdirSync(nicheDir).filter((f) => f !== 'latest.md');
          if (remaining.length === 0) {
            // Remove symlink too
            const symlinkPath = path.join(nicheDir, 'latest.md');
            if (fs.existsSync(symlinkPath) || (fs.lstatSync(symlinkPath)?.isSymbolicLink?.() ?? false)) {
              fs.unlinkSync(symlinkPath);
            }
            fs.rmdirSync(nicheDir);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  console.log(`\n  ✅ Archived: ${archived} reports`);
}

/**
 * GenerateRegistry: scan hierarchical structure (and archive) and write
 * data/registry/current.json and data/registry/archive-index.json.
 */
export async function generateRegistry(dryRun = false): Promise<void> {
  console.log('\n📋 Generating registry indexes...');
  if (dryRun) console.log('   (dry-run mode)\n');

  ensureDir(REGISTRY_DIR);

  // --- current.json ---
  const activeReports: ReportMetadata[] = [];
  const byFeature: Record<string, Record<string, ReportMetadata[]>> = {};

  if (fs.existsSync(REPORTS_DIR)) {
    const features = fs.readdirSync(REPORTS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const feature of features) {
      const featureDir = path.join(REPORTS_DIR, feature);
      const niches = fs.readdirSync(featureDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);

      for (const niche of niches) {
        const nicheDir = path.join(featureDir, niche);
        const mdFiles = fs.readdirSync(nicheDir)
          .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));

        for (const file of mdFiles) {
          const date = file.replace('.md', '');
          const filePath = path.join(nicheDir, file);
          const meta = extractMetadata(filePath, feature, niche, date);
          activeReports.push(meta);

          if (!byFeature[feature]) byFeature[feature] = {};
          if (!byFeature[feature][niche]) byFeature[feature][niche] = [];
          byFeature[feature][niche].push(meta);
        }
      }
    }
  }

  const registry: Registry = {
    generated_at: new Date().toISOString(),
    total_reports: activeReports.length,
    by_feature: byFeature,
    reports: activeReports.sort((a, b) => b.date.localeCompare(a.date)),
  };

  const currentPath = path.join(REGISTRY_DIR, 'current.json');
  console.log(`  📝 ${path.relative(ROOT, currentPath)} (${activeReports.length} reports)`);
  if (!dryRun) {
    fs.writeFileSync(currentPath, JSON.stringify(registry, null, 2), 'utf-8');
  }

  // --- archive-index.json ---
  const archivedReports: ReportMetadata[] = [];
  const byMonth: Record<string, ReportMetadata[]> = {};

  if (fs.existsSync(ARCHIVE_DIR)) {
    const months = fs.readdirSync(ARCHIVE_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const month of months) {
      const monthDir = path.join(ARCHIVE_DIR, month);
      const features = fs.readdirSync(monthDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);

      for (const feature of features) {
        const featureDir = path.join(monthDir, feature);
        const niches = fs.readdirSync(featureDir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name);

        for (const niche of niches) {
          const nicheDir = path.join(featureDir, niche);
          const mdFiles = fs.readdirSync(nicheDir)
            .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));

          for (const file of mdFiles) {
            const date = file.replace('.md', '');
            const filePath = path.join(nicheDir, file);
            const meta = extractMetadata(filePath, feature, niche, date);
            archivedReports.push(meta);

            if (!byMonth[month]) byMonth[month] = [];
            byMonth[month].push(meta);
          }
        }
      }
    }
  }

  const archiveIndex: ArchiveIndex = {
    generated_at: new Date().toISOString(),
    total_archived: archivedReports.length,
    by_month: byMonth,
    reports: archivedReports.sort((a, b) => b.date.localeCompare(a.date)),
  };

  const archivePath = path.join(REGISTRY_DIR, 'archive-index.json');
  console.log(`  📝 ${path.relative(ROOT, archivePath)} (${archivedReports.length} archived)`);
  if (!dryRun) {
    fs.writeFileSync(archivePath, JSON.stringify(archiveIndex, null, 2), 'utf-8');
  }

  console.log('\n  ✅ Registry generated');
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export function getStatistics(): void {
  console.log('\n📊 Report Statistics\n');

  const countInDir = (dir: string, depth = 0): number => {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md') && /^\d{4}-\d{2}-\d{2}\.md$/.test(entry.name)) {
        count++;
      } else if (entry.isDirectory() && depth < 3) {
        count += countInDir(path.join(dir, entry.name), depth + 1);
      }
    }
    return count;
  };

  const activeCount = countInDir(REPORTS_DIR);
  const archivedCount = countInDir(ARCHIVE_DIR);

  console.log(`  Active reports:   ${activeCount}`);
  console.log(`  Archived reports: ${archivedCount}`);
  console.log(`  Total:            ${activeCount + archivedCount}`);

  if (fs.existsSync(REPORTS_DIR)) {
    const features = fs.readdirSync(REPORTS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    console.log(`\n  Features (${features.length}):`);
    for (const feature of features) {
      const featureDir = path.join(REPORTS_DIR, feature);
      const count = countInDir(featureDir);
      console.log(`    ${feature}: ${count} reports`);
    }
  }
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const daysArg = args.find((a) => a.startsWith('--days='));
  const daysOld = daysArg ? parseInt(daysArg.split('=')[1], 10) : 60;

  const showHelp = args.includes('--help') || args.includes('-h');
  const runOrganize = args.includes('--organize') || args.includes('organize');
  const runArchive = args.includes('--archive') || args.includes('archive');
  const runRegistry = args.includes('--registry') || args.includes('registry');
  const runStats = args.includes('--stats') || args.includes('stats');
  const runAll = args.includes('--all') || args.includes('all') || args.length === 0 || (dryRun && args.length === 1);

  if (showHelp) {
    console.log(`
Report Manager - Hierarchical Report Management System

Usage:
  npx tsx scripts/report-manager.ts [command] [options]

Commands:
  organize    Migrate flat reports (data/reports/ + data/intelligence/) to hierarchy
  archive     Archive reports older than --days (default: 60)
  registry    Generate JSON registry indexes
  stats       Show report statistics
  all         Run organize + archive + registry (default)

Features handled:
  data/reports/   → stargazer, fork-evolution, hackernews, reddit-sniper,
                    reddit-pain-points, viral-radar, goldmine, github-trending
  data/intelligence/ → scout (blue-ocean), market-gaps, quality-pipeline

Options:
  --dry-run   Show what would happen without making changes
  --days=N    Archive threshold in days (default: 60)
  --help      Show this help message

NPM scripts:
  npm run reports:organize
  npm run reports:archive
  npm run reports:registry
  npm run reports:all
`);
    return;
  }

  console.log('🗂️  Report Manager');
  console.log('==================');

  try {
    if (runStats) {
      getStatistics();
      return;
    }

    if (runOrganize || runAll) {
      await organizeReports(dryRun);
      await organizeIntelligenceReports(dryRun);
    }
    if (runArchive || runAll) {
      await archiveOldReports(daysOld, dryRun);
    }
    if (runRegistry || runAll) {
      await updateLatestSymlinks(dryRun);
      await generateRegistry(dryRun);
    }

    if (!runOrganize && !runArchive && !runRegistry && !runStats && !runAll) {
      console.log('No command specified. Run with --help for usage.');
    }

    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Report Manager failed:', error);
    process.exit(1);
  }
}

main();
