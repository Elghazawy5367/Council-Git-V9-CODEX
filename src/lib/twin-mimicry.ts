/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Twin Mimicry - Elite Developer Analysis
 * 
 * Analyzes git blame and commit history of top developers.
 * Extracts "Mental Models" to train AI Experts with elite thinking patterns.
 * 
 * Priority: 8/10
 * Effort: High
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
export interface DeveloperProfile {
  username: string;
  email: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;

  // Mental models
  commitPatterns: string[];
  architecturalDecisions: string[];
  refactoringPatterns: string[];
  testingApproach: string;
  documentationStyle: string;

  // File expertise
  expertiseAreas: string[];
  mostEditedFiles: string[];

  // Timing patterns
  averageCommitSize: number;
  commitFrequency: string;
  peakCommitTimes: string[];
}
export interface TwinMimicryReport {
  repository: string;
  targetDeveloper: string;
  profile: DeveloperProfile;
  mentalModels: string[];
  trainingPrompts: string[];
  recommendations: string[];
  timestamp: Date;
}
export interface TwinMimicryConfig {
  repoPath: string;
  targetDeveloper?: string;
  minCommits?: number;
  includeTests?: boolean;
}

/**
 * Get git log for a specific author
 */
function getGitLog(repoPath: string, author?: string): string {
  try {
    const authorFilter = author ? `--author="${author}"` : '';
    const command = `cd "${repoPath}" && git log ${authorFilter} --pretty=format:"%H|%an|%ae|%at|%s" --numstat`;
    return execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024
    });
  } catch (error) {
    throw new Error(`Failed to get git log: ${error}`);
  }
}

/* Reserved for future UI integration
function _getGitBlame(repoPath: string, file: string, author?: string): string {
  try {
    const command = `cd "${repoPath}" && git blame "${file}" --line-porcelain`;
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    
    if (author) {
      // Filter by author
      const lines = output.split('\n');
      return lines.filter(line => line.includes(author)).join('\n');
    }
    
    return output;
  } catch (error) {
    return '';
  }
}
*/

/**
 * Find top contributors in repository
 */
function findTopContributors(repoPath: string, limit: number = 10): Array<{
  name: string;
  commits: number;
}> {
  try {
    const command = `cd "${repoPath}" && git shortlog -sn --no-merges | head -${limit}`;
    const output = execSync(command, {
      encoding: 'utf-8'
    });
    return output.trim().split('\n').map(line => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (match) {
        return {
          name: match[2],
          commits: parseInt(match[1])
        };
      }
      return {
        name: '',
        commits: 0
      };
    }).filter(c => c.name);
  } catch (error) {
    return [];
  }
}

/**
 * Parse git log to extract developer insights
 */
function parseGitLog(logOutput: string): DeveloperProfile {
  const lines = logOutput.split('\n');
  const commits: Array<{
    hash: string;
    author: string;
    email: string;
    timestamp: number;
    message: string;
    files: Array<{
      added: number;
      removed: number;
      path: string;
    }>;
  }> = [];
  let currentCommit: any = null;
  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|');
      if (parts.length === 5) {
        // New commit
        if (currentCommit) {
          commits.push(currentCommit);
        }
        currentCommit = {
          hash: parts[0],
          author: parts[1],
          email: parts[2],
          timestamp: parseInt(parts[3]),
          message: parts[4],
          files: []
        };
      }
    } else if (line.trim() && currentCommit) {
      // File change stats
      const match = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
      if (match) {
        currentCommit.files.push({
          added: match[1] === '-' ? 0 : parseInt(match[1]),
          removed: match[2] === '-' ? 0 : parseInt(match[2]),
          path: match[3]
        });
      }
    }
  }
  if (currentCommit) {
    commits.push(currentCommit);
  }

  // Aggregate statistics
  let totalAdded = 0;
  let totalRemoved = 0;
  const filesChanged = new Set<string>();
  const fileEdits = new Map<string, number>();
  const commitPatterns = new Set<string>();
  const architecturalDecisions: string[] = [];
  const refactoringPatterns: string[] = [];
  for (const commit of commits) {
    for (const file of commit.files) {
      totalAdded += file.added;
      totalRemoved += file.removed;
      filesChanged.add(file.path);
      fileEdits.set(file.path, (fileEdits.get(file.path) || 0) + 1);
    }

    // Analyze commit message patterns
    const msg = commit.message.toLowerCase();
    if (msg.startsWith('feat:') || msg.startsWith('feature:')) {
      commitPatterns.add('Feature-driven commits');
    }
    if (msg.startsWith('fix:') || msg.startsWith('bugfix:')) {
      commitPatterns.add('Fix-focused commits');
    }
    if (msg.startsWith('refactor:')) {
      commitPatterns.add('Refactoring discipline');
      refactoringPatterns.push(commit.message);
    }
    if (msg.startsWith('docs:')) {
      commitPatterns.add('Documentation-conscious');
    }
    if (msg.startsWith('test:')) {
      commitPatterns.add('Test-driven development');
    }

    // Detect architectural decisions
    if (msg.includes('architecture') || msg.includes('redesign') || msg.includes('restructure')) {
      architecturalDecisions.push(commit.message);
    }
  }

  // Determine expertise areas from file paths
  const expertiseAreas = new Set<string>();
  for (const file of filesChanged) {
    const dir = path.dirname(file);
    const parts = dir.split('/');
    if (parts.length > 0 && parts[0] !== '.') {
      expertiseAreas.add(parts[0]);
    }
  }

  // Most edited files
  const mostEditedFiles = Array.from(fileEdits.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([file]) => file);

  // Testing approach
  const testFiles = Array.from(filesChanged).filter(f => f.includes('test') || f.includes('spec') || f.includes('__tests__'));
  const testingApproach = testFiles.length > 0 ? `Writes tests (${testFiles.length} test files)` : 'No visible test files';

  // Documentation style
  const docFiles = Array.from(filesChanged).filter(f => f.toLowerCase().includes('readme') || f.toLowerCase().includes('doc'));
  const documentationStyle = docFiles.length > 0 ? `Documents code (${docFiles.length} doc files)` : 'Minimal documentation';

  // Average commit size
  const averageCommitSize = commits.length > 0 ? Math.round((totalAdded + totalRemoved) / commits.length) : 0;

  // Commit frequency analysis
  const timestamps = commits.map(c => c.timestamp * 1000);
  const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
  const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
  const commitFrequency = daysSpan > 0 ? `${(commits.length / daysSpan).toFixed(1)} commits/day` : 'N/A';

  // Peak commit times (hour of day)
  const hours = commits.map(c => new Date(c.timestamp * 1000).getHours());
  const hourCounts = new Map<number, number>();
  for (const hour of hours) {
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const peakHours = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([hour]) => `${hour}:00`);
  const profile: DeveloperProfile = {
    username: commits[0]?.author || 'Unknown',
    email: commits[0]?.email || '',
    commits: commits.length,
    linesAdded: totalAdded,
    linesRemoved: totalRemoved,
    filesChanged: filesChanged.size,
    commitPatterns: Array.from(commitPatterns),
    architecturalDecisions: architecturalDecisions.slice(0, 5),
    refactoringPatterns: refactoringPatterns.slice(0, 5),
    testingApproach,
    documentationStyle,
    expertiseAreas: Array.from(expertiseAreas).slice(0, 5),
    mostEditedFiles,
    averageCommitSize,
    commitFrequency,
    peakCommitTimes: peakHours
  };
  return profile;
}

/**
 * Extract mental models from developer profile
 */
function extractMentalModels(profile: DeveloperProfile): string[] {
  const models: string[] = [];

  // Code organization
  if (profile.expertiseAreas.length > 3) {
    models.push(`Full-stack mindset: Works across ${profile.expertiseAreas.join(', ')}`);
  } else if (profile.expertiseAreas.length > 0) {
    models.push(`Specialized focus: Deep expertise in ${profile.expertiseAreas[0]}`);
  }

  // Commit patterns
  if (profile.commitPatterns.includes('Feature-driven commits')) {
    models.push('Feature-driven development: Focuses on delivering user value');
  }
  if (profile.commitPatterns.includes('Refactoring discipline')) {
    models.push('Code quality advocate: Regular refactoring for maintainability');
  }
  if (profile.commitPatterns.includes('Test-driven development')) {
    models.push('Test-driven approach: Writes tests alongside features');
  }

  // Commit size
  if (profile.averageCommitSize < 100) {
    models.push('Small commits philosophy: Atomic, focused changes');
  } else if (profile.averageCommitSize > 500) {
    models.push('Large commits: Comprehensive changes per commit');
  }

  // Work patterns
  if (profile.commitFrequency.includes('commits/day')) {
    const rate = parseFloat(profile.commitFrequency);
    if (rate > 5) {
      models.push('High velocity: Rapid iteration and experimentation');
    } else if (rate < 1) {
      models.push('Deliberate development: Thoughtful, measured progress');
    }
  }

  // Documentation
  if (profile.documentationStyle.includes('Documents code')) {
    models.push('Documentation-first: Values clear communication');
  }

  // Architectural thinking
  if (profile.architecturalDecisions.length > 0) {
    models.push('Systems thinker: Makes high-level architectural decisions');
  }
  return models;
}

/**
 * Generate training prompts for AI experts
 */
function generateTrainingPrompts(profile: DeveloperProfile, models: string[]): string[] {
  const prompts: string[] = [];
  prompts.push(`You are an AI expert trained in the style of ${profile.username}, ` + `a developer with ${profile.commits} commits across ${profile.filesChanged} files. ` + `Their mental models include: ${models.join('; ')}. ` + `Apply their approach to solving problems.`);
  if (profile.commitPatterns.length > 0) {
    prompts.push(`When reviewing code, prioritize: ${profile.commitPatterns.join(', ')}. ` + `This mirrors ${profile.username}'s development philosophy.`);
  }
  if (profile.expertiseAreas.length > 0) {
    prompts.push(`You have deep expertise in: ${profile.expertiseAreas.join(', ')}. ` + `Leverage this specialization when providing guidance.`);
  }
  return prompts;
}

/**
 * Run Twin Mimicry analysis
 */
export async function analyzeTwinMimicry(config: TwinMimicryConfig): Promise<TwinMimicryReport> {
  const {
    repoPath,
    targetDeveloper,
    minCommits = 10
  } = config;
  // Find top contributors if no target specified
  let developer = targetDeveloper;
  if (!developer) {
    const contributors = findTopContributors(repoPath);
    if (contributors.length === 0) {
      throw new Error('No contributors found in repository');
    }
    contributors.slice(0, 5).forEach((c, i) => {});
    developer = contributors[0].name;
  }

  // Get git log

  const gitLog = getGitLog(repoPath, developer);

  // Parse and analyze

  const profile = parseGitLog(gitLog);
  if (profile.commits < minCommits) {
    throw new Error(`Insufficient commits (${profile.commits} < ${minCommits})`);
  }
  const mentalModels = extractMentalModels(profile);
  const trainingPrompts = generateTrainingPrompts(profile, mentalModels);

  // Generate recommendations
  const recommendations: string[] = [];
  if (profile.testingApproach.includes('Writes tests')) {
    recommendations.push('Adopt test-driven development approach');
  }
  if (profile.commitPatterns.includes('Refactoring discipline')) {
    recommendations.push('Schedule regular refactoring sessions');
  }
  if (profile.averageCommitSize < 100) {
    recommendations.push('Make smaller, more focused commits');
  }
  if (profile.documentationStyle.includes('Documents code')) {
    recommendations.push('Improve documentation coverage');
  }
  const report: TwinMimicryReport = {
    repository: path.basename(repoPath),
    targetDeveloper: developer,
    profile,
    mentalModels,
    trainingPrompts,
    recommendations,
    timestamp: new Date()
  };
  // Save results
  const outputPath = path.join(process.cwd(), 'data', 'twin-mimicry.json');
  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true
  });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  // Generate report
  generateTwinReport(report);
  return report;
}

/**
 * Generate human-readable report
 */
function generateTwinReport(report: TwinMimicryReport): void {
  let markdown = `# 👥 Twin Mimicry Report\n\n`;
  markdown += `**Repository:** ${report.repository}\n`;
  markdown += `**Developer:** ${report.targetDeveloper}\n`;
  markdown += `**Analyzed:** ${new Date().toISOString()}\n\n`;
  markdown += `## 📊 Developer Profile\n\n`;
  markdown += `- **Commits:** ${report.profile.commits}\n`;
  markdown += `- **Lines Added:** ${report.profile.linesAdded.toLocaleString()}\n`;
  markdown += `- **Lines Removed:** ${report.profile.linesRemoved.toLocaleString()}\n`;
  markdown += `- **Files Changed:** ${report.profile.filesChanged}\n`;
  markdown += `- **Average Commit Size:** ${report.profile.averageCommitSize} lines\n`;
  markdown += `- **Commit Frequency:** ${report.profile.commitFrequency}\n`;
  markdown += `- **Peak Commit Times:** ${report.profile.peakCommitTimes.join(', ')}\n\n`;
  markdown += `## 🎯 Expertise Areas\n\n`;
  for (const area of report.profile.expertiseAreas) {
    markdown += `- ${area}\n`;
  }
  markdown += `\n## 📝 Commit Patterns\n\n`;
  for (const pattern of report.profile.commitPatterns) {
    markdown += `- ${pattern}\n`;
  }
  markdown += `\n## 🧠 Mental Models\n\n`;
  for (const model of report.mentalModels) {
    markdown += `- ${model}\n`;
  }
  markdown += `\n## 🤖 AI Training Prompts\n\n`;
  for (let i = 0; i < report.trainingPrompts.length; i++) {
    markdown += `### Prompt ${i + 1}\n\n`;
    markdown += `\`\`\`\n${report.trainingPrompts[i]}\n\`\`\`\n\n`;
  }
  markdown += `## 💡 Recommendations\n\n`;
  for (const rec of report.recommendations) {
    markdown += `- ${rec}\n`;
  }
  markdown += `\n## 📂 Most Edited Files\n\n`;
  for (const file of report.profile.mostEditedFiles.slice(0, 10)) {
    markdown += `- ${file}\n`;
  }
  if (report.profile.architecturalDecisions.length > 0) {
    markdown += `\n## 🏛️ Architectural Decisions\n\n`;
    for (const decision of report.profile.architecturalDecisions) {
      markdown += `- ${decision}\n`;
    }
  }
  const reportPath = path.join(process.cwd(), 'data', 'reports', 'twin-mimicry.md');
  fs.mkdirSync(path.dirname(reportPath), {
    recursive: true
  });
  fs.writeFileSync(reportPath, markdown);
}

/**
 * CLI interface
 */
export async function runTwinMimicry(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    return;
  }
  const repoPath = args[0] || '.';
  const devIndex = args.indexOf('--dev');
  const minIndex = args.indexOf('--min');
  const config: TwinMimicryConfig = {
    repoPath,
    targetDeveloper: devIndex !== -1 ? args[devIndex + 1] : undefined,
    minCommits: minIndex !== -1 ? parseInt(args[minIndex + 1]) : undefined
  };
  await analyzeTwinMimicry(config);
}

// Run if called directly (ESM-compatible)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTwinMimicry().catch(console.error);
}