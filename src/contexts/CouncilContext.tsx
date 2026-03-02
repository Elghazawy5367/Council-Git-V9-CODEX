/**
 * Council Context for State Management
 * 
 * REQUIREMENTS:
 * 1. Manage two-phase workflow state
 * 2. Track input (text + files)
 * 3. Track LLM selection and responses
 * 4. Track execution progress
 * 5. Track judge state
 * 6. Provide actions for all operations
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import OpenRouterService, { LLMResponse, ExecutionProgress, AVAILABLE_LLMS } from '@/services/openrouter';

// Input State
interface InputState {
  text: string;
  files: File[];
  source: 'local' | 'drive' | 'url';
}

// Execution State
interface ExecutionState {
  phase: 'idle' | 'parallel' | 'judge';
  isRunning: boolean;
  llmResponses: LLMResponse[];
  progress: Map<string, ExecutionProgress>;
}

// Judge State
interface JudgeState {
  mode: 'ruthless-judge' | 'consensus-judge' | 'debate-judge' | 'pipeline-judge';
  isRunning: boolean;
  result: string | null;
  error: string | null;
}

// LLM Selection State
interface LLMSelectionState {
  selectedLLMs: string[];
  availableLLMs: typeof AVAILABLE_LLMS;
}

// Council Context Value
interface CouncilContextValue {
  // State
  input: InputState;
  execution: ExecutionState;
  judge: JudgeState;
  llmSelection: LLMSelectionState;
  apiKey: string | null;

  // Input Actions
  setInputText: (text: string) => void;
  setInputFiles: (files: File[]) => void;
  setInputSource: (source: 'local' | 'drive' | 'url') => void;
  clearInput: () => void;

  // LLM Selection Actions
  toggleLLM: (llmId: string) => void;
  selectAllLLMs: () => void;
  deselectAllLLMs: () => void;

  // Execution Actions
  executeParallel: () => Promise<void>;
  cancelExecution: () => void;
  clearResponses: () => void;

  // Judge Actions
  setJudgeMode: (mode: JudgeState['mode']) => void;
  executeJudge: () => Promise<void>;
  clearJudgeResult: () => void;

  // API Key Actions
  setApiKey: (key: string) => void;
}

// Create Context
const CouncilContext = createContext<CouncilContextValue | undefined>(undefined);

// Provider Props
interface CouncilProviderProps {
  children: ReactNode;
}

// Provider Component
export function CouncilProvider({ children }: CouncilProviderProps): JSX.Element {
  // Input State
  const [input, setInput] = useState<InputState>({
    text: '',
    files: [],
    source: 'local',
  });

  // Execution State
  const [execution, setExecution] = useState<ExecutionState>({
    phase: 'idle',
    isRunning: false,
    llmResponses: [],
    progress: new Map(),
  });

  // Judge State
  const [judge, setJudge] = useState<JudgeState>({
    mode: 'ruthless-judge',
    isRunning: false,
    result: null,
    error: null,
  });

  // LLM Selection State
  const [llmSelection, setLLMSelection] = useState<LLMSelectionState>({
    selectedLLMs: AVAILABLE_LLMS.map((llm) => llm.id),
    availableLLMs: AVAILABLE_LLMS,
  });

  // API Key State
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Input Actions
  const setInputText = (text: string): void => {
    setInput((prev) => ({ ...prev, text }));
  };

  const setInputFiles = (files: File[]): void => {
    setInput((prev) => ({ ...prev, files }));
  };

  const setInputSource = (source: 'local' | 'drive' | 'url'): void => {
    setInput((prev) => ({ ...prev, source }));
  };

  const clearInput = (): void => {
    setInput({
      text: '',
      files: [],
      source: 'local',
    });
  };

  // LLM Selection Actions
  const toggleLLM = (llmId: string): void => {
    setLLMSelection((prev) => {
      const selected = new Set(prev.selectedLLMs);
      if (selected.has(llmId)) {
        selected.delete(llmId);
      } else {
        selected.add(llmId);
      }
      return { ...prev, selectedLLMs: Array.from(selected) };
    });
  };

  const selectAllLLMs = (): void => {
    setLLMSelection((prev) => ({
      ...prev,
      selectedLLMs: prev.availableLLMs.map((llm) => llm.id),
    }));
  };

  const deselectAllLLMs = (): void => {
    setLLMSelection((prev) => ({
      ...prev,
      selectedLLMs: [],
    }));
  };

  // Execution Actions
  const executeParallel = async (): Promise<void> => {
    if (!apiKey) {
      throw new Error('API key not set');
    }

    if (!input.text.trim() && input.files.length === 0) {
      throw new Error('No input provided');
    }

    if (llmSelection.selectedLLMs.length === 0) {
      throw new Error('No LLMs selected');
    }


    setExecution((prev) => ({
      ...prev,
      phase: 'parallel',
      isRunning: true,
      llmResponses: [],
      progress: new Map(),
    }));

    try {
      const service = new OpenRouterService(apiKey);
      
      const responses = await service.executeParallel(
        input.text,
        input.files,
        llmSelection.selectedLLMs,
        (progress) => {
          setExecution((prev) => {
            const newProgress = new Map(prev.progress);
            newProgress.set(progress.llmId, progress);
            return { ...prev, progress: newProgress };
          });
        }
      );


      setExecution((prev) => ({
        ...prev,
        phase: 'idle',
        isRunning: false,
        llmResponses: responses,
      }));
    } catch (error) {
      console.error('[Council] Execution error:', error);
      setExecution((prev) => ({
        ...prev,
        phase: 'idle',
        isRunning: false,
      }));
      throw error;
    }
  };

  const cancelExecution = (): void => {
    setExecution((prev) => ({
      ...prev,
      phase: 'idle',
      isRunning: false,
    }));
  };

  const clearResponses = (): void => {
    setExecution((prev) => ({
      ...prev,
      llmResponses: [],
      progress: new Map(),
    }));
  };

  // Judge Actions
  const setJudgeMode = (mode: JudgeState['mode']): void => {
    setJudge((prev) => ({ ...prev, mode }));
  };

  const executeJudge = async (): Promise<void> => {
    if (!apiKey) {
      throw new Error('API key not set');
    }

    if (execution.llmResponses.length === 0) {
      throw new Error('No LLM responses to synthesize');
    }

    const successfulResponses = execution.llmResponses.filter((r) => r.status === 'success');
    

    setJudge((prev) => ({
      ...prev,
      isRunning: true,
      result: null,
      error: null,
    }));

    setExecution((prev) => ({
      ...prev,
      phase: 'judge',
    }));

    try {
      const service = new OpenRouterService(apiKey);
      
      // Combine all LLM responses
      const combinedResponses = execution.llmResponses
        .filter((r) => r.status === 'success')
        .map((r) => `[${r.llmName}]: ${r.response}`)
        .join('\n\n---\n\n');

      // Create judge prompt based on mode
      const judgePrompts: Record<JudgeState['mode'], string> = {
        'ruthless-judge': `You are a ruthless judge. Analyze the following expert responses and provide a critical synthesis, filtering out weak arguments and highlighting only high-confidence insights.\n\n${combinedResponses}`,
        'consensus-judge': `You are a consensus-building judge. Find common ground among the following expert responses and build a unified perspective.\n\n${combinedResponses}`,
        'debate-judge': `You are a debate judge. Highlight the conflicts and disagreements in the following expert responses, weighing opposing arguments.\n\n${combinedResponses}`,
        'pipeline-judge': `You are a pipeline judge. Synthesize the following expert responses sequentially, building upon each insight.\n\n${combinedResponses}`,
      };

      const judgePrompt = judgePrompts[judge.mode];

      // Execute judge synthesis (using first available LLM)
      const responses = await service.executeParallel(
        judgePrompt,
        [],
        [llmSelection.selectedLLMs[0] || 'gpt4'],
        undefined
      );

      const judgeResponse = responses[0];

      if (judgeResponse.status === 'success') {
        setJudge((prev) => ({
          ...prev,
          isRunning: false,
          result: judgeResponse.response,
        }));
      } else {
        throw new Error(judgeResponse.error || 'Judge synthesis failed');
      }

      setExecution((prev) => ({
        ...prev,
        phase: 'idle',
      }));
    } catch (error) {
      console.error('[Council] Judge synthesis error:', error);
      setJudge((prev) => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));

      setExecution((prev) => ({
        ...prev,
        phase: 'idle',
      }));

      throw error;
    }
  };

  const clearJudgeResult = (): void => {
    setJudge((prev) => ({
      ...prev,
      result: null,
      error: null,
    }));
  };

  // Context Value
  const value: CouncilContextValue = {
    // State
    input,
    execution,
    judge,
    llmSelection,
    apiKey,

    // Input Actions
    setInputText,
    setInputFiles,
    setInputSource,
    clearInput,

    // LLM Selection Actions
    toggleLLM,
    selectAllLLMs,
    deselectAllLLMs,

    // Execution Actions
    executeParallel,
    cancelExecution,
    clearResponses,

    // Judge Actions
    setJudgeMode,
    executeJudge,
    clearJudgeResult,

    // API Key Actions
    setApiKey,
  };

  return <CouncilContext.Provider value={value}>{children}</CouncilContext.Provider>;
}

// Custom Hook
export function useCouncilContext(): CouncilContextValue {
  const context = useContext(CouncilContext);
  if (context === undefined) {
    throw new Error('useCouncilContext must be used within a CouncilProvider');
  }
  return context;
}

// Export types for external use
export type { InputState, ExecutionState, JudgeState, LLMSelectionState, CouncilContextValue };
