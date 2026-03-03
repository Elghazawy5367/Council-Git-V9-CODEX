import { create } from 'zustand';
import { toast } from 'sonner';
import { SynthesisResult, SynthesisConfig } from '@/features/council/lib/types';
import { callExpertStreaming } from '@/features/council/api/ai-client';
// import { SYNTHESIS_TIERS } from '@/lib/synthesis-engine'; // Unused import commented out
import { saveSession } from '@/features/council/lib/session-history';
import { UseMutationResult } from '@tanstack/react-query';

// Async imports to break circular dependencies
const getControlPanelStore = () => import('./control-panel-store').then(mod => mod.useControlPanelStore);
const getExpertStore = () => import('./expert-store').then(mod => mod.useExpertStore);
const getSettingsStore = () => import('@/features/settings/store/settings-store').then(mod => mod.useSettingsStore);
const getDashboardStore = () => import('@/features/dashboard/store/dashboard-store').then(mod => mod.useDashboardStore);

export interface ExpertOutput {
  name: string;
  model: string;
  content: string;
}

interface CostBreakdown {
  experts: number;
  synthesis: number;
  total: number;
}

interface ExecutionState {
  isLoading: boolean;
  isSynthesizing: boolean;
  statusMessage: string;
  cost: CostBreakdown;
  outputs: Record<string, string>;
  synthesisResult: SynthesisResult | null;
  verdict: string;
  status: string;
  executeCouncil: (synthesisMutation: UseMutationResult<SynthesisResult, Error, { expertOutputs: ExpertOutput[]; task: string; config: SynthesisConfig; apiKey: string; onProgress: (message: string) => void; }, unknown>) => Promise<void>;
  reset: () => void;
}

import { useCouncilStore } from '@/stores/council.store';

export const useExecutionStore = (selector?: (state: ExecutionState) => any) => {
  const store = useCouncilStore();

  const mappedState: ExecutionState = {
    isLoading: store.isLoading,
    isSynthesizing: store.isSynthesizing,
    statusMessage: store.statusMessage,
    cost: store.cost,
    outputs: store.outputs,
    synthesisResult: store.synthesisResult,
    verdict: store.verdict,
    status: store.status,
    executeCouncil: (synthesisMutation: any) => (useCouncilStore as any).executeCouncil(synthesisMutation),
    reset: () => (useCouncilStore as any).reset(),
  };

  if (selector) {
    return selector(mappedState);
  }

  return mappedState;
};