/**
 * Unified Council Store (Refactored)
 * Composes modular slices for better organization and maintainability
 *
 * Architecture:
 * - UI Slice: Loading states, status messages, execution phases
 * - Experts Slice: Expert management, knowledge, persona/team loading
 * - Control Slice: Task configuration, modes, settings
 * - Execution Slice: Execution logic, outputs, synthesis results
 *
 * Benefits:
 * - Modularity: Each slice is independent and focused
 * - Maintainability: Easy to find and update specific concerns
 * - Testability: Slices can be tested independently
 * - Performance: Better selector optimization
 */

import { create } from 'zustand';
import {
  CouncilUISlice,
  createCouncilUISlice,
  CouncilExpertsSlice,
  createCouncilExpertsSlice,
  CouncilControlSlice,
  createCouncilControlSlice,
  CouncilExecutionSlice,
  createCouncilExecutionSlice,
} from './slices';

// Combined store type
type CouncilStore = CouncilUISlice & CouncilExpertsSlice & CouncilControlSlice & CouncilExecutionSlice;

// Create the composed store
export const useCouncilStore = create<CouncilStore>()((...a) => ({
  ...createCouncilUISlice(...a),
  ...createCouncilExpertsSlice(...a),
  ...createCouncilControlSlice(...a),
  ...createCouncilExecutionSlice(...a),
}));

// Enhanced wrapper methods that connect slices
const wrapExecutePhase1 = () => {
  const store = useCouncilStore.getState();
  return store.executePhase1(
    useCouncilStore.getState,
    store.updateExpert,
    store.setExecutionPhase,
    store.setIsLoading,
    store.setStatusMessage,
    store.setCost,
    store.setOutputs
  );
};

const wrapExecutePhase2 = (synthesisMutation: unknown) => {
  const store = useCouncilStore.getState();
  return store.executePhase2(
    synthesisMutation as any,
    useCouncilStore.getState,
    store.setExecutionPhase,
    store.setStatusMessage,
    store.setIsSynthesizing,
    store.setCost
  );
};

const wrapExecuteCouncil = (synthesisMutation: unknown) => {
  const store = useCouncilStore.getState();
  return store.executeCouncil(
    synthesisMutation as any,
    useCouncilStore.getState,
    store.updateExpert,
    store.setIsLoading,
    store.setIsSynthesizing,
    store.setStatusMessage,
    store.setCost,
    store.setOutputs
  );
};

const wrapReset = () => {
  const store = useCouncilStore.getState();
  return store.reset(store.resetUI);
};

const wrapLoadTeam = (teamId: string) => {
  const store = useCouncilStore.getState();
  return store.loadTeam(teamId, store.setMode, store.setActiveExpertCount);
};

const wrapResetToDefault = () => {
  const store = useCouncilStore.getState();
  return store.resetToDefault(store.setActiveExpertCount, store.setMode);
};

// Extend the store with wrapped methods
Object.assign(useCouncilStore, {
  // Override execution methods to use wrapped versions
  executePhase1: wrapExecutePhase1,
  executePhase2: wrapExecutePhase2,
  executeCouncil: wrapExecuteCouncil,
  reset: wrapReset,
  loadTeam: wrapLoadTeam,
  resetToDefault: wrapResetToDefault,
  // Direct state access for legacy stores
  getState: useCouncilStore.getState,
});

/**
 * Backward compatibility: Export selectors that match old store patterns
 */
export const useCouncilExperts = () => useCouncilStore((state) => state.experts);

export const useCouncilExecution = () => useCouncilStore((state) => ({
  executionPhase: state.executionPhase,
  isLoading: state.isLoading,
  isSynthesizing: state.isSynthesizing,
  statusMessage: state.statusMessage,
  cost: state.cost,
  outputs: state.outputs,
  synthesisResult: state.synthesisResult,
  verdict: state.verdict,
  executePhase1: wrapExecutePhase1,
  executePhase2: wrapExecutePhase2,
  executeCouncil: wrapExecuteCouncil,
  reset: wrapReset,
}));

export const useCouncilControl = () => useCouncilStore((state) => ({
  task: state.task,
  setTask: state.setTask,
  mode: state.mode,
  setMode: state.setMode,
  judgeMode: state.judgeMode,
  setJudgeMode: state.setJudgeMode,
  activeExpertCount: state.activeExpertCount,
  setActiveExpertCount: state.setActiveExpertCount,
  debateRounds: state.debateRounds,
  setDebateRounds: state.setDebateRounds,
  fileData: state.fileData,
  setFileData: state.setFileData,
  loadPersona: state.loadPersona,
  loadTeam: wrapLoadTeam,
  clearPersona: state.clearPersona,
  resetToDefault: wrapResetToDefault,
}));
