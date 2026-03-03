// Shared Generic Type Definitions

export interface ModelInfo {
  id: string;
  name: string;
  specialty: string;
  costPer1k: number;
  contextWindow: number;
  recommended: string;
}

export interface VaultStatus {
  hasVault: boolean;
  isLocked: boolean;
  lastUnlock?: Date;
}

export interface FileUploadResult {
  success: boolean;
  content?: string;
  error?: string;
  name?: string;
  size?: string;
  type?: string;
}

export interface ModeBehavior {
  modeName: string;
  description: string;
  isEnabled: boolean;
  separated?: string;
  synthesis?: string;
  debate?: string;
  pipeline?: string;
  // Added additional properties to align with ai-client.ts usage
}

export type SynthesisTier = 'quick' | 'balanced' | 'deep';
export interface SynthesisConfig {
  tier: SynthesisTier;
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  customInstructions?: string;
  structuredOutput?: boolean;
  useWeighting?: boolean;
  useCache?: boolean;
  useStreaming?: boolean;
  options?: Record<string, unknown>;
}

// Structured synthesis output schemas
import { z } from 'zod';

export const ConflictSchema = z.object({
  topic: z.string().describe('The topic where experts disagree'),
  positions: z.array(z.string()).describe('Different expert positions on this topic'),
  severity: z.enum(['minor', 'moderate', 'critical']).describe('How critical the disagreement is'),
});

export const InsightSchema = z.object({
  category: z.string().describe('Category of insight (e.g., "opportunity", "risk", "pattern")'),
  content: z.string().describe('The insight itself'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level based on expert consensus'),
  supportingExperts: z.array(z.string()).optional().describe('Which experts support this insight'),
});

export const ExpertWeightInfoSchema = z.object({
  expertName: z.string(),
  weight: z.number().describe('Overall weight score (0-1)'),
  normalizedWeight: z.number().describe('Weight as percentage of total'),
  factors: z.object({
    modelQuality: z.number(),
    outputQuality: z.number(),
    confidence: z.number(),
    domainMatch: z.number(),
  }).optional(),
});

export const SynthesisOutputSchema = z.object({
  consensus: z.string().describe('Main synthesized conclusion from all expert inputs'),
  keyInsights: z.array(InsightSchema).describe('Structured insights extracted from the synthesis'),
  conflicts: z.array(ConflictSchema).optional().describe('Areas where experts disagree'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Overall confidence in the synthesis'),
  reasoning: z.string().optional().describe('Explanation of how the synthesis was constructed'),
  actionItems: z.array(z.string()).optional().describe('Concrete next steps or recommendations'),
  expertWeights: z.array(ExpertWeightInfoSchema).optional().describe('Weight analysis for each expert'),
});

export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type Conflict = z.infer<typeof ConflictSchema>;
export type ExpertWeightInfo = z.infer<typeof ExpertWeightInfoSchema>;

// GitHub API Types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

export interface GitHubRawRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubRateLimitData {
  rate: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

// API Filter Types
export interface RedditSearchFilters {
  subreddit?: string;
  query?: string;
  sort?: 'hot' | 'new' | 'top' | 'rising';
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
  after?: string;
}

export interface HackerNewsSearchFilters {
  query?: string;
  tags?: string[];
  numericFilters?: string[];
  page?: number;
  hitsPerPage?: number;
}

// Scout-specific Types (reuse GitHubIssue for better type coverage)
// Note: ScoutIssue is an alias to GitHubIssue for backward compatibility
export type ScoutIssue = GitHubIssue;

// ============================================================================
// Intelligence Feature Configuration Types
// ============================================================================

/**
 * Niche configuration for intelligence features
 * Used by all intelligence modules (mining-drill, reddit-sniper, etc.)
 */
export interface NicheConfig {
  id: string;
  name: string;
  keywords?: string[];
  github_topics?: string[];
  github_search_queries?: string[];
  enabled?: boolean;
  monitoring?: {
    keywords?: string[];
    github_topics?: string[];
    github_search_queries?: string[];
    subreddits?: string[];
  };
}

/**
 * YAML configuration file structure
 */
export interface YamlConfig {
  niches: NicheConfig[];
}
