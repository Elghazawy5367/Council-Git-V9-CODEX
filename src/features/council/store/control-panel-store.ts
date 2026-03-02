/**
 * @deprecated This store is deprecated. Please use the unified council store from @/stores/council.store
 * This file now provides backward compatibility by proxying to the new store.
 */

import { ExecutionMode } from '@/features/council/lib/types';
import { useCouncilStore } from '@/stores/council.store';

interface FileData {
  name: string;
  content: string;
  size: string;
}

interface ControlPanelState {
  task: string;
  setTask: (task: string) => void;
  mode: ExecutionMode;
  setMode: (mode: ExecutionMode) => void;
  activeExpertCount: number;
  setActiveExpertCount: (count: number) => void;
  debateRounds: number;
  setDebateRounds: (rounds: number) => void;
  fileData: FileData | null;
  setFileData: (fileData: FileData | null) => void;
  loadPersona: (expertIndex: number, personaId: string) => void;
  loadTeam: (teamId: string) => void;
  clearPersona: (expertIndex: number) => void;
  resetToDefault: () => void;
}

// Log deprecation warning once
if (typeof window !== 'undefined' && !window.__control_panel_store_warned) {
  console.warn(
    '[DEPRECATED] useControlPanelStore from @/features/council/store/control-panel-store is deprecated.\n' +
    'Please migrate to @/stores/council.store (useCouncilStore).\n' +
    'This compatibility layer will be removed in a future version.'
  );
  window.__control_panel_store_warned = true;
}

declare global {
  interface Window {
    __control_panel_store_warned?: boolean;
  }
}

/**
 * Backward compatibility wrapper for useControlPanelStore
 * Proxies to the unified council store
 */
export const useControlPanelStore = (selector?: (state: ControlPanelState) => any) => {
  const store = useCouncilStore();

  const mappedState: ControlPanelState = {
    task: store.task,
    setTask: store.setTask,
    mode: store.mode,
    setMode: store.setMode,
    activeExpertCount: store.activeExpertCount,
    setActiveExpertCount: store.setActiveExpertCount,
    debateRounds: store.debateRounds,
    setDebateRounds: store.setDebateRounds,
    fileData: store.fileData,
    setFileData: store.setFileData,
    loadPersona: store.loadPersona,
    loadTeam: (teamId: string) => (useCouncilStore as any).loadTeam(teamId),
    clearPersona: store.clearPersona,
    resetToDefault: () => (useCouncilStore as any).resetToDefault(),
  };

  if (selector) {
    return selector(mappedState);
  }
  
  return mappedState;
};
