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
  fileData: FileData[];
  setFileData: (fileData: FileData[]) => void;
  addFileData: (file: FileData) => void;
  removeFileData: (index: number) => void;
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
  if (selector) {
    return useCouncilStore((state) => selector({
      task: state.task,
      setTask: state.setTask,
      mode: state.mode,
      setMode: state.setMode,
      activeExpertCount: state.activeExpertCount,
      setActiveExpertCount: state.setActiveExpertCount,
      debateRounds: state.debateRounds,
      setDebateRounds: state.setDebateRounds,
      fileData: state.fileData,
      setFileData: state.setFileData,
      addFileData: state.addFileData,
      removeFileData: state.removeFileData,
      loadPersona: state.loadPersona,
      loadTeam: state.loadTeam,
      clearPersona: state.clearPersona,
      resetToDefault: state.resetToDefault,
    }));
  }
  
  return useCouncilStore((state) => ({
    task: state.task,
    setTask: state.setTask,
    mode: state.mode,
    setMode: state.setMode,
    activeExpertCount: state.activeExpertCount,
    setActiveExpertCount: state.setActiveExpertCount,
    debateRounds: state.debateRounds,
    setDebateRounds: state.setDebateRounds,
    fileData: state.fileData,
    setFileData: state.setFileData,
    addFileData: state.addFileData,
    removeFileData: state.removeFileData,
    loadPersona: state.loadPersona,
    loadTeam: state.loadTeam,
    clearPersona: state.clearPersona,
    resetToDefault: state.resetToDefault,
  }));
};
