// Council Feature Type Definitions

/**
 * AutoGen-style Message for expert communication
 */
export interface ExpertMessage {
  id: string;
  sender: string; // Expert ID
  senderName: string;
  recipient?: string; // Expert ID (undefined = broadcast to all)
  content: string;
  timestamp: Date;
  type: 'response' | 'question' | 'critique' | 'clarification' | 'agreement';
  replyTo?: string; // Message ID this is replying to
  context?: Record<string, unknown>;
}

/**
 * Conversation context for an expert
 */
export interface ConversationContext {
  messages: ExpertMessage[];
  previousResponses: Record<string, string>; // expertId -> output
  conversationHistory: string; // Formatted history for prompt
  round: number;
}

export interface ExpertConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  content: string;
  size: string;
  type: string;
}

// Re-exporting canonical types for backward compatibility
import { ModeBehavior, SynthesisConfig, SynthesisTier } from '@/lib/types';
export type { ModeBehavior, SynthesisConfig, SynthesisTier };

export interface Expert {
  id: string;
  name: string;
  model: string;
  role: string;
  basePersona: string;
  knowledge: KnowledgeFile[]; // Ensure this is properly typed
  config: ExpertConfig;
  modeBehavior: ModeBehavior;
  color: string;
  icon: string;
  output?: string;
  isLoading?: boolean;
  personaId?: string;
  hasWebSearch?: boolean;
  positionName?: string;
  positionSpecialty?: string;
  pluginId?: string;
  pluginConfig?: Record<string, unknown>;
  content?: string; // Added to align with control-panel-store.ts
  
  // AutoGen-style messaging capabilities
  conversationContext?: ConversationContext;
  canSendMessages?: boolean; // Enable message passing for this expert
  messageHandler?: (message: ExpertMessage) => void; // Optional message handler
}

// Phase 1: Expert execution mode (all experts run in parallel)
export type ExecutionMode = 'parallel' | 'consensus' | 'adversarial' | 'sequential';

// Phase 2: Judge/synthesis modes for unifying expert outputs
export type JudgeMode = 'ruthless-judge' | 'consensus-judge' | 'debate-judge' | 'pipeline-judge';

export interface SynthesisResult {
  content: string;
  tier: SynthesisTier;
  model: string;
  tokens: { prompt: number; completion: number };
  cost: number;
}

export interface ExecutionState {
  isRunning: boolean;
  currentPhase: 'idle' | 'phase1-experts' | 'phase1-complete' | 'phase2-synthesis' | 'complete';
  progress: number;
  startTime?: Date;
  outputs: Record<string, string>;
  verdict: string;
  cost: number;
}

export interface DebateRound {
  round: number;
  expertId: string;
  statement: string;
  score?: number;
  rebuttal?: string;
}

export interface ExportData {
  experts: Expert[];
  outputs: Record<string, string>;
  task: string;
  mode: ExecutionMode;
  cost: number;
  timestamp: Date;
  verdict?: string;
  synthesisMetadata?: {
    tier: SynthesisTier;
    model: string;
    cost: number;
  };
}

export interface CouncilSession {
  id: string;
  timestamp: Date;
  task: string;
  mode: ExecutionMode;
  activeExpertCount: number;
  experts: {
    id: string;
    name: string;
    model: string;
  }[];
  outputs: Record<string, string>;
  verdict: string;
  synthesisConfig?: SynthesisConfig;
  cost: {
    experts: number;
    synthesis: number;
    total: number;
  };
}

// Added missing 'ExpertOutput' type definition
export interface ExpertOutput {
  name: string;
  model: string;
  content: string;
}
