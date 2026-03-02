/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Twin Mimicry V2 - MOE Pattern Extraction
 * 
 * Analyzes elite MOE repositories to extract proven patterns:
 * - microsoft/autogen: Multi-agent communication
 * - joaomdmoura/crewAI: Role-based architecture
 * - langchain-ai/langgraph: State machine workflows
 * - open-webui/open-webui: Chat UI components
 * 
 * Generates Council-specific integration recommendations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Re-export original types for backward compatibility
export {
  DeveloperProfile,
  TwinMimicryReport,
  TwinMimicryConfig,
} from './twin-mimicry';

/**
 * MOE Pattern types
 */
export type MOEPatternType = 'communication' | 'role' | 'workflow' | 'ui';

export interface MOEPattern {
  type: MOEPatternType;
  name: string;
  description: string;
  files: string[];
  codeSnippets: string[];
  confidence: number; // 0-1
  councilMapping: string; // How this maps to Council
  integrationSteps: string[];
  preserveAlgorithms: string[]; // Council algorithms to keep
}

export interface MOEPatterns {
  communicationPatterns: MOEPattern[];
  rolePatterns: MOEPattern[];
  workflowPatterns: MOEPattern[];
  uiPatterns: MOEPattern[];
}

export interface CouncilAdaptation {
  pattern: string;
  status: 'implemented' | 'recommended' | 'future';
  priority: 'high' | 'medium' | 'low';
  description: string;
  codeExample?: string;
  integrationGuide: string[];
}

export interface MOEAnalysisReport {
  repository: string;
  repositoryType: 'autogen' | 'crewai' | 'langgraph' | 'open-webui' | 'unknown';
  targetDeveloper?: string;
  moePatterns: MOEPatterns;
  councilAdaptations: CouncilAdaptation[];
  preserveRecommendations: string[];
  integrationRoadmap: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  timestamp: Date;
}

/**
 * Detect repository type from file patterns
 */
function detectRepositoryType(repoPath: string): 'autogen' | 'crewai' | 'langgraph' | 'open-webui' | 'unknown' {
  try {
    // Check for distinctive files
    const files = execSync(`cd "${repoPath}" && find . -maxdepth 3 -type f -name "*.py" -o -name "*.ts" -o -name "*.svelte" 2>/dev/null | head -50`, {
      encoding: 'utf-8'
    }).split('\n');

    const fileSet = new Set(files.map(f => f.toLowerCase()));

    // AutoGen patterns
    if (Array.from(fileSet).some(f => f.includes('conversable_agent') || f.includes('groupchat'))) {
      return 'autogen';
    }

    // CrewAI patterns
    if (Array.from(fileSet).some(f => f.includes('crew.py') || f.includes('agent.py') && f.includes('crewai'))) {
      return 'crewai';
    }

    // LangGraph patterns
    if (Array.from(fileSet).some(f => f.includes('graph') && f.includes('langgraph'))) {
      return 'langgraph';
    }

    // Open-WebUI patterns
    if (Array.from(fileSet).some(f => f.includes('.svelte') || f.includes('open-webui'))) {
      return 'open-webui';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Find MOE-relevant files in repository
 */
function findMOEFiles(repoPath: string, repoType: string): string[] {
  const patterns: Record<string, string[]> = {
    autogen: ['conversable_agent', 'groupchat', 'chat', 'agent', 'autobuild'],
    crewai: ['agent', 'crew', 'task', 'role', 'process'],
    langgraph: ['graph', 'state', 'pregel', 'checkpoint', 'workflow'],
    'open-webui': ['chat', 'message', 'stream', 'markdown', 'code']
  };

  const searchPatterns = patterns[repoType] || ['agent', 'chat', 'workflow'];
  const files: string[] = [];

  for (const pattern of searchPatterns) {
    try {
      const result = execSync(
        `cd "${repoPath}" && find . -type f \\( -name "*${pattern}*.py" -o -name "*${pattern}*.ts" -o -name "*${pattern}*.svelte" \\) 2>/dev/null | head -20`,
        { encoding: 'utf-8' }
      );
      files.push(...result.trim().split('\n').filter(Boolean));
    } catch {
      // Continue if pattern not found
    }
  }

  return [...new Set(files)].slice(0, 30);
}

/**
 * Extract code snippets from file
 */
function extractCodeSnippets(repoPath: string, file: string, keywords: string[]): string[] {
  try {
    const content = fs.readFileSync(path.join(repoPath, file), 'utf-8');
    const lines = content.split('\n');
    const snippets: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(kw => line.includes(kw.toLowerCase()))) {
        // Extract context (5 lines before and after)
        const start = Math.max(0, i - 5);
        const end = Math.min(lines.length, i + 6);
        const snippet = lines.slice(start, end).join('\n');
        snippets.push(snippet);
      }
    }

    return snippets.slice(0, 3); // Limit to 3 snippets per file
  } catch {
    return [];
  }
}

/**
 * Analyze AutoGen patterns
 */
function analyzeAutoGenPatterns(repoPath: string, files: string[]): MOEPattern[] {
  const patterns: MOEPattern[] = [];

  // ConversableAgent pattern
  const conversableFiles = files.filter(f => f.includes('conversable') || f.includes('agent'));
  if (conversableFiles.length > 0) {
    patterns.push({
      type: 'communication',
      name: 'ConversableAgent Message Loop',
      description: 'Agent-to-agent message passing with conversation state',
      files: conversableFiles,
      codeSnippets: extractCodeSnippets(repoPath, conversableFiles[0], ['receive', 'send', 'generate_reply']),
      confidence: 0.9,
      councilMapping: 'Already implemented via ExpertMessage interface',
      integrationSteps: [
        'Pattern already integrated in Council',
        'See src/features/council/lib/types.ts - ExpertMessage',
        'Enhanced with message types (response, question, critique)',
      ],
      preserveAlgorithms: [
        'Expert 3D scoring (accuracy, completeness, conciseness)',
        'Synthesis algorithms',
        'Judge commentary generation',
      ],
    });
  }

  // GroupChat pattern
  const groupFiles = files.filter(f => f.includes('group') || f.includes('chat'));
  if (groupFiles.length > 0) {
    patterns.push({
      type: 'communication',
      name: 'GroupChat Orchestration',
      description: 'Multi-agent conversation orchestration with speaker selection',
      files: groupFiles,
      codeSnippets: extractCodeSnippets(repoPath, groupFiles[0], ['select_speaker', 'broadcast', 'round']),
      confidence: 0.85,
      councilMapping: 'Maps to Council execution modes (parallel, sequential, adversarial)',
      integrationSteps: [
        'Enhance execution-store with speaker selection',
        'Add round-robin pattern for sequential mode',
        'Implement broadcast in parallel mode',
      ],
      preserveAlgorithms: [
        'Mode-specific behaviors (parallel, consensus, adversarial)',
        'Expert output tracking',
        'Synthesis tier selection',
      ],
    });
  }

  return patterns;
}

/**
 * Analyze CrewAI patterns
 */
function analyzeCrewAIPatterns(repoPath: string, files: string[]): MOEPattern[] {
  const patterns: MOEPattern[] = [];

  // Role-based agent pattern
  const agentFiles = files.filter(f => f.includes('agent'));
  if (agentFiles.length > 0) {
    patterns.push({
      type: 'role',
      name: 'Role-Based Agent Definition',
      description: 'Agents with explicit roles, goals, and backstories',
      files: agentFiles,
      codeSnippets: extractCodeSnippets(repoPath, agentFiles[0], ['role', 'goal', 'backstory', 'delegation']),
      confidence: 0.88,
      councilMapping: 'Enhance Expert interface with CrewAI role fields',
      integrationSteps: [
        'Add Expert.specialty field (detailed role description)',
        'Add Expert.backstory field (context for personality)',
        'Add Expert.delegation flag (can delegate to other experts)',
        'Preserve existing Expert.role and Expert.basePersona',
      ],
      preserveAlgorithms: [
        'Expert persona library (Blue Ocean Strategist, etc.)',
        'Model selection logic',
        'Knowledge file integration',
      ],
    });
  }

  // Task coordination pattern
  const crewFiles = files.filter(f => f.includes('crew') || f.includes('task'));
  if (crewFiles.length > 0) {
    patterns.push({
      type: 'workflow',
      name: 'Crew Task Coordination',
      description: 'Hierarchical task assignment and execution',
      files: crewFiles,
      codeSnippets: extractCodeSnippets(repoPath, crewFiles[0], ['task', 'assign', 'execute', 'process']),
      confidence: 0.82,
      councilMapping: 'Add task assignment to Council synthesis flow',
      integrationSteps: [
        'Create Task interface with assignee and dependencies',
        'Add task queue to execution context',
        'Implement task dependency resolution',
      ],
      preserveAlgorithms: [
        'Synthesis engine (quick, balanced, deep)',
        'Judge modes (ruthless, consensus, debate)',
        'Output formatting',
      ],
    });
  }

  return patterns;
}

/**
 * Analyze LangGraph patterns
 */
function analyzeLangGraphPatterns(repoPath: string, files: string[]): MOEPattern[] {
  const patterns: MOEPattern[] = [];

  // StateGraph pattern
  const graphFiles = files.filter(f => f.includes('graph') || f.includes('state'));
  if (graphFiles.length > 0) {
    patterns.push({
      type: 'workflow',
      name: 'StateGraph with Conditional Edges',
      description: 'State machine workflow with conditional transitions',
      files: graphFiles,
      codeSnippets: extractCodeSnippets(repoPath, graphFiles[0], ['StateGraph', 'add_node', 'add_edge', 'conditional']),
      confidence: 0.90,
      councilMapping: 'Add state machine to synthesis engine',
      integrationSteps: [
        'Create SynthesisState interface (stage, transitions, data)',
        'Add conditional routing based on expert outputs',
        'Implement state checkpoints for resume capability',
        'Add state visualization for debugging',
      ],
      preserveAlgorithms: [
        'Multi-tier synthesis (quick, balanced, deep)',
        'Expert weight calculation',
        'Contradiction detection',
      ],
    });
  }

  // Checkpoint pattern
  const checkpointFiles = files.filter(f => f.includes('checkpoint') || f.includes('pregel'));
  if (checkpointFiles.length > 0) {
    patterns.push({
      type: 'workflow',
      name: 'Workflow Checkpointing',
      description: 'Save and resume workflow state',
      files: checkpointFiles,
      codeSnippets: extractCodeSnippets(repoPath, checkpointFiles[0], ['checkpoint', 'save', 'resume', 'restore']),
      confidence: 0.78,
      councilMapping: 'Add checkpointing to execution store',
      integrationSteps: [
        'Add checkpoint() method to execution store',
        'Persist execution state to IndexedDB',
        'Add resume capability to executeCouncilExperts()',
        'Handle partial execution recovery',
      ],
      preserveAlgorithms: [
        'Expert execution tracking',
        'Synthesis caching',
        'Error handling',
      ],
    });
  }

  return patterns;
}

/**
 * Analyze Open-WebUI patterns
 */
function analyzeOpenWebUIPatterns(repoPath: string, files: string[]): MOEPattern[] {
  const patterns: MOEPattern[] = [];

  // Streaming chat pattern
  const chatFiles = files.filter(f => f.includes('chat') || f.includes('message'));
  if (chatFiles.length > 0) {
    patterns.push({
      type: 'ui',
      name: 'Streaming Chat with Typewriter Effect',
      description: 'Real-time text streaming with smooth animation',
      files: chatFiles,
      codeSnippets: extractCodeSnippets(repoPath, chatFiles[0], ['stream', 'typewriter', 'chunk', 'animate']),
      confidence: 0.92,
      councilMapping: 'Already implemented in LLMResponseCard',
      integrationSteps: [
        'Pattern fully integrated',
        'See src/features/council/components/LLMResponseCard.tsx',
        'Includes streaming, typewriter effect, and markdown',
      ],
      preserveAlgorithms: [
        'Response formatting',
        'Feedback collection',
        'Export functionality',
      ],
    });
  }

  // Code block pattern
  const codeFiles = files.filter(f => f.includes('code') || f.includes('markdown'));
  if (codeFiles.length > 0) {
    patterns.push({
      type: 'ui',
      name: 'Code Syntax Highlighting with Copy',
      description: 'Syntax-highlighted code blocks with copy button',
      files: codeFiles,
      codeSnippets: extractCodeSnippets(repoPath, codeFiles[0], ['highlight', 'copy', 'syntax', 'code']),
      confidence: 0.88,
      councilMapping: 'Already implemented in LLMResponseCard',
      integrationSteps: [
        'Pattern fully integrated',
        'Uses react-syntax-highlighter with OneDark theme',
        'Hover-activated copy buttons per code block',
      ],
      preserveAlgorithms: [
        'Markdown rendering (react-markdown)',
        'GFM support',
        'Code block detection',
      ],
    });
  }

  return patterns;
}

/**
 * Generate Council-specific adaptations
 */
function generateCouncilAdaptations(patterns: MOEPatterns): CouncilAdaptation[] {
  const adaptations: CouncilAdaptation[] = [];

  // Communication patterns
  for (const pattern of patterns.communicationPatterns) {
    if (pattern.name.includes('ConversableAgent')) {
      adaptations.push({
        pattern: pattern.name,
        status: 'implemented',
        priority: 'high',
        description: 'Expert message passing already integrated',
        codeExample: `interface ExpertMessage {
  sender: string;
  recipient?: string;
  content: string;
  type: 'response' | 'question' | 'critique';
}`,
        integrationGuide: [
          'Use ExpertMessage for expert communication',
          'Enable via enableMessaging flag in ExecutionContext',
          'Messages available in ExecutionResult.messages',
        ],
      });
    }
    if (pattern.name.includes('GroupChat')) {
      adaptations.push({
        pattern: pattern.name,
        status: 'recommended',
        priority: 'medium',
        description: 'Enhance speaker selection in sequential mode',
        codeExample: `function selectNextSpeaker(experts: Expert[], context: ConversationContext): Expert {
  // Round-robin or intelligent selection
  return experts[context.round % experts.length];
}`,
        integrationGuide: [
          'Add to council.service.ts executeCouncilExperts()',
          'Implement for sequential execution mode',
          'Consider expertise-based selection',
        ],
      });
    }
  }

  // Role patterns
  for (const pattern of patterns.rolePatterns) {
    if (pattern.name.includes('Role-Based')) {
      adaptations.push({
        pattern: pattern.name,
        status: 'recommended',
        priority: 'high',
        description: 'Enhance Expert with CrewAI-style role fields',
        codeExample: `interface Expert {
  // Existing
  role: string;
  basePersona: string;
  
  // Add from CrewAI
  specialty?: string;    // Detailed specialization
  backstory?: string;    // Context and personality
  delegation?: boolean;  // Can delegate tasks
}`,
        integrationGuide: [
          'Update Expert interface in types.ts',
          'Add fields to persona library',
          'Use in prompt generation',
        ],
      });
    }
  }

  // Workflow patterns
  for (const pattern of patterns.workflowPatterns) {
    if (pattern.name.includes('StateGraph')) {
      adaptations.push({
        pattern: pattern.name,
        status: 'future',
        priority: 'medium',
        description: 'Add state machine to synthesis engine',
        codeExample: `interface SynthesisState {
  stage: 'analyze' | 'review' | 'synthesize' | 'final';
  transitions: Record<string, string[]>;
  data: Record<string, unknown>;
  checkpoint: () => void;
}`,
        integrationGuide: [
          'Add to synthesis-engine.ts',
          'Implement conditional transitions',
          'Add checkpointing capability',
        ],
      });
    }
  }

  // UI patterns
  for (const pattern of patterns.uiPatterns) {
    if (pattern.name.includes('Streaming')) {
      adaptations.push({
        pattern: pattern.name,
        status: 'implemented',
        priority: 'high',
        description: 'Streaming UI with typewriter effect',
        codeExample: `<LLMResponseCard
  response={response}
  streaming={true}
  streamingSpeed={3}
/>`,
        integrationGuide: [
          'Already integrated in LLMResponseCard',
          'Enable with streaming prop',
          'Adjust speed with streamingSpeed prop',
        ],
      });
    }
  }

  return adaptations;
}

/**
 * Generate integration roadmap
 */
function generateIntegrationRoadmap(adaptations: CouncilAdaptation[]): {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
} {
  return {
    immediate: adaptations
      .filter(a => a.status === 'implemented')
      .map(a => `✅ ${a.pattern} - ${a.description}`),
    shortTerm: adaptations
      .filter(a => a.status === 'recommended' && a.priority === 'high')
      .map(a => `🔨 ${a.pattern} - ${a.description}`),
    longTerm: adaptations
      .filter(a => a.status === 'future' || a.priority === 'low')
      .map(a => `🔮 ${a.pattern} - ${a.description}`),
  };
}

/**
 * Main analysis function
 */
export async function analyzeMOEPatterns(config: {
  repoPath: string;
  targetDeveloper?: string;
  focusOnMOE?: boolean;
}): Promise<MOEAnalysisReport> {
  const { repoPath, targetDeveloper, focusOnMOE = true } = config;

  // Detect repository type
  const repoType = detectRepositoryType(repoPath);

  // Find relevant files
  const files = findMOEFiles(repoPath, repoType);

  // Extract patterns based on repository type
  let patterns: MOEPatterns = {
    communicationPatterns: [],
    rolePatterns: [],
    workflowPatterns: [],
    uiPatterns: [],
  };

  if (focusOnMOE) {
    switch (repoType) {
      case 'autogen':
        patterns.communicationPatterns = analyzeAutoGenPatterns(repoPath, files);
        break;
      case 'crewai':
        patterns.rolePatterns = analyzeCrewAIPatterns(repoPath, files);
        break;
      case 'langgraph':
        patterns.workflowPatterns = analyzeLangGraphPatterns(repoPath, files);
        break;
      case 'open-webui':
        patterns.uiPatterns = analyzeOpenWebUIPatterns(repoPath, files);
        break;
      default:
        // Try all patterns for unknown repos
        patterns.communicationPatterns = analyzeAutoGenPatterns(repoPath, files);
        patterns.rolePatterns = analyzeCrewAIPatterns(repoPath, files);
        patterns.workflowPatterns = analyzeLangGraphPatterns(repoPath, files);
        patterns.uiPatterns = analyzeOpenWebUIPatterns(repoPath, files);
    }
  }

  // Generate Council adaptations
  const councilAdaptations = generateCouncilAdaptations(patterns);

  // Generate integration roadmap
  const integrationRoadmap = generateIntegrationRoadmap(councilAdaptations);

  // Preservation recommendations
  const preserveRecommendations = [
    'Expert 3D scoring system (accuracy, completeness, conciseness)',
    'Persona library (Blue Ocean Strategist, Ruthless Validator, etc.)',
    'Multi-tier synthesis (quick, balanced, deep)',
    'Judge modes (ruthless, consensus, debate, pipeline)',
    'Knowledge base integration',
    'Expert weights calculation',
    'Synthesis caching',
    'Error handling and retry logic',
  ];

  const report: MOEAnalysisReport = {
    repository: path.basename(repoPath),
    repositoryType: repoType,
    targetDeveloper,
    moePatterns: patterns,
    councilAdaptations,
    preserveRecommendations,
    integrationRoadmap,
    timestamp: new Date(),
  };

  // Save report
  const outputPath = path.join(process.cwd(), 'data', 'moe-patterns.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  // Generate markdown report
  generateMOEReport(report);

  return report;
}

/**
 * Generate human-readable MOE report
 */
function generateMOEReport(report: MOEAnalysisReport): void {
  let markdown = `# 🎯 MOE Pattern Analysis Report\n\n`;
  markdown += `**Repository:** ${report.repository}\n`;
  markdown += `**Type:** ${report.repositoryType}\n`;
  markdown += `**Analyzed:** ${new Date().toISOString()}\n\n`;

  // Communication patterns
  if (report.moePatterns.communicationPatterns.length > 0) {
    markdown += `## 💬 Communication Patterns\n\n`;
    for (const pattern of report.moePatterns.communicationPatterns) {
      markdown += `### ${pattern.name}\n\n`;
      markdown += `**Confidence:** ${(pattern.confidence * 100).toFixed(0)}%\n\n`;
      markdown += `${pattern.description}\n\n`;
      markdown += `**Files:**\n`;
      for (const file of pattern.files.slice(0, 5)) {
        markdown += `- ${file}\n`;
      }
      markdown += `\n**Council Mapping:** ${pattern.councilMapping}\n\n`;
      markdown += `**Integration Steps:**\n`;
      for (const step of pattern.integrationSteps) {
        markdown += `- ${step}\n`;
      }
      markdown += `\n`;
    }
  }

  // Role patterns
  if (report.moePatterns.rolePatterns.length > 0) {
    markdown += `## 👥 Role-Based Patterns\n\n`;
    for (const pattern of report.moePatterns.rolePatterns) {
      markdown += `### ${pattern.name}\n\n`;
      markdown += `**Confidence:** ${(pattern.confidence * 100).toFixed(0)}%\n\n`;
      markdown += `${pattern.description}\n\n`;
      markdown += `**Council Mapping:** ${pattern.councilMapping}\n\n`;
    }
  }

  // Workflow patterns
  if (report.moePatterns.workflowPatterns.length > 0) {
    markdown += `## 🔄 Workflow Patterns\n\n`;
    for (const pattern of report.moePatterns.workflowPatterns) {
      markdown += `### ${pattern.name}\n\n`;
      markdown += `**Confidence:** ${(pattern.confidence * 100).toFixed(0)}%\n\n`;
      markdown += `${pattern.description}\n\n`;
      markdown += `**Council Mapping:** ${pattern.councilMapping}\n\n`;
    }
  }

  // UI patterns
  if (report.moePatterns.uiPatterns.length > 0) {
    markdown += `## 🎨 UI Patterns\n\n`;
    for (const pattern of report.moePatterns.uiPatterns) {
      markdown += `### ${pattern.name}\n\n`;
      markdown += `**Confidence:** ${(pattern.confidence * 100).toFixed(0)}%\n\n`;
      markdown += `${pattern.description}\n\n`;
      markdown += `**Council Mapping:** ${pattern.councilMapping}\n\n`;
    }
  }

  // Council adaptations
  markdown += `## 🔧 Council Adaptations\n\n`;
  for (const adaptation of report.councilAdaptations) {
    const statusEmoji = adaptation.status === 'implemented' ? '✅' : 
                       adaptation.status === 'recommended' ? '🔨' : '🔮';
    markdown += `### ${statusEmoji} ${adaptation.pattern}\n\n`;
    markdown += `**Status:** ${adaptation.status} | **Priority:** ${adaptation.priority}\n\n`;
    markdown += `${adaptation.description}\n\n`;
    if (adaptation.codeExample) {
      markdown += `**Code Example:**\n\`\`\`typescript\n${adaptation.codeExample}\n\`\`\`\n\n`;
    }
    markdown += `**Integration Guide:**\n`;
    for (const step of adaptation.integrationGuide) {
      markdown += `- ${step}\n`;
    }
    markdown += `\n`;
  }

  // Preservation recommendations
  markdown += `## 🛡️ Preserve These Council Algorithms\n\n`;
  for (const rec of report.preserveRecommendations) {
    markdown += `- ${rec}\n`;
  }

  // Integration roadmap
  markdown += `\n## 🗺️ Integration Roadmap\n\n`;
  markdown += `### ✅ Immediate (Already Done)\n\n`;
  for (const item of report.integrationRoadmap.immediate) {
    markdown += `- ${item}\n`;
  }
  markdown += `\n### 🔨 Short-term (Recommended)\n\n`;
  for (const item of report.integrationRoadmap.shortTerm) {
    markdown += `- ${item}\n`;
  }
  markdown += `\n### 🔮 Long-term (Future Enhancement)\n\n`;
  for (const item of report.integrationRoadmap.longTerm) {
    markdown += `- ${item}\n`;
  }

  const reportPath = path.join(process.cwd(), 'data', 'reports', 'council-adaptations.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdown);

      }

/**
 * CLI interface
 */
export async function runMOEAnalysis(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Twin Mimicry V2 - MOE Pattern Extraction

Usage:
  npx tsx src/lib/twin-mimicry-v2.ts <repo-path> [options]

Options:
  --dev <name>    Specify developer to analyze
  --help, -h      Show this help

Examples:
  npx tsx src/lib/twin-mimicry-v2.ts /path/to/autogen
  npx tsx src/lib/twin-mimicry-v2.ts /path/to/crewai --dev "creator"

Target Repositories:
  - microsoft/autogen      (Multi-agent communication)
  - joaomdmoura/crewAI     (Role-based architecture)
  - langchain-ai/langgraph (State machine workflows)
  - open-webui/open-webui  (Chat UI components)
    `);
    return;
  }

  const repoPath = args[0] || '.';
  const devIndex = args.indexOf('--dev');

  const config = {
    repoPath,
    targetDeveloper: devIndex !== -1 ? args[devIndex + 1] : undefined,
    focusOnMOE: true,
  };

    await analyzeMOEPatterns(config);
}

// Run if called directly
if (require.main === module) {
  runMOEAnalysis().catch(console.error);
}
