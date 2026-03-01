/**
 * @deprecated This store is deprecated. Please use the unified council store from @/stores/council.store
 * This file now provides backward compatibility by proxying to the new store.
 */

import { Expert, KnowledgeFile } from '@/features/council/lib/types';
import { useCouncilStore } from '@/stores/council.store';

interface ExpertState {
  experts: Expert[];
  setExperts: (experts: Expert[]) => void;
  updateExpert: (index: number, expert: Partial<Expert>) => void;
  addKnowledge: (expertIndex: number, files: KnowledgeFile[]) => void;
  removeKnowledge: (expertIndex: number, fileId: string) => void;
}

// Log deprecation warning once
if (typeof window !== 'undefined' && !window.__expert_store_warned) {
  console.warn(
    '[DEPRECATED] useExpertStore from @/features/council/store/expert-store is deprecated.\n' +
    'Please migrate to @/stores/council.store (useCouncilStore).\n' +
    'This compatibility layer will be removed in a future version.'
  );
  window.__expert_store_warned = true;
}

declare global {
  interface Window {
    __expert_store_warned?: boolean;
  }
}

/**
 * Backward compatibility wrapper for useExpertStore
 * Proxies to the unified council store
 */
export const useExpertStore = (selector?: (state: ExpertState) => any) => {
  const store = useCouncilStore();

  const mappedState: ExpertState = {
    experts: store.experts,
    setExperts: store.setExperts,
    updateExpert: store.updateExpert,
    addKnowledge: store.addKnowledge,
    removeKnowledge: store.removeKnowledge,
  };

  if (selector) {
    return selector(mappedState);
  }
  
  return mappedState;
};